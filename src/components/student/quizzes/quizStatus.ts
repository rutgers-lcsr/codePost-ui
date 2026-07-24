// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { StudentQuiz } from '../../../api-client';

/** Whether the student can start (or retake) this quiz right now. */
export const canStart = (quiz: StudentQuiz): boolean => {
  if (!quiz.availability?.isOpen) return false;
  const allowed = quiz.attemptsAllowed ?? 1;
  return allowed === 0 || quiz.attemptsUsed < allowed;
};

/** Whether a closed quiz can still be started with a late-access code: the instructor set a
 *  code, the quiz is closed (not "not yet open" / awaiting something), the student has no
 *  attempt open, and attempts remain. The code itself is validated server-side on start. */
export const canEnterAccessCode = (quiz: StudentQuiz): boolean => {
  if (!quiz.hasAccessCode) return false;
  const reason = quiz.availability?.reason;
  if (reason !== 'closed' && reason !== 'assignment_closed') return false;
  if (quiz.hasOpenAttempt) return false;
  const allowed = quiz.attemptsAllowed ?? 1;
  return allowed === 0 || quiz.attemptsUsed < allowed;
};

/** The button label for an open, actionable quiz. */
const startLabel = (quiz: StudentQuiz): string => (quiz.attemptsUsed > 0 ? 'New attempt' : 'Start quiz');

/** Whether the student has past submitted attempts to look back at — independent of
 *  whether they can also start another one. Gated by the quiz's allowSubmissionReview
 *  setting: when the instructor disables review, submitted attempts can't be reopened. */
export const canReview = (quiz: StudentQuiz): boolean =>
  quiz.hasSubmittedAttempt && quiz.allowSubmissionReview !== false;

export type QuizAction = 'resume' | 'start' | 'review' | 'locked';

/** What the student can do with this quiz right now. Resume (an unfinished attempt) takes
 *  priority over starting a new one; review is only offered once something is submitted. */
export const quizAction = (quiz: StudentQuiz): QuizAction => {
  if (quiz.hasOpenAttempt) return 'resume';
  if (canStart(quiz)) return 'start';
  if (canReview(quiz)) return 'review';
  return 'locked';
};

/** Button/label text for the quiz's current action. For a locked quiz, the lock reason. */
export const quizActionLabel = (quiz: StudentQuiz): string => {
  switch (quizAction(quiz)) {
    case 'resume':
      return 'Resume';
    case 'start':
      return startLabel(quiz);
    case 'review':
      return 'Review results';
    default:
      // A submitted attempt with review disabled is done, not "locked" — say so.
      return quiz.hasSubmittedAttempt ? 'Submitted' : quizLockText(quiz.availability?.reason);
  }
};

/** Friendly explanation for why a (locked) quiz isn't open, keyed by the availability reason. */
export const quizLockText = (reason?: string): string => {
  switch (reason) {
    case 'no_submission_yet':
      return 'Opens after you submit';
    case 'feedback_not_released':
      return 'Opens after feedback is released';
    case 'student_feedback_not_ready':
      return 'Opens when your feedback is ready';
    case 'questions_not_ready':
      return 'Your quiz is being prepared';
    case 'assignment_still_open':
      return 'Opens after the assignment closes';
    case 'not_yet_open':
      return 'Not yet open';
    case 'assignment_closed':
    case 'closed':
      return 'Closed';
    default:
      return 'Unavailable';
  }
};
