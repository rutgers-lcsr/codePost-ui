/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Empty, Icon, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

import CPDropdown from '../core/CPDropdown';
import CPFlex from '../core/CPFlex';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

/* other library imports */
import _ from 'lodash';
import queryString from 'query-string';

import { Link } from 'react-router-dom';

/* codePost imports */
import CPLayoutAdmin from './other/CPLayoutAdmin';

import GraderData from './submissions/GraderSubmissions';
import StudentData from './submissions/StudentSubmissions';

import ManageAssignments from './assignments/ManageAssignments';

import ManageAdmins from './roster/ManageAdmins';
import ManageGraders from './roster/ManageGraders';
import ManageSections from './roster/ManageSections';
import ManageStudents from './roster/ManageStudents';

import RoleMenu from '../core/RoleMenu';

import CourseSettingsPanel from './settings/CourseSettingsPanel';

import NewCourseDialog from './other/NewCourseDialog';

import AdminNav from './other/AdminNav';

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
import { Submission, SubmissionType } from '../../infrastructure/submission';
import { SubmissionHistoryType } from '../../infrastructure/submissionHistory';
import { UserType } from '../../infrastructure/user';
import { addToPayload } from '../../infrastructure/utils';

import { AdminOnboardingSelector } from '../core/OnboardingSelector';

import { ADMIN_TOUR_ID } from '../../routes';

/**********************************************************************************************************************/

export enum PANELS {
  SUBMISSION_STUDENTS,
  SUBMISSION_GRADERS,
  ASSIGNMENTS,
  ROSTER_STUDENTS,
  ROSTER_GRADERS,
  ROSTER_ADMINS,
  ROSTER_SECTIONS,
  SETTINGS,
}

const panels = {
  [PANELS.SUBMISSION_STUDENTS]: 'submissions/by_student',
  [PANELS.SUBMISSION_GRADERS]: 'submissions/by_grader',
  [PANELS.ASSIGNMENTS]: 'assignments/',
  [PANELS.ROSTER_STUDENTS]: 'roster/students',
  [PANELS.ROSTER_GRADERS]: 'roster/graders',
  [PANELS.ROSTER_ADMINS]: 'roster/admins',
  [PANELS.ROSTER_SECTIONS]: 'roster/sections',
  [PANELS.SETTINGS]: 'settings/',
};

const panelStrings = [
  'submissions/by_student',
  'submissions/by_grader',
  'assignments/',
  'roster/students',
  'roster/graders',
  'roster/admins',
  'roster/sections',
  'settings/',
];

// 5 minute interval for automatic reload
const LOADING_INTERVAL = 300000;

interface IAdminState {
  /**** UI control data ****/
  currentPanel: PANELS;
  onboardingModalVisible: boolean;

  /**** Top-level course data ****/
  currentCourse?: CourseType;
  courses: CourseType[];

  /**** Roster data ****/
  rosterLoadComplete: boolean;
  students: string[];
  inactiveStudents: string[];
  graders: string[];
  inactiveGraders: string[];
  admins: string[];
  superGraders: string[];

  /**** Sections data ****/
  sectionsLoadComplete: boolean;
  sections: SectionType[];
  sectionsByStudent: { [studentEmail: string]: SectionType };

  /**** Assignments data ****/
  assignmentsLoadComplete: boolean;
  assignments: AssignmentType[];

  /*** Submissions data ****/
  submissionsLoadComplete: boolean;
  submissionsbyUserLoadComplete: boolean;
  submissions: IAssignmentToSubmissionsMap;
  submissionsByStudent: IStudentSubmissionsDataTable;
  submissionsByGrader: IGraderSubmissionsDataTable;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
}

interface IAdminProps {
  initialCourses: CourseType[];
  addAssignment: (assignment: AssignmentType) => void;
  deleteAssignment: (assignment: AssignmentType) => void;
  addCourse: (newCourse: CourseType) => void;
  user: UserType;
  match: any;
  history: any;
  location: any;
  logout: () => void;
}

