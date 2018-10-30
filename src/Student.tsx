import * as React from 'react';
import CodeViewer from './components/CodeViewer'
import TopBar from './components/TopBar'
import VerticalPane from './components/VerticalPane'
import './styles/index.scss';
import './styles/Student.scss';
import { IAssignment, ICourse, IOption, ISubmission } from './types/common'


interface IStudentState {
  courses: ICourse[],
  currentAssignment?: IAssignment,
  currentCourse?: ICourse,
  currentSubmission?: ISubmission
}

class Student extends React.Component<{}, IStudentState> {
  public state: Readonly<IStudentState> = {
    courses: [],
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSubmission: undefined
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
    this.loadSubmission(currentAssignment.id);
  }

  public handleCourseChange = (option: IOption) => {
    const currentCourse = this.state.courses.filter((obj: ICourse) => {
      return obj.id === option.value;
    })[0];

    this.setState({
      currentAssignment: undefined,
      currentCourse,
      currentSubmission: undefined
    });
  }

  public render() {
    const { courses, currentAssignment, currentCourse, currentSubmission } = this.state
    return (
      <div className="App">
        <TopBar />
        <p className="App-intro">
          This is the student page.
        </p>
        <VerticalPane
          currentTab={this.tabCurrentFormatter(currentAssignment)}
          currentSelector={this.selectorCurrentFormatter(currentCourse)}
          selectorItems={this.selectorItemsFormatter(courses)}
          tabItems={this.tabItemsFormatter(currentCourse)}
          handleTabChange={this.handleAssignmentChange}
          handleSelectorChange={this.handleCourseChange}
        />
        <ContentArea assignment={currentAssignment} submission={currentSubmission} />
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
        this.setState({ courses: data });
      },
      url: '/api/courses/me/?app=student'
    });
  };

  private loadSubmission = (id: string | number) => {
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
          this.setState({ currentSubmission: data[0] });
        }
        else {
          this.setState({ currentSubmission: undefined });
        }
      },
      url: `/api/assignments/${id}/submissions/`
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

interface IContentAreaProps {
  assignment?: IAssignment,
  submission?: ISubmission
}

const ContentArea = (props: IContentAreaProps) => {
  const { assignment, submission } = props;

  const getDeductions = (sub: ISubmission) => {
    const deductions = [];
    for (const file of sub.files) {
      let totalDeduction = 0;
      for (const comment of file.comments) {
        totalDeduction += comment.pointDelta;
      }
      deductions.push(totalDeduction);
    }
    return deductions;
  }

  if (submission && assignment) {
    const deductions = getDeductions(submission);
    return (
      <div className='content-container'>
        <div className="grade-container">
          {"Grade: " + submission.grade + "/" + assignment.points}
        </div>
        <CodeViewer
          deductions={deductions}
          submission={submission}
        />
      </div>
    );
  }
  else if (assignment) {
    return (
      <div>
        Your {assignment.name} has not yet been graded.
      </div>
    );
  }
  else {
    return (
      <div>
        Select an assignment on the left!
      </div>
    );
  }
}

export default Student;