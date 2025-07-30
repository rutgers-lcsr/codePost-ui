/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { SettingOutlined } from '@ant-design/icons';

/* ant imports */
import { Button, Empty, Modal, Input, Checkbox } from 'antd';

/* other library imports */
import _ from 'lodash';
import queryString from 'query-string';

import { Route, Link, Switch } from 'react-router-dom';

/* codePost imports */
import AdminNav from './other/AdminNav';
import CPLayoutAdmin from './other/CPLayoutAdmin';

import SubmissionsManager from './submissions/SubmissionsManager';
import ManageAssignments from './assignments/ManageAssignments';
import RosterManager from './roster/RosterManager';
import CourseSettingsPanel from './settings/CourseSettingsPanel';
import WebhooksPanel from './settings/WebhooksPanel';

import CourseMenu from '../core/CourseMenu';
import NewCourseDialog from './other/NewCourseDialog';
import RoleMenu from '../core/RoleMenu';
import Referral from '../core/Referral';

/* types */
import {
  IAssignmentToSubmissionsMap,
  IGraderSubmissionsDataTable,
  IStudentSubmissionsDataTable,
  USER_APP,
  USER_TYPE,
} from '../../types/common';

/* API library */
import { Assignment, AssignmentPatchType, AssignmentType, sortAssignments } from '../../infrastructure/assignment';
import { Course, CoursePatchType, CourseType, RosterType } from '../../infrastructure/course';
import { File } from '../../infrastructure/file';
import { RubricCategory } from '../../infrastructure/rubricCategory';
import { RubricComment } from '../../infrastructure/rubricComment';
import { Section, SectionType } from '../../infrastructure/section';
import { Submission, SubmissionInfoType } from '../../infrastructure/submission';
import { SubmissionHistoryType } from '../../infrastructure/submissionHistory';
import { addToPayload } from '../../infrastructure/utils';

import { AdminOnboardingSelector } from '../core/OnboardingSelector';

import { ADMIN_TOUR_ID } from '../../routes';

import { IComponentProps } from '../core/ComponentManager';

import CPFlex from '../core/CPFlex';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

import { AssignmentSetupBanner } from './assignments/assignments/AssignmentSetupDialog';

import { CIPAdminModal } from '../cip/components';

import VideoModal from '../landing/VideoModal';

/**********************************************************************************************************************/

interface IAdminState {
  /**** UI control data ****/
  onboardingModalVisible: boolean;
  cipModalVisible: boolean;

  /**** Top-level course data ****/
  courses: CourseType[];

  /**** Roster data ****/
  rosterLoadComplete: boolean;
  students: string[];
  inactiveStudents: string[];
  graders: string[];
  inactiveGraders: string[];
  admins: string[];
  superGraders: string[];
  notActivated: string[];

  /**** Sections data ****/
  sectionsLoadComplete: boolean;
  sections: SectionType[];
  sectionsByStudent: { [studentEmail: string]: SectionType };

  /**** Assignments data ****/
  assignmentsLoadComplete: boolean;
  assignments: AssignmentType[];

  /*** Submissions data ****/
  partialSubmissionsLoadComplete: boolean;
  fullSubmissionsLoadComplete: boolean;
  submissionsbyUserLoadComplete: boolean;
  submissions: IAssignmentToSubmissionsMap;
  submissionsByStudent: IStudentSubmissionsDataTable;
  submissionsByGrader: IGraderSubmissionsDataTable;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };

  showBillingBanner: any;
}

const formatCourseURL = (course: CourseType) => {
  return `/admin/${encodeURIComponent(course.name)}/${encodeURIComponent(course.period)}`;
};

class Admin extends React.Component<IComponentProps, IAdminState> {
  private timer: any;
  private times: any = [];

  public constructor(props: IComponentProps) {
    super(props);

    this.timer = Date.now();

    if (this.props.currentCourse) {
      this.loadAllCourseData(this.props.currentCourse);
    }

    // Load data into CommandBar context
    window.CommandBar.addContext({ currentCourse: this.props.currentCourse, courses: this.props.initialCourses });

    // We show the CIP modal if the source is in the url, or if the user doesn't have credentials
    // The second check (credentials) is to prevent the flow of: CIP user goes to create course, navigates to splash page, and doesn't set password
    const showCIPModal = !this.props.user.hasCredentials;
    const showOnboarding =
      Object.hasOwnProperty.bind(queryString.parse(this.props.location.search))('onboarding') ||
      this.props.initialCourses.length === 0;

    this.state = {
      /**** UI control data ****/
      onboardingModalVisible: showOnboarding && !showCIPModal,
      cipModalVisible: showCIPModal,

      /**** Top-level course data ****/
      courses: _.cloneDeep(this.props.initialCourses),

      /**** Roster data ****/
      rosterLoadComplete: false,
      students: [],
      inactiveStudents: [],
      graders: [],
      inactiveGraders: [],
      admins: [],
      superGraders: [],
      notActivated: [],

      /**** Sections data ****/
      sections: [],
      sectionsLoadComplete: false,
      sectionsByStudent: {},

      /**** Assignments data ****/
      assignments: [],
      assignmentsLoadComplete: false,

      /**** Submissions data ****/
      submissions: {},
      partialSubmissionsLoadComplete: false,
      fullSubmissionsLoadComplete: false,
      submissionsByStudent: {},
      submissionsByGrader: {},
      submissionsbyUserLoadComplete: false,
      viewsBySubmission: {},
      showBillingBanner: false,
    };
  }

  public componentDidMount() {
    document.title = 'codePost - Admin Console';
    const routerFunc = (newUrl: string) => this.props.history.push(newUrl);
    window.CommandBar.addRouter(routerFunc);
  }

