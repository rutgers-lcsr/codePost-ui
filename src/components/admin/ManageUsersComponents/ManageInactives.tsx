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
import '../../../styles/index.scss';

import { USER_APP } from '../../../types/common';

interface IProps {
  users: string[];
  rosterLoadComplete: boolean;
  lockedChange: boolean;
  toggleLock: () => void;
  enrollUser: (email: string, type: USER_APP) => Promise<void>;
  userType: USER_APP;
}

interface IState {
  sortAscending: boolean;
  searchTerm: string;
}

class ManageInactives extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    sortAscending: true,
    searchTerm: '',
  };

  public triggerEnrollUser = (newUserEmail: string) => {
    this.props.enrollUser(newUserEmail, this.props.userType);
    this.setState({ newAdminField: '' });
  };

  public changeSearch = (value: string) => {
    this.setState({ searchTerm: value });
  };

  public toggleSort = () => {
    this.setState({ sortAscending: !this.state.sortAscending });
  };

  public render() {
    const { rosterLoadComplete, users, lockedChange } = this.props;
    const { searchTerm, sortAscending } = this.state;

    if (sortAscending) {
      users.sort();
    } else {
      users.sort().reverse();
    }

    const tableBody = rosterLoadComplete ? (
      users.map((user) => {
        if (user.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) {
          return <div />;
        }
        return (
          <TableRow key={user}>
            <TableColumn>{user}</TableColumn>
            <TableColumn key={'Enroll'}>
              <Button
                key="enroll"
                className="Btn"
                flat={true}
                icon={true}
                disabled={lockedChange}
                onClick={this.triggerEnrollUser.bind(this.props, user)}
              >
                done
              </Button>
            </TableColumn>
          </TableRow>
        );
      })
    ) : (
      <CircularProgress id="progress" className="progress-circle" />
    );

    return (
      <div className="roster-admin">
        <TextField
          id="search-inactives"
          label="Search"
          lineDirection="center"
          className="md-cell md-cell--bottom"
          onChange={this.changeSearch}
        />
        <DataTable className="DataTable--ManageInactives" baseId="Manage-inactives-table" plain={true}>
          <TableHeader>
            <TableRow selectable={false}>
              <TableColumn key={'User'} sorted={sortAscending} onClick={this.toggleSort}>
                User email
              </TableColumn>
              <TableColumn key={'Enroll'}>Re-enroll user</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
      </div>
    );
  }
}

export default ManageInactives;
