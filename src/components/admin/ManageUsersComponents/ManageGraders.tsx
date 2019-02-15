import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  DialogContainer,
  SelectionControl,
  TableBody,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
  TextField,
} from 'react-md';
import '../../../styles/index.scss';

import { CourseType } from '../../../infrastructure/course';
import { USER_APP } from '../../../types/common';
import { getSortIndex } from '../../Utils/SortUtils';
import RosterFileUpload from './RosterFileUpload';

interface IProps {
  graders: string[];
  admins: string[];
  superGraders: string[];
  rosterLoadComplete: boolean;
  lockedGraderChange: boolean;
  toggleLock: () => void;
  currentCourse: CourseType | undefined;
  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
  enrollUser: (email: string, type: USER_APP) => Promise<void>;
  unEnrollUsers: (emails: string[], type: USER_APP) => Promise<void>;
  changeRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
}

interface IState {
  newField: string | undefined;
  searchTerm: string;
  // This field will either be the grader's username who is also an admin, to prompt
  // the user if they would like to unenroll the user from being an admin also, or will
  // be null if no such choice is required
  emailToAdminUnenroll: string | undefined;
  changedGraders: string[];
  sortedUsers: string[];
  paginatedUsers: string[];
  paginationStart: number | undefined;
  rowsPerPage: number | undefined;
  sortedIndex: Array<boolean | undefined>;
}

class ManageGraders extends React.Component<IProps, IState> {
  public constructor(props: any) {
    super(props);
    // SortedIndex index corresp0 is student email, index at 1 is section
    const sortedIndex = [true, undefined];
    this.state = {
      newField: undefined,
      searchTerm: '',
      emailToAdminUnenroll: undefined,
      changedGraders: [],
      sortedUsers: [],
      paginatedUsers: [],
      paginationStart: undefined,
      rowsPerPage: undefined,
      sortedIndex,
    };
  }

  public componentDidMount() {
    if (this.props.rosterLoadComplete) {
      const sortedUsers = this.props.graders.slice();
      sortedUsers.sort();
      this.setState({ sortedUsers });
    }
  }

  public componentDidUpdate(prevProps: IProps, prevState: IState) {
    if (this.props.graders !== prevProps.graders) {
      const sortedUsers = this.props.graders.slice();
      sortedUsers.sort(this.graderSortFunction.bind(this));
      this.setState({ sortedUsers }, () => {
        if (!(typeof this.state.paginationStart === 'undefined') && !(typeof this.state.rowsPerPage === 'undefined')) {
          this.handlePagination(this.state.paginationStart, this.state.rowsPerPage);
        }
      });
    }
  }

  public graderSortFunction(a: string, b: string) {
    const { sortedIndex } = this.state;
    // Sort by email
    if (typeof sortedIndex[0] !== 'undefined') {
      if (a < b) return sortedIndex[0] ? -1 : 1;
      else if (a > b) return sortedIndex[0] ? 1 : -1;
      else return 0;
    }
    // Sort by viewAll column case
    if (typeof sortedIndex[1] !== 'undefined') {
      const { superGraders } = this.props;
      const aIsSuperGrader = superGraders.indexOf(a) !== -1;
      const bIsSuperGrader = superGraders.indexOf(b) !== -1;
      if (aIsSuperGrader !== bIsSuperGrader) {
        if (aIsSuperGrader) return sortedIndex[1] ? 1 : -1;
        else return sortedIndex[1] ? -1 : 1;
      } else return 0;
    }
    return 0;
  }

  public triggerUnEnrollUser = (newUserEmail: string, userType: USER_APP) => {
    const { unEnrollUsers, admins } = this.props;
    unEnrollUsers([newUserEmail], userType);
    if (admins.indexOf(newUserEmail) !== -1) {
      this.setState({ emailToAdminUnenroll: newUserEmail });
    }
  };

  public resolveAdminUnenroll = (triggerUnenroll: boolean) => {
    const { unEnrollUsers } = this.props;
    const { emailToAdminUnenroll } = this.state;
    if (typeof emailToAdminUnenroll !== 'undefined' && triggerUnenroll) {
      unEnrollUsers([emailToAdminUnenroll], USER_APP.CourseAdmin);
    }
    this.setState({ emailToAdminUnenroll: undefined });
  };

  public triggerEnrollUser = (newUserEmail: string, userType: USER_APP) => {
    this.props.enrollUser(newUserEmail, userType);
    this.setState({ newField: '' });
  };

  public newFieldOnChange = (value: string) => {
    this.setState({ newField: value });
  };

  public changeSearch = (value: string) => {
    this.setState({ searchTerm: value });
  };

  public changeSuperGrader = (grader: string, isSuperGrader: any) => {
    const { enrollUser, unEnrollUsers } = this.props;
    const { changedGraders } = this.state;
    changedGraders.push(grader);
    this.setState({ changedGraders });
    if (isSuperGrader) {
      enrollUser(grader, USER_APP.SuperGrader);
    } else {
      unEnrollUsers([grader], USER_APP.SuperGrader);
    }
    setTimeout(() => {
      const newChanged = this.state.changedGraders.filter((i) => {
        return i !== grader;
      });
      this.setState({ changedGraders: newChanged });
    }, 2000);
  };

