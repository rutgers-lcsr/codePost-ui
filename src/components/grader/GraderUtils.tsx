/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Icon, Typography } from 'antd';

/* other library imports */
import moment from 'moment';

/* codePost imports */
import { AssignmentType } from '../../infrastructure/assignment';
import {
  AnonymousSubmissionType,
  SubmissionType,
} from '../../infrastructure/submission';

import CPTooltip from '../core/CPTooltip';

const { Text } = Typography;

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
      <CPTooltip
        title={moment(viewsBySubmission[submission.id][studentToLookup]).format(
          'llll',
        )}>
        <div>
          <Icon type='eye' theme='filled' />
        </div>
      </CPTooltip>
    );
  }

  // case: looking up a single student, and student has not viewed the submission
  if (studentToLookup && !(studentToLookup in views)) {
    return <Icon type='eye-invisible' />;
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
      return <Icon type='eye-invisible' />;
    // case: all students have viewed
    case submission.students.length:
      return (
        <CPTooltip title={getTooltipLabel()}>
          <div>
            <Icon type='eye' theme='filled' />
          </div>
        </CPTooltip>
      );
    default:
      return (
        <CPTooltip title={getTooltipLabel()}>
          <div>
            <Icon type='eye' theme='twoTone' twoToneColor='#646464' />
          </div>
        </CPTooltip>
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

export interface ISubDataBasic {
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
    } else if (sub.grader) {
      gradeText = <Text type='warning'>Unfinalized</Text>;
    } else {
      gradeText = <Text type='warning'>Unclaimed</Text>;
    }

    return {
      gradeText,
      grade: sub.grade,
      isFinalized: sub.isFinalized,
      grader: sub.grader ? sub.grader : <Text type='warning'>Unclaimed</Text>,
      lastEdited: `${moment(sub.dateEdited).format('l')}, ${moment(
        sub.dateEdited,
      ).format('LT')}`,
    };
  }
};

export { getViewIcon, formatSub, sortByGrade };
