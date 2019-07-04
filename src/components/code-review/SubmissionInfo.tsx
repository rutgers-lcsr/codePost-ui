import * as React from 'react';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

import { AssignmentType } from '../../infrastructure/assignment';
import { AnonymousSubmissionType, SubmissionType } from '../../infrastructure/submission';

import { Students, SubheaderGrader } from './Subheader';

import * as moment from 'moment';

interface IFileMenuProps {
  title?: string;
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
  graders: string[];
  isCourseAdmin: boolean;
  updateGrader: (submission: AnonymousSubmissionType, graderUsername: string | undefined) => Promise<SubmissionType>;
}

class SubmissionInfo extends React.Component<IFileMenuProps, {}> {
  public render() {
    return (
      <div id="file-menu" style={{ overflowY: 'scroll' }}>
        {this.props.title ? (
          <div style={{ padding: '13px 20px 0px 16px' }}>
            <div className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
              {this.props.title}
            </div>
          </div>
        ) : null}
        <div style={{ overflowY: 'scroll', paddingLeft: 15, fontSize: 12 }}>
          Students: <Students submission={this.props.submission} isAnonymous={this.props.assignment.anonymousGrading} />
          <br />
          <br />
          Grader:{' '}
          <SubheaderGrader
            submission={this.props.submission}
            isCourseAdmin={this.props.isCourseAdmin}
            graders={this.props.graders}
            updateGrader={this.props.updateGrader}
          />
          <br />
          <br />
          Last edited:{' '}
          {this.props.submission.dateEdited ? moment(this.props.submission.dateEdited).format('lll') : '--'}
        </div>
      </div>
    );
  }
}

SubmissionInfo.contextType = ConsoleThemeContext;

export default SubmissionInfo;
