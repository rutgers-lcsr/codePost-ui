// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { StudentQuiz } from '../../../api-client';

/** Whether the student can start (or retake) this quiz right now. */
export const canStart = (quiz: StudentQuiz): boolean => {
  if (!quiz.availability?.isOpen) return false;
  const allowed = quiz.attemptsAllowed ?? 1;
  return allowed === 0 || quiz.attemptsUsed < allowed;
};

/** The button label for an open, actionable quiz. */
export const startLabel = (quiz: StudentQuiz): string => (quiz.attemptsUsed > 0 ? 'New attempt' : 'Start quiz');

/** Whether the student has past submitted attempts to look back at — independent of
 *  whether they can also start another one. */
export const canReview = (quiz: StudentQuiz): boolean => quiz.hasSubmittedAttempt;

export type QuizAction = 'resume' | 'start' | 'review' | 'locked';

/** What the student can do with this quiz right now. Resume (an unfinished attempt) takes
 *  priority over starting a new one; review is only offered once something is submitted. */
export const quizAction = (quiz: StudentQuiz): QuizAction => {
  if (quiz.hasOpenAttempt) return 'resume';
  if (canStart(quiz)) return 'start';
  if (quiz.hasSubmittedAttempt) return 'review';
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
      return quizLockText(quiz.availability?.reason);
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
