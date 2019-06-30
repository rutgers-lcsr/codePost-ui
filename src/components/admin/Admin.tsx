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

// import { adminCarouselContent, ModalCarousel } from './components/Utils/ModalCarousel';

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
  [PANELS.SUBMISSION_STUDENTS]: 'submissions/students',
  [PANELS.SUBMISSION_GRADERS]: 'submissions/graders',
  [PANELS.ASSIGNMENTS]: 'assignments/',
  [PANELS.ROSTER_STUDENTS]: 'roster/students',
  [PANELS.ROSTER_GRADERS]: 'roster/graders',
  [PANELS.ROSTER_ADMINS]: 'roster/admins',
  [PANELS.ROSTER_SECTIONS]: 'roster/sections',
  [PANELS.SETTINGS]: 'settings/',
};

const panelStrings = [
  'submissions/students',
  'submissions/graders',
  'assignments/',
  'roster/students',
  'roster/graders',
  'roster/admins',
  'roster/sections',
  'settings/',
];

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
  submissionsByInactiveStudent: IStudentSubmissionsDataTable;
  submissionsByInactiveGrader: IGraderSubmissionsDataTable;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
}

interface IAdminProps {
  initialCourses: CourseType[];
  addCourse: (newCourse: CourseType) => void;
  user: UserType;
  match: any;
  history: any;
  location: any;
  logout: () => void;
}

class Admin extends React.Component<IAdminProps, IAdminState> {
  public constructor(props: IAdminProps) {
    super(props);
    const { course, panel } = this.setStateFromURL(this.props.user.courseadminCourses);
    if (course) {
      this.changeURL(course, panel);
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
      submissionsByInactiveStudent: {},
      submissionsByInactiveGrader: {},
      submissionsbyUserLoadComplete: false,
      viewsBySubmission: {},
    };
  }

  public componentDidMount() {
    document.title = 'codePost - Admin Console';
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
        currentCourse = courses[0];
      }

