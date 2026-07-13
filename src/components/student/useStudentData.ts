// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import { useCallback, useEffect, useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Course, Submission } from '../../api-client';
import { assignmentsApi } from '../../api-client/clients';
import { Assignment } from '../../types/common';
import { getHeaders } from '../../utils/generics';
import { studentKeys } from '../../lib/queryKeys';
import { SubmissionStatus } from './submissionStatus';

/* ────────────────────────────────────────────────────────────────────────── */
/* Helper utilities                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

interface SubmissionHistoryItem {
  student: string;
  hasViewed: boolean;
}

const fetchSubmissions = async (assignmentId: number, student: string): Promise<Submission[]> => {
  const res = await fetch(
    `${process.env.REACT_APP_API_URL}/assignments/${assignmentId}/submissions/?student=${encodeURIComponent(student)}&compact=1`,
    { headers: getHeaders(), method: 'GET' },
  );
  return res.ok ? res.json() : [];
};

const fetchHistory = async (submissionId: number, student: string): Promise<SubmissionHistoryItem[]> => {
  const res = await fetch(
    `${process.env.REACT_APP_API_URL}/submissions/${submissionId}/history/?student=${encodeURIComponent(student)}`,
    { headers: getHeaders(), method: 'GET' },
  );
  return res.ok ? res.json() : [];
};

export const updateHistory = async (
  submissionId: number,
  payload: Record<string, unknown>,
  urlArgs: Record<string, string>,
): Promise<unknown> => {
  const params = Object.keys(urlArgs)
    .map((key, i) =>
      i === 0 ? `?${key}=${encodeURIComponent(urlArgs[key])}` : `&${key}=${encodeURIComponent(urlArgs[key])}`,
    )
    .join('');

  const res = await fetch(`${process.env.REACT_APP_API_URL}/submissions/${submissionId}/history/${params}`, {
    headers: getHeaders(),
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.ok ? res.json() : [];
};

export { fetchSubmissions, fetchHistory };

const sortAssignments = <T extends { sortKey?: number; id: number }>(objs: T[]): T[] => {
  return [...objs].sort((a, b) => {
    if (a.sortKey === b.sortKey || !a.sortKey || !b.sortKey) return a.id - b.id;
    return a.sortKey - b.sortKey;
  });
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Submission status helper (shared with Student.tsx and Dashboard)          */
/* ────────────────────────────────────────────────────────────────────────── */

