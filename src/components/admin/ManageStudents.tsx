import * as React from 'react';
import {
  Button,
  DataTable,
  FontIcon,
  SelectFieldColumn,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';

import { ISectionNoStudents, USER_APP } from '../../types/common';

import { CourseType } from '../../infrastructure/course';
import { SectionType } from '../../infrastructure/section';

import RosterFileUpload from './RosterFileUpload';

interface IProps {
  sections: SectionType[];
  students: string[];
  rosterLoadComplete: boolean;
  lockedStudentChange: boolean;
  toggleLock: () => void;
  currentCourse: CourseType | undefined;
  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
  enrollUser: (email: string, type: USER_APP) => void;
  unEnrollUsers: (emails: string[], type: USER_APP) => Promise<void>;
  sectionsByStudent: { [studentEmail: string]: ISectionNoStudents };
  changeStudentSection: (sectionID: number | undefined, studentEmail: string) => Promise<SectionType>;
  changeRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
}

interface IState {
  newStudentField: string | undefined;
  changedSectionStudents: string[];
  sortAscending: boolean;
  searchTerm: string;
}

class ManageStudents extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newStudentField: undefined,
    changedSectionStudents: [],
    sortAscending: true,
    searchTerm: '',
  };

  public triggerUnEnrollUser = (newStudentEmail: string, studentType: USER_APP) => {
    const { unEnrollUsers } = this.props;

    unEnrollUsers([newStudentEmail], studentType);
  };

  public triggerEnrollUser = (newStudentEmail: string, studentType: USER_APP) => {
    this.props.enrollUser(newStudentEmail, studentType);
    this.setState({ newStudentField: '' });
  };

  public rowSectionChange = (studentEmail: string, value: number) => {
    let { changedSectionStudents } = this.state;
    const { changeStudentSection } = this.props;

    changedSectionStudents.push(studentEmail);
    this.setState({ changedSectionStudents });

    const newSectionID = value > 0 ? value : undefined;

    changeStudentSection(newSectionID, studentEmail).then(() => {
      changedSectionStudents = changedSectionStudents.filter((i) => {
        return i !== studentEmail;
      });
      this.setState({ changedSectionStudents });
    });
  };

  public newStudentFieldOnChange = (value: string) => {
    this.setState({ newStudentField: value });
  };

  public toggleSort = () => {
    this.setState({ sortAscending: !this.state.sortAscending });
  };

  public changeSearch = (value: string) => {
    this.setState({ searchTerm: value });
  };

  public render() {
    const {
      rosterLoadComplete,
      lockedStudentChange,
      students,
      sections,
      sectionsByStudent,
      addErrorToast,
      addToast,
      changeRoster,
    } = this.props;
    const { newStudentField, changedSectionStudents, sortAscending, searchTerm } = this.state;

    const showSaveNewStudentButton = newStudentField && newStudentField.includes('@');

    const sectionMenuItems = sections.map((section) => {
      return { label: section.name, value: section.id };
    });
    sectionMenuItems.push({ label: '', value: -1 });

    const iconChanged = <FontIcon>track_changes</FontIcon>;
    const studentType = USER_APP.Student;

    let tableBody;
    if (rosterLoadComplete) {
      tableBody = students.map((student) => {
        const section = sectionsByStudent[student];
        const sectionID = section ? section.id : -1;
        const sectionName = section ? section.name : '';

        if (
          student.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1 &&
          sectionName.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1
        ) {
          return <div />;
        }

        let dropDown;
        let sectionDisable = false;

        if (changedSectionStudents.indexOf(student) !== -1) {
          dropDown = iconChanged;
          sectionDisable = true;
        } else {
          dropDown = undefined;
        }

        return (
          <TableRow key={student}>
            <TableColumn>{student}</TableColumn>
            <SelectFieldColumn
              dropdownIcon={dropDown}
              value={sectionID}
              menuItems={sectionMenuItems}
              disabled={lockedStudentChange || sectionDisable}
              onChange={this.rowSectionChange.bind(this.props, student)}
            />
            <TableColumn key={'UnEnroll'}>
              {' '}
              <Button
                key="unEnroll"
                className="Btn"
                flat={true}
                icon={true}
                disabled={lockedStudentChange}
                onClick={this.triggerUnEnrollUser.bind(this.props, student, studentType)}
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
          <TableColumn />
        </TableRow>
      );
    }

    if (sortAscending) {
      students.sort();
    } else {
      students.sort().reverse();
    }
    return (
      <div>
        <RosterFileUpload
          users={students}
          addErrorToast={addErrorToast}
          addToast={addToast}
          changeRoster={changeRoster}
          userType={USER_APP.Student}
        />
        <TextField
          id="addStudentField"
          label="Add Student"
          lineDirection="center"
          placeholder="Student's email"
          className="md-cell md-cell--bottom"
          value={newStudentField}
          onChange={this.newStudentFieldOnChange}
          disabled={lockedStudentChange}
        />
        <Button
          iconChildren="done"
          className="save-Btn"
          disabled={!showSaveNewStudentButton || lockedStudentChange}
          onClick={this.triggerEnrollUser.bind(this.props, newStudentField, studentType)}
        >
          Save new student
        </Button>
        <hr />
        <TextField
          id="search-manageStudents"
          label="Search"
          lineDirection="center"
          className="md-cell md-cell--bottom"
          onChange={this.changeSearch}
        />
        <DataTable className="Enroll-students-table" baseId="Enroll-students-table" plain={true}>
          <TableHeader>
            <TableRow selectable={false}>
              <TableColumn key={'Student'} sorted={sortAscending} onClick={this.toggleSort}>
                Student
              </TableColumn>
              <TableColumn key={'Section'}>Section</TableColumn>
              <TableColumn key={'UnEnroll'}>UnEnroll Student</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
      </div>
    );
  }
}

export default ManageStudents;
