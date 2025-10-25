import React from 'react';

import { CodeOutlined, UploadOutlined } from '@ant-design/icons';

import { Drawer, Spin } from 'antd';

/* codePost imports */
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { SubmissionInfoType } from '../../../../../infrastructure/submission';
import { IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../../../../types/common';

import { openSubmission } from '../../../other/AdminUtils';

import CPButton from '../../../../core/CPButton';
import Loading from '../../../../core/Loading';

import { TableDetail } from '../../../other/TableDetail';

export interface IFullStats extends IGradingProgressStats {
  median: number | null; // Median of all finalized submissions
  mean: number | null; // Mean of all finalized submissions
  max: number | null; // Max grade of all finalized submissions
  min: number | null; // Min grade of all finalized submissions
}

// We have views where summary stats are not needed (ManageAssignments table)
// so we separate the calculations to speed up this render
export interface IGradingProgressStats {
  numSubmissions: number; // Total number of submissions
  numGraded: number; // Number of finalized submissions
  numInProgress: number; // Number of submissions that have been claimed but not finalized
  numUnclaimed: number; // Number of submissions that have not been claimed
  numMissing: number; // Number of students with missing submissions
  numUnviewed: number | null; // Number of students who have not viewed their finalized submissions
  numViewed: number | null; // Number of students who have viewed their submissions
}

export interface IAssignmentProgressStatsMap {
  [assignmentID: number]: IGradingProgressStats;
}

export enum DRAWER_TYPE {
  Submitted,
  Graded,
  InProgress,
  Unclaimed,
  Missing,
  Unviewed,
  Viewed,
  None,
}

/******************************************************************************
 * Calculating stats
 ******************************************************************************/

// Calculate Grading Progress Stats for multiple assignments
export const calculateMultipleAssignmentProgressStats = (
  assignments: AssignmentType[],
  submissions: IAssignmentToSubmissionsMap,
  submissionsByStudent: IStudentSubmissionsDataTable,
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } },
  activeStudents: string[],
  useCache: boolean,
) => {
  const toRet: IAssignmentProgressStatsMap = {};
  assignments.forEach((assignment) => {
    const stats = calculateGradingProgressStats(
      assignment,
      submissions.hasOwnProperty(assignment.id) ? submissions[assignment.id] : null,
      submissionsByStudent,
      viewsBySubmission,
      activeStudents,
      useCache,
    );
    toRet[assignment.id] = stats;
  });
  return toRet;
};

/* Calculate Full stats (progress + grade stats) */
export const calculateFullStats = (
  assignment: AssignmentType,
  submissions: SubmissionInfoType[] | null,
  submissionsByStudent: IStudentSubmissionsDataTable,
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } },
  activeStudents: string[],
): IFullStats => {
  const assignmentSubs = submissions;

  const progressStats = calculateGradingProgressStats(
    assignment,
    submissions,
    submissionsByStudent,
    viewsBySubmission,
    activeStudents,
    false,
  );

  let totalScore = 0;
  // Calculate Summary statistics if includeSummaryStats is true.
  // We don't want to slow down the ManageAssignments stats calculations
  let max: number | null = null;
  let min: number | null = null;
  let mean: number | null = null;
  let median: number | null = null;

  if (assignmentSubs === null) {
    return {
      ...progressStats,
      mean: assignment.stats_mean ? assignment.stats_mean : 0,
      median,
      max: assignment.stats_max ? assignment.stats_max : 0,
      min: assignment.stats_min ? assignment.stats_min : 0,
    };
  }

  assignmentSubs.forEach((submission: SubmissionInfoType) => {
    if (submission.isFinalized && submission.grade !== null) {
      totalScore += submission.grade;
      if (max === null || submission.grade > max) max = submission.grade;
      if (min === null || submission.grade < min) min = submission.grade;
    }
  });

  // Get Mean and Median stats. If the assignment is released, we take the mean and median calculated by the API
  // so that students will see the same stats that admins see.
  // If the assignment is not released, we want to calculate it across all finalized submissions.
  if (typeof assignment.mean === 'number' && typeof assignment.median === 'number') {
    mean = assignment.mean;
    median = assignment.median;
  } else {
    if (progressStats.numGraded === 0) {
      mean = 0;
      median = 0;
    } else {
      // calculate mean
      mean = parseFloat((totalScore / progressStats.numGraded).toPrecision(2));

      // calculate median
      const sortedFinalized = assignmentSubs.reduce((grades: number[], sub: SubmissionInfoType) => {
        if (sub.isFinalized && sub.grade !== null) {
          grades.push(sub.grade);
        }
        return grades;
      }, []);

      sortedFinalized.sort();
      const index = Math.floor(sortedFinalized.length / 2);

      // if odd, get the index, if even average the two middle elements
      if (sortedFinalized.length % 2) {
        median = sortedFinalized[index];
      } else {
        median = (sortedFinalized[index - 1] + sortedFinalized[index]) / 2;
      }
    }
  }

  return {
    ...progressStats,
    mean,
    median,
    max,
    min,
  };
};

