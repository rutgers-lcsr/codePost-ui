/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Icon, Menu, Popover, Tag } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import CPFlex from '../core/CPFlex';

import { IAssignmentToSubmissionsMap, ICourseToAssignmentMap, USER_TYPE } from '../../types/common';

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

/**********************************************************************************************************************/

interface IStudentState {
  currentCourse?: CourseType;
  assignments: ICourseToAssignmentMap;
  submissions: IAssignmentToSubmissionsMap;
  viewsBySubmission: { [submissionID: number]: boolean };

  // Loading variables
  isLoadingAssignments: boolean;
  isLoadingSubmissions: boolean;
}

enum SUBMISSION_STATUS {
  ASSIGNMENT_NOT_PUBLISHED,
  NO_SUBMISSION,
  SUBMISSION_VIEWED,
  SUBMISSION_UNVIEWED,
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
                this.setState({ submissions, viewsBySubmission: viewMap, isLoadingSubmissions: false });
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

      // By default open first course in course list
      if (!currentCourse && courses.length > 0) {
        currentCourse = courses.sort((a, b) => {
          return b.id - a.id;
        })[0];
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
      const toRet = {};
      courses.forEach((course, i) => {
        toRet[course.id] = assignments[i];
      });

      return toRet;
    });
  };

  public loadSubmissions = async (assignments: AssignmentType[]) => {
    const submissions = {};
    for (const assignment of assignments) {
      if (assignment.isReleased) {
        submissions[assignment.id] = await AssignmentStudent.readSubmissions(assignment.id, {
          student: this.props.user.email,
        });
      }
    }

    return submissions;
  };

  public loadHistories = async (submissions: IAssignmentToSubmissionsMap, email: string) => {
    const toRet = {};
    const keys = Object.keys(submissions);
    for (const key of keys) {
      const submissionList: StudentSubmissionType[] = submissions[key];
      if (submissionList.length > 0) {
        const submission = submissionList[0];
        const history = await Submission.readHistory(submission.id, { student: email });
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
    const history = await Submission.readHistory(submission.id, { student: this.props.user.email });
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
                  this.setState({ submissions, viewsBySubmission: viewMap, isLoadingSubmissions: false });
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
    return { value: this.getCourseValue(currentCourse), label: this.getCourseName(currentCourse) };
  };

  /***********************************************************************************
  /* Content area
  /**********************************************************************************/

  public buildAssignmentsTable = (assignments: AssignmentType[], submissions: IAssignmentToSubmissionsMap) => {
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
    const columns = [
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
        render: modifyIf({ [SUBMISSION_STATUS.NO_SUBMISSION]: 3, [SUBMISSION_STATUS.ASSIGNMENT_NOT_PUBLISHED]: 3 }),
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

    const data = assignments.map((assignment) => {
      if (!assignment.isReleased) {
        // Case 1: assignment isn't published
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
        };
      } else {
        const submission = assignment.id in submissions ? submissions[assignment.id][0] : undefined;

        const hasStats = assignment.mean !== null || assignment.median !== null;
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
          stats: hasStats ? (
            <Popover content={statsContent} title="Assignment Stats">
              <Tag>See stats</Tag>
            </Popover>
          ) : (
            '--'
          ),
        };

        if (submission === undefined || !submission.isFinalized) {
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
        } else {
          // Case 3: assignment is published, and student has a submission
          const hasBeenViewed = this.state.viewsBySubmission[submission.id];
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
            grade: hasBeenViewed ? (
              submission.grade !== null ? (
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
            statusType: hasBeenViewed ? SUBMISSION_STATUS.SUBMISSION_VIEWED : SUBMISSION_STATUS.SUBMISSION_UNVIEWED,
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
      <Button key="header-logout" size="small" onClick={this.props.handleLogout}>
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
        />
      </div>
    );
  }
}

export default withWindowWatcher(Student);
