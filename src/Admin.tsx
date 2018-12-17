import * as React from "react";
import { Snackbar } from "react-md";
import { Redirect } from "react-router-dom";
import CourseData from "./components/admin/CourseData";
import ManageAdmins from "./components/admin/ManageAdmins";
import ManageAssignments from "./components/admin/ManageAssignments";
import ManageGraders from "./components/admin/ManageGraders";
import ManageSections from "./components/admin/ManageSections";
import ManageStudents from "./components/admin/ManageStudents";
import VerticalPane from "./components/VerticalPane";
import "./styles/index.scss";
import "./styles/Student.scss";
import {
  IAssignment,
  IAssignmentSubmissionsMap,
  ICourse,
  ICourseAdmin,
  IGrader,
  IOptionNumber,
  IRubricComment,
  ISection,
  ISectionNoStudents,
  IStudent,
  ISubmission,
  IToast,
  IUserSubmissionsMap,
  UserEnum
} from "./types/common";

interface IAdminState {
  currentCourse?: ICourse; // Course for selector
  loadedPanel: number; // Which active_panel to load, enum
  courses: ICourse[]; // Set of courses for the admin for the selector

  // general state items
  isShowingSnackBar: boolean;
  isSaving: boolean;
  searchTerm: string;

  // student, grader, admin, sections data
  students: IStudent[];
  studentsLoadComplete: boolean;
  graders: IGrader[];
  gradersLoadComplete: boolean;
  admins: ICourseAdmin[];
  adminsLoadComplete: boolean;
  // Admins: IAdmin[];
  // adminsLoadComplete: boolean;
  sections: ISection[];
  sectionsByStudent: { [studentEmail: string]: ISectionNoStudents };
  sectionsLoadComplete: boolean;
  submissionsByStudentLoadComplete: boolean;

  submissionsByAssignment: IAssignmentSubmissionsMap;
  submissionsByAssignmentLoadComplete: boolean;

  // Props for Assignments panel
  assignments: IAssignment[];
  assignmentRubricLoadComplete: boolean;
  Assignments_selectedAssignment?: IAssignment;
  // Assignment to drill down on in assignments tab

  // Props for Enroll panels
  Enroll_lockedAdminChange: boolean;
  Enroll_lockedStudentChange: boolean;
  Enroll_lockedGraderChange: boolean;
  lockedSectionChange: boolean;
  lockedAssignmentChange: boolean;
  // Enroll_checkedAdmins: IAdmin[];

  // props for courseManagement
  courseManagement_tabIndex: number;
  courseMangement_selectedStudent?: IStudent;
  courseManagement_hideInactiveStudents: boolean;
  courseMangement_selectedGrader?: IGrader;

  email: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  redirect: boolean;

  submissionsByStudent: IUserSubmissionsMap;
  submissionsByGrader: IUserSubmissionsMap;

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
    searchTerm: "",

    // student, grader, admin, sections data
    students: [],
    studentsLoadComplete: false,
    graders: [],
    gradersLoadComplete: false,
    admins: [],
    adminsLoadComplete: false,
    // Admins: [],
    // adminsLoadComplete: false,
    sections: [],
    sectionsByStudent: {},
    sectionsLoadComplete: false,
    submissionsByStudentLoadComplete: false,

    submissionsByAssignment: {},
    submissionsByAssignmentLoadComplete: false,
    // Props for Assignments panel
    assignments: [],
    assignmentRubricLoadComplete: false,
    Assignments_selectedAssignment: undefined,

    // Props for Enroll panels
    Enroll_lockedAdminChange: true,
    Enroll_lockedStudentChange: true,
    Enroll_lockedGraderChange: true,
    lockedSectionChange: true,
    lockedAssignmentChange: true,
    // Enroll_checkedAdmins: [],

    // props for courseManagement
    courseManagement_tabIndex: 0,
    courseMangement_selectedStudent: undefined,
    courseManagement_hideInactiveStudents: false,
    courseMangement_selectedGrader: undefined,
    email: "",
    isLoading: true,
    isLoggedIn: localStorage.getItem("token") ? true : false,
    redirect: false,

    submissionsByStudent: {},
    submissionsByGrader: {},

