import * as React from 'react';
import {
  Button,
  DataTable,
  DialogContainer,
  FontIcon,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';

import Select from 'react-select';

import { IOption, IStudentSubmissionsDataTable } from '../../../types/common';

import { AssignmentType } from '../../../infrastructure/assignment';
import { SubmissionType } from '../../../infrastructure/submission';

interface IPropsStudentOverview {
  assignments: AssignmentType[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  activeStudent: string | undefined;
  changeActiveStudent: (student: string | undefined) => void;
  openSubmission: (submissionID: number | string) => void;
  submissionsbyUserLoadComplete: boolean;
  assignmentsLoadComplete: boolean;
  deleteSubmission: (submission: SubmissionType) => void;
  graders: string[];
  changeSubmissionGrader: (submission: SubmissionType, grader: string | undefined) => void;
}

interface IState {
  sortedIndex: { [index: string]: boolean | undefined };
  searchTerm: string;
  deleteSub: SubmissionType | null;
}

class StudentData extends React.Component<IPropsStudentOverview, IState> {
  public studentHeader = 'student';

  public constructor(props: any) {
    super(props);
    const sortedIndex = {};
    this.props.assignments.forEach((assn) => {
      sortedIndex[assn.name] = undefined;
    });
    sortedIndex[this.studentHeader] = true;

    this.state = { sortedIndex, searchTerm: '', deleteSub: null };
  }

  public componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.assignments !== this.props.assignments && !prevProps.assignmentsLoadComplete) {
      const sortedIndex = {};
      this.props.assignments.forEach((assn) => {
        sortedIndex[assn.name] = undefined;
      });
      sortedIndex[this.studentHeader] = true;
      this.setState({ sortedIndex });
    }
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
          if (studentAsub.grade !== null && studentBsub.grade !== null) {
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
          if (studentAsub.grade !== null && studentBsub.grade !== null) {
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

  public toggleDeleteSub = (sub: SubmissionType | null) => {
    this.setState({ deleteSub: sub });
  };

  public changeSearch = (value: string) => {
    this.setState({ searchTerm: value });
  };

  public onGraderChange = (sub: SubmissionType, selectedOption: IOption) => {
    this.props.changeSubmissionGrader(sub, selectedOption.label);
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

    if (!assignmentsLoadComplete || !submissionsbyUserLoadComplete) {
      return <div>Loading..</div>;
    }

    const sortedAssignments: AssignmentType[] = JSON.parse(JSON.stringify(assignments));

    sortedAssignments.sort((a: any, b: any) => {
      if (a.id > b.id) return 1;
      else if (a.id === b.id) return 0;
      return -1;
    });

    const headers = sortedAssignments.map((assignment: AssignmentType) => {
      return assignment.name;
    });
    headers.unshift(this.studentHeader);

    const students = Object.keys(submissionsByStudent);
    students.sort(this.sortFunction);

    if (!activeStudent) {
      const tableBody = students.map((studentEmail) => {
        if (studentEmail.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) {
          return <div />;
        }
        return (
          <TableRow key={studentEmail} onClick={changeActiveStudent.bind(this.props, studentEmail)}>
            <TableColumn key={studentEmail} plain={true}>
              {studentEmail}
            </TableColumn>
            {sortedAssignments.map((assignment) => {
              const submission = submissionsByStudent[studentEmail][assignment.id];
              if (submission && submission.isFinalized) {
                return (
                  <TableColumn key={assignment.name} plain={true}>
                    {submission.grade}
                  </TableColumn>
                );
              } else if (submission) {
                return (
                  <TableColumn key={assignment.name} plain={true}>
                    Not graded
                  </TableColumn>
                );
              } else {
                return (
                  <TableColumn key={assignment.name} plain={true}>
                    Not submitted
                  </TableColumn>
                );
              }
            })}
          </TableRow>
        );
      });

      return (
        <div>
          <h3 className="md-cell md-cell--bottom"> Submission grades by student. </h3>
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
                      plain={true}
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
      const graderOptions = this.props.graders.map((el: string) => {
        return { label: el, value: el };
      });
      const studentAssignments = Object.keys(submissionsByStudent[activeStudent]);
      studentAssignments.sort((a, b) => {
        if (parseInt(a, 10) > parseInt(b, 10)) return 1;
        if (parseInt(a, 10) < parseInt(b, 10)) return -1;
        return 0;
      });
      const studentSubmissions = studentAssignments.map((assignmentID) => {
        const submission = submissionsByStudent[activeStudent][assignmentID];
        let grade = 'Not submitted';
        if (submission && submission.isFinalized) {
          grade = String(submission.grade);
        } else if (submission) {
          grade = 'Not graded';
        }

        const cellClick = openSubmission.bind(this.props, submission.id);
        return (
          <TableRow key={submission.id.toString()}>
            <TableColumn onClick={cellClick} tooltipLabel="Click to open submission." tooltipDelay={1500}>
              {
                assignments.filter((assignment) => {
                  return assignment.id === parseInt(assignmentID, 10);
                })[0].name
              }
            </TableColumn>
            <TableColumn onClick={cellClick} tooltipLabel="Click to open submission." tooltipDelay={1500}>
              {grade}
            </TableColumn>
            <TableColumn>
              <Select
                value={{ label: submission.grader, value: submission.grader }}
                options={graderOptions}
                onChange={this.onGraderChange.bind(this.props, submission)}
              />
            </TableColumn>
            <TableColumn onClick={cellClick} tooltipLabel="Click to open submission." tooltipDelay={1500}>
              {submission.isFinalized ? <FontIcon>done</FontIcon> : null}
            </TableColumn>
            <TableColumn>
              <Button
                key={`button--deleteSubmission-${submission.id}`}
                onClick={this.toggleDeleteSub.bind(this.props, submission)}
                className="button--deleteSubmission"
                tooltipLabel="Delete Submission"
                tooltipDelay={250}
                icon={true}
              >
                delete
              </Button>
            </TableColumn>
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
                <TableColumn key="Assignment">Assignment</TableColumn>
                <TableColumn key="Grade">Grade</TableColumn>
                <TableColumn key="Grader">Grader'</TableColumn>
                <TableColumn key="Finalized">Finalized</TableColumn>
                <TableColumn key="Delete">Delete</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>{studentSubmissions}</TableBody>
          </DataTable>

          <DialogContainer
            visible={this.state.deleteSub !== null}
            id="deleteSubmission-dialog"
            className="Dialog--deleteSubmission"
            title="Warning: Delete submission action cannot be undone"
            onHide={this.toggleDeleteSub.bind(this.props, null)}
            modal
          >
            <div>Are you sure you want to delete this submission? </div>
            <Button onClick={this.toggleDeleteSub.bind(this.props, null)} primary={true} flat={true}>
              Cancel
            </Button>
            <Button
              onClick={this.props.deleteSubmission.bind(this.props, this.state.deleteSub)}
              primary={false}
              flat={true}
            >
              Delete
            </Button>
          </DialogContainer>
        </div>
      );
    }
  }
}

export default StudentData;
