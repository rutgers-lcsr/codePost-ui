/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';

/* react-md imports */
import { DialogContainer } from 'react-md';

/* codePost imports */
import UploadSubmissionBulkDialog from './UploadSubmissionBulkDialog';
import UploadSubmissionDialog from './UploadSubmissionDialog';

import { AssignmentType } from '../../../infrastructure/assignment';
import { SubmissionType } from '../../../infrastructure/submission';

/**********************************************************************************************************************/

interface IState {
  shownTab: number;
}

interface IProps {
  onCancel: () => void;
  assignment: AssignmentType;
  submissions: SubmissionType[];
  students: string[];
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<SubmissionType>;
}

class UploadManager extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    shownTab: 0,
  };

  public onCancel = () => {
    this.props.onCancel();
  };

  public changeTab = (newTab: number) => {
    this.setState({ shownTab: newTab });
  };

  public render() {
    let buttons;
    if (this.state.shownTab === 0) {
      buttons = (
        <div>
          <button onClick={this.onCancel}>Cancel</button>
          &nbsp;&nbsp;
          <button onClick={this.changeTab.bind(this, 1)}>Single submission</button>
          &nbsp;&nbsp;
          <button onClick={this.changeTab.bind(this, 2)}>Multiple submissions</button>
        </div>
      );
    } else {
      buttons = (
        <div>
          <button onClick={this.changeTab.bind(this, 0)}>Back</button>
          <br />
          <br />
        </div>
      );
    }
    return (
      <DialogContainer
        id="rubricFile-dialog"
        className="dialog--upload-submission"
        visible={true}
        title="Upload Submissions"
        onHide={this.onCancel}
      >
        {buttons}
        <UploadSubmissionDialog
          isVisible={this.state.shownTab === 1}
          onCancel={this.onCancel}
          assignments={[this.props.assignment]}
          selectedAssignment={this.props.assignment}
          students={this.props.students}
          uploadSubmission={this.props.uploadSubmission}
          selectedStudents={[]}
          submissions={this.props.submissions}
        />
        <UploadSubmissionBulkDialog
          isVisible={this.state.shownTab === 2}
          assignment={this.props.assignment}
          students={this.props.students}
          onCancel={this.onCancel}
          submissions={this.props.submissions}
          uploadSubmission={this.props.uploadSubmission}
        />
      </DialogContainer>
    );
  }
}
export default UploadManager;
