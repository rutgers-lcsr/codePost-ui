// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openSubmission, openSubmissionInSameTab } from '../AdminUtils';

describe('AdminUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('openSubmission', () => {
    it('opens submission in a new tab', () => {
      const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
      openSubmission(42);
      expect(spy).toHaveBeenCalledWith('/code/42');
    });

    it('works with string IDs', () => {
      const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
      openSubmission('99');
      expect(spy).toHaveBeenCalledWith('/code/99');
    });
  });

  describe('openSubmissionInSameTab', () => {
    it('opens submission in the same tab', () => {
      const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
      openSubmissionInSameTab(7);
      expect(spy).toHaveBeenCalledWith('/code/7', '_self');
    });
  });
});
