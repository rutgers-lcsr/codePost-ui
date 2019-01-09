import * as React from 'react';
import { Button, DataTable, TableBody, TableColumn, TableHeader, TableRow, TextField } from 'react-md';
import '../../styles/index.scss';
import { USER_APP } from '../../types/common';

import { CourseType } from '../../infrastructure/course';

interface IProps {
  admins: string[];
  adminsLoadComplete: boolean;
  lockedAdminChange: boolean;
  toggleLock: () => void;
  currentCourse: CourseType | undefined;
  addToast: (text: string, action: string | undefined) => void;
  enrollUser: (email: string, type: USER_APP) => void;
  unEnrollUsers: (emails: string[], type: USER_APP) => void;
}

interface IState {
  newAdminField: string | undefined;
  sortAscending: boolean;
  searchTerm: string;
}

class ManageStudents extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newAdminField: undefined,
    sortAscending: true,
    searchTerm: '',
  };

  public triggerUnEnrollUser = (newUserEmail: string, userType: USER_APP) => {
    const { unEnrollUsers } = this.props;
    unEnrollUsers([newUserEmail], userType);
  };

  public triggerEnrollUser = (newUserEmail: string, userType: USER_APP) => {
    this.props.enrollUser(newUserEmail, userType);
    this.setState({ newAdminField: '' });
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
    const { adminsLoadComplete, lockedAdminChange, admins } = this.props;
    const { newAdminField, searchTerm, sortAscending } = this.state;

    const lockIcon = lockedAdminChange ? 'lock' : 'lock_open';

    const showSaveNewAdminButton = newAdminField && newAdminField.includes('@');
    const adminType = USER_APP.CourseAdmin;

    let tableBody;
    if (adminsLoadComplete) {
      tableBody = admins.map((admin) => {
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
                onClick={this.triggerUnEnrollUser.bind(this.props, admin, adminType)}
              >
                cancel
              </Button>
            </TableColumn>
          </TableRow>
        );
      });
    } else {
      tableBody = (
        <TableRow>
          <TableColumn>Loading...</TableColumn>
          <TableColumn />
        </TableRow>
      );
    }

    if (sortAscending) {
      admins.sort();
    } else {
      admins.sort().reverse();
    }
    return (
      <div>
        <TextField
          id="addAdminField"
          label="Add Admin"
          lineDirection="center"
          placeholder="Student's email"
          className="md-cell md-cell--bottom"
          value={newAdminField}
          onChange={this.newAdminFieldOnChange}
          disabled={lockedAdminChange}
        />
        <Button
          iconChildren="done"
          className="save-Btn"
          disabled={!showSaveNewAdminButton || lockedAdminChange}
          onClick={this.triggerEnrollUser.bind(this.props, newAdminField, adminType)}
        >
          Save new admin
        </Button>
        <hr />
        <TextField
          id="search-manageAdmins"
          label="Search"
          lineDirection="center"
          className="md-cell md-cell--bottom"
          onChange={this.changeSearch}
        />
        <DataTable className="Manage-admins-table" baseId="Manage-admins-table" plain={true}>
          <TableHeader>
            <TableRow selectable={false}>
              <TableColumn key={'Admin'} sorted={sortAscending} onClick={this.toggleSort}>
                Admin name
              </TableColumn>
              <TableColumn key={'Unenroll'}>UnEnroll user</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
        <Button key="Lock" className="Btn" floating={true} fixed={true} icon={true} onClick={this.props.toggleLock}>
          {lockIcon}
        </Button>
      </div>
    );
  }
}

export default ManageStudents;
