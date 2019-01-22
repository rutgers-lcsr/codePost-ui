import * as React from 'react';
import { Button, DataTable, TableBody, TableColumn, TableHeader, TableRow, TextField } from 'react-md';

import { IStudentSubmissionsDataTable } from '../../../types/common';

import { AssignmentType } from '../../../infrastructure/assignment';

interface IPropsStudentOverview {
  assignments: AssignmentType[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  activeStudent: string | undefined;
  changeActiveStudent: (student: string | undefined) => void;
  openSubmission: (submissionID: number | string) => void;
  submissionsbyUserLoadComplete: boolean;
  assignmentsLoadComplete: boolean;
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
      sortedIndex[assn.name] = false;
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
      const assignmentName = Object.keys(sortedIndex).filter((key) => {
        return typeof sortedIndex[key] !== 'undefined';
      })[0];
      const assignmentIndex = this.props.assignments
        .map((i) => {
          return i.name;
        })
        .indexOf(assignmentName);
      if (assignmentIndex === -1) return 0;
      const assignmentID = this.props.assignments[assignmentIndex].id;
      const studentAsub = submissionsByStudent[a][assignmentID];
      const studentBsub = submissionsByStudent[b][assignmentID];
      if (sortedIndex[assignmentName]) {
        if (!studentAsub && studentBsub) return -1;
        if (studentAsub && !studentBsub) return 1;
        if (!studentAsub && !studentBsub) return 0;
        if (studentAsub.isFinalized && studentBsub.isFinalized) {
          if (typeof studentAsub.grade !== 'undefined' && typeof studentBsub.grade !== 'undefined') {
            if (studentAsub.grade < studentBsub.grade) return -1;
            if (studentAsub.grade > studentBsub.grade) return 1;
          }
          return 0;
        } else if (studentAsub.isFinalized && !studentBsub.isFinalized) return 1;
        else if (!studentAsub.isFinalized && studentBsub.isFinalized) return -1;
        return 0;
      } else {
        if (!studentAsub && studentBsub) return 1;
        if (studentAsub && !studentBsub) return -1;
        if (!studentAsub && !studentBsub) return 0;

        if (studentAsub.isFinalized && studentBsub.isFinalized && studentAsub.grade) {
          if (typeof studentAsub.grade !== 'undefined' && typeof studentBsub.grade !== 'undefined') {
            if (studentAsub.grade < studentBsub.grade) return 1;
            if (studentAsub.grade > studentBsub.grade) return -1;
          }
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
      submissionsbyUserLoadComplete,
      assignmentsLoadComplete,
    } = this.props;
    const { sortedIndex, searchTerm } = this.state;
    const headers = assignments.map((assignment: AssignmentType) => {
      return assignment.name;
    });
    headers.unshift(this.studentHeader);

    const students = Object.keys(submissionsByStudent);
    students.sort(this.sortFunction);

    const tableBody =
      submissionsbyUserLoadComplete && assignmentsLoadComplete ? (
        students.map((studentEmail) => {
          if (studentEmail.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) {
            return <div />;
          }
          return (
            <TableRow key={studentEmail} onClick={changeActiveStudent.bind(this.props, studentEmail)}>
              <TableColumn key={studentEmail}>{studentEmail}</TableColumn>
              {this.props.assignments.map((assignment) => {
                const submission = submissionsByStudent[studentEmail][assignment.id];
                if (submission && submission.isFinalized) {
                  return <TableColumn key={assignment.name}>{submission.grade}</TableColumn>;
                } else if (submission) {
                  return <TableColumn key={assignment.name}>Not graded</TableColumn>;
                } else {
                  return <TableColumn key={assignment.name}>Not submitted</TableColumn>;
                }
              })}
            </TableRow>
          );
        })
      ) : (
        <TableRow>
          <TableColumn>Loading...</TableColumn>
          <TableColumn />
          <TableColumn />
          <TableColumn />
        </TableRow>
      );

    if (!activeStudent) {
      return (
        <div>
          <TextField
            id="search-studentData"
            label="Search"
            lineDirection="center"
            className="md-cell md-cell--bottom"
            onChange={this.changeSearch}
          />
          <DataTable plain={true} className="DataTable--StudentData-All">
            <TableHeader>
              <TableRow key={'index'}>
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
            <TableBody>{tableBody}</TableBody>
          </DataTable>
        </div>
      );
    } else {
      const studentSubmissions = Object.keys(submissionsByStudent[activeStudent]).map((assignmentID) => {
        const submission = submissionsByStudent[activeStudent][assignmentID];
        let grade = 'Not submitted';
        if (submission && submission.isFinalized) {
          grade = String(submission.grade);
        } else if (submission) {
          grade = 'Not graded';
        }
        return (
          <TableRow key={submission.id.toString()} onClick={openSubmission.bind(this.props, submission.id)}>
            <TableColumn>
              {
                assignments.filter((assignment) => {
                  return assignment.id === parseInt(assignmentID, 10);
                })[0].name
              }
            </TableColumn>
            <TableColumn>{grade}</TableColumn>
          </TableRow>
        );
      });

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
          <DataTable plain={true} className="DataTable--StudentData-Selected">
            <TableHeader>
              <TableRow>
                <TableColumn>{'Assignment'}</TableColumn>
                <TableColumn>{'Grade'}</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>{studentSubmissions}</TableBody>
          </DataTable>
        </div>
      );
    }
  }
}

export default StudentData;
