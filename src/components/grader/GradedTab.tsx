import * as React from 'react';
import {
  DataTable,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
} from 'react-md';
import { ButtonState, IAssignment, ISubmission } from '../../types/common'
import { GetAnotherSubmissionButton, StartGradingButton } from '../Buttons'

interface IProps {
  assignment?: IAssignment,
  submissions: ISubmission[],
  claimSubmission: (assignment: IAssignment) => any,
  releaseSubmission: (submission: ISubmission) => any
}

interface IState {
  buttonState: ButtonState
}

class GradedTab extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    buttonState: ButtonState.Active
  }

  public openGradePage = () => {
    const w = window.open('/student/')
    console.log("w", w);
    // window.open("/grade/" + subid, 'test',
    //   'width=' + screen.availWidth * 0.9 + ',height=' + screen.availHeight * 0.9).resizeTo(screen.availWidth, screen.availHeight);
  };

  public getAnotherSubmission = () => {
    const { assignment } = this.props;
    if (!assignment) {
      return;
    }

    this.setState({ buttonState: ButtonState.Loading })
    const promise = this.props.claimSubmission(assignment);
    promise.then((claimedSubmission: ISubmission) => {
      // undefined if no more submissions
      if (!claimedSubmission) {
        console.log("No more submissions to claim");
        // this.setState({ buttonState: ButtonState.Inactive })
        this.setState({ buttonState: ButtonState.Active })
      }
      else {
        this.setState({ buttonState: ButtonState.Active })
      }
    });
  }

  public releaseSubmission = (submission: ISubmission) => {
    const promise = this.props.releaseSubmission(submission);
    promise.then((releasedSubmission: ISubmission) => {
      console.log("released", submission.id, releasedSubmission)
    });
  }

  public render() {
    const { assignment, submissions } = this.props;
    const { buttonState } = this.state;

    const headers = [
      'Student(s)',
      'Grade',
      'Date Finalized',
      'Release'
    ]

    if (assignment && submissions.length > 0) {
      return (
        <div>
          <hr />
          <div>
            <GetAnotherSubmissionButton handleClick={this.getAnotherSubmission} buttonState={buttonState} />
          </div>
          <hr />
          <DataTable plain={true}>
            <TableHeader>
              <TableRow>
                {headers.map(header => {
                  return (
                    <TableColumn key={header}>{header}</TableColumn>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map(submission => {
                return (
                  <TableRow key={submission.id}>
                    <TableColumn onClick={this.openGradePage}>{submission.students ? submission.students.map((student: any) => student.profile.username).join(',') : ""}</TableColumn>
                    <TableColumn onClick={this.openGradePage}>{submission.grade}</TableColumn>
                    <TableColumn onClick={this.openGradePage}>{submission.dateFinalized}</TableColumn>
                    <TableColumn onClick={this.releaseSubmission.bind(this, submission)}>RELEASE_BUTTON</TableColumn>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </div>
      );
    }
    else if (assignment) {
      return (
        <div>
          <StartGradingButton handleClick={this.getAnotherSubmission} buttonState={buttonState} />
        </div>
      );
    }
    else {
      return (
        <div>
          Select an assignment on the left
        </div >
      );
    }
  }
}

export default GradedTab;