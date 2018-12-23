import * as React from 'react';
import { Snackbar } from 'react-md';
import { Redirect } from 'react-router-dom';
import CourseData from './components/admin/CourseData';
import ManageAdmins from './components/admin/ManageAdmins';
import ManageAssignments from './components/admin/ManageAssignments';
import ManageGraders from './components/admin/ManageGraders';
import ManageSections from './components/admin/ManageSections';
import ManageStudents from './components/admin/ManageStudents';
import VerticalPane from './components/VerticalPane';
import './styles/index.scss';
import './styles/Student.scss';
import {
  IAssignment3,
  ICourse3,
  IGraderSubmissionsDataTable,
  IOptionNumber,
  IRubricCategoriesByAssignment,
  IRubricCategory3,
  IRubricComment,
  IRubricCommentsByCategory,
  ISection3,
  ISectionNoStudents,
  IStudentSubmissionsDataTable,
  ISubmission3,
  ISubmissionsByAssignment,
  IToast,
  UserEnum,
} from './types/common';

interface IAdminState {
  currentCourse?: ICourse3; // Course for selector
  loadedPanel: number; // Which active_panel to load, enum
  courses: ICourse3[]; // Set of courses for the admin for the selector

  // general state items
  isShowingSnackBar: boolean;
  isSaving: boolean;
  searchTerm: string;

  // student, grader, admin, sections data
  students: string[];
  studentsLoadComplete: boolean;
  graders: string[];
  gradersLoadComplete: boolean;
  admins: string[];
  adminsLoadComplete: boolean;
  sections: ISection3[];

  // Reminer - need to get rid of ISectionNoStudents, it's ugly
  sectionsByStudent: { [studentEmail: string]: ISectionNoStudents };
  sectionsLoadComplete: boolean;
  submissionsbyUserLoadComplete: boolean;

  submissions: ISubmissionsByAssignment;
  submissionsLoadComplete: boolean;

  // Props for Assignments panel
  assignments: IAssignment3[];
  assignmentsLoadComplete: boolean;

  rubricCategories: IRubricCategoriesByAssignment;
  rubricComments: IRubricCommentsByCategory;

  assignmentRubricLoadComplete: boolean;

  // Props for Enroll panels
  lockManageAdmin: boolean;
  lockManageStudent: boolean;
  lockManageGrader: boolean;
  lockManageSection: boolean;
  lockManageAssignment: boolean;

  email: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  redirect: boolean;

  submissionsByStudent: IStudentSubmissionsDataTable;
  submissionsByGrader: IGraderSubmissionsDataTable;

  toasts: IToast[];
}

class Admin extends React.Component<{}, IAdminState> {
  public state: Readonly<IAdminState> = {
    currentCourse: undefined, // Course for selector
    loadedPanel: 0, // Which active_panel to load, enum
    courses: [], // Set of courses for the admin for the selector

    // general props
    isShowingSnackBar: false,
    isSaving: false,
    searchTerm: '',

    // student, grader, admin, sections data
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
    // Props for Assignments panel
    assignments: [],
    assignmentsLoadComplete: false,

    rubricCategories: {},
    rubricComments: {},

    assignmentRubricLoadComplete: false,

    // Props for Enroll panels
    lockManageAdmin: true,
    lockManageStudent: true,
    lockManageGrader: true,
    lockManageSection: true,
    lockManageAssignment: true,

    email: '',
    isLoading: true,
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,

    submissionsByStudent: {},
    submissionsByGrader: {},

    toasts: [],
  };

  public panels: { [key: string]: string } = {
    0: 'Course Data',
    1: 'Manage Assignments',
    2: 'Manage Students',
    3: 'Manage Graders',
    4: 'Manage Sections',
    5: 'Manage Admins',
  };

  // ------------------- Permissions check functions -------------------

  public componentDidMount() {
    // Should kick user back to login screne if they are not logged in
    if (this.state.isLoggedIn) {
      this.setState({ isLoading: true });
      this.loadCourses();
    } else {
      // reminder, should check if logged in periodically,
      // in case logged out from admin on another tab
      this.setState({ redirect: true });
    }
  }