    toasts: []
  };

  public panels: { [key: string]: string } = {
    0: "Course Data",
    1: "Manage Assignments",
    2: "Manage Students",
    3: "Manage Graders",
    4: "Manage Sections",
    5: "Manage Admins"
  };

  // ------------------- Permissions check functions -------------------

  public componentDidMount() {
    // Should kick user back to login screne if they are not logged in
    if (this.state.isLoggedIn) {
      this.setState({ isLoading: true });
      this.loadCourses();
    } else {
      // reminder, should check if logged in periodically, in case logged out from admin on another tab
      this.setState({ redirect: true });
    }
  }

  public renderRedirect = () => {
    if (this.state.redirect) {
      return <Redirect to="/" />;
    } else {
      return;
    }
  };

  // ------------------- Vertical pane selector functions  -------------------
  public update = (option: IOptionNumber) => {
    const currentCourse = this.state.courses.filter((course: ICourse) => {
      return course.id === option.value;
    })[0];

    this.setState(
      {
        // reminder: set students graders everything to undefined
        currentCourse
      },
      () => {
        this.loadAllCourseData();
      }
    );
  };

  // Course Selector functions
  public handleCourseChange = (option: IOptionNumber) => {
    const currentCourse = this.state.courses.filter((course: ICourse) => {
      return course.id === option.value;
    })[0];

    this.setState(
      {
        // reminder: set students graders everything to undefined
        currentCourse
      },
      () => {
        this.loadAllCourseData();
      }
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

  public selectorItemsFormatter = (courses: ICourse[]) => {
    return courses.map((course, i) => ({
      value: course.id,
      label: course.name
    }));
  };

  public selectorCurrentFormatter = (currentCourse: ICourse | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return { value: currentCourse.id, label: currentCourse.name };
  };

  public tabItemsFormatter = () => {
    return Object.keys(this.panels).map((index: string) => ({
      label: this.panels[index],
      value: index
    }));
  };

  public tabCurrentFormatter = () => {
    return {
      value: this.state.loadedPanel,
      label: this.panels[this.state.loadedPanel]
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
    // loadStudentsalsoLoadsSections
    this.loadStudents();
    this.loadGraders();
    this.setState({ submissionsByStudentLoadComplete: false });
    this.loadAdmins();
    this.loadRubrics();
    this.generateSubmissionsByStudent();
  };

  public async generateSubmissionsByStudent() {
    const {
      students,
      graders,
      submissionsByAssignment,
      studentsLoadComplete,
      gradersLoadComplete,
      submissionsByAssignmentLoadComplete
    } = this.state;
    if (
      studentsLoadComplete &&
      gradersLoadComplete &&
      submissionsByAssignmentLoadComplete
    ) {
      const promise = new Promise((resolve, reject) => {
        const subsByStudent: IUserSubmissionsMap = {};
        const subsByGrader: IUserSubmissionsMap = {};
        students.forEach(student => {
          subsByStudent[student.profile.id] = {
            profile: student.profile,
            submissionsByAssignment: {}
          };
        });

        graders.forEach(grader => {
          subsByGrader[grader.profile.id] = {
            profile: grader.profile,
            submissionsByAssignment: {}
          };
        });

        Object.keys(submissionsByAssignment).forEach(id => {
          submissionsByAssignment[id].submissions.forEach(
            (submission: ISubmission) => {
              submission.students.forEach((student: IStudent) => {
                // If a student is un enrolled, the submission won't be deleted, so need to check to make sure it's in the subsByStudent
                if (subsByStudent[student.profile.id]) {
                  subsByStudent[student.profile.id].submissionsByAssignment[
                    id
                  ] = submission;
                }
              });
              if (submission.grader) {
                if (
                  subsByGrader[submission.grader.profile.id]
                    .submissionsByAssignment[id]
                ) {
                  subsByGrader[
                    submission.grader.profile.id
                  ].submissionsByAssignment[id].push(submission);
                } else {
                  subsByGrader[
                    submission.grader.profile.id
                  ].submissionsByAssignment[id] = [submission];
                }
              }
            }
          );
        });

        this.setState(
          {
            submissionsByStudent: subsByStudent,
            submissionsByGrader: subsByGrader,
            submissionsByStudentLoadComplete: true
          },
          () => resolve("done")
        );
      });

      await promise;
    }
  }

  public loadCourses = () => {
    fetch("/api/users/me/", {
      headers: {
        Authorization: `JWT ${localStorage.getItem("token")}`
      }
    })
      .then(res => {
        return res.json();
      })
      .then(json => {
        const admin = "courseadminCourses";
        this.setState({
          courses: json[admin],
          isLoading: false,
          email: json.email
        });
      });
  };

  public loadRubricComments = (commentID: number) => {
    return new Promise(resolve => {
      fetch(`/api/rubricComments/${commentID}`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        }
      })
        .then(res => {
          return res.json();
        })
        .then(json => {
          return resolve(json);
        });
    });
  };

  public loadRubrics = () => {
    const { currentCourse } = this.state;
    this.setState({ assignmentRubricLoadComplete: false });
    if (currentCourse && currentCourse.assignments) {
      this.setState({ assignments: currentCourse.assignments });
      const getData = currentCourse.assignments.map(assignment => {
        return new Promise(resolve => {
          // /rubricCategory/id
          // id is from asslignments -- loop through assignment.rubricCategories and call fetch
          fetch(`/api/assignments/${assignment.id}/rubric`, {
            headers: {
              Authorization: `JWT ${localStorage.getItem("token")}`
            }
          })
            .then(res => {
              return res.json();
            })
            .then(json => {
              const assignments = this.state.assignments;
              assignments.forEach(assn => {
                if (assn.id === assignment.id) {
                  assn.rubric = json;
                }
              });
              this.setState({ assignments }, () => resolve(json));
            });
        });
      });
      Promise.all(getData).then(() => {
        const { assignments } = this.state;
        assignments.forEach(assn => {
          if (assn.rubric) {
            assn.rubric.forEach(categ => {
              if (categ.rubricComments) {
                const getComments = categ.rubricComments.map((id, i) => {
                  return this.loadRubricComments(id);
                });
                Promise.all(getComments).then((data: IRubricComment[]) => {
                  categ.comments = data;
                });
              }
            });
          }
        });

        this.setState({ assignmentRubricLoadComplete: true });
      });
    }
  };

  public loadSubmissions = () => {
    const { currentCourse } = this.state;
    this.setState({ submissionsByAssignmentLoadComplete: false });
    if (currentCourse && currentCourse.assignments) {
      const getData = currentCourse.assignments.map(assignment => {
        return new Promise(resolve => {
          fetch(`/api/assignments/${assignment.id}/submissions`, {
            headers: {
              Authorization: `JWT ${localStorage.getItem("token")}`
            }
          })
            .then(res => {
              return res.json();
            })
            .then(json => {
              const submissionsByAssignment = this.state
                .submissionsByAssignment;
              submissionsByAssignment[assignment.id] = {
                name: assignment.name,
                points: assignment.points,
                isReleased: assignment.isReleased,
                submissions: json
              };
              this.setState({ submissionsByAssignment }, () => resolve(json));
            });
        });
      });
      Promise.all(getData).then(() => {
        this.setState({ submissionsByAssignmentLoadComplete: true }, () =>
          this.generateSubmissionsByStudent()
        );
      });
    }
  };

  public loadStudents = () => {
    this.setState({ studentsLoadComplete: false });
    const { currentCourse } = this.state;
    if (currentCourse) {
      // courses/id/roster . students
      fetch(`/api/courses/${currentCourse.id}/students`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        }
      })
        .then(res => {
          return res.json();
        })
        .then(json => {
          this.setState({ students: json, studentsLoadComplete: true }, () => {
            this.loadSections();
            this.generateSubmissionsByStudent();
          });
        });
    }
  };

  public loadGraders = () => {
    this.setState({ gradersLoadComplete: false });
    const { currentCourse } = this.state;
    if (currentCourse) {
      // courses/id/roster . students
      fetch(`/api/courses/${currentCourse.id}/graders`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        }
      })
        .then(res => {
          return res.json();
        })
        .then(json => {
          this.setState({ graders: json, gradersLoadComplete: true }, () =>
            this.generateSubmissionsByStudent()
          );
        });
    }
  };

  public loadAdmins = () => {
    this.setState({ adminsLoadComplete: false });
    const { currentCourse } = this.state;
    if (currentCourse) {
      // courses/id/roster . students
      fetch(`/api/courses/${currentCourse.id}/courseadmins`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        }
      })
        .then(res => {
          return res.json();
        })
        .then(json =>
          this.setState({ admins: json, adminsLoadComplete: true })
        );
    }
  };

  public loadSections = () => {
    this.setState({ sectionsLoadComplete: false });
    const { currentCourse } = this.state;
    if (currentCourse) {
      fetch(`/api/courses/${currentCourse.id}/sections`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        }
      })
        .then(res => {
          return res.json();
        })
        .then(json => {
          const sections = json;
          const sectionsByStudent = {};
          // Reminder -- should we do some sort of database check to make sure students only have one section
          sections.forEach((section: ISection) => {
            const students = section.students;
            students.forEach(student => {
              if (student) {
                const username = student.profile.username;
                sectionsByStudent[username] = {
                  id: section.id,
                  name: section.name
                };
              }
            });
          });
          this.setState({
            sections: json,
            sectionsByStudent,
            sectionsLoadComplete: true
          });
        });
    }
  };

  // ------------------- Toggle data change locks  -------------------
  public toggleAssignmentLock = () => {
    this.setState({
      lockedAssignmentChange: !this.state.lockedAssignmentChange
    });
  };

  public toggleEnrollStudentsLock = () => {
    this.setState({
      Enroll_lockedStudentChange: !this.state.Enroll_lockedStudentChange
    });
  };

  public toggleAdminLock = () => {
    this.setState({
      Enroll_lockedAdminChange: !this.state.Enroll_lockedAdminChange
    });
  };

  public toggleGraderLock = () => {
    this.setState({
      Enroll_lockedGraderChange: !this.state.Enroll_lockedGraderChange
    });
  };

  public toggleSectionLock = () => {
    this.setState({
      lockedSectionChange: !this.state.lockedSectionChange
    });
  };

  // ------------------- Manage users API calls  -------------------
  public unEnrollUsers = (selectedUserEmails: string[], userType: UserEnum) => {
    const { currentCourse } = this.state;

    if (currentCourse) {
      const getData = selectedUserEmails.map(username => {
        return new Promise(resolve => {
          const payload = new URLSearchParams();
          const key1 = "email";
          payload.append(key1, username);
          fetch(`/api/courses/${currentCourse.id}/remove${userType}/`, {
            headers: {
              Authorization: `JWT ${localStorage.getItem("token")}`
            },
            method: "PATCH",
            body: payload
          })
            .then(res => {
              if (res.status === 200) {
                return res.json();
              } else {
                this.addToast("Something went wrong", undefined);
                return undefined;
              }
            })
            .then(json => {
              if (json) {
                if (userType === UserEnum.Student) {
                  const { students } = this.state;
                  const newStudents = students.filter((value, index, arr) => {
                    return value.profile.username !== username;
                  });
                  this.setState({
                    students: newStudents
                  });
                } else if (userType === UserEnum.Grader) {
                  const { graders } = this.state;
                  const newGraders = graders.filter((value, index, arr) => {
                    return value.profile.username !== username;
                  });
                  this.setState({
                    graders: newGraders
                  });
                } else if (userType === UserEnum.CourseAdmin) {
                  const { admins } = this.state;
                  const newAdmins = admins.filter((value, index, arr) => {
                    return value.profile.username !== username;
                  });
                  this.setState({
                    admins: newAdmins
                  });
                }

                return resolve(username);
              } else {
                return undefined;
              }
            });
        });
      });
      return Promise.all(getData).then(data => {
        this.addToast(
          `${data.length} ${userType}s unenrolled from course`,
          undefined
        );
        return data;
      });
    } else {
      throw true;
    }
  };

  public enrollUser = (userEmail: string, userType: UserEnum) => {
    const { currentCourse } = this.state;
    const { students, graders, admins } = this.state;
    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "email";
      const key2 = "activate";
      payload.append(key1, userEmail);
      payload.append(key2, "true");

      fetch(`/api/courses/${currentCourse.id}/enroll${userType}/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "PATCH",
        body: payload
      })
        .then(res => {
          if (res.status === 200) {
            return res.json();
          } else {
            this.addToast(
              "Something went wrong. Please ensure the email is valid.",
              undefined
            );
            return undefined;
          }
        })
        .then(json => {
          if (json) {
            if (userType === UserEnum.Student) {
              students.push(json);
              this.setState({ students });
            } else if (userType === UserEnum.Grader) {
              graders.push(json);
              this.setState({ graders });
            } else if (userType === UserEnum.CourseAdmin) {
              admins.push(json);
              this.setState({ admins });
            }
            this.addToast(
              `New ${userType} ${json.profile.username} added`,
              undefined
            );
          }
        });
    }
  };

  // ------------------- Manage sections API calls  -------------------
  public createSection = (newSection: string) => {
    const { currentCourse } = this.state;
    const { sections } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "name";
      const key2 = "course";
      payload.append(key1, newSection);
      payload.append(key2, String(currentCourse.id));

      fetch(`/api/sections/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "POST",
        body: payload
      })
        .then(res => {
          if (res.status === 201) {
            return res.json();
          } else {
            this.addToast(
              "Something went wrong. Please ensure the section name is valid.",
              undefined
            );
            return undefined;
          }
        })
        .then(json => {
          if (json) {
            json.students = [];
            sections.push(json);
            this.addToast(`New section ${json.name} created`, undefined);
            this.setState({ sections });
          }
        });
    }
  };

  public addStudentToSection = (sectionID: number, studentEmail: string) => {
    const { currentCourse } = this.state;
    const { sections, sectionsByStudent } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "email";
      const key2 = "activate";
      payload.append(key1, studentEmail);
      payload.append(key2, "true");

      fetch(`/api/sections/${sectionID}/addStudent/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "PATCH",
        body: payload
      })
        .then(res => {
          if (res.status === 200) {
            return res.json();
          } else {
            this.addToast(
              "Something went wrong. Please ensure the email is valid.",
              undefined
            );
            return undefined;
          }
        })
        .then(json => {
          if (json) {
            let name = "";
            const newSections = sections.map(section => {
              if (section.id === sectionID) {
                // Reminder--check this to make sure it works
                section.students.push(json);
                name = section.name;
                sectionsByStudent[json.profile.username] = {
                  name: section.name,
                  id: section.id
                };
              }
              return section;
            });

            this.setState({ sections: newSections, sectionsByStudent }, () =>
              this.addToast(
                `Student ${json.profile.username} added to section ${name}`,
                undefined
              )
            );
          }
        });
    }
  };

  public addLeaderToSection = (sectionID: number, leaderEmail: string) => {
    const { currentCourse } = this.state;
    const { sections } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "email";
      const key2 = "activate";
      payload.append(key1, leaderEmail);
      payload.append(key2, "true");

      fetch(`/api/sections/${sectionID}/addLeader/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "PATCH",
        body: payload
      })
        .then(res => {
          if (res.status === 200) {
            return res.json();
          } else {
            this.addToast(
              "Something went wrong. Please ensure the email is valid.",
              undefined
            );
            return undefined;
          }
        })
        .then(json => {
          if (json) {
            let name = "";
            const newSections = sections.map(section => {
              if (section.id === sectionID) {
                // Reminder-- this currently works for a single leader per section. Once we change the front end to be flexible, this needs to be uncommented
                // if (section.leader) {
                //   section.leader.push(json);
                // } else {
                section.leader = [json];
                // }
                name = section.name;
              }
              return section;
            });

            this.setState({ sections: newSections }, () =>
              this.addToast(
                `${json.profile.username} set as leader of section ${name}`,
                undefined
              )
            );
          }
        });
    }
  };

  // ------------------- Manage assignments API calls  ------------------

  public createRubricCategory = (
    assignmentID: number,
    categoryName: string,
    pointLimit: number | undefined,
    newComments: IRubricComment[]
  ) => {
    const { currentCourse, assignments } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "name";
      const key2 = "assignment";
      const key3 = "pointLimit";
      payload.append(key1, categoryName);
      payload.append(key2, String(assignmentID));
      payload.append(key3, String(pointLimit));

      fetch(`/api/rubrics/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "POST",
        body: payload
      })
        .then(res => {
          if (res.status === 201) {
            return res.json();
          } else {
            this.addToast(
              `Something went wrong when trying to update ${categoryName}`,
              undefined
            );
            return undefined;
          }
        })
        .then(json => {
          if (json) {
            assignments.forEach(assn => {
              // Add an empty set of comments to the returned category, Api only returns category ids
              const categ = json;
              categ.comments = [];
              if (assn.id === assignmentID) {
                if (assn.rubric) {
                  assn.rubric.push(categ);
                } else {
                  assn.rubric = [categ];
                }
              }
            });
            this.addToast(
              `New Rubric Category ${json.name} created`,
              undefined
            );
            const newCategoryID = json.id;
            this.setState({ assignments }, () => {
              newComments.forEach(comment =>
                this.createRubricComment(
                  assignmentID,
                  newCategoryID,
                  comment.text,
                  comment.pointDelta
                )
              );
            });
          }
        });
    }
  };

  public deleteRubricCategory = (
    assignmentID: number,
    categoryID: number,
    categoryName: string
  ) => {
    // Reminder - remove the category from the current rubric
    const { currentCourse, assignments } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "id";
      payload.append(key1, String(categoryID));

      fetch(`/api/courses/${currentCourse.id}/deleteRubricCategory/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "PATCH",
        body: payload
      }).then(res => {
        if (res.status === 204) {
          this.addToast(`Category ${categoryName} deleted`, undefined);
          assignments.forEach(assn => {
            // Add an empty set of comments to the returned category, Api only returns category ids
            if (assn.id === assignmentID && assn.rubric) {
              assn.rubric = assn.rubric.filter(cat => cat.id !== categoryID);
            }
          });
          this.setState({ assignments });
        } else {
          this.addToast(
            `Something went wrong when trying to delete ${categoryName}`,
            undefined
          );
        }
      });
    }
  };

  public updateRubricCategory = (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    categoryPointLimit: number | undefined
  ) => {
    // Reminder - remove the category from the current rubric
    const { currentCourse, assignments } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "id";
      const key2 = "text";
      const key3 = "pointDelta";
      payload.append(key1, String(categoryID));
      payload.append(key2, categoryName);
      payload.append(key3, String(categoryPointLimit));

      fetch(`/api/courses/${currentCourse.id}/updateRubricCategory/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "PATCH",
        body: payload
      })
        .then(res => {
          if (res.status === 200) {
            return res.json();
          } else {
            this.addToast(
              `Something went wrong when trying to update ${categoryName}.`,
              undefined
            );
            return undefined;
          }
        })
        .then(json => {
          if (json) {
            assignments.forEach(assn => {
              // Add an empty set of comments to the returned category, Api only returns category ids
              if (assn.id === assignmentID && assn.rubric) {
                const catIndex = assn.rubric.map(i => i.id).indexOf(categoryID);
                if (catIndex !== -1) {
                  assn.rubric[catIndex].name = json.name;
                  assn.rubric[catIndex].pointLimit = json.pointLimit;
                }
              }
            });
            this.setState({ assignments });
          }
        });
    }
  };

  public createRubricComment = (
    assignmentID: number,
    categoryID: number,
    commentText: string,
    commentDelta: number
  ) => {
    const { currentCourse, assignments } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "text";
      const key2 = "category";
      const key3 = "pointDelta";
      payload.append(key1, commentText);
      payload.append(key2, String(categoryID));
      payload.append(key3, String(commentDelta));

      fetch(`/api/rubricComments/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "POST",
        body: payload
      })
        .then(res => {
          if (res.status === 201) {
            return res.json();
          } else {
            this.addToast("Something went wrong.", undefined);
            return undefined;
          }
        })
        .then(json => {
          if (json) {
            assignments.forEach(assn => {
              // Add an empty set of comments to the returned category, Api only returns category ids
              if (assn.id === assignmentID && assn.rubric) {
                const index = assn.rubric.map(i => i.id).indexOf(categoryID);
                if (index !== -1) {
                  assn.rubric[index].comments.push(json);
                  if (assn.rubric[index].rubricComments) {
                    assn.rubric[index].rubricComments.push(json.id);
                  } else {
                    assn.rubric[index].rubricComments = [json.id];
                  }
                }
              }
            });
            this.setState({ assignments });
          }
        });
    }
  };

  public deleteRubricComment = (
    assignmentID: number,
    categoryID: number,
    commentID: number
  ) => {
    const { currentCourse, assignments } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "id";
      payload.append(key1, String(commentID));

      fetch(`/api/courses/${currentCourse.id}/deleteRubricComment/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "PATCH",
        body: payload
      }).then(res => {
        if (res.status === 204) {
          assignments.forEach(assn => {
            if (assn.id === assignmentID && assn.rubric) {
              const catIndex = assn.rubric.map(i => i.id).indexOf(categoryID);
              if (catIndex !== -1) {
                assn.rubric[catIndex].comments = assn.rubric[
                  catIndex
                ].comments.filter(com => com.id !== commentID);
              }
            }
          });
          this.setState({ assignments });
        } else {
          this.addToast(`Something went wrong.`, undefined);
        }
      });
    }
  };

  public updateRubricComment = (
    assignmentID: number,
    categoryID: number,
    commentID: number,
    commentText: string,
    commentDelta: number
  ) => {
    const { currentCourse, assignments } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "id";
      const key2 = "text";
      const key3 = "pointDelta";
      payload.append(key1, String(commentID));
      payload.append(key2, commentText);
      payload.append(key3, String(commentDelta));

      fetch(`/api/courses/${currentCourse.id}/updateRubricComment/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "PATCH",
        body: payload
      })
        .then(res => {
          if (res.status === 200) {
            return res.json();
          } else {
            this.addToast("Something went wrong.", undefined);
            return undefined;
          }
        })
        .then(json => {
          if (json) {
            assignments.forEach(assn => {
              // Add an empty set of comments to the returned category, Api only returns category ids
              if (assn.id === assignmentID && assn.rubric) {
                const catIndex = assn.rubric.map(i => i.id).indexOf(categoryID);
                if (catIndex !== -1) {
                  const comIndex = assn.rubric[catIndex].comments
                    .map(i => i.id)
                    .indexOf(commentID);
                  if (comIndex !== -1) {
                    assn.rubric[catIndex].comments[comIndex] = json;
                  }
                }
              }
            });
            this.setState({ assignments });
          }
        });
    }
  };

  public updateAssignment = (
    assignmentID: number,
    name: string,
    points: number
  ) => {
    // Reminder - remove the category from the current rubric
    const { currentCourse, assignments } = this.state;

    if (currentCourse) {
      const payload = new URLSearchParams();
      const key1 = "id";
      const key2 = "text";
      const key3 = "pointDelta";
      payload.append(key1, String(assignmentID));
      payload.append(key2, name);
      payload.append(key3, String(points));

      fetch(`/api/courses/${currentCourse.id}/updateAssignment/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("token")}`
        },
        method: "PATCH",
        body: payload
      })
        .then(res => {
          if (res.status === 200) {
            return res.json();
          } else {
            this.addToast(
              "Something went wrong when trying to update assignment",
              undefined
            );
            return undefined;
          }
        })
        .then(json => {
          if (json) {
            assignments.forEach(assn => {
              // Add an empty set of comments to the returned category, Api only returns category ids
              if (assn.id === assignmentID && assn.rubric) {
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
            assignments={currentCourse.assignments}
            students={this.state.students}
            studentsLoadComplete={this.state.studentsLoadComplete}
            graders={this.state.graders}
            gradersLoadComplete={this.state.gradersLoadComplete}
            submissionsByStudentLoadComplete={
              this.state.submissionsByStudentLoadComplete
            }
            submissionsByAssignment={this.state.submissionsByAssignment}
            submissionsByAssignmentLoadComplete={
              this.state.submissionsByAssignmentLoadComplete
            }
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
            submissionsByAssignment={this.state.submissionsByAssignment}
            submissionsByAssignmentLoadComplete={
              this.state.submissionsByAssignmentLoadComplete
            }
            lockedAssignmentChange={this.state.lockedAssignmentChange}
            toggleLock={this.toggleAssignmentLock}
            currentCourse={this.state.currentCourse}
            addToast={this.addToast}
            assignments={this.state.assignments}
            assignmentRubricLoadComplete={
              this.state.assignmentRubricLoadComplete
            }
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
            autohideTimeout={1000}
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
            lockedStudentChange={this.state.Enroll_lockedStudentChange}
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
            lockedGraderChange={this.state.Enroll_lockedGraderChange}
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
            lockedSectionChange={this.state.lockedSectionChange}
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
            lockedAdminChange={this.state.Enroll_lockedAdminChange}
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
