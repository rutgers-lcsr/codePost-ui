/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import {
  CodeOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  StopOutlined,
  UploadOutlined,
} from '@ant-design/icons';

/* antd imports */
import { Button, Modal, Spin, Tag } from 'antd';

/* other library imports */
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

import { openSubmission, openSubmissionInSameTab } from '../admin/other/AdminUtils';

import CPLogo from '../core/CPLogo';

import layoutVars from '../../styles/layout/_layoutVars';

import UploadSubmissionDialog from '../admin/assignments/assignments/SubmissionUpload/UploadSubmissionDialog';
import { IBaseFileUpload } from '../admin/assignments/assignments/SubmissionUpload/FileReader';

import { IComponentProps } from '../core/ComponentManager';

import CourseMenu, { encodedCourseLink } from '../core/CourseMenu';

import { CodePostDate } from '../utils/DateUtils';

/**********************************************************************************************************************/

interface IStudentProps {
  uploadShortcut?: {
    assignmentID: number;
    files: IBaseFileUpload[];
  };
}

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

class Student extends React.Component<IComponentProps & IWithWindowWatcherProps & IStudentProps, IStudentState> {
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
    };
  }

  /***********************************************************************************
  /* Lifecycle methods
  /**********************************************************************************/

  public load = () => {
    this.loadAssignments(this.props.initialCourses).then((assignments) => {
      this.setState({ assignments, isLoadingAssignments: false }, () => {
        if (this.props.currentCourse) {
          /////////////////////////////////////////////////////////////////////////////////
          // Handle shortcutting to a specific assignment
          /////////////////////////////////////////////////////////////////////////////////
          if (
            this.props.uploadShortcut !== undefined &&
            !this.props.currentCourse.assignments.includes(this.props.uploadShortcut.assignmentID)
          ) {
            // Find the course that parents the assignment we want to get to
            const foundCourse = this.props.initialCourses.find((course: CourseType) => {
              return course.assignments.includes(this.props.uploadShortcut!.assignmentID);
            });

            if (foundCourse !== undefined) {
              const link = encodedCourseLink('student', foundCourse);
              this.props.history.push(link);
            }
          }
          /////////////////////////////////////////////////////////////////////////////////
          /////////////////////////////////////////////////////////////////////////////////

          this.loadSubmissions(this.state.assignments[this.props.currentCourse.id]).then((submissions) => {
            this.loadHistories(Object.values(submissions), this.props.user.email).then(
              (viewMap: { [submissionID: number]: boolean }) => {
                /////////////////////////////////////////////////////////////////////////////////
                // Open the upload panel for the specified assignment
                /////////////////////////////////////////////////////////////////////////////////
                const goToUpload = () => {
                  if (this.props.uploadShortcut !== undefined) {
                    const assignment = this.state.assignments[this.props.currentCourse!.id].find(
                      (a: AssignmentStudentType) => {
                        return a.id === this.props.uploadShortcut!.assignmentID;
                      },
                    );

                    if (assignment !== undefined) {
                      let submission;
                      if (submissions.hasOwnProperty(assignment.id) && submissions[assignment.id].length > 0) {
                        submission = submissions[assignment.id][0];
                      }

                      this.changePanel(CURRENT_PANEL.UPLOADFILES, assignment, submission);
                    }
                  }
                };
                /////////////////////////////////////////////////////////////////////////////////
                /////////////////////////////////////////////////////////////////////////////////

                this.setState(
                  {
                    submissions,
                    viewsBySubmission: viewMap,
                    isLoadingSubmissions: false,
                  },
                  goToUpload,
                );
              },
            );
          });
        }
      });
    });
  };

  public componentDidMount() {
    this.load();
  }

  public componentDidUpdate(oldProps: IStudentProps) {
    if (oldProps.uploadShortcut === undefined && this.props.uploadShortcut !== undefined) {
      this.load();
    }
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
        toRet[course.id] = assignments[i].filter(
          (a) =>
            a.isVisible &&
            !a.hideFrom.some((shouldHide: number) => this.props.user.student_sections.indexOf(shouldHide) > -1),
        );
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
          // eslint-disable-next-line
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
    openSubmissionInSameTab(submission.id);
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
        // eslint-disable-next-line
        ['compact']: '1',
      });
      latestSubmission = fetchSubmissions.length > 0 ? fetchSubmissions[0] : undefined;
    }
    this.setState({
      currentPanel: newPanel,
      detailAssignment: assignment,
      detailSubmission: latestSubmission || submission,
    });
  };

  public getFileExtension = (fileName: string): string => {
    const split = fileName.split('.');
    return split.length === 1 ? 'txt' : split[split.length - 1];
  };

  // Upload a submission as a student
  public uploadSubmission = (
    isNew: boolean,
    assignment: AssignmentStudentType,
    partners: string[],
    files: any[],
    sendConfirmationEmail: boolean = false,
  ) => {
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
      sendConfirmationEmail,
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
      if (localStorage.getItem('source') !== 'codePost') {
        openSubmissionInSameTab(newSubmissionID);
      } else {
        openSubmission(newSubmissionID);
      }
      this.changePanel(CURRENT_PANEL.TABLE, undefined, undefined);
    }
  };

  public getUploadContent = (assignment: AssignmentStudentType, submission?: StudentSubmissionType) => {
    if (!assignment.allowStudentUpload) {
      // Case 0: Student upload not allowed
      return <div />;
    }

    // CIP FIXME - HARDCODED FOR CODE IN PLACE
    const hideDueDate = this.props.currentCourse && this.props.currentCourse.id === 925;

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
    const uploadDateText =
      submission !== undefined ? (
        <div>
          Uploaded:{' '}
          {submission !== undefined && submission.dateUploaded !== undefined ? (
            <CodePostDate datetime={submission.dateUploaded} />
          ) : null}
        </div>
      ) : null;

    const uploadButton = (
      <span>
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
                      If you replace your files, it will delete existing files and file versions, including any comments
                      on those files.
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
            } else {
              this.changePanel(CURRENT_PANEL.UPLOADFILES, assignment, submission);
            }
          }}
        >
          Upload assignment
        </Button>
      </span>
    );

    // Special case: if assignment.liveFeedbackMode is turned on, give the student the option to add files
    const addFileButton =
      !assignment.liveFeedbackMode || submission === undefined ? null : (
        <Button
          icon={<PlusOutlined />}
          style={{ maxWidth: 160 }}
          onClick={this.changePanel.bind(this, CURRENT_PANEL.ADDFILES, assignment, submission)}
          disabled={submission === undefined || submission.isFinalized}
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

    // We pre-calculate showGrades and showColumns to figure out the column spans
    let showGrades = true;
    let showPartners = true;

    if (assignments) {
      // If one visible assignment doesn't have hideGrades turned on, show the grades column
      const visibleAssignments = assignments.filter((assn) => assn.isVisible);
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
    // If the assignment is not published, it expands to take up the grades and partners columns (span = 3)
    // If the submission isn't viewed, it expands to take up the grade column (span = 2)
    let columns: any[] = [
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
        render: modifyIf({
          [SUBMISSION_STATUS.NO_SUBMISSION]: 1 + Number(showGrades) + Number(showPartners),
          [SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED]: 1 + Number(showGrades) + Number(showPartners),
          [SUBMISSION_STATUS.SUBMISSION_UNVIEWED]: 1 + Number(showGrades),
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

    const gradeColumn = {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      align: aligner,
      render: modifyIf({
        [SUBMISSION_STATUS.NO_SUBMISSION]: 0,
        [SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED]: 0,
        [SUBMISSION_STATUS.SUBMISSION_UNVIEWED]: 0,
      }),
    };

    const partnerColumn = {
      title: 'Partners',
      dataIndex: 'partners',
      key: 'partners',
      render: modifyIf({
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

    if (assignments) {
      // if any of the visible assignments have a property to conditionally show a column, add it to columns
      const visibleAssignments = assignments.filter((assn) => assn.isVisible);
      columns = showPartners ? [...columns, partnerColumn] : columns;
      columns = showGrades ? [...columns, gradeColumn] : columns;
      columns = visibleAssignments.some((assn) => {
        return assn.allowStudentUpload;
      })
        ? [...columns, uploadColumn]
        : columns;
      columns =
        this.props.currentCourse &&
        this.props.currentCourse.showStudentsStatistics &&
        visibleAssignments.some((assn) => {
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
            this.markViewed(submission).then(() => openSubmissionInSameTab(submission.id));
          };

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
            code: <Button onClick={open}>View feedback</Button>,
            statusType: showGrade ? SUBMISSION_STATUS.SUBMISSION_VIEWED : SUBMISSION_STATUS.SUBMISSION_UNVIEWED,
          };
        }
      }
    });

    return { columns, data };
  };

  public calculateLateDayCreditsAvailable = (submissions: IAssignmentToSubmissionStudentMap): number => {
    if (!this.props.currentCourse || this.props.currentCourse.lateDayCreditsAllowable === null) {
      return 0;
    }

    let totalUsed = 0;

    Object.keys(submissions).forEach((assignmentID: string) => {
      const subTotal = submissions[+assignmentID].reduce((acc: number, sub: StudentSubmissionType) => {
        if (sub.lateDayCreditsUsed !== undefined) {
          return acc + sub.lateDayCreditsUsed;
        } else {
          return acc;
        }
      }, 0);

      totalUsed += subTotal;
    });

    return this.props.currentCourse.lateDayCreditsAllowable - totalUsed;
  };

  public getLateDayCreditsComponent = () => {
    if (!this.props.currentCourse || this.props.currentCourse.lateDayCreditsAllowable === null) {
      return null;
    }

    const lateDayCreditsAvailable = this.calculateLateDayCreditsAvailable(this.state.submissions);

    return <div>Late Day Credits: {this.state.isLoadingSubmissions ? '--' : lateDayCreditsAvailable}</div>;
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
      const lateDayCredits = this.getLateDayCreditsComponent();

      const assignmentList = assignments[currentCourse.id];
      const { columns, data } = this.buildAssignmentsTable(assignmentList, submissions);
      const rowClassName = (record: any, index: number) => {
        if (record.disabled) {
          return 'disabled-row';
        } else {
          return '';
        }
      };

      const defaultFiles =
        this.props.uploadShortcut !== undefined &&
        this.state.detailAssignment !== undefined &&
        this.props.uploadShortcut.assignmentID === this.state.detailAssignment.id
          ? this.props.uploadShortcut.files
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
            isVisible={
              this.state.currentPanel === CURRENT_PANEL.UPLOADFILES ||
              this.state.currentPanel === CURRENT_PANEL.ADDFILES
            }
            onCancel={this.changePanel.bind(this, CURRENT_PANEL.TABLE, this.state.detailAssignment, undefined)}
            assignments={assignmentList}
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
            uploadSubmission={this.uploadSubmission.bind(this, this.state.currentPanel !== CURRENT_PANEL.ADDFILES)}
            disableStudentSelect={true}
            onSuccess={this.onUploadSuccess}
            isStudent={true}
            defaultFiles={defaultFiles}
          />
        </div>
      );
    }

    /* Build header */
    const courseDropdown = (
      <CourseMenu courses={this.props.initialCourses} currentCourse={this.props.currentCourse} base="student" />
    );

    const openHome = () => {
      if (localStorage.getItem('source') === 'codePost') {
        window.open('https://codepost.cs.rutgers.edu', '_blank');
      }
    };

    const headerLeft = [<CPLogo cpType="dark" key="logo" onClick={openHome} />, <span key="empty" />, courseDropdown];

    const referral = <Referral key="referral" user={this.props.user} theme="light" />;

    const roleMenu = <RoleMenu key="header-roles" user={this.props.user} thisApp={USER_TYPE.STUDENT} theme="light" />;

    const settings = (
      <Link className="internal-link" key="settings" to="/settings">
        <SettingOutlined />
      </Link>
    );

    const logout = (
      <Button key="header-logout" onClick={this.props.handleLogout}>
        Log Out
      </Button>
    );

    const headerRight = [
      <span key="header-user" className="cp-label cp-label--bold">
        {this.props.user.email}
      </span>,
      referral,
      roleMenu,
      settings,
      logout,
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