  public renderRedirect = () => {
    if (this.state.redirect) {
      return <Redirect to="/" />;
    }
    return;
  };

  // ------------------- Vertical pane selector functions  -------------------
  public update = (option: IOptionNumber) => {
    const currentCourse = this.state.courses.filter((course: ICourse3) => {
      return course.id === option.value;
    })[0];

    this.setState(
      {
        currentCourse,
        loadedPanel: 0,

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
        lockManageAdmin: true,
        lockManageStudent: true,
        lockManageGrader: true,
        lockManageSection: true,
        lockManageAssignment: true,

        email: '',
        isLoading: true,
        isLoggedIn: localStorage.getItem('token') ? true : false,
        redirect: false,

        submissionsByStudent: {},
        submissionsByGrader: {},

        toasts: [],
      },
      () => {
        this.loadAllCourseData();
      },
    );
  };

  // Course Selector functions
  public handleCourseChange = (option: IOptionNumber) => {
    const currentCourse = this.state.courses.filter((course: ICourse3) => {
      return course.id === option.value;
    })[0];

    this.setState(
      {
        // reminder: set students graders everything to undefined
        currentCourse,
      },
      () => {
        this.loadAllCourseData();
      },
    );
  };

  public handlePanelChange = (option: IOptionNumber, event: any) => {
    const { currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    this.setState({ loadedPanel: Number(option.value) }, () => {
      this.forceUpdate();
    });
  };

  public selectorItemsFormatter = (courses: ICourse3[]) => {
    return courses.map((course, i) => ({
      value: course.id,
      label: course.name,
    }));
  };

  public selectorCurrentFormatter = (currentCourse: ICourse3 | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return { value: currentCourse.id, label: currentCourse.name };
  };

  public tabItemsFormatter = () => {
    return Object.keys(this.panels).map((index: string) => ({
      label: this.panels[index],
      value: index,
    }));
  };

  public tabCurrentFormatter = () => {
    return {
      value: this.state.loadedPanel,
      label: this.panels[this.state.loadedPanel],
    };
  };

  // ------------------- Toast functions -------------------

  public addToast = (text: string, action: string | undefined) => {
    const toasts = this.state.toasts.slice();
    toasts.push({ text, action });
    this.setState({ toasts });
  };

  public dismissToast = () => {
    const [, ...toasts] = this.state.toasts;
    this.setState({ toasts });
  };

  // ------------------- Initial data load functions  -------------------
  public loadAllCourseData = () => {
    this.loadSubmissions();
    this.loadAssignments();
    // loadStudentsalsoLoadsSections
    this.loadRoster();
    this.setState({ submissionsbyUserLoadComplete: false });
  };

  public loadCourses = () => {
    fetch('/api/users/me/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        const admin = 'courseadminCourses';
        this.setState({
          courses: json[admin],
          isLoading: false,
          email: json.email,
        });
      });
  };

