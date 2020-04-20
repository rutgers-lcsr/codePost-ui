/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { CalculatorOutlined, CheckCircleOutlined, CloseCircleOutlined, UploadOutlined } from '@ant-design/icons';

/* ant imports */
import { Alert, Button, Checkbox, message, Modal, Progress, Switch, Upload, Table, Tag, Divider, Tabs } from 'antd';

/* other library imports */
import Select from 'react-select';

import { Link } from 'react-router-dom';

import ReactMarkdown from 'react-markdown';

/* codePost imports */
import {
  AssignmentType,
  TestCategoryType,
  SubmissionTestType,
  SubmissionInfoType,
  StudentSubmissionType,
  FileTemplateType,
  CourseType,
} from '../../../../../infrastructure/types';
import { AssignmentStudent, AssignmentStudentType } from '../../../../../infrastructure/assignment';
import { File as CodePostFile } from '../../../../../infrastructure/file';
import { Environment } from '../../../../../infrastructure/autograder/environment';
import { FileTemplate } from '../../../../../infrastructure/fileTemplate';
import { SubmissionTest } from '../../../../../infrastructure/submissionTest';
import { Submission } from '../../../../../infrastructure/submission';

import CPTooltip from '../../../../../components/core/CPTooltip';
import { tooltips } from '../../../../../components/core/tooltips';

import { UploadFile } from 'antd/lib/upload/interface';

import { IBaseFileUpload, IProtoFileUpload, fileToProtoFileUpload, readUploadedFile } from './FileReader';

import TestsList from '../../../../../components/code-review/code-panel/TestsList';
import { StudentTestCasesByCategory } from '../../../../../components/core/testFetchUtils';

import { awaitTestResult } from '../../../../../components/admin/assignments/tests/autograderPollingUtils';

import { SubmissionTestResultType, TestEditorResultType } from '../../../../../infrastructure/autograder/runTypes';

import { sendSlack, slack } from '../../../../../components/core/slack';

import { encodeForLink } from '../../../../../components/core/URLutils';

import { CodePostDate, dueDatePassed } from '../../../../../components/utils/DateUtils';

import ViewUpload from '../../../../../components/student/ViewUpload';
import InvitePartnersLink from '../../../../../components/student/InvitePartnersLink';
import LateSubmissionModal from '../../../../../components/student/LateSubmissionModal';

import { LOCAL_SETTINGS } from '../../../../../components/utils/LocalSettings';

/**********************************************************************************************************************/

interface IUploadSubmissionDialogProps {
  isVisible: boolean;
  onCancel: () => void;
  assignments: (AssignmentType | AssignmentStudentType)[];
  selectedAssignment?: AssignmentType | AssignmentStudentType;
  students: string[];
  selectedStudents: string[];
  submissions: {
    [userEmail: string]: {
      [assignmentID: number]: SubmissionInfoType | StudentSubmissionType;
    };
  };
  uploadSubmission:
    | ((
        assignment: AssignmentStudentType,
        partners: string[],
        files: any[],
        sendConfirmationEmail: boolean,
      ) => Promise<StudentSubmissionType>)
    | ((
        assignment: AssignmentType,
        partners: string[],
        files: any[],
        sendConfirmationEmail: boolean,
      ) => Promise<SubmissionInfoType>);

  disableStudentSelect?: boolean;
  onSuccess?: (newSubmissionID: number) => void;
  isStudent?: boolean;
  course?: CourseType;
  title?: string;
  infoMessage?: React.ReactNode;

  defaultFiles?: IBaseFileUpload[];
}

enum STATUS {
  NONE,
  SAVING /* reading files from user's file system */,
  COMPLETE /* completed upload */,
}

interface IUploadSubmissionDialogState {
  selectedStudents: string[];
  selectedAssignment?: AssignmentType | AssignmentStudentType;
  // List of files in codePost format for upload
  files: IProtoFileUpload[];
  // List of files in ant format. Required to make make the dialog a controlled list so we
  // can remove files from the list if they are not valid
  fileList: UploadFile[];
  status: STATUS;

  rejectedFiles: string[];

  uploadDirectory: boolean;

  testCategories: TestCategoryType[];
  testCases: StudentTestCasesByCategory;

  submission?: StudentSubmissionType;
  loadingTests: boolean;

