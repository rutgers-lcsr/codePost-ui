/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Alert, Button, Icon, Modal, Spin, Tag, Typography } from 'antd';

/* other library imports */
import moment from 'moment';
import { Link } from 'react-router-dom';

/* codePost imports */
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import CPFlex from '../core/CPFlex';

import { IAssignmentToSubmissionStudentMap, ICourseToAssignmentStudentMap, USER_TYPE } from '../../types/common';

import { AssignmentStudent, AssignmentStudentType, sortAssignments } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { loadIDList } from '../../infrastructure/generics';
import { StudentSubmissionType, Submission } from '../../infrastructure/submission';

import CPLayoutAdmin from '../admin/other/CPLayoutAdmin';

import RoleMenu from '../core/RoleMenu';
import Referral from '../core/Referral';

import { TableDetail } from '../admin/other/TableDetail';

import { openSubmission } from '../admin/other/AdminUtils';

import CPLogo from '../core/CPLogo';

import layoutVars from '../../styles/layout/_layoutVars';

import UploadSubmissionDialog from '../admin/assignments/assignments/UploadSubmissionDialog';

import LateSubmissionModal from './LateSubmissionModal';
import ViewUpload from './ViewUpload';

import { IComponentProps } from '../core/ComponentManager';

import CourseMenu from '../core/CourseMenu';

import { CodePostDate } from '../utils/DateUtils';

const { Text } = Typography;

/**********************************************************************************************************************/

interface IStudentState {
  assignments: ICourseToAssignmentStudentMap;
  submissions: IAssignmentToSubmissionStudentMap;
  viewsBySubmission: { [submissionID: number]: boolean };

  // Loading variables
  isLoadingAssignments: boolean;
  isLoadingSubmissions: boolean;

  currentPanel: CURRENT_PANEL;
  detailAssignment?: AssignmentStudentType;
  detailSubmission?: StudentSubmissionType;

  lateSubmissionModalAssignment: AssignmentStudentType | null;
}

enum SUBMISSION_STATUS {
  ASSIGNMENT_NOT_PUBLISHED,
  NO_SUBMISSION,
  SUBMISSION_VIEWED,
  SUBMISSION_UNVIEWED,
}

enum CURRENT_PANEL {
  TABLE,
  VIEWFILES,
  UPLOADFILES,
  ADDFILES,
}

class Student extends React.Component<IComponentProps & IWithWindowWatcherProps, IStudentState> {
  public constructor(props: IComponentProps & IWithWindowWatcherProps) {
    super(props);
    document.title = 'codePost - Student Console';
    this.state = {
      assignments: {},
      submissions: {},
      viewsBySubmission: {},
      isLoadingAssignments: true,
      isLoadingSubmissions: true,
      currentPanel: CURRENT_PANEL.TABLE,
      detailAssignment: undefined,
      detailSubmission: undefined,
      lateSubmissionModalAssignment: null,
    };
  }

  /***********************************************************************************
  /* Lifecycle methods
  /**********************************************************************************/

  public componentDidMount() {
    this.loadAssignments(this.props.initialCourses).then((assignments) => {
      this.setState({ assignments, isLoadingAssignments: false }, () => {
        if (this.props.currentCourse) {
          this.loadSubmissions(this.state.assignments[this.props.currentCourse.id]).then((submissions) => {
            this.loadHistories(Object.values(submissions), this.props.user.email).then(
              (viewMap: { [submissionID: number]: boolean }) => {
                this.setState({
                  submissions,
                  viewsBySubmission: viewMap,
                  isLoadingSubmissions: false,
                });
              },
            );
          });
        }
      });
    });
  }

  /***********************************************************************************
  /* Loading methods
  /**********************************************************************************/

  public loadAssignments = async (courses: CourseType[]) => {
    return Promise.all(
      courses.map((course: CourseType) => {
        return loadIDList(course.assignments, AssignmentStudent);
      }),
    ).then((assignments) => {
      const toRet: any = {};
      courses.forEach((course, i) => {
        toRet[course.id] = assignments[i];
      });

      return toRet;
    });
  };

  public loadSubmissions = async (assignments: AssignmentStudentType[]) => {
    const submissions: any = {};
    for (const assignment of assignments) {
      if (assignment.isReleased || assignment.allowStudentUpload || assignment.liveFeedbackMode) {
        submissions[assignment.id] = await AssignmentStudent.readSubmissions(assignment.id, {
          student: this.props.user.email,
          ['compact']: '1',
        });
      }
    }

    return submissions;
  };

