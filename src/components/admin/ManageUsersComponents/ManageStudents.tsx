import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  TableBody,
  TableColumn,
  TableHeader,
  TablePagination,
  TableRow,
  TextField,
} from 'react-md';
import Select from 'react-select';

import { IOptionNumber, ISectionNoStudents, USER_APP } from '../../../types/common';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';

import RosterFileUpload from './RosterFileUpload';

interface IProps {
  sections: SectionType[];
  students: string[];
  rosterLoadComplete: boolean;
  sectionsLoadComplete: boolean;
  lockedStudentChange: boolean;
  toggleLock: () => void;
  currentCourse: CourseType | undefined;
  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
  enrollUser: (email: string, type: USER_APP) => Promise<void>;
  unEnrollUsers: (emails: string[], type: USER_APP) => Promise<void>;
  sectionsByStudent: { [studentEmail: string]: ISectionNoStudents };
  changeStudentSection: (sectionID: number | undefined, studentEmail: string) => Promise<SectionType>;
  changeRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
}

interface IState {
  newStudentField: string | undefined;
  changedSectionStudents: string[];
  searchTerm: string;
  sectionEdited: string | undefined;
  paginatedStudents: string[];
  sortedStudents: string[];
  paginationStart: number | undefined;
  rowsPerPage: number | undefined;
}

