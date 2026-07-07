// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { StudentQuiz } from '../../api-client';

import { canStart } from './quizzes/quizStatus';
import { SubmissionStatus } from './submissionStatus';

/** A quiz the student still needs to take: nothing submitted yet, and either an
 *  attempt is in progress or a new attempt can be started right now. */
export const quizNeedsAction = (quiz: StudentQuiz): boolean =>
  !quiz.hasSubmittedAttempt && (quiz.hasOpenAttempt || canStart(quiz));

export interface AssignmentActionInput {
  status: SubmissionStatus;
  hasSubmission: boolean;
  allowStudentUpload: boolean;
  /** Quizzes attached to this assignment. */
  quizzes: StudentQuiz[];
}

/** Released assignment with something the student can actually do. */
export const assignmentNeedsAction = (i: AssignmentActionInput): boolean =>
  i.status !== SubmissionStatus.NOT_PUBLISHED &&
  ((i.allowStudentUpload && !i.hasSubmission) || i.quizzes.some(quizNeedsAction));

/** Fully done: has an uploaded submission and every attached quiz submitted. */
export const assignmentIsDone = (i: AssignmentActionInput): boolean =>
  i.status !== SubmissionStatus.NOT_PUBLISHED &&
  i.hasSubmission &&
  i.quizzes.every((q) => q.hasSubmittedAttempt);
