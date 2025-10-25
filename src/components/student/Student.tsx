/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useCallback, useEffect, useState } from 'react';

import {
  DownloadOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  StopOutlined,
  UploadOutlined,
} from '@ant-design/icons';

/* antd imports */
import { Button, Modal, Space, Spin, Tag, Tooltip, message } from 'antd';
import type { ColumnType } from 'antd/es/table';

/* other library imports */
import { Link } from 'react-router-dom';
import { useHistory } from '../../router/legacy';

/* codePost imports */
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import CPFlex from '../core/CPFlex';

import { IAssignmentToSubmissionStudentMap, ICourseToAssignmentStudentMap, USER_TYPE } from '../../types/common';

import { AssignmentStudent, AssignmentStudentType, sortAssignments } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { loadIDList } from '../../infrastructure/generics';
import { StudentSubmissionType, Submission } from '../../infrastructure/submission';

import CPLayoutAdmin from '../admin/other/CPLayoutAdmin';

import Referral from '../core/Referral';
import RoleMenu from '../core/RoleMenu';

import { TableDetail } from '../admin/other/TableDetail';

import { openSubmission, openSubmissionInSameTab } from '../admin/other/AdminUtils';

import CPLogo from '../core/CPLogo';

import layoutVars from '../../styles/layout/_layoutVars';

import { IBaseFileUpload } from '../admin/assignments/assignments/SubmissionUpload/FileReader';
import UploadSubmissionDialog from '../admin/assignments/assignments/SubmissionUpload/UploadSubmissionDialog';

import { IComponentProps } from '../core/ComponentManager';

import CourseMenu, { encodedCourseLink } from '../core/CourseMenu';

import { CodePostDate } from '../utils/CodepostDate';

/**********************************************************************************************************************/

interface IStudentProps {
  uploadShortcut?: {
    assignmentID: number;
    files: IBaseFileUpload[];
  };
}

enum SUBMISSION_STATUS {
  ASSIGNMENT_NOT_PUBLISHED,
  NO_SUBMISSION,
  SUBMISSION_VIEWED,
  SUBMISSION_UNVIEWED,
}

enum CURRENT_PANEL {
  TABLE,
  UPLOADFILES,
  ADDFILES,
}

// Constants
const CODE_IN_PLACE_COURSE_ID = 925;

type StudentProps = IComponentProps & IWithWindowWatcherProps & IStudentProps;

// Helper functions
const getFileExtensionFromName = (fileName: string): string => {
  const split = fileName.split('.');
  return split.length === 1 ? 'txt' : split[split.length - 1];
};

/**
 * Student Console Component
 * Displays assignments, submissions, and allows students to upload/manage their work
 */
