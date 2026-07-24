// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';

import { StudentQuiz } from '../../../api-client';
import { canEnterAccessCode, quizAction } from './quizStatus';

const mkQuiz = (overrides: Partial<StudentQuiz> = {}): StudentQuiz =>
  ({
    id: 1,
    availability: { isOpen: false, reason: 'closed' },
    attemptsAllowed: 1,
    attemptsUsed: 0,
    hasOpenAttempt: false,
    hasSubmittedAttempt: false,
    hasAccessCode: true,
    allowSubmissionReview: true,
    ...overrides,
  }) as StudentQuiz;

describe('canEnterAccessCode', () => {
  it('is true for a closed quiz with a code and attempts remaining', () => {
    expect(canEnterAccessCode(mkQuiz())).toBe(true);
    expect(canEnterAccessCode(mkQuiz({ availability: { isOpen: false, reason: 'assignment_closed' } }))).toBe(true);
  });

  it('is false when no access code is set', () => {
    expect(canEnterAccessCode(mkQuiz({ hasAccessCode: false }))).toBe(false);
  });

  it('is false when the quiz is open (no code needed)', () => {
    expect(canEnterAccessCode(mkQuiz({ availability: { isOpen: true, reason: '' } }))).toBe(false);
  });

  it('is false for non-late lock reasons (a code is only for missed deadlines)', () => {
    expect(canEnterAccessCode(mkQuiz({ availability: { isOpen: false, reason: 'not_yet_open' } }))).toBe(false);
    expect(canEnterAccessCode(mkQuiz({ availability: { isOpen: false, reason: 'no_submission_yet' } }))).toBe(false);
  });

  it('is false once attempts are exhausted', () => {
    expect(canEnterAccessCode(mkQuiz({ attemptsAllowed: 1, attemptsUsed: 1 }))).toBe(false);
  });

  it('honors unlimited attempts (attemptsAllowed 0)', () => {
    expect(canEnterAccessCode(mkQuiz({ attemptsAllowed: 0, attemptsUsed: 3 }))).toBe(true);
  });

  it('is false while an attempt is already open (resume takes over)', () => {
    expect(canEnterAccessCode(mkQuiz({ hasOpenAttempt: true }))).toBe(false);
  });

  it('applies to a closed quiz whose primary action is locked', () => {
    // The card only offers the code button in the locked branch of QuizActions.
    expect(quizAction(mkQuiz())).toBe('locked');
  });
});
