import * as React from 'react';
import { Snackbar } from 'react-md';
import { Redirect } from 'react-router-dom';
import Select from 'react-select';
import CourseData from './components/admin/CourseData';
import ManageAssignments from './components/admin/ManageAssignments';
import ManageUsers from './components/admin/ManageUsers';
import NewCourseDialog from './components/admin/NewCourseDialog';
// import './styles/index.scss';
// import './styles/Student.scss';

import {
  IAssignmentToRubricCategories,
  IAssignmentToSubmissionsMap,
  IGraderSubmissionsDataTable,
  IOptionNumber,
  IRubricCategoryToRubricCommentsMap,
  ISectionNoStudents,
  IStudentSubmissionsDataTable,
  IToast,
  USER_APP,
} from './types/common';

import { Assignment, AssignmentType } from './infrastructure/assignment';
import { CommentIO, CommentType } from './infrastructure/comment';
import { Course, CourseType, RosterType } from './infrastructure/course';
import { RubricCategory, RubricCategoryType } from './infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from './infrastructure/rubricComment';
import { Section, SectionType } from './infrastructure/section';
import { SubmissionType } from './infrastructure/submission';

import { addToPayload } from './infrastructure/utils';

interface IAdminState {
  currentCourse?: CourseType; // Course for selector
  loadedPanel?: number; // Which active_panel to load, enum
  courses: CourseType[]; // Set of courses for the admin for the selector

  // roster data, all from a single api call so only needs a single loadComplete boolean
  students: string[];
  inactiveStudents: string[];
  graders: string[];
  inactiveGraders: string[];
  admins: string[];
  rosterLoadComplete: boolean;

  // sections data
  sections: SectionType[];
  sectionsLoadComplete: boolean;

  // A calculated mapping each student to their section to speed up render time
  // Reminder - need to get rid of ISectionNoStudents, it's ugly
  sectionsByStudent: { [studentEmail: string]: ISectionNoStudents };

  // Submissions data
  submissions: IAssignmentToSubmissionsMap;
  submissionsLoadComplete: boolean;

  // Assignments data
  assignments: AssignmentType[];
  assignmentsLoadComplete: boolean;

  // Assignments rubric data
  rubricCategories: IAssignmentToRubricCategories;
  rubricComments: IRubricCategoryToRubricCommentsMap;
  assignmentRubricLoadComplete: boolean;

  // Calculated mappings to render the CourseData tab quickly
  // submissionsByStudent is for the StudentData tab
  // submissionsByGrader is for the GraderData tab
  submissionsByStudent: IStudentSubmissionsDataTable;
  submissionsByGrader: IGraderSubmissionsDataTable;
  submissionsByInactiveStudent: IStudentSubmissionsDataTable;
  submissionsByInactiveGrader: IGraderSubmissionsDataTable;
  submissionsbyUserLoadComplete: boolean;

  // Props for Enroll panels
  lockChanges: boolean;

  toasts: IToast[];
  longToasts: IToast[];
  errorToasts: IToast[];

  // URL variables
  toLoadCourse: boolean;
  toLoadPanel: boolean;

  // Pre-loaded initializtion paramters for children
  initialTab: number;
}

interface IAdminProps {
  initialCourses: CourseType[];
  email: string;
  match: any;
  history: any;
}

class Admin extends React.Component<IAdminProps, IAdminState> {
  public state: Readonly<IAdminState> = {
    currentCourse: undefined,
    loadedPanel: undefined,
    courses: this.props.initialCourses,

    students: [],
    inactiveStudents: [],
    graders: [],
    inactiveGraders: [],
    admins: [],
    rosterLoadComplete: false,

    sections: [],
    sectionsLoadComplete: false,

    sectionsByStudent: {},

    submissions: {},
    submissionsLoadComplete: false,

    assignments: [],
    assignmentsLoadComplete: false,

    rubricCategories: {},
    rubricComments: {},
    assignmentRubricLoadComplete: false,

    submissionsByStudent: {},
    submissionsByGrader: {},
    submissionsByInactiveStudent: {},
    submissionsByInactiveGrader: {},
    submissionsbyUserLoadComplete: false,

    lockChanges: true,

    toasts: [],
    longToasts: [],
    errorToasts: [],

    initialTab: 0,

    toLoadCourse: false,
    toLoadPanel: false,
  };

  public panels: { [key: string]: string } = {
    0: 'Course Data',
    1: 'Manage Assignments',
    2: 'Manage Users',
  };

  public panelMapForURL = ['course-data', 'assignments', 'manage-users'];

  public defaultPanelArgForURL = ['students', null, null];

  public snackBarStyle = {
    width: '100%',
    fontWeight: 500,
    fontSize: 14,
    backgroundColor: '#2ecd70',
    maxWidth: '100%',
  };

  public errorSnackBarStyl4e = {
    width: '100%',
    fontWeight: 500,
    fontSize: 14,
    backgroundColor: 'red',
    maxWidth: '100%',
  };

  private interval: any;

  ///////////////////////////////////////
  // URL handler methods
  ///////////////////////////////////////

