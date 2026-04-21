// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { CommentIO, UiComment, getCommentKind, getCommentLabel, setPdfVerticalMap } from '../comments';
import { RubricComment } from '../../api-client';
import { makeComment } from '../../test-utils';
import { encodeRegion } from '../../features/code-review/code-panel/pdfRegionComment';

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

  it('sorts two new comments (both negative ids) on the same line', () => {
    const comments = [
      makeComment({ id: -2, startLine: 1, startChar: 0 }),
      makeComment({ id: -1, startLine: 1, startChar: 0 }),
    ];
    const sorted = CommentIO.sortComments(comments);
    // Both negative: comparator returns a.id + b.id (always negative), so order reverses
    expect(sorted.map((c) => c.id)).toEqual([-1, -2]);
  });

  it('puts new comment (negative id) after existing comment (positive id) when b is negative', () => {
    const comments = [
      makeComment({ id: 5, startLine: 1, startChar: 0 }),
      makeComment({ id: -1, startLine: 1, startChar: 0 }),
    ];
    const sorted = CommentIO.sortComments(comments);
    expect(sorted.map((c) => c.id)).toEqual([5, -1]);
  });

  it('treats null startChar as 0', () => {
    const comments = [
      makeComment({ id: 1, startLine: 1, startChar: null as unknown as number }),
      makeComment({ id: 2, startLine: 1, startChar: 5 }),
    ];
    const sorted = CommentIO.sortComments(comments);
    expect(sorted[1].startChar).toBe(5);
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

  it('sums ids when both are negative (new comments)', () => {
    const a = makeComment({ id: -2, startLine: 1, startChar: 0 });
    const b = makeComment({ id: -3, startLine: 1, startChar: 0 });
    expect(CommentIO.compare(a, b)).toBeLessThan(0);
  });

  it('returns positive when a is new (negative) and b is existing (positive)', () => {
    const a = makeComment({ id: -1, startLine: 1, startChar: 0 });
    const b = makeComment({ id: 5, startLine: 1, startChar: 0 });
    expect(CommentIO.compare(a, b)).toBeGreaterThan(0);
  });

  it('returns negative when a is existing (positive) and b is new (negative)', () => {
    const a = makeComment({ id: 5, startLine: 1, startChar: 0 });
    const b = makeComment({ id: -1, startLine: 1, startChar: 0 });
    expect(CommentIO.compare(a, b)).toBeLessThan(0);
  });

  it('treats null startChar as 0', () => {
    const a = makeComment({ id: 1, startLine: 1, startChar: null as unknown as number });
    const b = makeComment({ id: 2, startLine: 1, startChar: 0 });
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
    const rubricComment = { pointDelta: -5 } as unknown as RubricComment;
    expect(UiComment.points(makeComment({ pointDelta: -1 }), rubricComment)).toBe(-5);
  });

  it('returns 0 when pointDelta is null', () => {
    expect(UiComment.points(makeComment({ pointDelta: null }))).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// UiComment.isEmpty
// ---------------------------------------------------------------------------
describe('UiComment.isEmpty', () => {
  it('returns true when text is empty, pointDelta is 0, and no rubricComment', () => {
    expect(UiComment.isEmpty(makeComment({ text: '', pointDelta: 0, rubricComment: null }))).toBe(true);
  });

  it('returns true when text is undefined', () => {
    expect(UiComment.isEmpty(makeComment({ text: undefined, pointDelta: 0, rubricComment: null }))).toBe(true);
  });

  it('returns false when text has content', () => {
    expect(UiComment.isEmpty(makeComment({ text: 'fix this' }))).toBe(false);
  });

  it('returns false when pointDelta is nonzero', () => {
    expect(UiComment.isEmpty(makeComment({ text: '', pointDelta: -1, rubricComment: null }))).toBe(false);
  });

  it('returns false when rubricComment is set', () => {
    expect(UiComment.isEmpty(makeComment({ text: '', pointDelta: 0, rubricComment: 42 }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Region comment sorting
// ---------------------------------------------------------------------------
describe('CommentIO.compare with region comments', () => {
  it('sorts region comment higher on page before region comment lower on page', () => {
    const top = encodeRegion(10, 10, 50, 30); // top region: topPct=10
    const bottom = encodeRegion(10, 60, 50, 80); // bottom region: topPct=60
    const a = makeComment({ id: 1, startLine: 1, endLine: 1, ...top });
    const b = makeComment({ id: 2, startLine: 1, endLine: 1, ...bottom });
    expect(CommentIO.compare(a, b)).toBeLessThan(0);
  });

  it('sorts region comment lower on page after region comment higher on page', () => {
    const top = encodeRegion(10, 10, 50, 30);
    const bottom = encodeRegion(10, 60, 50, 80);
    const a = makeComment({ id: 1, startLine: 1, endLine: 1, ...bottom });
    const b = makeComment({ id: 2, startLine: 1, endLine: 1, ...top });
    expect(CommentIO.compare(a, b)).toBeGreaterThan(0);
  });

  it('sorts region comments at the same vertical position by id', () => {
    const regionA = encodeRegion(10, 50, 40, 70);
    const regionB = encodeRegion(60, 50, 90, 70);
    const a = makeComment({ id: 3, startLine: 1, endLine: 1, ...regionA });
    const b = makeComment({ id: 7, startLine: 1, endLine: 1, ...regionB });
    // Same topPct (50), so falls through to id comparison
    expect(CommentIO.compare(a, b)).toBeLessThan(0);
  });

  it('sorts region comments on different pages by page number', () => {
    const region1 = encodeRegion(10, 80, 50, 90); // page 1, near bottom
    const region2 = encodeRegion(10, 10, 50, 20); // page 2, near top
    const a = makeComment({ id: 1, startLine: 1, endLine: 1, ...region1 });
    const b = makeComment({ id: 2, startLine: 2, endLine: 2, ...region2 });
    expect(CommentIO.compare(a, b)).toBeLessThan(0); // page 1 < page 2
  });
});

describe('CommentIO.sortComments with region comments', () => {
  it('sorts multiple region comments on the same page by vertical position', () => {
    const middle = encodeRegion(10, 50, 50, 60);
    const top = encodeRegion(10, 10, 50, 20);
    const bottom = encodeRegion(10, 80, 50, 95);
    const comments = [
      makeComment({ id: 1, startLine: 1, endLine: 1, ...middle }),
      makeComment({ id: 2, startLine: 1, endLine: 1, ...top }),
      makeComment({ id: 3, startLine: 1, endLine: 1, ...bottom }),
    ];
    const sorted = CommentIO.sortComments(comments);
    expect(sorted.map((c) => c.id)).toEqual([2, 1, 3]);
  });

  it('mixes region comments with page-level comments (page-level first)', () => {
    const region = encodeRegion(10, 50, 50, 60);
    const comments = [
      makeComment({ id: 1, startLine: 1, endLine: 1, ...region }),
      makeComment({ id: 2, startLine: 1, endLine: 1, startChar: 0, endChar: 0 }), // page-level
    ];
    const sorted = CommentIO.sortComments(comments);
    // Page-level has sortKey=0, region has sortKey > 0 → page-level first
    expect(sorted.map((c) => c.id)).toEqual([2, 1]);
  });

  it('interleaves region and text comments using vertical position mapping', () => {
    // Simulate a page where char offsets map to vertical positions:
    // chars 0–1000 → 0–30% (dense header), chars 1000–2000 → 30–50% (body), chars 2000–3000 → 65–90% (after image gap)
    setPdfVerticalMap(99, 1, [
      { charOffset: 0, verticalPct: 0 },
      { charOffset: 1000, verticalPct: 30 },
      { charOffset: 2000, verticalPct: 50 },
      { charOffset: 2500, verticalPct: 65 },
      { charOffset: 3000, verticalPct: 90 },
    ]);
    // Region at topPct=60 (between the text gap at 50% and 65%)
    const region = encodeRegion(10, 60, 80, 80);
    const comments = [
      makeComment({ id: 1, startLine: 1, endLine: 1, file: 99, ...region }), // sort key: 60
      makeComment({ id: 2, startLine: 1, endLine: 1, file: 99, startChar: 2000, endChar: 2100 }), // sort key: 50
      makeComment({ id: 3, startLine: 1, endLine: 1, file: 99, startChar: 2500, endChar: 2600 }), // sort key: 65
    ];
    const sorted = CommentIO.sortComments(comments);
    // Text at 50%, region at 60%, text at 65%
    expect(sorted.map((c) => c.id)).toEqual([2, 1, 3]);
  });
});

// ---------------------------------------------------------------------------
// getCommentKind
// ---------------------------------------------------------------------------
describe('getCommentKind', () => {
  it('returns "code" for code files', () => {
    expect(getCommentKind(makeComment({ startChar: 5, endChar: 10 }), 'code')).toBe('code');
  });

  it('returns "markdown" for markdown files', () => {
    expect(getCommentKind(makeComment({ startChar: 0, endChar: 0 }), 'markdown')).toBe('markdown');
  });

  it('returns "jupyter" for jupyter files', () => {
    expect(getCommentKind(makeComment({ startChar: 0, endChar: 0 }), 'jupyter')).toBe('jupyter');
  });

  it('returns "image" for image files', () => {
    expect(getCommentKind(makeComment({ startChar: 0, endChar: 0 }), 'image')).toBe('image');
  });

  it('returns "pdf-page" for page-level PDF comments', () => {
    expect(getCommentKind(makeComment({ startChar: 0, endChar: 0, startLine: 1, endLine: 1 }), 'pdf')).toBe('pdf-page');
  });

  it('returns "pdf-text" for text-offset PDF comments', () => {
    expect(getCommentKind(makeComment({ startChar: 50, endChar: 200, startLine: 1, endLine: 1 }), 'pdf')).toBe(
      'pdf-text',
    );
  });

  it('returns "pdf-region" for region PDF comments', () => {
    const region = encodeRegion(10, 20, 80, 90);
    expect(getCommentKind(makeComment({ ...region, startLine: 1, endLine: 1 }), 'pdf')).toBe('pdf-region');
  });

  it('returns "pdf-page" when startChar and endChar are null', () => {
    expect(
      getCommentKind(
        makeComment({
          startChar: null as unknown as number,
          endChar: null as unknown as number,
          startLine: 2,
          endLine: 2,
        }),
        'pdf',
      ),
    ).toBe('pdf-page');
  });
});

// ---------------------------------------------------------------------------
// getCommentLabel
// ---------------------------------------------------------------------------
describe('getCommentLabel', () => {
  it('returns "Line N" for code comments', () => {
    expect(getCommentLabel('code', 0)).toBe('Line 1');
  });

  it('returns "Lines N–M" for multi-line code comments', () => {
    expect(getCommentLabel('code', 0, 4)).toBe('Lines 1\u20135');
  });

  it('returns "Cell N" for markdown comments', () => {
    expect(getCommentLabel('markdown', 2)).toBe('Cell 3');
  });

  it('returns "Cell N" for jupyter comments', () => {
    expect(getCommentLabel('jupyter', 0)).toBe('Cell 1');
  });

  it('returns "Cell N" for image comments', () => {
    expect(getCommentLabel('image', 0)).toBe('Cell 1');
  });

  it('returns "Page N" for pdf-page comments', () => {
    expect(getCommentLabel('pdf-page', 2)).toBe('Page 2');
  });

  it('returns "Page N" for pdf-text comments', () => {
    expect(getCommentLabel('pdf-text', 1)).toBe('Page 1');
  });

  it('returns "Page N" for pdf-region comments', () => {
    expect(getCommentLabel('pdf-region', 3)).toBe('Page 3');
  });
});