/* Calculate Grading Progress stats only */
export const calculateGradingProgressStats = (
  assignment: AssignmentType,
  submissions: SubmissionInfoType[] | null,
  submissionsByStudent: IStudentSubmissionsDataTable,
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } },
  activeStudents: string[],
  useCache: boolean,
): IGradingProgressStats => {
  if (useCache || submissions === null) {
    return {
      numSubmissions: assignment.submissions_count ? assignment.submissions_count : 0,
      numGraded: assignment.submissions_finalized_count ? assignment.submissions_finalized_count : 0,
      numInProgress: assignment.submissions_inprogress_count ? assignment.submissions_inprogress_count : 0,
      numUnclaimed: assignment.submissions_unclaimed_count ? assignment.submissions_unclaimed_count : 0,
      numMissing: assignment.submissions_missing_count ? assignment.submissions_missing_count : 0,
      numUnviewed: null,
      numViewed: null,
    };
  }

  // Deduplicate submissions by ID before calculating stats
  const uniqueSubmissionsMap = new Map<number, SubmissionInfoType>();
  submissions.forEach((sub) => {
    uniqueSubmissionsMap.set(sub.id, sub);
  });
  const assignmentSubs = Array.from(uniqueSubmissionsMap.values());
  const numSubmissions = assignmentSubs.length;

  let numGraded = 0;
  let numInProgress = 0;
  let numUnclaimed = 0;
  let numUnviewed = 0;
  let numViewed = 0;

  assignmentSubs.forEach((submission: SubmissionInfoType) => {
    if (submission.isFinalized) {
      numGraded += 1;
    } else if (submission.grader) {
      numInProgress += 1;
    } else {
      numUnclaimed += 1;
    }
    if (submission.id in viewsBySubmission) {
      submission.students.forEach((student) => {
        if (student in viewsBySubmission[submission.id]) {
          numViewed += 1;
        } else if (
          assignment.isReleased &&
          student in submissionsByStudent &&
          submissionsByStudent[student][assignment.id] &&
          submissionsByStudent[student][assignment.id].isFinalized
        ) {
          // Only count as unviewed if the assignment is released
          // Student is 'unviewed' if: (a) his/her submission has a History object
          //                           (b) student's email is not in viewsBySubmission
          //                           (c) student's submission is finalized
          numUnviewed += 1;
        }
      });
    }
  });

  // submissionsByStudent includes inactive students, so we need to check enrollment before including in missing
  // Array.includes() is O(N), so that could approach N^2 if there's a lot of missing submissions (future assignment)
  // Instead, we create a set in O(N) and perform each check in O(1)
  const studentsSet = new Set(activeStudents);

  const numMissing = Object.keys(submissionsByStudent).reduce((missing: number, student: string) => {
    if (!submissionsByStudent[student][assignment.id] && studentsSet.has(student)) {
      return missing + 1;
    }
    return missing;
  }, 0);

  return {
    numSubmissions,
    numGraded,
    numInProgress,
    numUnclaimed,
    numMissing,
    numUnviewed,
    numViewed,
  };
};

/******************************************************************************
 * Drawer Functions
 ******************************************************************************/

// This function is called to return the list of students that meet a certain stat type
export const filterDataByStat = (
  assignment: AssignmentType,
  submissionsByStudent: IStudentSubmissionsDataTable,
  type: DRAWER_TYPE,
  subs: SubmissionInfoType[],
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } },
  studentList: string[],
) => {
  switch (type) {
    case DRAWER_TYPE.Submitted:
      return subs.map((sub: SubmissionInfoType) => {
        return { email: sub.students.join(', '), subID: sub.id };
      });
    case DRAWER_TYPE.Graded:
      return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionInfoType) => {
        if (sub && sub.isFinalized) {
          students.push({ email: sub.students.join(', '), subID: sub.id });
        }
        return students;
      }, []);
    case DRAWER_TYPE.InProgress:
      return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionInfoType) => {
        if (sub && !sub.isFinalized && sub.grader) {
          students.push({ email: sub.students.join(', '), subID: sub.id });
        }
        return students;
      }, []);
    case DRAWER_TYPE.Unclaimed:
      return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionInfoType) => {
        if (sub && !sub.isFinalized && !sub.grader) {
          students.push({ email: sub.students.join(', '), subID: sub.id });
        }
        return students;
      }, []);
    case DRAWER_TYPE.Missing:
      return Object.keys(submissionsByStudent).reduce(
        (students: Array<{ email: string; subID: number | null }>, student: string) => {
          if (studentList.indexOf(student) > -1 && !submissionsByStudent[student][assignment.id]) {
            students.push({ email: student, subID: null });
          }
          return students;
        },
        [],
      );
    case DRAWER_TYPE.Unviewed:
      return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionInfoType) => {
        // Append a student if: (a) his/her submission has a History object
        //                      (b) student's email is not in viewsBySubmission
        //                      (c) student's submission is finalized
        if (sub && sub.id in viewsBySubmission) {
          sub.students.forEach((student) => {
            if (
              !(student in viewsBySubmission[sub.id]) &&
              submissionsByStudent[student][assignment.id] &&
              submissionsByStudent[student][assignment.id].isFinalized
            ) {
              students.push({ email: student, subID: sub.id });
            }
          });
        }
        return students;
      }, []);
    case DRAWER_TYPE.Viewed:
      return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionInfoType) => {
        // Append a student if: (a) his/her submission has a History object
        //                      (b) student's email is in viewsBySubmission
        if (sub && sub.id in viewsBySubmission) {
          sub.students.forEach((student) => {
            if (student in viewsBySubmission[sub.id]) {
              students.push({ email: student, subID: sub.id });
            }
          });
        }
        return students;
      }, []);
    default:
      return [];
  }
};

