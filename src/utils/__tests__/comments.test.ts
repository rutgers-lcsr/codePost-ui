// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { CommentIO, UiComment } from '../comments';
import type { CommentType } from '../comments';

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------
function makeComment(overrides: Partial<CommentType> = {}): CommentType {
  return {
    id: 1,
    text: 'Test comment',
    startLine: 1,
    endLine: 1,
    startChar: 0,
    endChar: 10,
    pointDelta: 0,
    rubricComment: null,
    file: 1,
    submission: 1,
    author: 'test@example.com',
    ...overrides,
  } as CommentType;
}

// ---------------------------------------------------------------------------
// CommentIO.sortComments
// ---------------------------------------------------------------------------
describe('CommentIO.sortComments', () => {
  it('sorts comments by startLine ascending', () => {
    const comments = [
      makeComment({ id: 1, startLine: 5 }),
      makeComment({ id: 2, startLine: 1 }),
      makeComment({ id: 3, startLine: 3 }),
    ];
    const sorted = CommentIO.sortComments(comments);
    expect(sorted.map((c) => c.startLine)).toEqual([1, 3, 5]);
  });

  it('sorts by startChar when startLine is equal (greater startChar sorted after)', () => {
    const comments = [
      makeComment({ id: 2, startLine: 1, startChar: 10 }),
      makeComment({ id: 1, startLine: 1, startChar: 5 }),
    ];
    const sorted = CommentIO.sortComments(comments);
    // When a.startChar > b.startChar, a sorts after b
    expect(sorted[0].startChar).toBe(5);
    expect(sorted[1].startChar).toBe(10);
  });

  it('sorts by id when startLine and startChar are equal (both positive ids)', () => {
    const comments = [
      makeComment({ id: 10, startLine: 1, startChar: 0 }),
      makeComment({ id: 5, startLine: 1, startChar: 0 }),
    ];
    const sorted = CommentIO.sortComments(comments);
    expect(sorted.map((c) => c.id)).toEqual([5, 10]);
  });

  it('puts existing comments (positive id) before new comments (negative id)', () => {
    const comments = [
      makeComment({ id: -1, startLine: 1, startChar: 0 }),
      makeComment({ id: 5, startLine: 1, startChar: 0 }),
    ];
    const sorted = CommentIO.sortComments(comments);
    expect(sorted.map((c) => c.id)).toEqual([5, -1]);
  });

  it('handles empty array', () => {
    expect(CommentIO.sortComments([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// CommentIO.compare
// ---------------------------------------------------------------------------
describe('CommentIO.compare', () => {
  it('returns negative when a is on an earlier line', () => {
    const a = makeComment({ startLine: 1 });
    const b = makeComment({ startLine: 5 });
    expect(CommentIO.compare(a, b)).toBeLessThan(0);
  });

  it('returns positive when a is on a later line', () => {
    const a = makeComment({ startLine: 10 });
    const b = makeComment({ startLine: 5 });
    expect(CommentIO.compare(a, b)).toBeGreaterThan(0);
  });

  it('compares by startChar when on the same line', () => {
    const a = makeComment({ startLine: 1, startChar: 5 });
    const b = makeComment({ startLine: 1, startChar: 10 });
    expect(CommentIO.compare(a, b)).toBeLessThan(0);
  });

  it('compares by id when line and char are the same', () => {
    const a = makeComment({ id: 3, startLine: 1, startChar: 0 });
    const b = makeComment({ id: 7, startLine: 1, startChar: 0 });
    expect(CommentIO.compare(a, b)).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// CommentIO.sortedIndex
// ---------------------------------------------------------------------------
describe('CommentIO.sortedIndex', () => {
  it('returns 0 for insertion before all comments', () => {
    const comments = [makeComment({ id: 1, startLine: 5 }), makeComment({ id: 2, startLine: 10 })];
    const newComment = makeComment({ id: 3, startLine: 1 });
    expect(CommentIO.sortedIndex(comments, newComment)).toBe(0);
  });

  it('returns length for insertion after all comments', () => {
    const comments = [makeComment({ id: 1, startLine: 1 }), makeComment({ id: 2, startLine: 2 })];
    const newComment = makeComment({ id: 3, startLine: 100 });
    expect(CommentIO.sortedIndex(comments, newComment)).toBe(2);
  });

  it('returns correct middle index', () => {
    const comments = [makeComment({ id: 1, startLine: 1 }), makeComment({ id: 2, startLine: 10 })];
    const newComment = makeComment({ id: 3, startLine: 5 });
    expect(CommentIO.sortedIndex(comments, newComment)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// UiComment.isNew
// ---------------------------------------------------------------------------
describe('UiComment.isNew', () => {
  it('returns true for negative id', () => {
    expect(UiComment.isNew(makeComment({ id: -1 }))).toBe(true);
  });

  it('returns false for positive id', () => {
    expect(UiComment.isNew(makeComment({ id: 1 }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UiComment.points
// ---------------------------------------------------------------------------
describe('UiComment.points', () => {
  it('returns comment pointDelta when no rubricComment is provided', () => {
    expect(UiComment.points(makeComment({ pointDelta: -3 }))).toBe(-3);
  });

  it('returns rubricComment pointDelta when provided', () => {
    const rubricComment = { pointDelta: -5 } as any;
    expect(UiComment.points(makeComment({ pointDelta: -1 }), rubricComment)).toBe(-5);
  });

  it('returns 0 when pointDelta is null', () => {
    expect(UiComment.points(makeComment({ pointDelta: null } as any))).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// UiComment.isEmpty
// ---------------------------------------------------------------------------
describe('UiComment.isEmpty', () => {
  it('returns true when text is empty, pointDelta is 0, and no rubricComment', () => {
    expect(UiComment.isEmpty(makeComment({ text: '', pointDelta: 0, rubricComment: null }))).toBe(true);
  });

  it('returns true when text is null', () => {
    expect(UiComment.isEmpty(makeComment({ text: null, pointDelta: 0, rubricComment: null } as any))).toBe(true);
  });

  it('returns false when text has content', () => {
    expect(UiComment.isEmpty(makeComment({ text: 'fix this' }))).toBe(false);
  });

  it('returns false when pointDelta is nonzero', () => {
    expect(UiComment.isEmpty(makeComment({ text: '', pointDelta: -1, rubricComment: null }))).toBe(false);
  });

  it('returns false when rubricComment is set', () => {
    expect(UiComment.isEmpty(makeComment({ text: '', pointDelta: 0, rubricComment: 42 } as any))).toBe(false);
  });
});
