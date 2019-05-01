/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* react-md imports */
import { CircularProgress, DialogContainer } from 'react-md';

/* other library imports */
import { Redirect } from 'react-router-dom';
import Select from 'react-select';

import queryString from 'query-string';

/* codePost imports */

/* components */
import CourseData from './components/admin/CourseData';
import CourseSettingsPanel from './components/admin/CourseSettingsPanel';
import ManageAssignments from './components/admin/ManageAssignments';
import ManageUsers from './components/admin/ManageUsers';
import NewCourseDialog from './components/admin/NewCourseDialog';
import { adminCarouselContent, ModalCarousel } from './components/Utils/ModalCarousel';

/* types */
import {
  IAssignmentToSubmissionsMap,
  IGraderSubmissionsDataTable,
  IOptionNumber,
  ISectionNoStudents,
  IStudentSubmissionsDataTable,
  IToast,
  USER_APP,
} from './types/common';

/* API library */
import { Assignment, AssignmentPatchType, AssignmentType, sortAssignments } from './infrastructure/assignment';
import { Course, CoursePatchType, CourseType, RosterType } from './infrastructure/course';
import { File } from './infrastructure/file';
import { RubricCategory } from './infrastructure/rubricCategory';
import { RubricComment } from './infrastructure/rubricComment';
import { Section, SectionType } from './infrastructure/section';
import { Submission, SubmissionType } from './infrastructure/submission';
import { UserType } from './infrastructure/user';
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
  superGraders: string[];
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

  // Generic loading dialog for actions
  isLoading: boolean;
  loadingMessage: string;
  loadingTitle: string;

  // onboarding modal
  onboardingModalVisible: boolean;
}

interface IAdminProps {
  initialCourses: CourseType[];
  addCourse: (newCourse: CourseType) => void;
  user: UserType;
  match: any;
  history: any;
  location: any;
  addToast: (text: string, action: string | undefined) => void;
  addLongToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
}

class Admin extends React.Component<IAdminProps, IAdminState> {
  public state: Readonly<IAdminState> = {
    currentCourse: undefined,
    loadedPanel: undefined,

    // Can't take credit for this gem...
    // https://medium.com/@gamshan001/javascript-deep-copy-for-array-and-object-97e3d4bc401a
    // Deep copies array so we don't mutate the state of the parent
    courses: JSON.parse(JSON.stringify(this.props.initialCourses)),

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

    lockChanges: true,

    toasts: [],
    longToasts: [],
    errorToasts: [],

    initialTab: 0,

    toLoadCourse: false,
    toLoadPanel: false,

    isLoading: false,
    loadingMessage: '',
    loadingTitle: '',
    onboardingModalVisible:
      Object.hasOwnProperty.bind(queryString.parse(this.props.location.search))('onboarding') ||
      this.props.initialCourses.length === 0,
  };

  public panels: { [key: string]: string } = {
    0: 'Course Data',
    1: 'Manage Assignments',
    2: 'Manage Users',
    3: 'Course Settings',
  };

  public panelMapForURL = ['course-data', 'assignments', 'manage-users', 'settings'];

  public defaultPanelArgForURL = ['students', null, null, null];

  public snackBarStyle = {
    width: '100%',
    fontWeight: 500,
    fontSize: 14,
    backgroundColor: '#24b47e',
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
    const { toLoadCourse, toLoadPanel, courses, currentCourse } = this.state;
    if (toLoadCourse || toLoadPanel) {
      this.setState({ toLoadCourse: false, toLoadPanel: false });
    }

    // Eagerly load most rececently created course, using id as a (perfect) proxy
    // for creation date.
    if (courses && courses.length > 0 && !currentCourse) {
      const courseToLoad = courses.sort((a, b) => {
        return b.id - a.id; // sort descending by id
      })[0];
      this.updateNewCourse({ value: courseToLoad.id, label: '' });
    }
  }

  public componentWillUnmount() {
    clearInterval(this.interval);
  }

