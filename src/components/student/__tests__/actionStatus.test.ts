// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';

import { StudentQuiz } from '../../../api-client';
import { assignmentIsDone, assignmentNeedsAction, quizNeedsAction } from '../actionStatus';
import { SubmissionStatus } from '../submissionStatus';

const mkQuiz = (overrides: Partial<StudentQuiz> = {}): StudentQuiz =>
  ({
    id: 1,
    availability: { isOpen: true, reason: '' },
    attemptsAllowed: 1,
    attemptsUsed: 0,
    hasOpenAttempt: false,
    hasSubmittedAttempt: false,
    ...overrides,
  }) as StudentQuiz;

const mkInput = (overrides: Partial<Parameters<typeof assignmentIsDone>[0]> = {}) => ({
  status: SubmissionStatus.NO_SUBMISSION,
  hasSubmission: false,
  allowStudentUpload: true,
  quizzes: [] as StudentQuiz[],
  ...overrides,
});

describe('quizNeedsAction', () => {
  it('is true for an open, untaken quiz', () => {
    expect(quizNeedsAction(mkQuiz())).toBe(true);
  });

  it('is true while an attempt is in progress even if the quiz has since closed', () => {
    expect(
      quizNeedsAction(mkQuiz({ hasOpenAttempt: true, availability: { isOpen: false, reason: 'closed' } })),
    ).toBe(true);
  });

  it('is false once something is submitted', () => {
    expect(quizNeedsAction(mkQuiz({ hasSubmittedAttempt: true, attemptsUsed: 1 }))).toBe(false);
  });

  it('is false for a locked quiz that was never taken', () => {
    expect(quizNeedsAction(mkQuiz({ availability: { isOpen: false, reason: 'not_yet_open' } }))).toBe(false);
  });
});

describe('assignmentNeedsAction', () => {
  it('is true when upload is allowed and nothing is submitted', () => {
    expect(assignmentNeedsAction(mkInput())).toBe(true);
  });

  it('is false for unpublished assignments', () => {
    expect(assignmentNeedsAction(mkInput({ status: SubmissionStatus.NOT_PUBLISHED }))).toBe(false);
  });

  it('is false when submitted and no quizzes are pending', () => {
    expect(
      assignmentNeedsAction(
        mkInput({ status: SubmissionStatus.SUBMITTED, hasSubmission: true, quizzes: [mkQuiz({ hasSubmittedAttempt: true })] }),
      ),
    ).toBe(false);
  });

  it('is true when submitted but an attached quiz is still open and untaken', () => {
    expect(
      assignmentNeedsAction(mkInput({ status: SubmissionStatus.SUBMITTED, hasSubmission: true, quizzes: [mkQuiz()] })),
    ).toBe(true);
  });

  it('is false for a staff-uploaded assignment with no quiz and no submission', () => {
    expect(assignmentNeedsAction(mkInput({ allowStudentUpload: false }))).toBe(false);
  });
});

describe('assignmentIsDone', () => {
  it('is true once submitted with no attached quizzes', () => {
    expect(assignmentIsDone(mkInput({ status: SubmissionStatus.NOT_REVIEWED, hasSubmission: true }))).toBe(true);
  });

  it('is false while an attached quiz is unsubmitted', () => {
    expect(
      assignmentIsDone(mkInput({ status: SubmissionStatus.SUBMITTED, hasSubmission: true, quizzes: [mkQuiz()] })),
    ).toBe(false);
  });

  it('is true when submitted and all attached quizzes are submitted', () => {
    expect(
      assignmentIsDone(
        mkInput({
          status: SubmissionStatus.SUBMITTED,
          hasSubmission: true,
          quizzes: [mkQuiz({ hasSubmittedAttempt: true, attemptsUsed: 1 })],
        }),
      ),
    ).toBe(true);
  });

  it('is false without a submission and for unpublished assignments', () => {
    expect(assignmentIsDone(mkInput())).toBe(false);
    expect(assignmentIsDone(mkInput({ status: SubmissionStatus.NOT_PUBLISHED, hasSubmission: true }))).toBe(false);
  });
});
