import * as React from 'react';
import { Button, Tab, Tabs, TabsContainer } from 'react-md';
import '../../styles/index.scss';

import { ISectionNoStudents, USER_APP } from '../../types/common';

import { CourseType } from '../../infrastructure/course';
import { SectionType } from '../../infrastructure/section';

import ManageAdmins from './ManageUsersComponents/ManageAdmins';
import ManageGraders from './ManageUsersComponents/ManageGraders';
import ManageSections from './ManageUsersComponents/ManageSections';
import ManageStudents from './ManageUsersComponents/ManageStudents';

interface IPropsManageUsers {
  currentCourse: CourseType | undefined;
  sections: SectionType[];
  students: string[];
  graders: string[];
  admins: string[];
  sectionsByStudent: { [studentEmail: string]: ISectionNoStudents };
  rosterLoadComplete: boolean;
  sectionsLoadComplete: boolean;

  lockChanges: boolean;
  toggleLock: () => void;

  enrollUser: (email: string, type: USER_APP) => void;
  unEnrollUsers: (emails: string[], type: USER_APP) => Promise<void>;
  changeRoster: (emails: string[], type: USER_APP) => Promise<void>;

  createSection: (newSection: string) => void;
  addLeader: (sectionID: number, leaderEmail: string) => Promise<string[]>;
  removeLeader: (sectionID: number, leaderEmail: string) => Promise<string[]>;
  changeStudentSection: (sectionID: number | undefined, studentEmail: string) => Promise<SectionType>;

  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
  initialTab: number;
}

interface IState {
  activeTabIndex: number;
}

class ManageUsers extends React.Component<IPropsManageUsers, {}> {
  public state: Readonly<IState> = {
    activeTabIndex: this.props.initialTab,
  };

  public componentDidUpdate(prevProps: IPropsManageUsers, prevState: IState) {
    const { initialTab } = this.props;
    if (prevProps.initialTab !== initialTab) {
      this.setState({ activeTabIndex: initialTab });
    }
  }

  public render() {
    const { activeTabIndex } = this.state;
    const { lockChanges } = this.props;

    return (
      <div>
        <TabsContainer defaultTabIndex={activeTabIndex} className="tabs" slideStyle={{ minHeight: '70vh' }}>
          <Tabs tabId="simple-tab">
            <Tab label="Students" classname="manageStudents" style={{ color: '#000000' }}>
              <ManageStudents
                sections={this.props.sections}
                students={this.props.students}
                rosterLoadComplete={this.props.rosterLoadComplete}
                lockedStudentChange={this.props.lockChanges}
                toggleLock={this.props.toggleLock}
                currentCourse={this.props.currentCourse}
                addToast={this.props.addToast}
                addErrorToast={this.props.addErrorToast}
                enrollUser={this.props.enrollUser}
                unEnrollUsers={this.props.unEnrollUsers}
                changeRoster={this.props.changeRoster}
                sectionsByStudent={this.props.sectionsByStudent}
                changeStudentSection={this.props.changeStudentSection}
              />
            </Tab>
            <Tab label="Graders" className="manageGraders" style={{ color: '#000000' }}>
              <ManageGraders
                graders={this.props.graders}
                admins={this.props.admins}
                rosterLoadComplete={this.props.rosterLoadComplete}
                lockedGraderChange={this.props.lockChanges}
                toggleLock={this.props.toggleLock}
                currentCourse={this.props.currentCourse}
                addToast={this.props.addToast}
                addErrorToast={this.props.addErrorToast}
                enrollUser={this.props.enrollUser}
                unEnrollUsers={this.props.unEnrollUsers}
                changeRoster={this.props.changeRoster}
              />
            </Tab>
            <Tab label="Sections" className="manageSections" style={{ color: '#000000' }}>
              <ManageSections
                sections={this.props.sections}
                sectionsLoadComplete={this.props.sectionsLoadComplete}
                lockedSectionChange={this.props.lockChanges}
                toggleLock={this.props.toggleLock}
                currentCourse={this.props.currentCourse}
                addToast={this.props.addToast}
                createSection={this.props.createSection}
                graders={this.props.graders}
                addLeader={this.props.addLeader}
                removeLeader={this.props.removeLeader}
              />
            </Tab>
            <Tab label="Admins" style={{ color: '#000000' }}>
              <ManageAdmins
                admins={this.props.admins}
                graders={this.props.graders}
                rosterLoadComplete={this.props.rosterLoadComplete}
                lockedAdminChange={this.props.lockChanges}
                toggleLock={this.props.toggleLock}
                currentCourse={this.props.currentCourse}
                addToast={this.props.addToast}
                addErrorToast={this.props.addErrorToast}
                enrollUser={this.props.enrollUser}
                unEnrollUsers={this.props.unEnrollUsers}
                changeRoster={this.props.changeRoster}
              />
            </Tab>
          </Tabs>
        </TabsContainer>
        <Button
          key="Lock"
          className="Btn"
          floating={true}
          tooltipLabel={lockChanges ? 'Making edits is locked.' : 'Edits are allowed. Click to lock.'}
          tooltipDelay={1500}
          tooltipPosition="left"
          tooltipTransitionEnterTimeout={0}
          tooltipTransitionLeaveTimeout={0}
          fixed={true}
          icon={true}
          onClick={this.props.toggleLock}
        >
          {lockChanges ? 'lock' : 'lock_open'}
        </Button>
      </div>
    );
  }
}

export default ManageUsers;