  fileTemplates: FileTemplateType[];
  sendMeAConfirmationEmail: boolean;

  // Test results
  submissionTests: SubmissionTestType[];
  testsLog: string | null; // If the admin turns off exposeDumpLogs then the log will be none
  runMessage: string; // A message to show students from the result of their run
  activeTab: string;

  lateSubmissionModalVisible: boolean;
}

class UploadSubmissionDialog extends React.Component<IUploadSubmissionDialogProps, IUploadSubmissionDialogState> {
  public assignmentOptions = this.props.assignments.map((assignment: AssignmentType | AssignmentStudentType, i) => {
    return {
      value: assignment.id,
      label: assignment.name,
    };
  });

  public state: Readonly<IUploadSubmissionDialogState> = {
    selectedStudents: this.props.selectedStudents,
    selectedAssignment: this.props.selectedAssignment,
    files: [],
    fileList: [],
    rejectedFiles: [],
    status: STATUS.NONE,
    uploadDirectory: false,
    testCases: {},
    testCategories: [],
    submissionTests: [],
    testsLog: null,
    loadingTests: false,
    fileTemplates: [],
    sendMeAConfirmationEmail: LOCAL_SETTINGS.sendMeAConfirmationEmail.getter(),
    runMessage: '',
    activeTab: '1',
    lateSubmissionModalVisible: false,
  };

  /********************************************************************************************************/
  /* Lifecycle methods
  /********************************************************************************************************/

  public toggleState = (key: keyof IUploadSubmissionDialogState) => (
    prevState: IUploadSubmissionDialogState,
  ): IUploadSubmissionDialogState => ({
    ...prevState,
    [key]: !prevState[key],
  });

  public getState = (key: keyof IUploadSubmissionDialogState): any => {
    return this.state[key];
  };

  public componentDidMount() {
    if (this.props.selectedAssignment) {
      this.loadTemplates(this.props.selectedAssignment);
    }
  }

  public componentDidUpdate(prevProps: IUploadSubmissionDialogProps, prevState: IUploadSubmissionDialogState) {
    if (
      prevProps.selectedAssignment !== this.props.selectedAssignment ||
      (!prevProps.isVisible && this.props.isVisible)
    ) {
      this.setState({
        selectedAssignment: this.props.selectedAssignment,
        testCategories: [],
        testCases: [],
      });
      if (this.props.selectedAssignment) {
        this.loadTemplates(this.props.selectedAssignment);
        this.loadTests();
        if (this.props.selectedStudents.length > 0) {
          let primaryStudent = null;

          this.props.selectedStudents.forEach((email: string) => {
            if (this.props.submissions.hasOwnProperty(email)) {
              if (
                this.props.selectedAssignment !== undefined &&
                this.props.submissions[email].hasOwnProperty(this.props.selectedAssignment.id)
              ) {
                primaryStudent = email;
              }
            }
          });

          if (primaryStudent !== null) {
            this.setState({
              submission: this.props.submissions[primaryStudent][this.props.selectedAssignment.id],
            });
            this.loadTestResults(
              this.props.submissions[primaryStudent][this.props.selectedAssignment.id],
              this.props.selectedAssignment.exposeDumpLogs === true,
            );
          }
        }
      }
    }
    if (prevProps.selectedStudents !== this.props.selectedStudents) {
      this.setState({ selectedStudents: this.props.selectedStudents });
    }

    if (prevProps.isVisible && !this.props.isVisible) {
      this.setState({ submissionTests: [], testsLog: null, runMessage: '' });
    }

    /////////////////////////////////////////////////////////////////////////////////
    // If default files are included, then prepare them for upload
    /////////////////////////////////////////////////////////////////////////////////
    if (prevProps.defaultFiles === undefined && this.props.defaultFiles !== undefined) {
      let files: any = [];
      let fileList: any = [];

      const now = Date.now();

      this.props.defaultFiles.forEach((baseFile: IBaseFileUpload, index: number) => {
        // @ts-ignore
        const file = new File(baseFile.data.split('\n'), baseFile.name);

        // FIXME: dirs
        const ff = {
          data: baseFile.data,
          longname: baseFile.name,
          name: baseFile.name,
          extension: CodePostFile.extension(baseFile.name),
          path: '',
          zipSource: undefined,
          file: file,
        };

        const fl = {
          name: baseFile.name,
          uid: `manual-upload-${now}-${index}`,
          type: file.type,
          size: file.size,
        };

        files = [...files, ff];
        fileList = [...fileList, fl];
      });

      this.setState({ files, fileList });
    }
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
  }

