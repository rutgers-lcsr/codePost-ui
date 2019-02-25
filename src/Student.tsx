import * as React from 'react';
import { Redirect } from 'react-router-dom';

import { CodePanel, makeReadOnly } from './components/CodePanel';

import VerticalPane from './components/VerticalPane';

import { CircularProgress, Snackbar } from 'react-md';

import {
  ICommentToRubricCommentMap,
  ICourseToAssignmentMap,
  IFileToCommentsMap,
  IOption,
  IToast,
} from './types/common';

import { Assignment, AssignmentType, sortAssignments } from './infrastructure/assignment';
import { CommentIO, CommentType } from './infrastructure/comment';
import { CourseType } from './infrastructure/course';
import { File, FileType } from './infrastructure/file';
import { RubricCategory, RubricCategoryType } from './infrastructure/rubricCategory';
import { RubricComment } from './infrastructure/rubricComment';
import { SubmissionStatusType } from './infrastructure/submission';

interface IStudentState {
  courses: CourseType[];
  assignments: ICourseToAssignmentMap;
  files: FileType[];
  comments: IFileToCommentsMap;
  rubricComments: ICommentToRubricCommentMap;
  rubricCategories: RubricCategoryType[];

  currentCourse?: CourseType;
  currentAssignment?: AssignmentType;
  currentSubmission?: SubmissionStatusType;

  isLoggedIn: boolean;
  redirect: boolean;

  // Loading variables
  isLoadingAssignments: boolean;
  isLoadingSubmission: boolean;

  // URL variables
  toLoadCourse: boolean;
  toLoadAssignment: boolean;

