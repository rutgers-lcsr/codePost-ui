import * as React from 'react';
import { Button, DataTable, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import '../../styles/index.scss';
import { IAssignment, IUserSubmissionsMap } from '../../types/common';

interface IPropsStudentOverview {
  assignments: IAssignment[];
  submissionsByStudent: IUserSubmissionsMap;
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
      changeActiveStudent,
      openSubmission,
    } = this.props;
    const headers = assignments.map((assignment: IAssignment) => {
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
            {Object.keys(submissionsByStudent).map((studentID) => {
              return (
                <TableRow key={studentID} onClick={changeActiveStudent.bind(this.props, studentID)}>
                  <TableColumn>{submissionsByStudent[studentID].profile.username}</TableColumn>
                  {this.props.assignments.map((assignment) => {
                    const submission =
                      submissionsByStudent[studentID].submissionsByAssignment[assignment.id];
                    if (submission && submission.isFinalized) {
                      return (
                        <TableColumn key={`${studentID}-grade`}>{submission.grade}</TableColumn>
                      );
                    }
                    if (submission) {
                      return <TableColumn key={`${studentID}-grade`}>Not graded</TableColumn>;
                    }
                    return <TableColumn key={`${studentID}-grade`}>Not submitted</TableColumn>;
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </DataTable>
      );
    }
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
        <div>{submissionsByStudent[activeStudent].profile.username}</div>
        <hr />
        <DataTable plain={true}>
          <TableHeader>
            <TableRow>
              <TableColumn key={'Assignment'}>{'Assignment'}</TableColumn>
              <TableColumn key={'Grade'}>{'Grade'}</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => {
              const submission =
                submissionsByStudent[activeStudent].submissionsByAssignment[assignment.id];
              let grade = 'Not submitted';
              if (submission && submission.isFinalized) {
                grade = submission.grade;
              } else if (submission) {
                grade = 'Not graded';
              }
              return (
                <TableRow
                  key={assignment.id}
                  onClick={openSubmission.bind(this.props, submission.id)}
                >
                  <TableColumn>{assignment.name}</TableColumn>
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

export default StudentData;
