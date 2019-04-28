import React from 'react';
import { DialogContainer } from 'react-md';
// import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import UploadSubmissionBulkDialog from './UploadSubmissionBulkDialog';

import { AssignmentType } from '../../../infrastructure/assignment';
import { SubmissionType } from '../../../infrastructure/submission';
// import UploadSubmissionDialog from './UploadSubmissionDialog';

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

  public render() {
    return (
      <DialogContainer
        id="rubricFile-dialog"
        className="dialog--upload-submission"
        visible={true}
        title="Upload Submissions"
        onHide={this.onCancel}
      >
        <UploadSubmissionBulkDialog
          isVisible={true}
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

// <Tabs defaultIndex={this.state.shownTab}>
//   <TabList className="tabList--CourseData">
//     <Tab className="tabList--Upload__tab">Single Submission</Tab>
//     <Tab className="tabList--Upload__tab">Multiple Submissions</Tab>
//   </TabList>
//   <TabPanel>
//     <div className="tabList--Upload__panelPadding" />
//     <UploadSubmissionBulkDialog
//       isVisible={true}
//       assignment={this.props.assignment}
//       students={this.props.students}
//       onCancel={this.onCancel}
//       submissions={this.props.submissions}
//       uploadSubmission={this.props.uploadSubmission}
//     />
//   </TabPanel>
//   <TabPanel>
//     <div className="tabList--Upload__panelPadding" />
//   </TabPanel>
// </Tabs>;
