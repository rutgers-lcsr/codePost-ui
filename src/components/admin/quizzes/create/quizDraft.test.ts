// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { QuizAssignmentTriggerEnum, QuizCloseEventEnum } from '../../../../api-client';
import {
  DEFAULT_DRAFT,
  QuizCreateDraft,
  buildCreatePayload,
  createBlockers,
} from './quizDraft';

const draft = (overrides: Partial<QuizCreateDraft> = {}): QuizCreateDraft => ({
  ...DEFAULT_DRAFT,
  title: 'Week 1 Quiz',
  ...overrides,
});

describe('DEFAULT_DRAFT', () => {
  it('mirrors the server defaults for the coupled fields', () => {
    expect(DEFAULT_DRAFT.manualGeneration).toBe(true);
    expect(DEFAULT_DRAFT.allowBacktracking).toBe(true);
    expect(DEFAULT_DRAFT.attemptsAllowed).toBe(1);
    expect(DEFAULT_DRAFT.passingScoreUnit).toBe('percent');
    expect(DEFAULT_DRAFT.scoringPolicy).toBe('highest');
    expect(DEFAULT_DRAFT.isPublished).toBe(false);
    expect(DEFAULT_DRAFT.assignmentTrigger).toBe(QuizAssignmentTriggerEnum.During);
    expect(DEFAULT_DRAFT.closeEvent).toBe(QuizCloseEventEnum.None);
  });
});

describe('buildCreatePayload', () => {
  it('never sends an empty SEB config key', () => {
    const payload = buildCreatePayload(draft({ sebConfigKey: '  ' }), 3, false);
    expect(payload.sebConfigKey).toBeNull();
  });

  it('computes closeOffsetMinutes from the value/unit presentation state', () => {
    const payload = buildCreatePayload(draft({ closeOffsetValue: 2, closeOffsetUnit: 'hours' }), 3, false);
    expect(payload.closeOffsetMinutes).toBe(120);
  });

  it('trims the title and stamps course and publish state', () => {
    const payload = buildCreatePayload(draft({ title: '  Midterm  ' }), 7, true);
    expect(payload.title).toBe('Midterm');
    expect(payload.course).toBe(7);
    expect(payload.isPublished).toBe(true);
  });
});

describe('createBlockers', () => {
  it('requires a title', () => {
    expect(createBlockers(draft({ title: '   ' }))).toContainEqual(
      expect.objectContaining({ step: 'basics' }),
    );
  });

  it('blocks sealed results on a standalone quiz with no close date', () => {
    expect(createBlockers(draft({ sealResultsUntilClose: true }))).toContainEqual(
      expect.objectContaining({ step: 'results' }),
    );
  });

  it('blocks sealed results on an attached quiz that never closes', () => {
    const blockers = createBlockers(
      draft({ sealResultsUntilClose: true, assignment: 5, closeEvent: QuizCloseEventEnum.None }),
    );
    expect(blockers).toContainEqual(expect.objectContaining({ step: 'results' }));
  });

  it('allows sealed results once a fixed close date exists', () => {
    const blockers = createBlockers(
      draft({
        sealResultsUntilClose: true,
        assignment: 5,
        closeEvent: QuizCloseEventEnum.FixedDate,
        availableUntil: '2026-09-01T00:00:00Z',
      }),
    );
    expect(blockers).toEqual([]);
  });

  it('rejects a malformed SEB config key when SEB is required', () => {
    const short = createBlockers(draft({ requireSebBrowser: true, sebConfigKey: 'abc123' }));
    expect(short).toContainEqual(expect.objectContaining({ step: 'security' }));
    const nonHex = createBlockers(draft({ requireSebBrowser: true, sebConfigKey: 'z'.repeat(64) }));
    expect(nonHex).toContainEqual(expect.objectContaining({ step: 'security' }));
  });

  it('accepts a valid 64-hex SEB config key', () => {
    expect(createBlockers(draft({ requireSebBrowser: true, sebConfigKey: 'a1'.repeat(32) }))).toEqual([]);
  });

  it('blocks a degenerate trigger/close pair with a zero offset', () => {
    const blockers = createBlockers(
      draft({
        assignment: 5,
        assignmentTrigger: QuizAssignmentTriggerEnum.AfterSubmission,
        closeEvent: QuizCloseEventEnum.Submission,
        closeOffsetValue: 0,
      }),
    );
    expect(blockers).toContainEqual(expect.objectContaining({ step: 'availability' }));
  });

  it('allows the same pair once an offset is set', () => {
    const blockers = createBlockers(
      draft({
        assignment: 5,
        assignmentTrigger: QuizAssignmentTriggerEnum.AfterSubmission,
        closeEvent: QuizCloseEventEnum.Submission,
        closeOffsetValue: 1,
        closeOffsetUnit: 'days',
      }),
    );
    expect(blockers).toEqual([]);
  });
});
