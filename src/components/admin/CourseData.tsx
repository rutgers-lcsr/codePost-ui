import * as React from 'react';
import { Tab, Tabs, TabsContainer } from 'react-md';
import { AssignmentType } from '../../infrastructure/assignment';
import '../../styles/index.scss';
import {
  IAssignmentToSubmissionsMap,
  IGraderSubmissionsDataTable,
  IStudentSubmissionsDataTable,
} from '../../types/common';
import GraderData from './GraderData';
import StudentData from './StudentData';

interface IPropsCourseData {
  assignments: AssignmentType[];
  assignmentsLoadComplete: boolean;
  students: string[];
  graders: string[];
  submissionsbyUserLoadComplete: boolean;
  submissions: IAssignmentToSubmissionsMap;
  submissionsLoadComplete: boolean;
  submissionsByStudent: IStudentSubmissionsDataTable;
  submissionsByGrader: IGraderSubmissionsDataTable;
  addToast: (text: string, action: string | undefined) => void;
  currentCourseID: number;
  initialTab: number;
  // onTabChange: (newTab: number) => void;
}

interface IState {
  activeTabIndex: number;
  activeStudent: string | undefined;
  activeGrader: string | undefined;
}

class CourseData extends React.Component<IPropsCourseData, {}> {
  public static getDerivedStateFromProps(props: IPropsCourseData, state: IState) {
    const { students, graders } = props;

    if (!state.activeStudent && !state.activeGrader) {
      return null;
    }

    const toRet = { activeStudent: state.activeStudent, activeGrader: state.activeGrader };

    if (!students || students.filter((s: string) => s === state.activeStudent).length !== 1) {
      toRet.activeStudent = undefined;
    }

    if (!graders || graders.filter((s: string) => s === state.activeGrader).length !== 1) {
      toRet.activeGrader = undefined;
    }

    return toRet;
  }

  public state: Readonly<IState> = {
    activeTabIndex: this.props.initialTab,
    activeStudent: undefined,
    activeGrader: undefined,
  };

  public componentDidUpdate(prevProps: IPropsCourseData, prevState: IState) {
    const { initialTab } = this.props;
    if (prevProps.initialTab !== initialTab) {
      this.setState({ activeTabIndex: initialTab });
    }
  }

  public openSubmission = (submissionID: number | string) => {
    if (window) {
      window.open(
        `/grade/${submissionID}`,
        'test',
        `width=${screen.availWidth * 0.9},height=${screen.availHeight}0.9`,
      );
    }
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
      assignmentsLoadComplete,
      submissionsbyUserLoadComplete,
      assignments,
      submissionsByStudent,
      submissionsByGrader,
      currentCourseID,
    } = this.props;
    const { activeStudent, activeGrader, activeTabIndex } = this.state;

    return (
      <div>
        <TabsContainer defaultTabIndex={activeTabIndex} className="tabs">
          <Tabs tabId="simple-tab">
            <Tab label="Students" style={{ color: '#000000' }}>
              <StudentData
                key={currentCourseID}
                submissionsbyUserLoadComplete={submissionsbyUserLoadComplete}
                assignmentsLoadComplete={assignmentsLoadComplete}
                assignments={assignments}
                submissionsByStudent={submissionsByStudent}
                activeStudent={activeStudent}
                changeActiveStudent={this.changeActiveStudent}
                openSubmission={this.openSubmission}
              />
            </Tab>
            <Tab label="Graders" style={{ color: '#000000' }}>
              <GraderData
                key={currentCourseID}
                submissionsbyUserLoadComplete={submissionsbyUserLoadComplete}
                assignmentsLoadComplete={assignmentsLoadComplete}
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
  }
}

export default CourseData;
