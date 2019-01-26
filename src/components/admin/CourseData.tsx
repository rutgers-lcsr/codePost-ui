import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { AssignmentType } from '../../infrastructure/assignment';

import {
  IAssignmentToSubmissionsMap,
  IGraderSubmissionsDataTable,
  IStudentSubmissionsDataTable,
} from '../../types/common';
import GraderData from './CourseDataComponents/GraderData';
import StudentData from './CourseDataComponents/StudentData';

import { SubmissionType } from '../../infrastructure/submission';

import { openSubmission } from './AdminUtils';

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
  inactiveStudents: string[];
  inactiveGraders: string[];
  submissionsByInactiveStudent: IStudentSubmissionsDataTable;
  submissionsByInactiveGrader: IGraderSubmissionsDataTable;
  deleteSubmission: (submission: SubmissionType) => void;
}

interface IState {
  activeTabIndex: number;
  selectedStudent: string | undefined;
  selectedGrader: string | undefined;
  selectedInactiveStudent: string | undefined;
  selectedInactiveGrader: string | undefined;
}

class CourseData extends React.Component<IPropsCourseData, {}> {
  public static getDerivedStateFromProps(props: IPropsCourseData, state: IState) {
    const { students, graders } = props;

    if (!state.selectedStudent && !state.selectedGrader) {
      return null;
    }

    const toRet = { activeStudent: state.selectedStudent, activeGrader: state.selectedGrader };

    if (!students || students.filter((s: string) => s === state.selectedStudent).length !== 1) {
      toRet.activeStudent = undefined;
    }

    if (!graders || graders.filter((s: string) => s === state.selectedGrader).length !== 1) {
      toRet.activeGrader = undefined;
    }

    return toRet;
  }

  public state: Readonly<IState> = {
    activeTabIndex: this.props.initialTab,
    selectedStudent: undefined,
    selectedGrader: undefined,
    selectedInactiveStudent: undefined,
    selectedInactiveGrader: undefined,
  };

  public componentDidUpdate(prevProps: IPropsCourseData, prevState: IState) {
    const { initialTab } = this.props;
    if (prevProps.initialTab !== initialTab) {
      this.setState({ activeTabIndex: initialTab });
    }
  }

  public changeSelectedStudent = (student: string | undefined) => {
    if (student) {
      this.setState({ selectedStudent: student });
    } else {
      this.setState({ selectedStudent: undefined });
    }
  };

  public changeSelectedGrader = (student: string | undefined) => {
    if (student) {
      this.setState({ selectedGrader: student });
    } else {
      this.setState({ selectedGrader: undefined });
    }
  };

  public changeSelectedInactiveStudent = (student: string | undefined) => {
    if (student) {
      this.setState({ selectedInactiveStudent: student });
    } else {
      this.setState({ selectedInactiveStudent: undefined });
    }
  };

  public changeSelectedInactiveGrader = (student: string | undefined) => {
    if (student) {
      this.setState({ selectedInactiveGrader: student });
    } else {
      this.setState({ selectedInactiveGrader: undefined });
    }
  };

  public render() {
    const {
      assignmentsLoadComplete,
      submissionsbyUserLoadComplete,
      assignments,
      submissionsByStudent,
      submissionsByGrader,
      submissionsByInactiveStudent,
      submissionsByInactiveGrader,
      currentCourseID,
    } = this.props;
    const {
      selectedStudent,
      selectedGrader,
      activeTabIndex,
      selectedInactiveStudent,
      selectedInactiveGrader,
    } = this.state;

    return (
      <Tabs defaultTabIndex={activeTabIndex}>
        <TabList className="tabList--CourseData">
          <Tab className="tabList--CourseData__tab">Students</Tab>
          <Tab className="tabList--CourseData__tab">Grader</Tab>
          <Tab className="tabList--CourseData__tab" style={{ color: '#c8c8c8' }}>
            Inactive Students
          </Tab>
          <Tab className="tabList--CourseData__tab" style={{ color: '#c8c8c8' }}>
            Inactive Graders
          </Tab>
        </TabList>
        <TabPanel>
          {/* padding under the tab required because tab is position:fixed*/}
          <div className="tabList--CourseData__panelPadding" />
          <StudentData
            key={currentCourseID}
            submissionsbyUserLoadComplete={submissionsbyUserLoadComplete}
            assignmentsLoadComplete={assignmentsLoadComplete}
            assignments={assignments}
            submissionsByStudent={submissionsByStudent}
            activeStudent={selectedStudent}
            changeActiveStudent={this.changeSelectedStudent}
            openSubmission={openSubmission}
            deleteSubmission={this.props.deleteSubmission}
          />
        </TabPanel>
        <TabPanel>
          {/* padding under the tab required because tab is position:fixed*/}
          <div className="tabList--CourseData__panelPadding" />
          <GraderData
            key={currentCourseID}
            submissionsbyUserLoadComplete={submissionsbyUserLoadComplete}
            assignmentsLoadComplete={assignmentsLoadComplete}
            assignments={assignments}
            submissionsByGrader={submissionsByGrader}
            activeGrader={selectedGrader}
            changeActiveGrader={this.changeSelectedGrader}
            openSubmission={openSubmission}
          />
        </TabPanel>
        <TabPanel>
          {/* padding under the tab required because tab is position:fixed*/}
          <div className="tabList--CourseData__panelPadding" />
          <StudentData
            key={currentCourseID}
            submissionsbyUserLoadComplete={submissionsbyUserLoadComplete}
            assignmentsLoadComplete={assignmentsLoadComplete}
            assignments={assignments}
            submissionsByStudent={submissionsByInactiveStudent}
            activeStudent={selectedInactiveStudent}
            changeActiveStudent={this.changeSelectedInactiveStudent}
            openSubmission={openSubmission}
            deleteSubmission={this.props.deleteSubmission}
          />
        </TabPanel>
        <TabPanel>
          {/* padding under the tab required because tab is position:fixed*/}
          <div className="tabList--CourseData__panelPadding" />
          <GraderData
            key={currentCourseID}
            submissionsbyUserLoadComplete={submissionsbyUserLoadComplete}
            assignmentsLoadComplete={assignmentsLoadComplete}
            assignments={assignments}
            submissionsByGrader={submissionsByInactiveGrader}
            activeGrader={selectedInactiveGrader}
            changeActiveGrader={this.changeSelectedInactiveGrader}
            openSubmission={openSubmission}
          />
        </TabPanel>
      </Tabs>
    );
  }
}

export default CourseData;