  public loadHistories = async (submissions: IAssignmentToSubmissionStudentMap, email: string) => {
    const toRet: any = {};
    const keys = Object.keys(submissions);
    for (const key of keys) {
      const submissionList: StudentSubmissionType[] = submissions[+key];
      if (submissionList.length > 0) {
        const submission = submissionList[0];
        const history = await Submission.readHistory(submission.id, {
          student: email,
        });
        for (const historyItem of history) {
          if (historyItem.student === email) {
            toRet[submission.id] = historyItem.hasViewed;
          }
        }
      }
    }

    return toRet;
  };

  /***********************************************************************************
  /* Handlers
  /**********************************************************************************/
  public openAndMarkViewed = (submission: StudentSubmissionType) => {
    openSubmission(submission.id);
    this.markViewed(submission);
  };

  public markViewed = async (submission: StudentSubmissionType) => {
    // Get the history
    const history = await Submission.readHistory(submission.id, {
      student: this.props.user.email,
    });
    // If it has a history object, and has not been viewed, mark it as viewed
    if (history && history[0] && !history[0].hasViewed) {
      return await Submission.updateHistory({ id: submission.id, hasViewed: true }, { student: this.props.user.email });
    }
    // If empty, this submission does not have a history object. It was created before tracking was implemented
    return;
  };

  public openLateSubmissionModalAssignment = (assignment: AssignmentStudentType) => {
    this.setState({ lateSubmissionModalAssignment: assignment });
  };

  public closeLateSubmissionModalAssignment = () => {
    this.setState({ lateSubmissionModalAssignment: null });
  };

  public changePanel = async (
    newPanel: CURRENT_PANEL,
    assignment?: AssignmentStudentType,
    submission?: StudentSubmissionType,
  ) => {
    // We  get the latest submission on submission select to get the most up to date test runs remaining
    // The alternative would be to store the updated submission in state on submit, but we'd get api errors if students
    // submit through multiple tabs / think they might be able to game the system
    let latestSubmission: StudentSubmissionType | undefined;
    if (submission) {
      const fetchSubmissions = await AssignmentStudent.readSubmissions(submission.assignment, {
        student: this.props.user.email,
        ['compact']: '1',
      });
      latestSubmission = fetchSubmissions.length > 0 ? fetchSubmissions[0] : undefined;
    }
    this.setState({
      currentPanel: newPanel,
      detailAssignment: assignment,
      detailSubmission: latestSubmission || submission,
      lateSubmissionModalAssignment: null,
    });
  };

  public getFileExtension = (fileName: string): string => {
    const split = fileName.split('.');
    return split.length === 1 ? 'txt' : split[split.length - 1];
  };

  // Upload a submission as a student
  public uploadSubmission = (isNew: boolean, assignment: AssignmentStudentType, partners: string[], files: any[]) => {
    if (partners.length === 0) {
      return Promise.reject();
    }

    let formattedFiles = files.map((file) => {
      return {
        name: file.name,
        code: file.data,
        extension: this.getFileExtension(file.name),
        path: file.path,
      };
    });

    const payload = {
      id: assignment.id,
      files: formattedFiles,
    };

    const submission1 = isNew
      ? AssignmentStudent.createStudentUpload(payload)
      : AssignmentStudent.updateStudentUpload(payload);

    return submission1.then((newSub) => {
      const submissions = this.state.submissions;
      submissions[assignment.id] = [newSub];
      this.setState({ submissions });
      return newSub;
    });
  };

  public onUploadSuccess = (newSubmissionID: number) => {
    const assignment = this.state.detailAssignment;

    if (!assignment) {
      this.changePanel(CURRENT_PANEL.TABLE, undefined, undefined);
      return;
    }

    if (assignment.liveFeedbackMode) {
      openSubmission(newSubmissionID);
      this.changePanel(CURRENT_PANEL.TABLE, undefined, undefined);
    } else {
      this.changePanel(CURRENT_PANEL.VIEWFILES, assignment, undefined);
    }
  };

