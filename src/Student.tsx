import * as React from 'react';
import { Redirect } from 'react-router-dom';

import CodeViewer from './components/student/CodeViewer';
import VerticalPane from './components/VerticalPane';

import './styles/Student.scss';

import {
  IAssignment,
  IComment,
  ICommentToRubricCommentMap,
  ICourse,
  ICourseToAssignmentMap,
  IFile,
  IFileToCommentsMap,
  IOption,
  ISubmission,
  USER_APP,
} from './types/common';

import APIUtils from './APIUtils';

interface IStudentState {
  courses: ICourse[];
  assignments: ICourseToAssignmentMap;
  files: IFile[];
  comments: IFileToCommentsMap;
  rubricComments: ICommentToRubricCommentMap;

  currentCourse?: ICourse;
  currentAssignment?: IAssignment;
  currentSubmission?: ISubmission;

  email: string;
  isLoggedIn: boolean;
  redirect: boolean;

  // Loading variables
  isLoadingCourses: boolean;
  isLoadingAssignments: boolean;
  isLoadingSubmission: boolean;

  // URL variables
  toLoadCourse: boolean;
  toLoadAssignment: boolean;

  // Testing
}

interface IStudentProps {
  match: any;
  history: any;
}

class Student extends React.Component<IStudentProps, IStudentState> {
  public state: Readonly<IStudentState> = {
    assignments: {},
    comments: {},
    courses: [],
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSubmission: undefined,
    email: '',
    files: [],
    isLoadingCourses: true,
    isLoadingAssignments: true,
    isLoadingSubmission: false,
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
    rubricComments: {},
    toLoadCourse: false,
    toLoadAssignment: false,
  };

  public componentDidMount() {
    // Should kick user back to login screne if they are not logged in
    // Should use props to pass studentID here from top-level app...
    // ...annoying that typescript doesn't allow usage of lambdas
    // in render prop of Route object (which is designed to handle
    // lambdas efficiently)
    if (this.state.isLoggedIn) {
      this.loadCourses();
    } else {
      this.setState({ redirect: true });
    }
  }

  // Used to fire this.setStateFromURL, which can only be done when courses and assignments are done loading
  public componentDidUpdate(prevProps: IStudentProps, prevState: IStudentState) {
    const { isLoadingAssignments, assignments, courses } = this.state;

    // Determine if assignments are done loading
    if (courses && assignments && prevState.assignments !== assignments) {
      const targetEntries = courses.reduce((acc, course) => acc + course.assignments.length, 0);
      const currEntries = Object.keys(assignments).reduce((acc, key) => acc + assignments[key].length, 0);
      if (targetEntries === currEntries) {
        this.setState({ isLoadingAssignments: false });
      }
    }

    // After loading necessary resources, set state from URL
    if (prevState.isLoadingAssignments && !isLoadingAssignments) {
      this.setStateFromURL();
    }

    if (this.state.toLoadCourse || this.state.toLoadAssignment) {
      this.setState({ toLoadCourse: false, toLoadAssignment: false });
    }
  }

  ///////////////////////////////////////
  // URL handler methods
  ///////////////////////////////////////

  public setStateFromURL = () => {
    const { courseName, period, assignmentName } = this.props.match.params;
    const { courses, assignments } = this.state;

    // Test whether (courseName, period) corresponds to loaded course
    let currentCourse;
    let currentAssignment;
    if (courseName && period) {
      const formattedCourseName = courseName.replace(/_/g, ' ');
      const formattedPeriod = period.replace(/_/g, ' ');
      currentCourse = courses.find((obj: ICourse) => {
        return obj.name === formattedCourseName && obj.period === formattedPeriod;
      });

      // Given (courseName, period), test whether assignmentName corresponds to loaded assignment
      if (currentCourse && assignmentName) {
        const formattedAssignmentName = assignmentName.replace(/_/g, ' ');
        currentAssignment = assignments[currentCourse.id].find((obj: IAssignment) => {
          return obj.name === formattedAssignmentName;
        });
      }
    }

    this.setState({ currentCourse, currentAssignment });
  };

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadCourses = () => {
    return APIUtils.fetchUser(USER_APP.Student).then(([email, courses]) => {
      this.setState({ email, courses, isLoadingCourses: false });
      return Promise.all(
        courses.map((course: ICourse) => {
          return this.loadAssignments(course);
        }),
      );
    });
  };

  public loadAssignments = (course: ICourse) => {
    return Promise.all(
      course.assignments.map((assignmentId: number) => {
        return APIUtils.fetchAssignment(assignmentId).then((assignment) => {
          let assignments = [assignment];
          if (this.state.assignments[course.id]) {
            assignments = [...this.state.assignments[course.id], assignment];
          }
          this.setState({
            assignments: {
              ...this.state.assignments,
              [course.id]: assignments,
            },
          });
        });
      }),
    );
  };

  public loadSubmission = (assignment: IAssignment) => {
    if (!assignment.isReleased) {
      this.setState({ currentSubmission: undefined });
      return Promise.resolve(); // empty Promise
    }

    return APIUtils.fetchSubmissions(assignment.id, USER_APP.Student, this.state.email).then((currentSubmission) => {
      return this.loadFiles(currentSubmission).then(() => {
        this.setState({ currentSubmission });
      });
    });
  };