  public componentDidUpdate(prevProps: any, prevState: any) {
    if (this.state.students && (!prevState.students || prevState.students != this.state.students)) {
      window.CommandBar.addContext({
        course: this.props.currentCourse,
        students: this.state.students,
      });
    }
  }

  // public componentDidUpdate = (prevProps: any, prevState: any) => {
  // if (!prevState.submissionsLoadComplete && this.state.submissionsLoadComplete) {
  //   const current = Date.now() - this.timer;
  //   this.times = [...this.times, current];
  // console.log('SUBMISSIONS COMPLETE: ', current);
  // console.log(this.times.join('|'));
  // }
  // if (!prevState.rosterLoadComplete && this.state.rosterLoadComplete) {
  //   const current = Date.now() - this.timer;
  //   this.times = [...this.times, current];
  //   console.log('ROSTER COMPLETE: ', current);
  //   console.log(this.times.join('|'));
  // }
  // if (!prevState.sectionsLoadComplete && this.state.sectionsLoadComplete) {
  //   const current = Date.now() - this.timer;
  //   this.times = [...this.times, current];
  //   console.log('SECTIONS COMPLETE: ', current);
  //   console.log(this.times.join('|'));
  // }
  // if (!prevState.assignmentsLoadComplete && this.state.assignmentsLoadComplete) {
  //   const current = Date.now() - this.timer;
  //   this.times = [...this.times, current];
  //   console.log('ASSIGNMENTS COMPLETE: ', current);
  //   console.log(this.times.join('|'));
  // }
  // if (!prevState.submissionsbyUserLoadComplete && this.state.submissionsbyUserLoadComplete) {
  //   const current = Date.now() - this.timer;
  //   this.times = [...this.times, current];
  //   console.log('SUBMISSIONS BY USER COMPLETE: ', current);
  //   console.log(this.times.join('|'));
  // }
  // };

  /***********************************************************************************
  /* URL + UI handling methods
  /**********************************************************************************/

  public handleDemoCourse = (course?: CourseType) => {
    const searchParam = `?product_tour_id=${ADMIN_TOUR_ID}`;

    if (course !== undefined) {
      // Case 1: we just created the demo course, so add it to state
      const newCourses = this.state.courses;
      newCourses.push(course);
      this.setState({ courses: newCourses, onboardingModalVisible: false }, () => {
        this.props.addCourse(course);
        this.props.history.push({
          search: searchParam,
        });
      });
    } else {
      // Case 2: try to find the demo course in our existing list of courses
      const demoCourse = this.state.courses.find((el) => {
        return el.period === 'demo';
      });
      if (demoCourse !== undefined) {
        this.setState({ onboardingModalVisible: false }, () => {
          this.props.history.push({
            search: searchParam,
          });
        });
      }
    }
  };

  public openModal = () => {
    this.setState({ onboardingModalVisible: true });
  };

  public closeModal = () => {
    this.setState({ onboardingModalVisible: false });
    this.props.history.push(this.props.location.pathname);
  };

  /***********************************************************************************
  /* Load data and build data structures to cache relationships between
  /* objects.
  /**********************************************************************************/

