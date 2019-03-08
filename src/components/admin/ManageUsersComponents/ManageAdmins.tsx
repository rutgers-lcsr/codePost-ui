import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  DialogContainer,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';
import '../../../styles/index.scss';

import { CourseType } from '../../../infrastructure/course';
import { USER_APP } from '../../../types/common';

import RosterFileUpload from './RosterFileUpload';

interface IProps {
  graders: string[];
  admins: string[];
  rosterLoadComplete: boolean;
  lockedAdminChange: boolean;
  toggleLock: () => void;
  currentCourse: CourseType | undefined;
  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
  enrollUser: (email: string, type: USER_APP) => Promise<void>;
  unEnrollUsers: (emails: string[], type: USER_APP) => Promise<void>;
  changeRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
  isStudent: (user: string) => boolean;
}

interface IState {
  newAdminField: string | undefined;
  sortAscending: boolean;
  searchTerm: string;
  // This field will either be the grader's username who is also an admin, to prompt
  // the user if they would like to unenroll the user from being an admin also, or will
  // be null if no such choice is required
  emailToGraderUnenroll: string | undefined;
  warningAddingStudent: string | undefined;
}

class ManageStudents extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newAdminField: undefined,
    sortAscending: true,
    searchTerm: '',
    emailToGraderUnenroll: undefined,
    warningAddingStudent: undefined,
  };

  public triggerUnEnrollUser = (newUserEmail: string, userType: USER_APP) => {
    const { unEnrollUsers, graders } = this.props;
    unEnrollUsers([newUserEmail], userType);
    if (graders.indexOf(newUserEmail) !== -1) {
      this.setState({ emailToGraderUnenroll: newUserEmail });
    }
  };

  public resolveGraderUnenroll = (triggerUnenroll: boolean) => {
    const { unEnrollUsers } = this.props;
    const { emailToGraderUnenroll } = this.state;
    if (typeof emailToGraderUnenroll !== 'undefined' && triggerUnenroll) {
      unEnrollUsers([emailToGraderUnenroll], USER_APP.Grader);
    }
    this.setState({ emailToGraderUnenroll: undefined });
  };

  public triggerEnrollUser = (newUserEmail: string, userType: USER_APP) => {
    this.props.enrollUser(newUserEmail, userType);
    this.setState({ newAdminField: '', warningAddingStudent: undefined });
  };

  public toggleWarningModal = (user: string) => {
    this.setState({ warningAddingStudent: user });
  };

  public newAdminFieldOnChange = (value: string) => {
    this.setState({ newAdminField: value });
  };

  public changeSearch = (value: string) => {
    this.setState({ searchTerm: value });
  };

  public toggleSort = () => {
    this.setState({ sortAscending: !this.state.sortAscending });
  };

  public render() {
    const { rosterLoadComplete, lockedAdminChange, admins, addErrorToast, addToast, changeRoster } = this.props;
    const { newAdminField, searchTerm, sortAscending, emailToGraderUnenroll } = this.state;

    // Check for if new admin is a valid admin field
    const showSaveNewAdminButton = newAdminField && newAdminField.includes('@');

    const tableBody = rosterLoadComplete ? (
      admins.map((admin) => {
        if (admin.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) {
          return <div />;
        }
        return (
          <TableRow key={admin}>
            <TableColumn>{admin}</TableColumn>
            <TableColumn key={'UnEnroll'}>
              {' '}
              <Button
                key="unEnroll"
                className="Btn"
                flat={true}
                icon={true}
                disabled={lockedAdminChange}
                onClick={this.triggerUnEnrollUser.bind(this.props, admin, USER_APP.CourseAdmin)}
              >
                cancel
              </Button>
            </TableColumn>
          </TableRow>
        );
      })
    ) : (
      <CircularProgress id="progress" className="progress-circle" />
    );

    if (sortAscending) {
      admins.sort();
    } else {
      admins.sort().reverse();
    }
    return (
      <div className="roster-admin">
        <DialogContainer
          id="rubricFile-dialog"
          visible={typeof emailToGraderUnenroll !== 'undefined'}
          title="User also enrolled as Course Grader"
          actions={[
            {
              primary: true,
              children: 'Leave as Grader',
              onClick: this.resolveGraderUnenroll.bind(this.props, false),
            },
            {
              children: 'Unenroll',
              onClick: this.resolveGraderUnenroll.bind(this.props, true),
            },
          ]}
          modal
          portal={true}
        >
          {`Would you like to also unenroll ${emailToGraderUnenroll} from grader?`}
        </DialogContainer>
        <DialogContainer
          id="rubricFile-dialog"
          visible={this.state.warningAddingStudent !== undefined}
          title="Warning: This user is enrolled as a student"
          actions={[
            {
              primary: true,
              children: 'Cancel',
              onClick: this.toggleWarningModal.bind(this.props, undefined),
            },
            {
              children: 'Continue',
              onClick: this.triggerEnrollUser.bind(this.props, this.state.warningAddingStudent, USER_APP.CourseAdmin),
            },
          ]}
          modal
          portal={true}
        >
          {`Are you sure you want to add ${this.state.warningAddingStudent} as an admin?`}
        </DialogContainer>
        <div className="roster-admin__top-container">
          <div className="roster-admin__top-container__newUser">
            <TextField
              id="addAdminField"
              label="Add Admin"
              lineDirection="center"
              placeholder="Admin's email"
              className="roster-admin__addUser__Field"
              value={newAdminField}
              onChange={this.newAdminFieldOnChange}
              disabled={lockedAdminChange}
            />
            <Button
              iconChildren="done"
              className="roster-admin__addUser__Btn"
              disabled={!showSaveNewAdminButton || lockedAdminChange}
              onClick={
                this.props.isStudent(newAdminField ? newAdminField : '')
                  ? this.toggleWarningModal.bind(this.props, newAdminField!)
                  : this.triggerEnrollUser.bind(this.props, newAdminField, USER_APP.CourseAdmin)
              }
            >
              Save new admin
            </Button>
          </div>
          <RosterFileUpload
            users={admins}
            addErrorToast={addErrorToast}
            addToast={addToast}
            changeRoster={changeRoster}
            userType={USER_APP.CourseAdmin}
            isDisabled={lockedAdminChange}
            getSectionIDFromName={null}
            sectionsByStudent={null}
            changeSectionStudents={null}
            emailUsers={this.props.currentCourse ? this.props.currentCourse.emailNewUsers : false}
          />
        </div>
        <TextField
          id="search-manageAdmins"
          label="Search"
          lineDirection="center"
          className="md-cell md-cell--bottom"
          onChange={this.changeSearch}
        />
        <DataTable className="DataTable--ManageUsers" baseId="Manage-admins-table" plain={true}>
          <TableHeader>
            <TableRow selectable={false}>
              <TableColumn key={'Admin'} sorted={sortAscending} onClick={this.toggleSort}>
                Admin name
              </TableColumn>
              <TableColumn key={'Unenroll'}>Unenroll user</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
      </div>
    );
  }
}

export default ManageStudents;
