import { Icon, Tooltip, Typography } from 'antd';
import * as moment from 'moment';
import * as React from 'react';
import { AnonymousSubmissionType, SubmissionType } from '../../infrastructure/submission';

import { openSubmission } from '../admin/AdminUtils';

const { Text } = Typography;

interface ISubDataBasic {
  grade: number | null;
  grader: string | null;
  isFinalized: boolean | null;
  finalizeIcon: React.ReactElement;
  dateEdited: string | null;
  dateEditedString: string;
  gradeString: React.ReactElement;
  submissionID: number | null;
}

// Get the viewIcon for a submission
const getViewIcon = (
  submission: SubmissionType,
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } },
  studentToLookup?: string,
) => {
  // case: submission not finalized, or before views were tracked
  if (!(submission.id in viewsBySubmission) || !submission.isFinalized) {
    return '--';
  }

  const views = viewsBySubmission[submission.id];

  // case: looking up a single student, and student has viewed the submission
  if (studentToLookup && studentToLookup in views) {
    return (
      <Tooltip title={moment(viewsBySubmission[submission.id][studentToLookup]).format('llll')}>
        <div>
          <Icon type="eye" theme="filled" />
        </div>
      </Tooltip>
    );
  }

  // case: looking up a single student, and student has not viewed the submission
  if (studentToLookup && !(studentToLookup in views)) {
    return <Icon type="eye-invisible" />;
  }

  // looking up for multiple students
  // get the tooltip label
  const getTooltipLabel = () => {
    switch (submission.students.length) {
      // For a single student submission we want only the date
      case 1:
        return moment(views[submission.students[0]]).format('llll');
      // For multiple students, we want the student name and the date
      default:
        return `${Object.keys(views)
          .map((student) => {
            return `${student} on ${moment(views[student]).format('llll')}`;
          })
          .join(', ')}`;
    }
  };

  switch (Object.keys(views).length) {
    // case: no student has viewed
    case 0:
      return <Icon type="eye-invisible" />;
    // case: all students have viewed
    case submission.students.length:
      return (
        <Tooltip title={getTooltipLabel()}>
          <div>
            <Icon type="eye" theme="filled" />
          </div>
        </Tooltip>
      );
    default:
      return (
        <Tooltip title={getTooltipLabel()}>
          <div>
            <Icon type="eye" theme="twoTone" twoToneColor="#646464" />
          </div>
        </Tooltip>
      );
  }
};

// Get the basic data of a submission
const formatSub = (sub: SubmissionType | AnonymousSubmissionType | undefined): ISubDataBasic => {
  const finalizeIcon = sub && sub.isFinalized ? <Icon type="check-circle" /> : <div />;

  const gradeText = sub ? (
    sub.isFinalized ? (
      <Text strong>{String(sub.grade)}</Text>
    ) : (
      <Text type="warning">Unfinalized</Text>
    )
  ) : (
    <Text>--</Text>
  );

  return {
    gradeString: gradeText,
    grader: sub ? sub.grader : '--',
    finalizeIcon: <div>{finalizeIcon}</div>,
    dateEditedString: sub ? moment(sub.dateEdited).format('llll') : '--',
    dateEdited: sub ? sub.dateEdited : null,
    grade: sub ? sub.grade : null,
    isFinalized: sub ? sub.isFinalized : null,
    submissionID: sub ? sub.id : null,
  };
};

// Get the openSubmission function of a submission
const openSubmissionRow = (record: ISubDataBasic) => {
  return {
    onClick: (e: Event) => {
      if (record.submissionID) {
        openSubmission(record.submissionID);
      }
    },
  };
};

export { getViewIcon, formatSub, ISubDataBasic, openSubmissionRow };
