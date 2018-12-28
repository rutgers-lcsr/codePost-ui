import * as React from 'react';
import { DataTable, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import { BUTTON_STATE, IAssignment, ISubmission2 } from '../../types/common';
import { GetAnotherSubmissionButton, StartGradingButton } from '../Buttons';

interface IProps {
  assignment?: IAssignment;
  submissions: ISubmission2[];
  isLoadingSubmissions: boolean;
  claimSubmission: (assignment: IAssignment) => any;
  releaseSubmission: (submission: ISubmission2) => any;
}

interface IState {
  buttonState: BUTTON_STATE;
}

class GradedTab extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    buttonState: BUTTON_STATE.Active,
  };

  public openGradePage = (submission: ISubmission2) => {
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
    this.props.claimSubmission(assignment).then((claimedSubmission: ISubmission2) => {
      // undefined if no more submissions
      if (!claimedSubmission) {
        console.log('No more submissions to claim');
        this.setState({ buttonState: BUTTON_STATE.Inactive });
      } else {
        this.setState({ buttonState: BUTTON_STATE.Active });
      }
    });
  };

  public releaseSubmission = (submission: ISubmission2) => {
    this.props.releaseSubmission(submission).then((releasedSubmission: ISubmission2) => {
      console.log('released', submission.id, releasedSubmission);
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
      return <div className="container-graded-tab">Loading..</div>;
    }

    if (assignment && submissions.length > 0) {
      return (
        <div className="container-graded-tab">
          <GetAnotherSubmissionButton
            handleClick={this.getAnotherSubmission}
            buttonState={buttonState}
          />
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
                    <TableColumn onClick={this.openGradePage.bind(this, submission)}>
                      {submission.grade}
                    </TableColumn>
                    <TableColumn onClick={this.openGradePage.bind(this, submission)}>
                      {submission.dateFinalized}
                    </TableColumn>
                    <TableColumn onClick={this.releaseSubmission.bind(this, submission)}>
                      <div className="button-release" />
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
        <div className="container-graded-tab">
          <StartGradingButton handleClick={this.getAnotherSubmission} buttonState={buttonState} />
        </div>
      );
    }
    return <div className="container-graded-tab">Select an assignment on the left</div>;
  }
}

export default GradedTab;
