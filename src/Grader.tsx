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
  isLoadingSubmissions: boolean;

  currentAssignment?: IAssignment;
  currentCourse?: ICourse;
  currentSubmissions: ISubmission[];

  email: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  redirect: boolean;
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
    isLoading: true,
    isLoadingSubmissions: false,
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
  };

  public componentDidMount() {
    // Should kick user back to login screne if they are not logged in
    // Should use props to pass graderID here from top-level app...
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

  public componentDidUpdate(prevProps : IGraderProps, prevState : IGraderState) {
    if (prevState.isLoading && prevState.courses && prevState.assignments) {
      const { assignments, currentCourse } = this.state;

      // Don't need to try to load assignment if no currrentCourse
      if (!currentCourse || !assignments[currentCourse.id]) {
        return;
      }

      const targetEntries = currentCourse.assignments.length;
      const currEntries = assignments[currentCourse.id].length;
      if (targetEntries > 0 && targetEntries === currEntries) {
        if (assignments && currentCourse) {
          this.setState({ isLoading: false }, () => this.setAssignmentFromURL(assignments, currentCourse));
        }
      }
    }
  }
  ///////////////////////////////////////
  // URL handler methods
  ///////////////////////////////////////

  public setCourseFromURL(courses : ICourse[]) {
    const courseNameFromURL = this.props.match.params.courseName;
    const periodFromURL = this.props.match.params.period;

    let currentCourse;
    if (courseNameFromURL && periodFromURL) {
      const formattedCourseName = courseNameFromURL.replace('_', ' ');
      const formattedPeriod = periodFromURL.replace('_', ' ');

      currentCourse = courses.find((obj: ICourse) => {
        return (obj.name === formattedCourseName) && (obj.period === formattedPeriod);
      });
      if (currentCourse) {
        this.setState({ currentCourse });
      }
    }
    return currentCourse;
  }

  public setAssignmentFromURL(assignments : ICourseToAssignmentMap  , currentCourse : ICourse) {
    const assignmentNameFromURL = this.props.match.params.assignmentName;

    let currentAssignment;
    if (assignmentNameFromURL) {
      const formattedAssignmentName = assignmentNameFromURL.replace('_', ' ');

      currentAssignment = assignments[currentCourse.id].find((obj: IAssignment) => {
        return obj.name === formattedAssignmentName;
      });
      if (currentAssignment) {
        this.setState({ currentAssignment });
      }
    }

    return currentAssignment;
  }

  public setURLFromCourse(course : ICourse) {
    const formattedName = course.name.replace(' ', '_');
    const formattedPeriod = course.period.replace(' ', '_');
    this.props.history.push(`/grader/${formattedName}/${formattedPeriod}`);
  }

  public setURLFromAssignment(assignment : IAssignment, course : ICourse) {
    const formattedCourseName = course.name.replace(' ', '_');
    const formattedPeriod = course.period.replace(' ', '_');
    const formattedAssignmentName = assignment.name.replace(' ', '_');
    this.props.history.push(`/grader/${formattedCourseName}/${formattedPeriod}/${formattedAssignmentName}`);
  }

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadCourses = () => {
    return APIUtils.fetchUser(USER_APP.Grader).then(([email, courses]) => {
      this.setState({ email, courses });
      this.setCourseFromURL(courses);
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

    this.setState({ isLoadingSubmissions: true });

    if (!currentCourse) {
      return;
    }

    const currentAssignment = assignments[currentCourse.id].filter((obj: IAssignment) => {
      return obj.id === option.value;
    })[0];

    if (currentAssignment) {
      this.loadSubmissions(currentAssignment)
        .then(() => {
          this.setState({ currentAssignment, isLoadingSubmissions: false },
            () => this.setURLFromAssignment(currentAssignment, currentCourse));
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
    }, () => this.setURLFromCourse(currentCourse));
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
    const { assignments, isLoading } = this.state;
    if (isLoading || !currentCourse || !currentCourse.assignments) {
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
    const { courses, currentAssignment, currentCourse, currentSubmissions, isLoadingSubmissions } = this.state;
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
            isLoading={this.state.isLoading}
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
