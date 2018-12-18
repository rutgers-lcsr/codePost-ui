import * as React from 'react';
import { Redirect } from 'react-router-dom';

import CodeViewer from './components/student/CodeViewer';
import VerticalPane from './components/VerticalPane';

import './styles/Student.scss';

import { IAssignment, IComment, ICourse2, IFile2, IOption, ISubmission2 } from './types/common';

interface ICourseToAssignmentMap {
  [courseId: number]: IAssignment[];
}

interface IFileToCommentsMap {
  [fileId: number]: IComment[];
}

interface IStudentState {
  currentAssignment?: IAssignment;
  currentCourse?: ICourse2;
  currentSubmission?: ISubmission2;
  email: string;
  isLoading: boolean;
  isLoadingSubmission: boolean;
  isLoggedIn: boolean;
  redirect: boolean;
  courses: ICourse2[];
  assignments: ICourseToAssignmentMap;
  files: IFile2[];
  comments: IFileToCommentsMap;
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
    return this.fetchCourses().then((courses) => {
      this.setState({ courses });
      return Promise.all(
        courses.map((course: ICourse2) => {
          return this.loadAssignments(course);
        }),
      );
    });
  };

  public loadAssignments = (course: ICourse2) => {
    return Promise.all(
      course.assignments.map((assignmentId: number) => {
        return this.fetchAssignment(assignmentId).then((assignment) => {
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

    return this.fetchSubmission(assignment.id).then((submission) => {
      return this.loadFiles(submission).then(() => {
        console.log('saving submission: ', submission);
        this.setState({ currentSubmission: submission });
      });
    });
  };

  public loadFiles = (submission: ISubmission2) => {
    return Promise.all(
      submission.files.map((fileId: number) => {
        return this.fetchFile(fileId).then((file: IFile2) => {
          return this.loadComments(file).then(() => {
            console.log('saving file:', file);
            this.setState({ files: [...this.state.files, file] });
          });
        });
      }),
    );
  };

  public loadComments = (file: IFile2) => {
    return Promise.all(
      file.comments.map((commentId: number) => {
        return this.fetchComment(commentId).then((comment: IComment) => {
          console.log('saving comment:', comment);
          let comments = [comment];
          if (this.state.comments[file.id]) {
            comments = [...this.state.comments[file.id], comment];
          }
          this.setState({
            comments: {
              ...this.state.comments,
              [file.id]: comments,
            },
          });
        });
      }),
    );
  };

  ///////////////////////////////////////
  // Fetch requests
  ///////////////////////////////////////

  public fetchCourses = () => {
    return fetch('/api/users/me/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        this.setState({ email: json.email });
        const studentCourses = 'studentCourses';
        return json[studentCourses];
      });
  };

  public fetchAssignment = (assignmentId: number) => {
    return fetch(`/api/assignments/${assignmentId}/`, {
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
  };

  public fetchSubmission = (id: string | number) => {
    return fetch(`/api/assignments/${id}/submissions/?student=${this.state.email}`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        if (json.length > 0 && json[0].isFinalized) {
          return json[0];
        }
        // should not happen, should be an error
        // right now just avoiding the null check in loadSubmissions
        return json[0];
      });
  };

  public fetchFile = (id: string | number) => {
    return fetch(`/api/files/${id}/`, {
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
  };

  public fetchComment = (id: number) => {
    return fetch(`/api/comments/${id}/`, {
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
  };

  ///////////////////////////////////////
  // Handlers
  ///////////////////////////////////////

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
          console.log('save assignment', currentAssignment);
          console.log('all done');
        })
        .then(() => {
          this.setState({ isLoadingSubmission: false });
        });
    }
  };

  public handleCourseChange = (option: IOption) => {
    const currentCourse = this.state.courses.filter((obj: ICourse2) => {
      return obj.id === option.value;
    })[0];

    this.setState({
      currentAssignment: undefined,
      currentCourse,
      currentSubmission: undefined,
    });
  };

  public selectorItemsFormatter = (courses: ICourse2[]) => {
    return courses.map((course, i) => ({ value: course.id, label: course.name }));
  };

  public selectorCurrentFormatter = (currentCourse: ICourse2 | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return { value: currentCourse.id, label: currentCourse.name };
  };

  public tabItemsFormatter = (currentCourse: ICourse2 | undefined) => {
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
    const {
      courses,
      currentAssignment,
      currentCourse,
      currentSubmission,
      isLoading,
      files,
      comments,
    } = this.state;
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
          />
        </div>
      </div>
    );
  }
}

interface IContentAreaProps {
  assignment?: IAssignment;
  submission?: ISubmission2;
  files: IFile2[];
  comments: IFileToCommentsMap;
}

const ContentArea = (props: IContentAreaProps) => {
  const { assignment, submission, files, comments } = props;

  const getDeductions = () => {
    const deductions = [];
    for (const fileId in comments) {
      if (comments.hasOwnProperty(fileId)) {
        let totalDeduction = 0;
        for (const comment of comments[fileId]) {
          // this is bullshit
          // cleaning it up later
          if (typeof comment.pointDelta === 'number') {
            totalDeduction += comment.pointDelta ? comment.pointDelta : 0;
          } else {
            totalDeduction += comment.pointDelta ? parseInt(comment.pointDelta, 10) : 0;
          }
        }
        deductions.push(totalDeduction);
      }
    }
    return deductions;
  };

  if (submission && assignment) {
    const deductions = getDeductions();
    return (
      <CodeViewer
        deductions={deductions}
        submission={submission!}
        assignment={assignment!}
        files={files}
        comments={comments}
      />
    );
  }
  if (assignment) {
    return (
      <div className="container-code-viewer">Your {assignment.name} has not yet been graded.</div>
    );
  }
  return <div className="container-code-viewer">Select an assignment on the left!</div>;
};

export default Student;
