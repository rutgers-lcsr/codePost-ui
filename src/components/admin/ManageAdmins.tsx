import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';
import '../../styles/index.scss';
import { ICourse, USER_APP } from '../../types/common';

interface IProps {
  admins: string[];
  adminsLoadComplete: boolean;
  lockedAdminChange: boolean;
  toggleLock: () => void;
  currentCourse: ICourse | undefined;
  addToast: (text: string, action: string | undefined) => void;
  enrollUser: (email: string, type: USER_APP) => void;
  unEnrollUsers: (emails: string[], type: USER_APP) => void;
}

interface IState {
  newAdminField: string | undefined;
  selectedAdmins: string[];
}

class ManageStudents extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newAdminField: undefined,
    selectedAdmins: [],
  };

  public triggerUnEnrollAdmins = () => {
    const { selectedAdmins } = this.state;
    const { unEnrollUsers } = this.props;

    const adminType = USER_APP.CourseAdmin;

    if (selectedAdmins) {
      unEnrollUsers(selectedAdmins, adminType);
      // Reminder to fix: Potentially could create problems if parent fails
      // to delete one of the selected ids and it looks selected but no longer is on the backend
      this.setState({ selectedAdmins: [] });
    }
  };

  public rowSelect = (adminEmail: string, rowID: number, checked: boolean) => {
    const { selectedAdmins } = this.state;
    if (checked) {
      selectedAdmins.push(adminEmail);
      this.setState({ selectedAdmins });
      // Reminder: We should throw an error if the numSelected is different than
      // our array at any point
    } else {
      const newSelectedAdmins = selectedAdmins.filter((value) => {
        return value !== adminEmail;
      });
      this.setState({ selectedAdmins: newSelectedAdmins });
    }
  };

  public newAdminFieldOnChange = (value: string) => {
    this.setState({ newAdminField: value });
  };

  public render() {
    const { adminsLoadComplete, lockedAdminChange, enrollUser, admins } = this.props;
    const { newAdminField, selectedAdmins } = this.state;

    const lockIcon = lockedAdminChange ? 'lock' : 'lock_open';

    const showSaveNewAdminButton = newAdminField && newAdminField.includes('@');
    const adminType = USER_APP.CourseAdmin;

    if (adminsLoadComplete && admins) {
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
            onClick={enrollUser.bind(this.props, newAdminField, adminType)}
          >
            Save new admin
          </Button>
          <Button
            iconChildren="delete"
            className="delete-Btn"
            disabled={lockedAdminChange || selectedAdmins.length === 0}
            onClick={this.triggerUnEnrollAdmins}
          >
            Unenroll selected
          </Button>
          <hr />
          <DataTable className="Manage-admins-table" baseId="Manage-admins-table">
            <TableHeader>
              <TableRow selectable={false}>
                <TableColumn key={'Filler'} />
                <TableColumn key={'Admin'}>Admin name</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                return (
                  <TableRow key={admin} onCheckboxClick={this.rowSelect.bind(this.props, admin)}>
                    <TableColumn>{admin}</TableColumn>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
          <Button key="Lock" className="Btn" floating={true} fixed={true} icon={true} onClick={this.props.toggleLock}>
            {lockIcon}
          </Button>
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

export default ManageStudents;
