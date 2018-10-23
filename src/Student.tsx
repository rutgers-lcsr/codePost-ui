import * as React from 'react';
import './App.css';
import VerticalPane from './components/VerticalPane'
import logo from './logo.svg';
import { ICourse, IOption } from './types/common'


interface IStudentState {
  courses: ICourse[],
  currentAssignment?: IOption,
  currentCourse?: IOption
}

class Student extends React.Component<{}, IStudentState> {

  public readonly state = {
    courses: [],
    currentAssignment: undefined,
    currentCourse: undefined,
  }

  public componentDidMount() {
    this.loadCourses();
  }

  public handleAssignmentChange = (option: IOption, event: any) => {
    this.setState({
      currentAssignment: option
    });
  }

  public handleCourseChange = (option: IOption) => {
    this.setState({
      currentAssignment: undefined,
      currentCourse: option
    });
  }

  public render() {
    const { courses, currentAssignment, currentCourse } = this.state
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          This is the student page.
        </p>
        <VerticalPane
          currentTab={currentAssignment}
          currentSelector={currentCourse}
          items={courses}
          handleTabChange={this.handleAssignmentChange}
          handleSelectorChange={this.handleCourseChange}
        />
      </div>
    );
  }

  private loadCourses() {
    $.ajax({
      beforeSend: (xhr : any) => {
          xhr.setRequestHeader ("Authorization", "Basic " + btoa("rjfreling@gmail.com:pass"));
      },
      cache: true,
      dataType: 'json',
      error: (xhr : any, status : any, err : any) => {
        console.error(xhr, status, err.toString());
      },
      success: (data : any) => {
        this.setState({ courses: data });
      },
      url: '/api/courses/me/?app=student'
    });
  };
}

export default Student;