const StudentComponent: React.FC<StudentProps> = (props) => {
  const { initialCourses, currentCourse, user, uploadShortcut, handleLogout, windowwidth } = props;
  const history = useHistory();

  // State
  const [assignments, setAssignments] = useState<ICourseToAssignmentStudentMap>({});
  const [submissions, setSubmissions] = useState<IAssignmentToSubmissionStudentMap>({});
  const [viewsBySubmission, setViewsBySubmission] = useState<{ [submissionID: number]: boolean }>({});
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [currentPanel, setCurrentPanel] = useState<CURRENT_PANEL>(CURRENT_PANEL.TABLE);
  const [detailAssignment, setDetailAssignment] = useState<AssignmentStudentType | undefined>(undefined);
  const [detailSubmission, setDetailSubmission] = useState<StudentSubmissionType | undefined>(undefined);

  // Set document title
  useEffect(() => {
    document.title = 'codePost - Student Console';
  }, []);

  /***********************************************************************************
   * Loading methods
   **********************************************************************************/

  const loadAssignments = useCallback(
    async (courses: CourseType[]): Promise<ICourseToAssignmentStudentMap> => {
      const assignmentArrays = await Promise.all(
        courses.map((course: CourseType) => loadIDList<AssignmentStudentType>(course.assignments, AssignmentStudent)),
      );

      const result: ICourseToAssignmentStudentMap = {};
      courses.forEach((course, i) => {
        result[course.id] = assignmentArrays[i].filter(
          (a) =>
            a.isVisible && !a.hideFrom.some((shouldHide: number) => user.student_sections.indexOf(shouldHide) > -1),
        );
      });

      return result;
    },
    [user.student_sections],
  );

  const loadSubmissions = useCallback(
    async (assignmentList: AssignmentStudentType[]): Promise<IAssignmentToSubmissionStudentMap> => {
      const submissionsMap: IAssignmentToSubmissionStudentMap = {};

      // Create a shallow copy to prevent mutations during async operations
      const assignmentsCopy = [...assignmentList];

      for (const assignment of assignmentsCopy) {
        if (assignment.isReleased || assignment.allowStudentUpload || assignment.liveFeedbackMode) {
          submissionsMap[assignment.id] = await AssignmentStudent.readSubmissions(assignment.id, {
            student: user.email,
            compact: '1',
          });
        }
      }
      return submissionsMap;
    },
    [user.email],
  );
  const loadHistories = useCallback(
    async (
      submissionsMap: IAssignmentToSubmissionStudentMap,
      email: string,
    ): Promise<{ [submissionID: number]: boolean }> => {
      const viewMap: { [submissionID: number]: boolean } = {};
      const keys = Object.keys(submissionsMap);
      for (const key of keys) {
        const submissionList: StudentSubmissionType[] = submissionsMap[+key];
        if (submissionList.length > 0) {
          const submission = submissionList[0];
          const history = await Submission.readHistory(submission.id, { student: email });
          for (const historyItem of history) {
            if (historyItem.student === email) {
              viewMap[submission.id] = historyItem.hasViewed;
            }
          }
        }
      }
      return viewMap;
    },
    [],
  );

  /***********************************************************************************
   * Main load function
   **********************************************************************************/

  const load = useCallback(async () => {
    const loadedAssignments = await loadAssignments(initialCourses);
    setAssignments(loadedAssignments);
    setIsLoadingAssignments(false);

    if (currentCourse) {
      // Handle shortcutting to a specific assignment
      if (uploadShortcut !== undefined && !currentCourse.assignments.includes(uploadShortcut.assignmentID)) {
        const foundCourse = initialCourses.find((course: CourseType) => {
          return course.assignments.includes(uploadShortcut.assignmentID);
        });

        if (foundCourse !== undefined) {
          const link = encodedCourseLink('student', foundCourse);
          history.push(link);
        }
      }

      const loadedSubmissions = await loadSubmissions(loadedAssignments[currentCourse.id]);
      const viewMap = await loadHistories(loadedSubmissions, user.email);

      // Open the upload panel for the specified assignment
      if (uploadShortcut !== undefined) {
        const assignment = loadedAssignments[currentCourse.id].find((a: AssignmentStudentType) => {
          return a.id === uploadShortcut.assignmentID;
        });

        if (assignment !== undefined) {
          let submission;
          if (
            Object.prototype.hasOwnProperty.call(loadedSubmissions, assignment.id) &&
            loadedSubmissions[assignment.id].length > 0
          ) {
            submission = loadedSubmissions[assignment.id][0];
          }

          // We'll call changePanel after it's defined
          setCurrentPanel(CURRENT_PANEL.UPLOADFILES);
          setDetailAssignment(assignment);
          setDetailSubmission(submission);
        }
      }

      setSubmissions(loadedSubmissions);
      setViewsBySubmission(viewMap);
      setIsLoadingSubmissions(false);
    }
  }, [
    loadAssignments,
    loadSubmissions,
    loadHistories,
    initialCourses,
    currentCourse,
    uploadShortcut,
    user.email,
    history,
  ]);

  // Load data on mount and when uploadShortcut changes
  useEffect(() => {
    load();
  }, [load]);

  /***********************************************************************************
   * Handler methods
   **********************************************************************************/

  const markViewed = useCallback(
    async (submission: StudentSubmissionType) => {
      const history = await Submission.readHistory(submission.id, {
        student: user.email,
      });
      if (history && history[0] && !history[0].hasViewed) {
        return await Submission.updateHistory({ id: submission.id, hasViewed: true }, { student: user.email });
      }
      return;
    },
    [user.email],
  );

  const openAndMarkViewed = useCallback(
    (submission: StudentSubmissionType) => {
      openSubmissionInSameTab(submission.id);
      markViewed(submission);
    },
    [markViewed],
  );

  const changePanel = useCallback(
    async (newPanel: CURRENT_PANEL, assignment?: AssignmentStudentType, submission?: StudentSubmissionType) => {
      let latestSubmission: StudentSubmissionType | undefined;
      if (submission) {
        const fetchSubmissions = await AssignmentStudent.readSubmissions(submission.assignment, {
          student: user.email,
          compact: '1',
        });
        latestSubmission = fetchSubmissions.length > 0 ? fetchSubmissions[0] : undefined;
      }
      setCurrentPanel(newPanel);
      setDetailAssignment(assignment);
      setDetailSubmission(latestSubmission || submission);
    },
    [user.email],
  );

  // Use the extracted helper function
  const getFileExtension = getFileExtensionFromName;

  // Upload a submission as a student
  const uploadSubmission = useCallback(
    (
      isNew: boolean,
      assignment: AssignmentStudentType,
      partners: string[],
      files: Array<{ name: string; data: string; path: string }>,
      sendConfirmationEmail: boolean = false,
    ) => {
      if (partners.length === 0) {
        return Promise.reject();
      }

      const formattedFiles = files.map((file) => {
        return {
          name: file.name,
          data: file.data,
          extension: getFileExtension(file.name),
          path: file.path,
        };
      });

      const payload = {
        id: assignment.id,
        files: formattedFiles,
        sendConfirmationEmail,
      };

      const submission1 = isNew
        ? AssignmentStudent.createStudentUpload(payload)
        : AssignmentStudent.updateStudentUpload(payload);

      return submission1.then((newSub) => {
        setSubmissions((prevSubmissions) => ({
          ...prevSubmissions,
          [assignment.id]: [newSub],
        }));
        return newSub;
      });
    },
    [getFileExtension],
  );

  const onUploadSuccess = useCallback(
    (newSubmissionID: number) => {
      if (!detailAssignment) {
        changePanel(CURRENT_PANEL.TABLE, undefined, undefined);
        return;
      }

      if (detailAssignment.liveFeedbackMode) {
        if (localStorage.getItem('source') !== 'codePost') {
          openSubmissionInSameTab(newSubmissionID);
        } else {
          openSubmission(newSubmissionID);
        }
        changePanel(CURRENT_PANEL.TABLE, undefined, undefined);
      }
    },
    [detailAssignment, changePanel],
  );

  /**
   * Downloads assignment files as a zip archive
   */
  const downloadAssignment = useCallback(async (assignmentId: number, assignmentName: string) => {
    try {
      const response = await AssignmentStudent.downloadAssignmentZip(assignmentId);
      const linkSource = `data:application/zip;base64,${response.zip}`;

      const a = document.createElement('a');
      a.href = linkSource;
      a.download = `${assignmentName.replace(/\s+/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      message.error('Failed to download assignment');
    }
  }, []);

  const getUploadContent = useCallback(
    (assignment: AssignmentStudentType, submission?: StudentSubmissionType) => {
      if (!assignment.allowStudentUpload) {
        return null;
      }

      const hideDueDate = currentCourse?.id === CODE_IN_PLACE_COURSE_ID;

      // Present the assignment's due date to the student
      const dueDateText =
        assignment.uploadDueDate && !hideDueDate ? (
          <span>
            Due: &nbsp;
            <CodePostDate datetime={assignment.uploadDueDate} />
          </span>
        ) : (
          ''
        );

      // If the student has submitted, show the datetime of the student's most recent upload
      const uploadDateText = submission?.dateUploaded ? (
        <div>
          Uploaded: <CodePostDate datetime={submission.dateUploaded} />
        </div>
      ) : null;

      const uploadButton = (
        <span>
          <Tooltip title={submission && assignment.liveFeedbackMode ? 'Replace submission.' : 'Upload assignment.'}>
            <Button
              icon={<UploadOutlined />}
              type="primary"
              style={{ maxWidth: 180 }}
              disabled={false}
              onClick={() => {
                if (submission && assignment.liveFeedbackMode) {
                  Modal.confirm({
                    title: 'Confirm file replacement',
                    content: (
                      <div>
                        <p>
                          If you replace your files, it will delete existing files and file versions, including any
                          comments on those files.
                        </p>
                        <p>
                          If you want to add a file to your submission or update a file click 'Add/Update files'
                          instead.
                        </p>
                        <p>
                          <b>Are you sure you want to continue?</b>
                        </p>
                      </div>
                    ),
                    okText: 'Continue',
                    cancelText: 'Cancel',
                    onOk: () => changePanel(CURRENT_PANEL.UPLOADFILES, assignment, submission),
                  });
                } else {
                  changePanel(CURRENT_PANEL.UPLOADFILES, assignment, submission);
                }
              }}
            >
              Upload assignment
            </Button>
          </Tooltip>
        </span>
      );

      const addFileButton =
        !assignment.liveFeedbackMode || submission === undefined ? null : (
          <Button
            icon={<PlusOutlined />}
            style={{ maxWidth: 160 }}
            onClick={() => changePanel(CURRENT_PANEL.ADDFILES, assignment, submission)}
            disabled={submission === undefined || submission.isFinalized}
          >
            Add/Update files
          </Button>
        );

      const downloadButton =
        assignment.files && assignment.files.length > 0 ? (
          <Tooltip title="Download assignment files">
            <Button
              icon={<DownloadOutlined />}
              style={{ maxWidth: 180 }}
              onClick={() => downloadAssignment(assignment.id, assignment.name)}
            >
              Download assignment
            </Button>
          </Tooltip>
        ) : null;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 2.2,
          }}
        >
          <div>{uploadDateText}</div>
          {dueDateText}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 15, flexWrap: 'wrap' }}>
            <Space.Compact>
              {downloadButton}
              {assignment.isReleased && assignment.allowStudentUpload && uploadButton}
              {addFileButton}
            </Space.Compact>
          </div>
        </div>
      );
    },
    [currentCourse, changePanel, downloadAssignment],
  );

  /***********************************************************************************
   * Content area - Assignment Table Builder
   **********************************************************************************/

  const buildAssignmentsTable = useCallback(
    (assignmentList: AssignmentStudentType[], submissionsMap: IAssignmentToSubmissionStudentMap) => {
      const modifyIf = (modMap: { [statusTarget: number]: number }) => {
        return (row: { statusType: SUBMISSION_STATUS }) => {
          const obj = {
            colSpan: 1,
            align: '' as 'left' | 'center' | 'right' | undefined,
          };

          if (row.statusType in modMap) {
            obj.colSpan = modMap[row.statusType];
            obj.align = 'center' as const;
          }
          return obj;
        };
      };

      // We pre-calculate showGrades and showColumns to figure out the column spans
      let showGrades = true;
      let showPartners = true;

      if (assignmentList) {
        // If one visible assignment doesn't have hideGrades turned on, show the grades column
        const visibleAssignments = assignmentList.filter((assn) => assn.isVisible);
        showGrades = visibleAssignments.some((assn) => {
          return !assn.hideGrades;
        });
        // If one visible assignment isn't student upload, or is student upload and allows partners, show partners
        showPartners = visibleAssignments.some((assn) => {
          const hidePartners = assn.allowStudentUpload && !assn.allowStudentUploadWithPartners;
          return !hidePartners;
        });
      }

      const aligner: 'left' | 'center' | 'right' = 'center';
      // ModifyIF re-sets the column span of certain columns based on things we should show
      // Code is the first column
      // If there is no submission, it expands to take up the grades and partners columns (span = 3)
      // If the submission isn't viewed, it expands to take up the grade column (span = 2)
      type TableRowData = {
        key: string;
        assignment: string;
        statusType: SUBMISSION_STATUS;
        code: React.ReactNode;
        grade?: React.ReactNode;
        partners?: React.ReactNode;
        upload?: React.ReactNode;
        stats?: React.ReactNode;
        disabled?: boolean;
      };
      let columns: ColumnType<TableRowData>[] = [
        {
          title: 'Assignment',
          dataIndex: 'assignment',
          key: 'assignment',
        },
        {
          title: 'Code',
          dataIndex: 'code',
          key: 'code',
          align: aligner,
          onCell: modifyIf({
            [SUBMISSION_STATUS.NO_SUBMISSION]: 1 + Number(showGrades) + Number(showPartners),
            [SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED]: 1 + Number(showGrades) + Number(showPartners),
            [SUBMISSION_STATUS.SUBMISSION_UNVIEWED]: 1 + Number(showGrades),
          }),
        },
      ];

      // Optional upload column
      const uploadColumn = {
        title: 'Information',
        dataIndex: 'upload',
        key: 'upload',
        align: aligner,
      };

      const gradeColumn = {
        title: 'Grade',
        dataIndex: 'grade',
        key: 'grade',
        align: aligner,
        onCell: modifyIf({
          [SUBMISSION_STATUS.NO_SUBMISSION]: 0,
          [SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED]: 0,
          [SUBMISSION_STATUS.SUBMISSION_UNVIEWED]: 0,
        }),
      };

      const partnerColumn = {
        title: 'Partners',
        dataIndex: 'partners',
        key: 'partners',
        onCell: modifyIf({
          [SUBMISSION_STATUS.NO_SUBMISSION]: 0,
          [SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED]: 0,
        }),
        align: aligner,
      };

      const statsColumn = {
        title: 'Stats',
        dataIndex: 'stats',
        key: 'stats',
        align: aligner,
      };

      if (assignmentList) {
        // if any of the visible assignments have a property to conditionally show a column, add it to columns
        const visibleAssignments = assignmentList.filter((assn) => assn.isVisible);
        columns = showPartners ? [...columns, partnerColumn] : columns;
        columns = showGrades ? [...columns, gradeColumn] : columns;
        columns = visibleAssignments.some((assn) => {
          return assn.allowStudentUpload;
        })
          ? [...columns, uploadColumn]
          : columns;
        columns =
          currentCourse &&
          currentCourse.showStudentsStatistics &&
          visibleAssignments.some((assn) => {
            return assn.mean || assn.median;
          })
            ? [...columns, statsColumn]
            : columns;
      }

      const data = sortAssignments(assignmentList).map((assignment) => {
        const submission = assignment.id in submissionsMap ? submissionsMap[assignment.id][0] : undefined;
        const uploadContent = getUploadContent(assignment, submission);

        if (!assignment.isReleased && !assignment.liveFeedbackMode) {
          // Case 1: assignment is not published and is not in live feedback mode
          return {
            key: assignment.name,
            assignment: assignment.name,
            statusType: SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED,
            code: (
              <div>
                {' '}
                <StopOutlined /> &nbsp; Assignment not yet published
              </div>
            ),
            disabled: true,
            upload: uploadContent,
          };
        } else {
          const hasStats = assignment.mean || assignment.median;
          let statsContent;
          if (hasStats) {
            statsContent = (
              <div>
                Mean: {assignment.mean}/{assignment.points} <br /> Median: {assignment.median}/{assignment.points}
              </div>
            );
          }

          const toRet = {
            key: assignment.name,
            assignment: assignment.name,
            stats: hasStats ? statsContent : '--',
            upload: uploadContent,
          };

          if (submission === undefined) {
            // Case 2: assignment is published, but student has no submission OR submission isn't finalized
            const missingText = assignment.allowStudentUpload
              ? "You haven't uploaded any code yet"
              : "Your instructor hasn't transferred your submission to codePost yet";
            return {
              ...toRet,
              code: (
                <div>
                  <MinusCircleOutlined /> &nbsp; {missingText}
                </div>
              ),
              statusType: SUBMISSION_STATUS.NO_SUBMISSION,
            };
          } else if (!submission.isFinalized && !assignment.liveFeedbackMode) {
            // Case 2: assignment is published, but student has no submission OR submission isn't finalized

            const msg = (
              <div>
                <MinusCircleOutlined /> &nbsp; Your submission hasn't been reviewed yet
              </div>
            );

            return {
              ...toRet,
              code: msg,
              statusType: SUBMISSION_STATUS.NO_SUBMISSION,
            };
          } else {
            // Case 3: assignment is published, and student has a submission

            const open = () => {
              markViewed(submission).then(() => openSubmissionInSameTab(submission.id));
            };

            // Show Grade if the submission history doesn't exist (legacy), or if the submission has been viewed
            const showGrade = !(submission.id in viewsBySubmission) || viewsBySubmission[submission.id];
            return {
              ...toRet,
              partners:
                submission.students !== undefined && submission.students.length === 1
                  ? '--'
                  : submission.students !== undefined &&
                    submission.students
                      .filter((student) => {
                        return student !== user.email;
                      })
                      .join(', '),
              grade: showGrade ? (
                submission.grade !== null && submission.grade !== undefined ? (
                  `${submission.grade}/${assignment.points}`
                ) : null
              ) : windowwidth > layoutVars.breakpoints.mobile.student ? (
                <Tag onClick={() => openAndMarkViewed(submission)} style={{ cursor: 'pointer' }}>
                  View feedback
                </Tag>
              ) : (
                <Tag>Login on desktop to view</Tag>
              ),
              code: <Button onClick={open}>View feedback</Button>,
              statusType: showGrade ? SUBMISSION_STATUS.SUBMISSION_VIEWED : SUBMISSION_STATUS.SUBMISSION_UNVIEWED,
            };
          }
        }
      });

      return { columns, data };
    },
    [currentCourse, getUploadContent, markViewed, viewsBySubmission, user.email, windowwidth, openAndMarkViewed],
  );

  const calculateLateDayCreditsAvailable = useCallback(
    (submissionsMap: IAssignmentToSubmissionStudentMap): number => {
      if (!currentCourse?.lateDayCreditsAllowable) {
        return 0;
      }

      const totalUsed = Object.values(submissionsMap)
        .flat()
        .reduce((sum, sub) => sum + (sub.lateDayCreditsUsed || 0), 0);

      return currentCourse.lateDayCreditsAllowable - totalUsed;
    },
    [currentCourse],
  );

  const getLateDayCreditsComponent = useCallback(() => {
    if (!currentCourse || currentCourse.lateDayCreditsAllowable === null) {
      return null;
    }

    const lateDayCreditsAvailable = calculateLateDayCreditsAvailable(submissions);

    return <div>Late Day Credits: {isLoadingSubmissions ? '--' : lateDayCreditsAvailable}</div>;
  }, [currentCourse, calculateLateDayCreditsAvailable, submissions, isLoadingSubmissions]);

  /***********************************************************************************
  /* Render function
  /**********************************************************************************/

  // Render content
  let studentContent;
  // if not loaded yet, render a get started div
  if (!currentCourse) {
    studentContent = (
      <div style={{ padding: '40px', fontSize: 28 }}>
        <div>Select course</div>
      </div>
    );
  } else if (!assignments[currentCourse.id]) {
    // Assignments haven't finished loading
    studentContent = <Spin />;
  } else {
    const lateDayCredits = getLateDayCreditsComponent();

    const assignmentList = assignments[currentCourse.id];
    const { columns, data } = buildAssignmentsTable(assignmentList, submissions);
    const rowClassName = (record: { disabled?: boolean }, _index: number) => {
      if (record.disabled) {
        return 'disabled-row';
      } else {
        return '';
      }
    };

    const defaultFiles =
      uploadShortcut !== undefined &&
      detailAssignment !== undefined &&
      uploadShortcut.assignmentID === detailAssignment.id
        ? uploadShortcut.files
        : undefined;

    studentContent = (
      <div>
        <TableDetail
          loadComplete={!isLoadingAssignments && !isLoadingSubmissions}
          isEmpty={assignmentList.length === 0}
          title={`${currentCourse.name} | ${currentCourse.period}`}
          emptyNode={<div>Empty...</div>}
          actions={[lateDayCredits]}
          columns={columns}
          data={data}
          pagination={false}
          hideSearch={true}
          tableProps={{ rowClassName, bordered: true }}
        />
        <UploadSubmissionDialog
          isVisible={currentPanel === CURRENT_PANEL.UPLOADFILES || currentPanel === CURRENT_PANEL.ADDFILES}
          onCancel={() => changePanel(CURRENT_PANEL.TABLE, detailAssignment, undefined)}
          assignments={assignmentList}
          selectedAssignment={detailAssignment}
          students={[]}
          selectedStudents={detailSubmission && detailSubmission.students ? detailSubmission.students : [user.email]}
          submissions={
            detailSubmission
              ? { [user.email]: { [detailSubmission.assignment]: detailSubmission } }
              : { [user.email]: {} }
          }
          uploadSubmission={(assignment: any, partners: any, files: any, sendConfirmationEmail: any) =>
            uploadSubmission(
              currentPanel !== CURRENT_PANEL.ADDFILES,
              assignment,
              partners,
              files,
              sendConfirmationEmail,
            )
          }
          disableStudentSelect={true}
          onSuccess={onUploadSuccess}
          isStudent={true}
          defaultFiles={defaultFiles}
        />
      </div>
    );
  }

  /* Build header */
  const openHome = () => {
    if (localStorage.getItem('source') === 'codePost') {
      window.open('https://codepost.cs.rutgers.edu', '_blank');
    }
  };

  const header = (
    <CPFlex
      left={[
        <CPLogo cpType="dark" key="logo" onClick={openHome} />,
        <span key="empty" />,
        <CourseMenu key="course" courses={initialCourses} currentCourse={currentCourse} base="student" />,
      ]}
      right={[
        <span key="user" className="cp-label cp-label--bold">
          {user.email}
        </span>,
        <Referral key="referral" user={user} theme="light" />,
        <RoleMenu key="roles" user={user} thisApp={USER_TYPE.STUDENT} theme="light" />,
        <Link className="internal-link" key="settings" to="/settings">
          <SettingOutlined />
        </Link>,
        <Button key="logout" onClick={handleLogout}>
          Log Out
        </Button>,
      ]}
      gutterSize={10}
    />
  );

  return (
    <div id="Student">
      <CPLayoutAdmin
        header={header}
        detail={studentContent}
        navigation={() => null}
        collapsible={true}
        hasSider={false}
        role={USER_TYPE.STUDENT}
      />
    </div>
  );
};

const Student = withWindowWatcher(StudentComponent);
export default Student;
