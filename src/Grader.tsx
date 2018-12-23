import * as React from 'react';
import { Redirect } from 'react-router-dom';
import GradedTab from './components/grader/GradedTab';
import VerticalPane from './components/VerticalPane';

import './styles/Grader.scss';

import { IAssignment, ICourse2, IOption, ISubmission2 } from './types/common';

import APIUtils from './APIUtils';

interface ICourseToAssignmentMap {
  [courseId: number]: IAssignment[];
}

interface IGraderState {
  courses: ICourse2[];
  assignments: ICourseToAssignmentMap;
  isLoadingSubmissions: boolean;

  currentAssignment?: IAssignment;
  currentCourse?: ICourse2;
  currentSubmissions: ISubmission2[];

  email: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  redirect: boolean;
}

class Grader extends React.Component<{}, IGraderState> {
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
    return APIUtils.fetchSubmissions(assignment.id, `grader=${this.state.email}`).then(
      (currentSubmissions: any) => {
        console.log('1 - saving submissions', currentSubmissions);
        this.setState({ currentSubmissions });
      },
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
        const graderCourses = 'graderCourses';
        return json[graderCourses];
      });
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
          this.setState({ currentAssignment });
          console.log('2 - saving current assignment', currentAssignment);
          console.log('~fin~');
        })
        .then(() => {
          this.setState({ isLoadingSubmissions: false });
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
      currentSubmissions: [],
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
    if (!currentCourse || !currentCourse.assignments) {
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

  public claimSubmission = (assignment: IAssignment): any => {
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

  public releaseSubmission = (submission: ISubmission2): any => {
    const payload = {
      grader: '',
    };

    return fetch(`/api/submissions/${submission.id}/`, {
      body: JSON.stringify(payload),
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
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
