import * as React from 'react';
import { Snackbar } from 'react-md';
import { Redirect } from 'react-router-dom';
import CourseData from './components/admin/CourseData';
import ManageAdmins from './components/admin/ManageAdmins';
import ManageAssignments from './components/admin/ManageAssignments';
import ManageGraders from './components/admin/ManageGraders';
import ManageSections from './components/admin/ManageSections';
import ManageStudents from './components/admin/ManageStudents';
import NewCourseDialog from './components/admin/NewCourseDialog';
import VerticalPane from './components/VerticalPane';
import './styles/index.scss';
import './styles/Student.scss';
import {
  IAssignment,
  IAssignmentToRubricCategories,
  IAssignmentToSubmissionsMap,
  ICourse,
  IGraderSubmissionsDataTable,
  IOptionNumber,
  IRubricCategory,
  IRubricCategoryToRubricCommentsMap,
  IRubricComment,
  ISection,
  ISectionNoStudents,
  IStudentSubmissionsDataTable,
  ISubmission,
  IToast,
  USER_APP,
} from './types/common';

interface IAdminState {
  currentCourse?: ICourse; // Course for selector
  loadedPanel?: number; // Which active_panel to load, enum
  courses: ICourse[]; // Set of courses for the admin for the selector

  // student, grader, admin, sections data
  students: string[];
  studentsLoadComplete: boolean;
  inactiveStudents: string[];
  graders: string[];
  gradersLoadComplete: boolean;
  admins: string[];
  adminsLoadComplete: boolean;
  sections: ISection[];

  // Reminder - need to get rid of ISectionNoStudents, it's ugly
  sectionsByStudent: { [studentEmail: string]: ISectionNoStudents };
  sectionsLoadComplete: boolean;
  submissionsbyUserLoadComplete: boolean;

  submissions: IAssignmentToSubmissionsMap;
  submissionsLoadComplete: boolean;

  // Props for Assignments panel
  assignments: IAssignment[];
  assignmentsLoadComplete: boolean;

  rubricCategories: IAssignmentToRubricCategories;
  rubricComments: IRubricCategoryToRubricCommentsMap;

  assignmentRubricLoadComplete: boolean;

  // Props for Enroll panels
  lockChanges: boolean;

  email: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  redirect: boolean;

  submissionsByStudent: IStudentSubmissionsDataTable;
  submissionsByGrader: IGraderSubmissionsDataTable;

  toasts: IToast[];
  longToasts: IToast[];
  errorToasts: IToast[];

  // URL variables
  toLoadCourse: boolean;
  toLoadPanel: boolean;

  // Pre-loaded initializtion paramters for children
  readURL: boolean;
  initialTab: number;
}

interface IAdminProps {
  match: any;
  history: any;
}

class Admin extends React.Component<IAdminProps, IAdminState> {
  public state: Readonly<IAdminState> = {
    currentCourse: undefined, // Course for selector
    loadedPanel: undefined, // Which active_panel to load, enum
    courses: [], // Set of courses for the admin for the selector

    // student, grader, admin, sections data
    students: [],
    studentsLoadComplete: false,
    inactiveStudents: [],
    graders: [],
    gradersLoadComplete: false,
    admins: [],
    adminsLoadComplete: false,

    sections: [],
    sectionsByStudent: {},
    sectionsLoadComplete: false,
    submissionsbyUserLoadComplete: false,

    submissions: {},
    submissionsLoadComplete: false,
    // Props for Assignments panel
    assignments: [],
    assignmentsLoadComplete: false,

    rubricCategories: {},
    rubricComments: {},

    assignmentRubricLoadComplete: false,

    // Props for Enroll panels
    lockChanges: true,

    email: '',
    isLoading: true,
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,

    submissionsByStudent: {},
    submissionsByGrader: {},

    toasts: [],
    longToasts: [],
    errorToasts: [],

    readURL: false,
    initialTab: 0,

    toLoadCourse: false,
    toLoadPanel: false,
  };

  public panels: { [key: string]: string } = {
    0: 'Course Data',
    1: 'Manage Assignments',
    2: 'Manage Students',
    3: 'Manage Graders',
    4: 'Manage Sections',
    5: 'Manage Admins',
  };