class ManageStudents extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newStudentField: undefined,
    changedSectionStudents: [],
    searchTerm: '',
    sectionEdited: undefined,
    paginatedStudents: [],
    sortedStudents: [],
    paginationStart: undefined,
    rowsPerPage: undefined,
  };

  public componentDidMount() {
    if (this.props.rosterLoadComplete) {
      const sortedStudents = JSON.parse(JSON.stringify(this.props.students));
      sortedStudents.sort();
      this.setState({ sortedStudents });
    }
  }

  public componentDidUpdate(prevProps: IProps, prevState: IState) {
    if (this.props.students !== prevProps.students) {
      const sortedStudents = JSON.parse(JSON.stringify(this.props.students));
      sortedStudents.sort();
      this.setState({ sortedStudents }, () => {
        // if props change, update pagination
        if (!(typeof this.state.paginationStart === 'undefined') && !(typeof this.state.rowsPerPage === 'undefined')) {
          this.handlePagination(this.state.paginationStart, this.state.rowsPerPage);
        }
      });
    }
  }

  /////

  public triggerUnEnrollUser = (newStudentEmail: string, studentType: USER_APP) => {
    const { unEnrollUsers } = this.props;

    unEnrollUsers([newStudentEmail], studentType);
  };

  public triggerEnrollUser = (newStudentEmail: string, studentType: USER_APP) => {
    this.props.enrollUser(newStudentEmail, studentType);
    this.setState({ newStudentField: '' });
  };

  public rowSectionChange = (studentEmail: string, newSection: IOptionNumber) => {
    let { changedSectionStudents } = this.state;
    const { changeStudentSection } = this.props;

    changedSectionStudents.push(studentEmail);
    this.setState({ changedSectionStudents });

    const newSectionID = newSection.value > 0 ? newSection.value : undefined;

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

  public changeSearch = (value: string) => {
    this.setState({ searchTerm: value });
    if (value.length > 0) {
      this.setState({ paginationStart: undefined, rowsPerPage: undefined });
    }
  };

  public editSection = (value: string) => {
    this.setState({ sectionEdited: value });
  };

  public clearSection = () => {
    this.setState({ sectionEdited: undefined });
  };

  public handlePagination = (start: number, rowsPerPage: number) => {
    const { sortedStudents } = this.state;
    this.setState({
      paginatedStudents: sortedStudents.slice(start, start + rowsPerPage),
      paginationStart: start,
      rowsPerPage,
    });
  };

  public render() {
    const {
      rosterLoadComplete,
      sectionsLoadComplete,
      lockedStudentChange,
      sections,
      sectionsByStudent,
      addErrorToast,
      addToast,
      changeRoster,
    } = this.props;
    const { newStudentField, paginatedStudents, searchTerm, changedSectionStudents, sortedStudents } = this.state;

    const showSaveNewStudentButton = newStudentField && newStudentField.includes('@');

    const sectionMenuItems = sections.map((section) => {
      return { label: section.name, value: section.id };
    });
    sectionMenuItems.push({ label: '', value: -1 });
    const studentType = USER_APP.Student;

    let studentsToRender;
    // If search term, filter students by those who meet search term and render those students
    if (searchTerm.length > 0) {
      studentsToRender = sortedStudents.filter((s) => {
        const section = sectionsByStudent[s];
        const sectionName = section ? section.name : '   ';
        return (
          s.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
          sectionName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
        );
      });
    } else {
      // If no paginated students, render those. If not, take the default pagination (20) and return those students
      studentsToRender = paginatedStudents.length > 0 ? paginatedStudents : this.state.sortedStudents.slice(0, 10);
    }

    let tableBody;
    if (rosterLoadComplete && sectionsLoadComplete) {
      tableBody = studentsToRender.map((student) => {
        const section = sectionsByStudent[student];
        const sectionID = section ? section.id : -1;
        const sectionName = section ? section.name : '   ';
        const sectionDisable = changedSectionStudents.indexOf(student) !== -1 ? true : false;

        const sectionSelect =
          this.state.sectionEdited === student && !lockedStudentChange ? (
            <TableColumn>
              <Select
                classNamePrefix="select--StudentSections"
                closeMenuOnSelect={true}
                options={sectionMenuItems}
                disabled={lockedStudentChange}
                onChange={this.rowSectionChange.bind(this.props, student)}
                placeholder=""
                value={{ label: sectionName, value: sectionID }}
                onBlur={this.clearSection}
                isLoading={sectionDisable}
              />
            </TableColumn>
          ) : (
            <TableColumn onClick={this.editSection.bind(this.props, student)}>{sectionName}</TableColumn>
          );

        return (
          <TableRow key={student}>
            <TableColumn>{student}</TableColumn>
            {sectionSelect}
            <TableColumn key={'UnEnroll'}>
              <Button
                key="unEnroll"
                className="Btn"
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
    }

    return (
      <div className="roster-student">
        <div className="roster-student__top-container">
          <div>
            <TextField
              id="addStudentField"
              label="Add Student"
              lineDirection="center"
              placeholder="Student's email"
              className="roster-student__addUser__Field"
              value={newStudentField}
              onChange={this.newStudentFieldOnChange}
              disabled={lockedStudentChange}
            />
            <Button
              flat={true}
              iconChildren="done"
              disabled={!showSaveNewStudentButton || lockedStudentChange}
              className="roster-student__addUser__Btn"
              onClick={this.triggerEnrollUser.bind(this.props, newStudentField, studentType)}
            >
              Save new student
            </Button>
          </div>
          <RosterFileUpload
            users={this.props.students}
            addErrorToast={addErrorToast}
            addToast={addToast}
            changeRoster={changeRoster}
            userType={USER_APP.Student}
            isDisabled={lockedStudentChange}
          />
        </div>
        <TextField
          id="search-manageStudents"
          label="Search"
          lineDirection="center"
          className="md-cell md-cell--bottom"
          onChange={this.changeSearch}
        />
        {rosterLoadComplete && sectionsLoadComplete ? (
          <DataTable className="DataTable--ManageUsers" baseId="Enroll-students-table" plain={true}>
            {searchTerm.length === 0 ? (
              <TablePagination
                className="DataTable--ManageUsers__pagination"
                rows={this.state.sortedStudents.length}
                defaultRowsPerPage={10}
                onPagination={this.handlePagination}
              />
            ) : (
              <div />
            )}
            <TableHeader>
              <TableRow selectable={false}>
                <TableColumn key={'Student'}>Student</TableColumn>
                <TableColumn key={'Section'}>Section</TableColumn>
                <TableColumn key={'UnEnroll'}>UnEnroll Student</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>{tableBody}</TableBody>
          </DataTable>
        ) : (
          <CircularProgress id="progress" className="progress-circle" />
        )}
      </div>
    );
  }
}

export default ManageStudents;
