// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import React from 'react';

dayjs.extend(localizedFormat);

/* antd imports */
import { EyeFilled, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Typography } from 'antd';

/* codePost imports */
import CPTooltip from '../core/CPTooltip';

import { AssignmentType, AnonymousSubmissionInfoType, SubmissionInfoType, SubmissionType } from '../../types/models';

const { Text } = Typography;

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

export interface ISubDataBasic {
  gradeText: string | React.ReactElement;
  grader: string | React.ReactElement;
  lastEdited: string;
  grade: number | null;
  isFinalized: boolean;
}

type ViewsBySubmission = {
  [submissionID: number]: {
    [student: string]: string;
  };
};

type SubmissionWithStudents = {
  id: number;
  students: (string | null | undefined)[];
  isFinalized?: boolean;
};

type GradeInfo = {
  grade: number | null;
  isFinalized: boolean;
};

/**********************************************************************************************************************/
/* Helper Functions
/**********************************************************************************************************************/

/**
 * Generate tooltip label for view icons based on submission and views
 */
const getTooltipLabel = (submission: SubmissionWithStudents, views: { [student: string]: string }): string => {
  if (submission.students.length === 1) {
    // For a single student submission we want only the date
    const student = submission.students[0];
    return student ? dayjs(views[student]).format('llll') : '--';
  }

  // For multiple students, we want the student name and the date
  return Object.keys(views)
    .map((student) => `${student} on ${dayjs(views[student]).format('llll')}`)
    .join(', ');
};

/**
 * Get the view icon for a submission
 * Returns an icon indicating whether students have viewed their finalized submission
 */
const getViewIcon = (
  submission: SubmissionType | SubmissionInfoType | null,
  viewsBySubmission: ViewsBySubmission,
  studentToLookup?: string,
): string | React.ReactElement => {
  // Case: submission is null
  if (submission === null) {
    return '--';
  }

  // Case: submission not finalized, or before views were tracked
  if (!(submission.id in viewsBySubmission) || !submission.isFinalized) {
    return '--';
  }

  const views = viewsBySubmission[submission.id];

  // Case: looking up a single student, and student has viewed the submission
  if (studentToLookup && studentToLookup in views) {
    const viewedTime = dayjs(views[studentToLookup]).format('llll');
    return (
      <CPTooltip title={viewedTime}>
        <EyeFilled />
      </CPTooltip>
    );
  }

  // Case: looking up a single student, and student has not viewed the submission
  if (studentToLookup && !(studentToLookup in views)) {
    return <EyeInvisibleOutlined />;
  }

  // Looking up for multiple students
  const viewCount = Object.keys(views).length;
  const totalStudents = submission.students.length;

  // Case: no student has viewed
  if (viewCount === 0) {
    return <EyeInvisibleOutlined />;
  }

  // Case: all students have viewed
  if (viewCount === totalStudents) {
    return (
      <CPTooltip title={getTooltipLabel(submission, views)}>
        <EyeFilled />
      </CPTooltip>
    );
  }

  // Case: some students have viewed
  return (
    <CPTooltip title={getTooltipLabel(submission, views)}>
      <EyeTwoTone twoToneColor="#646464" />
    </CPTooltip>
  );
};

/**
 * Sort submissions by grade
 * Sorts null grades first, then unfinalized submissions, then by grade ascending
 */
const sortByGrade = (a: GradeInfo, b: GradeInfo): number => {
  if (a.grade === null && b.grade === null) return 0;
  if (a.grade === null) return -1;
  if (b.grade === null) return 1;
  if (!a.isFinalized) return -1;
  if (!b.isFinalized) return 1;
  return a.grade - b.grade;
};

/**
 * Format grade text based on submission state
 */
const formatGradeText = (
  sub: SubmissionType | SubmissionInfoType | AnonymousSubmissionInfoType,
  assignment?: AssignmentType,
): React.ReactElement => {
  if (sub.isFinalized) {
    const gradeDisplay = assignment ? `${sub.grade}/${assignment.points}` : `${sub.grade}`;
    return <Text style={{ fontVariantNumeric: 'tabular-nums' }}>{gradeDisplay}</Text>;
  }

  // Secondary text (the theme's 0.6 alpha clears AA); the old 0.45 / 0.3 alphas did not.
  if (sub.grader) {
    return (
      <Text strong type="secondary">
        Unfinalized
      </Text>
    );
  }

  return (
    <Text type="secondary" italic>
      Unclaimed
    </Text>
  );
};

/**
 * Format grader text based on submission state
 */
const formatGraderText = (grader: string | null | undefined): string | React.ReactElement => {
  return grader ? (
    grader
  ) : (
    <Text type="secondary" italic>
      Unclaimed
    </Text>
  );
};

/**
 * Format date edited text
 */
const formatLastEdited = (dateEdited: string): string => {
  return `${dayjs(dateEdited).format('l')}, ${dayjs(dateEdited).format('LT')}`;
};

/**
 * Return submission data in form suitable for presenting in an antd table
 */
const formatSub = (
  sub?: SubmissionType | SubmissionInfoType | AnonymousSubmissionInfoType | null,
  assignment?: AssignmentType,
): ISubDataBasic => {
  // Handle null or undefined submissions
  if (sub === undefined || sub === null) {
    return {
      gradeText: '--',
      grade: null,
      isFinalized: false,
      grader: '--',
      lastEdited: '--',
    };
  }

  return {
    gradeText: formatGradeText(sub, assignment),
    grade: sub.grade,
    isFinalized: !!sub.isFinalized,
    grader: formatGraderText(sub.grader),
    lastEdited: formatLastEdited(sub.dateEdited),
  };
};

/**********************************************************************************************************************/
/* Exports
/**********************************************************************************************************************/

/** The caller's queue counts a staff assignment payload carries (see types/common Assignment). */
export interface CallerCounts {
  queueLength?: number;
  myFinalizedCount?: number;
  myUnfinalizedCount?: number;
}

/** Work first: the caller's unfinalized claims, then the queue, then the course order (stable sort). */
export const sortByWork = <T extends CallerCounts>(ordered: T[]): T[] =>
  [...ordered].sort(
    (a, b) => (b.myUnfinalizedCount ?? 0) - (a.myUnfinalizedCount ?? 0) || (b.queueLength ?? 0) - (a.queueLength ?? 0),
  );

/** A count the API sent, or a dash — never a zero it did not send. */
export const countCell = (n: number | undefined): React.ReactNode =>
  typeof n === 'number' ? n : <Typography.Text type="secondary">—</Typography.Text>;

export { formatSub, getViewIcon, sortByGrade };
