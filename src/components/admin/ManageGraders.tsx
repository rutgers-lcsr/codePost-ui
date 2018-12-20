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
import { ICourse3, UserEnum } from '../../types/common';

interface IProps {
  graders: string[];
  gradersLoadComplete: boolean;
  lockedGraderChange: boolean;
  toggleLock: () => void;
  currentCourse: ICourse3 | undefined;
  addToast: (text: string, action: string | undefined) => void;
  enrollUser: (email: string, type: UserEnum) => void;
  unEnrollUsers: (emails: string[], type: UserEnum) => void;
}

interface IState {
  newField: string | undefined;
  selectedUsers: string[];
}

class ManageGraders extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newField: undefined,
    selectedUsers: [],
  };

  public triggerUnEnrollUsers = () => {
    const { selectedUsers } = this.state;
    const { unEnrollUsers } = this.props;

    const graderType = UserEnum.Grader;

    if (selectedUsers) {
      unEnrollUsers(selectedUsers, graderType);
      // Reminder to fix: Potentially could create problems if parent fails
      // to delete one of the selected ids and it looks selected but no longer is on the backend
      this.setState({ selectedUsers: [] });
    }
  };

  public rowSelect = (graderEmail: string, rowID: number, checked: boolean) => {
    const { selectedUsers } = this.state;
    if (checked) {
      selectedUsers.push(graderEmail);
      this.setState({ selectedUsers });
      // Reminder: We should throw an error if the numSelected is different
      // than our array at any point
    } else {
      const newSelectedUsers = selectedUsers.filter((value) => {
        return value !== graderEmail;
      });
      this.setState({ selectedUsers: newSelectedUsers });
    }
  };

  public newFieldOnChange = (value: string) => {
    this.setState({ newField: value });
  };

  public render() {
    const { gradersLoadComplete, lockedGraderChange, enrollUser, graders } = this.props;
    const { newField, selectedUsers } = this.state;

    const lockIcon = lockedGraderChange ? 'lock' : 'lock_open';

    const showSaveNewButton = newField && newField.includes('@');
    const graderType = UserEnum.Grader;

    if (gradersLoadComplete && graders) {
      return (
        <div>
          <TextField
            id="addGraderField"
            label="Add Grader"
            lineDirection="center"
            placeholder="Graders's email"
            className="md-cell md-cell--bottom"
            value={newField}
            onChange={this.newFieldOnChange}
            disabled={lockedGraderChange}
          />
          <Button
            iconChildren="done"
            className="save-Btn"
            disabled={!showSaveNewButton || lockedGraderChange}
            onClick={enrollUser.bind(this.props, newField, graderType)}
          >
            Save new grader
          </Button>
          <Button
            iconChildren="delete"
            className="delete-Btn"
            disabled={lockedGraderChange || selectedUsers.length === 0}
            onClick={this.triggerUnEnrollUsers}
          >
            Unenroll selected
          </Button>
          <hr />
          <DataTable className="Manage-admins-table" baseId="Manage-admins-table">
            <TableHeader>
              <TableRow selectable={false}>
                <TableColumn key={'Filler'} />
                <TableColumn key={'Grader'}>Grader name</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {graders.map((grader) => {
                return (
                  <TableRow key={grader} onCheckboxClick={this.rowSelect.bind(this.props, grader)}>
                    <TableColumn>{grader}</TableColumn>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
          <Button
            key="Lock"
            className="Btn"
            floating={true}
            fixed={true}
            icon={true}
            onClick={this.props.toggleLock}
          >
            {lockIcon}
          </Button>
        </div>
      );
    }
    return (
      <div>
        <hr />
        <CircularProgress id="circle" className="progressCircle" />
      </div>
    );
  }
}

export default ManageGraders;
