// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { QuizCloseEventEnum } from '../../../api-client';

/** A configuration warning (a likely mistake) or tip (a low-stakes reminder) shown on the
 *  quiz settings card. Computed live from the current (unsaved) settings. */
export interface QuizWarning {
  key: string;
  level: 'warning' | 'info';
  text: string;
}

/** The subset of quiz settings the warnings depend on (a structural slice of QuizSettings,
 *  so the checks stay independently testable with plain objects). */
export interface QuizWarningInput {
  assignment: number | null;
  availableUntil: string | null;
  closeEvent: string;
  attemptsAllowed: number;
  sealResultsUntilClose: boolean;
  showCorrectAnswers: boolean;
  showResponses: boolean;
  allowSubmissionReview: boolean;
  isPublished: boolean;
  manualGeneration: boolean;
  generationDate: string | null;
}

/** Whether the quiz has no close that the settings can determine up front. Event-based
 *  closes (assignment due / submission / feedback released) depend on runtime assignment
 *  data, so they're treated as "will close" to avoid false alarms. */
function neverCloses(s: QuizWarningInput): boolean {
  // Standalone quizzes close at their explicit end date; attached quizzes use closeEvent.
  if (s.assignment == null) return s.availableUntil == null;
  if (s.closeEvent === QuizCloseEventEnum.None) return true;
  if (s.closeEvent === QuizCloseEventEnum.FixedDate) return s.availableUntil == null;
  return false;
}

/** Configuration warnings/tips for the current quiz settings, most important first. */
export function quizSettingsWarnings(s: QuizWarningInput): QuizWarning[] {
  const out: QuizWarning[] = [];

  // Results are held until close, but nothing ever closes the quiz → students never see them.
  if (s.sealResultsUntilClose && neverCloses(s)) {
    out.push({
      key: 'results-never-released',
      level: 'warning',
      text:
        'Results are set to release after the quiz closes, but this quiz never closes — students ' +
        'will never see their scores, points, or the answer key. Set a close time, or release ' +
        'results as soon as students submit.',
    });
  }

  // Answer key shown immediately after submit while retakes remain → it can be carried forward.
  const multipleAttempts = s.attemptsAllowed === 0 || s.attemptsAllowed > 1;
  if (
    s.showCorrectAnswers &&
    s.showResponses &&
    s.allowSubmissionReview &&
    !s.sealResultsUntilClose &&
    multipleAttempts
  ) {
    out.push({
      key: 'answer-key-leak',
      level: 'warning',
      text:
        'The correct-answer key is shown right after submitting, and students have attempts ' +
        'remaining — they could copy it into a later attempt. Consider releasing results after ' +
        'the quiz closes.',
    });
  }

  // A scheduled generation run only fires for published quizzes — remind the author.
  if (s.manualGeneration && s.generationDate && !s.isPublished) {
    out.push({
      key: 'scheduled-generation-draft',
      level: 'info',
      text:
        'A scheduled generation time is set, but this quiz is a draft — the scheduled run ' +
        'only fires once the quiz is published.',
    });
  }

  // Low-stakes reminder: a draft is invisible to students.
  if (!s.isPublished) {
    out.push({
      key: 'draft-not-published',
      level: 'info',
      text: "This quiz is a draft — students won't see it until you publish it.",
    });
  }

  return out;
}
