import * as React from 'react';
import { Redirect } from 'react-router-dom';

import { CodePanel, makeReadOnly } from './components/CodePanel';

import VerticalPane from './components/VerticalPane';

import { ICommentToRubricCommentMap, ICourseToAssignmentMap, IFileToCommentsMap, IOption } from './types/common';

import { Assignment, AssignmentType } from './infrastructure/assignment';
import { CommentIO, CommentType } from './infrastructure/comment';
import { CourseType } from './infrastructure/course';
import { File, FileType } from './infrastructure/file';
import { RubricComment } from './infrastructure/rubricComment';
import { SubmissionType } from './infrastructure/submission';

interface IStudentState {
  courses: CourseType[];
  assignments: ICourseToAssignmentMap;
  files: FileType[];
  comments: IFileToCommentsMap;
  rubricComments: ICommentToRubricCommentMap;

  currentCourse?: CourseType;
  currentAssignment?: AssignmentType;
  currentSubmission?: SubmissionType;

  isLoggedIn: boolean;
  redirect: boolean;

  // Loading variables
  isLoadingAssignments: boolean;
  isLoadingSubmission: boolean;

  // URL variables
  toLoadCourse: boolean;
  toLoadAssignment: boolean;
}

interface IStudentProps {
  initialCourses: CourseType[];
  email: string;
  match: any;
  history: any;
}

class Student extends React.Component<IStudentProps, IStudentState> {
  public state: Readonly<IStudentState> = {
    assignments: {},
    comments: {},
    courses: this.props.initialCourses,
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSubmission: undefined,
    files: [],
    isLoadingAssignments: true,
    isLoadingSubmission: false,
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
    rubricComments: {},
    toLoadCourse: false,
    toLoadAssignment: false,
  };

  public componentDidMount() {
    this.loadAllAssignments();
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
    let currentCourse: any;
    let currentAssignment: any;
    if (courseName && period) {
      const formattedCourseName = courseName.replace(/_/g, ' ');
      const formattedPeriod = period.replace(/_/g, ' ');
      currentCourse = courses.find((obj: CourseType) => {
        return obj.name === formattedCourseName && obj.period === formattedPeriod;
      });

      // Given (courseName, period), test whether assignmentName corresponds to loaded assignment
      if (currentCourse && assignmentName) {
        const formattedAssignmentName = assignmentName.replace(/_/g, ' ');
        currentAssignment = assignments[currentCourse.id].find((obj: AssignmentType) => {
          return obj.name === formattedAssignmentName;
        });

        this.setState({ isLoadingSubmission: true });
        this.loadSubmission(currentAssignment).then(() => {
          this.setState({ currentCourse, currentAssignment, isLoadingSubmission: false });
        });
      }
    }

    this.setState({ currentCourse, currentAssignment });
  };

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadAllAssignments = () => {
    const courses = this.state.courses;
    return Promise.all(
      courses.map((course: CourseType) => {
        return this.loadAssignments(course);
      }),
    );
  };

  public loadAssignments = (course: CourseType) => {
    return Promise.all(
      course.assignments.map((assignmentId: number) => {
        return Assignment.read(assignmentId).then((assignment) => {
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

  public loadSubmission = (assignment: AssignmentType) => {
    if (!assignment.isReleased) {
      this.setState({ currentSubmission: undefined });
      return Promise.resolve(); // empty Promise
    }

    return Assignment.readSubmissions(assignment.id, { student: this.props.email }).then((subs) => {
      if (subs.length === 0) {
        this.setState({ currentSubmission: undefined });
        return Promise.resolve(); // empty Promise
      } else {
        const currentSubmission = subs[0];
        return this.loadFiles(currentSubmission).then(() => {
          this.setState({ currentSubmission });
        });
      }
    });
  };

  public loadFiles = (submission: SubmissionType) => {
    return Promise.all(
      submission.files.map((fileId: number) => {
        return File.read(fileId).then((file: FileType) => {
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

  public loadComments = (file: FileType) => {
    return Promise.all(
      file.comments.map((commentId: number) => {
        return CommentIO.read(commentId).then((comment: CommentType) => {
          const comments = [...this.state.comments[file.id], comment];
          this.setState({
            comments: {
              ...this.state.comments,
              [file.id]: comments,
            },
          });
          if (comment.rubricComment) {
            return RubricComment.read(comment.rubricComment).then((rubricComment) => {
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

    const currentAssignment = assignments[currentCourse.id].filter((obj: AssignmentType) => {
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
    const currentCourse = this.state.courses.filter((obj: CourseType) => {
      return obj.id === option.value;
    })[0];

    this.setState({
      currentAssignment: undefined,
      currentCourse,
      currentSubmission: undefined,
      toLoadCourse: true,
    });
  };

  public selectorItemsFormatter = (courses: CourseType[]) => {
    return courses.map((course, i) => ({ value: course.id, label: `${course.name} | ${course.period}` }));
  };

  public selectorCurrentFormatter = (currentCourse: CourseType | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return { value: currentCourse.id, label: `${currentCourse.name} | ${currentCourse.period}` };
  };

  public tabItemsFormatter = (currentCourse: CourseType | undefined) => {
    const { assignments } = this.state;
    if (!currentCourse || !currentCourse.assignments || !assignments[currentCourse.id]) {
      return [];
    }

    return assignments[currentCourse.id].map((assignment, i) => ({
      label: assignment.name,
      value: assignment.id,
    }));
  };

  public tabCurrentFormatter = (currentAssignment: AssignmentType | undefined) => {
    if (!currentAssignment) {
      return undefined;
    }
    return { value: currentAssignment.id, label: currentAssignment.name };
  };

  ///////////////////////////////////////
  // Main
  ///////////////////////////////////////

  public render() {
    const {
      courses,
      currentAssignment,
      currentCourse,
      currentSubmission,
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

    const ReadOnlyCodePanel = makeReadOnly(CodePanel);

    let contentArea;
    if (currentSubmission && currentAssignment) {
      contentArea = (
        <div>
          <div className="student__grade">{`Grade: ${currentSubmission!.grade}/${currentAssignment!.points}`}</div>
          <ReadOnlyCodePanel
            submission={currentSubmission!}
            assignment={currentAssignment!}
            files={files}
            comments={comments}
            rubricComments={rubricComments}
          />
        </div>
      );
    } else if (currentAssignment && this.state.isLoadingSubmission) {
      contentArea = <div>Loading...</div>;
    } else if (currentAssignment) {
      contentArea = <div>Your {currentAssignment.name} has not yet been graded.</div>;
    } else {
      contentArea = <div>Select an assignment on the left!</div>;
    }

    console.log(contentArea.props);

    return (
      <div className="student">
        <div className="student__left-panel">
          <VerticalPane
            currentTab={this.tabCurrentFormatter(currentAssignment)}
            currentSelector={this.selectorCurrentFormatter(currentCourse)}
            selectorItems={this.selectorItemsFormatter(courses)}
            tabItems={this.tabItemsFormatter(currentCourse)}
            handleTabChange={this.handleAssignmentChange}
            handleSelectorChange={this.handleCourseChange}
          />
        </div>
        <div className="student__right-panel">{contentArea}</div>
      </div>
    );
  }
}

export default Student;
