import * as React from 'react';
import { Button, DataTable, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import { BUTTON_STATE } from '../../types/common';
import { GetAnotherSubmissionButton, StartGradingButton } from '../Buttons';

import { AssignmentType } from '../../infrastructure/assignment';
import { SubmissionType } from '../../infrastructure/submission';

interface IProps {
  assignment?: AssignmentType;
  submissions: SubmissionType[];
  isLoadingSubmissions: boolean;
  claimSubmission: (assignment: AssignmentType) => Promise<SubmissionType>;
  releaseSubmission: (submission: SubmissionType) => Promise<SubmissionType>;
}

interface IState {
  buttonState: BUTTON_STATE;
}

class GraderAssignmentPanel extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    buttonState: BUTTON_STATE.Active,
  };

  public openGradePage = (submission: SubmissionType) => {
    window.open(`/grade/${submission.id}`);
    // window.open("/grade/" + subid, 'test',
    // 'width=' + screen.availWidth * 0.9 + ',
    // height=' + screen.availHeight * 0.9).resizeTo(screen.availWidth, screen.availHeight);
  };

  public getAnotherSubmission = () => {
    const { assignment } = this.props;
    if (!assignment) {
      return;
    }

    this.setState({ buttonState: BUTTON_STATE.Loading });
    this.props.claimSubmission(assignment).then((claimedSubmission: SubmissionType) => {
      // undefined if no more submissions
      if (!claimedSubmission) {
        this.setState({ buttonState: BUTTON_STATE.Inactive });
      } else {
        this.setState({ buttonState: BUTTON_STATE.Active });
      }
    });
  };

  public releaseSubmission = (submission: SubmissionType) => {
    this.props.releaseSubmission(submission).then((releasedSubmission: SubmissionType) => {
      this.setState({ buttonState: BUTTON_STATE.Active });
    });
  };

  public render() {
    const { assignment, submissions, isLoadingSubmissions } = this.props;
    const { buttonState } = this.state;

    const headers = ['Student(s)', 'Grade', 'Date Finalized', 'Release'];

    const style = {
      cursor: 'pointer',
    };

    if (isLoadingSubmissions) {
      return <div>Loading..</div>;
    }

    if (assignment && submissions.length > 0) {
      return (
        <div>
          <GetAnotherSubmissionButton handleClick={this.getAnotherSubmission} buttonState={buttonState} />
          <DataTable plain={true}>
            <TableHeader>
              <TableRow>
                {headers.map((header) => {
                  return <TableColumn key={header}>{header}</TableColumn>;
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => {
                return (
                  <TableRow key={submission.id} style={style}>
                    {/****** consider making each column its own component to prevent binds */}
                    <TableColumn onClick={this.openGradePage.bind(this, submission)}>
                      {submission.students.join(',')}
                    </TableColumn>
                    <TableColumn onClick={this.openGradePage.bind(this, submission)}>{submission.grade}</TableColumn>
                    <TableColumn onClick={this.openGradePage.bind(this, submission)}>
                      {submission.dateFinalized}
                    </TableColumn>
                    <TableColumn onClick={this.releaseSubmission.bind(this, submission)}>
                      <Button key={`button--release-${submission.id}`} className="button--release" icon={true}>
                        remove_circle
                      </Button>
                    </TableColumn>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </div>
      );
    }
    if (assignment) {
      return (
        <div>
          <StartGradingButton handleClick={this.getAnotherSubmission} buttonState={buttonState} />
        </div>
      );
    }
    return <div>Select an assignment on the left</div>;
  }
}

export default GraderAssignmentPanel;
