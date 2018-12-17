import * as React from 'react';
import { CircularProgress, Tab, Tabs, TabsContainer } from 'react-md';
import '../../styles/index.scss';
import {
  IAssignment,
  IAssignmentSubmissionsMap,
  IGrader,
  IStudent,
  IUserSubmissionsMap,
} from '../../types/common';
import GraderData from './GraderData';
import StudentData from './StudentData';

interface IPropsCourseData {
  assignments: IAssignment[];
  students: IStudent[];
  studentsLoadComplete: boolean;
  graders: IGrader[];
  gradersLoadComplete: boolean;
  submissionsByStudentLoadComplete: boolean;
  submissionsByAssignment: IAssignmentSubmissionsMap;
  submissionsByAssignmentLoadComplete: boolean;
  submissionsByStudent: IUserSubmissionsMap;
  submissionsByGrader: IUserSubmissionsMap;
  addToast: (text: string, action: string | undefined) => void;
}

interface IState {
  activeTabIndex: number;
  activeStudent: string | undefined;
  activeGrader: string | undefined;
}

class CourseData extends React.Component<IPropsCourseData, {}> {
  public state: Readonly<IState> = {
    activeTabIndex: 0,
    activeStudent: undefined,
    activeGrader: undefined,
  };

  public openSubmission = (submissionID: number | string) => {
    if (window) {
      window.open(
        `/grade/${submissionID}`,
        'test',
        `width=${screen.availWidth * 0.9},height=${screen.availHeight}0.9`,
      );
    }
  };

  public onTabChange = (newActiveTabIndex: number) => {
    this.setState({ activeTabIndex: newActiveTabIndex });
  };

  public changeActiveStudent = (student: string | undefined) => {
    if (student) {
      this.setState({ activeStudent: student });
    } else {
      this.setState({ activeStudent: undefined });
    }
  };

  public changeActiveGrader = (student: string | undefined) => {
    if (student) {
      this.setState({ activeGrader: student });
    } else {
      this.setState({ activeGrader: undefined });
    }
  };

  public render() {
    const {
      submissionsByStudentLoadComplete,
      assignments,
      submissionsByStudent,
      submissionsByGrader,
    } = this.props;
    const { activeStudent, activeGrader } = this.state;

    if (submissionsByStudentLoadComplete) {
      return (
        <div>
          <hr />
          <TabsContainer onTabChange={this.onTabChange}>
            <Tabs tabId="simple-tab">
              <Tab label="Students" style={{ color: '#000000' }}>
                <StudentData
                  assignments={assignments}
                  submissionsByStudent={submissionsByStudent}
                  activeStudent={activeStudent}
                  changeActiveStudent={this.changeActiveStudent}
                  openSubmission={this.openSubmission}
                />
              </Tab>
              <Tab label="Graders" style={{ color: '#000000' }}>
                <GraderData
                  assignments={assignments}
                  submissionsByGrader={submissionsByGrader}
                  activeGrader={activeGrader}
                  changeActiveGrader={this.changeActiveGrader}
                  openSubmission={this.openSubmission}
                />
              </Tab>
            </Tabs>
          </TabsContainer>
        </div>
      );
    } else {
      return (
        <div>
          <hr />
          <CircularProgress id="circle" className="progressCircle" />
        </div>
      );
    }
  }
}

export default CourseData;
