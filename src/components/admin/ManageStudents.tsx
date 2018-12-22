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
  selectedStudents: string[];
  changedSectionStudents: string[];
}

class ManageStudents extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newStudentField: undefined,
    selectedStudents: [],
    changedSectionStudents: [],
  };

  public triggerUnEnrollStudents = () => {
    const { selectedStudents } = this.state;
    const { unEnrollUsers } = this.props;

    const studentType = UserEnum.Student;

    if (selectedStudents) {
      unEnrollUsers(selectedStudents, studentType);
      // Reminder to fix: Potentially could create problems if parent fails
      // to delete one of the selected ids and it looks selected but no longer is on the backend
      this.setState({ selectedStudents: [] });
    }
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

  public rowSelect = (studentID: string, rowID: number, checked: boolean) => {
    const { selectedStudents } = this.state;
    if (checked) {
      selectedStudents.push(studentID);
      this.setState({ selectedStudents });
      // Reminder: We should throw an error if the numSelected is
      // different than our array at any point
    } else {
      const newSelectedStudents = selectedStudents.filter((value) => {
        return value !== studentID;
      });
      this.setState({ selectedStudents: newSelectedStudents });
    }
  };

  public newStudentFieldOnChange = (value: string) => {
    this.setState({ newStudentField: value });
  };

  public render() {
    const {
      studentsLoadComplete,
      lockedStudentChange,
      students,
      sections,
      sectionsByStudent,
    } = this.props;
    const { newStudentField, selectedStudents, changedSectionStudents } = this.state;

    const lockIcon = lockedStudentChange ? 'lock' : 'lock_open';

    const showSaveNewStudentButton = newStudentField && newStudentField.includes('@');

    const sectionMenuItems = sections.map((section) => {
      return { label: section.name, value: section.id };
    });

    const iconChanged = <FontIcon>track_changes</FontIcon>;
    const studentType = UserEnum.Student;

    if (studentsLoadComplete && students) {
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
          <Button
            iconChildren="delete"
            className="delete-Btn"
            disabled={lockedStudentChange || selectedStudents.length === 0}
            onClick={this.triggerUnEnrollStudents}
          >
            Unenroll selected
          </Button>
          <hr />
          <DataTable className="Enroll-students-table" baseId="Enroll-students-table">
            <TableHeader>
              <TableRow selectable={false}>
                <TableColumn key={'Filler'} />
                <TableColumn key={'Student'}>Student</TableColumn>
                <TableColumn key={'Section'}>Section</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const section = sectionsByStudent[student];
                const sectionID = section ? section.id : '';

                let dropDown;
                let sectionDisable = false;

                if (changedSectionStudents.indexOf(student) !== -1) {
                  dropDown = iconChanged;
                  sectionDisable = true;
                } else {
                  dropDown = undefined;
                }

                return (
                  <TableRow
                    key={student}
                    onCheckboxClick={this.rowSelect.bind(this.props, student)}
                  >
                    <TableColumn>{student}</TableColumn>
                    <SelectFieldColumn
                      dropdownIcon={dropDown}
                      value={sectionID}
                      menuItems={sectionMenuItems}
                      disabled={lockedStudentChange || sectionDisable}
                      onChange={this.rowSectionChange.bind(this.props, student)}
                    />
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
