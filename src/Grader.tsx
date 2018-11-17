import * as React from 'react';
import GradedTab from './components/grader/GradedTab'
import TopBar from './components/TopBar'
import VerticalPane from './components/VerticalPane'
import './styles/index.scss';
import './styles/Student.scss';
import { IAssignment, ICourse, IOption, ISubmission } from './types/common'

interface IGraderState {
  courses: ICourse[],
  currentAssignment?: IAssignment,
  currentCourse?: ICourse,
  currentSubmissions: ISubmission[]
}

class Grader extends React.Component<{}, IGraderState> {
  public state: Readonly<IGraderState> = {
    courses: [],
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSubmissions: []
  }

  public componentDidMount() {
    this.loadCourses();
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
      $.ajax({
        beforeSend: (xhr: any) => {
          xhr.setRequestHeader("Authorization", "Basic " + btoa("rjfreling@gmail.com:pass"));
        },
        cache: true,
        dataType: 'json',
        error: (xhr: any, status: any, err: any) => {
          console.error(xhr, status, err.toString());
          reject(err);
        },
        success: (data: any) => {
          if (data) {
            this.setState({
              currentSubmissions: [...this.state.currentSubmissions, data]
            });
          }
          resolve(data);
        },
        type: 'PATCH',
        url: `/api/assignments/${assignment.id}/drawUnassigned/`
      });
    });
  }

  public releaseSubmission = (submission: ISubmission): any => {
    return new Promise((resolve, reject) => {
      $.ajax({
        beforeSend: (xhr: any) => {
          xhr.setRequestHeader("Authorization", "Basic " + btoa("rjfreling@gmail.com:pass"));
        },
        cache: true,
        dataType: 'json',
        error: (xhr: any, status: any, err: any) => {
          console.error(xhr, status, err.toString());
          reject(err);
        },
        success: (data: any) => {
          this.setState({
            currentSubmissions: this.state.currentSubmissions.filter(sub => sub.id !== submission.id)
          });
          resolve(data);
        },
        type: 'PATCH',
        url: `/api/submissions/${submission.id}/unassign/`
      });
    });
  }

  public render() {
    const { courses, currentAssignment, currentCourse, currentSubmissions } = this.state
    return (
      <div className="App">
        <TopBar />
        <VerticalPane
          currentTab={this.tabCurrentFormatter(currentAssignment)}
          currentSelector={this.selectorCurrentFormatter(currentCourse)}
          selectorItems={this.selectorItemsFormatter(courses)}
          tabItems={this.tabItemsFormatter(currentCourse)}
          handleTabChange={this.handleAssignmentChange}
          handleSelectorChange={this.handleCourseChange}
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
    $.ajax({
      beforeSend: (xhr: any) => {
        xhr.setRequestHeader("Authorization", "Basic " + btoa("rjfreling@gmail.com:pass"));
      },
      cache: true,
      dataType: 'json',
      error: (xhr: any, status: any, err: any) => {
        console.error(xhr, status, err.toString());
      },
      success: (data: any) => {
        const courses = 'graderCourses'
        this.setState({ courses: data[courses] });
      },
      url: '/api/users/me/'
    });
  };

  private loadSubmissions = (id: string | number) => {
    $.ajax({
      beforeSend: (xhr: any) => {
        xhr.setRequestHeader("Authorization", "Basic " + btoa("rjfreling@gmail.com:pass"));
      },
      cache: true,
      dataType: 'json',
      error: (xhr: any, status: any, err: any) => {
        console.error(xhr, status, err.toString());
      },
      success: (data: any) => {
        if (data.length > 0) {
          this.setState({ currentSubmissions: data });
        }
        else {
          this.setState({ currentSubmissions: [] });
        }
      },
      url: `/api/assignments/${id}/submissions/?grader=rjfreling@gmail.com`
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