/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Icon, Menu, Modal, Spin, Tag, Typography } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* other library imports */
import moment from 'moment';
import { Link } from 'react-router-dom';

/* codePost imports */
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import CPFlex from '../core/CPFlex';

import { IAssignmentToSubmissionStudentMap, ICourseToAssignmentMap, USER_TYPE } from '../../types/common';

import { AssignmentStudent, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { loadIDList } from '../../infrastructure/generics';
import { StudentSubmissionType, Submission } from '../../infrastructure/submission';

import { UserType } from '../../infrastructure/user';

import CPLayoutAdmin from '../admin/other/CPLayoutAdmin';

import RoleMenu from '../core/RoleMenu';

import CPDropdown from '../core/CPDropdown';

import { TableDetail } from '../admin/other/TableDetail';

import { openSubmission } from '../admin/other/AdminUtils';

import CPLogo from '../core/CPLogo';

import layoutVars from '../../styles/layout/_layoutVars';

import UploadSubmissionDialog from '../admin/assignments/assignments/UploadSubmissionDialog';

import ViewUpload from './ViewUpload';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';

const { Text } = Typography;

/**********************************************************************************************************************/

interface IStudentState {
  currentCourse?: CourseType;
  assignments: ICourseToAssignmentMap;
  submissions: IAssignmentToSubmissionStudentMap;
  viewsBySubmission: { [submissionID: number]: boolean };

  // Loading variables
  isLoadingAssignments: boolean;
  isLoadingSubmissions: boolean;

  currentPanel: CURRENT_PANEL;
  detailAssignment?: AssignmentType;
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
  VIEWFILES,
  UPLOADFILES,
  ADDFILES,
}

export interface IStudentProps extends IWithWindowWatcherProps {
  initialCourses: CourseType[];
  user: UserType;
  match: any;
  history: any;

  handleLogout: () => void;
}

class Student extends React.Component<IStudentProps, IStudentState> {
  public constructor(props: IStudentProps) {
    super(props);
    document.title = 'codePost - Student Console';
    this.state = {
      currentCourse: undefined,
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

  public componentDidMount() {
    this.loadAssignments(this.props.initialCourses).then((assignments) => {
      this.setState({ assignments, isLoadingAssignments: false }, () => {
        const { course } = this.setStateFromURL(this.props.initialCourses, assignments);
        if (course) {
          this.changeURL(course);
          this.setState({ currentCourse: course });
          this.loadSubmissions(this.state.assignments[course.id]).then((submissions) => {
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
  /* URL + UI handling methods
  /**********************************************************************************/

  public setStateFromURL = (courses: CourseType[], assignments: ICourseToAssignmentMap) => {
    const { courseName, period } = this.props.match.params;
    if (courses.length === 0) {
      return { course: undefined };
    } else {
      // is the URL trying to set the course?
      const tryingToSetCourse = courseName && period;
      let currentCourse: CourseType | undefined;
      if (tryingToSetCourse) {
        const formattedCourseName = courseName.replace(/_/g, ' ');
        const formattedPeriod = period.replace(/_/g, ' ');
        currentCourse = courses.find((obj: CourseType) => {
          return obj.name === formattedCourseName && obj.period === formattedPeriod;
        });
      }

      if (currentCourse) {
        LOCAL_SETTINGS.defaultCourse.setter(currentCourse.id);
      }

      // By default open first course in course list
      if (!currentCourse && courses.length > 0) {
        // First, see if we have a locally cached course
        const stored_id = LOCAL_SETTINGS.defaultCourse.getter();
        if (stored_id !== 0) {
          const found = courses.find((course: CourseType) => {
            return course.id === stored_id;
          });
          if (found !== undefined) {
            currentCourse = found;
          }
        }

        // By default open first course in course list
        if (currentCourse === undefined) {
          currentCourse = courses.sort((a, b) => {
            return b.id - a.id;
          })[0];
        }
      }

      return { course: currentCourse };
    }
  };

  public changeURL = (course: CourseType) => {
    const courseName = course.name.replace(/ /g, '_');
    const coursePeriod = course.period.replace(/ /g, '_');
    this.props.history.push(`/student/${courseName}/${coursePeriod}`);
  };

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

  public loadSubmissions = async (assignments: AssignmentType[]) => {
    const submissions: any = {};
    for (const assignment of assignments) {
      if (assignment.isReleased || assignment.allowStudentUpload || assignment.liveFeedbackMode) {
        submissions[assignment.id] = await AssignmentStudent.readSubmissions(assignment.id, {
          student: this.props.user.email,
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

  public handleCourseChange = (e: ClickParam) => {
    const courseID = +e.key;
    const currentCourse = this.props.initialCourses.find((course: CourseType) => {
      return course.id === courseID;
    });

    if (currentCourse) {
      LOCAL_SETTINGS.defaultCourse.setter(currentCourse.id);
      this.setState(
        {
          currentCourse,
        },
        () => {
          this.setState({ isLoadingSubmissions: true }, () => {
            this.changeURL(currentCourse);
            this.loadSubmissions(this.state.assignments[currentCourse.id]).then((submissions) => {
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
          });
        },
      );
    }
  };

  public selectorItemsFormatter<T>(
    items: T[],
    getValue: (item: T) => number,
    getName: (item: T) => string,
    getDisabled: (item: T) => boolean,
  ) {
    return items.map((item: T) => ({
      value: getValue(item),
      label: getName(item),
      isDisabled: getDisabled(item),
    }));
  }

  public getCourseName = (course: CourseType) => `${course.name} | ${course.period}`;
  public getCourseValue = (course: CourseType) => course.id;
  public getCourseDisabled = (course: CourseType) => false;
  public courseSelectorItems = (courses: CourseType[]) => {
    return this.selectorItemsFormatter(courses, this.getCourseValue, this.getCourseName, this.getCourseDisabled);
  };
  public courseActiveSelector = (currentCourse: CourseType | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return {
      value: this.getCourseValue(currentCourse),
      label: this.getCourseName(currentCourse),
    };
  };

  public changePanel = (newPanel: CURRENT_PANEL, assignment?: AssignmentType, submission?: StudentSubmissionType) => {
    this.setState({ currentPanel: newPanel, detailAssignment: assignment, detailSubmission: submission });
  };

  public getFileExtension = (fileName: string): string => {
    const split = fileName.split('.');
    return split.length === 1 ? 'txt' : split[split.length - 1];
  };

  // Upload a submission as a student
  public uploadSubmission = async (isNew: boolean, assignment: AssignmentType, partners: string[], files: any[]) => {
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
      ? await AssignmentStudent.createStudentUpload(payload)
      : await AssignmentStudent.updateStudentUpload(payload);

    const submissions = this.state.submissions;
    submissions[assignment.id] = [submission1];
    this.setState({ submissions });
  };

  public onUploadSuccess = () => {
    const assignment = this.state.detailAssignment;
    const submissions = assignment ? this.state.submissions[assignment.id] : undefined;

    if (!assignment || !submissions || !submissions[0]) {
      this.changePanel(CURRENT_PANEL.TABLE, undefined);
      return;
    }

    if (assignment.liveFeedbackMode) {
      openSubmission(submissions[0].id);
      this.changePanel(CURRENT_PANEL.TABLE, undefined);
    } else {
      this.changePanel(CURRENT_PANEL.VIEWFILES, assignment, undefined);
    }
  };

  public getUploadContent = (assignment: AssignmentType, submission?: StudentSubmissionType) => {
    if (!assignment.allowStudentUpload) {
      // Case 0: Student upload not allowed
      return <div />;
    }

    const dueDate = assignment.uploadDueDate ? `Due date: ${moment(assignment.uploadDueDate).format('llll')}` : '';
    const dueDateText = <Text type="warning">{dueDate}</Text>;

    const uploadButton = (text: string) => {
      return (
        <Button
          icon="upload"
          type="primary"
          style={{ maxWidth: 180 }}
          onClick={() => {
            if (submission && assignment.liveFeedbackMode) {
              Modal.confirm({
                title: 'Confirm File Replacement',
                content: `Replacing your files will delete existing files, including any comments on those files.
                  If you want to add a file to your submission click 'Add Files' instead.
                  Are you sure you want to continue?`,
                okText: 'Continue',
                cancelText: 'Cancel',
                onOk: this.changePanel.bind(this, CURRENT_PANEL.UPLOADFILES, assignment, submission),
              });
            } else {
              this.changePanel(CURRENT_PANEL.UPLOADFILES, assignment, submission);
            }
          }}
        >
          {text}
        </Button>
      );
    };

    // If the assignment is in live feedback mode, allow students to add file verisons
    const addFileButton = !assignment.liveFeedbackMode ? (
      <div />
    ) : (
      <Button
        icon="plus"
        style={{ maxWidth: 160 }}
        onClick={this.changePanel.bind(this, CURRENT_PANEL.ADDFILES, assignment, submission)}
      >
        Add files
      </Button>
    );

    // If live feedback mode is on, we don't want to show the view files button
    const viewButton = assignment.liveFeedbackMode ? (
      <div />
    ) : (
      <Button
        icon="eye"
        style={{ maxWidth: 160 }}
        onClick={this.changePanel.bind(this, CURRENT_PANEL.VIEWFILES, assignment, undefined)}
      >
        View files
      </Button>
    );

    if (!submission) {
      if (assignment.uploadDueDate && Date.parse(assignment.uploadDueDate) <= Date.now()) {
        // Case 1: No submission has been uploaded and due date has passed
        return (
          <div>
            {dueDateText} <br />
            <Tag color="volcano">DUE DATE PASSED</Tag>
          </div>
        );
      } else {
        // Case 2: No submission has been uploaded and due date has not passed
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 2.2,
              alignItems: 'center',
            }}
          >
            {dueDateText}
            {uploadButton('Upload Files')}
          </div>
        );
      }
    } else {
      if (
        (submission.hasGrader && !assignment.liveFeedbackMode) ||
        submission.isFinalized ||
        (assignment.uploadDueDate && Date.parse(assignment.uploadDueDate) <= Date.now())
      ) {
        // Case 3: Submission exists, and cannot be replaced, either because
        // it has a grader and is not in live feeedback mode, is finalized
        // (hasGrader isn't exposed), or the due date has passed
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 2.2,
              alignItems: 'center',
            }}
          >
            <div>Uploaded: {moment(submission.dateUploaded).format('llll')}</div>
            {dueDateText}
            {viewButton}
          </div>
        );
      } else {
        // Case 4: Submission exists, and can be replaced
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 2.2,
            }}
          >
            <div>Last uploaded: {moment(submission.dateUploaded).format('llll')}</div>
            {dueDateText}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ marginLeft: 15 }} />
              {uploadButton('Replace Files')}
              <div style={{ marginLeft: 15 }} />
              {viewButton}
              {addFileButton}
            </div>
          </div>
        );
      }
    }
  };

  /***********************************************************************************
  /* Content area
  /**********************************************************************************/

  public buildAssignmentsTable = (assignments: AssignmentType[], submissions: IAssignmentToSubmissionStudentMap) => {
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
    let columns = [
      {
        title: 'Assignment',
        dataIndex: 'assignment',
        key: 'assignment',
      },
      {
        title: 'Stats',
        dataIndex: 'stats',
        key: 'stats',
        align: aligner,
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

    // If one assignment has studentUpload, add the uploadColumn to the columns
    if (assignments) {
      columns = assignments.some((assn) => {
        return assn.allowStudentUpload;
      })
        ? [...columns, uploadColumn]
        : columns;
    }

    const data = assignments.map((assignment) => {
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
          return {
            ...toRet,
            partners: (
              <div>
                <Icon type="minus-circle" /> &nbsp; Your submission hasn't been uploaded
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
              submission.students.length === 1
                ? '--'
                : submission.students
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
    const { assignments, currentCourse, isLoadingAssignments, isLoadingSubmissions, submissions } = this.state;

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
            submissions={{}}
            uploadSubmission={this.uploadSubmission.bind(this, this.state.currentPanel === CURRENT_PANEL.UPLOADFILES)}
            disableStudentSelect={true}
            onSuccess={this.onUploadSuccess}
          />
          <ViewUpload
            isVisible={this.state.currentPanel === CURRENT_PANEL.VIEWFILES}
            assignment={this.state.detailAssignment}
            onCancel={this.changePanel.bind(this, CURRENT_PANEL.TABLE, undefined)}
          />
        </div>
      );
    }

    /* Build header */
    let courseSelectorText = 'Select a course';
    if (this.state.currentCourse) {
      courseSelectorText = `${this.state.currentCourse.name} | ${this.state.currentCourse.period}`;
    }
    const courseMenu = (
      <Menu onClick={this.handleCourseChange}>
        {this.props.initialCourses.map((course, i) => {
          return <Menu.Item key={course.id}>{`${course.name} | ${course.period}`}</Menu.Item>;
        })}
      </Menu>
    );
    const courseDropdown = <CPDropdown value={courseSelectorText} overlay={courseMenu} key="dropdown" />;

    const headerLeft = [<CPLogo cpType="dark" key="logo" />, <span key="empty" />, courseDropdown];

    const headerRight = [
      <span key="header-user" className="cp-label cp-label--bold">
        {this.props.user.email}
      </span>,
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
