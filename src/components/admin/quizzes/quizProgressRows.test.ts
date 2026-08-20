// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';
import { QuizGradingProgress } from '../../../api-client';
import { buildQuizProgressRows, pctColor } from './quizProgressRows';

const resp: QuizGradingProgress = {
  quizzes: [
    { id: 12, title: 'Quiz 1', totalManual: 40, graded: 25, pending: 15 },
    { id: 13, title: 'Quiz 2', totalManual: 8, graded: 5, pending: 3 },
  ],
  graders: [
    { grader: 'ta1@x.edu', totalGraded: 30, lastGradedAt: '2026-08-20T14:00:00Z', perQuiz: { '12': 25, '13': 5 } },
    { grader: 'gone@x.edu', totalGraded: 2, lastGradedAt: null, perQuiz: { '12': 2 } },
  ],
  pendingUngraded: 18,
};

describe('pctColor', () => {
  it('matches the submissions-page thresholds (inclusive boundaries)', () => {
    expect(pctColor(100)).toBe('#198665');
    expect(pctColor(80)).toBe('#198665');
    expect(pctColor(79.9)).toBe('#fa8c16');
    expect(pctColor(40)).toBe('#fa8c16');
    expect(pctColor(39.9)).toBe('#f5222d');
    expect(pctColor(0)).toBe('#f5222d');
  });
});

describe('buildQuizProgressRows', () => {
  it('unions the grader universe with API rows, adding zero rows for idle graders', () => {
    const rows = buildQuizProgressRows(resp, ['ta1@x.edu', 'idle@x.edu']);
    expect(rows.map((r) => r.grader)).toEqual(['gone@x.edu', 'idle@x.edu', 'ta1@x.edu']);
    const idle = rows.find((r) => r.grader === 'idle@x.edu')!;
    expect(idle.totalGraded).toBe(0);
    expect(idle.lastGradedTs).toBe(0);
    expect(idle.perQuiz).toEqual({});
  });

  it('numbers perQuiz keys and parses lastGradedAt to a timestamp', () => {
    const rows = buildQuizProgressRows(resp, []);
    const ta1 = rows.find((r) => r.grader === 'ta1@x.edu')!;
    expect(ta1.perQuiz).toEqual({ 12: 25, 13: 5 });
    expect(ta1.lastGradedTs).toBe(new Date('2026-08-20T14:00:00Z').getTime());
    const gone = rows.find((r) => r.grader === 'gone@x.edu')!;
    expect(gone.lastGradedTs).toBe(0);
  });
});