  public getUploadContent = (assignment: AssignmentStudentType, submission?: StudentSubmissionType) => {
    if (!assignment.allowStudentUpload) {
      // Case 0: Student upload not allowed
      return <div />;
    }

    const hasSubmission = submission !== undefined;

    // Algorithm for computing
    const two_hours = 3.6e6 * 2; // ms grace period
    const dueDatePassed = assignment.uploadDueDate && Date.parse(assignment.uploadDueDate) + two_hours <= Date.now();
    const isFinalized = submission !== undefined && submission.isFinalized;
    const canUploadLate = assignment.allowLateUploads;

    const canUpload = (!dueDatePassed || canUploadLate) && (assignment.liveFeedbackMode || !isFinalized);

    // Present the assignment's due date to the student
    const dueDate = assignment.uploadDueDate ? (
      <span>
        Due date: &nbsp;
        <CodePostDate datetime={assignment.uploadDueDate} />
      </span>
    ) : (
      ''
    );
    const dueDateText = (
      <span>
        <Text>{dueDate}</Text>
        {dueDatePassed ? (
          <span>
            &nbsp; <Tag color="volcano">Due date passed</Tag>
          </span>
        ) : null}
      </span>
    );

    // If the student has submitted, show the datetime of the student's most recent upload
    const uploadDateText =
      submission !== undefined ? <div>Uploaded: {moment(submission.dateUploaded).format('llll')}</div> : null;

    // If the student can upload, give them the option to POST or PATCH submission
    let buttonText;
    if (hasSubmission) {
      buttonText = 'Replace files';
    } else {
      buttonText = 'Upload files';
    }
    const uploadButton = (
      <span>
        <Button
          icon="upload"
          type="primary"
          style={{ maxWidth: 180 }}
          disabled={!canUpload}
          onClick={() => {
            if (submission && assignment.liveFeedbackMode) {
              Modal.confirm({
                title: 'Confirm file replacement',
                content: (
                  <div>
                    <p>
                      Replacing your files will delete existing files and file versions, including any comments on those
                      files.
                    </p>
                    <p>
                      If you want to add a file to your submission or update a file click 'Add/Update files' instead.
                    </p>
                    <p>
                      <b>Are you sure you want to continue?</b>
                    </p>
                  </div>
                ),
                okText: 'Continue',
                cancelText: 'Cancel',
                onOk: this.changePanel.bind(this, CURRENT_PANEL.UPLOADFILES, assignment, submission),
              });
            } else if (dueDatePassed) {
              this.openLateSubmissionModalAssignment(assignment);
              {
                /*Modal.confirm({
                title: 'Confirm late submission',
                content: `The due date for this submission has passed, so your submission will be logged as late.`,
                okText: 'Continue',
                cancelText: 'Cancel',
                onOk: this.changePanel.bind(this, CURRENT_PANEL.UPLOADFILES, assignment, submission),
              });*/
              }
            } else {
              this.changePanel(CURRENT_PANEL.UPLOADFILES, assignment, submission);
            }
          }}
        >
          {buttonText}
        </Button>
        {dueDatePassed ? (
          <LateSubmissionModal
            visible={
              this.state.lateSubmissionModalAssignment !== null &&
              this.state.lateSubmissionModalAssignment.id === assignment.id
            }
            assignment={assignment}
            onCancel={this.closeLateSubmissionModalAssignment}
            onOk={this.changePanel.bind(this, CURRENT_PANEL.UPLOADFILES, assignment, submission)}
          />
        ) : null}
      </span>
    );

    // If the student has uploaded, give them the option to view their uploaded files, unless
    // their submission is viewable in the code console
    const viewButton =
      assignment.liveFeedbackMode ||
      !hasSubmission ||
      (hasSubmission && submission!.isFinalized && assignment.isReleased) ? null : (
        <Button
          icon="eye"
          style={{ maxWidth: 160 }}
          onClick={this.changePanel.bind(this, CURRENT_PANEL.VIEWFILES, assignment, undefined)}
        >
          View files
        </Button>
      );

    // Special case: if assignment.liveFeedbackMode is turned on, give the student the option to add files
    const addFileButton =
      !assignment.liveFeedbackMode || !hasSubmission ? null : (
        <Button
          icon="plus"
          style={{ maxWidth: 160 }}
          onClick={this.changePanel.bind(this, CURRENT_PANEL.ADDFILES, assignment, submission)}
          disabled={!canUpload}
        >
          Add/Update files
        </Button>
      );

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
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ marginLeft: 15 }} />
          {uploadButton}
          <div style={{ marginLeft: 15 }} />
          {viewButton}
          {addFileButton}
        </div>
      </div>
    );
  };

  /***********************************************************************************
  /* Content area
  /**********************************************************************************/

  public buildAssignmentsTable = (
    assignments: AssignmentStudentType[],
    submissions: IAssignmentToSubmissionStudentMap,
  ) => {
    const modifyIf = (modMap: { [statusTarget: number]: number }) => {
      return (value: any, row: any, index: number) => {
        const obj = {
          children: value,
          props: { colSpan: 1, align: 'left' },
        };

        if (row.statusType in modMap) {
          obj.props.colSpan = modMap[row.statusType];
          obj.props.align = 'center';
        }
        return obj;
      };
    };

    const aligner: 'left' | 'center' | 'right' = 'center';
    let columns: any[] = [
      {
        title: 'Assignment',
        dataIndex: 'assignment',
        key: 'assignment',
      },
      {
        title: 'Partners',
        dataIndex: 'partners',
        key: 'partners',
        render: modifyIf({
          [SUBMISSION_STATUS.NO_SUBMISSION]: 3,
          [SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED]: 3,
        }),
        align: aligner,
      },
      {
        title: 'Grade',
        dataIndex: 'grade',
        key: 'grade',
        align: aligner,
        render: modifyIf({
          [SUBMISSION_STATUS.NO_SUBMISSION]: 0,
          [SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED]: 0,
          [SUBMISSION_STATUS.SUBMISSION_UNVIEWED]: 2,
        }),
      },
      {
        title: 'Code',
        dataIndex: 'code',
        key: 'code',
        align: aligner,
        render: modifyIf({
          [SUBMISSION_STATUS.NO_SUBMISSION]: 0,
          [SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED]: 0,
          [SUBMISSION_STATUS.SUBMISSION_UNVIEWED]: 0,
        }),
      },
    ];

    // Optional upload column
    const uploadColumn = {
      title: 'Upload',
      dataIndex: 'upload',
      key: 'upload',
      align: aligner,
    };

    const statsColumn = {
      title: 'Stats',
      dataIndex: 'stats',
      key: 'stats',
      align: aligner,
    };

    if (assignments) {
      // If one assignment has studentUpload, add the uploadColumn to the columns
      columns = assignments.some((assn) => {
        return assn.allowStudentUpload;
      })
        ? [...columns, uploadColumn]
        : columns;
      columns = assignments.some((assn) => {
        return assn.mean || assn.median;
      })
        ? [...columns, statsColumn]
        : columns;
    }

    const data = sortAssignments(assignments).map((assignment) => {
      const submission = assignment.id in submissions ? submissions[assignment.id][0] : undefined;
      const uploadContent = this.getUploadContent(assignment, submission);

      if (!assignment.isReleased && !assignment.liveFeedbackMode) {
        // Case 1: assignment is not published and is not in live feedback mode
        return {
          key: assignment.name,
          assignment: assignment.name,
          statusType: SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED,
          partners: (
            <div>
              {' '}
              <Icon type="stop" /> &nbsp; Assignment not yet published
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
            ? "Your submission hasn't been uploaded"
            : "Your instructor hasn't transferred your submission to codePost yet";
          return {
            ...toRet,
            partners: (
              <div>
                <Icon type="minus-circle" /> &nbsp; {missingText}
              </div>
            ),
            statusType: SUBMISSION_STATUS.NO_SUBMISSION,
          };
        } else if (!submission.isFinalized && !assignment.liveFeedbackMode) {
          // Case 2: assignment is published, but student has no submission OR submission isn't finalized
          return {
            ...toRet,
            partners: (
              <div>
                <Icon type="minus-circle" /> &nbsp; Your submission hasn't been graded yet
              </div>
            ),
            statusType: SUBMISSION_STATUS.NO_SUBMISSION,
          };
        } else {
          // Case 3: assignment is published, and student has a submission

          // Show Grade if the submission history doesn't exist (legacy), or if the submission has been viewed
          const showGrade =
            !(submission.id in this.state.viewsBySubmission) || this.state.viewsBySubmission[submission.id];
          return {
            ...toRet,
            partners:
              submission.students !== undefined && submission.students.length === 1
                ? '--'
                : submission.students !== undefined &&
                  submission.students
                    .filter((student) => {
                      return student !== this.props.user.email;
                    })
                    .join(', '),
            grade: showGrade ? (
              submission.grade !== null && submission.grade !== undefined ? (
                `${submission.grade}/${assignment.points}`
              ) : null
            ) : this.props.windowwidth > layoutVars.breakpoints.mobile.student ? (
              <Tag onClick={this.openAndMarkViewed.bind(this, submission)} style={{ cursor: 'pointer' }}>
                View feedback
              </Tag>
            ) : (
              <Tag>Login on desktop to view</Tag>
            ),
            code: (
              <div onClick={openSubmission.bind(this, submission.id)}>
                <Icon type="code" style={{ cursor: 'pointer' }} />
              </div>
            ),
            statusType: showGrade ? SUBMISSION_STATUS.SUBMISSION_VIEWED : SUBMISSION_STATUS.SUBMISSION_UNVIEWED,
          };
        }
      }
    });

    return { columns, data };
  };

  /***********************************************************************************
  /* Render function
  /**********************************************************************************/

  public render() {
    const { assignments, isLoadingAssignments, isLoadingSubmissions, submissions } = this.state;
    const { currentCourse } = this.props;

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
      const assignmentList = assignments[currentCourse.id];
      const { columns, data } = this.buildAssignmentsTable(assignmentList, submissions);
      const rowClassName = (record: any, index: number) => {
        if (record.disabled) {
          return 'disabled-row';
        } else {
          return '';
        }
      };

      studentContent = (
        <div>
          <TableDetail
            loadComplete={!isLoadingAssignments && !isLoadingSubmissions}
            isEmpty={assignmentList.length === 0}
            title={`${currentCourse.name} | ${currentCourse.period}`}
            emptyNode={<div>Empty...</div>}
            actions={[]}
            columns={columns}
            data={data}
            pagination={false}
            hideSearch={true}
            tableProps={{ rowClassName, bordered: true }}
          />
          <UploadSubmissionDialog
            isVisible={
              this.state.currentPanel === CURRENT_PANEL.UPLOADFILES ||
              this.state.currentPanel === CURRENT_PANEL.ADDFILES
            }
            onCancel={this.changePanel.bind(this, CURRENT_PANEL.TABLE, this.state.detailAssignment, undefined)}
            assignments={[]}
            selectedAssignment={this.state.detailAssignment}
            students={[]}
            selectedStudents={
              this.state.detailSubmission && this.state.detailSubmission.students
                ? this.state.detailSubmission.students
                : [this.props.user.email]
            }
            submissions={
              this.state.detailSubmission
                ? { [this.props.user.email]: { [this.state.detailSubmission.assignment]: this.state.detailSubmission } }
                : { [this.props.user.email]: {} }
            }
            uploadSubmission={this.uploadSubmission.bind(this, this.state.currentPanel === CURRENT_PANEL.UPLOADFILES)}
            disableStudentSelect={true}
            onSuccess={this.onUploadSuccess}
            isStudent={true}
          />
          <ViewUpload
            isVisible={this.state.currentPanel === CURRENT_PANEL.VIEWFILES}
            assignment={this.state.detailAssignment}
            onCancel={this.changePanel.bind(this, CURRENT_PANEL.TABLE, undefined, undefined)}
          />
        </div>
      );
    }

    /* Build header */
    const courseDropdown = (
      <CourseMenu courses={this.props.initialCourses} currentCourse={this.props.currentCourse} base="student" />
    );

    const headerLeft = [<CPLogo cpType="dark" key="logo" />, <span key="empty" />, courseDropdown];

    const headerRight = [
      <span key="header-user" className="cp-label cp-label--bold">
        {this.props.user.email}
      </span>,
      <Referral key="referral" user={this.props.user} theme="light" />,
      <RoleMenu key="header-roles" user={this.props.user} thisApp={USER_TYPE.STUDENT} theme="light" />,
      <Link className="internal-link" key="settings" to="/settings">
        <Icon type="setting" />
      </Link>,
      <Button key="header-logout" onClick={this.props.handleLogout}>
        Logout
      </Button>,
    ];

    const header = <CPFlex left={headerLeft} right={headerRight} gutterSize={10} />;

    const navigation = (collapsed: boolean) => null;
    return (
      <div id="Student">
        <CPLayoutAdmin
          header={header}
          detail={studentContent}
          navigation={navigation}
          collapsible={true}
          hasSider={false}
          role={USER_TYPE.STUDENT}
        />
      </div>
    );
  }
}

export default withWindowWatcher(Student);
