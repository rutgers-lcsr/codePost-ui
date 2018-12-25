import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  FontIcon,
  SelectFieldColumn,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';
import '../../styles/index.scss';
import { ICourse3, ISection3, ISectionNoStudents, UserEnum } from '../../types/common';

interface IProps {
  sections: ISection3[];
  students: string[];
  studentsLoadComplete: boolean;
  lockedStudentChange: boolean;
  toggleLock: () => void;
  currentCourse: ICourse3 | undefined;
  addToast: (text: string, action: string | undefined) => void;
  enrollUser: (email: string, type: UserEnum) => void;
  unEnrollUsers: (emails: string[], type: UserEnum) => void;
  sectionsByStudent: { [studentEmail: string]: ISectionNoStudents };
  addStudentToSection: (sectionID: number, studentEmail: string) => Promise<{}>;
}

interface IState {
  newStudentField: string | undefined;
  changedSectionStudents: string[];
  studentSortAscending: boolean;
  searchTerm: string;
}

class ManageStudents extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newStudentField: undefined,
    changedSectionStudents: [],
    studentSortAscending: true,
    searchTerm: '',
  };

  public triggerUnEnrollUser = (newStudentEmail: string, studentType: UserEnum) => {
    const { unEnrollUsers } = this.props;

    unEnrollUsers([newStudentEmail], studentType);
  };

  public triggerEnrollUser = (newStudentEmail: string, studentType: UserEnum) => {
    this.props.enrollUser(newStudentEmail, studentType);
    this.setState({ newStudentField: '' });
  };

  public rowSectionChange = (studentEmail: string, value: number) => {
    let { changedSectionStudents } = this.state;
    const { addStudentToSection } = this.props;

    changedSectionStudents.push(studentEmail);
    this.setState({ changedSectionStudents });

    addStudentToSection(value, studentEmail).then(() => {
      changedSectionStudents = changedSectionStudents.filter((i) => {
        return i !== studentEmail;
      });
      this.setState({ changedSectionStudents });
    });
  };

  public newStudentFieldOnChange = (value: string) => {
    this.setState({ newStudentField: value });
  };

  public toggleStudentSort = () => {
    this.setState({ studentSortAscending: !this.state.studentSortAscending });
  };

  public changeSearch = (value: string) => {
    this.setState({ searchTerm: value });
  };

  public render() {
    const {
      studentsLoadComplete,
      lockedStudentChange,
      students,
      sections,
      sectionsByStudent,
    } = this.props;
    const {
      newStudentField,
      changedSectionStudents,
      studentSortAscending,
      searchTerm,
    } = this.state;

    const lockIcon = lockedStudentChange ? 'lock' : 'lock_open';

    const showSaveNewStudentButton = newStudentField && newStudentField.includes('@');

    const sectionMenuItems = sections.map((section) => {
      return { label: section.name, value: section.id };
    });

    const iconChanged = <FontIcon>track_changes</FontIcon>;
    const studentType = UserEnum.Student;

    if (studentsLoadComplete && students) {
      const sortedStudents = students;
      if (studentSortAscending) {
        sortedStudents.sort();
      } else {
        sortedStudents.sort().reverse();
      }
      return (
        <div>
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
                <TableColumn key={'Student'} sorted={true} onClick={this.toggleStudentSort}>
                  Student
                </TableColumn>
                <TableColumn key={'Section'}>Section</TableColumn>
                <TableColumn key={'UnEnroll'}>UnEnroll Student</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const section = sectionsByStudent[student];
                const sectionID = section ? section.id : '';
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

export default ManageStudents;
