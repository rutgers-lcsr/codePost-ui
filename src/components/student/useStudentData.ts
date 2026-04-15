// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import { useCallback, useEffect, useState } from 'react';
import { Course, Submission } from '../../api-client';
import { assignmentsApi } from '../../api-client/clients';
import { Assignment } from '../../types/common';
import { getHeaders } from '../../utils/generics';
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
  dueToday: Assignment[];
  dueSoon: Assignment[];
  upcoming: Assignment[];
  completed: Assignment[];
  unpublished: Assignment[];
  all: Assignment[];
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
  /** Grouped sections for a single course (pass courseId) */
  getGroupedSections: (courseId: number) => GroupedSections | null;
  /** Get progress stats for a course */
  getProgress: (courseId: number) => { completed: number; total: number; percent: number };
  /** Reload everything */
  reload: () => void;
}

export function useStudentData(courses: Course[], userEmail: string, studentSections: number[]): UseStudentDataResult {
  const [assignments, setAssignments] = useState<Record<number, Assignment[]>>({});
  const [submissions, setSubmissions] = useState<Record<number, Submission[]>>({});
  const [viewsBySubmission, setViewsBySubmission] = useState<Record<number, boolean>>({});
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);

  const loadAssignments = useCallback(
    async (courseList: Course[]): Promise<Record<number, Assignment[]>> => {
      const assignmentArrays = await Promise.all(
        courseList.map(async (course) => Promise.all(course.assignments.map((id) => assignmentsApi.retrieve({ id })))),
      );
      const result: Record<number, Assignment[]> = {};
      courseList.forEach((course, i) => {
        result[course.id] = (assignmentArrays[i] as unknown as Assignment[]).filter(
          (a) =>
            a.isVisible && !(a.hideFrom ?? []).some((shouldHide: number) => studentSections.indexOf(shouldHide) > -1),
        );
      });
      return result;
    },
    [studentSections],
  );

  const loadSubmissions = useCallback(
    async (assignmentList: Assignment[]): Promise<Record<number, Submission[]>> => {
      const submissionsMap: Record<number, Submission[]> = {};
      // Parallelize with concurrency limit of 6
      const eligible = assignmentList.filter((a) => a.isReleased || a.allowStudentUpload || a.liveFeedbackMode);
      const batchSize = 6;
      for (let i = 0; i < eligible.length; i += batchSize) {
        const batch = eligible.slice(i, i + batchSize);
        const results = await Promise.all(batch.map((a) => fetchSubmissions(a.id, userEmail)));
        batch.forEach((a, idx) => {
          submissionsMap[a.id] = results[idx];
        });
      }
      return submissionsMap;
    },
    [userEmail],
  );

  const loadHistories = useCallback(
    async (submissionsMap: Record<number, Submission[]>): Promise<Record<number, boolean>> => {
      const viewMap: Record<number, boolean> = {};
      const entries = Object.values(submissionsMap).filter((subs) => subs.length > 0);
      // Parallelize history loading too
      const batchSize = 6;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const results = await Promise.all(batch.map((subs) => fetchHistory(subs[0].id, userEmail)));
        batch.forEach((subs, idx) => {
          for (const item of results[idx]) {
            if (item.student === userEmail) {
              viewMap[subs[0].id] = item.hasViewed;
            }
          }
        });
      }
      return viewMap;
    },
    [userEmail],
  );

  const load = useCallback(async () => {
    setIsLoadingAssignments(true);
    setIsLoadingSubmissions(true);

    const loaded = await loadAssignments(courses);
    setAssignments(loaded);
    setIsLoadingAssignments(false);

    // Load submissions for ALL courses
    const allAssignments = Object.values(loaded).flat();
    const loadedSubs = await loadSubmissions(allAssignments);
    const viewMap = await loadHistories(loadedSubs);

    setSubmissions(loadedSubs);
    setViewsBySubmission(viewMap);
    setIsLoadingSubmissions(false);
  }, [courses, loadAssignments, loadSubmissions, loadHistories]);

  useEffect(() => {
    load();
  }, [load]);

  const getGroupedSections = useCallback(
    (courseId: number): GroupedSections | null => {
      if (!assignments[courseId]) return null;
      const assignmentList = sortAssignments(assignments[courseId]);
      const now = new Date();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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
        } else if (status === SubmissionStatus.SUBMITTED) {
          completed.push(assignment);
        } else if (assignment.uploadDueDate) {
          const dueDate = new Date(assignment.uploadDueDate);
          if (dueDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
            if (dueDate <= endOfToday) {
              dueToday.push(assignment);
            } else if (dueDate <= weekFromNow) {
              dueSoon.push(assignment);
            } else {
              upcoming.push(assignment);
            }
          } else {
            upcoming.push(assignment);
          }
        } else {
          upcoming.push(assignment);
        }
      }

      return { dueToday, dueSoon, upcoming, completed, unpublished, all: assignmentList };
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
    getGroupedSections,
    getProgress,
    reload: load,
  };
}
