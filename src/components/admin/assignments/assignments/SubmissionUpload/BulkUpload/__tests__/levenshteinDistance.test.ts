// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import levenshteinDistance from '../levenshteinDistance';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('abc', 'abc')).toBe(0);
  });

  it('returns length of other string when one is empty', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('hello', '')).toBe(5);
  });

  it('returns 0 for two empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('computes single insertion', () => {
    expect(levenshteinDistance('abc', 'abcd')).toBe(1);
  });

  it('computes single deletion', () => {
    expect(levenshteinDistance('abcd', 'abc')).toBe(1);
  });

  it('computes single substitution', () => {
    expect(levenshteinDistance('abc', 'axc')).toBe(1);
  });

  it('handles completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
  });

  it('computes known example: kitten → sitting', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });
});