  errorToasts: IToast[];
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
    rubricCategories: [],
    rubricComments: {},
    toLoadCourse: false,
    toLoadAssignment: false,
    errorToasts: [],
  };

  public componentDidMount() {
    this.loadAllAssignments().then(() => {
      const sortedAssignmentMap = {};
      Object.keys(this.state.assignments).forEach((courseID) => {
        const sortedAssignments: AssignmentType[] = sortAssignments(this.state.assignments[courseID]);
        sortedAssignmentMap[courseID] = sortedAssignments;
      });
      this.setState({ assignments: sortedAssignmentMap });
    });
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

  // ------------------- Toast functions -------------------
  public addErrorToast = (text: string, action: string | undefined) => {
    const errorToasts = this.state.errorToasts.slice();
    errorToasts.push({ text, action });
    this.setState({ errorToasts });
  };

  public dismissErrorToast = () => {
    const [, ...errorToasts] = this.state.errorToasts;
    this.setState({ errorToasts });
  };

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

        this.loadRubricCategories(currentAssignment).then(() => {
          this.loadSubmission(currentAssignment).then(() => {
            this.setState({ currentCourse, currentAssignment, isLoadingSubmission: false });
          });
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
        return Assignment.read(assignmentId)
          .then((assignment) => {
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
          })
          .catch((errors) => {
            return;
          });
      }),
    );
  };

  public loadSubmission = (assignment: AssignmentType) => {
    if (!assignment.isReleased) {
      this.setState({ currentSubmission: undefined });
      return Promise.resolve(); // empty Promise
    }

    this.setState({ files: [] });

    return Assignment.readSubmissionsStudent(assignment.id, { student: this.props.email })
      .then((subs) => {
        if (subs.length === 0) {
          this.setState({ currentSubmission: undefined });
          this.addErrorToast('No submission found.', undefined);
          return Promise.resolve(); // empty Promise
        } else {
          const currentSubmission = subs[0];
          return this.loadFiles(currentSubmission).then(() => {
            this.setState({ currentSubmission });
          });
        }
      })
      .catch((errors) => {
        this.setState({ currentSubmission: undefined });
        this.addErrorToast(errors, undefined);
      });
  };

  public loadRubricCategories = (assignment: AssignmentType) => {
    const loadedRubricCategories: RubricCategoryType[] = [];
    return Promise.all(
      assignment.rubricCategories.map((rubricCategoryID: number) => {
        return RubricCategory.read(rubricCategoryID).then((rubricCategory: RubricCategoryType) => {
          loadedRubricCategories.push(rubricCategory);
          return;
        });
      }),
    ).then(() => {
      this.setState({ rubricCategories: loadedRubricCategories });
      return;
    });
  };

  public loadFiles = (submission: SubmissionStatusType) => {
    if (submission.files) {
      const newFiles: FileType[] = [];
      return Promise.all(
        submission.files.map((fileId: number) => {
          return File.read(fileId).then((file: FileType) => {
            newFiles.push(file);
            this.setState({
              comments: {
                ...this.state.comments,
                [file.id]: [],
              },
            });
            return this.loadComments(file);
          });
        }),
      ).then(() => {
        this.setState({ files: newFiles });
        return Promise.all([Promise.resolve()]);
      });
    } else {
      return Promise.all([Promise.resolve()]);
    }
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
      this.setState({ isLoadingSubmission: true, currentSubmission: undefined }, () => {
        this.setState({ currentAssignment });
        this.loadRubricCategories(currentAssignment).then(() => {
          this.loadSubmission(currentAssignment).then(() => {
            this.setState({ toLoadAssignment: true, isLoadingSubmission: false });
          });
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
      rubricCategories,
    } = this.state;

    const errorSnackBarStyle = {
      width: '100%',
      fontWeight: 500,
      fontSize: 14,
      backgroundColor: 'red',
      maxWidth: '100%',
    };

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

    const pointsPerCategory = {};
    for (const commentID in rubricComments) {
      // Don't count unsaved comments
      if (+commentID > 0 && rubricComments.hasOwnProperty(commentID)) {
        if (!pointsPerCategory[rubricComments[commentID].category]) {
          pointsPerCategory[rubricComments[commentID].category] = rubricComments[commentID].pointDelta;
        } else {
          pointsPerCategory[rubricComments[commentID].category] =
            pointsPerCategory[rubricComments[commentID].category] + rubricComments[commentID].pointDelta;
        }
      }
    }

    const messages: string[] = [];
    rubricCategories.forEach((rubricCategory: RubricCategoryType) => {
      if (pointsPerCategory[rubricCategory.id]) {
        if (pointsPerCategory[rubricCategory.id] > rubricCategory.pointLimit!) {
          const diff = pointsPerCategory[rubricCategory.id] - rubricCategory.pointLimit!;
          messages.push(`${rubricCategory.name} (${diff})`);
        }
      }
    });

    const stats = [];
    if (currentAssignment && currentAssignment.mean && currentAssignment.median) {
      stats.push(<div>Mean: {currentAssignment.mean}</div>);
      stats.push(<div>Median: {currentAssignment.median}</div>);
    }

    let contentArea;
    if (currentSubmission && currentAssignment && currentSubmission.isFinalized) {
      contentArea = (
        <div className="student__submission-view">
          <div className="student__grade-container">
            <div className="student__grade-container__top">
              <div>
                Grade: {currentSubmission!.grade} / {currentAssignment!.points}
              </div>
              {stats}
            </div>
            {messages.length > 0 ? (
              <div className="student__grade-container__bottom">
                <div>Category points exceeded: {messages.join(', ')}</div>
              </div>
            ) : (
              <div />
            )}
          </div>
          <ReadOnlyCodePanel
            submission={currentSubmission!}
            files={files}
            comments={comments}
            rubricComments={rubricComments}
          />
        </div>
      );
    } else if (currentSubmission && currentAssignment && !currentSubmission.isFinalized) {
      contentArea = (
        <div className="student__getStarted__text">Your {currentAssignment.name} has not yet been graded.</div>
      );
    } else if (currentAssignment && this.state.isLoadingSubmission) {
      contentArea = <CircularProgress id="progress" className="progress-circle" />;
    } else if (currentCourse) {
      if (!this.state.assignments[currentCourse.id]) {
        contentArea = <div className="student__getStarted__text">No assignments available.</div>;
      } else {
        contentArea = (
          <div className="student__getStarted--assignment">
            <img className="student__getStarted__arrow" src={require('./img/get-started-arrow-left-2.png')} />
            <div className="student__getStarted__text">Select an assignment.</div>
          </div>
        );
      }
    } else {
      contentArea = (
        <div className="student__getStarted">
          <img className="student__getStarted__arrow" src={require('./img/get-started-arrow-left.png')} />
          <div className="student__getStarted__text">Select a course to get started.</div>
        </div>
      );
    }

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
        <Snackbar
          id="error-snackbar"
          className="error-snackbar"
          toasts={this.state.errorToasts}
          autohide={true}
          lastChild={true}
          autohideTimeout={2000}
          onDismiss={this.dismissErrorToast}
          style={errorSnackBarStyle}
        />
      </div>
    );
  }
}

export default Student;
