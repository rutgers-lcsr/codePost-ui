// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

export const courseKeys = {
  all: ['courses'] as const,
  roster: (courseId: number) => ['courses', courseId, 'roster'] as const,
  sections: (courseId: number) => ['courses', courseId, 'sections'] as const,
  gradebook: (courseId: number) => ['courses', courseId, 'gradebook'] as const,
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

export const quizKeys = {
  banks: (courseId: number) => ['quizzes', 'banks', courseId] as const,
  bankQuestions: (bankId: number) => ['quizzes', 'bankQuestions', bankId] as const,
  courseQuestions: (courseId: number) => ['quizzes', 'courseQuestions', courseId] as const,
  list: (courseId: number) => ['quizzes', 'list', courseId] as const,
  membership: (quizId: number) => ['quizzes', 'membership', quizId] as const,
  detail: (quizId: number) => ['quizzes', 'detail', quizId] as const,
  suggestions: (assignmentId: number) => ['quizzes', 'suggestions', assignmentId] as const,
  regeneration: (questionId: number) => ['quizzes', 'regeneration', questionId] as const,
  // The needsGrading variant is part of the key; invalidating the bare prefix
  // (`quizKeys.attempts(id)`) still matches both variants.
  attempts: (quizId: number, needsGrading?: boolean) =>
    needsGrading === undefined
      ? (['quizzes', 'attempts', quizId] as const)
      : (['quizzes', 'attempts', quizId, needsGrading] as const),
  results: (quizId: number) => ['quizzes', 'results', quizId] as const,
  promptVariables: (quizId: number) => ['quizzes', 'promptVariables', quizId] as const,
  generatedSets: (quizId: number) => ['quizzes', 'generatedSets', quizId] as const,
  backfillPreview: (quizId: number) => ['quizzes', 'backfillPreview', quizId] as const,
  generatedSetDetail: (setId: number) => ['quizzes', 'generatedSetDetail', setId] as const,
  aiGenerationEnabled: (courseId: number) => ['quizzes', 'aiGenerationEnabled', courseId] as const,
  staffSections: (courseId: number) => ['quizzes', 'staffSections', courseId] as const,
};

export const studentKeys = {
  courseData: (courseId: number) => ['student', 'courseData', courseId] as const,
  assignments: (courseId: number) => ['student', 'assignments', courseId] as const,
  submissions: (courseId: number) => ['student', 'submissions', courseId] as const,
  histories: (courseId: number) => ['student', 'histories', courseId] as const,
  availableQuizzes: (courseId: number) => ['student', 'availableQuizzes', courseId] as const,
  quizAttempts: (quizId: number) => ['student', 'quizAttempts', quizId] as const,
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