  public setStateFromURL = () => {
    const { courseName, period, panelName } = this.props.match.params;
    const { courses } = this.state;

    // Test whether (courseName, period) corresponds to loaded course

    let currentCourse: CourseType | undefined;
    let loadedPanel;
    if (courseName && period) {
      const formattedCourseName = courseName.replace(/_/g, ' ');
      const formattedPeriod = period.replace(/_/g, ' ');
      currentCourse = courses.find((obj: CourseType) => {
        return obj.name === formattedCourseName && obj.period === formattedPeriod;
      });

      // Given (courseName, period), test whether panelName corresponds to valid panel
      if (currentCourse) {
        if (panelName) {
          loadedPanel = this.panelFromString(panelName);
        } else {
          loadedPanel = 0;
        }
      }
    }

    // the toLoadPanel assignment causes the URL to add default loadedPanel if none is specified
    const isValid = currentCourse && (panelName ? this.panelMapForURL.indexOf(panelName) >= 0 : false);
    this.setState({ currentCourse, loadedPanel, toLoadPanel: !isValid }, () => {
      if (currentCourse) {
        this.updateNewCourse({ value: currentCourse.id, label: '' });
      }
    });
  };

  public panelFromString(name: string) {
    const toRet = this.panelMapForURL.indexOf(name);
    return toRet >= 0 ? toRet : 0;
  }

  public stringFromPanel(panel: number) {
    if (panel < this.panelMapForURL.length && panel >= 0) {
      return this.panelMapForURL[panel];
    }
    return null;
  }

  public panelArgFromPanel(panel: number) {
    if (panel < this.defaultPanelArgForURL.length && panel >= 0) {
      return this.defaultPanelArgForURL[panel];
    }
    return null;
  }

  // ------------------- Permissions check functions -------------------

  public componentDidMount() {
    this.setStateFromURL();
    this.interval = setInterval(() => {
      if (this.state.currentCourse) {
        this.loadAllCourseData();
      }
    }, 20000);
  }

  public componentDidUpdate(prevProps: IAdminProps, prevState: IAdminState) {
    const { toLoadCourse, toLoadPanel } = this.state;
    if (toLoadCourse || toLoadPanel) {
      this.setState({ toLoadCourse: false, toLoadPanel: false });
    }
  }

  public componentWillUnmount() {
    clearInterval(this.interval);
  }

  public updateNewCourse = (option: IOptionNumber) => {
    const currentCourse = this.state.courses.filter((course: CourseType) => {
      return course.id === option.value;
    })[0];

    const currentPanel = this.state.loadedPanel ? this.state.loadedPanel : 0;

    this.setState(
      {
        currentCourse,
        loadedPanel: currentPanel,

        students: [],
        inactiveStudents: [],
        graders: [],
        inactiveGraders: [],
        admins: [],
        rosterLoadComplete: false,

        sections: [],
        sectionsLoadComplete: false,

        sectionsByStudent: {},

        submissions: {},
        submissionsLoadComplete: false,

        assignments: [],
        assignmentsLoadComplete: false,

        rubricCategories: {},
        rubricComments: {},
        assignmentRubricLoadComplete: false,

        submissionsByStudent: {},
        submissionsByGrader: {},
        submissionsByInactiveStudent: {},
        submissionsByInactiveGrader: {},
        submissionsbyUserLoadComplete: false,

        // Props for Enroll panels
        lockChanges: true,
      },
      () => {
        this.loadAllCourseData();
      },
    );
  };

  // Course Selector functions
  public handleCourseChange = (option: IOptionNumber) => {
    const currentCourse = this.state.courses.filter((course: CourseType) => {
      return course.id === option.value;
    })[0];

    // reminder: set students graders everything to undefined
    this.setState({ currentCourse, toLoadCourse: true }, () => {
      this.updateNewCourse(option);
    });
  };

