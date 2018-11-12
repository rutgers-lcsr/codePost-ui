import * as React from 'react';
import { Redirect } from 'react-router-dom'

import CodeViewer from './components/CodeViewer'
import VerticalPane from './components/VerticalPane'
import './styles/index.scss';
import './styles/Student.scss';
import { IAssignment, ICourse, IOption, ISubmission } from './types/common'


interface IStudentState {
  courses: ICourse[],
  currentAssignment?: IAssignment,
  currentCourse?: ICourse,
  currentSubmission?: ISubmission,
  email: string,
  isLoggedIn: boolean,
  isLoading: boolean,
  redirect: boolean,
}

class Student extends React.Component<{}, IStudentState> {
  public state: Readonly<IStudentState> = {
    courses: [],
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSubmission: undefined,
    email: '',
    isLoading: true,
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
  }

  public componentDidMount() {
    // Should kick user back to login screne if they are not logged in
    // Should use props to pass studentID here from top-level app...
    // ...annoying that typescript doesn't allow usage of lambdas
    // in render prop of Route object (which is designed to handle
    // lambdas efficiently)
    if (this.state.isLoggedIn) {
      this.loadCourses();
    } else {
      this.setState({redirect: true});
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
    if (currentAssignment.isReleased) {
      this.loadSubmission(currentAssignment.id);
    } else {
      this.setState({currentSubmission: undefined});
    }
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

  public renderRedirect = () => {
    if (this.state.redirect) {
      return <Redirect to='/' />
    } else {
      return;
    }
  }

  public render() {
    const { courses, currentAssignment, currentCourse, currentSubmission } = this.state
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
        <ContentArea assignment={currentAssignment} submission={currentSubmission} />
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
        return(res.json())
      })
      .then(json => {
        const courses = 'studentCourses';
        this.setState({ courses: json[courses], isLoading: false, email: json.email });
     });
  };

  private loadSubmission = (id: string | number) => {
    fetch('/api/assignments/' + id + '/submissions/?student=' + this.state.email, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(json => {
        if (json.length > 0 && json[0].isFinalized) {
          this.setState({ currentSubmission: json[0] });
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
          {"Grade: " + submission!.grade + "/" + assignment.points}
        </div>
        <CodeViewer
          deductions={deductions}
          submission={submission!}
        />
      </div>
    );
  }
  else if (assignment) {
    return (
      <div style={{ margin: '100px' }}>
        Your {assignment.name} has not yet been graded.
      </div>
    );
  }
  else {
    return (
      <div style={{ margin: '100px' }}>
        Select an assignment on the left!
      </div>
    );
  }
}

export default Student;