  public panelMapForURL = [
    'course-data',
    'assignments',
    'manage-students',
    'manage-graders',
    'manage-sections',
    'manage-admins',
  ];

  public defaultPanelArgForURL = [
    'students',
    null,
    null,
    null,
    null,
    null,
  ];

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
    let currentCourse : ICourse | undefined;
    let loadedPanel;
    if (courseName && period) {
      const formattedCourseName = courseName.replace(/_/g, ' ');
      const formattedPeriod = period.replace(/_/g, ' ');
      currentCourse = courses.find((obj: ICourse) => {
        return (obj.name === formattedCourseName) && (obj.period === formattedPeriod);
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
  }

  public panelFromString(name : string) {
    const toRet = this.panelMapForURL.indexOf(name);
    return toRet >= 0 ? toRet : 0;
  }

  public stringFromPanel(panel : number) {
    if (panel < this.panelMapForURL.length && panel >= 0) {
      return this.panelMapForURL[panel];
    }
    return null;
  }

  public panelArgFromPanel(panel : number) {
    if (panel < this.defaultPanelArgForURL.length && panel >= 0) {
      return this.defaultPanelArgForURL[panel];
    }
    return null;
  }

  // ------------------- Permissions check functions -------------------

  public componentDidMount() {
    // Should kick user back to login screne if they are not logged in
    if (this.state.isLoggedIn) {
      this.setState({ isLoading: true }, () => this.loadCourses());
    } else {
      // reminder, should check if logged in periodically,
      // in case logged out from admin on another tab
      this.setState({ redirect: true });
    }
    this.interval = setInterval(() => {
      if (this.state.currentCourse) {
        this.loadAllCourseData();
      } else {
        this.loadCourses();
      }
    }, 10000);
  }

  public componentDidUpdate(prevProps : IAdminProps, prevState : IAdminState) {
    const { isLoading, toLoadCourse, toLoadPanel } = this.state;

    // After loading necessary resources, set state from URL
    if (prevState.isLoading && !isLoading) {
      this.setStateFromURL();
    }

    if (toLoadCourse || toLoadPanel) {
      this.setState({ toLoadCourse: false, toLoadPanel: false });
    }
  }

  public componentWillUnmount() {
    clearInterval(this.interval);
  }

  public renderRedirect = () => {
    if (this.state.redirect) {
      return <Redirect to="/" />;
    }
    return;
  };

  public updateNewCourse = (option: IOptionNumber) => {
    this.loadCourses().then(() => {
      const currentCourse = this.state.courses.filter((course: ICourse) => {
        return course.id === option.value;
      })[0];

      const currentPanel = this.state.loadedPanel ? this.state.loadedPanel : 0;

      this.setState(
        {
          currentCourse,
          loadedPanel: currentPanel,

          students: [],
          studentsLoadComplete: false,
          graders: [],
          gradersLoadComplete: false,
          admins: [],
          adminsLoadComplete: false,

          sections: [],
          sectionsByStudent: {},
          sectionsLoadComplete: false,
          submissionsbyUserLoadComplete: false,

          submissions: {},
          submissionsLoadComplete: false,

          assignments: [],
          assignmentsLoadComplete: false,

          rubricCategories: {},
          rubricComments: {},

          assignmentRubricLoadComplete: false,

          // Props for Enroll panels
          lockChanges: true,

          email: '',
          isLoading: false,
          isLoggedIn: localStorage.getItem('token') ? true : false,
          redirect: false,

          submissionsByStudent: {},
          submissionsByGrader: {},
        },
        () => {
          this.loadAllCourseData();
        },
      );
    });
  };

  // Course Selector functions
  public handleCourseChange = (option: IOptionNumber) => {
    const currentCourse = this.state.courses.filter((course: ICourse) => {
      return course.id === option.value;
    })[0];

    // reminder: set students graders everything to undefined
    this.setState(
      { currentCourse, toLoadCourse: true },
      () => {
        this.updateNewCourse(option);
      },
    );
  };

  public handlePanelChange = (option: IOptionNumber, event: any) => {
    const { currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    this.setState({ loadedPanel: Number(option.value), toLoadPanel: true }, () => {
      this.forceUpdate();
    });
  };

  public selectorItemsFormatter = (courses: ICourse[]) => {
    return courses.map((course, i) => ({
      value: course.id,
      label: `${course.name} | ${course.period}`,
    }));
  };

  public selectorCurrentFormatter = (currentCourse: ICourse | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return { value: currentCourse.id, label: `${currentCourse.name} | ${currentCourse.period}` };
  };

  public tabItemsFormatter = () => {
    return Object.keys(this.panels).map((index: string) => ({
      label: this.panels[index],
      value: index,
    }));
  };

  public tabCurrentFormatter = () => {
    const loadedPanel = this.state.loadedPanel;
    if (typeof loadedPanel !== 'undefined') {
      return {
        value: loadedPanel,
        label: this.panels[loadedPanel],
      };
    } else {
      return undefined;
    }
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
    // loadStudentsalsoLoadsSections
    this.loadRoster();
  };

  public loadCourses = () => {
    return fetch('/api/users/me/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        const admin = 'courseadminCourses';
        this.setState(
          {
            courses: json[admin],
            isLoading: false,
            email: json.email,
          },
          () => {
            return;
          },
        );
      });
  };

  public loadAssignments = () => {
    const { currentCourse } = this.state;
    if (currentCourse && currentCourse.assignments) {
      const getData = currentCourse.assignments.map((assignmentID) => {
        return fetch(`/api/assignments/${assignmentID}`, {
          headers: {
            Authorization: `JWT ${localStorage.getItem('token')}`,
          },
        })
          .then((res) => {
            return res.json();
          })
          .then((json) => {
            return json;
          });
      });
      Promise.all(getData).then((newAssignments: IAssignment[]) => {
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
      submissions,
      studentsLoadComplete,
      gradersLoadComplete,
      submissionsLoadComplete,
    } = this.state;
    if (studentsLoadComplete && gradersLoadComplete && submissionsLoadComplete) {
      const promise = new Promise((resolve, reject) => {
        const subsByStudent: IStudentSubmissionsDataTable = {};
        const subsByGrader: IGraderSubmissionsDataTable = {};
        students.forEach((student) => {
          subsByStudent[student] = {};
        });

        graders.forEach((grader) => {
          subsByGrader[grader] = {};
        });

        Object.keys(submissions).forEach((assignmentID) => {
          const assignmentSubs = submissions[assignmentID];
          assignmentSubs.forEach((submission: ISubmission) => {
            submission.students.forEach((student: string) => {
              // If a student is un enrolled, the submission won't be deleted,
              // so need to check to make sure it's in the subsByStudent
              if (subsByStudent[student]) {
                subsByStudent[student][assignmentID] = submission;
              }
            });
            if (submission.grader) {
              if (submission.grader in subsByGrader) {
                if (subsByGrader[submission.grader][assignmentID]) {
                  subsByGrader[submission.grader][assignmentID].push(submission);
                } else {
                  subsByGrader[submission.grader][assignmentID] = [submission];
                }
              }
            }
          });
        });

        this.setState(
          {
            submissionsByStudent: subsByStudent,
            submissionsByGrader: subsByGrader,
            submissionsbyUserLoadComplete: true,
          },
          () => resolve('done'),
        );
      });

      await promise;
    }
  }

  public loadAssignmentRubric = (assignmentID: number) => {
    return fetch(`/api/assignments/${assignmentID}/rubric/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        const { rubricCategories, rubricComments } = this.state;
        rubricCategories[assignmentID] = json.categories;
        json.categories.forEach((cat: IRubricCategory) => {
          rubricComments[cat.id] = json.comments.filter((comm: IRubricComment) => {
            console.log('here');
            console.log(comm.category);
            return comm.category === cat.id;
          });
        });
        this.setState({ rubricCategories, rubricComments }, () => {
          return;
        });
      });
  };

  public loadRubrics = () => {
    const { currentCourse, assignments } = this.state;
    if (!currentCourse || !assignments) {
      return;
    }
    Promise.all(
      assignments.map((assignment: IAssignment) => {
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
        return fetch(`/api/assignments/${assignmentID}/submissions`, {
          headers: {
            Authorization: `JWT ${localStorage.getItem('token')}`,
          },
        })
          .then((res) => {
            return res.json();
          })
          .then((json) => {
            const submissions = this.state.submissions;
            submissions[assignmentID] = json;
            this.setState({ submissions }, () => {
              return;
            });
          });
      }),
    ).then(() => {
      this.setState({ submissionsLoadComplete: true }, () => this.generateSubmissionsByStudent());
    });
  };

  public loadRoster = () => {
    const { currentCourse } = this.state;
    if (!currentCourse) {
      return;
    }
    // courses/id/roster . students
    fetch(`/api/courses/${currentCourse.id}/roster`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        this.setState(
          {
            students: json.students,
            graders: json.graders,
            admins: json.courseAdmins,
            inactiveStudents: json.inactive_students,
            studentsLoadComplete: true,
            gradersLoadComplete: true,
            adminsLoadComplete: true,
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
        return fetch(`/api/sections/${sectionID}`, {
          headers: {
            Authorization: `JWT ${localStorage.getItem('token')}`,
          },
        })
          .then((res) => {
            return res.json();
          })
          .then((json: ISection) => {
            // Reminder --- should really filter out if the
            // section is already there to eliminate duplicates
            const { sectionsByStudent } = this.state;

            json.students.forEach((studentEmail: string) => {
              sectionsByStudent[studentEmail] = {
                name: json.name,
                id: json.id,
              };
            });
            this.setState({ sectionsByStudent });
            return json;
          });
      }),
    ).then((sections) => {
      this.setState({ sections, sectionsLoadComplete: true });
    });
  };

  // ------------------- Toggle data change locks  -------------------
  public toggleLock = () => {
    this.setState({
      lockChanges: !this.state.lockChanges,
    });
  };

  // ------------------- Manage users API calls  -------------------

  public changeRoster = (
    newRoster: string[],
    userType: USER_APP,
    inactiveStudents: string[] | undefined,
  ) => {
    const { currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    let payload;
    switch (userType) {
      case USER_APP.Student:
        payload = { students: newRoster };
        if (inactiveStudents) {
          const key = 'inactive_students';
          payload[key] = inactiveStudents;
        }
        break;
      case USER_APP.Grader:
        payload = { graders: newRoster };
        break;
      case USER_APP.CourseAdmin:
        payload = { courseAdmins: newRoster };
        break;
    }

    fetch(`/api/courses/${currentCourse.id}/roster/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        }
        this.addErrorToast('Something went wrong', undefined);
        return undefined;
      })
      .then((json) => {
        switch (userType) {
          case USER_APP.Student:
            this.setState(
              { students: json.students, inactiveStudents: json.inactive_students },
              () => {
                this.addToast('Student roster successfully updated.', undefined);
                this.generateSubmissionsByStudent();
              },
            );
            break;
          case USER_APP.Grader:
            this.setState({ graders: json.graders }, () => {
              this.addToast('Grader roster successfully updated.', undefined);
              this.generateSubmissionsByStudent();
            });
            break;
          case USER_APP.CourseAdmin:
            this.setState({ admins: json.courseAdmins }, () =>
              this.addToast('Admin roster successfully updated.', undefined),
            );
            break;
        }
      });
  };

  public unEnrollUsers = (selectedUserEmails: string[], userType: USER_APP) => {
    switch (userType) {
      case USER_APP.Student:
        const newStudents = this.state.students.filter((student) => {
          return selectedUserEmails.indexOf(student) === -1;
        });
        this.changeRoster(newStudents, userType, selectedUserEmails);
        break;
      case USER_APP.Grader:
        const newGraders = this.state.graders.filter((grader) => {
          return selectedUserEmails.indexOf(grader) === -1;
        });
        this.changeRoster(newGraders, userType, selectedUserEmails);
        break;
      case USER_APP.CourseAdmin:
        const newAdmins = this.state.admins.filter((admin) => {
          return selectedUserEmails.indexOf(admin) === -1;
        });
        this.changeRoster(newAdmins, userType, undefined);
        break;
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
        if (this.state.inactiveStudents.indexOf(userEmail) !== -1) {
          const newInactives = this.state.inactiveStudents.filter((i) => {
            return i !== userEmail;
          });
          this.changeRoster(newStudents, userType, newInactives);
        } else {
          this.changeRoster(newStudents, userType, undefined);
        }
        break;
      case USER_APP.Grader:
        if (graders.indexOf(userEmail) !== -1) {
          this.addErrorToast('Grader is already enrolled in course', undefined);
          return;
        }
        // Need to do a deep copy of state array in case adding fails, we don't update state
        const newGraders = JSON.parse(JSON.stringify(graders));
        newGraders.push(userEmail);
        this.changeRoster(newGraders, userType, undefined);
        break;
      case USER_APP.CourseAdmin:
        if (admins.indexOf(userEmail) !== -1) {
          this.addErrorToast('Admin is already enrolled in course', undefined);
          return;
        }
        // Need to do a deep copy of state array in case adding fails, we don't update state
        const newAdmins = JSON.parse(JSON.stringify(admins));
        newAdmins.push(userEmail);
        this.changeRoster(newAdmins, userType, undefined);
        break;
    }
  };

  // ------------------- Manage sections API calls  -------------------
  public createSection = (newSection: string) => {
    const { currentCourse } = this.state;
    const { sections } = this.state;

    if (!currentCourse) {
      return;
    }
    const payload = { name: newSection, course: currentCourse.id, leaders: [], students: [] };

    fetch('/api/sections/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 201) {
          return res.json();
        }
        this.addErrorToast(
          'Something went wrong. Please ensure the section name is valid.',
          undefined,
        );
        return undefined;
      })
      .then((json) => {
        if (json) {
          // Check this --- json.students = [];
          sections.push(json);
          currentCourse.sections.push(json.id);
          this.setState({ sections, currentCourse }, () =>
            this.addToast(`New section ${json.name} created`, undefined),
          );
        }
      });
  };

