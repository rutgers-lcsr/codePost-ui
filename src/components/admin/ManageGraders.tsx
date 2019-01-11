import * as React from 'react';
import {
  Button,
  DataTable,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';
import '../../styles/index.scss';
import { USER_APP } from '../../types/common';

import { CourseType } from '../../infrastructure/course';

interface IProps {
  graders: string[];
  rosterLoadComplete: boolean;
  lockedGraderChange: boolean;
  toggleLock: () => void;
  currentCourse: CourseType | undefined;
  addToast: (text: string, action: string | undefined) => void;
  enrollUser: (email: string, type: USER_APP) => void;
  unEnrollUsers: (emails: string[], type: USER_APP) => void;
}

interface IState {
  newField: string | undefined;
  sortAscending: boolean;
  searchTerm: string;
}

class ManageGraders extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newField: undefined,
    sortAscending: true,
    searchTerm: '',
  };

  public triggerUnEnrollUser = (newUserEmail: string, userType: USER_APP) => {
    const { unEnrollUsers } = this.props;
    unEnrollUsers([newUserEmail], userType);
  };

  public triggerEnrollUser = (newUserEmail: string, userType: USER_APP) => {
    this.props.enrollUser(newUserEmail, userType);
    this.setState({ newField: '' });
  };

  public newFieldOnChange = (value: string) => {
    this.setState({ newField: value });
  };

  public toggleSort = () => {
    this.setState({ sortAscending: !this.state.sortAscending });
  };

  public changeSearch = (value: string) => {
    this.setState({ searchTerm: value });
  };

  public render() {
    const { rosterLoadComplete, lockedGraderChange, graders } = this.props;
    const { newField, searchTerm, sortAscending } = this.state;

    const lockIcon = lockedGraderChange ? 'lock' : 'lock_open';

    const showSaveNewButton = newField && newField.includes('@');
    const graderType = USER_APP.Grader;

    let tableBody;
    if (rosterLoadComplete) {
      tableBody = graders.map((grader) => {
        if (grader.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) {
          return <div />;
        }
        return (
          <TableRow key={grader}>
            <TableColumn>{grader}</TableColumn>
            <TableColumn key={'UnEnroll'}>
              {' '}
              <Button
                key="unEnroll"
                className="Btn"
                flat={true}
                icon={true}
                disabled={lockedGraderChange}
                onClick={this.triggerUnEnrollUser.bind(this.props, grader, graderType)}
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
      graders.sort();
    } else {
      graders.sort().reverse();
    }
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
          onClick={this.triggerEnrollUser.bind(this.props, newField, graderType)}
        >
          Save new grader
        </Button>
        <hr />
        <TextField
          id="search-manageGraders"
          label="Search"
          lineDirection="center"
          className="md-cell md-cell--bottom"
          onChange={this.changeSearch}
        />
        <DataTable className="Manage-admins-table" baseId="Manage-admins-table" plain={true}>
          <TableHeader>
            <TableRow>
              <TableColumn key={'Grader'} sorted={sortAscending} onClick={this.toggleSort}>
                Grader name
              </TableColumn>
              <TableColumn key={'Unenroll'}>UnEnroll user</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
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
}

export default ManageGraders;
