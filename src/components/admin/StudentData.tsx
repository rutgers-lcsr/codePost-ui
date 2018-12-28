import * as React from 'react';
import { Button, DataTable, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import '../../styles/index.scss';
import { IAssignment3, IStudentSubmissionsDataTable } from '../../types/common';

interface IPropsStudentOverview {
  assignments: IAssignment3[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  activeStudent: string | undefined;
  changeActiveStudent: (student: string | undefined) => void;
  openSubmission: (submissionID: number | string) => void;
}

class StudentData extends React.Component<IPropsStudentOverview, {}> {
  public render() {
    const {
      submissionsByStudent,
      assignments,
      activeStudent,
      openSubmission,
      changeActiveStudent,
    } = this.props;
    const headers = assignments.map((assignment: IAssignment3) => {
      return assignment.name;
    });
    headers.unshift('Student');

    if (!activeStudent) {
      return (
        <DataTable plain={true}>
          <TableHeader>
            <TableRow>
              {headers.map((header) => {
                return <TableColumn key={header}>{header}</TableColumn>;
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(submissionsByStudent).map((studentEmail) => {
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
