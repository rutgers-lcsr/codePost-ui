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
import { IAssignment3, IStudentSubmissionsDataTable } from '../../types/common';

interface IPropsStudentOverview {
  assignments: IAssignment3[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  activeStudent: string | undefined;
  changeActiveStudent: (student: string | undefined) => void;
  openSubmission: (submissionID: number | string) => void;
}

interface IState {
  sortedIndex: { [index: string]: boolean | undefined };
  searchTerm: string;
}

class StudentData extends React.Component<IPropsStudentOverview, {}> {
  public state: Readonly<IState> = {
    sortedIndex: {},
    searchTerm: '',
  };

  public studentHeader = 'student';

  public constructor(props: any) {
    super(props);
    const sortedIndex = {};
    this.props.assignments.forEach((assn) => {
      sortedIndex[assn.id] = false;
    });
    sortedIndex[this.studentHeader] = true;
    this.state = { sortedIndex, searchTerm: '' };
  }

  public toggleSort = (assignmentName: string) => {
    const { sortedIndex } = this.state;
    Object.keys(sortedIndex).map((key) => {
      if (key === assignmentName) {
        if (typeof sortedIndex[key] === 'undefined') {
          sortedIndex[key] = true;
        } else {
          sortedIndex[key] = !sortedIndex[key];
        }
      } else {
        sortedIndex[key] = undefined;
      }
    });
    this.setState({ sortedIndex });
  };

  public sortFunction = (a: string, b: string) => {
    const { sortedIndex } = this.state;
    const { submissionsByStudent } = this.props;
    if (typeof sortedIndex[this.studentHeader] !== 'undefined') {
      if (sortedIndex[this.studentHeader] === true) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      } else {
        if (a < b) return 1;
        if (a > b) return -1;
        return 0;
      }
    } else {
      const assignmentID = Object.keys(sortedIndex).filter((key) => {
        return typeof sortedIndex[key] !== 'undefined';
      })[0];
      const studentAsub = submissionsByStudent[a][assignmentID];
      const studentBsub = submissionsByStudent[b][assignmentID];
      if (sortedIndex[assignmentID]) {
        if (!studentAsub && studentBsub) return -1;
        if (studentAsub && !studentBsub) return 1;
        if (!studentAsub && !studentBsub) return 0;
        if (studentAsub.isFinalized && studentBsub.isFinalized) {
          if (studentAsub.grade < studentBsub.grade) return -1;
          if (studentAsub.grade > studentBsub.grade) return 1;
          return 0;
        } else if (studentAsub.isFinalized && !studentBsub.isFinalized) return 1;
        else if (!studentAsub.isFinalized && studentBsub.isFinalized) return -1;
        return 0;
      } else {
        if (!studentAsub && studentBsub) return 1;
        if (studentAsub && !studentBsub) return -1;
        if (!studentAsub && !studentBsub) return 0;
        if (studentAsub.isFinalized && studentBsub.isFinalized) {
          if (studentAsub.grade < studentBsub.grade) return 1;
          if (studentAsub.grade > studentBsub.grade) return -1;
          return 0;
        } else if (studentAsub.isFinalized && !studentBsub.isFinalized) return -1;
        else if (!studentAsub.isFinalized && studentBsub.isFinalized) return 1;
        return 0;
      }
    }
  };

  public changeSearch = (value: string) => {
    this.setState({ searchTerm: value });
  };

  public render() {
    const {
      submissionsByStudent,
      assignments,
      activeStudent,
      openSubmission,
      changeActiveStudent,
    } = this.props;
    const { sortedIndex, searchTerm } = this.state;
    const headers = assignments.map((assignment: IAssignment3) => {
      return String(assignment.id);
    });
    headers.unshift(this.studentHeader);

    if (!activeStudent) {
      const students = Object.keys(submissionsByStudent);
      students.sort(this.sortFunction);
      return (
        <div>
          <TextField
            id="search-manageAdmins"
            label="Search"
            lineDirection="center"
            className="md-cell md-cell--bottom"
            onChange={this.changeSearch}
          />
          <DataTable plain={true}>
            <TableHeader>
              <TableRow>
                {headers.map((header) => {
                  return (
                    <TableColumn
                      sorted={sortedIndex[header]}
                      onClick={this.toggleSort.bind(this.props, header)}
                      key={header}
                    >
                      {header}
                    </TableColumn>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((studentEmail) => {
                if (studentEmail.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) {
                  return <div />;
                }
                return (
                  <TableRow
                    key={studentEmail}
                    onClick={changeActiveStudent.bind(this.props, studentEmail)}
                  >
                    <TableColumn>{studentEmail}</TableColumn>
                    {this.props.assignments.map((assignment) => {
                      const submission = submissionsByStudent[studentEmail][assignment.id];
                      if (submission && submission.isFinalized) {
                        return <TableColumn>{submission.grade}</TableColumn>;
                      } else if (submission) {
                        return <TableColumn>Not graded</TableColumn>;
                      } else {
                        return <TableColumn>Not submitted</TableColumn>;
                      }
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </div>
      );
    } else {
      // const submissionRows: any = [];
      // assignments.forEach((assignment) => {
      //   const submission = submissionsByStudent[activeStudent][assignment.id];
      //   if (submission) {
      //     console.log(submission);
      //     let grade = 'Not submitted';
      //     if (submission && submission.isFinalized) {
      //       grade = String(submission.grade);
      //     } else if (submission) {
      //       grade = 'Not graded';
      //     }
      //     submissionRows.push(
      //       <TableRow key={assignment.id}
      // onClick={openSubmission.bind(this.props, submission.id)}>
      //         <TableColumn>{assignment.name}</TableColumn>
      //         <TableColumn>{grade}</TableColumn>
      //       </TableRow>,
      //     );
      //   }
      // });
      return (
        <div>
          <hr />
          <Button
            key="Back"
            className="Btn"
            flat={true}
            icon={true}
            onClick={changeActiveStudent.bind(this.props, undefined)}
          >
            arrow_back
          </Button>
          <div>{activeStudent}</div>
          <hr />
          <DataTable plain={true}>
            <TableHeader>
              <TableRow>
                <TableColumn key={'Assignment'}>{'Assignment'}</TableColumn>
                <TableColumn key={'Grade'}>{'Grade'}</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(submissionsByStudent[activeStudent]).map((assignmentID) => {
                const submission = submissionsByStudent[activeStudent][assignmentID];
                console.log(submission);
                let grade = 'Not submitted';
                if (submission && submission.isFinalized) {
                  grade = String(submission.grade);
                } else if (submission) {
                  grade = 'Not graded';
                }
                return (
                  <TableRow
                    key={submission.id}
                    onClick={openSubmission.bind(this.props, submission.id)}
                  >
                    <TableColumn>{assignmentID}</TableColumn>
                    <TableColumn>{grade}</TableColumn>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </div>
      );
    }
  }
}

export default StudentData;