  public loadFiles = (submission: ISubmission) => {
    return Promise.all(
      submission.files.map((fileId: number) => {
        return APIUtils.fetchFile(fileId).then((file: IFile) => {
          this.setState({
            comments: {
              ...this.state.comments,
              [file.id]: [],
            },
          });
          return this.loadComments(file).then(() => {
            this.setState({ files: [...this.state.files, file] });
          });
        });
      }),
    );
  };

  public loadComments = (file: IFile) => {
    return Promise.all(
      file.comments.map((commentId: number) => {
        return APIUtils.fetchComment(commentId).then((comment: IComment) => {
          const comments = [...this.state.comments[file.id], comment];
          this.setState({
            comments: {
              ...this.state.comments,
              [file.id]: comments,
            },
          });
          if (comment.rubricComment) {
            return APIUtils.fetchRubricComment(comment.rubricComment).then((rubricComment) => {
              this.setState({
                rubricComments: {
                  ...this.state.rubricComments,
                  [comment.id]: rubricComment,
                },
              });
            });
          }
          return;
        });
      }),
    );
  };

  ///////////////////////////////////////
  // Handlers
  ///////////////////////////////////////

  public handleAssignmentChange = (option: IOption, event: any) => {
    const { assignments, currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    const currentAssignment = assignments[currentCourse.id].filter((obj: IAssignment) => {
      return obj.id === option.value;
    })[0];

    if (currentAssignment) {
      // Need to test these callbacks to avoid first setState following completion
      this.setState({ isLoadingSubmission: true }, () => {
        this.loadSubmission(currentAssignment).then(() => {
          this.setState({ currentAssignment, toLoadAssignment: true, isLoadingSubmission: false });
        });
      });
    }
  };

  public handleCourseChange = (option: IOption) => {
    const currentCourse = this.state.courses.filter((obj: ICourse) => {
      return obj.id === option.value;
    })[0];

    this.setState({
      currentAssignment: undefined,
      currentCourse,
      currentSubmission: undefined,
      toLoadCourse: true,
    });
  };

  public selectorItemsFormatter = (courses: ICourse[]) => {
    return courses.map((course, i) => ({ value: course.id, label: `${course.name} | ${course.period}` }));
  };

  public selectorCurrentFormatter = (currentCourse: ICourse | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return { value: currentCourse.id, label: `${currentCourse.name} | ${currentCourse.period}` };
  };

  public tabItemsFormatter = (currentCourse: ICourse | undefined) => {
    const { assignments, isLoadingCourses } = this.state;
    if (!currentCourse || isLoadingCourses) {
      return [];
    }

    return assignments[currentCourse.id].map((assignment, i) => ({
      label: assignment.name,
      value: assignment.id,
    }));
  };

  public tabCurrentFormatter = (currentAssignment: IAssignment | undefined) => {
    if (!currentAssignment) {
      return undefined;
    }
    return { value: currentAssignment.id, label: currentAssignment.name };
  };

  ///////////////////////////////////////
  // Main
  ///////////////////////////////////////

  public renderRedirect = () => {
    if (this.state.redirect) {
      return <Redirect to="/" />;
    }
    return;
  };

  public render() {
    const {
      courses,
      currentAssignment,
      currentCourse,
      currentSubmission,
      isLoadingCourses,
      files,
      comments,
      rubricComments,
      toLoadCourse,
      toLoadAssignment,
    } = this.state;

    if (toLoadCourse || toLoadAssignment) {
      if (currentCourse) {
        const formattedCourseName = currentCourse.name.replace(/ /g, '_');
        const formattedPeriod = currentCourse.period.replace(/ /g, '_');
        if (toLoadAssignment && currentAssignment) {
          const formattedAssignmentName = currentAssignment.name.replace(/ /g, '_');
          return <Redirect to={`/student/${formattedCourseName}/${formattedPeriod}/${formattedAssignmentName}`} />;
        } else {
          return <Redirect to={`/student/${formattedCourseName}/${formattedPeriod}/`} />;
        }
      } else {
        return <Redirect to={'/student'} />;
      }
    }

    return (
      <div>
        {this.renderRedirect()}
        <div className="container-main">
          <VerticalPane
            currentTab={this.tabCurrentFormatter(currentAssignment)}
            currentSelector={this.selectorCurrentFormatter(currentCourse)}
            selectorItems={this.selectorItemsFormatter(courses)}
            tabItems={this.tabItemsFormatter(currentCourse)}
            handleTabChange={this.handleAssignmentChange}
            handleSelectorChange={this.handleCourseChange}
            isLoading={isLoadingCourses}
          />
          <ContentArea
            assignment={currentAssignment}
            submission={currentSubmission}
            files={files}
            comments={comments}
            rubricComments={rubricComments}
          />
        </div>
      </div>
    );
  }
}

interface IContentAreaProps {
  assignment?: IAssignment;
  submission?: ISubmission;
  files: IFile[];
  comments: IFileToCommentsMap;
  rubricComments: ICommentToRubricCommentMap;
}

const ContentArea = (props: IContentAreaProps) => {
  const { assignment, submission, files, comments, rubricComments } = props;

  if (submission && assignment) {
    return (
      <CodeViewer
        submission={submission!}
        assignment={assignment!}
        files={files}
        comments={comments}
        rubricComments={rubricComments}
      />
    );
  }
  if (assignment) {
    return <div className="container-code-viewer">Your {assignment.name} has not yet been graded.</div>;
  }
  return <div className="container-code-viewer">Select an assignment on the left!</div>;
};

export default Student;
