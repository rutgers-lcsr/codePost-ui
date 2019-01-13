import * as React from 'react';
import { Redirect } from 'react-router-dom';
import GraderAssignmentPanel from './components/grader/GraderAssignmentPanel';
import VerticalPane from './components/VerticalPane';

// import './styles/Grader.scss';

import { ICourseToAssignmentMap, IOption } from './types/common';

import { Assignment, AssignmentType } from './infrastructure/assignment';
import { CourseType } from './infrastructure/course';
import { Submission, SubmissionType } from './infrastructure/submission';

interface IGraderState {
  courses: CourseType[];
  assignments: ICourseToAssignmentMap;
  currentAssignment?: AssignmentType;
  currentCourse?: CourseType;
  currentSubmissions: SubmissionType[];

  isLoggedIn: boolean;
  redirect: boolean;

  // Loading variables
  isLoadingAssignments: boolean;
  isLoadingSubmissions: boolean;

  // URL variables
  toLoadCourse: boolean;
  toLoadAssignment: boolean;
}

interface IGraderProps {
  initialCourses: CourseType[];
  email: string;
  match: any;
  history: any;
}

class Grader extends React.Component<IGraderProps, IGraderState> {
  public state: Readonly<IGraderState> = {
    assignments: {},
    courses: this.props.initialCourses,
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSubmissions: [],
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
    isLoadingAssignments: true,
    isLoadingSubmissions: false,
    toLoadCourse: false,
    toLoadAssignment: false,
  };

  public componentDidMount() {
    this.loadAllAssignments();
  }

  // Used to fire this.setStateFromURL, which can only be done when courses and assignments are done loading
  public componentDidUpdate(prevProps: IGraderProps, prevState: IGraderState) {
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
      currentCourse = courses.find((obj: CourseType) => {
        return obj.name === formattedCourseName && obj.period === formattedPeriod;
      });

      // Given (courseName, period), test whether assignmentName corresponds to loaded assignment
      if (currentCourse && assignmentName) {
        const formattedAssignmentName = assignmentName.replace(/_/g, ' ');
        currentAssignment = assignments[currentCourse.id].find((obj: AssignmentType) => {
          return obj.name === formattedAssignmentName;
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

  public loadSubmissions = (assignment: AssignmentType) => {
    return Assignment.readSubmissions(assignment.id, { grader: this.props.email }).then(
      (currentSubmissions: SubmissionType[]) => {
        this.setState({ currentSubmissions });
      },
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
      this.setState({ isLoadingSubmissions: true }, () => {
        this.loadSubmissions(currentAssignment).then(() => {
          this.setState({ currentAssignment, isLoadingSubmissions: false, toLoadAssignment: true });
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
      currentSubmissions: [],
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
    if (!currentCourse || !currentCourse.assignments) {
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

  public claimSubmission = (assignment: AssignmentType): Promise<SubmissionType> => {
    return fetch(`/api/assignments/${assignment.id}/drawUnassigned/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (res.status === 204) {
          return undefined;
        }
        return res.json();
      })
      .then((json) => {
        if (json) {
          this.setState({
            currentSubmissions: [...this.state.currentSubmissions, json],
          });
        }
        return json;
      });
  };

  public releaseSubmission = (submission: SubmissionType): Promise<SubmissionType> => {
    const payload = {
      id: submission.id,
      grader: '',
    };

    return Submission.update(payload).then((json: any) => {
      this.setState({
        currentSubmissions: this.state.currentSubmissions.filter((sub) => {
          return sub.id !== submission.id;
        }),
      });
      return json;
    });
  };

  ///////////////////////////////////////
  // Main
  ///////////////////////////////////////

  public render() {
    const {
      courses,
      currentAssignment,
      currentCourse,
      currentSubmissions,
      isLoadingSubmissions,
      toLoadCourse,
      toLoadAssignment,
    } = this.state;

    if (toLoadCourse || toLoadAssignment) {
      if (currentCourse) {
        const formattedCourseName = currentCourse.name.replace(/ /g, '_');
        const formattedPeriod = currentCourse.period.replace(/ /g, '_');
        if (toLoadAssignment && currentAssignment) {
          const formattedAssignmentName = currentAssignment.name.replace(/ /g, '_');
          return <Redirect to={`/grader/${formattedCourseName}/${formattedPeriod}/${formattedAssignmentName}`} />;
        } else {
          return <Redirect to={`/grader/${formattedCourseName}/${formattedPeriod}/`} />;
        }
      } else {
        return <Redirect to={'/grader'} />;
      }
    }

    return (
      <div className="grader">
        <div className="grader__left-panel">
          <VerticalPane
            currentTab={this.tabCurrentFormatter(currentAssignment)}
            currentSelector={this.selectorCurrentFormatter(currentCourse)}
            selectorItems={this.selectorItemsFormatter(courses)}
            tabItems={this.tabItemsFormatter(currentCourse)}
            handleTabChange={this.handleAssignmentChange}
            handleSelectorChange={this.handleCourseChange}
          />
        </div>
        <div className="grader__right-panel">
          <GraderAssignmentPanel
            claimSubmission={this.claimSubmission}
            releaseSubmission={this.releaseSubmission}
            assignment={currentAssignment}
            submissions={currentSubmissions}
            isLoadingSubmissions={isLoadingSubmissions}
          />
        </div>
      </div>
    );
  }
}

export default Grader;
