// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { compare } from '../SortUtils';

describe('compare', () => {
  describe('ascending', () => {
    it('returns -1 when a < b', () => {
      expect(compare(true, 1, 2)).toBe(-1);
    });

    it('returns 1 when a > b', () => {
      expect(compare(true, 2, 1)).toBe(1);
    });

    it('returns 0 when a === b', () => {
      expect(compare(true, 1, 1)).toBe(0);
    });

    it('returns -1 when b is null', () => {
      expect(compare(true, 1, null)).toBe(-1);
    });

    it('returns 1 when a is null', () => {
      expect(compare(true, null, 1)).toBe(1);
    });

    it('returns 0 when both are null', () => {
      expect(compare(true, null, null)).toBe(0);
    });
  });

  describe('descending', () => {
    it('returns 1 when a < b', () => {
      expect(compare(false, 1, 2)).toBe(1);
    });

    it('returns -1 when a > b', () => {
      expect(compare(false, 2, 1)).toBe(-1);
    });

    it('returns 0 when a === b', () => {
      expect(compare(false, 1, 1)).toBe(0);
    });

    it('returns 1 when b is null', () => {
      expect(compare(false, 1, null)).toBe(1);
    });

    it('returns -1 when a is null', () => {
      expect(compare(false, null, 1)).toBe(-1);
    });
  });

  describe('with strings', () => {
    it('compares strings ascending', () => {
      expect(compare(true, 'apple', 'banana')).toBe(-1);
    });

    it('compares strings descending', () => {
      expect(compare(false, 'apple', 'banana')).toBe(1);
    });

    it('returns 0 for equal strings', () => {
      expect(compare(true, 'alpha', 'alpha')).toBe(0);
    });
  });
});
