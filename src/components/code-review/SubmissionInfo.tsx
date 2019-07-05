import * as React from 'react';

import moment from 'moment';

import { AssignmentType } from '../../infrastructure/assignment';
import { AnonymousSubmissionType, SubmissionType } from '../../infrastructure/submission';

import { Students, SubheaderGrader } from './Subheader';

interface IFileMenuProps {
  title?: string;
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
  graders: string[];
  isCourseAdmin: boolean;
  updateGrader: (submission: AnonymousSubmissionType, graderUsername: string | undefined) => Promise<SubmissionType>;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SubmissionInfo = (props: IFileMenuProps) => {
  let lastEdited;
  if (props.submission.dateEdited) {
    const dateObj = new Date(props.submission.dateEdited);
    const today = new Date();
    if (dateObj.getFullYear() === today.getFullYear()) {
      if (dateObj.getMonth() === today.getMonth() && dateObj.getDate() === today.getDate()) {
        if (today.getTime() - dateObj.getTime() < 30000) {
          lastEdited = 'Last edited moments ago';
        } else {
          lastEdited = `Last edit at ${moment(dateObj).format('h:mm a')}`;
        }
      } else {
        lastEdited = `Last edit on ${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
      }
    } else {
      lastEdited = `Last edit in ${dateObj.getFullYear()}`;
    }
  }

  return (
    <div>
      {props.title ? (
        <div style={{ padding: '13px 20px 0px 16px', marginBottom: 5 }}>
          <span className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
            {props.title}
          </span>
          &nbsp;
          <span style={{ fontSize: '12px', color: '#ccc' }}>{lastEdited}</span>
        </div>
      ) : null}
      <div style={{ paddingLeft: 15, fontSize: 12 }}>
        <b>Students</b>: <Students submission={props.submission} isAnonymous={props.assignment.anonymousGrading} />
        <br />
        <b>Grader</b>:{' '}
        <SubheaderGrader
          submission={props.submission}
          isCourseAdmin={props.isCourseAdmin}
          graders={props.graders}
          updateGrader={props.updateGrader}
        />
      </div>
    </div>
  );
};

export default SubmissionInfo;
