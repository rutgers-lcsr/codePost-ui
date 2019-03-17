import * as React from 'react';
import { Redirect } from 'react-router-dom';

import { CodePanel, makeReadOnly } from './components/Code/CodePanel';

import VerticalPane from './components/VerticalPane';

import { CircularProgress } from 'react-md';

import { ICommentToRubricCommentMap, ICourseToAssignmentMap, IFileToCommentsMap, IOption } from './types/common';

import { Assignment, AssignmentType, sortAssignments } from './infrastructure/assignment';
import { CourseType } from './infrastructure/course';
import { FileType } from './infrastructure/file';
import { loadIDList } from './infrastructure/generics';
import { RubricCategory, RubricCategoryType } from './infrastructure/rubricCategory';
import { Submission, SubmissionStatusType } from './infrastructure/submission';

interface IStudentState {
  courses: CourseType[];
  assignments: ICourseToAssignmentMap;
  files: FileType[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
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
}

export interface IStudentProps {
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
    commentRubricComments: {},
    toLoadCourse: false,
    toLoadAssignment: false,
  };

  public async componentDidMount() {
    const assignments = await this.loadAssignments(this.state.courses);
    this.setState({ assignments });

    await this.setStateFromURL();
  }

  public componentDidUpdate(prevProps: IStudentProps, prevState: IStudentState) {
    if (this.state.toLoadCourse || this.state.toLoadAssignment) {
      this.setState({ toLoadCourse: false, toLoadAssignment: false });
    }
  }

  ///////////////////////////////////////
  // URL handler methods
  ///////////////////////////////////////

  public setStateFromURL = async () => {
    const { courseName, period, assignmentName } = this.props.match.params;

    let currentCourse: CourseType | undefined;
    let currentAssignment: AssignmentType | undefined;

    if (courseName && period) {
      currentCourse = this.state.courses.find((course: CourseType) => {
        return course.name === courseName.replace(/_/g, ' ') && course.period === period.replace(/_/g, ' ');
      });

      if (currentCourse && assignmentName) {
        currentAssignment = this.state.assignments[currentCourse.id].find((assignment: AssignmentType) => {
          return assignment.name === assignmentName.replace(/_/g, ' ');
        });

        if (currentAssignment) {
          this.setState({ isLoadingSubmission: true });
          const rubricCategories = await this.loadRubricCategories(currentAssignment);
          const currentSubmission = await this.loadSubmission(currentAssignment);

          if (currentSubmission) {
            const [files, comments, commentRubricComments] = await Submission.loadData(currentSubmission);
            // @ts-ignore
            this.setState({ files, comments, commentRubricComments });
          }
          this.setState({
            currentCourse,
            currentAssignment,
            currentSubmission,
            rubricCategories,
            isLoadingSubmission: false,
          });
        }
      } else {
        this.setState({ currentCourse });
      }
    }
  };

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadAssignments = async (courses: CourseType[]) => {
    const assignments = {};

    await Promise.all(
      courses.map(async (course: CourseType) => {
        assignments[course.id] = sortAssignments(await loadIDList(course.assignments, Assignment));
        return;
      }),
    );

    return assignments;
  };

  public loadSubmission = async (assignment: AssignmentType) => {
    if (!assignment.isReleased) {
      return undefined;
    }

    return (await Assignment.readSubmissionsStudent(assignment.id, { student: this.props.email }))[0];
  };

  public loadRubricCategories = async (assignment: AssignmentType) => {
    return await loadIDList(assignment.rubricCategories, RubricCategory);
  };

  ///////////////////////////////////////
  // Handlers
  ///////////////////////////////////////

  public handleAssignmentChange = (option: IOption, event: any) => {
    const { assignments, currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    const currentAssignment = assignments[currentCourse.id].filter((assignment: AssignmentType) => {
      return assignment.id === option.value;
    })[0];

    if (currentAssignment) {
      this.setState({ currentAssignment });
      this.setState({ isLoadingSubmission: true, currentSubmission: undefined }, async () => {
        const rubricCategories = await this.loadRubricCategories(currentAssignment);
        const currentSubmission = await this.loadSubmission(currentAssignment);

        if (currentSubmission) {
          const [files, comments, commentRubricComments] = await Submission.loadData(currentSubmission);
          // @ts-ignore
          this.setState({
            files,
            comments,
            commentRubricComments,
            currentSubmission,
            rubricCategories,
            isLoadingSubmission: false,
            toLoadAssignment: true,
          });
        } else {
          this.setState({ currentSubmission, isLoadingSubmission: false, toLoadAssignment: true });
        }
      });
    }
  };

  public getPointsPerCategory = (commentRubricComments: ICommentToRubricCommentMap) => {
    const pointsPerCategory = {};

    for (const commentID in commentRubricComments) {
      // Don't count unsaved comments
      if (+commentID > 0 && commentRubricComments.hasOwnProperty(commentID)) {
        if (!pointsPerCategory[commentRubricComments[commentID].category]) {
          pointsPerCategory[commentRubricComments[commentID].category] = commentRubricComments[commentID].pointDelta;
        } else {
          pointsPerCategory[commentRubricComments[commentID].category] =
            pointsPerCategory[commentRubricComments[commentID].category] + commentRubricComments[commentID].pointDelta;
        }
      }
    }

    return pointsPerCategory;
  };

  public writeCategoryCapMessages = (
    pointsPerCategory: { [categoryID: number]: number },
    rubricCategories: RubricCategory[],
  ) => {
    const messages: string[] = [];

    rubricCategories.forEach((rubricCategory: RubricCategoryType) => {
      if (pointsPerCategory[rubricCategory.id]) {
        if (pointsPerCategory[rubricCategory.id] > rubricCategory.pointLimit!) {
          const diff = pointsPerCategory[rubricCategory.id] - rubricCategory.pointLimit!;
          messages.push(`${rubricCategory.name} (${diff})`);
        }
      }
    });

    return messages;
  };

  public handleCourseChange = (option: IOption) => {
    const currentCourse = this.state.courses.filter((course: CourseType) => {
      return course.id === option.value;
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
    const { courses, currentAssignment, currentCourse, currentSubmission, files, comments } = this.state;

    if (this.state.toLoadCourse || this.state.toLoadAssignment) {
      if (currentCourse) {
        const formattedCourseName = currentCourse.name.replace(/ /g, '_');
        const formattedPeriod = currentCourse.period.replace(/ /g, '_');
        if (this.state.toLoadAssignment && currentAssignment) {
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

    const pointsPerCategory = this.getPointsPerCategory(this.state.commentRubricComments);
    const messages = this.writeCategoryCapMessages(pointsPerCategory, this.state.rubricCategories);

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
            rubricComments={this.state.commentRubricComments}
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
      </div>
    );
  }
}

export default Student;
