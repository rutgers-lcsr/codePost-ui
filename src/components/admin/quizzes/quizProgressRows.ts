// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { QuizGradingProgress } from '../../../api-client';

/** Same % thresholds/colors as the submissions By Grader page. */
export const pctColor = (pct: number): string =>
  pct >= 80 ? '#198665' : pct >= 40 ? '#fa8c16' : '#f5222d';

export interface QuizProgressRow {
  grader: string;
  totalGraded: number;
  /** Unix ms of the grader's most recent manual grade; 0 when they never graded. */
  lastGradedTs: number;
  /** graded count per quiz id (quizzes with 0 omitted). */
  perQuiz: Record<number, number>;
}

/**
 * Table rows for the quiz grading-progress page: one row per grader in `graderUniverse`
 * (the course's eligible graders — so idle graders appear with zeros) plus any grader the
 * API reports that has since left the roster (accountability rows).
 */
export function buildQuizProgressRows(
  resp: QuizGradingProgress,
  graderUniverse: string[],
): QuizProgressRow[] {
  const byEmail = new Map(resp.graders.map((g) => [g.grader, g]));
  const emails = [...new Set([...graderUniverse, ...byEmail.keys()])].sort();
  return emails.map((email) => {
    const api = byEmail.get(email);
    const perQuiz: Record<number, number> = {};
    for (const [quizId, count] of Object.entries(api?.perQuiz ?? {})) {
      if (count) perQuiz[Number(quizId)] = count;
    }
    return {
      grader: email,
      totalGraded: api?.totalGraded ?? 0,
      lastGradedTs: api?.lastGradedAt ? new Date(api.lastGradedAt).getTime() : 0,
      perQuiz,
    };
  });
}
