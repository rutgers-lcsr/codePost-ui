// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { commentIdFromSearch } from '../codeConsoleUtils';

// scrollToCommentID used to be parseInt(...) of a missing param: NaN, which the Comments panel
// treats as "scroll to a comment" (NaN !== undefined) and re-arms a navigate() on every render,
// bouncing a grader who leaves the console (Home, Open rubric) straight back to /code/:id.
describe('commentIdFromSearch', () => {
  it('is undefined when there is no comment param', () => {
    expect(commentIdFromSearch('')).toBeUndefined();
    expect(commentIdFromSearch('?foo=1')).toBeUndefined();
  });
  it('is undefined for a non-numeric comment param', () => {
    expect(commentIdFromSearch('?comment=abc')).toBeUndefined();
    expect(commentIdFromSearch('?comment=')).toBeUndefined();
  });
  it('parses a numeric comment param', () => {
    expect(commentIdFromSearch('?comment=42')).toBe(42);
  });
});