  public loadAssignments = () => {
    const { currentCourse } = this.state;
    this.setState({ assignmentsLoadComplete: false });
    if (currentCourse && currentCourse.assignments) {
      const getData = currentCourse.assignments.map((assignmentID) => {
        return new Promise((resolve) => {
          fetch(`/api/assignments/${assignmentID}`, {
            headers: {
              Authorization: `JWT ${localStorage.getItem('token')}`,
            },
          })
            .then((res) => {
              return res.json();
            })
            .then((json) => {
              const assignments = this.state.assignments;
              assignments.push(json);
              this.setState({ assignments }, () => resolve(json));
            });
        });
      });
      Promise.all(getData).then(() => {
        this.setState({ assignmentsLoadComplete: true }, () => {
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
          assignmentSubs.forEach((submission: ISubmission3) => {
            submission.students.forEach((student: string) => {
              // If a student is un enrolled, the submission won't be deleted,
              // so need to check to make sure it's in the subsByStudent
              if (subsByStudent[student]) {
                subsByStudent[student][assignmentID] = submission;
              }
            });
            if (submission.grader) {
              if (subsByGrader[submission.grader][assignmentID]) {
                subsByGrader[submission.grader][assignmentID].push(submission);
              } else {
                subsByGrader[submission.grader][assignmentID] = [submission];
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
    return new Promise((resolve) => {
      fetch(`/api/assignments/${assignmentID}/rubric/`, {
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
          json.comments.forEach((comment: IRubricComment) => {
            if (rubricComments[comment.category]) {
              rubricComments[comment.category].push(comment);
            } else {
              rubricComments[comment.category] = [comment];
            }
          });
          this.setState({ rubricCategories, rubricComments }, () => resolve('done'));
        });
    });
  };

  public loadRubrics = () => {
    const { currentCourse, assignments } = this.state;
    this.setState({ assignmentRubricLoadComplete: false });
    if (currentCourse && assignments) {
      const getData = assignments.map((assignment: IAssignment3) => {
        return this.loadAssignmentRubric(assignment.id);
      });
      Promise.all(getData).then(() => {
        this.setState({ assignmentRubricLoadComplete: true });
      });
    }
  };

  public loadSubmissions = () => {
    const { currentCourse } = this.state;
    this.setState({ submissionsLoadComplete: false });
    if (currentCourse && currentCourse.assignments) {
      const getData = currentCourse.assignments.map((assignmentID) => {
        return new Promise((resolve) => {
          fetch(`/api/assignments/${assignmentID}/submissions`, {
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
              this.setState({ submissions }, () => resolve(json));
            });
        });
      });
      Promise.all(getData).then(() => {
        this.setState({ submissionsLoadComplete: true }, () => this.generateSubmissionsByStudent());
      });
    }
  };

  public loadRoster = () => {
    this.setState({
      studentsLoadComplete: false,
      gradersLoadComplete: false,
      adminsLoadComplete: false,
    });
    const { currentCourse } = this.state;
    if (currentCourse) {
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
    }
  };

  public loadSections = () => {
    const { currentCourse } = this.state;
    this.setState({ sectionsLoadComplete: false });
    if (currentCourse && currentCourse.sections) {
      const getData = currentCourse.sections.map((sectionID) => {
        return new Promise((resolve) => {
          fetch(`/api/sections/${sectionID}`, {
            headers: {
              Authorization: `JWT ${localStorage.getItem('token')}`,
            },
          })
            .then((res) => {
              return res.json();
            })
            .then((json: ISection3) => {
              // Reminder --- should really filter out if the
              // section is already there to eliminate duplicates
              const { sections, sectionsByStudent } = this.state;
              sections.push(json);

              json.students.forEach((studentEmail: string) => {
                sectionsByStudent[studentEmail] = {
                  name: json.name,
                  id: json.id,
                };
              });
              this.setState({ sections, sectionsByStudent }, () => resolve(json));
            });
        });
      });
      Promise.all(getData).then(() => {
        this.setState({ sectionsLoadComplete: true });
      });
    }
  };

  // ------------------- Toggle data change locks  -------------------
  public toggleAssignmentLock = () => {
    this.setState({
      lockManageAssignment: !this.state.lockManageAssignment,
    });
  };

  public toggleEnrollStudentsLock = () => {
    this.setState({
      lockManageStudent: !this.state.lockManageStudent,
    });
  };

  public toggleAdminLock = () => {
    this.setState({
      lockManageAdmin: !this.state.lockManageAdmin,
    });
  };

  public toggleGraderLock = () => {
    this.setState({
      lockManageGrader: !this.state.lockManageGrader,
    });
  };

  public toggleSectionLock = () => {
    this.setState({
      lockManageSection: !this.state.lockManageSection,
    });
  };

  // ------------------- Manage users API calls  -------------------

  public changeRoster = (newRoster: string[], userType: UserEnum) => {
    const { currentCourse } = this.state;

    if (currentCourse) {
      let payload;
      if (userType === UserEnum.Student) {
        payload = { students: newRoster };
      } else if (userType === UserEnum.Grader) {
        payload = { graders: newRoster };
      } else if (userType === UserEnum.CourseAdmin) {
        payload = { courseAdmins: newRoster };
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
          this.addToast('Something went wrong', undefined);
          return undefined;
        })
        .then((json) => {
          console.log(json);
          if (json) {
            if (userType === UserEnum.Student) {
              console.log(json);
              this.setState(
                {
                  students: json.students,
                },
                () => this.addToast('Student roster successfully updated.', undefined),
              );
            } else if (userType === UserEnum.Grader) {
              console.log(json);
              this.setState(
                {
                  graders: json.graders,
                },
                () => this.addToast('Grader roster successfully updated.', undefined),
              );
            } else if (userType === UserEnum.CourseAdmin) {
              console.log(json);
              this.setState(
                {
                  admins: json.courseAdmins,
                },
                () => this.addToast('Admin roster successfully updated.', undefined),
              );
            }
          }
        });
    }
  };

  public unEnrollUsers = (selectedUserEmails: string[], userType: UserEnum) => {
    const { currentCourse } = this.state;

    if (currentCourse) {
      if (userType === UserEnum.Student) {
        const { students } = this.state;
        const newStudents = students.filter((student) => {
          return selectedUserEmails.indexOf(student) === -1;
        });
        this.changeRoster(newStudents, userType);
      } else if (userType === UserEnum.Grader) {
        const { graders } = this.state;
        console.log(selectedUserEmails);
        const newGraders = graders.filter((grader) => {
          return selectedUserEmails.indexOf(grader) === -1;
        });
        console.log(newGraders);
        this.changeRoster(newGraders, userType);
      } else if (userType === UserEnum.CourseAdmin) {
        const { admins } = this.state;
        const newAdmins = admins.filter((admin) => {
          return selectedUserEmails.indexOf(admin) === -1;
        });
        this.changeRoster(newAdmins, userType);
      }
    }
  };

  public enrollUser = (userEmail: string, userType: UserEnum) => {
    const { currentCourse } = this.state;
    const { students, graders, admins } = this.state;
    if (currentCourse) {
      if (userType === UserEnum.Student) {
        if (students.indexOf(userEmail) !== -1) {
          this.addToast('Student is already enrolled in course', undefined);
          return;
        }
        // Need to do a deep copy of state array in case adding fails, we don't
        // want to update the state
        const newStudents = JSON.parse(JSON.stringify(students));
        newStudents.push(userEmail);
        this.changeRoster(newStudents, userType);
      } else if (userType === UserEnum.Grader) {
        if (graders.indexOf(userEmail) !== -1) {
          this.addToast('Grader is already enrolled in course', undefined);
          return;
        }
        // Need to do a deep copy of state array in case adding fails, we don't
        // want to update the state
        const newGraders = JSON.parse(JSON.stringify(graders));
        newGraders.push(userEmail);
        this.changeRoster(newGraders, userType);
      } else if (userType === UserEnum.CourseAdmin) {
        if (admins.indexOf(userEmail) !== -1) {
          this.addToast('Admin is already enrolled in course', undefined);
          return;
        }
        // Need to do a deep copy of state array in case adding fails, we don't
        // want to update the state
        const newAdmins = JSON.parse(JSON.stringify(admins));
        newAdmins.push(userEmail);
        this.changeRoster(newAdmins, userType);
      }
      // this.addToast(`New ${userType} ${json.profile.username} added`, undefined);
    }
  };

  // ------------------- Manage sections API calls  -------------------
  public createSection = (newSection: string) => {
    const { currentCourse } = this.state;
    const { sections } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = 'name';
      const key2 = 'course';
      payload.append(key1, newSection);
      payload.append(key2, String(currentCourse.id));

      fetch('/api/sections/', {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        method: 'POST',
        body: payload,
      })
        .then((res) => {
          if (res.status === 201) {
            return res.json();
          }
          this.addToast(
            'Something went wrong. Please ensure the section name is valid.',
            undefined,
          );
          return undefined;
        })
        .then((json) => {
          if (json) {
            // Check this --- json.students = [];
            sections.push(json);
            this.addToast(`New section ${json.name} created`, undefined);
            this.setState({ sections });
          }
        });
    }
  };

  public addStudentToSection = (sectionID: number, studentEmail: string) => {
    const { sections, sectionsByStudent } = this.state;

    return new Promise((resolve) => {
      const thisSection = sections.filter((section) => {
        return section.id === sectionID;
      })[0];
      const newStudents = thisSection.students;
      newStudents.push(studentEmail);

      const payload = { id: thisSection.id, name: thisSection.name, students: newStudents };

      fetch(`/api/sections/${sectionID}/`, {
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
          this.addToast('Something went wrong. Please ensure the email is valid.', undefined);
          return undefined;
        })
        .then((json: ISection3) => {
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
              return resolve(json.id);
            });
          }
        });
    });
  };

  public addLeaderToSection = (sectionID: number, leaderEmail: string) => {
    const { sections } = this.state;

    return new Promise((resolve) => {
      const payload = { id: sectionID, leaders: [leaderEmail] };

      fetch(`/api/sections/${sectionID}/`, {
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
          this.addToast('Something went wrong. Please ensure the email is valid.', undefined);
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
              this.addToast(`${json.leaders[0]} set as leader of section ${name}`, undefined);
              return resolve(json.leaders);
            });
          }
        });
    });
  };

  // ------------------- Manage assignments API calls  ------------------

  public createRubricCategory = (
    assignmentID: number,
    categoryName: string,
    pointLimit: number | undefined,
    newComments: IRubricComment[],
  ) => {
    const { currentCourse, assignments, rubricCategories, rubricComments } = this.state;

    if (categoryName.length === 0) {
      this.addToast('Cannot save rubric. Cateory name cannot be empty.', undefined);
      return;
    }

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = 'name';
      const key2 = 'assignment';
      const key3 = 'pointLimit';
      payload.append(key1, categoryName);
      payload.append(key2, String(assignmentID));
      payload.append(key3, String(pointLimit));

      fetch('/api/rubriccategories/', {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        method: 'POST',
        body: payload,
      })
        .then((res) => {
          if (res.status === 201) {
            return res.json();
          } else {
            this.addToast(`Something went wrong when trying to update ${categoryName}`, undefined);
            return undefined;
          }
        })
        .then((json: IRubricCategory3) => {
          if (json) {
            assignments.forEach((assn) => {
              // Add an empty set of comments to the returned
              // category, Api only returns category ids
              if (assn.id === assignmentID) {
                assn.rubricCategories.push(json.id);
              }
            });
            rubricCategories[assignmentID].push(json);
            rubricComments[json.id] = [];
            this.addToast(`New Rubric Category ${json.name} created`, undefined);
            this.setState({ assignments, rubricCategories, rubricComments }, () => {
              newComments.forEach((comment) => {
                this.createRubricComment(assignmentID, json.id, comment.text, comment.pointDelta);
              });
            });
          }
        });
    }
  };

