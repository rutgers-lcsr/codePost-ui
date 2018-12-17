import * as React from 'react';
import { Button, DataTable, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import '../../styles/index.scss';
import { IAssignment, ISubmission, IUserSubmissionsMap } from '../../types/common';

interface IPropsGraderOverview {
  assignments: IAssignment[];
  submissionsByGrader: IUserSubmissionsMap;
  activeGrader: string | undefined;
  changeActiveGrader: (grader: string | undefined) => void;
  openSubmission: (submissionID: number | string) => void;
}

class GraderData extends React.Component<IPropsGraderOverview, {}> {
  public renderSubmissionRow(submission: ISubmission, assignment: IAssignment) {
    const { openSubmission } = this.props;
    let grade = 'Not submitted';
    if (submission && submission.isFinalized) {
      grade = String(submission.grade);
    } else if (submission) {
      grade = 'Not graded';
    }

    return (
      <TableRow key={submission.id} onClick={openSubmission.bind(this.props, submission.id)}>
        <TableColumn>{assignment.name}</TableColumn>
        <TableColumn>"students"</TableColumn>
        <TableColumn>{grade}</TableColumn>
      </TableRow>
    );
  }

  public render() {
    const { submissionsByGrader, assignments, activeGrader, changeActiveGrader } = this.props;

    const headers = this.props.assignments.map((assignment: IAssignment) => {
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
            {Object.keys(submissionsByGrader).map((graderID) => {
              return (
                <TableRow key={graderID} onClick={changeActiveGrader.bind(this.props, graderID)}>
                  <TableColumn>{submissionsByGrader[graderID].profile.username}</TableColumn>
                  {assignments.map((assignment) => {
                    const submissions =
                      submissionsByGrader[graderID].submissionsByAssignment[assignment.id];
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
      assignments.forEach((assignment) => {
        const submissions =
          submissionsByGrader[activeGrader].submissionsByAssignment[assignment.id];
        submissions.forEach((submission: ISubmission) => {
          tablemap.push(this.renderSubmissionRow(submission, assignment));
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
          <div>{submissionsByGrader[activeGrader].profile.username}</div>
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
