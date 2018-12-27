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
  isLoading: boolean;
  isLoadingSubmission: boolean;
  isLoggedIn: boolean;
  redirect: boolean;
}

class Student extends React.Component<{}, IStudentState> {
  public state: Readonly<IStudentState> = {
    assignments: {},
    comments: {},
    courses: [],
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSubmission: undefined,
    email: '',
    files: [],
    isLoading: true,
    isLoadingSubmission: false,
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
    rubricComments: {},
  };

  public componentDidMount() {
    // Should kick user back to login screne if they are not logged in
    // Should use props to pass studentID here from top-level app...
    // ...annoying that typescript doesn't allow usage of lambdas
    // in render prop of Route object (which is designed to handle
    // lambdas efficiently)
    if (this.state.isLoggedIn) {
      this.setState({ isLoading: true });
      this.loadCourses().then(() => {
        this.setState({ isLoading: false });
      });
    } else {
      this.setState({ redirect: true });
    }
  }

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadCourses = () => {
    return APIUtils.fetchUser(USER_APP.Student).then(([email, courses]) => {
      this.setState({ email, courses });
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
        console.log('3 - saving submission: ', currentSubmission);
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
            console.log('2 - saving file:', file);
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
          console.log('1 - saving comment:', comment);
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

  public getRubricCommentText = (commentID: number): string => {
    const { rubricComments } = this.state;

    if (rubricComments[commentID]) {
      return rubricComments[commentID].text;
    }
    return '';
  };

  public handleAssignmentChange = (option: IOption, event: any) => {
    const { assignments, currentCourse } = this.state;

    this.setState({ isLoadingSubmission: true });

    if (!currentCourse) {
      return;
    }

    const currentAssignment = assignments[currentCourse.id].filter((obj: IAssignment) => {
      return obj.id === option.value;
    })[0];

    if (currentAssignment) {
      this.loadSubmission(currentAssignment)
        .then(() => {
          this.setState({ currentAssignment });
          console.log('4 - saving assignment', currentAssignment);
          console.log('~fin~');
        })
        .then(() => {
          this.setState({ isLoadingSubmission: false });
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
    });
  };

  public selectorItemsFormatter = (courses: ICourse[]) => {
    return courses.map((course, i) => ({ value: course.id, label: course.name }));
  };

  public selectorCurrentFormatter = (currentCourse: ICourse | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return { value: currentCourse.id, label: currentCourse.name };
  };

  public tabItemsFormatter = (currentCourse: ICourse | undefined) => {
    const { assignments } = this.state;
    if (!currentCourse) {
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
    const { courses, currentAssignment, currentCourse, currentSubmission, isLoading, files, comments } = this.state;
    console.log(this.state.rubricComments);
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
            isLoading={isLoading}
          />
          <ContentArea
            assignment={currentAssignment}
            submission={currentSubmission}
            files={files}
            comments={comments}
            getRubricCommentText={this.getRubricCommentText}
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
  getRubricCommentText: (commentID: number) => string;
}

const ContentArea = (props: IContentAreaProps) => {
  const { assignment, submission, files, comments, getRubricCommentText } = props;

  if (submission && assignment) {
    return (
      <CodeViewer
        submission={submission!}
        assignment={assignment!}
        files={files}
        comments={comments}
        getRubricCommentText={getRubricCommentText}
      />
    );
  }
  if (assignment) {
    return <div className="container-code-viewer">Your {assignment.name} has not yet been graded.</div>;
  }
  return <div className="container-code-viewer">Select an assignment on the left!</div>;
};

export default Student;