  public handlePagination = (start: number, rowsPerPage: number) => {
    const { sortedUsers } = this.state;
    this.setState({
      paginatedUsers: sortedUsers.slice(start, start + rowsPerPage),
      paginationStart: start,
      rowsPerPage,
    });
  };

  public toggleSort = (columnIndex: number) => {
    const { sortedIndex } = this.state;
    const newSortedIndex = getSortIndex(sortedIndex, columnIndex);

    // set new sortedIndex to state
    this.setState({ sortedIndex: newSortedIndex }, () => {
      // re-sort students
      const newSortedUsers = this.state.sortedUsers.slice();
      newSortedUsers.sort(this.graderSortFunction.bind(this));
      // re-do pagination
      this.setState(
        {
          sortedUsers: newSortedUsers,
        },
        () => {
          if (
            !(typeof this.state.paginationStart === 'undefined') &&
            !(typeof this.state.rowsPerPage === 'undefined')
          ) {
            this.handlePagination(this.state.paginationStart, this.state.rowsPerPage);
          }
        },
      );
    });
  };

  public render() {
    const {
      rosterLoadComplete,
      lockedGraderChange,
      graders,
      superGraders,
      addErrorToast,
      addToast,
      changeRoster,
    } = this.props;
    const {
      newField,
      searchTerm,
      emailToAdminUnenroll,
      changedGraders,
      sortedUsers,
      paginatedUsers,
      sortedIndex,
    } = this.state;

    const showSaveNewButton = newField && newField.includes('@');
    const graderType = USER_APP.Grader;

    let usersToRender;
    // If search term, filter users by those who meet search term and render those users
    if (searchTerm.length > 0) {
      usersToRender = sortedUsers.filter((s) => {
        return s.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
      });
    } else {
      // If no paginated students, render those. If not, take the default pagination (20) and return those students
      usersToRender = paginatedUsers.length > 0 ? paginatedUsers : this.state.sortedUsers.slice(0, 10);
    }

    let tableBody;
    if (rosterLoadComplete) {
      tableBody = usersToRender.map((grader) => {
        const isSuperGrader = superGraders.indexOf(grader) !== -1;
        const isBeingChanged = changedGraders.indexOf(grader) !== -1;

        return (
          <TableRow key={grader}>
            <TableColumn>{grader}</TableColumn>
            <TableColumn>
              <SelectionControl
                id={`togglegrader-${grader}`}
                type="switch"
                name="ManageGraders__toggleSuperGrader"
                className="ManageGraders__toggleSuperGrader"
                defaultChecked={isSuperGrader}
                disabled={lockedGraderChange || isBeingChanged}
                onChange={this.changeSuperGrader.bind(this.props, grader)}
              />
            </TableColumn>
            <TableColumn key={'UnEnroll'}>
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
      tableBody = <CircularProgress id="progress" className="progress-circle" />;
    }

    return (
      <div className="roster-grader">
        <DialogContainer
          id="rubricFile-dialog"
          visible={typeof emailToAdminUnenroll !== 'undefined'}
          title="User also enrolled as Course Admin"
          actions={[
            {
              primary: true,
              children: 'Leave as Admin',
              onClick: this.resolveAdminUnenroll.bind(this.props, false),
            },
            {
              children: 'Unenroll',
              onClick: this.resolveAdminUnenroll.bind(this.props, true),
            },
          ]}
          modal
          portal={true}
        >
          {`Would you like to also unenroll ${emailToAdminUnenroll} from admin?`}
        </DialogContainer>
        <div className="roster-grader__top-container">
          <div>
            <TextField
              id="addGraderField"
              label="Add Grader"
              lineDirection="center"
              placeholder="Graders's email"
              className="roster-grader__addUser__Field"
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
          </div>
          <RosterFileUpload
            users={graders}
            addErrorToast={addErrorToast}
            addToast={addToast}
            changeRoster={changeRoster}
            userType={USER_APP.Grader}
            isDisabled={lockedGraderChange}
            getSectionIDFromName={null}
            sectionsByStudent={null}
            changeStudentSection={null}
          />
        </div>
        <TextField
          id="search-manageGraders"
          label="Search"
          lineDirection="center"
          className="md-cell md-cell--bottom"
          onChange={this.changeSearch}
        />
        <DataTable className="DataTable--ManageUsers" baseId="Manage-admins-table" plain={true}>
          {searchTerm.length === 0 ? (
            <TablePagination
              className="DataTable--ManageUsers__pagination"
              rows={this.state.sortedUsers.length}
              defaultRowsPerPage={10}
              onPagination={this.handlePagination}
            />
          ) : (
            <div />
          )}
          <TableHeader>
            <TableRow>
              <TableColumn key={'Grader'} sorted={sortedIndex[0]} onClick={this.toggleSort.bind(this.props, 0)}>
                Grader name
              </TableColumn>
              <TableColumn key={'isSuperGrader'} sorted={sortedIndex[1]} onClick={this.toggleSort.bind(this.props, 1)}>
                View All Privileges
              </TableColumn>
              <TableColumn key={'Unenroll'}>UnEnroll user</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
      </div>
    );
  }
}

export default ManageGraders;
