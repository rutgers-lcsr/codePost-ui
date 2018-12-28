import * as React from 'react';
import { Button, DataTable, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import '../../styles/index.scss';
import { IAssignment3, IGraderSubmissionsDataTable, ISubmission3 } from '../../types/common';

interface IPropsGraderOverview {
  assignments: IAssignment3[];
  submissionsByGrader: IGraderSubmissionsDataTable;
  activeGrader: string | undefined;
  changeActiveGrader: (grader: string | undefined) => void;
  openSubmission: (submissionID: number | string) => void;
}

class GraderData extends React.Component<IPropsGraderOverview, {}> {
  public renderSubmissionRow(submission: ISubmission3, assignmentID: number) {
    const { openSubmission } = this.props;
    let grade = 'Not submitted';
    if (submission && submission.isFinalized) {
      grade = String(submission.grade);
    } else if (submission) {
      grade = 'Not graded';
    }

    return (
      <TableRow key={submission.id} onClick={openSubmission.bind(this.props, submission.id)}>
        <TableColumn>{assignmentID}</TableColumn>
        <TableColumn>{submission.students.toString()}</TableColumn>
        <TableColumn>{grade}</TableColumn>
      </TableRow>
    );
  }

  public render() {
    const { submissionsByGrader, assignments, activeGrader, changeActiveGrader } = this.props;

    const headers = this.props.assignments.map((assignment: IAssignment3) => {
      return assignment.name;
    });
    headers.unshift('Grader');

    if (!activeGrader) {
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
            {Object.keys(submissionsByGrader).map((graderEmail) => {
              return (
                <TableRow
                  key={graderEmail}
                  onClick={changeActiveGrader.bind(this.props, graderEmail)}
                >
                  <TableColumn>{graderEmail}</TableColumn>
                  {assignments.map((assignment) => {
                    const submissions = submissionsByGrader[graderEmail][assignment.id];
                    if (submissions) {
                      return <TableColumn>{submissions.length}</TableColumn>;
                    } else {
                      return <TableColumn> - </TableColumn>;
                    }
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </DataTable>
      );
    } else {
      const tablemap: any = [];
      Object.keys(submissionsByGrader[activeGrader]).forEach((assignmentID) => {
        const submissions = submissionsByGrader[activeGrader][assignmentID];
        submissions.forEach((submission: ISubmission3) => {
          tablemap.push(this.renderSubmissionRow(submission, Number(assignmentID)));
        });
      });
      return (
        <div>
          <hr />
          <Button
            key="Back"
            className="Btn"
            flat={true}
            icon={true}
            onClick={changeActiveGrader.bind(this.props, undefined)}
          >
            arrow_back
          </Button>
          <hr />
          <div>{activeGrader}</div>
          <hr />
          <DataTable plain={true}>
            <TableHeader>
              <TableRow>
                <TableColumn key={'Assignment'}>{'Assignment'}</TableColumn>
                <TableColumn key={'Student'}>{'Student'}</TableColumn>
                <TableColumn key={'Grade'}>{'Grade'}</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>{tablemap}</TableBody>
          </DataTable>
        </div>
      );
    }
  }
}

export default GraderData;
