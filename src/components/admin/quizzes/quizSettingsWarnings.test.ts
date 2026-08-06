// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';
import { quizSettingsWarnings, QuizWarningInput } from './quizSettingsWarnings';

/** A clean, published quiz that trips no warnings: standalone with an explicit close date,
 *  a single attempt, and results released immediately. */
const base = (): QuizWarningInput => ({
  assignment: null,
  availableUntil: '2026-09-01T00:00:00Z',
  closeEvent: 'none',
  attemptsAllowed: 1,
  sealResultsUntilClose: false,
  showCorrectAnswers: true,
  showResponses: true,
  allowSubmissionReview: true,
  isPublished: true,
  manualGeneration: false,
  generationDate: null,
  requireSebBrowser: false,
  sebConfigKey: null,
});

const keys = (input: QuizWarningInput) => quizSettingsWarnings(input).map((w) => w.key);

describe('quizSettingsWarnings', () => {
  describe('seb-no-config-key', () => {
    it('warns when SEB is required without a Config Key', () => {
      expect(keys({ ...base(), requireSebBrowser: true, sebConfigKey: null })).toContain('seb-no-config-key');
      expect(keys({ ...base(), requireSebBrowser: true, sebConfigKey: '  ' })).toContain('seb-no-config-key');
    });

    it('stays quiet when a key is set or SEB is off', () => {
      expect(keys({ ...base(), requireSebBrowser: true, sebConfigKey: 'a'.repeat(64) })).not.toContain(
        'seb-no-config-key',
      );
      expect(keys({ ...base(), requireSebBrowser: false, sebConfigKey: null })).not.toContain('seb-no-config-key');
    });
  });

  it('returns nothing for a clean configuration', () => {
    expect(keys(base())).toEqual([]);
  });

  describe('results-never-released', () => {
    it('warns when results seal until close but a standalone quiz has no end date', () => {
      expect(keys({ ...base(), sealResultsUntilClose: true, availableUntil: null })).toContain(
        'results-never-released',
      );
    });

    it('warns when an attached quiz seals until close with closeEvent=none', () => {
      expect(keys({ ...base(), assignment: 5, closeEvent: 'none', sealResultsUntilClose: true })).toContain(
        'results-never-released',
      );
    });

    it('warns for a fixed-date close that has no date set', () => {
      expect(
        keys({ ...base(), assignment: 5, closeEvent: 'fixed_date', availableUntil: null, sealResultsUntilClose: true }),
      ).toContain('results-never-released');
    });

    it('does NOT warn when the quiz has a close date', () => {
      expect(keys({ ...base(), sealResultsUntilClose: true })).not.toContain('results-never-released');
    });

    it('does NOT warn for runtime-dependent close events (submission/feedback/assignment_due)', () => {
      for (const closeEvent of ['submission', 'feedback_released', 'assignment_due']) {
        expect(
          keys({ ...base(), assignment: 5, closeEvent, availableUntil: null, sealResultsUntilClose: true }),
        ).not.toContain('results-never-released');
      }
    });
  });

  describe('answer-key-leak', () => {
    it('warns when the key shows immediately and attempts are unlimited', () => {
      expect(keys({ ...base(), attemptsAllowed: 0 })).toContain('answer-key-leak');
    });

    it('warns when the key shows immediately and multiple attempts are allowed', () => {
      expect(keys({ ...base(), attemptsAllowed: 3 })).toContain('answer-key-leak');
    });

    it('does NOT warn for a single attempt', () => {
      expect(keys({ ...base(), attemptsAllowed: 1 })).not.toContain('answer-key-leak');
    });

    it('does NOT warn when results are sealed until close', () => {
      expect(
        keys({ ...base(), attemptsAllowed: 0, sealResultsUntilClose: true }),
      ).not.toContain('answer-key-leak');
    });

    it('does NOT warn when the answer key is hidden, review is off, or answers are scores-only', () => {
      expect(keys({ ...base(), attemptsAllowed: 0, showCorrectAnswers: false })).not.toContain('answer-key-leak');
      expect(keys({ ...base(), attemptsAllowed: 0, allowSubmissionReview: false })).not.toContain('answer-key-leak');
      expect(keys({ ...base(), attemptsAllowed: 0, showResponses: false })).not.toContain('answer-key-leak');
    });
  });

  describe('scheduled-generation-draft', () => {
    const scheduled = { manualGeneration: true, generationDate: '2026-09-01T00:00:00Z' };

    it('adds an info tip when a scheduled generation time is set on a draft', () => {
      const out = quizSettingsWarnings({ ...base(), ...scheduled, isPublished: false });
      expect(out.map((w) => w.key)).toContain('scheduled-generation-draft');
      expect(out.find((w) => w.key === 'scheduled-generation-draft')?.level).toBe('info');
    });

    it('stays silent when the quiz is published, or no date is set', () => {
      expect(keys({ ...base(), ...scheduled })).not.toContain('scheduled-generation-draft');
      expect(
        keys({ ...base(), manualGeneration: true, generationDate: null, isPublished: false }),
      ).not.toContain('scheduled-generation-draft');
    });
  });

  describe('draft-not-published', () => {
    it('adds an info tip for a draft quiz', () => {
      const draft = quizSettingsWarnings({ ...base(), isPublished: false });
      expect(draft.map((w) => w.key)).toContain('draft-not-published');
      expect(draft.find((w) => w.key === 'draft-not-published')?.level).toBe('info');
    });
  });
});
