// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { GradebookAssignmentCell, GradebookQuizCell, GradebookResponse } from '../../../api-client';

/** One table row: the server's parallel cell arrays re-keyed by column id for O(1) lookup. */
export interface IGradebookRow {
  student: string;
  section: string | null;
  byAssignment: Record<number, GradebookAssignmentCell>;
  byQuiz: Record<number, GradebookQuizCell>;
  totalEarned: number;
  totalPossible: number;
  percent: number | null;
}

export const buildRows = (data: GradebookResponse): IGradebookRow[] =>
  data.rows.map((r) => ({
    student: r.student,
    section: r.section ?? null,
    byAssignment: Object.fromEntries(r.assignmentCells.map((c) => [c.assignment, c])),
    byQuiz: Object.fromEntries(r.quizCells.map((c) => [c.quiz, c])),
    totalEarned: r.totalEarned,
    totalPossible: r.totalPossible,
    percent: r.percent,
  }));

const mean = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((s, v) => s + v, 0) / values.length;

/** Mean finalized grade for an assignment column, over graded rows only. */
export const assignmentAverage = (rows: IGradebookRow[], assignmentId: number): number | null =>
  mean(
    rows
      .map((r) => r.byAssignment[assignmentId]?.grade)
      .filter((g): g is number => g != null)
      .map(Number),
  );

/** Mean score percentage for a quiz column, over graded rows only. Each student is
 *  normalized by their OWN maxScore (random draws / generated sections vary per student). */
export const quizAveragePercent = (rows: IGradebookRow[], quizId: number): number | null =>
  mean(
    rows
      .map((r) => r.byQuiz[quizId])
      .filter((c): c is GradebookQuizCell => c?.score != null && c.maxScore != null && Number(c.maxScore) > 0)
      .map((c) => (Number(c.score) / Number(c.maxScore)) * 100),
  );

/** Mean overall percent across rows that have anything graded. */
export const classAveragePercent = (rows: IGradebookRow[]): number | null =>
  mean(rows.map((r) => r.percent).filter((p): p is number => p != null).map(Number));

/** The unique section names present, sorted (for the section filter). */
export const sectionOptions = (rows: IGradebookRow[]): string[] =>
  [...new Set(rows.map((r) => r.section).filter((s): s is string => s != null))].sort();

/** Progress-bar color band for an overall percent. */
export const percentColor = (percent: number): string => {
  if (percent >= 80) return '#52c41a';
  if (percent >= 60) return '#faad14';
  return '#ff4d4f';
};
