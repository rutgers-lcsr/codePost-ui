import * as React from 'react';
import { Redirect } from 'react-router-dom'
import GradedTab from './components/grader/GradedTab'
import VerticalPane from './components/VerticalPane'
import './styles/index.scss';
import './styles/Student.scss';
import { IAssignment, ICourse, IOption, ISubmission } from './types/common'

interface IGraderState {
  courses: ICourse[],
  currentAssignment?: IAssignment,
  currentCourse?: ICourse,
  currentSubmissions: ISubmission[],
  email: string,
  isLoggedIn: boolean,
  isLoading: boolean,
  redirect: boolean,
}

class Grader extends React.Component<{}, IGraderState> {
  public state: Readonly<IGraderState> = {
    courses: [],
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSubmissions: [],
    email: '',
    isLoading: true,
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
  }

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

  public handleAssignmentChange = (option: IOption, event: any) => {
    const { currentCourse } = this.state;

    if (!currentCourse || !currentCourse.assignments) {
      return;
    }

    const currentAssignment = currentCourse.assignments.filter((obj: IAssignment) => {
      return obj.id === option.value;
    })[0];

    this.setState({ currentAssignment });
    this.loadSubmissions(currentAssignment.id);
  }

  public handleCourseChange = (option: IOption) => {
    const currentCourse = this.state.courses.filter((obj: ICourse) => {
      return obj.id === option.value;
    })[0];

    this.setState({
      currentAssignment: undefined,
      currentCourse,
      currentSubmissions: []
    });
  }

  public claimSubmission = (assignment: IAssignment): any => {
    return new Promise((resolve, reject) => {
      fetch(`/api/assignments/${assignment.id}/drawUnassigned/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        },
        method: "PATCH",
      })
        .then(res => {
          if (res.status === 204) {
            return undefined
          }
          else {
            return (res.json())
          }
        })
        .then(json => {
          if (json) {
            this.setState({
              currentSubmissions: [...this.state.currentSubmissions, json]
            });
          }
          resolve(json)
        });
    });
  }

  public releaseSubmission = (submission: ISubmission): any => {
    return new Promise((resolve, reject) => {
      fetch(`/api/submissions/${submission.id}/unassign/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        },
        method: "PATCH",
      })
        .then(res => {
          return (res.json())
        })
        .then(json => {
          this.setState({
            currentSubmissions: this.state.currentSubmissions.filter(sub => sub.id !== submission.id)
          });
          resolve(json);
        });
    });
  }

  public renderRedirect = () => {
    if (this.state.redirect) {
      return <Redirect to='/' />
    } else {
      return;
    }
  }

  public render() {
    const { courses, currentAssignment, currentCourse, currentSubmissions } = this.state
    return (
      <div className="App">
        {this.renderRedirect()}
        <VerticalPane
          currentTab={this.tabCurrentFormatter(currentAssignment)}
          currentSelector={this.selectorCurrentFormatter(currentCourse)}
          selectorItems={this.selectorItemsFormatter(courses)}
          tabItems={this.tabItemsFormatter(currentCourse)}
          handleTabChange={this.handleAssignmentChange}
          handleSelectorChange={this.handleCourseChange}
          isLoading={this.state.isLoading}
        />
        <div className='content-container'>
          <GradedTab
            claimSubmission={this.claimSubmission}
            releaseSubmission={this.releaseSubmission}
            assignment={currentAssignment}
            submissions={currentSubmissions}
          />
        </div>
      </div>
    );
  }

  private loadCourses = () => {
    fetch('/api/users/me/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        return (res.json())
      })
      .then(json => {
        const courses = 'graderCourses';
        this.setState({ courses: json[courses], isLoading: false, email: json.email });
      });
  };

  private loadSubmissions = (id: string | number) => {
    fetch(`/api/assignments/${id}/submissions/?grader=rjfreling@gmail.com`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(json => {
        if (json.length > 0 && json[0].isFinalized) {
          this.setState({ currentSubmissions: json });
        }
        else {
          this.setState({ currentSubmissions: [] });
        }
      });
  };


  private selectorItemsFormatter = (courses: ICourse[]) => {
    return courses.map((course, i) => (
      { 'value': course.id, 'label': course.name }
    ));
  }

  private selectorCurrentFormatter = (currentCourse: ICourse | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return { 'value': currentCourse.id, 'label': currentCourse.name };
  }

  private tabItemsFormatter = (currentCourse: ICourse | undefined) => {
    if (!currentCourse || !currentCourse.assignments) {
      return [];
    }

    return currentCourse.assignments.map((assignment, i) => (
      { 'value': assignment.id, 'label': assignment.name }
    ));
  }

  private tabCurrentFormatter = (currentAssignment: IAssignment | undefined) => {
    if (!currentAssignment) {
      return undefined;
    }
    return { 'value': currentAssignment.id, 'label': currentAssignment.name }
  }

}

export default Grader;