  /********************************************************************************************************/
  /* Loading and data formatting methods
  /********************************************************************************************************/

  public loadTemplates = (assignment: AssignmentType | AssignmentStudentType) => {
    const promises = assignment.fileTemplates.map((el) => FileTemplate.read(el));
    Promise.all(promises).then((fileTemplates) => this.setState({ fileTemplates }));
  };

  public loadTests = async () => {
    if (this.props.isStudent && this.props.selectedAssignment) {
      this.setState({ loadingTests: true });
      const { testCases, testCategories } = await AssignmentStudent.readStudentTests(this.props.selectedAssignment.id);
      const caseObj: StudentTestCasesByCategory = {};
      const exposedTestCases = testCases.filter((t) => t.exposed);
      testCategories.forEach((category) => {
        caseObj[category.id] = [];
      });
      exposedTestCases.forEach((testCase) => {
        caseObj[testCase.testCategory] = [...caseObj[testCase.testCategory], testCase];
      });
      this.setState({ testCategories, testCases: caseObj, loadingTests: false });
    }
  };

  public loadTestResults = async (sub: StudentSubmissionType | SubmissionInfoType | undefined, loadLogs: boolean) => {
    if (sub) {
      const results = await Submission.readTestResults(sub.id, { isStudentMode: 'True' });
      if (results !== null && results !== undefined) {
        this.setState({ submissionTests: SubmissionTest.getLatest(results.submissionTests), testsLog: results.logs });
      }
    }
  };

  /* build a list of two student groups: missing submissions and not missing submissions */
  /* use these two groups to populate select */
  public buildStudentOptions = (
    students: string[],
    submissions: {
      [userEmail: string]: {
        [assignmentID: number]: SubmissionInfoType | StudentSubmissionType;
      };
    },
    assignment?: AssignmentType | AssignmentStudentType,
  ) => {
    /* FIXME: should use react-select type definition */
    const toRet: any = [
      { label: 'Students missing submissions', options: [] },
      { label: 'Students with submissions (delete before uploading)', options: [] },
    ];

    for (const student of students) {
      if (assignment) {
        if (submissions[student][assignment.id]) {
          toRet[1].options.push({
            value: student,
            label: student,
            isDisabled: true,
          });
        } else {
          toRet[0].options.push({
            value: student,
            label: student,
            isDisabled: false,
          });
        }
      } else {
        toRet[0].options.push({
          value: student,
          label: student,
          isDisabled: false,
        });
      }
    }

    return toRet;
  };

  /********************************************************************************************************/
  /* State handlers
  /********************************************************************************************************/

  public changeStudents = (options: any) => {
    const students = options.map((option: any) => option.value);
    this.setState({ selectedStudents: students });
  };

  public changeAssignment = (option: any) => {
    const selectedAssignment = this.props.assignments.find((assn) => {
      return assn.id === option.value;
    });

    this.setState({ selectedAssignment, selectedStudents: [] });
  };

  public cancel = () => {
    this.setState({ status: STATUS.NONE, files: [], fileList: [], rejectedFiles: [], activeTab: '1' });
    this.props.onCancel();
  };

  public onSuccess = () => {
    this.setState({ status: STATUS.NONE, files: [], fileList: [], rejectedFiles: [] });
    this.props.onSuccess ? this.props.onSuccess(this.state.submission!.id) : this.props.onCancel();
  };

  public toggleDirectoryUpload = () => {
    this.setState({
      status: STATUS.NONE,
      files: [],
      fileList: [],
      rejectedFiles: [],
      uploadDirectory: !this.state.uploadDirectory,
    });
  };

  public onRemove = (file: UploadFile) => {
    const protoFileUpload = fileToProtoFileUpload(file);

    const files = this.state.files.filter((f: IProtoFileUpload) => {
      return (
        f.longname !== protoFileUpload.longname &&
        (f.zipSource === undefined || f.zipSource !== protoFileUpload.zipSource)
      );
    });

    const fileList = this.state.fileList.filter((f: UploadFile) => {
      return f.name !== protoFileUpload.longname;
    });

    this.setState({ files, fileList });
  };

