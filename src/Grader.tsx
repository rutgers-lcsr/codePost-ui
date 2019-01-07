import * as React from 'react';
import { Redirect } from 'react-router-dom';
import GradedTab from './components/grader/GradedTab';
import VerticalPane from './components/VerticalPane';

import './styles/Grader.scss';

import { IAssignment, ICourse, ICourseToAssignmentMap, IOption, ISubmission, USER_APP } from './types/common';

import APIUtils from './APIUtils';

interface IGraderState {
  courses: ICourse[];
  assignments: ICourseToAssignmentMap;
  currentAssignment?: IAssignment;
  currentCourse?: ICourse;
  currentSubmissions: ISubmission[];

  email: string;
  isLoggedIn: boolean;
  redirect: boolean;

  // Loading variables
  isLoadingCourses: boolean;
  isLoadingAssignments: boolean;
  isLoadingSubmissions: boolean;

  // URL variables
  toLoadCourse: boolean;
  toLoadAssignment: boolean;
}

interface IGraderProps {
  match: any;
  history: any;
}

class Grader extends React.Component<IGraderProps, IGraderState> {
  public state: Readonly<IGraderState> = {
    assignments: {},
    courses: [],
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSubmissions: [],
    email: '',
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
    isLoadingCourses: true,
    isLoadingAssignments: true,
    isLoadingSubmissions: false,
    toLoadCourse: false,
    toLoadAssignment: false,

  };

  public componentDidMount() {
    // Should kick user back to login screne if they are not logged in
    // Should use props to pass graderID here from top-level app...
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
  public componentDidUpdate(prevProps : IGraderProps, prevState : IGraderState) {
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
        return (obj.name === formattedCourseName) && (obj.period === formattedPeriod);
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
  }

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadCourses = () => {
    return APIUtils.fetchUser(USER_APP.Grader).then(([email, courses]) => {
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

  public loadSubmissions = (assignment: IAssignment) => {
    return APIUtils.fetchSubmissions(assignment.id, USER_APP.Grader, this.state.email).then(
      (currentSubmissions: ISubmission[]) => {
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

    const currentAssignment = assignments[currentCourse.id].filter((obj: IAssignment) => {
      return obj.id === option.value;
    })[0];

    if (currentAssignment) {
      this.setState({ isLoadingSubmissions: true }, () => {
        this.loadSubmissions(currentAssignment)
        .then(() => {
          this.setState({ currentAssignment, isLoadingSubmissions: false, toLoadAssignment: true });
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
      currentSubmissions: [],
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
    if (isLoadingCourses || !currentCourse || !currentCourse.assignments) {
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

  public claimSubmission = (assignment: IAssignment): Promise<ISubmission> => {
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

  public releaseSubmission = (submission: ISubmission): Promise<ISubmission> => {
    const payload = {
      grader: '',
    };

    return APIUtils.updateSubmission(submission.id, payload).then((json) => {
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
          return <Redirect to={`/grader/${formattedCourseName}/${formattedPeriod}/${formattedAssignmentName}`}/>;
        } else {
          return <Redirect to={`/grader/${formattedCourseName}/${formattedPeriod}/`}/>;
        }
      } else {
        return <Redirect to={'/grader'}/>;
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
            isLoading={this.state.isLoadingCourses}
          />
          <GradedTab
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