class Admin extends React.Component<IAdminProps, IAdminState> {
  private interval: number;

  public constructor(props: IAdminProps) {
    super(props);
    const { course, panel } = this.setStateFromURL(this.props.user.courseadminCourses);
    if (course) {
      this.changeURL(course, panel, true);
      this.loadAllCourseData(course);
    }

    this.state = {
      /**** UI control data ****/
      currentPanel: panel,
      onboardingModalVisible:
        Object.hasOwnProperty.bind(queryString.parse(this.props.location.search))('onboarding') ||
        this.props.initialCourses.length === 0,

      /**** Top-level course data ****/
      currentCourse: course,
      courses: _.cloneDeep(this.props.initialCourses),

      /**** Roster data ****/
      students: [],
      inactiveStudents: [],
      graders: [],
      inactiveGraders: [],
      admins: [],
      superGraders: [],
      rosterLoadComplete: false,

      /**** Sections data ****/
      sections: [],
      sectionsLoadComplete: false,
      sectionsByStudent: {},

      /**** Assignments data ****/
      assignments: [],
      assignmentsLoadComplete: false,

      /**** Submissions data ****/
      submissions: {},
      submissionsLoadComplete: false,
      submissionsByStudent: {},
      submissionsByGrader: {},
      submissionsbyUserLoadComplete: false,
      viewsBySubmission: {},
    };
  }

  public componentDidMount() {
    document.title = 'codePost - Admin Console';

    this.interval = window.setInterval(() => {
      if (this.state.currentCourse) {
        this.loadAllCourseData(this.state.currentCourse);
      }
    }, LOADING_INTERVAL);
  }

  public componentWillUnmount() {
    clearInterval(this.interval);
  }

  /***********************************************************************************
  /* URL + UI handling methods
  /**********************************************************************************/

  public panelFromString(name: string) {
    const toRet = panelStrings.indexOf(name);
    return toRet >= 0 ? toRet : 0;
  }

  public setStateFromURL = (courses: CourseType[]) => {
    const { courseName, period, panelName1, panelName2 } = this.props.match.params;
    if (courses.length === 0) {
      return { course: undefined, panel: 0 };
    } else {
      // is the URL trying to set the course?
      const tryingToSetCourse = courseName && period;
      let currentCourse: CourseType | undefined;
      let currentPanel = 0;
      if (tryingToSetCourse) {
        const formattedCourseName = courseName.replace(/_/g, ' ');
        const formattedPeriod = period.replace(/_/g, ' ');
        currentCourse = courses.find((obj: CourseType) => {
          return obj.name === formattedCourseName && obj.period === formattedPeriod;
        });
      }

      if (currentCourse) {
        currentPanel = this.panelFromString(`${panelName1}/${panelName2 ? panelName2 : ''}`);
      }

      if (!currentCourse && courses.length > 0) {
        currentCourse = courses.sort((a, b) => {
          return b.id - a.id;
        })[0];
      }

      return { course: currentCourse, panel: currentPanel };
    }
  };

  public updateNewCourse = (newCourse: CourseType) => {
    if (this.state.currentCourse && this.state.currentCourse.id === newCourse.id) {
      return;
    }

    // remove loading interval for existing course
    window.clearInterval(this.interval);
    window.clearTimeout(this.interval);

    this.setState(
      {
        currentCourse: newCourse,

        /**** Roster data ****/
        students: [],
        inactiveStudents: [],
        graders: [],
        inactiveGraders: [],
        admins: [],
        superGraders: [],
        rosterLoadComplete: false,

        /**** Sections data ****/
        sections: [],
        sectionsLoadComplete: false,
        sectionsByStudent: {},

        /**** Assignments data ****/
        assignments: [],
        assignmentsLoadComplete: false,

        /**** Submissions data ****/
        submissions: {},
        submissionsLoadComplete: false,
        submissionsByStudent: {},
        submissionsByGrader: {},
        submissionsbyUserLoadComplete: false,
        viewsBySubmission: {},
      },
      () => {
        this.changeURL(newCourse, this.state.currentPanel, true);
        this.loadAllCourseData(newCourse);

        // add loading interval for new course
        this.interval = window.setInterval(() => {
          this.loadAllCourseData(newCourse);
        }, LOADING_INTERVAL);
      },
    );
  };