  public loadAllCourseData = (course: CourseType) => {
    this.loadAssignments(course)
      .then((assignments) => {
        // use currentCourse as a nonce to see if this request is still desired
        if (this.props.currentCourse !== course) {
          return;
        }

        // update CommandBar
        window.CommandBar.addContext({ assignments });

        if (this.state.partialSubmissionsLoadComplete && this.state.rosterLoadComplete) {
          this.updateSubmissionsByUser(undefined, undefined, assignments, () => {
            this.setState({ assignments, assignmentsLoadComplete: true });
          });
        } else {
          this.setState({ assignments, assignmentsLoadComplete: true });
        }
      })
      .then(() => {
        this.loadSubmissions(course);
        this.loadViewsBySubmission(course);
      });

    this.loadRoster(course).then((roster) => {
      // use currentCourse as a nonce to see if this request is still desired
      if (this.props.currentCourse !== course) {
        return;
      }

      window.CommandBar.addContext({ graders: roster.graders });

      if (this.state.assignmentsLoadComplete && this.state.partialSubmissionsLoadComplete) {
        this.updateSubmissionsByUser(roster, undefined, undefined, () => {
          this.setState({
            rosterLoadComplete: true,
            students: roster.students,
            graders: roster.graders,
            admins: roster.courseAdmins,
            superGraders: roster.superGraders,
            inactiveStudents: roster.inactive_students,
            inactiveGraders: roster.inactive_graders,
            notActivated: roster.not_activated,
          });
        });
      } else {
        this.setState({
          rosterLoadComplete: true,
          students: roster.students,
          graders: roster.graders,
          admins: roster.courseAdmins,
          superGraders: roster.superGraders,
          inactiveStudents: roster.inactive_students,
          inactiveGraders: roster.inactive_graders,
          notActivated: roster.not_activated,
        });
      }
    });

    this.loadSections(course);

    if (this.props.currentCourse && this.props.currentCourse.id) {
      fetch(`${process.env.REACT_APP_API_URL}/billing/${this.props.currentCourse.id}/details/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return {};
        })
        .then((data: any) => {
          if (data.hasOwnProperty('show_banner')) {
            this.setState({ showBillingBanner: data['show_banner'] });
          }
        });
    }
  };

  public loadAssignments = (course: CourseType) => {
    const getData = course.assignments.map((assignmentID) => {
      return Assignment.read(assignmentID);
    });
    return Promise.all(getData);
  };

  /* eslint-disable no-useless-computed-key */
  public loadSubmissions = (course: CourseType) => {
    this.setState({ submissions: {}, partialSubmissionsLoadComplete: false, fullSubmissionsLoadComplete: false });
    const promises = course.assignments.map((assignmentID) => {
      return Assignment.readPaginatedSubmissions(
        assignmentID,
        this.onSubmissionsPagination.bind(this, course, assignmentID),
      );
    });
    Promise.all(promises).then(() =>
      this.setState({ partialSubmissionsLoadComplete: true, fullSubmissionsLoadComplete: true }),
    );
  };
  /* eslint-enable no-useless-computed-key */

  public loadRoster = (course: CourseType) => {
    return Course.readRoster(course.id);
  };

  public loadSections = (course: CourseType) => {
    Course.readPaginatedSections(course.id, this.onSectionPagination.bind(this, course)).then(() => {
      this.setState({ sectionsLoadComplete: true });
    });
  };

  public loadViewsBySubmission = (course: CourseType) => {
    course.assignments.forEach((assignmentID) => {
      Assignment.readPaginatedSubmissionHistories(assignmentID, this.onSubmissionHistoryPagination.bind(this, course));
    });
  };

  public generateSectionsByStudent = (sections: SectionType[]) => {
    const sectionsByStudent: { [studentEmail: string]: SectionType } = {};
    sections.forEach((section) => {
      section.students.forEach((student) => {
        sectionsByStudent[student] = section;
      });
    });
    return sectionsByStudent;
  };

  public updateSubmissionsByUser = (
    roster?: {
      students: string[];
      graders: string[];
      inactive_students: string[];
      inactive_graders: string[];
    },
    submissions?: IAssignmentToSubmissionsMap,
    assignments?: AssignmentType[],
    callback?: () => void,
  ) => {
    const submissionsToUse = submissions !== undefined ? submissions : this.state.submissions;
    const assignmentsToUse = assignments !== undefined ? assignments : this.state.assignments;
    let rosterToUse;
    if (roster) {
      rosterToUse = roster;
    } else {
      rosterToUse = {
        students: this.state.students,
        graders: this.state.graders,
        inactive_graders: this.state.inactiveGraders,
        inactive_students: this.state.inactiveStudents,
      };
    }
    const subsByUser = this.generateSubmissionsByUser(rosterToUse, submissionsToUse, assignmentsToUse);

    this.setState(
      {
        submissionsByStudent: subsByUser.subsByStudent,
        submissionsByGrader: subsByUser.subsByGrader,
        submissionsbyUserLoadComplete: true,
      },
      () => {
        if (callback) {
          callback();
        }
      },
    );
  };

  public generateSubmissionsByUser = (
    roster: {
      students: string[];
      graders: string[];
      inactive_students: string[];
      inactive_graders: string[];
    },
    submissions: IAssignmentToSubmissionsMap,
    assignments: AssignmentType[],
  ) => {
    const subsByStudent: IStudentSubmissionsDataTable = {};
    const subsByGrader: IGraderSubmissionsDataTable = {};

    const mixedStudentList = roster.students.concat(roster.inactive_students);
    mixedStudentList.forEach((student) => {
      subsByStudent[student] = {};
    });

    const mixedGraderList = roster.graders.concat(roster.inactive_graders);
    mixedGraderList.forEach((grader) => {
      subsByGrader[grader] = {};
      assignments.forEach((assignment) => {
        subsByGrader[grader][assignment.id] = [];
      });
    });

    assignments.forEach((assignment) => {
      const assignmentSubs = submissions[assignment.id];
      if (assignmentSubs) {
        assignmentSubs.forEach((submission: SubmissionInfoType) => {
          // NOTE: students in submission.students might be inactive
          submission.students.forEach((student: string) => {
            if (student in subsByStudent) {
              subsByStudent[student][assignment.id] = submission;
            }
          });

          // NOTE: graders in submission.students might be inactive
          if (submission.grader && submission.grader in subsByGrader) {
            subsByGrader[submission.grader][assignment.id].push(submission);
          }
        });
      }
    });

    return {
      subsByStudent,
      subsByGrader,
    };
  };

  /************************** Pagination Functions **************************/
  public onSubmissionsPagination = (course: CourseType, assignment: number, submissions: any[]) => {
    // use currentCourse as a nonce to see if this request is still desired
    if (this.props.currentCourse !== course) {
      return;
    }

    if (this.state.assignmentsLoadComplete && this.state.rosterLoadComplete) {
      const oldSubmissions = this.state.submissions[assignment] || [];
      const submissionMap = { ...this.state.submissions, [assignment]: [...oldSubmissions, ...submissions] };
      this.updateSubmissionsByUser(undefined, submissionMap, undefined, () => {
        this.setState((prevState, props) => {
          const oldSubmissions = prevState.submissions[assignment] || [];
          return {
            submissions: { ...prevState.submissions, [assignment]: [...oldSubmissions, ...submissions] },
            partialSubmissionsLoadComplete: true,
          };
        });
      });
    } else {
      this.setState((prevState, props) => {
        const oldSubmissions = prevState.submissions[assignment] || [];
        return {
          submissions: { ...prevState.submissions, [assignment]: [...oldSubmissions, ...submissions] },
          partialSubmissionsLoadComplete: true,
        };
      });
    }
  };

  public onSubmissionHistoryPagination = (course: CourseType, viewHistoryList: SubmissionHistoryType[]) => {
    if (this.props.currentCourse !== course) {
      return;
    }

    this.setState((prevState, prevProps) => {
      const newViewsBySubmission = { ...prevState.viewsBySubmission };
      viewHistoryList.forEach((viewHistory: SubmissionHistoryType) => {
        const { submission, student, hasViewed, dateViewed } = viewHistory;
        if (!(submission in newViewsBySubmission)) {
          newViewsBySubmission[submission] = {};
        }
        if (hasViewed && dateViewed) {
          newViewsBySubmission[submission][student] = dateViewed;
        }
      });
      return {
        viewsBySubmission: newViewsBySubmission,
      };
    });
  };

  public onSectionPagination = (course: CourseType, newSections: SectionType[]) => {
    // We first set the sections in state, because generateSectionsByStudent might take some time
    //    and we don't want race conditions of new pages overwriting other sections
    if (this.props.currentCourse !== course) {
      return;
    }

    this.setState(
      (prevState) => {
        return {
          sections: [...prevState.sections, ...newSections],
        };
      },
      () => {
        // Generate sections by student, and if all the sections have loaded (judged by sections.length)
        //  then we mark the section load as complete
        const sectionsByStudent = this.generateSectionsByStudent(this.state.sections);
        this.setState({
          sectionsByStudent,
        });
      },
    );
  };

  /************************************************************************
  /* Course handling methods
  /***********************************************************************/

  public createCourse = (courseName: string, coursePeriod: string, copiedCourse: CourseType | undefined) => {
    const payload = {
      id: -1, // codePost convention
      name: courseName,
      period: coursePeriod,
      assignments: [], // ignored by API
      sections: [], // ignored by API
      sendReleasedSubmissionsToBack: false,
      showStudentsStatistics: false,
      timezone: 'US/Eastern',
      emailNewUsers: false,
      anonymousGradingDefault: false,
      allowGradersToEditRubric: false,
      minComments: 0,
      noUnfinalize: false,
      lateDayCreditsAllowable: null,
      archived: false,
      activateQueue: true,
      inviteCode: '',
      emailWhitelist: '',
      inviteCodeEnabled: false,
      enableStudentFeedbackNotifications: false,
    };

    return Course.create(payload).then((course: CourseType) => {
      if (copiedCourse) {
        const getData = Promise.all(
          copiedCourse.assignments.map((assignmentID: number) => {
            return Assignment.read(assignmentID);
          }),
        ).then((assignments: AssignmentType[]) => {
          const sortedAssignments: AssignmentType[] = sortAssignments(assignments);
          return Promise.all(
            sortedAssignments.map((assignment) => {
              return Assignment.readRubric(assignment.id);
            }),
          ).then((rubrics: any) => {
            return [sortedAssignments, rubrics];
          });
        });

        return getData.then(([assignments, rubrics]) => {
          const sortedAssignments: AssignmentType[] = sortAssignments(assignments);
          return Promise.all(
            sortedAssignments.map((assignment: AssignmentType, index: number) => {
              const oldAssignmentID = assignment.id;
              assignment.id = -1;
              assignment.course = course.id;
              assignment.isReleased = false;
              assignment.sortKey = index;
              // Create Assignments
              return Assignment.create(assignment).then((newAssignment: AssignmentType) => {
                const rubric = rubrics.find((r: any) => r.id === oldAssignmentID);
                return Promise.all(
                  rubric.rubricCategories.map((rubricCategory: any) => {
                    const oldRubricCategoryId = rubricCategory.id;
                    rubricCategory.id = -1;
                    rubricCategory.assignment = newAssignment.id;
                    rubricCategory.rubricComments = [];
                    // Create Rubric Categories
                    return RubricCategory.create(rubricCategory).then((newRubricCategory: any) => {
                      const rubricComments = rubric.rubricComments.filter(
                        (c: any) => c.category === oldRubricCategoryId,
                      );
                      rubricComments.map((rubricComment: any) => {
                        rubricComment.id = -1;
                        rubricComment.category = newRubricCategory.id;
                        rubricComment.comments = [];
                        // Create Rubric Comments
                        return RubricComment.create(rubricComment);
                      });
                    });
                  }),
                ).then(() => {
                  // Return the new assignment so that it can be assigned to the course
                  return newAssignment;
                });
              });
            }),
          ).then((newAssignments) => {
            this.props.addCourse(course);
            this.props.history.push(`${formatCourseURL(course)}/assignments/overview`);
          });
        });
      } else {
        this.props.addCourse(course);
        this.props.history.push(`${formatCourseURL(course)}/assignments/overview`);
      }
    });
  };

  public updateSettings = (course: CoursePatchType) => {
    return Course.update(course).then((newCourse: CourseType) => {
      const newCourses = this.state.courses.filter((el) => {
        return el.id !== newCourse.id;
      });
      newCourses.push(newCourse);
      this.setState({ courses: newCourses });

      // gracefully handle situations in which user changes course name
      // by automatically updating active URL
      this.props.history.push(`${formatCourseURL(newCourse)}/settings`);
      return newCourse;
    });
  };

  /**********************************************************************************
  /* Roster handling methods
  /**********************************************************************************/

  public updateRoster = async (adds: string[], deletes: string[], userType: USER_APP) => {
    const { currentCourse } = this.props;

    if (!currentCourse) {
      return Promise.reject();
    }

    if (adds.length === 0 && deletes.length === 0) {
      return Promise.reject();
    }

    const makePayload = (role: USER_APP, users: string[]) => {
      const payload = { id: currentCourse.id };
      switch (role) {
        case USER_APP.Student:
          addToPayload(payload, 'students', users);
          break;
        case USER_APP.Grader:
          addToPayload(payload, 'graders', users);
          break;
        case USER_APP.CourseAdmin:
          addToPayload(payload, 'courseAdmins', users);
          break;
        case USER_APP.SuperGrader:
          addToPayload(payload, 'superGraders', users);
          break;
      }
      return payload;
    };

    let roster: RosterType | undefined = undefined;

    if (adds.length > 0) {
      const payload = makePayload(userType, adds);
      roster = await Course.addToRoster(payload);
    }

    if (deletes.length > 0) {
      const payload = makePayload(userType, deletes);
      roster = await Course.removeFromRoster(payload);
    }

    if (roster) {
      switch (userType) {
        case USER_APP.Student:
          this.setState(
            {
              students: roster.students,
              inactiveStudents: roster.inactive_students,
            },
            () => {
              this.updateSubmissionsByUser(roster);
            },
          );
          break;
        case USER_APP.Grader:
          this.setState(
            {
              graders: roster.graders,
              inactiveGraders: roster.inactive_graders,
            },
            () => {
              this.updateSubmissionsByUser(roster);
            },
          );
          break;
        case USER_APP.CourseAdmin:
          this.setState({ admins: roster.courseAdmins });
          break;
        case USER_APP.SuperGrader:
          this.setState({ superGraders: roster.superGraders });
          break;
      }
    }
  };

  /************************************************************************
  /* Section handling methods
  /***********************************************************************/

  public createSection = (newSection: string) => {
    if (!this.props.currentCourse) {
      return Promise.reject();
    }
    const payload = {
      name: newSection,
      course: this.props.currentCourse.id,
      leaders: [],
      students: [],
      id: -1,
    };

    return Section.create(payload).then((section: SectionType) => {
      const newSections = [...this.state.sections];
      const updatedCourse = { ...this.props.currentCourse! };
      newSections.push(section);
      updatedCourse.sections.push(section.id);
      this.setState({ sections: newSections });
      return section;
    });
  };

  public deleteSection = (sectionID: number) => {
    const sections = this.state.sections;

    const thisSection = sections.find((section) => {
      return section.id === sectionID;
    });

    if (!thisSection) {
      return Promise.reject('No section with this ID exists.');
    }

    const students = thisSection.students;
    return Section.delete(sectionID).then(() => {
      const { sectionsByStudent } = this.state;
      const { currentCourse } = this.props;
      // remove deleted section from state
      const newSections = sections.filter((section) => {
        return section.id !== sectionID;
      });
      // remove section from currentCourseID
      const newSectionIDs = newSections.map((section) => {
        return section.id;
      });
      if (currentCourse) {
        currentCourse.sections = newSectionIDs;
      }
      // remove each student from deleted section from section mapping
      students.forEach((student) => {
        delete sectionsByStudent[student];
      });
      this.setState({
        sections: newSections,
        sectionsByStudent,
      });
      return;
    });
  };

  public updateSection = (toUpdate: SectionType): Promise<void> => {
    // get old section corresponding to this one
    const oldSection = this.state.sections.find((el) => {
      return el.id === toUpdate.id;
    });

    if (!oldSection) {
      return Promise.reject('This section does not exist.');
    }

    const oldStudents = [...oldSection.students];

    return Section.update(toUpdate).then((newSection) => {
      // We need to do two things here:
      // (1) Update this.state.sectionsByStudent to reflect new section assignments
      // (2) Update this.state.sections to reflect both newSection, and changes
      // to other sections (removed students).

      // calculate changes made
      const newStudents = toUpdate.students;
      const removedStudents = oldStudents.filter((student) => {
        return !newStudents.includes(student);
      });

      const addedStudents = newStudents.filter((student) => {
        return !oldStudents.includes(student);
      });

      // Task 1: update this.state.sectionsByStudent
      const sectionMap = { ...this.state.sectionsByStudent };
      for (const removed of removedStudents) {
        delete sectionMap[removed];
      }
      for (const added of addedStudents) {
        sectionMap[added] = newSection;
      }

      // Task 2: update this.state.sections
      const otherSections = this.state.sections
        .filter((el) => {
          return el.id !== newSection.id;
        })
        .map((el) => {
          return {
            ...el,
            students: el.students.filter((stu) => {
              return addedStudents.indexOf(stu) === -1;
            }),
          };
        });

      this.setState({
        sections: [...otherSections, newSection],
        sectionsByStudent: sectionMap,
      });
      return;
    });
  };

  public updateStudentSection = (studentEmail: string, sectionID: number): Promise<void> => {
    const oldSection = this.state.sectionsByStudent[studentEmail];
    const newSection = this.state.sections.find((el) => {
      return el.id === sectionID;
    });

    const promises = [];

    // we only need to update one section: updateSection does the work
    // of removing the student from its old section if we update
    // the new one, so only update the old one if no new one exists
    if (newSection) {
      const updatedSection = _.cloneDeep(newSection);
      // Assume that student is not a member of this section
      updatedSection.students = [...updatedSection.students, studentEmail];
      promises.push(this.updateSection(updatedSection));
    } else if (oldSection) {
      const updatedSection = _.cloneDeep(oldSection);
      updatedSection.students = updatedSection.students.filter((el: string) => {
        return el !== studentEmail;
      });
      promises.push(this.updateSection(updatedSection));
    }

    return Promise.all(promises).then(() => {
      // coerce into a single promise
      return;
    });
  };

  /************************************************************************
  /* Assignment handling methods
  /***********************************************************************/

  public updateAssignment = (patchObj: AssignmentPatchType): Promise<void> => {
    const { assignments } = this.state;
    const newAssignments: AssignmentType[] = [];

    return Assignment.update(patchObj)
      .then((assignment) => {
        assignments.forEach((assn) => {
          if (assn.id === assignment.id) {
            newAssignments.push(assignment);
          } else {
            newAssignments.push(assn);
          }
        });
        this.setState({ assignments: newAssignments });
        return;
      })
      .catch((errors) => {
        return Promise.reject(errors);
      });
  };

  public shallowUpdateAssignment = (assignmentID: number, field: string, value: number) => {
    const { assignments } = this.state;
    const newAssignments: AssignmentType[] = [];
    assignments.forEach((assn) => {
      if (assn.id === assignmentID) {
        const updatedAssignment = { ...assn, [field]: value };
        newAssignments.push(updatedAssignment);
      } else {
        newAssignments.push(assn);
      }
    });
    this.setState({ assignments: newAssignments });
  };

  public createAssignment = (
    aName: string,
    aPoints: number,
    studentUpload: boolean,
    isVisible: boolean,
    dueDate?: string,
    sortKey?: number,
  ): Promise<AssignmentType> => {
    const { currentCourse } = this.props;
    if (!currentCourse) {
      return Promise.reject();
    }

    const payload = {
      id: -1, // codePost convention
      course: currentCourse.id,
      name: aName,
      points: aPoints,
      isReleased: false,
      hideGrades: false,
      rubricCategories: [],
      sortKey,
      allowStudentUpload: studentUpload,
      uploadDueDate: dueDate,
      isVisible,
    };

    return Assignment.create(payload).then((assignment: AssignmentType) => {
      const { submissions, assignments, submissionsByGrader } = this.state;

      // Add empty list to each grader's assigned list
      const newSubsByGrader = { ...submissionsByGrader };
      this.state.graders.forEach((grader) => {
        newSubsByGrader[grader][assignment.id] = [];
      });

      // A hard-to-reproduce bug is causing duplicate assignments to appear in the Admin Console
      // after assignment creation: https://github.com/jamesaevans/codePost-ui/issues/699
      //
      // To protect against this, the code cautiously removes duplicate assignments
      // whereever they might live (in state).
      const newAssignments = _.uniqBy([...assignments, assignment], (a: AssignmentType) => {
        return a.name;
      });
      submissions[assignment.id] = [];

      this.setState({
        submissions,
        assignments: newAssignments,
        submissionsByGrader: newSubsByGrader,
      });

      // Add assignment to course representations held in top-level state
      this.props.addAssignment(assignment);

      return assignment;
    });
  };

  public deleteAssignment = (toDelete: AssignmentType) => {
    const { assignments } = this.state;
    const { currentCourse } = this.props;

    if (!currentCourse) {
      return Promise.reject();
    }

    return Assignment.delete(toDelete.id).then(() => {
      const newAssignments = assignments.filter((el) => {
        return el.id !== toDelete.id;
      });
      const { submissions } = this.state;
      delete submissions[toDelete.id];

      const newAssignmentIDs = newAssignments.map((i) => {
        return i.id;
      });

      const newCurrentCourse = currentCourse;
      newCurrentCourse.assignments = newAssignmentIDs;

      // Remove assignment from course representations held in top-level state
      this.props.deleteAssignment(toDelete);

      this.setState(
        {
          assignments: newAssignments,
          submissions,
          submissionsbyUserLoadComplete: false,
        },
        () => {
          this.updateSubmissionsByUser(undefined, submissions, newAssignments);
        },
      );
    });
  };

  /************************************************************************
  /* Submission handling methods
  /***********************************************************************/

  /* Relevant data structures */
  // submissions (map: assignment id => submission list)
  // submissionsByStudent (map: student email => {assignment id => submission})
  // submissionsByGrader (map: grader email => {assignment id => submission list})

  public bulkUpdateSubmissions = (assignmentID: number, getPayload: (sub: SubmissionInfoType) => any) => {
    const { submissions } = this.state;
    const submissionsToUpdate = submissions[assignmentID];

    const promises = submissionsToUpdate.map((s) => {
      const payload = getPayload(s);
      return Submission.update(payload);
    });

    return Promise.all(promises).then((updatedSubmissions: SubmissionInfoType[]) => {
      const newSubmissions = { ...submissions };
      newSubmissions[assignmentID] = updatedSubmissions;
      this.updateSubmissionsByUser(undefined, newSubmissions, undefined);
      this.setState({
        submissions: newSubmissions,
      });
    });
  };

  public updateSubmission = (toUpdate: SubmissionInfoType) => {
    const { submissions, submissionsByStudent, submissionsByGrader } = this.state;

    /* Make sure we are acting on a submission linked to this course */
    const assignmentID = toUpdate.assignment;
    const oldSubmission = submissions[assignmentID].find((el) => {
      return el.id === toUpdate.id;
    });

    if (oldSubmission === undefined) {
      return Promise.reject('Submission does not exist');
    }

    return Submission.update(toUpdate).then((updated) => {
      /* use return value to replace existing submission */
      const newSubmissions = { ...submissions };
      newSubmissions[assignmentID] = [
        ...submissions[assignmentID].filter((s) => {
          return s.id !== updated.id;
        }),
        updated,
      ];

      /* update student mappings */

      /* remove students who used to be associated with this submission but no longer are */
      const newSubmissionsByStudent = { ...submissionsByStudent };
      const removedStudents = oldSubmission.students.filter((student) => {
        return updated.students.indexOf(student) < 0;
      });

      removedStudents.forEach((student) => {
        delete newSubmissionsByStudent[student][assignmentID];
      });

      /* update submission for students currently associated with submission */
      updated.students.forEach((student) => {
        newSubmissionsByStudent[student][assignmentID] = updated;
      });

      /* if old grader has been removed, update her mapping */
      const newGraderMap = { ...submissionsByGrader };
      if (oldSubmission.grader !== null && oldSubmission.grader !== undefined) {
        if (oldSubmission.grader !== updated.grader) {
          const newSubs = newGraderMap[oldSubmission.grader][assignmentID].filter((s) => {
            return s.id !== updated.id;
          });
          newGraderMap[oldSubmission.grader][assignmentID] = newSubs;
        }
      }

      /* update grader's mapping, if she exists */
      // By following the previous statement with this statement, this function can handle calls
      // which "reassign" the same grader to a submission. In this case, the submission will be
      // removed and then added from the grader's graded list.
      if (updated.grader !== null && updated.grader !== undefined) {
        const newSubs = [
          ...newGraderMap[updated.grader][assignmentID].filter((s) => {
            return s.id !== updated.id;
          }),
          updated,
        ];
        newGraderMap[updated.grader][assignmentID] = newSubs;
      }

      this.setState({
        submissions: newSubmissions,
        submissionsByStudent: newSubmissionsByStudent,
        submissionsByGrader,
      });
    });
  };

  public changeSubmissionGrader = (sub: SubmissionInfoType, grader: string | undefined) => {
    const newSub = { ...sub };
    newSub.grader = grader === undefined ? null : grader;
    return this.updateSubmission(newSub);
  };

  public deleteSubmission = (toDelete: SubmissionInfoType) => {
    const { submissions, submissionsByStudent, submissionsByGrader } = this.state;

    const assignmentID = toDelete.assignment;
    const sub = submissions[assignmentID].find((el) => {
      return el.id === toDelete.id;
    });

    if (sub === undefined) {
      return Promise.reject('Submission does not exist');
    }

    return Submission.delete(sub.id).then(() => {
      submissions[assignmentID] = submissions[assignmentID].filter((s) => {
        return s.id !== sub.id;
      });
      sub.students.forEach((student) => {
        delete submissionsByStudent[student][assignmentID];
      });
      if (sub.grader) {
        const newSubs = submissionsByGrader[sub.grader][assignmentID].filter((s) => {
          return s.id !== sub.id;
        });
        submissionsByGrader[sub.grader][assignmentID] = newSubs;
      }

      this.setState({ submissions, submissionsByStudent, submissionsByGrader });
    });
  };

  public getFileExtension = (fileName: string): string => {
    const split = fileName.split('.');
    return split.length === 1 ? 'txt' : split[split.length - 1];
  };

  public addFilesToSubmission = (submission: SubmissionInfoType, files: any[]) => {
    const filePromises = files.map((file: any) => {
      const ext = this.getFileExtension(file.name);
      const filePayload = {
        id: -1,
        name: file.name,
        extension: ext,
        code: file.data,
        submission: submission.id,
        comments: [],
        path: file.path ? file.path : null,
      };
      return File.create(filePayload);
    });

    return Promise.all(filePromises).then((files) => {
      return submission;
    });
  };

  // Upload a submission in cautious mode
  public uploadSubmission = (assignment: AssignmentType, partners: string[], files: any[]) => {
    if (partners.length === 0) {
      return Promise.reject();
    }

    const submissionPayload = {
      id: -1,
      isFinalized: false,
      files: [],
      assignment: assignment.id,
      students: partners,
    };

    const submissionPromise = Submission.create(submissionPayload).then((submission: SubmissionInfoType) => {
      // Create each file
      const filesPromise = this.addFilesToSubmission(submission, files);

      const { submissionsByStudent, submissions } = this.state;
      partners.forEach((student) => {
        if (!submissionsByStudent[student]) {
          submissionsByStudent[student] = {};
        }
        submissionsByStudent[student][assignment.id] = submission;
      });

      const newSubmissions = { ...submissions };
      const newAssignmentSubmissions = [...newSubmissions[submission.assignment], submission];
      newSubmissions[submission.assignment] = newAssignmentSubmissions;
      this.setState({ submissionsByStudent, submissions: newSubmissions });

      return filesPromise.then((newSubmission) => {
        return newSubmission;
      });
    });

    return submissionPromise;
  };

  /************************************************************************************
  /* Render
  /************************************************************************************/
  public render() {
    /* build header */
    const dropdown = (
      <CourseMenu
        base="admin"
        panel="assignments"
        courses={this.state.courses}
        currentCourse={this.props.currentCourse}
      />
    );
    const createButton = <NewCourseDialog courses={this.state.courses} createCourse={this.createCourse} />;
    const headerLeft = [dropdown, createButton];
    const logout = (
      <Button key="header-logout" onClick={this.props.handleLogout}>
        Logout
      </Button>
    );

    // add option to switch
    const headerRight = [
      <span key="header-user" className="cp-label cp-label--bold">
        {this.props.user.email}
      </span>,
      <Referral key="referral" user={this.props.user} theme="light" />,
      <RoleMenu key="header-roles" user={this.props.user} thisApp={USER_TYPE.ADMIN} theme="light" />,
      <CPTooltip key="settings" title={tooltips.management.header.settings} hideThisOnHideTips={true}>
        <Link className="internal-link" to="/settings">
          <SettingOutlined />
        </Link>
      </CPTooltip>,
      logout,
      <AdminOnboardingSelector
        visible={this.state.onboardingModalVisible}
        onCancel={this.closeModal}
        email={this.props.user.email}
        onDemoCreate={this.handleDemoCourse}
        demoCourseExists={this.state.courses.some((el) => {
          return el.period === 'demo';
        })}
      />,
    ];

    const header = <CPFlex left={headerLeft} right={headerRight} gutterSize={10} />;

    /* select relevant panel */
    let detail;
    if (this.state.courses.length === 0) {
      detail = (
        <Empty
          style={{ marginTop: 60 }}
          imageStyle={{
            height: 60,
          }}
          description={<span>Get started by creating a course!</span>}
        >
          {createButton}
        </Empty>
      );
    } else if (this.props.currentCourse) {
      detail = (
        <Switch>
          <Route
            path={`${this.props.match.url}/submissions`}
            render={(props: any) => (
              <SubmissionsManager
                {...props}
                key="submissions"
                course={this.props.currentCourse}
                loadComplete={
                  this.state.submissionsbyUserLoadComplete &&
                  this.state.assignmentsLoadComplete &&
                  this.state.fullSubmissionsLoadComplete
                }
                assignments={this.state.assignments}
                submissionsByStudent={this.state.submissionsByStudent}
                deleteSubmission={this.deleteSubmission}
                graders={this.state.graders}
                changeSubmissionGrader={this.changeSubmissionGrader}
                uploadSubmission={this.uploadSubmission}
                addFilesToSubmission={this.addFilesToSubmission}
                viewsBySubmission={this.state.viewsBySubmission}
                students={this.state.students}
                inactiveStudents={this.state.inactiveStudents}
                submissionsByAssignment={this.state.submissions}
                submissionsByGrader={this.state.submissionsByGrader}
                inactiveGraders={this.state.inactiveGraders}
                baseURL={this.props.match.url}
              />
            )}
          />
          {/*          loadComplete={
                  this.state.submissionsLoadComplete &&
                  this.state.assignmentsLoadComplete &&
                  this.state.submissionsbyUserLoadComplete
                }*/}
          <Route
            path={`${this.props.match.url}/assignments`}
            render={(props: any) => (
              <ManageAssignments
                {...props}
                key="assignments"
                loadComplete={this.state.assignmentsLoadComplete}
                partialSubmissionsLoadComplete={this.state.partialSubmissionsLoadComplete}
                fullSubmissionsLoadComplete={this.state.fullSubmissionsLoadComplete}
                submissionsByUserLoadComplete={this.state.submissionsbyUserLoadComplete}
                submissions={this.state.submissions}
                currentCourse={this.props.currentCourse}
                assignments={this.state.assignments}
                updateAssignment={this.updateAssignment}
                createAssignment={this.createAssignment}
                deleteAssignment={this.deleteAssignment}
                submissionsByStudent={this.state.submissionsByStudent}
                students={this.state.students}
                uploadSubmission={this.uploadSubmission}
                deleteSubmission={this.deleteSubmission}
                updateSubmission={this.updateSubmission}
                viewsBySubmission={this.state.viewsBySubmission}
                refreshCourseData={this.loadAllCourseData.bind(this, this.props.currentCourse!)}
                myEmail={this.props.user.email}
                user={this.props.user}
                location={this.props.location}
                shallowUpdateAssignment={this.shallowUpdateAssignment}
                bulkUpdateSubmissions={this.bulkUpdateSubmissions}
                sections={this.state.sections}
                courses={this.state.courses}
              />
            )}
          />
          <Route
            path={`${this.props.match.url}/roster`}
            render={(props: any) => (
              <RosterManager
                {...props}
                key="roster"
                notActivated={this.state.notActivated}
                sections={this.state.sections}
                students={this.state.students}
                graders={this.state.graders}
                admins={this.state.admins}
                superGraders={this.state.superGraders}
                loadComplete={this.state.rosterLoadComplete}
                sectionsLoadComplete={this.state.sectionsLoadComplete}
                currentCourse={this.props.currentCourse}
                updateRoster={this.updateRoster}
                sectionsByStudent={this.state.sectionsByStudent}
                updateSection={this.updateSection}
                createSection={this.createSection}
                updateStudentSection={this.updateStudentSection}
                myEmail={this.props.user.email}
                deleteSection={this.deleteSection}
              />
            )}
          />
          <Route
            path={`${this.props.match.url}/settings/webhooks`}
            render={(props: any) => <WebhooksPanel {...props} currentCourse={this.props.currentCourse!} />}
          />
          <Route
            path={`${this.props.match.url}/settings`}
            render={(props: any) => (
              <CourseSettingsPanel
                {...props}
                currentCourse={this.props.currentCourse!}
                updateSettings={this.updateSettings}
              />
            )}
          />
          <Route
            path={`${this.props.match.url}/video`}
            key="video"
            render={(props: any) => <VideoModal visible={true} onCancel={() => this.props.history.push('/admin')} />}
          />
        </Switch>
      );
    }

    const navigation = (collapsed: boolean) => (
      <Switch>
        <Route
          path={`${this.props.match.url}/:panel1?/:panel2?`}
          render={(props: any) => <AdminNav {...props} baseURL={this.props.match.url} collapsed={collapsed} />}
        />
      </Switch>
    );

    // Only shoow banner if a coursei s defined, assignemtns
    const banner =
      this.props.currentCourse && this.state.assignments && this.state.assignments.length === 1 ? (
        <AssignmentSetupBanner
          course={this.props.currentCourse}
          hasStudents={this.state.students.length > 0}
          hasSubmissions={
            this.state.submissions &&
            this.state.submissions[this.state.assignments[0].id] &&
            this.state.submissions[this.state.assignments[0].id].length > 0
          }
          onClose={() => {}}
          assignment={this.state.assignments[0]}
        />
      ) : (
        undefined
      );

    return (
      <CPLayoutAdmin
        showBillingBanner={this.state.showBillingBanner ? this.props.match.url + '/billing' : undefined}
        header={header}
        banner={banner}
        detail={
          <span>
            {detail}
            {
              <CIPAdminModal
                visible={this.state.cipModalVisible}
                onClose={() => this.setState({ cipModalVisible: false })}
                user={this.props.user}
                onCreateCourse={() => {
                  this.setState({ cipModalVisible: false });
                  const newCourseButton = document.getElementById('new-course-button');
                  if (newCourseButton) {
                    newCourseButton.click();
                  }
                }}
                onCreateDemoCourse={this.handleDemoCourse}
              />
            }
          </span>
        }
        navigation={navigation}
        collapsible={true}
        role={USER_TYPE.ADMIN}
      />
    );
  }
}

export default Admin;