      return { course: currentCourse, panel: currentPanel };
    }
  };

  public updateNewCourse = (newCourse: CourseType) => {
    if (this.state.currentCourse && this.state.currentCourse.id === newCourse.id) {
      return;
    }

    this.setState(
      {
        currentCourse: newCourse,

        students: [],
        inactiveStudents: [],
        graders: [],
        inactiveGraders: [],
        admins: [],
        superGraders: [],
        rosterLoadComplete: false,

        sections: [],
        sectionsLoadComplete: false,

        sectionsByStudent: {},

        submissions: {},
        submissionsLoadComplete: false,

        assignments: [],
        assignmentsLoadComplete: false,

        submissionsByStudent: {},
        submissionsByGrader: {},
        submissionsByInactiveStudent: {},
        submissionsByInactiveGrader: {},
        submissionsbyUserLoadComplete: false,
      },
      () => {
        this.changeURL(newCourse, this.state.currentPanel);
        this.loadAllCourseData(newCourse);
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

  public handleDemoCourse = (course: CourseType) => {
    const newCourses = this.state.courses;
    newCourses.push(course);
    this.setState({ courses: newCourses }, () => {
      this.props.addCourse(course);
      this.updateNewCourse(course);
    });
    return;
  };

  public openModal = () => {
    this.setState({ onboardingModalVisible: true });
  };

  public closeModal = () => {
    this.setState({ onboardingModalVisible: false });
    this.props.history.push(this.props.location.pathname);
  };

  public changeURL = (course: CourseType, panel: number) => {
    const formCourseName = course.name.replace(/ /g, '_');
    const formPeriod = course.period.replace(/ /g, '_');
    this.props.history.push(`/admin/${formCourseName}/${formPeriod}/${panels[panel]}`);
  };

  public handleMenuClick = (e: ClickParam) => {
    this.handleCourseChange(parseInt(e.key, 10));
  };

  public changeTab = (panelNum: number) => {
    this.setState({ currentPanel: panelNum }, () => {
      if (this.state.currentCourse) {
        this.changeURL(this.state.currentCourse!, this.state.currentPanel);
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
      if (this.state.submissionsLoadComplete && this.state.rosterLoadComplete) {
        this.updateSubmissionsByUser(undefined, undefined, assignments, () => {
          this.setState({ assignments, assignmentsLoadComplete: true });
        });
      } else {
        this.setState({ assignments, assignmentsLoadComplete: true });
      }
    });

    this.loadSubmissions(course).then((submissionList) => {
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
      const sectionsByStudent = this.generateSectionsByStudent(sections);
      this.setState({
        sections,
        sectionsByStudent,
        sectionsLoadComplete: true,
      });
    });

    this.loadViewsBySubmission(course).then((viewHistoryLists) => {
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
    const submissionsToUse = submissions ? submissions : this.state.submissions;
    const assignmentsToUse = assignments ? assignments : this.state.assignments;
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
        submissionsByInactiveStudent: subsByUser.subsByInactiveStudent,
        submissionsByInactiveGrader: subsByUser.subsByInactiveGrader,
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
    const subsByInactiveStudent: IStudentSubmissionsDataTable = {};
    const subsByInactiveGrader: IGraderSubmissionsDataTable = {};

    roster.students.forEach((student) => {
      subsByStudent[student] = {};
    });

    roster.inactive_students.forEach((inactiveStudent) => {
      subsByInactiveStudent[inactiveStudent] = {};
    });

    roster.graders.forEach((grader) => {
      subsByGrader[grader] = {};
      assignments.forEach((assignment) => {
        subsByGrader[grader][assignment.id] = [];
      });
    });

    roster.inactive_students.forEach((inactiveGrader) => {
      subsByInactiveGrader[inactiveGrader] = {};
      assignments.forEach((assignment) => {
        subsByInactiveGrader[inactiveGrader][assignment.id] = [];
      });
    });

    assignments.forEach((assignment) => {
      const assignmentSubs = submissions[assignment.id];
      assignmentSubs.forEach((submission: SubmissionType) => {
        // NOTE: students in submission.students might be inactive
        submission.students.forEach((student: string) => {
          if (subsByStudent[student]) {
            subsByStudent[student][assignment.id] = submission;
          } else if (subsByInactiveStudent[student]) {
            subsByInactiveStudent[student][assignment.id] = submission;
          }
        });

        // NOTE: graders in submission.students might be inactive
        if (submission.grader) {
          if (submission.grader in subsByGrader) {
            subsByGrader[submission.grader][assignment.id].push(submission);
          } else if (submission.grader in subsByInactiveGrader) {
            if (subsByInactiveGrader[submission.grader][assignment.id]) {
              subsByInactiveGrader[submission.grader][assignment.id].push(submission);
            }
          }
        }
      });
    });

    return {
      subsByStudent,
      subsByGrader,
      subsByInactiveStudent,
      subsByInactiveGrader,
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
          return Promise.all(
            assignments.map((assignment: AssignmentType) => {
              const oldAssignmentID = assignment.id;
              assignment.id = -1;
              assignment.course = course.id;
              assignment.isReleased = false;
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
      this.changeURL(newCourse, this.state.currentPanel);
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
      const { submissions, assignments } = this.state;
      currentCourse.assignments.push(assignment.id);
      submissions[assignment.id] = [];
      const newAssignments = [...assignments, assignment];
      this.setState({ currentCourse, submissions, assignments: newAssignments });
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
  // submissionsByInactiveStudent (map: student email => {assignment id => submission})
  // submissionsByInactiveGrader (map: grader email => {assignment id => submission list})

  // FIXME: combine submissionsByStudent and submissionsByInactiveGrader
  public updateSubmission = (toUpdate: SubmissionType) => {
    const {
      submissions,
      submissionsByStudent,
      submissionsByGrader,
      submissionsByInactiveStudent,
      submissionsByInactiveGrader,
    } = this.state;

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
      submissions[assignmentID] = [
        ...submissions[assignmentID].filter((s) => {
          return s.id !== updated.id;
        }),
        updated,
      ];

      /* update student mappings */

      /* remove students who used to be associated with this submission but no longer are */
      const removedStudents = oldSubmission.students.filter((student) => {
        return updated.students.indexOf(student) < 0;
      });

      removedStudents.forEach((student) => {
        if (student in submissionsByStudent) {
          delete submissionsByStudent[student][assignmentID];
        }
        if (student in submissionsByInactiveStudent) {
          delete submissionsByInactiveStudent[student][assignmentID];
        }
      });

      /* add students who have been added to the submission */
      const addedStudents = updated.students.filter((student) => {
        return oldSubmission.students.indexOf(student) < 0;
      });

      addedStudents.forEach((student) => {
        if (student in submissionsByStudent) {
          submissionsByStudent[student][assignmentID] = updated;
        }
        if (student in submissionsByInactiveStudent) {
          submissionsByInactiveStudent[student][assignmentID] = updated;
        }
      });

      /* if old grader has been removed, update her mapping */
      if (oldSubmission.grader !== null) {
        if (oldSubmission.grader !== updated.grader) {
          if (oldSubmission.grader in submissionsByGrader) {
            const newSubs = submissionsByGrader[oldSubmission.grader][assignmentID].filter((s) => {
              return s.id !== updated.id;
            });
            submissionsByGrader[oldSubmission.grader][assignmentID] = newSubs;
          } else {
            const newSubs = submissionsByInactiveGrader[oldSubmission.grader][assignmentID].filter((s) => {
              return s.id !== updated.id;
            });
            submissionsByInactiveGrader[oldSubmission.grader][assignmentID] = newSubs;
          }
        }
      }

      /* if new grader has been added, update her mapping */
      if (updated.grader !== null) {
        if (updated.grader !== oldSubmission.grader) {
          if (updated.grader in submissionsByGrader) {
            const newSubs = [...submissionsByGrader[updated.grader][assignmentID], updated];
            submissionsByGrader[updated.grader][assignmentID] = newSubs;
          } else {
            const newSubs = [...submissionsByInactiveGrader[updated.grader][assignmentID], updated];
            submissionsByInactiveGrader[updated.grader][assignmentID] = newSubs;
          }
        }
      }

      this.setState({
        submissions,
        submissionsByStudent,
        submissionsByGrader,
        submissionsByInactiveStudent,
        submissionsByInactiveGrader,
      });
    });
  };

  public deleteSubmission = (toDelete: SubmissionType) => {
    const {
      submissions,
      submissionsByStudent,
      submissionsByGrader,
      submissionsByInactiveStudent,
      submissionsByInactiveGrader,
    } = this.state;

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
      this.setState({ submissions });
      sub.students.forEach((student) => {
        if (student in submissionsByStudent) {
          delete submissionsByStudent[student][assignmentID];
          this.setState({ submissionsByStudent });
        }
        if (student in submissionsByInactiveStudent) {
          delete submissionsByInactiveStudent[student][assignmentID];
          this.setState({ submissionsByInactiveStudent });
        }
      });
      if (sub.grader && sub.grader in submissionsByGrader) {
        const newSubs = submissionsByGrader[sub.grader][assignmentID].filter((s) => {
          return s.id !== sub.id;
        });
        submissionsByGrader[sub.grader][assignmentID] = newSubs;
        this.setState({ submissionsByGrader });
      }
      if (sub.grader && sub.grader in submissionsByInactiveGrader) {
        const newSubs = submissionsByInactiveGrader[sub.grader][assignmentID].filter((s) => {
          return s.id !== sub.id;
        });
        submissionsByInactiveGrader[sub.grader][assignmentID] = newSubs;
        this.setState({ submissionsByInactiveGrader });
      }
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

  public changeSubmissionGrader = (sub: SubmissionType, grader: string | undefined) => {
    const payload = {
      id: sub.id,
      grader,
    };

    const {
      students,
      graders,
      submissionsByStudent,
      submissionsByInactiveStudent,
      submissionsByGrader,
      submissionsByInactiveGrader,
    } = this.state;

    const oldGrader = sub.grader;

    return Submission.update(payload).then((submission) => {
      // Add submission to appropriate student and grader entries in cached data structures
      const subStudents = submission.students;
      const subGrader = submission.grader;

      subStudents.forEach((student) => {
        if (students.includes(student)) {
          submissionsByStudent[student][submission.assignment] = submission;
        } else {
          // Account for partner, who might be inactive
          submissionsByInactiveStudent[student][submission.assignment] = submission;
        }
      });

      // Shouldn't be assigning this submission to an inactive grader
      if (typeof subGrader === 'string' && graders.includes(subGrader)) {
        if (submissionsByGrader[subGrader][submission.assignment]) {
          submissionsByGrader[subGrader][submission.assignment].push(submission);
        } else {
          submissionsByGrader[subGrader][submission.assignment] = [submission];
        }
      }

      // Unassign old grader, if she exists
      if (typeof oldGrader === 'string') {
        if (graders.includes(oldGrader)) {
          submissionsByGrader[oldGrader][submission.assignment].filter((el) => {
            return el.id !== submission.id;
          });
        } else {
          submissionsByInactiveGrader[oldGrader][submission.assignment].filter((el) => {
            return el.id !== submission.id;
          });
        }
      }

      this.setState({
        submissionsByStudent,
        submissionsByInactiveStudent,
        submissionsByGrader,
        submissionsByInactiveGrader,
      });

      return;
    });
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
    const dropdown = <CPDropdown value={selectorText} overlay={menu} />;
    const createButton = <NewCourseDialog courses={this.state.courses} createCourse={this.createCourse} />;

    const headerLeft = [dropdown, createButton];
    // add option to switch
    const headerRight = [
      <span key="header-user" className="cp-label cp-label--bold">
        {this.props.user.email}
      </span>,
      <RoleMenu key="header-roles" user={this.props.user} thisApp={USER_TYPE.ADMIN} theme="light" />,
      <Link className="internal-link" key="settings" to="/settings">
        <Icon type="setting" />
      </Link>,
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
            />
          );
          break;
        case PANELS.SUBMISSION_GRADERS:
          detail = (
            <GraderData
              loadComplete={this.state.submissionsbyUserLoadComplete && this.state.assignmentsLoadComplete}
              assignments={this.state.assignments}
              submissionsByGrader={this.state.submissionsByGrader}
              deleteSubmission={this.deleteSubmission}
              graders={this.state.graders}
              changeSubmissionGrader={this.changeSubmissionGrader}
              uploadSubmission={this.uploadSubmission}
              viewsBySubmission={this.state.viewsBySubmission}
              changeTab={this.changeTab}
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
      <AdminNav selectedPanel={this.state.currentPanel} onClick={this.handleTabClick} collapsed={collapsed} />
    );

    return <CPLayoutAdmin header={header} detail={detail} navigation={navigation} collapsible={true} />;
  }
}

export default Admin;
