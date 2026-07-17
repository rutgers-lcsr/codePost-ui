// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';
import { GradebookResponse } from '../../../../api-client';
import {
  assignmentAverage,
  buildRows,
  classAveragePercent,
  percentColor,
  quizAveragePercent,
  sectionOptions,
} from '../gradebookMath';

const data = {
  assignments: [{ id: 1, name: 'HW1', points: 100 }],
  quizzes: [{ id: 7, title: 'Week 1' }],
  rows: [
    {
      student: 'a@x.edu',
      section: 'P01',
      assignmentCells: [{ assignment: 1, grade: 90, hasSubmission: true, isFinalized: true }],
      quizCells: [{ quiz: 7, score: 8, maxScore: 10, needsGrading: false, hasAttempts: true }],
      totalEarned: 98,
      totalPossible: 110,
      percent: 89.09,
    },
    {
      // Pending everywhere: an unfinalized submission and an ungraded quiz attempt.
      student: 'b@x.edu',
      section: null,
      assignmentCells: [{ assignment: 1, grade: null, hasSubmission: true, isFinalized: false }],
      quizCells: [{ quiz: 7, score: null, maxScore: null, needsGrading: true, hasAttempts: true }],
      totalEarned: 0,
      totalPossible: 0,
      percent: null,
    },
    {
      // Graded quiz with a different personal maxScore (random draw / generated section).
      student: 'c@x.edu',
      section: 'P02',
      assignmentCells: [{ assignment: 1, grade: 70, hasSubmission: true, isFinalized: true }],
      quizCells: [{ quiz: 7, score: 6, maxScore: 12, needsGrading: false, hasAttempts: true }],
      totalEarned: 76,
      totalPossible: 112,
      percent: 67.86,
    },
  ],
} as unknown as GradebookResponse;

describe('buildRows', () => {
  it('keys the parallel cell arrays by column id', () => {
    const rows = buildRows(data);
    expect(rows[0].byAssignment[1].grade).toBe(90);
    expect(rows[0].byQuiz[7].score).toBe(8);
    expect(rows[1].section).toBeNull();
  });
});

describe('averages', () => {
  const rows = buildRows(data);

  it('assignmentAverage means graded cells only', () => {
    // (90 + 70) / 2 — the pending row is excluded, not counted as zero.
    expect(assignmentAverage(rows, 1)).toBe(80);
  });

  it('quizAveragePercent normalizes by each student’s own maxScore', () => {
    // (8/10 + 6/12) / 2 = 65%
    expect(quizAveragePercent(rows, 7)).toBeCloseTo(65);
  });

  it('classAveragePercent skips rows with nothing graded', () => {
    expect(classAveragePercent(rows)).toBeCloseTo((89.09 + 67.86) / 2);
  });

  it('returns null when nothing is graded', () => {
    const empty = buildRows({ ...data, rows: [data.rows[1]] } as GradebookResponse);
    expect(assignmentAverage(empty, 1)).toBeNull();
    expect(quizAveragePercent(empty, 7)).toBeNull();
    expect(classAveragePercent(empty)).toBeNull();
  });
});

describe('sectionOptions', () => {
  it('lists unique sections sorted, ignoring unsectioned rows', () => {
    expect(sectionOptions(buildRows(data))).toEqual(['P01', 'P02']);
  });
});

describe('percentColor', () => {
  it('bands green / amber / red', () => {
    expect(percentColor(85)).toBe('#52c41a');
    expect(percentColor(65)).toBe('#faad14');
    expect(percentColor(30)).toBe('#ff4d4f');
  });
});