  public handlePanelChange = (panelNumber: number) => {
    const { currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    this.setState({ loadedPanel: Number(panelNumber), toLoadPanel: true }, () => {
      this.forceUpdate();
    });
  };

  public selectorItemsFormatter = (courses: CourseType[]) => {
    return courses.map((course, i) => ({
      value: course.id,
      label: `${course.name} | ${course.period}`,
    }));
  };

  public selectorCurrentFormatter = (currentCourse: CourseType | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return { value: currentCourse.id, label: `${currentCourse.name} | ${currentCourse.period}` };
  };

  // ------------------- Toast functions -------------------

  public addToast = (text: string, action: string | undefined) => {
    const toasts = this.state.toasts.slice();
    toasts.push({ text, action });
    this.setState({ toasts });
  };

  public addLongToast = (text: string, action: string | undefined) => {
    const longToasts = this.state.longToasts.slice();
    longToasts.push({ text, action });
    this.setState({ longToasts });
  };

  public addErrorToast = (text: string, action: string | undefined) => {
    const errorToasts = this.state.errorToasts.slice();
    errorToasts.push({ text, action });
    this.setState({ errorToasts });
  };

  public dismissToast = () => {
    const [, ...toasts] = this.state.toasts;
    this.setState({ toasts });
  };

  public dismissLongToast = () => {
    const [, ...longToasts] = this.state.longToasts;
    this.setState({ longToasts });
  };

  public dismissErrorToast = () => {
    const [, ...errorToasts] = this.state.errorToasts;
    this.setState({ errorToasts });
  };
  // ------------------- Initial data load functions  -------------------
  public loadAllCourseData = () => {
    this.loadSubmissions();
    this.loadAssignments();
    this.loadRoster();
  };

  public loadAssignments = () => {
    const { currentCourse } = this.state;
    if (currentCourse && currentCourse.assignments) {
      const getData = currentCourse.assignments.map((assignmentID) => {
        return Assignment.read(assignmentID);
      });
      Promise.all(getData).then((newAssignments: AssignmentType[]) => {
        this.setState({ assignments: newAssignments, assignmentsLoadComplete: true }, () => {
          this.loadRubrics();
        });
      });
    }
  };

  public async generateSubmissionsByStudent() {
    const {
      students,
      graders,
      inactiveStudents,
      inactiveGraders,
      submissions,
      rosterLoadComplete,
      submissionsLoadComplete,
    } = this.state;
    if (rosterLoadComplete && submissionsLoadComplete) {
      const promise = new Promise((resolve, reject) => {
        const subsByStudent: IStudentSubmissionsDataTable = {};
        const subsByGrader: IGraderSubmissionsDataTable = {};
        const subsByInactiveStudent: IStudentSubmissionsDataTable = {};
        const subsByInactiveGrader: IGraderSubmissionsDataTable = {};

        students.forEach((student) => {
          subsByStudent[student] = {};
        });

        inactiveStudents.forEach((inactiveStudent) => {
          subsByInactiveStudent[inactiveStudent] = {};
        });

        graders.forEach((grader) => {
          subsByGrader[grader] = {};
        });

        inactiveGraders.forEach((inactiveGrader) => {
          subsByInactiveGrader[inactiveGrader] = {};
        });

        Object.keys(submissions).forEach((assignmentID) => {
          const assignmentSubs = submissions[assignmentID];
          assignmentSubs.forEach((submission: SubmissionType) => {
            submission.students.forEach((student: string) => {
              // If a student is un enrolled, the submission won't be deleted,
              // so need to check to make sure it's in the subsByStudent
              if (subsByStudent[student]) {
                subsByStudent[student][assignmentID] = submission;
              } else if (subsByInactiveStudent[student]) {
                subsByInactiveStudent[student][assignmentID] = submission;
              }
            });
            if (submission.grader) {
              if (submission.grader in subsByGrader) {
                if (subsByGrader[submission.grader][assignmentID]) {
                  subsByGrader[submission.grader][assignmentID].push(submission);
                } else {
                  subsByGrader[submission.grader][assignmentID] = [submission];
                }
              } else if (submission.grader in subsByInactiveGrader) {
                if (subsByInactiveGrader[submission.grader][assignmentID]) {
                  subsByInactiveGrader[submission.grader][assignmentID].push(submission);
                } else {
                  subsByInactiveGrader[submission.grader][assignmentID] = [submission];
                }
              }
            }
          });
        });

        this.setState(
          {
            submissionsByStudent: subsByStudent,
            submissionsByGrader: subsByGrader,
            submissionsByInactiveStudent: subsByInactiveStudent,
            submissionsByInactiveGrader: subsByInactiveGrader,
            submissionsbyUserLoadComplete: true,
          },
          () => resolve('done'),
        );
      });

      await promise;
    }
  }

  public loadAssignmentRubric = (assignmentID: number) => {
    return Assignment.readRubric(assignmentID, {})
      .then((json) => {
        const { rubricCategories, rubricComments } = this.state;
        rubricCategories[assignmentID] = json.rubricCategories;
        json.rubricCategories.forEach((cat: RubricCategoryType) => {
          rubricComments[cat.id] = json.rubricComments.filter((comm: RubricCommentType) => {
            return comm.category === cat.id;
          });
        });
        this.setState({ rubricCategories, rubricComments }, () => {
          return;
        });
      })
      .catch((errors) => {
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((error: string) => {
            this.addErrorToast(error, undefined);
          });
        });
      });
  };

  public loadRubrics = () => {
    const { currentCourse, assignments } = this.state;
    if (!currentCourse || !assignments) {
      return;
    }
    Promise.all(
      assignments.map((assignment: AssignmentType) => {
        return this.loadAssignmentRubric(assignment.id);
      }),
    ).then(() => {
      this.setState({ assignmentRubricLoadComplete: true });
    });
  };

  public loadSubmissions = () => {
    const { currentCourse } = this.state;
    if (!currentCourse || !currentCourse.assignments) {
      return;
    }
    Promise.all(
      currentCourse.assignments.map((assignmentID) => {
        return Assignment.readSubmissions(assignmentID, {}).then((subs: SubmissionType[]) => {
          const submissions = this.state.submissions;
          submissions[assignmentID] = subs;
          this.setState({ submissions }, () => {
            return;
          });
        });
      }),
    )
      .then(() => {
        this.setState({ submissionsLoadComplete: true }, () => this.generateSubmissionsByStudent());
      })
      .catch((errors) => {
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((error: string) => {
            this.addErrorToast(error, undefined);
          });
        });
      });
  };

  public loadRoster = () => {
    const { currentCourse } = this.state;
    if (!currentCourse) {
      return;
    }
    // courses/id/roster . students
    Course.readRoster(currentCourse.id, {}).then((roster: RosterType) => {
      this.setState(
        {
          students: roster.students,
          graders: roster.graders,
          admins: roster.courseAdmins,
          inactiveStudents: roster.inactive_students,
          inactiveGraders: roster.inactive_graders,
          rosterLoadComplete: true,
        },
        () => {
          this.loadSections();
          this.generateSubmissionsByStudent();
        },
      );
    });
  };

  public loadSections = () => {
    const { currentCourse } = this.state;
    if (!currentCourse || !currentCourse.sections) {
      return;
    }
    Promise.all(
      currentCourse.sections.map((sectionID) => {
        return Section.read(sectionID).then((section: SectionType) => {
          // Reminder --- should really filter out if the
          // section is already there to eliminate duplicates
          const { sectionsByStudent } = this.state;
          section.students.forEach((studentEmail: string) => {
            sectionsByStudent[studentEmail] = {
              name: section.name,
              id: section.id,
            };
          });
          this.setState({ sectionsByStudent });
          return section;
        });
      }),
    )
      .then((sections) => {
        this.setState({ sections, sectionsLoadComplete: true });
      })
      .catch((errors) => {
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((error: string) => {
            this.addErrorToast(error, undefined);
          });
        });
      });
  };

  // ------------------- Toggle data change locks  -------------------
  public toggleLock = () => {
    this.setState({
      lockChanges: !this.state.lockChanges,
    });
  };

  // ------------------- Manage users API calls  -------------------

  public changeRoster = (newRoster: string[], userType: USER_APP) => {
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
    }

    return (
      Course.updateRoster(payload, {})
        .then((roster: RosterType) => {
          switch (userType) {
            case USER_APP.Student:
              this.setState({ students: roster.students, inactiveStudents: roster.inactive_students }, () => {
                this.addToast('Student roster successfully updated.', undefined);
                this.generateSubmissionsByStudent();
              });
              break;
            case USER_APP.Grader:
              this.setState({ graders: roster.graders }, () => {
                this.addToast('Grader roster successfully updated.', undefined);
                this.generateSubmissionsByStudent();
              });
              break;
            case USER_APP.CourseAdmin:
              this.setState({ admins: roster.courseAdmins }, () =>
                this.addToast('Admin roster successfully updated.', undefined),
              );
              break;
          }
        })
        // Error catching assumes a returned dictionary of type <errorType: string : [errors:string]>
        .catch((errors) => {
          Object.keys(errors).forEach((key) => {
            errors[key].forEach((error: string) => {
              this.addErrorToast(error, undefined);
            });
          });
        })
    );
  };

  public unEnrollUsers = (selectedUserEmails: string[], userType: USER_APP) => {
    switch (userType) {
      case USER_APP.Student:
        const newStudents = this.state.students.filter((student) => {
          return selectedUserEmails.indexOf(student) === -1;
        });
        return this.changeRoster(newStudents, userType);
      case USER_APP.Grader:
        const newGraders = this.state.graders.filter((grader) => {
          return selectedUserEmails.indexOf(grader) === -1;
        });
        return this.changeRoster(newGraders, userType);
      case USER_APP.CourseAdmin:
        const newAdmins = this.state.admins.filter((admin) => {
          return selectedUserEmails.indexOf(admin) === -1;
        });
        return this.changeRoster(newAdmins, userType);
    }
  };

  public enrollUser = (userEmail: string, userType: USER_APP) => {
    const { students, graders, admins } = this.state;
    switch (userType) {
      case USER_APP.Student:
        if (students.indexOf(userEmail) !== -1) {
          this.addErrorToast('Student is already enrolled in course', undefined);
          return;
        }
        // Need to do a deep copy of state array in case adding fails, we don't update state
        const newStudents = JSON.parse(JSON.stringify(students));
        newStudents.push(userEmail);

        // Check if the student is in the inactives for the course, and remove them if so
        this.changeRoster(newStudents, userType);
        break;
      case USER_APP.Grader:
        if (graders.indexOf(userEmail) !== -1) {
          this.addErrorToast('Grader is already enrolled in course', undefined);
          return;
        }
        // Need to do a deep copy of state array in case adding fails, we don't update state
        const newGraders = JSON.parse(JSON.stringify(graders));
        newGraders.push(userEmail);
        this.changeRoster(newGraders, userType);
        break;
      case USER_APP.CourseAdmin:
        if (admins.indexOf(userEmail) !== -1) {
          this.addErrorToast('Admin is already enrolled in course', undefined);
          return;
        }
        // Need to do a deep copy of state array in case adding fails, we don't update state
        const newAdmins = JSON.parse(JSON.stringify(admins));
        newAdmins.push(userEmail);
        this.changeRoster(newAdmins, userType);
        break;
    }
  };

  // ------------------- Manage sections API calls  -------------------
  public createSection = (newSection: string) => {
    const { currentCourse, sections } = this.state;

    if (!currentCourse) {
      return;
    }
    const payload = {
      name: newSection,
      course: currentCourse.id,
      leaders: [],
      students: [],
      id: -1,
    };

    return Section.create(payload).then((section: SectionType) => {
      sections.push(section);
      currentCourse.sections.push(section.id);
      this.setState({ sections, currentCourse }, () => this.addToast(`New section ${section.name} created`, undefined));
    });
  };

  public removeStudentFromSection = (sectionID: number, studentEmail: string): Promise<SectionType> => {
    const { sections, sectionsByStudent } = this.state;

    const thisSection = sections.find((section) => {
      return section.id === sectionID;
    });
    if (!thisSection) {
      return Promise.reject();
    }

    const newStudents = thisSection.students.filter((student) => {
      return student !== studentEmail;
    });

    const payload = { id: thisSection.id, name: thisSection.name, students: newStudents };

    return Section.update(payload).then((json: SectionType) => {
      const newSections = sections.map((section) => {
        if (section.id === json.id) {
          section.students = json.students;
        }
        return section;
      });

      delete sectionsByStudent[studentEmail];

      this.setState({ sections: newSections, sectionsByStudent }, () =>
        this.addToast(`Student ${studentEmail} removed from section ${json.name}`, undefined),
      );
      return json;
    });
  };

  public addStudentToSection = (sectionID: number, studentEmail: string): Promise<SectionType> => {
    const { sections, sectionsByStudent } = this.state;

    const thisSection = sections.filter((section) => {
      return section.id === sectionID;
    })[0];
    const newStudents = thisSection.students;
    newStudents.push(studentEmail);

    const payload = { id: thisSection.id, name: thisSection.name, students: newStudents };

    return Section.update(payload).then((json: SectionType) => {
      const newSections = sections.map((section) => {
        if (section.id === json.id) {
          section.students = json.students;
        }
        return section;
      });

      sectionsByStudent[studentEmail] = {
        name: json.name,
        id: json.id,
      };

      this.setState({ sections: newSections, sectionsByStudent }, () => {
        this.addToast(`Student ${studentEmail} added to section ${json.name}`, undefined);
      });
      return json;
    });
  };

  public changeStudentSection = (newSectionID: number | undefined, studentEmail: string): Promise<SectionType> => {
    const { sectionsByStudent } = this.state;
    const previousSection = sectionsByStudent[studentEmail];
    if (previousSection && newSectionID) {
      return this.removeStudentFromSection(previousSection.id, studentEmail).then(() => {
        return this.addStudentToSection(newSectionID, studentEmail);
      });
    } else if (previousSection) {
      return this.removeStudentFromSection(previousSection.id, studentEmail);
    } else if (newSectionID) {
      return this.addStudentToSection(newSectionID, studentEmail);
    }
    this.addErrorToast('Error - both old section and new section are empty.', undefined);
    return Promise.reject();
  };

  public addLeaderToSection = (sectionID: number, leaderEmail: string): Promise<string[]> => {
    const { sections } = this.state;

    const thisSection = sections.filter((section) => {
      return section.id === sectionID;
    })[0];
    const sectionName = thisSection.name;
    const newLeaders = thisSection.leaders;
    newLeaders.push(leaderEmail);

    return this.changeSectionLeaders(sectionID, newLeaders).then((leaders) => {
      this.addToast(`${leaderEmail} added as leader of section ${sectionName}`, undefined);
      return leaders;
    });
  };

  public removeLeaderFromSection = (sectionID: number, leaderEmail: string): Promise<string[]> => {
    const { sections } = this.state;

    const thisSection = sections.filter((section) => {
      return section.id === sectionID;
    })[0];
    const sectionName = thisSection.name;
    const newLeaders = thisSection.leaders.filter((leader) => {
      return leader !== leaderEmail;
    });

    return this.changeSectionLeaders(sectionID, newLeaders).then((leaders) => {
      this.addToast(`${leaderEmail} removed as leader of section ${sectionName}`, undefined);
      return leaders;
    });
  };

  public changeSectionLeaders = (sectionID: number, newLeaders: string[]): Promise<string[]> => {
    const { sections } = this.state;
    const payload = { id: sectionID, leaders: newLeaders };

    return Section.update(payload).then((json) => {
      const newSections = sections.map((section) => {
        if (section.id === sectionID) {
          section.leaders = json.leaders;
        }
        return section;
      });

      this.setState({ sections: newSections });
      return json.leaders;
    });
  };

  // ------------------- Manage rubric API calls  ------------------

  public createRubricCategory = (
    assignmentID: number,
    categoryName: string,
    pointLimit: number | null,
    newComments: RubricCommentType[],
  ): Promise<RubricCategoryType> => {
    const { assignments, rubricCategories, rubricComments } = this.state;

    if (categoryName.length === 0) {
      this.addErrorToast('Cannot save rubric. Cateory name cannot be empty.', undefined);
      return Promise.reject();
    }

    const payload = {
      id: -1, // codePost convention
      name: categoryName,
      assignment: assignmentID,
      rubricComments: [],
      pointLimit,
    };

    return RubricCategory.create(payload).then((rubricCategory: RubricCategoryType) => {
      assignments.forEach((assn) => {
        // Add an empty set of comments to the returned
        // category, Api only returns category ids
        if (assn.id === assignmentID) {
          assn.rubricCategories.push(rubricCategory.id);
        }
      });
      rubricCategories[assignmentID].push(rubricCategory);
      rubricComments[rubricCategory.id] = [];
      this.setState({ assignments, rubricCategories, rubricComments });
      // Reminder - need to change linter here for use
      return Promise.all(
        newComments.map((comment) => {
          return this.createRubricComment(assignmentID, rubricCategory.id, comment.text, comment.pointDelta);
        }),
      ).then(() => {
        return rubricCategory;
      });
    });
  };

  public deleteRubricCategory = (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    deleteLinkedComments: boolean,
  ) => {
    const { assignments, rubricCategories, rubricComments } = this.state;
    const linkedRubricComments = rubricComments[categoryID];
    return Promise.all(
      linkedRubricComments.map((comm) => {
        return this.deleteRubricComment(assignmentID, categoryID, comm.id, deleteLinkedComments);
      }),
    ).then(() => {
      return RubricCategory.delete(categoryID)
        .then(() => {
          assignments.forEach((assn) => {
            if (assn.id === assignmentID) {
              assn.rubricCategories = assn.rubricCategories.filter((catID) => {
                return catID !== categoryID;
              });
            }
            rubricCategories[assignmentID] = rubricCategories[assignmentID].filter((cat) => {
              return cat.id !== categoryID;
            });
            delete rubricComments[categoryID];
          });
          return this.setState({ assignments, rubricCategories, rubricComments }, () => {
            return 'done';
          });
        })
        .catch((errors) => {
          Object.keys(errors).forEach((key) => {
            errors[key].forEach((error: string) => {
              this.addErrorToast(error, undefined);
            });
          });
        });
    });
  };

  // Updates return a  Promise<void> instead of Promise<ObjectType> because (a) the
  // returned assignment should never by the child, only used to change state, and it renders faster on testing
  public updateRubricCategory = (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    categoryPointLimit: number | null,
  ): Promise<void> => {
    const { rubricCategories } = this.state;
    if (categoryName.length === 0) {
      this.addErrorToast('Cannot save rubric. Cateory name cannot be empty.', undefined);
      return Promise.reject();
    }

    const payload = {
      id: categoryID,
      name: categoryName,
      assignment: assignmentID,
      pointLimit: categoryPointLimit,
    };

    return RubricCategory.update(payload)
      .then((rubricCategory: RubricCategoryType) => {
        const catIndex = rubricCategories[assignmentID]
          .map((cat) => {
            return cat.id;
          })
          .indexOf(categoryID);
        if (catIndex !== -1) {
          // Reminder --- add checks for the data received
          rubricCategories[assignmentID][catIndex].name = rubricCategory.name;
          rubricCategories[assignmentID][catIndex].pointLimit = rubricCategory.pointLimit;
        }
        this.setState({ rubricCategories });
        return;
      })
      .catch((errors) => {
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((error: string) => {
            this.addErrorToast(error, undefined);
          });
        });
      });
  };

  public createRubricComment = (
    assignmentID: number,
    categoryID: number,
    commentText: string,
    commentDelta: number,
  ): Promise<RubricCommentType> => {
    const { rubricCategories, rubricComments } = this.state;
    if (commentText.length === 0) {
      this.addErrorToast('Cannot save comment. Comment text cannot be empty.', undefined);
      return Promise.reject();
    }
    const payload = { text: commentText, category: categoryID, pointDelta: commentDelta, id: -1 };
    return RubricComment.create(payload).then((rubricComment: RubricCommentType) => {
      rubricCategories[assignmentID].forEach((cat) => {
        if (cat.id === categoryID) {
          cat.rubricComments.push(rubricComment.id);
        }
      });
      rubricComments[categoryID].push(rubricComment);
      this.setState({ rubricCategories, rubricComments });
      return rubricComment;
    });
  };

  public deleteRubricComment = (
    assignmentID: number,
    categoryID: number,
    commentID: number,
    deleteLinkedComments: boolean,
  ) => {
    const { rubricCategories, rubricComments } = this.state;
    const thisRubricComment = rubricComments[categoryID].find((comm) => {
      return comm.id === commentID;
    });
    if (!thisRubricComment) {
      return Promise.reject();
    }
    // Get the latest comments that are linked to the RubricCommentType
    return RubricComment.read(commentID)
      .then((rubricComment) => {
        const linkedComments = rubricComment.comments;
        const commentPromises: any = linkedComments.map((id) => {
          if (deleteLinkedComments) {
            return CommentIO.delete(id);
          } else {
            return CommentIO.read(id).then((c: CommentType) => {
              const newText = c.text ? `${thisRubricComment.text}. ${c.text}` : thisRubricComment.text;
              const payload = {
                id,
                text: newText,
                pointDelta: thisRubricComment.pointDelta,
                rubricComment: null,
              };
              return CommentIO.update(payload);
            });
          }
        });
        return Promise.all(commentPromises).then(() => {
          return RubricComment.delete(commentID).then(() => {
            rubricComments[categoryID] = rubricComments[categoryID].filter((com) => {
              return com.id !== commentID;
            });
            rubricCategories[assignmentID].forEach((cat) => {
              if (cat.id === categoryID) {
                const newComments = cat.rubricComments.filter((i: number) => {
                  return i !== commentID;
                });
                cat.rubricComments = newComments;
              }
            });
            this.setState({ rubricCategories, rubricComments });
            return;
          });
        });
      })
      .catch((errors) => {
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((error: string) => {
            this.addErrorToast(error, undefined);
          });
        });
      });
  };

  // Updates return a Promise<void> instead of Promise<ObjectType> because (a) the
  // returned assignment should never by the child, only used to change state, and it renders faster on testing
  public updateRubricComment = (
    categoryID: number,
    commentID: number,
    commentText: string | undefined,
    commentDelta: number | undefined,
  ): Promise<void> => {
    const { rubricComments } = this.state;
    const payload = { id: commentID };
    if (commentText && commentText.length === 0) {
      this.addErrorToast('Cannot save comment. Comment text cannot be empty.', undefined);
      return Promise.reject();
    }

    addToPayload(payload, 'text', commentText);
    addToPayload(payload, 'pointDelta', commentDelta);

    return RubricComment.update(payload)
      .then((rubricComment) => {
        const comIndex = rubricComments[categoryID]
          .map((com) => {
            return com.id;
          })
          .indexOf(commentID);
        if (comIndex !== -1) {
          rubricComments[categoryID][comIndex] = rubricComment;
        }

        this.setState({ rubricComments });
        return;
      })
      .catch((errors) => {
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((error: string) => {
            this.addErrorToast(error, undefined);
          });
        });
      });
  };

  // ------------------- Manage assignments API calls  ------------------
  // Updates return a Promise<void> instead of Promise<ObjectType> because (a) the
  // returned assignment should never by the child, only used to change state, and it renders faster on testing
  public updateAssignment = (
    assignmentID: number,
    name: string | undefined,
    points: number | undefined,
    isReleased: boolean | undefined,
  ): Promise<void> => {
    const { assignments } = this.state;

    if (!name && !points && typeof isReleased === 'undefined') {
      return Promise.reject();
    }

    const payload = { id: assignmentID };
    addToPayload(payload, 'name', name);
    addToPayload(payload, 'points', points);
    addToPayload(payload, 'isReleased', isReleased);

    return Assignment.update(payload)
      .then((assignment) => {
        assignments.forEach((assn) => {
          if (assn.id === assignmentID) {
            assn.name = assignment.name;
            assn.points = assignment.points;
            assn.isReleased = assignment.isReleased;
          }
        });
        this.setState({ assignments }, () => this.addToast('Assignment has been updated', undefined));
        return;
      })
      .catch((errors) => {
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((error: string) => {
            this.addErrorToast(error, undefined);
          });
        });
        return;
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
      rubricCategories: [],
    };

    return Assignment.create(payload).then((assignment: AssignmentType) => {
      const { submissions, rubricCategories, assignments } = this.state;
      currentCourse.assignments.push(assignment.id);
      submissions[assignment.id] = [];
      rubricCategories[assignment.id] = [];
      assignments.push(assignment);
      this.setState({ currentCourse, submissions, rubricCategories, assignments }, () => {
        this.addLongToast(`Assignment ${assignment.name} successfully created.`, undefined);
      });
      return assignment;
    });
  };

  // ------------------- Manage course API calls  ------------------
  public createCourse = (courseName: string, coursePeriod: string) => {
    const { courses } = this.state;
    const payload = {
      id: -1, // codePost convention
      name: courseName,
      period: coursePeriod,
      assignments: [], // ignored by API
      sections: [], // ignored by API
    };

    return Course.create(payload).then((course: CourseType) => {
      courses.push(course);
      this.setState({ courses });
      this.addLongToast(`Course ${course.name} | ${course.period} successfully created.`, undefined);
      this.updateNewCourse(this.selectorItemsFormatter([course])[0]);
      return course;
    });
  };

  // ------------------- Render -------------------
  public render() {
    const {
      courses,
      currentCourse,
      loadedPanel,
      toasts,
      longToasts,
      errorToasts,
      toLoadCourse,
      toLoadPanel,
    } = this.state;

    if (toLoadCourse || toLoadPanel) {
      if (currentCourse) {
        const formattedCourseName = currentCourse.name.replace(/ /g, '_');
        const formattedPeriod = currentCourse.period.replace(/ /g, '_');

        // hacky way to set default to 0
        const panelName = this.stringFromPanel(typeof loadedPanel !== 'undefined' ? loadedPanel : 0);

        return <Redirect to={`/course-admin/${formattedCourseName}/${formattedPeriod}/${panelName}`} />;
      } else {
        return <Redirect to={'/course-admin'} />;
      }
    }

    let courseManagementPanel = null;

    if (currentCourse && loadedPanel === 0) {
      courseManagementPanel = (
        <div className="content-container">
          <CourseData
            currentCourseID={currentCourse.id}
            assignments={this.state.assignments}
            assignmentsLoadComplete={this.state.assignmentsLoadComplete}
            students={this.state.students}
            graders={this.state.graders}
            submissionsbyUserLoadComplete={this.state.submissionsbyUserLoadComplete}
            submissions={this.state.submissions}
            submissionsLoadComplete={this.state.submissionsLoadComplete}
            submissionsByStudent={this.state.submissionsByStudent}
            submissionsByGrader={this.state.submissionsByGrader}
            addToast={this.addToast}
            initialTab={this.state.initialTab}
            inactiveStudents={this.state.inactiveStudents}
            inactiveGraders={this.state.inactiveGraders}
            submissionsByInactiveStudent={this.state.submissionsByInactiveStudent}
            submissionsByInactiveGrader={this.state.submissionsByInactiveGrader}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 1) {
      courseManagementPanel = (
        <ManageAssignments
          key={currentCourse.id}
          rubricCategories={this.state.rubricCategories}
          rubricComments={this.state.rubricComments}
          submissions={this.state.submissions}
          submissionsLoadComplete={this.state.submissionsLoadComplete}
          lockManageAssignment={this.state.lockChanges}
          toggleLock={this.toggleLock}
          currentCourse={this.state.currentCourse}
          addToast={this.addToast}
          addErrorToast={this.addErrorToast}
          assignments={this.state.assignments}
          assignmentRubricLoadComplete={this.state.assignmentRubricLoadComplete}
          createRubricCategory={this.createRubricCategory}
          deleteRubricCategory={this.deleteRubricCategory}
          createRubricComment={this.createRubricComment}
          deleteRubricComment={this.deleteRubricComment}
          updateRubricComment={this.updateRubricComment}
          updateRubricCategory={this.updateRubricCategory}
          updateAssignment={this.updateAssignment}
          createAssignment={this.createAssignment}
        />
      );
    } else if (currentCourse && loadedPanel === 2) {
      courseManagementPanel = (
        <div className="content-container">
          <ManageUsers
            key={currentCourse.id}
            currentCourse={this.state.currentCourse}
            sections={this.state.sections}
            students={this.state.students}
            graders={this.state.graders}
            admins={this.state.admins}
            sectionsByStudent={this.state.sectionsByStudent}
            rosterLoadComplete={this.state.rosterLoadComplete}
            sectionsLoadComplete={this.state.sectionsLoadComplete}
            lockChanges={this.state.lockChanges}
            toggleLock={this.toggleLock}
            enrollUser={this.enrollUser}
            unEnrollUsers={this.unEnrollUsers}
            changeRoster={this.changeRoster}
            changeStudentSection={this.changeStudentSection}
            createSection={this.createSection}
            addLeader={this.addLeaderToSection}
            removeLeader={this.removeLeaderFromSection}
            addToast={this.addToast}
            addErrorToast={this.addErrorToast}
            initialTab={this.state.initialTab}
          />
        </div>
      );
    } else if (!currentCourse) {
      if (courses.length > 0) {
        courseManagementPanel = <div>Select a course to get started.</div>;
      } else {
        courseManagementPanel = <div>Create a course to get started!</div>;
      }
    }

    const courseManagementNav = `admin__topbar__navButton${loadedPanel === 0 ? '--active' : ''}`;
    const manageAssignmenstNav = `admin__topbar__navButton${loadedPanel === 1 ? '--active' : ''}`;
    const manageUsersNav = `admin__topbar__navButton${loadedPanel === 2 ? '--active' : ''}`;

    return (
      <div className="admin">
        <div className="admin__topbar">
          <Select
            className="admin__topbar__courseSelector"
            options={this.selectorItemsFormatter(courses)}
            onChange={this.handleCourseChange}
            value={this.selectorCurrentFormatter(currentCourse)}
          />
          <div className="admin__topbar__nav">
            <div className={courseManagementNav} onClick={this.handlePanelChange.bind(this.props, 0)}>
              Course Data
            </div>
            <div className={manageAssignmenstNav} onClick={this.handlePanelChange.bind(this.props, 1)}>
              Manage Assignments
            </div>
            <div className={manageUsersNav} onClick={this.handlePanelChange.bind(this.props, 2)}>
              Manage Users
            </div>
          </div>
          <NewCourseDialog
            courses={this.state.courses}
            addErrorToast={this.addErrorToast}
            createCourse={this.createCourse}
          />
        </div>
        <div className="admin__topbar__spacing" />
        <div className="admin__main-panel">
          {courseManagementPanel}
          <Snackbar
            id="short-snackbar"
            className="short-snackbar"
            toasts={toasts}
            autohide={true}
            lastChild={true}
            autohideTimeout={2000}
            onDismiss={this.dismissToast}
            style={this.snackBarStyle}
          />
          <Snackbar
            id="long-snackbar"
            className="long-snackbar"
            toasts={longToasts}
            autohide={true}
            lastChild={true}
            autohideTimeout={4000}
            onDismiss={this.dismissLongToast}
            style={this.snackBarStyle}
          />
          <Snackbar
            id="error-snackbar"
            className="error-snackbar"
            toasts={errorToasts}
            autohide={true}
            lastChild={true}
            autohideTimeout={2000}
            onDismiss={this.dismissErrorToast}
            style={this.errorSnackBarStyl4e}
          />
        </div>
      </div>
    );
  }
}

export default Admin;