  public deleteRubricCategory = (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
  ) => {
    const { currentCourse, assignments, rubricCategories } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = 'id';
      payload.append(key1, String(categoryID));

      fetch(`/api/rubriccategories/${categoryID}/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        method: 'DELETE',
        body: payload,
      }).then((res) => {
        if (res.status === 204) {
          this.addToast(`Category ${categoryName} deleted`, undefined);
          assignments.forEach((assn) => {
            if (assn.id === assignmentID) {
              assn.rubricCategories = assn.rubricCategories.filter((catID) => {
                return catID !== categoryID;
              });
            }
            rubricCategories[assignmentID] = rubricCategories[assignmentID].filter((cat) => {
              return cat.id !== categoryID;
            });
          });
          this.setState({ assignments, rubricCategories });
        } else {
          this.addToast(`Something went wrong when trying to delete ${categoryName}`, undefined);
        }
      });
    }
  };

  public updateRubricCategory = (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    categoryPointLimit: number | undefined,
  ) => {
    const { currentCourse, rubricCategories } = this.state;
    if (categoryName.length === 0) {
      this.addToast('Cannot save rubric. Cateory name cannot be empty.', undefined);
      return;
    }

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = 'id';
      const key2 = 'text';
      const key3 = 'pointDelta';
      const key4 = 'assignment';
      payload.append(key1, String(categoryID));
      payload.append(key2, categoryName);
      payload.append(key3, String(categoryPointLimit));
      payload.append(key4, String(assignmentID));

      fetch(`/api/rubriccategories/${categoryID}/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        method: 'PATCH',
        body: payload,
      })
        .then((res) => {
          if (res.status === 200) {
            return res.json();
          } else {
            this.addToast(`Something went wrong when trying to update ${categoryName}.`, undefined);
            return undefined;
          }
        })
        .then((json: IRubricCategory3) => {
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
        });
    }
  };

  public createRubricComment = (
    assignmentID: number,
    categoryID: number,
    commentText: string,
    commentDelta: number,
  ) => {
    const { currentCourse, rubricCategories, rubricComments } = this.state;
    if (commentText.length === 0) {
      this.addToast('Cannot save comment. Comment text cannot be empty.', undefined);
      return;
    }
    console.log(commentText);

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = 'text';
      const key2 = 'category';
      const key3 = 'pointDelta';
      payload.append(key1, commentText);
      payload.append(key2, String(categoryID));
      payload.append(key3, String(commentDelta));

      fetch('/api/rubriccomments/', {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        method: 'POST',
        body: payload,
      })
        .then((res) => {
          if (res.status === 201) {
            return res.json();
          } else {
            this.addToast('Something went wrong.', undefined);
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
        });
    }
  };

  public deleteRubricComment = (assignmentID: number, categoryID: number, commentID: number) => {
    const { currentCourse, rubricCategories, rubricComments } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = 'id';
      payload.append(key1, String(commentID));

      fetch(`/api/rubriccomments/${commentID}/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        method: 'DELETE',
        body: payload,
      }).then((res) => {
        if (res.status === 204) {
          const catIndex = rubricCategories[assignmentID]
            .map((cat) => {
              return cat.id;
            })
            .indexOf(categoryID);
          if (catIndex !== -1) {
            rubricComments[categoryID] = rubricComments[categoryID].filter((com) => {
              return com.id !== commentID;
            });
          }
          this.setState({ rubricCategories, rubricComments });
        } else {
          this.addToast('Something went wrong.', undefined);
        }
      });
    }
  };

  public updateRubricComment = (
    categoryID: number,
    commentID: number,
    commentText: string,
    commentDelta: number,
  ) => {
    const { currentCourse, rubricComments } = this.state;

    if (commentText.length === 0) {
      this.addToast('Cannot save comment. Comment text cannot be empty.', undefined);
      return;
    }

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = 'id';
      const key2 = 'text';
      const key3 = 'pointDelta';
      payload.append(key1, String(commentID));
      payload.append(key2, commentText);
      payload.append(key3, String(commentDelta));

      fetch(`/api/rubriccomments/${commentID}/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        method: 'PATCH',
        body: payload,
      })
        .then((res) => {
          if (res.status === 200) {
            return res.json();
          } else {
            this.addToast('Something went wrong.', undefined);
            return undefined;
          }
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
        });
    }
  };

  public updateAssignment = (assignmentID: number, name: string, points: number) => {
    const { currentCourse, assignments } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = 'id';
      const key2 = 'name';
      const key3 = 'points';
      const key4 = 'course';
      payload.append(key1, String(assignmentID));
      payload.append(key2, name);
      payload.append(key3, String(points));
      payload.append(key4, String(currentCourse.id));

      fetch(`/api/assignments/${assignmentID}/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
        method: 'PATCH',
        body: payload,
      })
        .then((res) => {
          if (res.status === 200) {
            return res.json();
          } else {
            this.addToast('Something went wrong when trying to update assignment', undefined);
            return undefined;
          }
        })
        .then((json) => {
          if (json) {
            assignments.forEach((assn) => {
              if (assn.id === assignmentID) {
                assn.name = json.name;
                assn.points = json.points;
              }
            });
            this.setState({ assignments });
          }
        });
    }
  };
  // ------------------- Render -------------------
  public render() {
    const { courses, currentCourse, loadedPanel, toasts } = this.state;

    let courseManagementPanel = null;

    if (currentCourse && loadedPanel === 0) {
      courseManagementPanel = (
        <div className="content-container">
          <CourseData
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
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 1) {
      courseManagementPanel = (
        <div className="content-container">
          <ManageAssignments
            rubricCategories={this.state.rubricCategories}
            rubricComments={this.state.rubricComments}
            submissions={this.state.submissions}
            submissionsLoadComplete={this.state.submissionsLoadComplete}
            lockManageAssignment={this.state.lockManageAssignment}
            toggleLock={this.toggleAssignmentLock}
            currentCourse={this.state.currentCourse}
            addToast={this.addToast}
            assignments={this.state.assignments}
            assignmentRubricLoadComplete={this.state.assignmentRubricLoadComplete}
            createRubricCategory={this.createRubricCategory}
            deleteRubricCategory={this.deleteRubricCategory}
            createRubricComment={this.createRubricComment}
            deleteRubricComment={this.deleteRubricComment}
            updateRubricComment={this.updateRubricComment}
            updateRubricCategory={this.updateRubricCategory}
            updateAssignment={this.updateAssignment}
          />
          <Snackbar
            id="snackbar"
            toasts={toasts}
            autohide={true}
            autohideTimeout={1500}
            onDismiss={this.dismissToast}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 2) {
      courseManagementPanel = (
        <div className="content-container">
          <ManageStudents
            sections={this.state.sections}
            students={this.state.students}
            studentsLoadComplete={this.state.studentsLoadComplete}
            lockedStudentChange={this.state.lockManageStudent}
            toggleLock={this.toggleEnrollStudentsLock}
            currentCourse={this.state.currentCourse}
            addToast={this.addToast}
            enrollUser={this.enrollUser}
            unEnrollUsers={this.unEnrollUsers}
            sectionsByStudent={this.state.sectionsByStudent}
            addStudentToSection={this.addStudentToSection}
          />
          <Snackbar
            id="example-snackbar"
            toasts={toasts}
            autohide={true}
            onDismiss={this.dismissToast}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 3) {
      courseManagementPanel = (
        <div className="content-container">
          <ManageGraders
            graders={this.state.graders}
            gradersLoadComplete={this.state.gradersLoadComplete}
            lockedGraderChange={this.state.lockManageGrader}
            toggleLock={this.toggleGraderLock}
            currentCourse={this.state.currentCourse}
            addToast={this.addToast}
            enrollUser={this.enrollUser}
            unEnrollUsers={this.unEnrollUsers}
          />

          <Snackbar
            id="example-snackbar"
            toasts={toasts}
            autohide={true}
            onDismiss={this.dismissToast}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 4) {
      courseManagementPanel = (
        <div className="content-container">
          <ManageSections
            sections={this.state.sections}
            sectionsLoadComplete={this.state.sectionsLoadComplete}
            lockedSectionChange={this.state.lockManageSection}
            toggleLock={this.toggleSectionLock}
            currentCourse={this.state.currentCourse}
            addToast={this.addToast}
            createSection={this.createSection}
            graders={this.state.graders}
            addLeader={this.addLeaderToSection}
          />

          <Snackbar
            id="example-snackbar"
            toasts={toasts}
            autohide={true}
            onDismiss={this.dismissToast}
          />
        </div>
      );
    } else if (currentCourse && loadedPanel === 5) {
      courseManagementPanel = (
        <div className="content-container">
          <ManageAdmins
            admins={this.state.admins}
            adminsLoadComplete={this.state.adminsLoadComplete}
            lockedAdminChange={this.state.lockManageAdmin}
            toggleLock={this.toggleAdminLock}
            currentCourse={this.state.currentCourse}
            addToast={this.addToast}
            enrollUser={this.enrollUser}
            unEnrollUsers={this.unEnrollUsers}
          />

          <Snackbar
            id="example-snackbar"
            toasts={toasts}
            autohide={true}
            onDismiss={this.dismissToast}
          />
        </div>
      );
    }

    return (
      <div className="AdminApp">
        {this.renderRedirect()}
        <div>
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
            id="example-snackbar"
            toasts={toasts}
            autohide={true}
            onDismiss={this.dismissToast}
          />
        </div>
        {courseManagementPanel}
      </div>
    );
  }
}

export default Admin;
