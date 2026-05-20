// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

export const courseKeys = {
  all: ['courses'] as const,
  roster: (courseId: number) => ['courses', courseId, 'roster'] as const,
  sections: (courseId: number) => ['courses', courseId, 'sections'] as const,
};

export const assignmentKeys = {
  all: ['assignments'] as const,
  list: (courseId: number) => ['assignments', 'list', courseId] as const,
  detail: (assignmentId: number) => ['assignments', 'detail', assignmentId] as const,
  analytics: (assignmentId: number, buckets?: number) =>
    ['assignments', 'analytics', assignmentId, buckets ?? 10] as const,
  rubric: (assignmentId: number) => ['assignments', 'rubric', assignmentId] as const,
  submissions: (courseId: number) => ['assignments', 'submissions', courseId] as const,
  viewHistories: (courseId: number) => ['assignments', 'viewHistories', courseId] as const,
  regradeSubmissions: (assignmentId: number, grader?: string) =>
    ['assignments', 'regrades', assignmentId, grader ?? 'all'] as const,
  apiKeys: (courseId: number) => ['courses', courseId, 'apiKeys'] as const,
};

export const studentKeys = {
  courseData: (courseId: number) => ['student', 'courseData', courseId] as const,
  assignments: (courseId: number) => ['student', 'assignments', courseId] as const,
  submissions: (courseId: number) => ['student', 'submissions', courseId] as const,
  histories: (courseId: number) => ['student', 'histories', courseId] as const,
};

export const graderKeys = {
  submissions: (assignmentId: number, graderEmail: string) =>
    ['grader', 'submissions', assignmentId, graderEmail] as const,
  sections: (courseId: number) => ['grader', 'sections', courseId] as const,
  queueLength: (assignmentId: number, sectionIds?: number[]) =>
    ['grader', 'queueLength', assignmentId, ...(sectionIds ?? [])] as const,
};

export const submissionKeys = {
  detail: (submissionId: number) => ['submission', 'detail', submissionId] as const,
  consoleData: (submissionId: number) => ['submission', 'consoleData', submissionId] as const,
  files: (submissionId: number) => ['submission', 'files', submissionId] as const,
  permissions: (submissionId: number) => ['submission', 'permissions', submissionId] as const,
};
