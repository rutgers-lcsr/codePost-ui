import * as React from 'react';
import { Button } from 'react-md';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
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
  superGraders: string[];
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
        <Tabs defaultTabIndex={activeTabIndex}>
          <TabList className="tabList--ManageUsers">
            <Tab className="tabList--ManageUsers__tab">Students</Tab>
            <Tab className="tabList--ManageUsers__tab">Graders</Tab>
            <Tab className="tabList--ManageUsers__tab">Admins</Tab>
            <Tab className="tabList--ManageUsers__tab">Sections</Tab>
          </TabList>
          <TabPanel>
            {/* padding under the tab required because tab is position:fixed*/}
            <div className="tabList--ManageUsers__panelPadding" />
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
          </TabPanel>
          <TabPanel>
            {/* padding under the tab required because tab is position:fixed*/}
            <div className="tabList--ManageUsers__panelPadding" />
            <ManageGraders
              graders={this.props.graders}
              superGraders={this.props.superGraders}
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
          </TabPanel>
          <TabPanel>
            {/* padding under the tab required because tab is position:fixed*/}
            <div className="tabList--ManageUsers__panelPadding" />
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
          </TabPanel>
          <TabPanel>
            {/* padding under the tab required because tab is position:fixed*/}
            <div className="tabList--ManageUsers__panelPadding" />
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
          </TabPanel>
        </Tabs>
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