  public handleCourseChange = (courseID: number) => {
    const newCourse = this.state.courses.find((course: CourseType) => {
      return course.id === courseID;
    });

    if (newCourse) {
      this.updateNewCourse(newCourse);
    }
  };

  public handleDemoCourse = (course?: CourseType) => {
    const searchParam = `?product_tour_id=${ADMIN_TOUR_ID}`;

    if (course !== undefined) {
      // Case 1: we just created the demo course, so add it to state
      const newCourses = this.state.courses;
      newCourses.push(course);
      this.setState({ courses: newCourses, onboardingModalVisible: false }, () => {
        this.props.addCourse(course);
        this.updateNewCourse(course);
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
          this.updateNewCourse(demoCourse);
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

  public changeURL = (course: CourseType, panel: number, keepQueryString: boolean) => {
    const formCourseName = course.name.replace(/ /g, '_');
    const formPeriod = course.period.replace(/ /g, '_');
    this.props.history.push({
      pathname: `/admin/${formCourseName}/${formPeriod}/${panels[panel]}`,
      search: keepQueryString ? this.props.location.search : '',
    });
  };

  public handleMenuClick = (e: ClickParam) => {
    this.handleCourseChange(parseInt(e.key, 10));
  };

  public changeTab = (panelNum: number) => {
    this.setState({ currentPanel: panelNum }, () => {
      if (this.state.currentCourse) {
        this.changeURL(this.state.currentCourse!, this.state.currentPanel, false);
      }
    });
  };

  public handleTabClick = (e: ClickParam) => {
    this.changeTab(parseInt(e.key, 10));
  };

  /***********************************************************************************
  /* Load data and build data structures to cache relationships between
  /* objects.
  /**********************************************************************************/
  public loadAllCourseData = (course: CourseType) => {
    this.loadAssignments(course).then((assignments) => {
      // use currentCourse as a nonce to see if this request is still desired
      if (this.state.currentCourse !== course) {
        return;
      }
      if (this.state.submissionsLoadComplete && this.state.rosterLoadComplete) {
        this.updateSubmissionsByUser(undefined, undefined, assignments, () => {
          this.setState({ assignments, assignmentsLoadComplete: true });
        });
      } else {
        this.setState({ assignments, assignmentsLoadComplete: true });
      }
    });

    this.loadSubmissions(course).then((submissionList) => {
      // use currentCourse as a nonce to see if this request is still desired
      if (this.state.currentCourse !== course) {
        return;
      }
      const submissionMap = {};
      submissionList.forEach((submissionObj) => {
        submissionMap[submissionObj.assignment] = submissionObj.submissions;
      });
      if (this.state.assignmentsLoadComplete && this.state.rosterLoadComplete) {
        this.updateSubmissionsByUser(undefined, submissionMap, undefined, () => {
          this.setState({ submissions: submissionMap, submissionsLoadComplete: true });
        });
      } else {
        this.setState({ submissions: submissionMap, submissionsLoadComplete: true });
      }
    });

    this.loadRoster(course).then((roster) => {
      if (this.state.currentCourse !== course) {
        return;
      }
      if (this.state.assignmentsLoadComplete && this.state.submissionsLoadComplete) {
        this.updateSubmissionsByUser(roster, undefined, undefined, () => {
          this.setState({
            rosterLoadComplete: true,
            students: roster.students,
            graders: roster.graders,
            admins: roster.courseAdmins,
            superGraders: roster.superGraders,
            inactiveStudents: roster.inactive_students,
            inactiveGraders: roster.inactive_graders,
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
        });
      }
    });

    this.loadSections(course).then((sections) => {
      if (this.state.currentCourse !== course) {
        return;
      }
      const sectionsByStudent = this.generateSectionsByStudent(sections);
      this.setState({
        sections,
        sectionsByStudent,
        sectionsLoadComplete: true,
      });
    });

    this.loadViewsBySubmission(course).then((viewHistoryLists) => {
      if (this.state.currentCourse !== course) {
        return;
      }
      const viewsBySubmission = this.generateViewsBySubmissions(viewHistoryLists);
      this.setState({ viewsBySubmission });
    });
  };

  public loadAssignments = (course: CourseType) => {
    const getData = course.assignments.map((assignmentID) => {
      return Assignment.read(assignmentID);
    });
    return Promise.all(getData);
  };

  public loadSubmissions = (course: CourseType) => {
    return Promise.all(
      course.assignments.map((assignmentID) => {
        return Assignment.readSubmissions(assignmentID).then((subs: SubmissionType[]) => {
          return {
            assignment: assignmentID,
            submissions: subs,
          };
        });
      }),
    );
  };

  public loadRoster = (course: CourseType) => {
    return Course.readRoster(course.id);
  };

  public loadSections = (course: CourseType) => {
    return Promise.all(
      course.sections.map((sectionID) => {
        return Section.read(sectionID);
      }),
    );
  };

  public loadViewsBySubmission = (course: CourseType) => {
    return Promise.all(
      course.assignments.map((assignmentID) => {
        return Assignment.readSubmissionHistories(assignmentID);
      }),
    );
  };

  public generateViewsBySubmissions = (viewHistoryLists: SubmissionHistoryType[][]) => {
    const viewsBySubmission = {};
    viewHistoryLists.forEach((viewHistoryList: SubmissionHistoryType[]) => {
      viewHistoryList.forEach((viewHistory: SubmissionHistoryType) => {
        const { submission, student, hasViewed, dateViewed } = viewHistory;
        if (!(submission in viewsBySubmission)) {
          viewsBySubmission[submission] = {};
        }
        if (hasViewed) {
          viewsBySubmission[submission][student] = dateViewed;
        }
      });
    });
    return viewsBySubmission;
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
    roster?: { students: string[]; graders: string[]; inactive_students: string[]; inactive_graders: string[] },
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
    roster: { students: string[]; graders: string[]; inactive_students: string[]; inactive_graders: string[] },
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
      assignmentSubs.forEach((submission: SubmissionType) => {
        // NOTE: students in submission.students might be inactive
        submission.students.forEach((student: string) => {
          if (student in subsByStudent) {
            subsByStudent[student][assignment.id] = submission;
          }
        });

        // NOTE: graders in submission.students might be inactive
        if (submission.grader) {
          subsByGrader[submission.grader][assignment.id].push(submission);
        }
      });
    });

    return {
      subsByStudent,
      subsByGrader,
    };
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
            course.assignments = newAssignments.map((i: AssignmentType) => {
              return i.id;
            });
            const newCourses = this.state.courses;
            newCourses.push(course);
            this.setState({ courses: newCourses }, () => this.props.addCourse(course));
            return this.updateNewCourse(course);
          });
        });
      } else {
        const newCourses = this.state.courses;
        newCourses.push(course);
        this.setState({ courses: newCourses, currentPanel: 0 }, () => this.props.addCourse(course));
        this.updateNewCourse(course);
        return;
      }
    });
  };

  public updateSettings = (course: CoursePatchType) => {
    return Course.update(course).then((newCourse: CourseType) => {
      const newCourses = this.state.courses.filter((el) => {
        return el.id !== newCourse.id;
      });
      newCourses.push(newCourse);
      this.setState({ currentCourse: newCourse, courses: newCourses });

      // gracefully handle situations in which user changes course name
      // by automatically updating active URL
      this.changeURL(newCourse, this.state.currentPanel, false);
      return newCourse;
    });
  };

  /**********************************************************************************
  /* Roster handling methods
  /**********************************************************************************/

  public updateRoster = (newRoster: string[], userType: USER_APP) => {
    const { currentCourse } = this.state;

    if (!currentCourse) {
      return Promise.reject();
    }

    const payload = { id: currentCourse.id };
    switch (userType) {
      case USER_APP.Student:
        addToPayload(payload, 'students', newRoster);
        break;
      case USER_APP.Grader:
        addToPayload(payload, 'graders', newRoster);
        break;
      case USER_APP.CourseAdmin:
        addToPayload(payload, 'courseAdmins', newRoster);
        break;
      case USER_APP.SuperGrader:
        addToPayload(payload, 'superGraders', newRoster);
        break;
    }

    return (
      Course.updateRoster(payload)
        .then((roster: RosterType) => {
          switch (userType) {
            case USER_APP.Student:
              this.setState({ students: roster.students, inactiveStudents: roster.inactive_students }, () => {
                this.updateSubmissionsByUser(roster);
              });
              break;
            case USER_APP.Grader:
              this.setState({ graders: roster.graders, inactiveGraders: roster.inactive_graders }, () => {
                this.updateSubmissionsByUser(roster);
              });
              break;
            case USER_APP.CourseAdmin:
              this.setState({ admins: roster.courseAdmins });
              break;
            case USER_APP.SuperGrader:
              this.setState({ superGraders: roster.superGraders });
              break;
          }
          return;
        })
        // Error catching assumes a returned dictionary of type <errorType: string : [errors:string]>
        .catch((errors) => {
          return Promise.reject();
        })
    );
  };

  /************************************************************************
  /* Section handling methods
  /***********************************************************************/

  public createSection = (newSection: string) => {
    if (!this.state.currentCourse) {
      return Promise.reject();
    }
    const payload = {
      name: newSection,
      course: this.state.currentCourse.id,
      leaders: [],
      students: [],
      id: -1,
    };

    return Section.create(payload).then((section: SectionType) => {
      const newSections = [...this.state.sections];
      const updatedCourse = { ...this.state.currentCourse! };
      newSections.push(section);
      updatedCourse.sections.push(section.id);
      this.setState({ sections: newSections, currentCourse: updatedCourse });
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
      const { currentCourse, sectionsByStudent } = this.state;
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
      this.setState({ currentCourse, sections: newSections, sectionsByStudent });
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
      const cleanedSections = [
        ...this.state.sections.filter((el) => {
          return el.id !== newSection.id;
        }),
        newSection,
      ];

      // have the students changed?
      const newStudents = toUpdate.students;
      const removedStudents = oldStudents.filter((student) => {
        return !newStudents.includes(student);
      });

      const addedStudents = newStudents.filter((student) => {
        return !oldStudents.includes(student);
      });

      // update cached data structure
      const sectionMap = { ...this.state.sectionsByStudent };
      for (const removed of removedStudents) {
        delete sectionMap[removed];
      }
      for (const added of addedStudents) {
        sectionMap[added] = newSection;
      }

      this.setState({ sections: cleanedSections, sectionsByStudent: sectionMap });
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
      updatedSection.students = updatedSection.students.filter((el) => {
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

  public createAssignment = (aName: string, aPoints: number): Promise<AssignmentType> => {
    const { currentCourse } = this.state;
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
    };

    return Assignment.create(payload).then((assignment: AssignmentType) => {
      const { submissions, assignments, submissionsByGrader } = this.state;

      // Add empty list to each grader's assigned list
      const newSubsByGrader = { ...submissionsByGrader };
      this.state.graders.forEach((grader) => {
        newSubsByGrader[grader][assignment.id] = [];
      });

      currentCourse.assignments.push(assignment.id);
      submissions[assignment.id] = [];
      const newAssignments = [...assignments, assignment];
      this.setState({ currentCourse, submissions, assignments: newAssignments, submissionsByGrader: newSubsByGrader });

      // Add assignment to course representations held in top-level state
      this.props.addAssignment(assignment);

      return assignment;
    });
  };

  public deleteAssignment = (toDelete: AssignmentType) => {
    const { currentCourse, assignments } = this.state;
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
          currentCourse: newCurrentCourse,
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

  public updateSubmission = (toUpdate: SubmissionType) => {
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

  public changeSubmissionGrader = (sub: SubmissionType, grader: string | undefined) => {
    const newSub = { ...sub };
    newSub.grader = grader === undefined ? null : grader;
    return this.updateSubmission(newSub);
  };

  public deleteSubmission = (toDelete: SubmissionType) => {
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

    const submissionPromise = Submission.create(submissionPayload).then((submission: SubmissionType) => {
      // Create each file
      const filePromises = files.map((file: any) => {
        const ext = this.getFileExtension(file.name);
        const filePayload = {
          id: -1,
          name: file.name,
          extension: ext,
          code: file.data,
          submission: submission.id,
          comments: [],
        };
        return File.create(filePayload);
      });

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
      return Promise.all(filePromises).then(() => {
        return;
      });
    });

    return submissionPromise;
  };

  /************************************************************************************
  /* Render
  /************************************************************************************/
  public render() {
    /* build header */
    const menu = (
      <Menu onClick={this.handleMenuClick}>
        {this.props.user.courseadminCourses.map((course, i) => {
          return <Menu.Item key={course.id}>{`${course.name} | ${course.period}`}</Menu.Item>;
        })}
      </Menu>
    );
    let selectorText = 'No courses yet...';
    if (this.state.currentCourse) {
      selectorText = `${this.state.currentCourse.name} | ${this.state.currentCourse.period}`;
    }
    // Dropdown overlay maxHeight is to create scroll for long menus that scales with window height
    const dropdown = (
      <CPDropdown
        value={selectorText}
        overlay={menu}
        overlayStyle={{ maxHeight: 'calc(100vh - 60px)', overflowY: 'auto' }}
      />
    );
    const createButton = <NewCourseDialog courses={this.state.courses} createCourse={this.createCourse} />;

    const headerLeft = [dropdown, createButton];
    // add option to switch
    const headerRight = [
      <span key="header-user" className="cp-label cp-label--bold">
        {this.props.user.email}
      </span>,
      <RoleMenu key="header-roles" user={this.props.user} thisApp={USER_TYPE.ADMIN} theme="light" />,
      <CPTooltip key="settings" title={tooltips.management.header.settings} hideThisOnHideTips={true}>
        <Link className="internal-link" to="/settings">
          <Icon type="setting" />
        </Link>
      </CPTooltip>,
      <Button key="header-logout" size="small" onClick={this.props.logout}>
        Logout
      </Button>,
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
    } else if (this.state.currentCourse) {
      switch (this.state.currentPanel) {
        case PANELS.SUBMISSION_STUDENTS:
          detail = (
            <StudentData
              loadComplete={this.state.submissionsbyUserLoadComplete && this.state.assignmentsLoadComplete}
              assignments={this.state.assignments}
              submissionsByStudent={this.state.submissionsByStudent}
              deleteSubmission={this.deleteSubmission}
              graders={this.state.graders}
              changeSubmissionGrader={this.changeSubmissionGrader}
              uploadSubmission={this.uploadSubmission}
              viewsBySubmission={this.state.viewsBySubmission}
              changeTab={this.changeTab}
              students={this.state.students}
              inactiveStudents={this.state.inactiveStudents}
            />
          );
          break;
        case PANELS.SUBMISSION_GRADERS:
          detail = (
            <GraderData
              loadComplete={this.state.submissionsbyUserLoadComplete && this.state.assignmentsLoadComplete}
              assignments={this.state.assignments}
              submissionsByAssignment={this.state.submissions}
              submissionsByGrader={this.state.submissionsByGrader}
              deleteSubmission={this.deleteSubmission}
              graders={this.state.graders}
              uploadSubmission={this.uploadSubmission}
              viewsBySubmission={this.state.viewsBySubmission}
              changeTab={this.changeTab}
              inactiveGraders={this.state.inactiveGraders}
            />
          );
          break;
        case PANELS.ASSIGNMENTS:
          detail = (
            <ManageAssignments
              key={this.state.currentCourse!.id}
              loadComplete={
                this.state.submissionsLoadComplete &&
                this.state.assignmentsLoadComplete &&
                this.state.submissionsbyUserLoadComplete
              }
              submissions={this.state.submissions}
              currentCourse={this.state.currentCourse}
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
              refreshCourseData={this.loadAllCourseData.bind(this, this.state.currentCourse!)}
            />
          );
          break;
        case PANELS.ROSTER_STUDENTS:
          detail = (
            <ManageStudents
              sections={this.state.sections}
              students={this.state.students}
              graders={this.state.graders}
              admins={this.state.admins}
              loadComplete={this.state.sectionsLoadComplete && this.state.rosterLoadComplete}
              currentCourse={this.state.currentCourse}
              updateRoster={this.updateRoster}
              sectionsByStudent={this.state.sectionsByStudent}
              updateSection={this.updateSection}
              createSection={this.createSection}
              updateStudentSection={this.updateStudentSection}
            />
          );
          break;
        case PANELS.ROSTER_GRADERS:
          detail = (
            <ManageGraders
              sections={this.state.sections}
              students={this.state.students}
              graders={this.state.graders}
              superGraders={this.state.superGraders}
              admins={this.state.admins}
              loadComplete={this.state.sectionsLoadComplete && this.state.rosterLoadComplete}
              currentCourse={this.state.currentCourse}
              updateRoster={this.updateRoster}
              sectionsByStudent={this.state.sectionsByStudent}
              updateSection={this.updateSection}
              createSection={this.createSection}
            />
          );
          break;
        case PANELS.ROSTER_ADMINS:
          detail = (
            <ManageAdmins
              sections={this.state.sections}
              students={this.state.students}
              graders={this.state.graders}
              admins={this.state.admins}
              loadComplete={this.state.sectionsLoadComplete && this.state.rosterLoadComplete}
              currentCourse={this.state.currentCourse}
              updateRoster={this.updateRoster}
              sectionsByStudent={this.state.sectionsByStudent}
              updateSection={this.updateSection}
              createSection={this.createSection}
              me={this.props.user.email}
            />
          );
          break;
        case PANELS.ROSTER_SECTIONS:
          detail = (
            <ManageSections
              sections={this.state.sections}
              students={this.state.students}
              graders={this.state.graders}
              admins={this.state.admins}
              loadComplete={this.state.sectionsLoadComplete && this.state.rosterLoadComplete}
              currentCourse={this.state.currentCourse}
              updateRoster={this.updateRoster}
              sectionsByStudent={this.state.sectionsByStudent}
              deleteSection={this.deleteSection}
              updateSection={this.updateSection}
              createSection={this.createSection}
            />
          );
          break;
        case PANELS.SETTINGS:
          detail = (
            <CourseSettingsPanel currentCourse={this.state.currentCourse!} updateSettings={this.updateSettings} />
          );
          break;
        default:
          detail = <div>{panels[this.state.currentPanel]}</div>;
      }
    }

    const navigation = (collapsed: boolean) => (
      <span>
        <AdminNav selectedPanel={this.state.currentPanel} onClick={this.handleTabClick} collapsed={collapsed} />
        <AdminOnboardingSelector
          visible={this.state.onboardingModalVisible}
          onCancel={this.closeModal}
          email={this.props.user.email}
          onDemoCreate={this.handleDemoCourse}
          demoCourseExists={this.state.courses.some((el) => {
            return el.period === 'demo';
          })}
        />
      </span>
    );

    return (
      <CPLayoutAdmin
        header={header}
        detail={detail}
        navigation={navigation}
        collapsible={true}
        role={USER_TYPE.ADMIN}
      />
    );
  }
}

export default Admin;
