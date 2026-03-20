// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************
 * UploadSubmissionDialog Component
 *
 * A comprehensive dialog for managing student submission uploads in codePost.
 * Supports file validation, automated testing, late submissions, and partner collaboration.
 *
 * @author codePost Team
 * @version 2.0.0 - Refactored to functional component with hooks
 **********************************************************************************************************************/

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {
  CalculatorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ContainerOutlined,
  UploadOutlined,
} from '@ant-design/icons';

import {
  Alert,
  Button,
  Checkbox,
  Divider,
  message,
  Modal,
  Result,
  Select,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';

import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import { assignmentFilesApi, assignmentsApi, autograderApi, submissionsApi } from '../../../../../api-client/clients';
import { SubmissionTestResultType, TestEditorResultType } from '../../../../../types/autograder';
import { File as CodePostFile } from '../../../../../utils/file';
import { Course, TestCase } from '../../../../../api-client';
import { Assignment, AssignmentStudentType, UploadFile as SubmissionUploadFile } from '../../../../../types/common';
import {
  AssignmentFileType,
  StudentTestCaseType,
  StudentSubmissionType,
  SubmissionInfoType,
  SubmissionTestType,
  TestCategoryType,
} from '../../../../../types/models';

import CPTooltip from '../../../../core/CPTooltip';
import { tooltips } from '../../../../core/tooltips';
import { slack } from '../../../../core/slack';
import { StudentTestCasesByCategory } from '../../../../core/testFetchUtils';
import { encodeForLink } from '../../../../core/URLutils';
import { CodePostDate } from '../../../../utils/CodepostDate';
import { dueDatePassed } from '../../../../utils/DateUtils';
import { LOCAL_SETTINGS } from '../../../../utils/LocalSettings';
import TestsList from '@code-review/code-panel/TestsList';
import InvitePartnersLink from '../../../../student/InvitePartnersLink';
import LateSubmissionModal from '../../../../student/LateSubmissionModal';
import ViewUpload from '../../../../student/ViewUpload';
import { awaitTestResult } from '../../tests/autograderPollingUtils';
import { getLatestSubmissionTests } from '../../../../../utils/submissionTests';

import { fileToProtoFileUpload, IBaseFileUpload, IProtoFileUpload, readUploadedFile } from './FileReader';

import { UploadFile } from 'antd/lib/upload/interface';
import { CIP_COURSE_ID } from '../../../../../config';

/**********************************************************************************************************************/
/* Constants
/**********************************************************************************************************************/

const MODAL_WIDTH = 1100;
const MIN_TEST_HEIGHT = 400;

const TABLE_COLUMNS = [
  { title: 'Assignment files', dataIndex: 'name', key: 'file' },
  { title: 'Uploaded', dataIndex: 'uploaded', key: 'uploaded', align: 'center' as const },
];

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

enum STATUS {
  NONE,
  SAVING,
  COMPLETE,
}

interface IUploadSubmissionDialogProps {
  /** Controls visibility of the dialog */
  isVisible: boolean;
  /** Callback when dialog is cancelled/closed */
  onCancel: () => void;
  /** List of available assignments */
  assignments: (Assignment | AssignmentStudentType)[];
  /** Currently selected assignment */
  selectedAssignment?: Assignment | AssignmentStudentType;
  /** List of student emails */
  students: string[];
  /** Currently selected student emails */
  selectedStudents: string[];
  /** Map of student submissions indexed by user email and assignment ID */
  submissions: {
    [userEmail: string]: {
      [assignmentID: number]: SubmissionInfoType | StudentSubmissionType;
    };
  };
  /** Function to upload submission */
  uploadSubmission: (
    assignment: AssignmentStudentType | Assignment,
    partners: string[],
    files: SubmissionUploadFile[],
    sendConfirmationEmail?: boolean,
  ) => Promise<StudentSubmissionType | SubmissionInfoType>;
  /** Disable student selection dropdown */
  disableStudentSelect?: boolean;
  /** Callback when upload is successful */
  onSuccess?: (newSubmissionID: number) => void;
  /** Whether this is being used in student view */
  isStudent?: boolean;
  /** Current course information */
  course?: Course;
  /** Custom title for the dialog */
  title?: string;
  /** Info message to display at top of dialog */
  infoMessage?: React.ReactNode;
  /** Default files to pre-populate */
  defaultFiles?: IBaseFileUpload[];
}

/**********************************************************************************************************************/
/* Main Component
/**********************************************************************************************************************/

/**
 * UploadSubmissionDialog - A comprehensive dialog for uploading student submissions
 *
 * Features:
 * - File upload with directory support
 * - Template file validation
 * - Automated test execution
 * - Late submission handling
 * - Partner collaboration
 * - Test result viewing
 *
 * @component
 */
const UploadSubmissionDialog: React.FC<IUploadSubmissionDialogProps> = (props) => {
  const {
    isVisible,
    assignments,
    selectedAssignment: propsSelectedAssignment,
    selectedStudents: propsSelectedStudents,
    students,
    submissions,
    uploadSubmission,
    disableStudentSelect,
    onSuccess,
    onCancel,
    isStudent,
    course,
    title,
    infoMessage,
    defaultFiles,
  } = props;

  /********************************************************************************************************/
  /* State management
  /********************************************************************************************************/

  const [selectedStudents, setSelectedStudents] = useState<string[]>(propsSelectedStudents);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | AssignmentStudentType | undefined>(
    propsSelectedAssignment,
  );
  const [files, setFiles] = useState<IProtoFileUpload[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [status, setStatus] = useState<STATUS>(STATUS.NONE);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const [uploadDirectory, setUploadDirectory] = useState<boolean>(false);
  const [testCategories, setTestCategories] = useState<TestCategoryType[]>([]);
  const [submission, setSubmission] = useState<StudentSubmissionType | SubmissionInfoType | undefined>(undefined);
  const [loadingTests, setLoadingTests] = useState<boolean>(false);
  const [fileTemplates, setFileTemplates] = useState<AssignmentFileType[]>([]);
  const [sendMeAConfirmationEmail, setSendMeAConfirmationEmail] = useState<boolean>(
    LOCAL_SETTINGS.sendMeAConfirmationEmail.getter(),
  );
  const [submissionTests, setSubmissionTests] = useState<SubmissionTestType[]>([]);
  const [testsLog, setTestsLog] = useState<string | null>(null);
  const [testCasesState, setTestCasesState] = useState<(StudentTestCaseType & { result?: SubmissionTestType })[]>([]);
  const [activeTab, setActiveTab] = useState<string>('1');
  const [lateSubmissionModalVisible, setLateSubmissionModalVisible] = useState<boolean>(false);

  const normalizeStudentTestCase = useCallback(
    (
      test: {
        id: number;
        testCategory: number;
        sortKey?: number;
        description: string;
        pointsPass?: number;
        pointsFail?: number;
        explanation?: string;
        exposed?: boolean;
        rubricItem?: number | null;
      },
      result?: SubmissionTestType,
    ): StudentTestCaseType & { result?: SubmissionTestType } => ({
      id: test.id,
      testCategory: test.testCategory,
      sortKey: test.sortKey ?? 0,
      description: test.description,
      pointsPass: test.pointsPass ?? 0,
      pointsFail: test.pointsFail ?? 0,
      explanation: test.explanation ?? '',
      exposed: test.exposed ?? false,
      rubricItem: test.rubricItem ?? null,
      ...(result ? { result } : {}),
    }),
    [],
  );

  /********************************************************************************************************/
  /* Memoized values
  /********************************************************************************************************/

  const assignmentOptions = useMemo(
    () =>
      assignments.map((assignment: Assignment | AssignmentStudentType) => (
        <Select.Option key={assignment.id} value={assignment.id}>
          {assignment.name}
        </Select.Option>
      )),
    [assignments],
  );

  /********************************************************************************************************/
  /* Loading and data formatting methods
  /********************************************************************************************************/

  const loadTemplates = useCallback(async (assignment: Assignment | AssignmentStudentType) => {
    const files = assignment.files ?? [];
    const templates = await Promise.all(
      files.map((item) => (typeof item === 'number' ? assignmentFilesApi.retrieve({ id: item }) : item)),
    );
    const visibleTemplates = templates.filter((file) => !file.hidden);
    setFileTemplates(visibleTemplates);
  }, []);

  const loadTests = useCallback(
    async (assignmentId: number) => {
      if (isStudent) {
        setLoadingTests(true);

        // Fetch categories and initial test cases
        const { testCases: fetchedTestCases, testCategories: fetchedCategories } =
          await assignmentsApi.studentTestsRetrieve({ id: assignmentId });

        const caseObj: StudentTestCasesByCategory = {};
        const exposedTestCases = fetchedTestCases
          .filter((t) => t.exposed)
          .map((test) => normalizeStudentTestCase(test));
        fetchedCategories.forEach((category) => {
          caseObj[category.id] = [];
        });
        exposedTestCases.forEach((testCase) => {
          caseObj[testCase.testCategory] = [...caseObj[testCase.testCategory], testCase];
        });
        setTestCategories(fetchedCategories);
        setTestCasesState(exposedTestCases);
        setLoadingTests(false);
      }
    },
    [isStudent, normalizeStudentTestCase],
  );

  // Update student tests (merged with results) when submission or assignment changes
  useEffect(() => {
    const updateStudentTests = async () => {
      if (!isStudent || !selectedAssignment) return;

      if (submission) {
        try {
          const studentTests = await assignmentsApi.studentTestsRetrieve({ id: selectedAssignment.id });
          const testResults = await submissionsApi.testResultsRetrieve({
            id: submission.id,
          });

          const latestTests = getLatestSubmissionTests(testResults.submissionTests || []);
          const resultMap = new Map(latestTests.map((t) => [t.testCase, t]));

          const testsWithResults = studentTests.testCases.map((test) => {
            const result = resultMap.get(test.id);
            return normalizeStudentTestCase(test, result);
          });
          setTestCasesState(testsWithResults);
        } catch (e) {
          console.error(e);
        }
      } else {
        // No submission yet, just show tests without results
        try {
          const studentTests = await assignmentsApi.studentTestsRetrieve({ id: selectedAssignment.id });
          setTestCasesState(studentTests.testCases.map((test) => normalizeStudentTestCase(test)));
        } catch (e) {
          console.error(e);
        }
      }
    };

    updateStudentTests();
  }, [submission, selectedAssignment, isStudent, normalizeStudentTestCase]);

  const loadTestResults = useCallback(
    async (sub: StudentSubmissionType | SubmissionInfoType | undefined, _loadLogs: boolean) => {
      if (sub) {
        const results = await submissionsApi.testResultsRetrieve({ id: sub.id });
        if (results !== null && results !== undefined) {
          setSubmissionTests(getLatestSubmissionTests(results.submissionTests));
          setTestsLog(results.logs);
        }
      }
    },
    [],
  );

  const buildStudentOptions = useMemo(() => {
    const notSubmitted = [];
    const hasSubmitted = [];

    for (const student of students) {
      if (selectedAssignment) {
        if (submissions[student]?.[selectedAssignment.id]) {
          hasSubmitted.push(
            <Select.Option key={student} value={student} disabled={true}>
              {student}
            </Select.Option>,
          );
        } else {
          notSubmitted.push(
            <Select.Option key={student} value={student} disabled={false}>
              {student}
            </Select.Option>,
          );
        }
      } else {
        notSubmitted.push(
          <Select.Option key={student} value={student} disabled={false}>
            {student}
          </Select.Option>,
        );
      }
    }

    return (
      <>
        <Select.Option key="missing" value={''} disabled={true}>
          <span style={{ paddingTop: 10, color: 'grey', fontSize: '10px' }}>STUDENTS MISSING SUBMISSIONS</span>
        </Select.Option>
        {notSubmitted}
        <Select.Option key="submitted" value={''} disabled={true}>
          <span style={{ paddingTop: 10, color: 'grey', fontSize: '10px' }}>
            STUDENTS WITH SUBMISSIONS (DELETE BEFORE UPLOADING)
          </span>
        </Select.Option>
        {hasSubmitted}
      </>
    );
  }, [students, submissions, selectedAssignment]);

  /********************************************************************************************************/
  /* Lifecycle effects
  /********************************************************************************************************/

  // Initial mount - load templates if assignment is selected
  useEffect(() => {
    if (propsSelectedAssignment) {
      loadTemplates(propsSelectedAssignment);
    }
  }, []);

  // Handle changes to selectedAssignment or visibility
  useEffect(() => {
    const prevAssignment = selectedAssignment;

    if (propsSelectedAssignment?.id !== prevAssignment?.id || isVisible) {
      setSelectedAssignment(propsSelectedAssignment);
      setTestCategories([]);

      if (propsSelectedAssignment) {
        loadTemplates(propsSelectedAssignment);
        loadTests(propsSelectedAssignment.id);

        if (propsSelectedStudents.length > 0) {
          let primaryStudent: string | null = null;

          propsSelectedStudents.forEach((email: string) => {
            if (submissions[email]?.[propsSelectedAssignment.id]) {
              primaryStudent = email;
            }
          });

          if (primaryStudent !== null) {
            const sub = submissions[primaryStudent][propsSelectedAssignment.id];
            setSubmission(sub);
            loadTestResults(sub, false);
          }
        }
      }
    }
  }, [
    propsSelectedAssignment,
    isVisible,
    propsSelectedStudents,
    submissions,
    loadTemplates,
    loadTests,
    loadTestResults,
  ]);

  // Handle selected students changes
  useEffect(() => {
    setSelectedStudents(propsSelectedStudents);
  }, [propsSelectedStudents]);

  // Clear test data when dialog closes
  useEffect(() => {
    if (!isVisible) {
      setSubmissionTests([]);
      setTestsLog(null);
    }
  }, [isVisible]);

  // Handle default files
  useEffect(() => {
    if (defaultFiles && defaultFiles.length > 0) {
      const newFiles: IProtoFileUpload[] = [];
      const newFileList: UploadFile[] = [];

      const now = Date.now();

      defaultFiles.forEach((baseFile: IBaseFileUpload, index: number) => {
        const fileData = baseFile.data && typeof baseFile.data === 'string' ? baseFile.data.split('\n') : [];
        const file = new File(fileData, baseFile.name, { type: 'text/plain' });

        const ff: IProtoFileUpload = {
          data: baseFile.data,
          longname: baseFile.name,
          name: baseFile.name,
          extension: CodePostFile.extension(baseFile.name),
          path: '',
          zipSource: undefined,
          file: file,
        };

        const fl: UploadFile = {
          name: baseFile.name,
          uid: `manual-upload-${now}-${index}`,
          type: file.type,
          size: file.size,
        };

        newFiles.push(ff);
        newFileList.push(fl);
      });

      setFiles(newFiles);
      setFileList(newFileList);
    }
  }, [defaultFiles]);

  /********************************************************************************************************/
  /* State handlers
  /********************************************************************************************************/

  const handleChangeStudents = useCallback((options: string[]) => {
    setSelectedStudents(options);
  }, []);

  const handleChangeAssignment = useCallback(
    (option: number) => {
      const newAssignment = assignments.find((assn) => assn.id === option);
      setSelectedAssignment(newAssignment);
      setSelectedStudents([]);
    },
    [assignments],
  );

  const handleCancel = useCallback(() => {
    setStatus(STATUS.NONE);
    setFiles([]);
    setFileList([]);
    setRejectedFiles([]);
    setActiveTab('1');
    onCancel();
  }, [onCancel]);

  const handleSuccess = useCallback(() => {
    setStatus(STATUS.NONE);
    setFiles([]);
    setFileList([]);
    setRejectedFiles([]);
    if (onSuccess) {
      onSuccess(submission!.id);
    } else {
      onCancel();
    }
  }, [onSuccess, onCancel, submission]);

  const toggleDirectoryUpload = useCallback(() => {
    setStatus(STATUS.NONE);
    setFiles([]);
    setFileList([]);
    setRejectedFiles([]);
    setUploadDirectory((prev) => !prev);
  }, []);

  const handleRemove = useCallback((file: UploadFile) => {
    const protoFileUpload = fileToProtoFileUpload(file);

    setFiles((prevFiles) =>
      prevFiles.filter(
        (f: IProtoFileUpload) =>
          f.longname !== protoFileUpload.longname &&
          (f.zipSource === undefined || f.zipSource !== protoFileUpload.zipSource),
      ),
    );

    setFileList((prevList) => prevList.filter((f: UploadFile) => f.name !== protoFileUpload.longname));
  }, []);

  const openLateSubmissionModal = useCallback(() => {
    setLateSubmissionModalVisible(true);
  }, []);

  const closeLateSubmissionModal = useCallback(() => {
    setLateSubmissionModalVisible(false);
  }, []);

  const toggleSendMeAConfirmationEmail = useCallback(() => {
    setSendMeAConfirmationEmail((prev) => {
      const toggled = !prev;
      LOCAL_SETTINGS.sendMeAConfirmationEmail.setter(toggled);
      return toggled;
    });
  }, []);

  /********************************************************************************************************/
  /* Testing infrastructure
  /********************************************************************************************************/

  const shouldRunTests = useCallback(() => {
    const testsToRun = testCategories.length > 0;

    const runsSoFar = submission ? submission.testRunsCompleted : 0;
    const maxRuns =
      selectedAssignment && selectedAssignment.maxStudentTestRuns ? selectedAssignment.maxStudentTestRuns : -1;

    return testsToRun && (maxRuns < 0 || runsSoFar < maxRuns);
  }, [selectedAssignment, testCategories, submission]);

  const setResults = useCallback((result: SubmissionTestResultType) => {
    if (result) {
      setSubmission((prevSubmission) =>
        prevSubmission ? { ...prevSubmission, testRunsCompleted: prevSubmission.testRunsCompleted + 1 } : undefined,
      );
    }

    setLoadingTests(false);
    setStatus(STATUS.COMPLETE);
  }, []);

  const runTests = useCallback(
    async (sub: StudentSubmissionType | SubmissionInfoType) => {
      if (shouldRunTests() && selectedAssignment?.environment) {
        setLoadingTests(true);
        setStatus(STATUS.SAVING);
        const result = await autograderApi.environmentsRunPartialUpdate({
          id: selectedAssignment.environment,
          patchedEnvironmentRunRequest: {
            submission: sub.id,
            simulate: false,
            exposedOnly: true,
          },
        });
        awaitTestResult(result.task, (result: unknown) => setResults(result as SubmissionTestResultType));
      }
    },
    [shouldRunTests, selectedAssignment, setResults],
  );

  const setMockResults = useCallback(
    (result: TestEditorResultType) => {
      if (result) {
        const submissionId = submission?.id || 0;
        const now = new Date().toISOString();
        const mappedResults: SubmissionTestType[] = result.results.map((test, index) => ({
          id: -index - 1,
          testCase: test.testCase,
          testCategory: test.testCategory,
          submission: submissionId,
          logs: test.logs,
          passed: test.passed,
          created: now,
          modified: now,
          isError: test.isError,
        }));

        setSubmissionTests(mappedResults);
        setTestsLog(result.logs);
      }

      setLoadingTests(false);
    },
    [submission],
  );

  const runTestsMock = useCallback(
    async (sub: StudentSubmissionType | SubmissionInfoType) => {
      if (shouldRunTests() && selectedAssignment) {
        setLoadingTests(true);

        const filesJson = files.map((file: IProtoFileUpload) => ({
          name: file.name,
          code: file.data,
          path: file.path === undefined || file.path === null ? '' : file.path,
        }));

        const assignment = selectedAssignment as Assignment;

        const result = await autograderApi.environmentsRunPartialUpdate({
          id: assignment.environment!,
          patchedEnvironmentRunRequest: {
            files: JSON.stringify(filesJson),
            submission: sub.id,
            simulate: true,
            exposedOnly: true,
          },
        });
        awaitTestResult(result.task, (result: unknown) => setMockResults(result as TestEditorResultType));
      }
    },
    [shouldRunTests, selectedAssignment, files, setMockResults],
  );

  /********************************************************************************************************/
  /* Helper functions
  /********************************************************************************************************/

  /**
   * Check if this is a Code in Place course (special handling required)
   * TODO: Make this configurable instead of hardcoded
   */
  const isCodeInPlaceCourse = useMemo(() => selectedAssignment?.course === CIP_COURSE_ID, [selectedAssignment]);

  /**
   * Check if the submission is locked (finalized or has a grader)
   */
  const isSubmissionLocked = useMemo(() => {
    if (!submission) {
      return false;
    }

    const hasGrader =
      'grader' in submission ? Boolean(submission.grader) : 'hasGrader' in submission ? submission.hasGrader : false;

    return submission.isFinalized || hasGrader;
  }, [submission]);

  /********************************************************************************************************/
  /* Submission upload
  /********************************************************************************************************/

  const handleUpload = useCallback(() => {
    closeLateSubmissionModal();

    if (isSubmissionLocked && isStudent) {
      // Special case for Code in Place: allow simulated test runs
      if (isCodeInPlaceCourse) {
        const execute = () => {
          runTestsMock(submission!);
          setFiles([]);
          setFileList([]);
          setRejectedFiles([]);
          setActiveTab('3');
        };

        Modal.confirm({
          title: 'Submission in review',
          content: (
            <div>
              Your submission is being reviewed by your instructor, so the code and test results cannot be overwritten.
              <br />
              <br />
              <div>
                You can still simulate tests on newly uploaded code, but it won't change the code or test results that
                your instructor sees. If you want to overwrite them, please contact your instructor and he/she can mark
                the submission as not being in review.
              </div>
              <br />
              <div>Do you want to continue and simulate the tests?</div>
            </div>
          ),
          okText: 'Continue and simulate tests',
          onOk: execute,
          onCancel: () => {},
        });
      } else {
        message.warning(
          'This submission is currently being reviewed and cannot be re-uploaded. Please contact your instructor if you have any questions.',
          10,
        );
      }
      return;
    }

    if (!selectedAssignment) {
      return;
    }

    setStatus(STATUS.SAVING);

    uploadSubmission(
      selectedAssignment as any,
      selectedStudents,
      files as unknown as SubmissionUploadFile[],
      sendMeAConfirmationEmail,
    )
      .then((newSubmission: StudentSubmissionType | SubmissionInfoType) => {
        console.log('Upload response:', newSubmission);
        const shouldRun = shouldRunTests();
        if (shouldRun) {
          runTests(newSubmission);
        }
        setSubmission(newSubmission);
        setStatus(shouldRun ? STATUS.SAVING : STATUS.COMPLETE);
        setFiles([]);
        setFileList([]);
        setRejectedFiles([]);
        setSelectedStudents(propsSelectedStudents);
        setSelectedAssignment(propsSelectedAssignment || undefined);
        setActiveTab('1');
      })
      .catch((error) => {
        const isDueDateError = error?.toString?.()?.includes('Due date has passed') ?? false;

        if (!isDueDateError && error instanceof Error) {
          message.error(
            'Sorry, something went wrong. Please try uploading again. If the problem persists, contact the codePost team.',
          );

          slack(`${process.env.REACT_APP_API_URL}/logs/logError/`, {
            error: error.toString(),
            errorDetail: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            url: window.location.href,
          });
        }

        handleCancel();
      });
  }, [
    closeLateSubmissionModal,
    isSubmissionLocked,
    isStudent,
    isCodeInPlaceCourse,
    submission,
    runTestsMock,
    selectedAssignment,
    selectedStudents,
    files,
    sendMeAConfirmationEmail,
    uploadSubmission,
    shouldRunTests,
    runTests,
    propsSelectedStudents,
    propsSelectedAssignment,
    handleCancel,
  ]);

  const confirmUpload = useCallback(() => {
    if (selectedAssignment === undefined || selectedAssignment.uploadDueDate === undefined) {
      return;
    }

    if (dueDatePassed(selectedAssignment.uploadDueDate)) {
      if (isStudent) {
        openLateSubmissionModal();
      } else {
        handleUpload();
      }
    } else {
      handleUpload();
    }
  }, [selectedAssignment, isStudent, openLateSubmissionModal, handleUpload]);

  const beforeUpload = useCallback(async (file: UploadFile, _fileList: UploadFile[]) => {
    const ProtoFileUpload: IProtoFileUpload = fileToProtoFileUpload(file);

    try {
      const outputFiles = await readUploadedFile(file.originFileObj ?? (file as unknown as File));

      setFileList((prevFileList) => {
        const newFileList = prevFileList.filter((f: UploadFile) => f.name !== ProtoFileUpload.longname);
        const fileNames = outputFiles.map((f) => [f.longname, f.zipSource]).flat();
        const newFileListItem = { ...file, name: ProtoFileUpload.longname };

        return fileNames.includes(ProtoFileUpload.longname) ? [...newFileList, newFileListItem] : newFileList;
      });

      setFiles((prevFiles) => {
        const newFiles = prevFiles.filter((f: IProtoFileUpload) => {
          return !outputFiles.map((outputFile: IProtoFileUpload) => outputFile.longname).includes(f.longname);
        });
        return [...newFiles, ...outputFiles];
      });
    } catch (e) {
      setRejectedFiles((prev) => [...prev, ProtoFileUpload.longname]);
      message.error(String(e));
    }

    return Promise.reject();
  }, []);

  /********************************************************************************************************/
  /* Render helpers
  /********************************************************************************************************/

  const renderRejectedFiles = useMemo(() => {
    if (rejectedFiles.length === 0) {
      return null;
    }
    return (
      <div style={{ color: 'red', marginBottom: 10, marginTop: '10px' }}>
        The following files were not uploaded:{' '}
        {rejectedFiles.map((fileName, index) => {
          return `${fileName}${index === rejectedFiles.length - 1 ? '' : ', '}`;
        })}
      </div>
    );
  }, [rejectedFiles]);

  const renderSettings = useMemo(() => {
    const settings = [
      {
        setting: 'Upload a directory',
        tooltip: 'Turn this on to upload nested folders.',
        checked: uploadDirectory,
        onChange: toggleDirectoryUpload,
      },
    ];

    return (
      <span>
        {settings.map((setting) => (
          <span key={setting.setting}>
            {setting.setting} <CPTooltip title={setting.tooltip} infoIcon={true} /> &nbsp;{' '}
            <Switch checked={setting.checked} onClick={setting.onChange} />
          </span>
        ))}
      </span>
    );
  }, [uploadDirectory, toggleDirectoryUpload]);

  const renderRequiredFiles = useMemo(() => {
    const assignmentFiles = selectedAssignment?.files;
    // Check if we have files and if they are objects (new backend)
    if (!assignmentFiles || assignmentFiles.length === 0 || typeof assignmentFiles[0] === 'number') {
      return null;
    }

    const typedFiles = assignmentFiles as unknown as AssignmentFileType[];

    return (
      <div style={{ marginBottom: 16 }}>
        <Table
          columns={[
            { title: 'Filename', dataIndex: 'name', key: 'name' },
            { title: 'Description', dataIndex: 'description', key: 'description' },
            { title: 'Status', dataIndex: 'status', key: 'status', align: 'center' as const },
          ]}
          dataSource={typedFiles.map((f) => {
            const uploaded = files.some((uploadedFile) => uploadedFile.name === f.name);
            return {
              key: f.id,
              name: (
                <span>
                  {f.name}{' '}
                  {f.required && (
                    <Tag color="volcano" style={{ marginLeft: 8 }}>
                      Required
                    </Tag>
                  )}
                </span>
              ),
              description: f.description,
              status: uploaded ? (
                <CheckCircleOutlined style={{ color: 'green', fontSize: 16 }} />
              ) : f.required ? (
                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
              ) : (
                <Tag>Optional</Tag>
              ),
            };
          })}
          pagination={false}
          size="small"
          bordered
        />
      </div>
    );
  }, [selectedAssignment, files]);

  const renderFileList = useMemo(() => {
    if (fileTemplates.length === 0) {
      return null;
    }

    const ignoringOptionalFiles =
      files.length > 0 && fileTemplates.every((ft) => !ft.required && !files.some((el) => el.name === ft.name));

    const hasUploadedZip = files.some((el) => el.zipSource !== undefined && el.zipSource.length > 0);

    return (
      <>
        <Table
          columns={TABLE_COLUMNS}
          dataSource={fileTemplates.map((el) => {
            const exists = files.some((file) => file.name === el.name);
            return {
              ...el,
              key: el.id,
              name: (
                <span>
                  {el.required ? <Tag color={exists ? 'green' : 'volcano'}>REQUIRED</Tag> : <Tag>OPTIONAL</Tag>}
                  {el.name}
                </span>
              ),
              uploaded: exists ? (
                <CheckCircleOutlined style={{ color: 'green' }} />
              ) : (
                <CloseCircleOutlined style={{ color: 'red' }} />
              ),
            };
          })}
          pagination={false}
        />
        {ignoringOptionalFiles && (
          <>
            <br />
            <Alert
              type="warning"
              message={
                <>
                  You haven't uploaded any of the specified files. Make sure this is your intention before submitting.
                  {shouldRunTests() && ' File names must match the specified files exactly to pass tests. '}
                  {hasUploadedZip && (
                    <span>
                      If you're uploading a zip, make sure you're zipping the folder that contains your files, and not a
                      folder that contains a folder with your files.
                    </span>
                  )}
                </>
              }
            />
          </>
        )}
      </>
    );
  }, [fileTemplates, files, shouldRunTests]);

  const renderUnzippedFiles = useMemo(() => {
    const unzippedFiles = files.filter((el) => el.zipSource !== undefined);
    if (unzippedFiles.length === 0) {
      return null;
    }

    return (
      <>
        <br />
        <b>The following files will be unzipped and uploaded with the submission:</b>
        <ul>
          {unzippedFiles.map((el, index) => (
            <li key={index}>
              {el.path}/{el.name}
            </li>
          ))}
        </ul>
      </>
    );
  }, [files]);

  /********************************************************************************************************/
  /* Render
  /********************************************************************************************************/

  if (!isVisible) {
    return null;
  }

  const hideDueDate = isCodeInPlaceCourse;

  let content: React.ReactNode;
  let sendMeAConfirmationEmailCheckbox: React.ReactNode = null;
  let goForwardButton: React.ReactNode = null;
  let goBackButton: React.ReactNode = null;

  switch (status) {
    case STATUS.COMPLETE: {
      content = (
        <div>
          <Result status="success" title="Upload complete!" />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {isStudent && (
                <Button
                  key="submit"
                  onClick={() => {
                    setActiveTab('1');
                    handleSuccess();
                  }}
                >
                  <UploadOutlined /> Submit again
                </Button>
              )}
              {submissionTests.length > 0 && (
                <Button
                  key="tests"
                  type="primary"
                  onClick={() => {
                    setActiveTab('3');
                    handleSuccess();
                  }}
                >
                  <CalculatorOutlined /> View test results
                </Button>
              )}
              <Button
                key="files"
                type="primary"
                onClick={() => {
                  setActiveTab('4');
                  handleSuccess();
                }}
              >
                <ContainerOutlined /> View files
              </Button>
            </div>
          </div>
        </div>
      );

      goBackButton = (
        <Button key="back" onClick={handleCancel}>
          Close
        </Button>
      );
      break;
    }

    case STATUS.SAVING: {
      content = (
        <div style={{ textAlign: 'center', margin: '0 auto', padding: '30px 50px' }}>
          <Spin size="large" />
          <br />
          <br />
          <Typography.Title level={4}>Uploading your files{loadingTests && ' and running tests'}...</Typography.Title>
        </div>
      );
      break;
    }

    case STATUS.NONE: {
      goBackButton = (
        <Button key="back" onClick={handleCancel}>
          Close
        </Button>
      );

      const areRequiredFilesPresent = fileTemplates.every(
        (ft) => !ft.required || files.some((el) => el.name === ft.name),
      );

      const disableUpload = !(
        areRequiredFilesPresent &&
        files.length > 0 &&
        selectedStudents.length > 0 &&
        selectedAssignment
      );

      if (isStudent && activeTab === '1') {
        sendMeAConfirmationEmailCheckbox = (
          <span key="sendMeAConfirmationEmailCheckbox">
            {selectedAssignment &&
            selectedAssignment.uploadDueDate &&
            dueDatePassed(selectedAssignment.uploadDueDate) &&
            !hideDueDate ? (
              <Tag color="volcano">Due Date Passed</Tag>
            ) : null}
            <Checkbox checked={sendMeAConfirmationEmail} onChange={toggleSendMeAConfirmationEmail}>
              Send me email confirmation
            </Checkbox>
            <CPTooltip
              title={
                submission && submission.students && submission.students.length > 1
                  ? 'If checked, codePost will send you and your partners an email confirming a successful submission.'
                  : 'If checked, codePost will send you an email confirming a successful submission.'
              }
              infoIcon={true}
            />
            &nbsp; &nbsp;
          </span>
        );
      }

      goForwardButton =
        activeTab === '1' ? (
          <span key="goForwardButton" style={{ marginLeft: '8px' }}>
            <Button key="submit" type="primary" disabled={disableUpload} onClick={confirmUpload}>
              {submission ? 'Re-s' : 'S'}ubmit{shouldRunTests() && ' and run tests'}
            </Button>
            {selectedAssignment && (
              <LateSubmissionModal
                open={lateSubmissionModalVisible}
                assignment={selectedAssignment as AssignmentStudentType}
                onCancel={closeLateSubmissionModal}
                onOk={handleUpload}
              />
            )}
          </span>
        ) : null;

      if (disableUpload) {
        const getDisabledReason = () => {
          if (!areRequiredFilesPresent) {
            return 'You must upload all required files before submitting.';
          }
          if (files.length === 0) {
            return 'You must upload at least one file before submitting.';
          }
          if (selectedStudents.length === 0) {
            return 'You must select at least one student before uploading.';
          }
          if (!selectedAssignment) {
            return 'You must select an assignment before uploading.';
          }
          return '';
        };

        goForwardButton = <Tooltip title={getDisabledReason()}>{goForwardButton}</Tooltip>;
      }

      // Handle case where no students exist (admin view only)
      if (!isStudent && students.length === 0) {
        content = (
          <div>
            After you add students, you can upload their submissions here.
            <br />
            <br />
            {course && (
              <Link to={`/admin/${encodeForLink(course.name)}/${encodeForLink(course.period)}/roster/students`}>
                <Button>Add students</Button>
              </Link>
            )}
          </div>
        );
      } else {
        // Calculate test run information
        const runsSoFar = submission?.testRunsCompleted ?? 0;
        const maxRuns = selectedAssignment?.maxStudentTestRuns ?? -1;
        const numRemaining = maxRuns > 0 ? Math.max(maxRuns - runsSoFar, 0) : Infinity;

        const testMessage = selectedAssignment?.maxStudentTestRuns ? (
          <Alert
            message={
              <>
                You have used <strong>{runsSoFar}</strong> test runs so far. You have{' '}
                <strong>{numRemaining === Infinity ? 'unlimited' : numRemaining}</strong> test{' '}
                {numRemaining === 1 ? 'run' : 'runs'} remaining.
                {numRemaining === 0 && ' You can still continue to submit, but no additional tests will be run.'}
              </>
            }
            type={numRemaining === 0 ? 'error' : numRemaining === 1 ? 'warning' : 'info'}
          />
        ) : null;

        content = (
          <div>
            {infoMessage && <Alert message={infoMessage} type="info" style={{ marginBottom: 16 }} />}

            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>Assignment:</div>
              <Select
                value={selectedAssignment?.id}
                disabled={!!propsSelectedAssignment}
                onChange={handleChangeAssignment}
                style={{ width: '100%' }}
                showSearch
                placeholder="Select an assignment"
              >
                {assignmentOptions}
              </Select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                Students: {isStudent && <CPTooltip title={tooltips.admin.assignments.uploadSubmission} infoIcon />}
              </div>
              <Select
                value={selectedStudents}
                disabled={disableStudentSelect}
                onChange={handleChangeStudents}
                showSearch
                mode="multiple"
                placeholder="Select students"
                style={{ width: '100%' }}
              >
                {buildStudentOptions}
              </Select>
            </div>

            <Divider />

            {renderRequiredFiles}
            {renderFileList}

            {renderSettings}

            <div style={{ margin: '16px 0' }}>
              <Upload
                beforeUpload={beforeUpload}
                listType="text"
                multiple
                onRemove={handleRemove}
                fileList={fileList}
                directory={uploadDirectory}
              >
                <Button icon={<UploadOutlined />}>Upload files</Button>
              </Upload>
              {submission && (
                <div style={{ marginTop: 8, color: '#666' }}>
                  <strong>Note:</strong> you must re-submit all files each time you submit.
                </div>
              )}
            </div>

            {renderUnzippedFiles}
            {renderRejectedFiles}

            {testMessage && (
              <>
                <Divider />
                {testMessage}
              </>
            )}
          </div>
        );
      }
      break;
    }
  }

  const showTestsTab =
    (testCategories.length > 0 && (!selectedAssignment?.nudgeMode || submissionTests.length > 0)) ||
    testsLog ||
    loadingTests;

  return (
    <Modal
      open
      title={title || 'Upload Submissions'}
      onCancel={handleCancel}
      width={MODAL_WIDTH}
      footer={[sendMeAConfirmationEmailCheckbox, goBackButton, goForwardButton]}
    >
      {status !== STATUS.NONE || !isStudent ? (
        content
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="Submit" key="1">
            {content}
          </Tabs.TabPane>

          {selectedAssignment?.explanation && (
            <Tabs.TabPane tab="Instructions" key="2">
              <ReactMarkdown>{selectedAssignment.explanation}</ReactMarkdown>
            </Tabs.TabPane>
          )}

          {selectedAssignment?.allowStudentUploadWithPartners && (
            <Tabs.TabPane tab="Partners" key="partners">
              <div>
                To add a partner to your submission, share this link with them.
                <InvitePartnersLink assignment={selectedAssignment} submission={submission} />
              </div>
            </Tabs.TabPane>
          )}

          {showTestsTab && (
            <Tabs.TabPane tab="Tests" key="3">
              <div style={{ minHeight: MIN_TEST_HEIGHT, height: 'calc(100vh - 400px)' }}>
                <TestsList submissionId={submission?.id || 0} tests={testCasesState as unknown as TestCase[]} />
              </div>
            </Tabs.TabPane>
          )}

          {submission && (
            <Tabs.TabPane tab="Most recent submission" key="4">
              <Alert
                type="info"
                message={
                  <div>
                    Showing results from most recent submission at:{' '}
                    <CodePostDate datetime={submission.dateUploaded || ''} />
                  </div>
                }
              />
              <br />
              <ViewUpload assignment={selectedAssignment as AssignmentStudentType} />
            </Tabs.TabPane>
          )}
        </Tabs>
      )}
    </Modal>
  );
};

export default UploadSubmissionDialog;