export function getSubmissionStatusFor(
  assignment: Assignment,
  submission: Submission | undefined,
  viewsBySubmission: Record<number, boolean>,
): SubmissionStatus {
  // An assignment is "not published" only if it's neither released, nor open for
  // uploads, nor in live-feedback mode. allowStudentUpload means students can
  // interact with it even before isReleased is flipped.
  if (!assignment.isReleased && !assignment.liveFeedbackMode && !assignment.allowStudentUpload) {
    return SubmissionStatus.NOT_PUBLISHED;
  }
  if (!submission) return SubmissionStatus.NO_SUBMISSION;
  // Feedback is available when the submission is finalized, live-feedback is on,
  // or the instructor has explicitly released feedback (separate from isReleased).
  const isFeedbackAvailable = submission.isFinalized || assignment.liveFeedbackMode || assignment.feedbackReleased;
  if (!isFeedbackAvailable) return SubmissionStatus.NOT_REVIEWED;
  const isViewed = !(submission.id in viewsBySubmission) || viewsBySubmission[submission.id];
  return isViewed ? SubmissionStatus.SUBMITTED : SubmissionStatus.PENDING;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Grouped sections type                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export interface GroupedSections {
  overdue: Assignment[];
  dueToday: Assignment[];
  dueSoon: Assignment[];
  upcoming: Assignment[];
  completed: Assignment[];
  unpublished: Assignment[];
  all: Assignment[];
}

/** Groups a course's assignments into the temporal sections both the dashboard and the
 *  course view render. Sorts a copy — never the caller's (possibly cached) array. */
export function groupAssignments(
  assignments: Assignment[],
  submissions: Record<number, Submission[]>,
  viewsBySubmission: Record<number, boolean>,
): GroupedSections {
  const assignmentList = sortAssignments(assignments);
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdue: Assignment[] = [];
  const dueToday: Assignment[] = [];
  const dueSoon: Assignment[] = [];
  const upcoming: Assignment[] = [];
  const completed: Assignment[] = [];
  const unpublished: Assignment[] = [];

  for (const assignment of assignmentList) {
    const submission = submissions[assignment.id]?.[0];
    const status = getSubmissionStatusFor(assignment, submission, viewsBySubmission);

    if (status === SubmissionStatus.NOT_PUBLISHED) {
      unpublished.push(assignment);
    } else if (
      status === SubmissionStatus.SUBMITTED ||
      status === SubmissionStatus.NOT_REVIEWED ||
      status === SubmissionStatus.PENDING
    ) {
      completed.push(assignment);
    } else if (assignment.uploadDueDate) {
      const dueDate = new Date(assignment.uploadDueDate);
      if (dueDate < now) {
        // Past due date — overdue if no submission, due today if within last 24h
        if (dueDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
          dueToday.push(assignment);
        } else {
          overdue.push(assignment);
        }
      } else if (dueDate <= endOfToday) {
        dueToday.push(assignment);
      } else if (dueDate <= weekFromNow) {
        dueSoon.push(assignment);
      } else {
        upcoming.push(assignment);
      }
    } else {
      upcoming.push(assignment);
    }
  }

  return { overdue, dueToday, dueSoon, upcoming, completed, unpublished, all: assignmentList };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Hook: useStudentData                                                      */
/* Loads assignments, submissions, and view history for a set of courses.    */
/* ────────────────────────────────────────────────────────────────────────── */

export interface UseStudentDataResult {
  assignments: Record<number, Assignment[]>;
  submissions: Record<number, Submission[]>;
  viewsBySubmission: Record<number, boolean>;
  isLoadingAssignments: boolean;
  isLoadingSubmissions: boolean;
  /** Whether a single course's data (assignments/submissions/histories) is still loading */
  isCourseLoading: (courseId: number) => boolean;
  /** Grouped sections for a single course (pass courseId) */
  getGroupedSections: (courseId: number) => GroupedSections | null;
  /** Get progress stats for a course */
  getProgress: (courseId: number) => { completed: number; total: number; percent: number };
}

/**
 * Fetches assignments, submissions, and view history for a single course.
 * Used as the queryFn for per-course queries in useStudentData.
 */
async function fetchCourseData(
  course: Course,
  userEmail: string,
  studentSections: number[],
): Promise<{ assignments: Assignment[]; submissions: Record<number, Submission[]>; views: Record<number, boolean> }> {
  // 1. Fetch assignments
  const rawAssignments = await Promise.all(course.assignments.map((id) => assignmentsApi.retrieve({ id })));
  const assignments = (rawAssignments as unknown as Assignment[]).filter(
    (a) => a.isVisible && !(a.hideFrom ?? []).some((h: number) => studentSections.indexOf(h) > -1),
  );

  // 2. Fetch submissions (only for eligible assignments). Fire them all at once — the browser
  // already caps concurrent connections per host, so manual batching only added serial barriers.
  const eligible = assignments.filter((a) => a.isReleased || a.allowStudentUpload || a.liveFeedbackMode);
  const submissionsMap: Record<number, Submission[]> = {};
  const subResults = await Promise.all(eligible.map((a) => fetchSubmissions(a.id, userEmail)));
  eligible.forEach((a, idx) => {
    submissionsMap[a.id] = subResults[idx];
  });

  // 3. Fetch view histories (only for submissions that exist), again all at once.
  const views: Record<number, boolean> = {};
  const withSubs = Object.values(submissionsMap).filter((subs) => subs.length > 0);
  const histResults = await Promise.all(withSubs.map((subs) => fetchHistory(subs[0].id, userEmail)));
  withSubs.forEach((subs, idx) => {
    for (const item of histResults[idx]) {
      if (item.student === userEmail) {
        views[subs[0].id] = item.hasViewed;
      }
    }
  });

  return { assignments, submissions: submissionsMap, views };
}

export function useStudentData(courses: Course[], userEmail: string, studentSections: number[]): UseStudentDataResult {
  const queryClient = useQueryClient();

  // One query per course — each loads assignments → submissions → histories in sequence.
  const courseQueries = useQueries({
    queries: courses.map((course) => ({
      queryKey: studentKeys.courseData(course.id),
      queryFn: () => fetchCourseData(course, userEmail, studentSections),
      staleTime: 30_000,
    })),
  });

  // Seed the per-course cache keys the course view (Student.tsx) reads, so clicking into a course
  // paints instantly from cache instead of re-running the assignments→submissions→histories waterfall.
  useEffect(() => {
    courses.forEach((course, i) => {
      const data = courseQueries[i]?.data;
      if (!data) return;
      queryClient.setQueryData(studentKeys.assignments(course.id), data.assignments);
      queryClient.setQueryData(studentKeys.submissions(course.id), data.submissions);
      queryClient.setQueryData(studentKeys.histories(course.id), data.views);
    });
  }, [courses, courseQueries, queryClient]);

  // Merge per-course results into the cross-course maps the dashboard expects
  const assignments = useMemo(() => {
    const result: Record<number, Assignment[]> = {};
    courses.forEach((course, i) => {
      const data = courseQueries[i]?.data;
      if (data) result[course.id] = data.assignments;
    });
    return result;
  }, [courses, courseQueries]);

  const submissions = useMemo(() => {
    const result: Record<number, Submission[]> = {};
    courseQueries.forEach((q) => {
      if (q.data) Object.assign(result, q.data.submissions);
    });
    return result;
  }, [courseQueries]);

  const viewsBySubmission = useMemo(() => {
    const result: Record<number, boolean> = {};
    courseQueries.forEach((q) => {
      if (q.data) Object.assign(result, q.data.views);
    });
    return result;
  }, [courseQueries]);

  const isLoadingAssignments = courseQueries.some((q) => q.isPending);
  const isLoadingSubmissions = courseQueries.some((q) => q.isPending);

  const courseLoadingById = useMemo(() => {
    const result: Record<number, boolean> = {};
    courses.forEach((course, i) => {
      result[course.id] = courseQueries[i]?.isPending ?? true;
    });
    return result;
  }, [courses, courseQueries]);

  const isCourseLoading = useCallback(
    (courseId: number): boolean => courseLoadingById[courseId] ?? true,
    [courseLoadingById],
  );

  const getGroupedSections = useCallback(
    (courseId: number): GroupedSections | null => {
      if (!assignments[courseId]) return null;
      return groupAssignments(assignments[courseId], submissions, viewsBySubmission);
    },
    [assignments, submissions, viewsBySubmission],
  );

  const getProgress = useCallback(
    (courseId: number) => {
      const sections = getGroupedSections(courseId);
      if (!sections) return { completed: 0, total: 0, percent: 0 };
      const total = sections.all.filter(
        (a) => getSubmissionStatusFor(a, submissions[a.id]?.[0], viewsBySubmission) !== SubmissionStatus.NOT_PUBLISHED,
      ).length;
      const done = sections.completed.length;
      return { completed: done, total, percent: total > 0 ? (done / total) * 100 : 0 };
    },
    [getGroupedSections, submissions, viewsBySubmission],
  );

  return {
    assignments,
    submissions,
    viewsBySubmission,
    isLoadingAssignments,
    isLoadingSubmissions,
    isCourseLoading,
    getGroupedSections,
    getProgress,
  };
}
