/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Icon, Tooltip, Typography } from 'antd';
const { Text } = Typography;

/* other library imports */
import * as moment from 'moment';

/* codePost imports */
import { AssignmentType } from '../../infrastructure/assignment';
import { AnonymousSubmissionType, SubmissionType } from '../../infrastructure/submission';

/**********************************************************************************************************************/

// Get the viewIcon for a submission
const getViewIcon = (
  submission: SubmissionType | null,
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } },
  studentToLookup?: string,
) => {
  // case: submission is null
  if (submission === null) {
    return '--';
  }

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

const sortByGrade = (
  a: { grade: number | null; isFinalized: boolean },
  b: { grade: number | null; isFinalized: boolean },
) => {
  if (a.grade === null) return -1;
  if (b.grade === null) return 1;
  if (!a.isFinalized) return -1;
  if (!b.isFinalized) return 1;
  return a.grade - b.grade;
};

interface ISubDataBasic {
  gradeText: string | React.ReactElement;
  grader: string | React.ReactElement;
  lastEdited: string;
  grade: number | null;
  isFinalized: boolean;
}

// Return submission data in form suitable for presenting in an antd table
const formatSub = (
  sub?: SubmissionType | AnonymousSubmissionType | null,
  assignment?: AssignmentType,
): ISubDataBasic => {
  if (sub === undefined || sub === null) {
    return {
      gradeText: '--',
      grade: null,
      isFinalized: false,
      grader: '--',
      lastEdited: '--',
    };
  } else {
    let gradeText;
    if (sub.isFinalized) {
      if (assignment !== undefined) {
        gradeText = <Text>{`${sub.grade}/${assignment.points}`}</Text>;
      } else {
        gradeText = <Text>{`${sub.grade}`}</Text>;
      }
    } else {
      gradeText = <Text type="warning">Unfinalized</Text>;
    }

    return {
      gradeText,
      grade: sub.grade,
      isFinalized: sub.isFinalized,
      grader: sub.grader ? sub.grader : <Text type="warning">Unclaimed</Text>,
      lastEdited: `${moment(sub.dateEdited).format('l')}, ${moment(sub.dateEdited).format('LT')}`,
    };
  }
};

export { getViewIcon, formatSub, sortByGrade, ISubDataBasic };