  public updateNewCourse = (option: IOptionNumber) => {
    const currentCourse = this.state.courses.filter((course: CourseType) => {
      return course.id === option.value;
    })[0];

    window.clearInterval(this.interval);
    window.clearTimeout(this.interval);

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

        isLoading: false,
        loadingMessage: '',
        loadingTitle: '',

        // trigger URL change
        toLoadCourse: true,

        // Props for Enroll panels
        lockChanges: true,
      },
      () => {
        this.loadAllCourseData();
        this.interval = setInterval(() => {
          if (this.state.currentCourse) {
            this.loadAllCourseData();
          }
        }, 25000);
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
        const sortedAssignments = sortAssignments(newAssignments);
        this.setState({ assignments: sortedAssignments, assignmentsLoadComplete: true });
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

  public loadSubmissions = () => {
    const { currentCourse } = this.state;
    if (!currentCourse || !currentCourse.assignments) {
      return;
    }

    Promise.all(
      currentCourse.assignments.map((assignmentID) => {
        return Assignment.readSubmissions(assignmentID).then((subs: SubmissionType[]) => {
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
            this.props.addErrorToast(error, undefined);
          });
        });
        return Promise.reject();
      });
  };

  public loadRoster = () => {
    const { currentCourse } = this.state;
    if (!currentCourse) {
      return;
    }
    // courses/id/roster . students
    Course.readRoster(currentCourse.id).then((roster: RosterType) => {
      this.setState(
        {
          students: roster.students,
          graders: roster.graders,
          admins: roster.courseAdmins,
          superGraders: roster.superGraders,
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
            this.props.addErrorToast(error, undefined);
          });
        });
        return Promise.reject();
      });
  };

  // ------------------- Toggle data change locks  -------------------
  public toggleLock = () => {
    this.setState({
      lockChanges: !this.state.lockChanges,
    });
  };

  // ------------------- Manage users API calls  -------------------

  public isStudent = (user: string) => {
    return this.state.students.includes(user);
  };

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
                this.props.addToast('Student roster successfully updated.', undefined);
                this.generateSubmissionsByStudent();
              });
              break;
            case USER_APP.Grader:
              this.setState({ graders: roster.graders, inactiveGraders: roster.inactive_graders }, () => {
                this.props.addToast('Grader roster successfully updated.', undefined);
                this.generateSubmissionsByStudent();
              });
              break;
            case USER_APP.CourseAdmin:
              this.setState({ admins: roster.courseAdmins }, () =>
                this.props.addToast('Admin roster successfully updated.', undefined),
              );
              break;
            case USER_APP.SuperGrader:
              this.setState({ superGraders: roster.superGraders }, () =>
                this.props.addToast('Grader privileges successfully updated.', undefined),
              );
              break;
          }
        })
        // Error catching assumes a returned dictionary of type <errorType: string : [errors:string]>
        .catch((errors) => {
          Object.keys(errors).forEach((key) => {
            errors[key].forEach((error: string) => {
              this.props.addErrorToast(error, undefined);
            });
          });
          return Promise.reject();
        })
    );
  };

  public unEnrollUsers = (selectedUserEmails: string[], userType: USER_APP) => {
    switch (userType) {
      case USER_APP.Student:
        const newStudents = this.state.students.filter((user) => {
          return selectedUserEmails.indexOf(user) === -1;
        });
        return this.changeRoster(newStudents, userType);
      case USER_APP.Grader:
        const newGraders = this.state.graders.filter((user) => {
          return selectedUserEmails.indexOf(user) === -1;
        });
        return this.changeRoster(newGraders, userType);
      case USER_APP.CourseAdmin:
        const newAdmins = this.state.admins.filter((user) => {
          return selectedUserEmails.indexOf(user) === -1;
        });
        return this.changeRoster(newAdmins, userType);
      case USER_APP.SuperGrader:
        const newSuperGraders = this.state.superGraders.filter((user) => {
          return selectedUserEmails.indexOf(user) === -1;
        });
        return this.changeRoster(newSuperGraders, userType);
    }
  };

  public enrollUser = (userEmail: string, userType: USER_APP) => {
    const { students, graders, admins, superGraders } = this.state;
    switch (userType) {
      case USER_APP.Student:
        if (students.indexOf(userEmail) !== -1) {
          this.props.addErrorToast('Student is already enrolled in course', undefined);
          return Promise.reject();
        }
        // Need to do a deep copy of state array in case adding fails, we don't update state
        const newStudents = JSON.parse(JSON.stringify(students));
        newStudents.push(userEmail);

        // Check if the student is in the inactives for the course, and remove them if so
        return this.changeRoster(newStudents, userType);
      case USER_APP.Grader:
        if (graders.indexOf(userEmail) !== -1) {
          this.props.addErrorToast('Grader is already enrolled in course', undefined);
          return Promise.reject();
        }
        // Need to do a deep copy of state array in case adding fails, we don't update state
        const newGraders = JSON.parse(JSON.stringify(graders));
        newGraders.push(userEmail);
        return this.changeRoster(newGraders, userType);
      case USER_APP.CourseAdmin:
        if (admins.indexOf(userEmail) !== -1) {
          this.props.addErrorToast('Admin is already enrolled in course', undefined);
          return Promise.reject();
        }
        // Need to do a deep copy of state array in case adding fails, we don't update state
        const newAdmins = JSON.parse(JSON.stringify(admins));
        newAdmins.push(userEmail);
        return this.changeRoster(newAdmins, userType);
      case USER_APP.SuperGrader:
        if (superGraders.indexOf(userEmail) !== -1) {
          this.props.addErrorToast('Grader already has view all privileges.', undefined);
          return Promise.reject();
        }
        // Need to do a deep copy of state array in case adding fails, we don't update state
        const newSuperGraders = JSON.parse(JSON.stringify(superGraders));
        newSuperGraders.push(userEmail);
        return this.changeRoster(newSuperGraders, userType);
    }
  };

  public getFileExtension = (fileName: string): string => {
    const split = fileName.split('.');
    return split.length === 1 ? 'txt' : split[split.length - 1];
  };

  // Upload a submission in cautious mode
  public uploadSubmission = (assignment: AssignmentType, partners: string[], files: any[]) => {
    if (partners.length === 0) {
      this.props.addErrorToast('No students selected for the upload.', undefined);
      return;
    }

    // Check for collisions for each student
    const checkForCollisions = Promise.all(
      partners.map((student) => {
        return Assignment.readSubmissionsStudent(assignment.id, { student }).then((subs: SubmissionType[]) => {
          return subs.length > 0;
        });
      }),
    );

    checkForCollisions.then((values: boolean[]) => {
      // We found a collision
      if (values.includes(true)) {
        this.props.addErrorToast(
          'Collisions exist for this student group, so this upload has been aborted. \
          Please delete all associated submissions and try again.',
          undefined,
        );
      } else {
        // Create submission
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
          const { submissionsByStudent } = this.state;
          partners.forEach((student) => {
            if (!submissionsByStudent[student]) {
              submissionsByStudent[student] = {};
            }
            submissionsByStudent[student][assignment.id] = submission;
          });
          this.setState({ submissionsByStudent });
          return Promise.all(filePromises);
        });

        submissionPromise.then((v: any) => {
          this.props.addLongToast(`New ${assignment.name} submission for ${partners.join(', ')} created`, undefined);
        });
      }
    });
  };

  // ------------------- Manage sections API calls  -------------------
  public createSection = (newSection: string) => {
    const { currentCourse, sections } = this.state;

    if (!currentCourse) {
      return Promise.reject();
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
      this.setState({ sections, currentCourse }, () =>
        this.props.addToast(`New section ${section.name} created`, undefined),
      );
    });
  };

  public deleteSection = (sectionID: number) => {
    const { sections } = this.state;

    if (!sections) {
      return Promise.reject();
    }

    const thisSection = sections.find((section) => {
      return section.id === sectionID;
    });

    if (!thisSection) {
      return Promise.reject();
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

  public removeStudentFromSection = (
    sectionID: number,
    studentEmail: string,
    showToast: boolean,
  ): Promise<SectionType> => {
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

      this.setState({ sections: newSections, sectionsByStudent }, () => {
        if (showToast) {
          this.props.addToast(`Student ${studentEmail} removed from section ${json.name}`, undefined);
        }
      });
      return json;
    });
  };

  public addStudentToSection = (sectionID: number, studentEmail: string, showToast: boolean): Promise<SectionType> => {
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
        if (showToast) {
          this.props.addToast(`Student ${studentEmail} added to section ${json.name}`, undefined);
        }
      });
      return json;
    });
  };

  public changeStudentSection = (
    newSectionID: number | undefined,
    studentEmail: string,
    showToast: boolean,
  ): Promise<SectionType> => {
    const { sectionsByStudent } = this.state;
    const previousSection = sectionsByStudent[studentEmail];
    if (previousSection && newSectionID) {
      if (previousSection.id === newSectionID) {
        return Promise.reject();
      }
      return this.removeStudentFromSection(previousSection.id, studentEmail, showToast).then(() => {
        return this.addStudentToSection(newSectionID, studentEmail, showToast);
      });
    } else if (previousSection) {
      return this.removeStudentFromSection(previousSection.id, studentEmail, showToast);
    } else if (newSectionID) {
      return this.addStudentToSection(newSectionID, studentEmail, showToast);
    }
    this.props.addErrorToast('Error - both old section and new section are empty.', undefined);
    return Promise.reject();
  };

  // Set section's students. Warning: This is not a partial add, you must include all of the section's students
  // For a partial roster change see changeStudentSection()
  public changeSectionStudents = (sectionID: number, students: string[], showToast: boolean): Promise<SectionType> => {
    const { sections, sectionsByStudent } = this.state;
    const payload = { id: sectionID, students };

    return Section.update(payload).then((json: SectionType) => {
      const newSections = sections.map((section) => {
        if (section.id === json.id) {
          section.students = json.students;
        }
        return section;
      });

      students.forEach((studentEmail) => {
        sectionsByStudent[studentEmail] = {
          name: json.name,
          id: json.id,
        };
      });

      this.setState({ sections: newSections, sectionsByStudent }, () => {
        if (showToast) {
          this.props.addToast('Section updated.', undefined);
        }
      });
      return json;
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
      this.props.addToast(`Section ${json.name} leaders updated`, undefined);
      return json.leaders;
    });
  };

  // ------------------- Manage assignments API calls  ------------------
  // Updates return a Promise<void> instead of Promise<ObjectType> because (a) the
  // returned assignment should never by the child, only used to change state, and it renders faster on testing

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
        this.setState({ assignments: newAssignments }, () =>
          this.props.addToast('Assignment has been updated', undefined),
        );
        return;
      })
      .catch((errors) => {
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((error: string) => {
            this.props.addErrorToast(error, undefined);
          });
        });
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
      this.setState({ currentCourse, submissions, assignments: newAssignments }, () => {
        this.props.addLongToast(`Assignment ${assignment.name} successfully created.`, undefined);
      });
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
          this.props.addToast('Assignment deleted.', undefined);
          this.generateSubmissionsByStudent();
        },
      );
    });
  };

  public deleteSubmission = (sub: SubmissionType) => {
    const {
      submissions,
      submissionsByStudent,
      submissionsByGrader,
      submissionsByInactiveStudent,
      submissionsByInactiveGrader,
    } = this.state;
    const assignmentID = sub.assignment;
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
      this.props.addToast('Submission deleted.', undefined);
    });
  };

  // ------------------- Manage submission API calls  ------------------
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

    Submission.update(payload).then((submission) => {
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

      this.setState(
        {
          submissionsByStudent,
          submissionsByInactiveStudent,
          submissionsByGrader,
          submissionsByInactiveGrader,
        },
        () => {
          this.props.addToast('Submission successfully updated.', undefined);
        },
      );
    });
  };

  // ------------------- Manage course API calls  ------------------
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
            this.props.addLongToast(`Course ${course.name} | ${course.period} successfully created.`, undefined);
            this.setState({ toLoadCourse: true }, () => {
              this.updateNewCourse(this.selectorItemsFormatter([course])[0]);
            });

            return;
          });
        });
      } else {
        const newCourses = this.state.courses;
        newCourses.push(course);
        this.setState({ courses: newCourses }, () => this.props.addCourse(course));
        this.props.addLongToast(`Course ${course.name} | ${course.period} successfully created.`, undefined);
        this.setState({ toLoadCourse: true }, () => {
          this.updateNewCourse(this.selectorItemsFormatter([course])[0]);
        });

        return;
      }
    });
  };

  public updateSettings = (course: CoursePatchType) => {
    const { currentCourse, courses } = this.state;
    if (!currentCourse) {
      return Promise.reject();
    }

    if (course.id !== currentCourse.id) {
      return Promise.reject();
    }

    return Course.update(course).then((newCourse: CourseType) => {
      const newCourses = courses.filter((el) => {
        return el.id !== newCourse.id;
      });
      newCourses.push(newCourse);
      this.setState({ currentCourse: newCourse, courses: newCourses }, () => {
        this.props.addToast(`Settings for ${currentCourse.name} | ${currentCourse.period} saved.`, undefined);
      });
    });
  };

  public handleDemoCourse = (course: CourseType) => {
    const newCourses = this.state.courses;
    newCourses.push(course);
    this.setState({ courses: newCourses, toLoadCourse: true }, () => {
      this.props.addCourse(course);
      this.updateNewCourse(this.selectorItemsFormatter([course])[0]);
      this.props.addLongToast('Demo course successfully created.', undefined);
    });
    return;
  };

  // ------------------- Set loading dialogs -------------------
  public setLoadingDialog = (title: string, message: string) => {
    this.setState({ isLoading: true, loadingMessage: message, loadingTitle: title });
  };

  public clearLoadingDialog = () => {
    this.setState({ isLoading: false, loadingMessage: '', loadingTitle: '' });
  };

  // A function that takes another function as argument and wraps it such that, while the function is executing,
  // a loading Dialog will appear. For use with functions that take a long time (like deletion, unenroll),
  // because quicker functions will look odd with a flash of loading
  public wrapLoading = (
    title: string,
    message: string,
    func: ((...args: any[]) => Promise<void>),
    ...props: any[]
  ): Promise<void> => {
    this.setLoadingDialog(title, message);
    const promise = func(...props);
    if (promise) {
      return promise
        .then(() => {
          this.clearLoadingDialog();
        })
        .catch(() => {
          this.clearLoadingDialog();
        });
    } else {
      // This clause is purely a catch in case we haven't been strict on making sure the promises
      // return an error instead of returning nothing
      this.clearLoadingDialog();
      return Promise.reject();
    }
  };

  // ------------------- Modal functions -------------------
  public openModal = () => {
    this.setState({ onboardingModalVisible: true });
  };

  public closeModal = () => {
    this.setState({ onboardingModalVisible: false });
    this.props.history.push(this.props.location.pathname);
  };

  // ------------------- Render -------------------
  public render() {
    const { courses, currentCourse, loadedPanel, toLoadCourse, toLoadPanel } = this.state;

    if (toLoadCourse || toLoadPanel) {
      if (currentCourse) {
        const formattedCourseName = currentCourse.name.replace(/ /g, '_');
        const formattedPeriod = currentCourse.period.replace(/ /g, '_');

        // hacky way to set default to 0
        let panel = 0;
        if (typeof loadedPanel !== 'undefined') {
          panel = loadedPanel;
        }
        const panelName = this.stringFromPanel(panel);

        return (
          <Redirect
            to={`/course-admin/${formattedCourseName}/${formattedPeriod}/${panelName}${this.props.location.search}`}
          />
        );
      }
    }

    if (!this.props.user.canCreateCourses) {
      return (
        <div className="admin__getStarted__text">
          Sorry, you're not registered as a course admin. Want access? Email us at team@codepost.io
        </div>
      );
    }

    let courseManagementPanel = null;

    if (currentCourse && loadedPanel === 0) {
      courseManagementPanel = (
        <div className="admin__main-panel__content-container">
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
            addToast={this.props.addToast}
            initialTab={this.state.initialTab}
            inactiveStudents={this.state.inactiveStudents}
            inactiveGraders={this.state.inactiveGraders}
            submissionsByInactiveStudent={this.state.submissionsByInactiveStudent}
            submissionsByInactiveGrader={this.state.submissionsByInactiveGrader}
            deleteSubmission={this.wrapLoading.bind(this, '', '', this.deleteSubmission)}
            changeSubmissionGrader={this.changeSubmissionGrader}
            uploadSubmission={this.uploadSubmission}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 1) {
      const { submissionsLoadComplete, assignmentsLoadComplete, submissionsbyUserLoadComplete } = this.state;

      courseManagementPanel = (
        <div>
          <ManageAssignments
            key={currentCourse.id}
            loadComplete={submissionsLoadComplete && assignmentsLoadComplete && submissionsbyUserLoadComplete}
            submissions={this.state.submissions}
            currentCourse={this.state.currentCourse}
            addToast={this.props.addToast}
            addErrorToast={this.props.addErrorToast}
            assignments={this.state.assignments}
            updateAssignment={this.updateAssignment}
            createAssignment={this.wrapLoading.bind(this, '', '', this.createAssignment)}
            deleteAssignment={this.wrapLoading.bind(
              this,
              'Deleting Assignment...',
              'This action can impact a lot of data and may take a few minutes.',
              this.deleteAssignment,
            )}
            setLoadingDialog={this.setLoadingDialog}
            clearLoadingDialog={this.clearLoadingDialog}
            submissionsByStudent={this.state.submissionsByStudent}
            students={this.state.students}
            uploadSubmission={this.uploadSubmission}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 2) {
      courseManagementPanel = (
        <div className={`admin__main-panel__content-container${this.state.lockChanges ? '--locked' : ''}`}>
          <ManageUsers
            key={currentCourse.id}
            currentCourse={this.state.currentCourse}
            sections={this.state.sections}
            students={this.state.students}
            graders={this.state.graders}
            superGraders={this.state.superGraders}
            admins={this.state.admins}
            inactiveStudents={this.state.inactiveStudents}
            inactiveGraders={this.state.inactiveGraders}
            sectionsByStudent={this.state.sectionsByStudent}
            rosterLoadComplete={this.state.rosterLoadComplete}
            sectionsLoadComplete={this.state.sectionsLoadComplete}
            lockChanges={this.state.lockChanges}
            toggleLock={this.toggleLock}
            enrollUser={this.enrollUser}
            unEnrollUsers={this.unEnrollUsers}
            changeRoster={this.wrapLoading.bind(this, '', '', this.changeRoster)}
            changeStudentSection={this.changeStudentSection}
            changeSectionStudents={this.changeSectionStudents}
            createSection={this.createSection}
            changeLeaders={this.changeSectionLeaders}
            addToast={this.props.addToast}
            addErrorToast={this.props.addErrorToast}
            initialTab={this.state.initialTab}
            setLoadingDialog={this.setLoadingDialog}
            clearLoadingDialog={this.clearLoadingDialog}
            deleteSection={this.wrapLoading.bind(this, 'Deleting Section...', '', this.deleteSection)}
            isStudent={this.isStudent}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 3) {
      courseManagementPanel = (
        <div className="content-container">
          <CourseSettingsPanel currentCourse={currentCourse} updateSettings={this.updateSettings} />
        </div>
      );
    } else if (!currentCourse) {
      if (courses.length > 0) {
        courseManagementPanel = (
          <div className="admin__getStarted">
            <img className="admin__getStarted__arrow" src={require('./img/get-started-arrow.png')} />
            <div className="admin__getStarted__text">Select a course to get started.</div>
          </div>
        );
      } else {
        courseManagementPanel = <div>Create a course to get started!</div>;
      }
    }

    const courseManagementNav = `admin__topbar__navButton${loadedPanel === 0 ? '--active' : ''}`;
    const manageAssignmenstNav = `admin__topbar__navButton${loadedPanel === 1 ? '--active' : ''}`;
    const manageUsersNav = `admin__topbar__navButton${loadedPanel === 2 ? '--active' : ''}`;
    const settingsNav = `admin__topbar__navButton${loadedPanel === 3 ? '--active' : ''}`;
    const isLoading = this.state.isLoading ? (
      <div>
        <DialogContainer
          id="loading-dialog"
          className={
            !this.state.loadingMessage && !this.state.loadingTitle
              ? 'dialog--generalLoading-notext'
              : 'dialog--generalLoading-text'
          }
          visible={true}
          title={this.state.loadingTitle}
          modal
          portal={true}
          focusOnMount={false}
          containFocus={false}
          disableScrollLocking={true}
        >
          <div className="dialog--generalLoading__message">{this.state.loadingMessage}</div>
          <CircularProgress id="progress" className="progress-circle--dialogLoading" style={{ color: 'black' }} />
        </DialogContainer>
      </div>
    ) : (
      <div />
    );

    const stillLoadingCourse =
      courses.length > 0 &&
      (!this.state.assignmentsLoadComplete ||
        !this.state.submissionsLoadComplete ||
        !this.state.submissionsbyUserLoadComplete ||
        !this.state.sectionsLoadComplete);

    return (
      <div className="admin">
        <div className="admin__topbar">
          <Select
            className="selector--admin-topbar"
            options={this.selectorItemsFormatter(courses)}
            onChange={this.handleCourseChange}
            value={this.selectorCurrentFormatter(currentCourse)}
            isLoading={stillLoadingCourse}
            isDisabled={stillLoadingCourse}
          />
          <div className="admin__topbar__nav">
            <div className={courseManagementNav} onClick={this.handlePanelChange.bind(this.props, 0)}>
              Submissions
            </div>
            <div className={manageAssignmenstNav} onClick={this.handlePanelChange.bind(this.props, 1)}>
              Assignments
            </div>
            <div className={manageUsersNav} onClick={this.handlePanelChange.bind(this.props, 2)}>
              Roster
            </div>
            <div className={settingsNav} onClick={this.handlePanelChange.bind(this.props, 3)}>
              Settings
            </div>
          </div>
          <div className="admin__topbar__rightBox">
            <NewCourseDialog
              courses={this.state.courses}
              addErrorToast={this.props.addErrorToast}
              createCourse={this.wrapLoading.bind(this, 'Creating Course...', '', this.createCourse)}
              selectorItemsFormatter={this.selectorItemsFormatter}
              selectorCurrentFormatter={this.selectorCurrentFormatter}
            />
            <div className="admin__onboardingModal" onClick={this.openModal}>
              i
            </div>
          </div>
        </div>
        <div className="admin__topbar__spacing" />
        <div className="admin__main-panel">
          {courseManagementPanel}
          {isLoading}
        </div>
        <ModalCarousel
          closeModal={this.closeModal}
          isVisible={this.state.onboardingModalVisible}
          content={adminCarouselContent}
          defaultIndex={0}
          isModal={true}
          className="onboarding-carousel-modal"
          onlyImage={false}
          userEmail={this.props.user.email}
          onDemoCreate={this.handleDemoCourse}
          demoCreated={
            typeof this.state.courses.find((el) => {
              return el.period === 'demo';
            }) !== 'undefined'
          }
        />
      </div>
    );
  }
}

export default Admin;