  public addStudentToSection = (sectionID: number, studentEmail: string): Promise<ISection> => {
    const { sections, sectionsByStudent } = this.state;

    // Reminder -- there must be a cleaner way to do this filter
    const thisSection = sections.filter((section) => {
      return section.id === sectionID;
    })[0];
    const newStudents = thisSection.students;
    newStudents.push(studentEmail);

    const payload = { id: thisSection.id, name: thisSection.name, students: newStudents };

    return fetch(`/api/sections/${sectionID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        }
        this.addErrorToast('Something went wrong. Please ensure the email is valid.', undefined);
        return undefined;
      })
      .then((json: ISection) => {
        if (json) {
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
            this.addToast(`Student ${studentEmail} added to section ${name}`, undefined);
          });
        }
        return json;
      });
  };

  public addLeaderToSection = (sectionID: number, leaderEmail: string): Promise<string[]> => {
    const { sections } = this.state;

    // Reminder -- need to change leaderEmail [] to concatenation of existing addLeaderToSection
    // once the front end can handle multiple leaders
    const payload = { id: sectionID, leaders: [leaderEmail] };

    return fetch(`/api/sections/${sectionID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        }
        this.addErrorToast('Something went wrong. Please ensure the email is valid.', undefined);
        return undefined;
      })
      .then((json) => {
        if (json) {
          let name = '';
          const newSections = sections.map((section) => {
            if (section.id === sectionID) {
              section.leaders = json.leaders;
              name = section.name;
            }
            return section;
          });

          this.setState({ sections: newSections }, () => {
            this.addToast(`${leaderEmail} set as a leader of section ${name}`, undefined);
          });
          return json.leaders;
        }
        return;
      });
  };

  // ------------------- Manage rubric API calls  ------------------

  public createRubricCategory = (
    assignmentID: number,
    categoryName: string,
    pointLimit: number | undefined,
    newComments: IRubricComment[],
  ): Promise<IRubricCategory> => {
    const { assignments, rubricCategories, rubricComments } = this.state;

    if (categoryName.length === 0) {
      this.addErrorToast('Cannot save rubric. Cateory name cannot be empty.', undefined);
      return new Promise((resolve) => {
        resolve(undefined);
      });
    }

    const payload = {
      name: categoryName,
      assignment: assignmentID,
      pointLimit,
      rubricComments: [],
    };

    return fetch('/api/rubricCategories/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 201) {
          return res.json();
        } else {
          this.addErrorToast(
            `Something went wrong when trying to update ${categoryName}`,
            undefined,
          );
          return undefined;
        }
      })
      .then((json: IRubricCategory) => {
        assignments.forEach((assn) => {
          // Add an empty set of comments to the returned
          // category, Api only returns category ids
          if (assn.id === assignmentID) {
            assn.rubricCategories.push(json.id);
          }
        });
        rubricCategories[assignmentID].push(json);
        rubricComments[json.id] = [];
        this.setState({ assignments, rubricCategories, rubricComments });
        // Reminder - need to change linter here for use
        return Promise.all(
          newComments.map((comment) => {
            return this.createRubricComment(
              assignmentID,
              json.id,
              comment.text,
              comment.pointDelta,
            );
          }),
        ).then(() => {
          return json;
        });
      });
  };

  public deleteRubricCategory = (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
  ) => {
    const { assignments, rubricCategories, rubricComments } = this.state;

    const payload = { id: categoryID };

    return fetch(`/api/rubricCategories/${categoryID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      body: JSON.stringify(payload),
    }).then((res) => {
      if (res.status !== 204) {
        this.addErrorToast(`Something went wrong when trying to delete ${categoryName}`, undefined);
        return undefined;
      }
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
      // Reminder -- fix this
    });
  };

  public updateRubricCategory = (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    categoryPointLimit: number | undefined,
  ): Promise<IRubricCategory> => {
    const { rubricCategories } = this.state;
    if (categoryName.length === 0) {
      this.addErrorToast('Cannot save rubric. Cateory name cannot be empty.', undefined);
      return new Promise((resolve) => {
        resolve(undefined);
      });
    }

    const payload = {
      id: categoryID,
      name: categoryName,
      pointLimit: categoryPointLimit,
      assignment: assignmentID,
    };

    return fetch(`/api/rubricCategories/${categoryID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        } else {
          this.addErrorToast(
            `Something went wrong when trying to update ${categoryName}.`,
            undefined,
          );
          return undefined;
        }
      })
      .then((json: IRubricCategory) => {
        if (json) {
          const catIndex = rubricCategories[assignmentID]
            .map((cat) => {
              return cat.id;
            })
            .indexOf(categoryID);
          if (catIndex !== -1) {
            // Reminder --- add checks for the data received
            rubricCategories[assignmentID][catIndex].name = json.name;
            rubricCategories[assignmentID][catIndex].pointLimit = json.pointLimit;
          }
          this.setState({ rubricCategories });
        }
        return json;
      });
  };

  public createRubricComment = (
    assignmentID: number,
    categoryID: number,
    commentText: string,
    commentDelta: number,
  ): Promise<IRubricComment> => {
    const { rubricCategories, rubricComments } = this.state;
    if (commentText.length === 0) {
      this.addErrorToast('Cannot save comment. Comment text cannot be empty.', undefined);
      return new Promise((resolve) => {
        resolve(undefined);
      });
    }

    const payload = { text: commentText, category: categoryID, pointDelta: commentDelta };
    return fetch('/api/rubricComments/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 201) {
          return res.json();
        } else {
          this.addErrorToast('Something went wrong.', undefined);
          return undefined;
        }
      })
      .then((json: IRubricComment) => {
        if (json) {
          rubricCategories[assignmentID].forEach((cat) => {
            if (cat.id === categoryID) {
              cat.rubricComments.push(json.id);
            }
          });
          rubricComments[categoryID].push(json);
          this.setState({ rubricCategories, rubricComments });
        }
        return json;
      });
  };

  public deleteRubricComment = (assignmentID: number, categoryID: number, commentID: number) => {
    const { rubricCategories, rubricComments } = this.state;
    const payload = { id: commentID };

    return fetch(`/api/rubricComments/${commentID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      body: JSON.stringify(payload),
    }).then((res) => {
      if (res.status !== 204) {
        this.addErrorToast('Something went wrong.', undefined);
        return undefined;
      }
      rubricComments[categoryID] = rubricComments[categoryID].filter((com) => {
        return com.id !== commentID;
      });
      rubricCategories[assignmentID].forEach((cat) => {
        if (cat.id === categoryID) {
          const newComments = cat.rubricComments.filter((i) => {
            return i !== commentID;
          });
          cat.rubricComments = newComments;
        }
      });
      this.setState({ rubricCategories, rubricComments });
      return;
    });
  };

  public updateRubricComment = (
    categoryID: number,
    commentID: number,
    commentText: string,
    commentDelta: number,
  ): Promise<IRubricComment> => {
    const { rubricComments } = this.state;

    if (commentText.length === 0) {
      this.addErrorToast('Cannot save comment. Comment text cannot be empty.', undefined);
      return new Promise((resolve) => {
        resolve(undefined);
      });
    }
    const payload = { id: commentID, text: commentText, pointDelta: commentDelta };

    return fetch(`/api/rubricComments/${commentID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status !== 200) {
          this.addErrorToast('Something went wrong.', undefined);
          return undefined;
        }
        return res.json();
      })
      .then((json) => {
        if (json) {
          const comIndex = rubricComments[categoryID]
            .map((com) => {
              return com.id;
            })
            .indexOf(commentID);
          if (comIndex !== -1) {
            rubricComments[categoryID][comIndex] = json;
          }
          this.setState({ rubricComments });
        }
        return json;
      });
  };

  // ------------------- Manage assignments API calls  ------------------
  public updateAssignment = (
    assignmentID: number,
    name: string | undefined,
    points: number | undefined,
    isReleased: boolean | undefined,
  ): Promise<IAssignment> => {
    const { assignments } = this.state;

    if (!name && !points && typeof isReleased === 'undefined') {
      return new Promise((resolve) => {
        resolve(undefined);
      });
    }

    const payload = { id: assignmentID };
    if (name) {
      const key = 'name';
      payload[key] = name;
    }
    if (points) {
      const key = 'points';
      payload[key] = points;
    }
    if (typeof isReleased !== 'undefined') {
      const key = 'isReleased';
      payload[key] = isReleased;
    }

    return fetch(`/api/assignments/${assignmentID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status !== 200) {
          this.addErrorToast('Something went wrong when trying to update assignment', undefined);
          return undefined;
        }
        return res.json();
      })
      .then((json) => {
        assignments.forEach((assn) => {
          if (assn.id === assignmentID) {
            assn.name = json.name;
            assn.points = json.points;
            assn.isReleased = json.isReleased;
          }
        });
        this.setState({ assignments }, () =>
          this.addToast('Assignment has been updated', undefined),
        );
        return json;
      });
  };

  public createAssignment = (
    assignmentName: string,
    assignmentPoints: number,
  ): Promise<IAssignment> => {
    const { currentCourse } = this.state;
    if (!currentCourse) {
      return new Promise((resolve) => {
        resolve(undefined);
      });
    }
    const payload = {
      course: currentCourse.id,
      name: assignmentName,
      points: assignmentPoints,
      isReleased: false,
      rubricCategories: [],
    };

    return fetch('/api/assignments/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status !== 201) {
          this.addErrorToast('Something went wrong.', undefined);
          return undefined;
        }
        return res.json();
      })
      .then((json: IAssignment) => {
        const { submissions, rubricCategories, assignments } = this.state;
        currentCourse.assignments.push(json.id);
        submissions[json.id] = [];
        rubricCategories[json.id] = [];
        assignments.push(json);
        this.setState({ currentCourse, submissions, rubricCategories, assignments }, () => {
          this.addLongToast(`Assignment ${json.name} successfully created.`, undefined);
        });
        return json;
      });
  };

  // ------------------- Manage course API calls  ------------------
  public createCourse = (courseName: string, coursePeriod: string) => {
    const { courses } = this.state;
    const payload = {
      name: courseName,
      period: coursePeriod,
    };

    return fetch('/api/courses/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status !== 201) {
          this.addErrorToast('Something went wrong.', undefined);
          return undefined;
        }
        return res.json();
      })
      .then((json: ICourse) => {
        if (json) {
          courses.push(json);
          this.setState({ courses });
          this.addLongToast(
            `Course ${json.name} | ${json.period} successfully created.`,
            undefined,
          );
          this.updateNewCourse(this.selectorItemsFormatter([json])[0]);
        }
        return json;
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

        return <Redirect to={`/course-admin/${formattedCourseName}/${formattedPeriod}/${panelName}`}/>;
      } else {
        return <Redirect to={'/course-admin'}/>;
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
            studentsLoadComplete={this.state.studentsLoadComplete}
            graders={this.state.graders}
            gradersLoadComplete={this.state.gradersLoadComplete}
            submissionsbyUserLoadComplete={this.state.submissionsbyUserLoadComplete}
            submissions={this.state.submissions}
            submissionsLoadComplete={this.state.submissionsLoadComplete}
            submissionsByStudent={this.state.submissionsByStudent}
            submissionsByGrader={this.state.submissionsByGrader}
            addToast={this.addToast}
            initialTab={this.state.initialTab}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 1) {
      courseManagementPanel = (
        <div className="content-container">
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
        </div>
      );
    } else if (currentCourse && loadedPanel === 2) {
      courseManagementPanel = (
        <div className="content-container">
          <ManageStudents
            key={currentCourse.id}
            sections={this.state.sections}
            students={this.state.students}
            studentsLoadComplete={this.state.studentsLoadComplete}
            lockedStudentChange={this.state.lockChanges}
            toggleLock={this.toggleLock}
            currentCourse={this.state.currentCourse}
            addToast={this.addToast}
            enrollUser={this.enrollUser}
            unEnrollUsers={this.unEnrollUsers}
            sectionsByStudent={this.state.sectionsByStudent}
            addStudentToSection={this.addStudentToSection}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 3) {
      courseManagementPanel = (
        <div className="content-container">
          <ManageGraders
            key={currentCourse.id}
            graders={this.state.graders}
            gradersLoadComplete={this.state.gradersLoadComplete}
            lockedGraderChange={this.state.lockChanges}
            toggleLock={this.toggleLock}
            currentCourse={this.state.currentCourse}
            addToast={this.addToast}
            enrollUser={this.enrollUser}
            unEnrollUsers={this.unEnrollUsers}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 4) {
      courseManagementPanel = (
        <div className="content-container">
          <ManageSections
            key={currentCourse.id}
            sections={this.state.sections}
            sectionsLoadComplete={this.state.sectionsLoadComplete}
            lockedSectionChange={this.state.lockChanges}
            toggleLock={this.toggleLock}
            currentCourse={this.state.currentCourse}
            addToast={this.addToast}
            createSection={this.createSection}
            graders={this.state.graders}
            addLeader={this.addLeaderToSection}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 5) {
      courseManagementPanel = (
        <div className="content-container">
          <ManageAdmins
            key={currentCourse.id}
            admins={this.state.admins}
            adminsLoadComplete={this.state.adminsLoadComplete}
            lockedAdminChange={this.state.lockChanges}
            toggleLock={this.toggleLock}
            currentCourse={this.state.currentCourse}
            addToast={this.addToast}
            enrollUser={this.enrollUser}
            unEnrollUsers={this.unEnrollUsers}
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

    return (
      <div className="AdminApp">
        {this.renderRedirect()}
        <div className="panel">
          <VerticalPane
            currentTab={this.tabCurrentFormatter()}
            currentSelector={this.selectorCurrentFormatter(currentCourse)}
            selectorItems={this.selectorItemsFormatter(courses)}
            tabItems={this.tabItemsFormatter()}
            handleTabChange={this.handlePanelChange}
            handleSelectorChange={this.handleCourseChange}
            isLoading={this.state.isLoading}
          />
          <Snackbar
            id="short-snackbar"
            className="short-snackbar"
            toasts={toasts}
            autohide={true}
            autohideTimeout={2000}
            onDismiss={this.dismissToast}
            style={this.snackBarStyle}
          />
          <Snackbar
            id="long-snackbar"
            className="long-snackbar"
            toasts={longToasts}
            autohide={true}
            autohideTimeout={4000}
            onDismiss={this.dismissLongToast}
            style={this.snackBarStyle}
          />
          <Snackbar
            id="error-snackbar"
            className="error-snackbar"
            toasts={errorToasts}
            autohide={true}
            autohideTimeout={2000}
            onDismiss={this.dismissErrorToast}
            style={this.errorSnackBarStyl4e}
          />
          <NewCourseDialog
            courses={this.state.courses}
            addErrorToast={this.addErrorToast}
            createCourse={this.createCourse}
          />
        </div>
        <div className="content">{courseManagementPanel}</div>
      </div>
    );
  }
}

export default Admin;