// Get the subtitle text to pass to the drawer
export const getDrawerTitle = (type: DRAWER_TYPE, contentLength: number | null, isLoading?: boolean) => {
  const detail = isLoading ? <Spin /> : contentLength === null ? '' : `(${contentLength})`;
  switch (type) {
    case DRAWER_TYPE.Submitted:
      return <span>Total Submissions {detail}</span>;
    case DRAWER_TYPE.Graded:
      return <span>Finalized Submissions {detail}</span>;
    case DRAWER_TYPE.InProgress:
      return <span>Draft Submissions {detail}</span>;
    case DRAWER_TYPE.Unclaimed:
      return <span>Unclaimed Submissions {detail}</span>;
    case DRAWER_TYPE.Missing:
      return <span>Students missing a submission {detail}</span>;
    case DRAWER_TYPE.Unviewed:
      return <span>Unviewed submissions {detail}</span>;
    case DRAWER_TYPE.Viewed:
      return <span>Unviewed submissions {detail}</span>;
    default:
      return <span />;
  }
};

export const StatsDrawer = (props: {
  type: DRAWER_TYPE;
  content: {
    title: string;
    subtitle: React.ReactNode;
    content: Array<{ email: string; subID: number | null }> | null;
  };
  onClose: () => void;
  isVisible: boolean;
  uploadSubmission?: (assignmentName: string, students: string) => void;
  loadComplete: boolean;
}) => {
  const actionLabel = props.type === DRAWER_TYPE.Missing ? 'Upload' : 'Open';
  let body = <Loading />;
  let actualSubtitle = props.content.subtitle;

  if (props.content.content !== null) {
    const columns = [
      {
        title: 'Students',
        dataIndex: 'students',
        key: 'students',
        ...(props.loadComplete && { sorter: (a: any, b: any) => a.students.localeCompare(b.students) }),
      },
      {
        title: actionLabel,
        dataIndex: 'action',
        key: 'action',
      },
    ];

    // Deduplicate by creating a unique key from email and subID
    const uniqueContent = props.content.content.filter((row, index, self) => {
      return index === self.findIndex((r) => r.email === row.email && r.subID === row.subID);
    });

    // Recalculate subtitle with actual deduplicated count
    actualSubtitle = getDrawerTitle(props.type, uniqueContent.length, false);

    const data = uniqueContent.map((row) => {
      let actionElement;
      if (actionLabel === 'Open') {
        const action = () => openSubmission(row.subID!);
        actionElement = <CodeOutlined onClick={action} />;
      } else if (actionLabel === 'Upload') {
        const action = () => {
          if (props.uploadSubmission) {
            props.uploadSubmission(props.content.title, row.email);
          }
        };
        actionElement = (
          <CPButton style={{ margin: '-8px' }} onClick={action}>
            <UploadOutlined /> Upload
          </CPButton>
        );
      }

      return {
        key: `${row.email}-${row.subID}`,
        students: row.email,
        action: actionElement,
      };
    });

    body = (
      <TableDetail
        columns={columns}
        data={data}
        loadComplete={props.content.content !== null}
        isEmpty={false}
        title={<div />}
        emptyNode={<div />}
        actions={[]}
        tableOnly={true}
      />
    );
  }

  return (
    <Drawer
      title={
        <span>
          {props.content.title} | {actualSubtitle}
        </span>
      }
      placement="right"
      closable={true}
      onClose={props.onClose}
      open={props.isVisible}
      width={600}
      styles={{
        body: { paddingBottom: 0 },
      }}
    >
      {body}
    </Drawer>
  );
};