  public openLateSubmissionModal = () => {
    this.setState({ lateSubmissionModalVisible: true });
  };

  public closeLateSubmissionModal = () => {
    this.setState({ lateSubmissionModalVisible: false });
  };

  /********************************************************************************************************/
  /* Submission upload
  /********************************************************************************************************/

  public confirmUpload = () => {
    if (this.state.selectedAssignment === undefined) {
      return;
    }

    if (dueDatePassed(this.state.selectedAssignment)) {
      this.openLateSubmissionModal();
    } else {
      this.upload();
    }
  };

  public upload = () => {
    this.closeLateSubmissionModal();
    // Instead of blocking this on an api error, block the student from submitting
    if (this.state.submission && (this.state.submission.isFinalized || this.state.submission.hasGrader)) {
      // CIP FIXME: Hardcoded logic for CIP course to allow students to submit after finalization
      // Only tests are run on submit, so props.uploadSubmission isn't
      if (this.state.selectedAssignment && this.state.selectedAssignment.course === 925) {
        const execute = () => {
          this.runTestsMock(this.state.submission!);
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
          onOk() {
            execute();
          },
          onCancel() {
            return;
          },
        });
      } else {
        // Prevent a student from submitting and hitting an api error if their submission is claimed or finalized
        message.warning(
          'This submission is currently being reviewed and cannot be re-uploaded. Please contact your instructor if you have any questions.',
          10,
        );
      }
    } else if (this.state.selectedAssignment) {
      this.setState({ status: STATUS.SAVING }, () => {
        if (this.state.selectedAssignment) {
          this.props
            // @ts-ignore
            .uploadSubmission(
              // @ts-ignore
              this.state.selectedAssignment!,
              this.state.selectedStudents,
              this.state.files,
              this.state.sendMeAConfirmationEmail,
            )
            .then((newSubmission: StudentSubmissionType | SubmissionInfoType) => {
              const shouldRun = this.shouldRunTests();
              if (shouldRun) {
                message.success('Submission uploaded!');
                this.runTests(newSubmission);
              }
              this.setState({
                submission: newSubmission,
                status: shouldRun ? STATUS.NONE : STATUS.COMPLETE,
                files: [],
                fileList: [],
                rejectedFiles: [],
                selectedStudents: this.props.selectedStudents,
                selectedAssignment: this.props.selectedAssignment ? this.props.selectedAssignment : undefined,
                activeTab: shouldRun ? '3' : '1',
              });
            })
            .catch((error: any) => {
              let logError;
              try {
                logError = !error.includes('Due date has passed');
              } catch (err) {
                logError = true;
              }

              if (logError) {
                message.error(
                  'Sorry, something went wrong. Please try uploading again. If the problem persists, contact the codePost team.',
                );
                const payload = {
                  error: error.toString(),
                  errorDetail: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                  url: window.location.href,
                };

                slack(`${process.env.REACT_APP_API_URL}/logs/logError/`, payload);
              }

              this.cancel();
            });
        }
      });
    }
  };

  // FIXME: this method of reading file contents relies on a race win, since
  // we need the fileReaders to finish before we hit upload.
  public beforeUpload = async (file: any, fileList: UploadFile[]) => {
    const ProtoFileUpload: IProtoFileUpload = fileToProtoFileUpload(file);

    try {
      const outputFiles = await readUploadedFile(file);

      const newFileList = this.state.fileList.filter((f: UploadFile) => {
        return f.name !== ProtoFileUpload.longname;
      });

      const newFiles = this.state.files.filter((f: IProtoFileUpload) => {
        return !outputFiles
          .map((outputFile: IProtoFileUpload) => {
            return outputFile.longname;
          })
          .includes(f.longname);
      });

      const fileNames = outputFiles
        .map((f: any) => {
          return [f.longname, f.zipSource];
        })
        .flat();

      const newFileListItem = { ...file, name: ProtoFileUpload.longname };

      this.setState({
        // Don't show files in the list that won't get uploaded
        fileList: fileNames.includes(ProtoFileUpload.longname) ? [...newFileList, newFileListItem] : newFileList,
        files: [...newFiles, ...outputFiles],
      });
    } catch (e) {
      this.setState({ rejectedFiles: [...this.state.rejectedFiles, ProtoFileUpload.longname] });
      message.error(e);
    }

    return Promise.reject();
  };

  /********************************************************************************************************/
  /* Testing infrastructure
  /********************************************************************************************************/

  /* Utility function used to determine whether we should run automated tests against student code when
   * code is uploaded.
   */
  public shouldRunTests = () => {
    const testsToRun =
      (this.state.selectedAssignment && this.state.selectedAssignment.exposeDumpLogs) ||
      this.state.testCategories.length > 0;

    // Has the student surpassed the maximum submission limit?
    const runsSoFar = this.state.submission ? this.state.submission.testRunsCompleted : 0;
    const maxRuns =
      this.state.selectedAssignment && this.state.selectedAssignment.maxStudentTestRuns
        ? this.state.selectedAssignment.maxStudentTestRuns
        : -1;

    return testsToRun && (maxRuns < 0 || runsSoFar < maxRuns);
  };

  public setResults = (result: SubmissionTestResultType) => {
    if (result) {
      // Note: we need to increment the testRunsCompleted in state, because a student could go back to the upload tab (without refreshing submission) and re-upload
      this.setState((prevState) => {
        return {
          submissionTests: result.submissionTests,
          testsLog: result.logs,
          runMessage: result.message,
          submission: prevState.submission
            ? { ...prevState.submission, testRunsCompleted: prevState.submission.testRunsCompleted + 1 }
            : undefined,
        };
      });
    }

    this.setState((prevState) => {
      return {
        loadingTests: false,
      };
    });
  };

  public runTests = async (submission: StudentSubmissionType | SubmissionInfoType) => {
    if (this.shouldRunTests()) {
      // Make sure the loading is set
      this.setState({ loadingTests: true });
      const result = await Environment.run({
        id: this.state.selectedAssignment!.environment!,
        submission: submission.id,
        simulate: false,
        exposedOnly: true,
      });
      awaitTestResult(result.task, this.setResults);
    }
  };

  // FIXME CIP: This is a method to run tests without uploading the files to a submission
  // It's purpose is to allow CIP students to submit and see test results after their
  //   submission has been claimed or finalized
  public runTestsMock = async (submission: StudentSubmissionType | SubmissionInfoType) => {
    if (this.shouldRunTests()) {
      // Make sure the loading is set
      this.setState({ loadingTests: true, activeTab: '3' });

      const filesJson = this.state.files.map((file: IProtoFileUpload) => {
        return {
          name: file.name,
          code: file.data,
          path: file.path === undefined || file.path === null ? '' : file.path,
        };
      });

      const payload = {
        id: this.state.selectedAssignment!.environment!,
        files: JSON.stringify(filesJson),
        submission: submission.id,
        simulate: true,
        exposedOnly: true,
      };

      const result = await Environment.run(payload);
      awaitTestResult(result.task, this.setMockResults);
    }
  };

  // FIXME CIP: This is a method to run tests without uploading the files to a submission
  public setMockResults = (result: TestEditorResultType) => {
    if (result) {
      // Note: we need to increment the testRunsCompleted in state, because a student could go back to the upload tab (without refreshing submission) and re-upload
      // @ts-ignore
      this.setState({
        // @ts-ignore
        submissionTests: result.results,
        testsLog: result.logs,
        runMessage: '',
      });
    }

    this.setState((prevState) => {
      return {
        loadingTests: false,
      };
    });
  };

  public toggleSendMeAConfirmationEmail = (e: any) => {
    const toggled = !this.state.sendMeAConfirmationEmail;
    LOCAL_SETTINGS.sendMeAConfirmationEmail.setter(toggled);
    this.setState({ sendMeAConfirmationEmail: toggled });
  };

  /********************************************************************************************************/

  public render() {
    const { isVisible } = this.props;
    const { status } = this.state;

    if (!isVisible) {
      return <div />;
    }

    // CIP FIXME - HARDCODED FOR CODE IN PLACE
    const hideDueDate = this.props.course && this.props.course.id === 925;

    let content;
    let sendMeAConfirmationEmailCheckbox = null;
    let goForwardButton = null;
    let goBackButton = null;
    switch (status) {
      case STATUS.COMPLETE:
        content = (
          <div>
            Uploading submissions: &nbsp; <Progress percent={100} size="small" />
            <br />
            <br />
            Upload complete!
          </div>
        );

        goBackButton = (
          <Button key="back" onClick={this.cancel.bind(this, undefined)}>
            Close
          </Button>
        );

        goForwardButton = (
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              this.props.isStudent && this.setState({ activeTab: '4' });
              this.onSuccess();
            }}
          >
            View files
          </Button>
        );
        break;
      case STATUS.SAVING:
        content = (
          <div>
            Uploading submissions: &nbsp; <Progress percent={0} size="small" />
          </div>
        );
        break;
      case STATUS.NONE:
        const studentOptions = this.buildStudentOptions(
          this.props.students,
          this.props.submissions,
          this.state.selectedAssignment,
        );

        const selectedStudents = this.state.selectedStudents.map((student) => {
          return {
            label: student,
            value: student,
          };
        });

        const rejectedFiles =
          this.state.rejectedFiles.length === 0 ? (
            <div />
          ) : (
            <div style={{ color: 'red', marginBottom: 10, marginTop: '10px' }}>
              The following files were not uploaded:{' '}
              {this.state.rejectedFiles.map((fileName, index) => {
                return `${fileName}${index === this.state.rejectedFiles.length - 1 ? '' : ', '}`;
              })}
            </div>
          );

        /*****************************************************************************************/
        /* Build list of settings and toggles
        /*****************************************************************************************/

        const settings = [
          {
            setting: 'Upload a directory',
            tooltip: 'Turn this on to upload nested folders.',
            variable: 'uploadDirectory' as keyof IUploadSubmissionDialogState,
          },
          // {
          //   setting: 'Upload an incomplete submission',
          //   tooltip: 'Turn this on to a submission missing required files.',
          //   variable: 'allowIncomplete' as keyof IUploadSubmissionDialogState,
          // },
          // {
          //   setting: 'Upload extra files',
          //   tooltip: 'Turn this on to upload files not specifed by the assignment.',
          //   variable: 'allowExtra' as keyof IUploadSubmissionDialogState,
          // },
        ];

        const settingList = (
          <span>
            {settings.map((setting) => (
              <span key={setting.setting}>
                {setting.setting} <CPTooltip title={setting.tooltip} infoIcon={true} /> &nbsp;{' '}
                <Switch
                  checked={this.getState(setting.variable)}
                  onClick={() => {
                    this.setState(this.toggleState(setting.variable));
                    return;
                  }}
                />
              </span>
            ))}
          </span>
        );

        /*****************************************************************************************/
        /* Build list of required and optional files
        /*****************************************************************************************/
        const requiredColumns = [
          { title: 'Assignment files', dataIndex: 'name', key: 'file' },
          { title: 'Uploaded', dataIndex: 'uploaded', key: 'uploaded', align: 'center' as const },
        ];

        const fileList =
          this.state.fileTemplates.length > 0 ? (
            <Table
              columns={requiredColumns}
              dataSource={this.state.fileTemplates.map((el) => {
                const exists = this.state.files.some((file) => file.name === el.name);
                return {
                  ...el,
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
          ) : (
            <span />
          );

        const unzippedFiles = this.state.files.filter((el) => el.zipSource !== undefined);

        /*****************************************************************************************/
        /* Build buttons
        /*****************************************************************************************/
        goBackButton = (
          <Button key="back" onClick={this.cancel.bind(this, undefined)}>
            Cancel
          </Button>
        );

        const disableUpload = !(
          this.state.selectedStudents.length > 0 &&
          this.state.files.length > 0 &&
          this.state.selectedAssignment
        );

        const areRequiredFilesPresent = this.state.fileTemplates.every(
          (ft) => !ft.required || this.state.files.some((el) => el.name === ft.name),
        );

        if (this.props.isStudent) {
          sendMeAConfirmationEmailCheckbox = (
            <span key="sendMeAConfirmationEmailCheckbox">
              {this.state.selectedAssignment !== undefined &&
              dueDatePassed(this.state.selectedAssignment) &&
              !hideDueDate ? (
                <Tag color="volcano">Due Date Passed</Tag>
              ) : null}
              <Checkbox
                key="send-me-a-confirmation-email"
                checked={this.state.sendMeAConfirmationEmail}
                onChange={this.toggleSendMeAConfirmationEmail}
              >
                Send me email confirmation
              </Checkbox>
              <CPTooltip
                title={
                  this.state.submission && this.state.submission.students && this.state.submission.students.length > 1
                    ? 'If checked, codePost will send you and your partners an email confirming a successful submission.'
                    : 'If checked, codePost will send you an email confirming a successful submission.'
                }
                infoIcon={true}
              />
              &nbsp; &nbsp;
            </span>
          );
        }

        goForwardButton = (
          <span key="goForwardButton" style={{ marginLeft: '8px' }}>
            <Button
              key="submit"
              type="primary"
              disabled={disableUpload || !areRequiredFilesPresent}
              onClick={this.confirmUpload}
            >
              Upload {this.shouldRunTests() && <CalculatorOutlined />}
            </Button>
            {this.state.selectedAssignment === undefined ? null : (
              <LateSubmissionModal
                visible={this.state.lateSubmissionModalVisible}
                assignment={this.state.selectedAssignment}
                onCancel={this.closeLateSubmissionModal}
                onOk={this.upload}
              />
            )}
          </span>
        );

        /*****************************************************************************************/

        // Address https://github.com/codepost-io/codePost-ui/issues/1039
        if (!this.props.isStudent && this.props.students.length === 0) {
          content = (
            <div>
              After you add students, you can upload their submissions here. <br />
              <br />{' '}
              <Link
                to={
                  this.props.course
                    ? `/admin/${encodeForLink(this.props.course.name)}/${encodeForLink(
                        this.props.course.period,
                      )}/roster/students`
                    : ''
                }
              >
                <Button>Add students</Button>
              </Link>
            </div>
          );
        } else {
          // Is this student allowed to run tests?
          const runsSoFar = this.state.submission ? this.state.submission.testRunsCompleted : 0;
          const maxRuns = this.state.selectedAssignment ? this.state.selectedAssignment.maxStudentTestRuns || -1 : -1;

          let testMessage;
          if (this.state.selectedAssignment && this.state.selectedAssignment.maxStudentTestRuns) {
            const numRemaining = Math.max(maxRuns - runsSoFar, 0);
            testMessage = (
              <Alert
                message={
                  <span>
                    You have used <b>{runsSoFar}</b> test runs so far. You have <b>{numRemaining}</b> test{' '}
                    {numRemaining === 1 ? 'run' : 'runs'} remaining.{' '}
                    {numRemaining === 0 ? ' You can still continue to submit, but no additional tests will be run' : ''}
                  </span>
                }
                type={numRemaining === 0 ? 'error' : numRemaining === 1 ? 'warning' : 'info'}
              />
            );
          }

          content = (
            <div>
              {this.props.infoMessage && (
                <Alert message={this.props.infoMessage} type={'info'} style={{ margin: '10px 0px' }} />
              )}
              Assignment:
              <Select
                defaultValue={
                  this.state.selectedAssignment
                    ? { value: this.state.selectedAssignment!.id, label: this.state.selectedAssignment!.name }
                    : {}
                }
                isDisabled={typeof this.props.selectedAssignment === 'object'}
                onChange={this.changeAssignment}
                options={this.assignmentOptions}
              />
              <br />
              <br />
              Students:{' '}
              {this.props.isStudent ? (
                <CPTooltip title={tooltips.admin.assignments.uploadSubmission} infoIcon={true} />
              ) : (
                <span />
              )}
              <Select
                placeholder={'Select students'}
                isMulti={true}
                value={selectedStudents}
                options={studentOptions}
                onChange={this.changeStudents}
                isDisabled={this.props.disableStudentSelect}
              />
              <Divider />
              {/*  beforeUpload prop stops Upload component from trying to upload files to external server */}
              {/*  FIXME: we should prevent users from uploading image files here */}
              {fileList}
              <br />
              {settingList}
              <br />
              <br />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Upload
                  beforeUpload={this.beforeUpload}
                  listType="text"
                  multiple={true}
                  onRemove={this.onRemove}
                  fileList={this.state.fileList}
                  directory={this.state.uploadDirectory}
                >
                  <Button>
                    <UploadOutlined /> Upload files
                  </Button>
                </Upload>
              </div>
              <span>
                {unzippedFiles.length > 0 ? (
                  <span>
                    <br />
                    <b>The following files will be unzipped and uploaded with the submission:</b>{' '}
                    <ul>
                      {unzippedFiles.map((el) => {
                        return (
                          <li>
                            {el.path}/{el.name}
                          </li>
                        );
                      })}
                    </ul>
                  </span>
                ) : (
                  <div />
                )}
              </span>
              <br />
              {rejectedFiles}
              {testMessage && (
                <div>
                  <Divider />
                  <div style={{ marginBottom: 15 }}>{testMessage}</div>
                </div>
              )}
            </div>
          );
        }
        break;
    }

    // We show tests tab if:
    //   Case A: There are test categories, and the student is not seeing the assignment for the first time in nudge mode
    //   Case B: There is a log to show. For example, assignments that only use file mode
    //   Case C: Tests are loading. This is for assignments that use file mode, and we want to show the students that tests are running
    // Also show it if loading, if the tests are running

    const showTestsTab =
      (this.state.testCategories.length > 0 &&
        (!this.state.selectedAssignment!.nudgeMode || this.state.submissionTests.length > 0)) ||
      this.state.testsLog ||
      this.state.loadingTests;

    return (
      <Modal
        visible={true}
        title={this.props.title || 'Upload Submissions'}
        onCancel={this.cancel}
        width={1100}
        footer={[sendMeAConfirmationEmailCheckbox, goBackButton, goForwardButton]}
      >
        {status !== STATUS.NONE || !this.props.isStudent ? (
          content
        ) : (
          <Tabs
            activeKey={this.state.activeTab || '1'}
            onChange={(activeKey) => this.setState({ activeTab: activeKey })}
          >
            <Tabs.TabPane tab="Submit" key="1">
              {content}
            </Tabs.TabPane>

            {this.state.selectedAssignment && this.state.selectedAssignment.explanation.length > 0 ? (
              <Tabs.TabPane tab="Instructions" key="2">
                <ReactMarkdown>{this.state.selectedAssignment.explanation}</ReactMarkdown>
              </Tabs.TabPane>
            ) : null}

            {this.state.selectedAssignment && this.state.selectedAssignment.allowStudentUploadWithPartners && (
              <Tabs.TabPane tab="Partners" key="partners">
                To add a partner to your submission, share this link with them.
                <InvitePartnersLink assignment={this.state.selectedAssignment} submission={this.state.submission} />
              </Tabs.TabPane>
            )}

            {showTestsTab && (
              <Tabs.TabPane tab="Tests" key="3">
                <div style={{ minHeight: 400, height: 'calc(100vh - 400px)' }}>
                  <TestsList
                    tests={this.state.submissionTests}
                    hideNotRun={false}
                    redactNotShown={this.state.selectedAssignment!.nudgeMode}
                    cases={this.state.testCases}
                    categories={this.state.testCategories}
                    isLoading={this.state.loadingTests}
                    logs={
                      this.state.testsLog === null || this.state.testsLog.length === 0 ? undefined : this.state.testsLog
                    }
                    showLogs={this.state.selectedAssignment!.exposeDumpLogs === true}
                    message={
                      <div>
                        {this.state.submissionTests.length > 0 && (
                          <Alert
                            type="info"
                            message={
                              <div>
                                Showing results from most recent submission at:{' '}
                                <CodePostDate datetime={this.state.submission!.dateUploaded || ''} />
                              </div>
                            }
                          />
                        )}
                        <br />
                        {this.state.runMessage && <Alert type="warning" message={this.state.runMessage} />}
                      </div>
                    }
                    hideSummary={this.state.testCategories.length === 0}
                  />
                </div>
              </Tabs.TabPane>
            )}

            {this.state.submission ? (
              <Tabs.TabPane tab="Most recent submission" key="4">
                <Alert
                  type="info"
                  message={
                    <div>
                      Showing results from most recent submission at:{' '}
                      <CodePostDate datetime={this.state.submission!.dateUploaded || ''} />
                    </div>
                  }
                />
                <br />
                <ViewUpload assignment={this.state.selectedAssignment} />
              </Tabs.TabPane>
            ) : null}
          </Tabs>
        )}
      </Modal>
    );
  }
}
export default UploadSubmissionDialog;
