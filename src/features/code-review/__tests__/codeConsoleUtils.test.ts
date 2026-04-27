// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import type { RubricCategory } from '@api-client';
import type { FileType } from '../../utils/file';
import type { ICommentToRubricCommentMap, IFileToCommentsMap } from '../../types/common';
import { makeComment, makeFile, makeRubricComment, makeTestCase, makeSubmissionTest as makeSubTest } from '@test-utils';
import {
  addCommentToState,
  removeCommentFromState,
  updateCommentsState,
  addToCommentRubricCommentsState,
  removeFromCommentRubricCommentsState,
  linkRubricComment,
  unlinkRubricComment,
  pointsInFile,
  genericCommentPoints,
  pointsPerCategory,
  pointsPerCategoryWithCaps,
  pointsFromTests,
  calculateGrade,
  filterCurrentFileVersions,
  fileBouncer,
} from '../codeConsoleUtils';

// ---------------------------------------------------------------------------
// Comment State Management
// ---------------------------------------------------------------------------
describe('addCommentToState', () => {
  it('adds a comment to the correct file', () => {
    const comments: IFileToCommentsMap = { 10: [] };
    const comment = makeComment({ id: 1, file: 10, startLine: 5 });
    const result = addCommentToState(comments, comment, makeFile());
    expect(result[10]).toHaveLength(1);
    expect(result[10][0].id).toBe(1);
  });

  it('adds to existing comments and sorts', () => {
    const existing = makeComment({ id: 2, file: 10, startLine: 10 });
    const comments: IFileToCommentsMap = { 10: [existing] };
    const newComment = makeComment({ id: 3, file: 10, startLine: 1 });
    const result = addCommentToState(comments, newComment, makeFile());
    expect(result[10]).toHaveLength(2);
  });
});

describe('removeCommentFromState', () => {
  it('removes a comment by id', () => {
    const c1 = makeComment({ id: 1, file: 10 });
    const c2 = makeComment({ id: 2, file: 10 });
    const comments: IFileToCommentsMap = { 10: [c1, c2] };
    const result = removeCommentFromState(comments, c1);
    expect(result[10]).toHaveLength(1);
    expect(result[10][0].id).toBe(2);
  });
});

describe('updateCommentsState', () => {
  it('updates comment in place when ID unchanged', () => {
    const c1 = makeComment({ id: 1, file: 10, text: 'old' });
    const comments: IFileToCommentsMap = { 10: [c1] };
    const updated = makeComment({ id: 1, file: 10, text: 'new' });
    const result = updateCommentsState(comments, 1, updated);
    expect(result[10][0].text).toBe('new');
  });

  it('handles ID change (negative to positive)', () => {
    const c1 = makeComment({ id: -1, file: 10, text: 'saving' });
    const comments: IFileToCommentsMap = { 10: [c1] };
    const saved = makeComment({ id: 42, file: 10, text: 'saving' });
    const result = updateCommentsState(comments, -1, saved);
    expect(result[10]).toHaveLength(1);
    expect(result[10][0].id).toBe(42);
  });

  it('adds as new when comment not found', () => {
    const comments: IFileToCommentsMap = { 10: [] };
    const newComment = makeComment({ id: 5, file: 10 });
    const result = updateCommentsState(comments, 999, newComment);
    expect(result[10]).toHaveLength(1);
    expect(result[10][0].id).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Rubric Comment State
// ---------------------------------------------------------------------------
describe('addToCommentRubricCommentsState', () => {
  it('adds rubric comment mapping', () => {
    const map: ICommentToRubricCommentMap = {};
    const rc = makeRubricComment({ id: 100 });
    const result = addToCommentRubricCommentsState(map, 1, rc);
    expect(result[1]).toBe(rc);
  });

  it('returns unchanged map when no rubric comment provided', () => {
    const map: ICommentToRubricCommentMap = {};
    const result = addToCommentRubricCommentsState(map, 1, undefined);
    expect(result).toBe(map);
  });
});

describe('removeFromCommentRubricCommentsState', () => {
  it('removes and returns the rubric comment', () => {
    const rc = makeRubricComment({ id: 100 });
    const map: ICommentToRubricCommentMap = { 1: rc };
    const [removed, rest] = removeFromCommentRubricCommentsState(map, 1);
    expect(removed).toBe(rc);
    expect(rest).not.toHaveProperty('1');
  });
});

describe('linkRubricComment', () => {
  it('links rubric comment to active comment', () => {
    const c1 = makeComment({ id: 5, file: 10, rubricComment: null, pointDelta: -3 });
    const comments: IFileToCommentsMap = { 10: [c1] };
    const rc = makeRubricComment({ id: 100 });
    const result = linkRubricComment(comments, rc, 5);
    expect(result).toBeDefined();
    expect(result![10][0].rubricComment).toBe(100);
    expect(result![10][0].pointDelta).toBeNull();
  });

  it('returns undefined when comment not found', () => {
    const comments: IFileToCommentsMap = { 10: [] };
    const rc = makeRubricComment();
    expect(linkRubricComment(comments, rc, 999)).toBeUndefined();
  });
});

describe('unlinkRubricComment', () => {
  it('unlinks rubric comment and restores pointDelta', () => {
    const rc = makeRubricComment({ id: 100, pointDelta: -5 });
    const c1 = makeComment({ id: 5, file: 10, rubricComment: 100, pointDelta: null });
    const comments: IFileToCommentsMap = { 10: [c1] };
    const result = unlinkRubricComment(comments, c1, rc);
    expect(result[10][0].rubricComment).toBeNull();
    expect(result[10][0].pointDelta).toBe(-5);
  });
});

// ---------------------------------------------------------------------------
// Grading Calculations
// ---------------------------------------------------------------------------
describe('pointsInFile', () => {
  it('separates deductions and bonuses', () => {
    const comments = [
      makeComment({ id: 1, pointDelta: 5 }), // deduction
      makeComment({ id: 2, pointDelta: -3 }), // bonus
    ];
    const [deductions, bonuses] = pointsInFile(makeFile(), comments, {});
    expect(deductions).toBe(5);
    expect(bonuses).toBe(3);
  });

  it('ignores unsaved (new) comments', () => {
    const comments = [makeComment({ id: -1, pointDelta: 5 })];
    const [deductions, bonuses] = pointsInFile(makeFile(), comments, {});
    expect(deductions).toBe(0);
    expect(bonuses).toBe(0);
  });

  it('uses rubric comment points when linked', () => {
    const c = makeComment({ id: 1, rubricComment: 100, pointDelta: null });
    const rc = makeRubricComment({ id: 100, pointDelta: 3 });
    const rcMap: ICommentToRubricCommentMap = { 1: rc };
    const [deductions] = pointsInFile(makeFile(), [c], rcMap);
    expect(deductions).toBe(3);
  });
});

describe('genericCommentPoints', () => {
  it('sums pointDelta across files', () => {
    const comments: IFileToCommentsMap = {
      10: [makeComment({ id: 1, pointDelta: -3 }), makeComment({ id: 2, pointDelta: -2 })],
      20: [makeComment({ id: 3, pointDelta: -1 })],
    };
    expect(genericCommentPoints(comments)).toBe(-6);
  });

  it('ignores new comments', () => {
    const comments: IFileToCommentsMap = {
      10: [makeComment({ id: -1, pointDelta: -5 })],
    };
    expect(genericCommentPoints(comments)).toBe(0);
  });

  it('filters by file set', () => {
    const comments: IFileToCommentsMap = {
      10: [makeComment({ id: 1, pointDelta: -3 })],
      20: [makeComment({ id: 2, pointDelta: -2 })],
    };
    const fileSet = new Set([10]);
    expect(genericCommentPoints(comments, fileSet)).toBe(-3);
  });

  it('ignores comments with no pointDelta', () => {
    const comments: IFileToCommentsMap = {
      10: [makeComment({ id: 1, pointDelta: 0 })],
    };
    expect(genericCommentPoints(comments)).toBe(0);
  });
});

describe('pointsPerCategory', () => {
  it('sums rubric comment points per category', () => {
    const rcMap: ICommentToRubricCommentMap = {
      1: makeRubricComment({ id: 100, category: 1, pointDelta: -3 }),
      2: makeRubricComment({ id: 101, category: 1, pointDelta: -2 }),
      3: makeRubricComment({ id: 102, category: 2, pointDelta: -5 }),
    };
    const result = pointsPerCategory(rcMap);
    expect(result[1]).toBe(-5);
    expect(result[2]).toBe(-5);
  });

  it('ignores unsaved comment IDs (negative)', () => {
    const rcMap: ICommentToRubricCommentMap = {
      '-1': makeRubricComment({ id: 100, category: 1, pointDelta: -3 }),
    } as unknown as ICommentToRubricCommentMap;
    const result = pointsPerCategory(rcMap);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('filters by comment set', () => {
    const rcMap: ICommentToRubricCommentMap = {
      1: makeRubricComment({ id: 100, category: 1, pointDelta: -3 }),
      2: makeRubricComment({ id: 101, category: 1, pointDelta: -2 }),
    };
    const commentSet = new Set([1]);
    const result = pointsPerCategory(rcMap, commentSet);
    expect(result[1]).toBe(-3);
  });
});

describe('pointsPerCategoryWithCaps', () => {
  it('caps positive pointDelta to pointLimit', () => {
    const ppc = { 1: 10 };
    const categories = [{ id: 1, pointLimit: 5 }] as RubricCategory[];
    const result = pointsPerCategoryWithCaps(ppc, categories);
    expect(result[1]).toBe(5);
  });

  it('caps negative pointDelta to negative pointLimit', () => {
    const ppc = { 1: -10 };
    const categories = [{ id: 1, pointLimit: -5 }] as RubricCategory[];
    const result = pointsPerCategoryWithCaps(ppc, categories);
    expect(result[1]).toBe(-5);
  });

  it('uses 99999 when pointLimit is null', () => {
    const ppc = { 1: 50 };
    const categories = [{ id: 1, pointLimit: null }] as RubricCategory[];
    const result = pointsPerCategoryWithCaps(ppc, categories);
    expect(result[1]).toBe(50);
  });

  it('uses 99999 when pointLimit is undefined', () => {
    const ppc = { 1: 50 };
    const categories = [{ id: 1 }] as unknown as RubricCategory[];
    const result = pointsPerCategoryWithCaps(ppc, categories);
    expect(result[1]).toBe(50);
  });

  it('uses 99999 when category not found', () => {
    const ppc = { 999: 50 };
    const categories = [{ id: 1, pointLimit: 5 }] as RubricCategory[];
    const result = pointsPerCategoryWithCaps(ppc, categories);
    expect(result[999]).toBe(50);
  });
});

describe('pointsFromTests', () => {
  it('returns negative sum of points for passed tests', () => {
    const tests = [makeSubTest({ id: 1, testCase: 1, passed: true })];
    const testCases = [makeTestCase({ id: 1, pointsPass: 10, pointsFail: 0 })];
    expect(pointsFromTests(tests, testCases)).toBe(-10);
  });

  it('returns negative sum of pointsFail for failed tests', () => {
    const tests = [makeSubTest({ id: 1, testCase: 1, passed: false })];
    const testCases = [makeTestCase({ id: 1, pointsPass: 10, pointsFail: -5 })];
    expect(pointsFromTests(tests, testCases)).toBe(5);
  });

  it('returns 0 when testCase not found', () => {
    const tests = [makeSubTest({ id: 1, testCase: 999, passed: true })];
    expect(pointsFromTests(tests, [])).toBe(-0);
  });

  it('uses score/maxScore when available (partial credit)', () => {
    const tests = [
      makeSubTest({
        id: 1,
        testCase: 1,
        passed: false,
        score: 7 as unknown as undefined,
        maxScore: 10 as unknown as undefined,
      }),
    ];
    const testCases = [makeTestCase({ id: 1, pointsPass: 10, pointsFail: 0 })];
    expect(pointsFromTests(tests, testCases)).toBe(-7);
  });

  it('clamps score to maxScore', () => {
    const tests = [
      makeSubTest({
        id: 1,
        testCase: 1,
        passed: true,
        score: 15 as unknown as undefined,
        maxScore: 10 as unknown as undefined,
      }),
    ];
    const testCases = [makeTestCase({ id: 1 })];
    expect(pointsFromTests(tests, testCases)).toBe(-10);
  });

  it('handles empty arrays', () => {
    expect(pointsFromTests([], [])).toBe(-0);
  });

  it('uses latest test per test case', () => {
    const tests = [
      makeSubTest({ id: 1, testCase: 1, passed: false, modified: '2025-01-01T00:00:00Z' }),
      makeSubTest({ id: 2, testCase: 1, passed: true, modified: '2025-06-01T00:00:00Z' }),
    ];
    const testCases = [makeTestCase({ id: 1, pointsPass: 10, pointsFail: 0 })];
    expect(pointsFromTests(tests, testCases)).toBe(-10); // Uses the latest (passed)
  });
});

// ---------------------------------------------------------------------------
// File Filtering
// ---------------------------------------------------------------------------
describe('filterCurrentFileVersions', () => {
  it('keeps only the latest version of each file path', () => {
    const files = [
      makeFile({ id: 1, name: 'main.py', path: '', created: '2025-01-01T00:00:00Z' }),
      makeFile({ id: 2, name: 'main.py', path: '', created: '2025-06-01T00:00:00Z' }),
    ];
    const [fileSet] = filterCurrentFileVersions(files);
    expect(fileSet.has(2)).toBe(true);
    expect(fileSet.has(1)).toBe(false);
  });

  it('handles files with different paths as distinct', () => {
    const files = [
      makeFile({ id: 1, name: 'main.py', path: 'src' }),
      makeFile({ id: 2, name: 'main.py', path: 'test' }),
    ];
    const [fileSet] = filterCurrentFileVersions(files);
    expect(fileSet.size).toBe(2);
  });

  it('builds comment set from IFileToCommentsMap', () => {
    const files = [makeFile({ id: 10 })];
    const comments: IFileToCommentsMap = {
      10: [makeComment({ id: 100 }), makeComment({ id: 101 })],
    };
    const [, commentSet] = filterCurrentFileVersions(files, comments);
    expect(commentSet.has(100)).toBe(true);
    expect(commentSet.has(101)).toBe(true);
  });

  it('handles files without created date', () => {
    const files = [
      makeFile({ id: 1, name: 'main.py', created: undefined }),
      makeFile({ id: 2, name: 'main.py', created: undefined }),
    ];
    const [fileSet] = filterCurrentFileVersions(files);
    expect(fileSet.size).toBe(1);
  });

  it('handles files with null path', () => {
    const files = [makeFile({ id: 1, name: 'main.py', path: null })];
    const [fileSet] = filterCurrentFileVersions(files);
    expect(fileSet.has(1)).toBe(true);
  });
});

describe('fileBouncer', () => {
  it('returns files unchanged when under size limit', () => {
    const files = [makeFile({ data: 'small content' })];
    const result = fileBouncer(files);
    expect(result[0]).toEqual(files[0]);
  });

  it('replaces content of oversized files', () => {
    const bigData = 'x'.repeat(600000);
    const files = [makeFile({ data: bigData })] as FileType[];
    const result = fileBouncer(files);
    expect((result[0] as { code?: string }).code).toContain('over the codePost allowable size');
  });

  it('does not bounce oversized PDF files', () => {
    const bigData = 'x'.repeat(600000);
    const files = [makeFile({ name: 'doc.pdf', extension: 'pdf', data: bigData })] as FileType[];
    const result = fileBouncer(files);
    expect((result[0] as { code?: string }).code).toBeUndefined();
  });

  it('does not bounce oversized ipynb files', () => {
    const bigData = 'x'.repeat(600000);
    const files = [makeFile({ name: 'nb.ipynb', extension: 'ipynb', data: bigData })] as FileType[];
    const result = fileBouncer(files);
    expect((result[0] as { code?: string }).code).toBeUndefined();
  });

  it('passes binary extension files through unchanged', () => {
    const files = [makeFile({ name: 'Main.class', extension: 'class', data: 'binary' })] as FileType[];
    const result = fileBouncer(files);
    expect((result[0] as { code?: string }).code).toBeUndefined();
    expect((result[0] as { data?: string }).data).toBe('binary');
  });

  it('does not mark non-binary files', () => {
    const files = [makeFile({ extension: 'py', data: 'code' })] as FileType[];
    const result = fileBouncer(files);
    expect((result[0] as { code?: string }).code).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// calculateGrade (integration-like test)
// ---------------------------------------------------------------------------
describe('calculateGrade', () => {
  const baseAssignment = {
    points: 100,
    additiveGrading: false,
    testsAffectGrade: true,
  } as unknown as import('../../types/models').AssignmentType;

  it('returns full points with no deductions', () => {
    const grade = calculateGrade(baseAssignment, { 10: [] }, {}, [], [makeFile()], [], []);
    expect(grade).toBe(100);
  });

  it('deducts generic comment points', () => {
    const comments: IFileToCommentsMap = {
      10: [makeComment({ id: 1, pointDelta: 10 })],
    };
    const grade = calculateGrade(baseAssignment, comments, {}, [], [makeFile()], [], []);
    expect(grade).toBe(90);
  });

  it('handles additive grading', () => {
    const additiveAssignment = { ...baseAssignment, additiveGrading: true };
    const grade = calculateGrade(
      additiveAssignment as unknown as import('../../types/models').AssignmentType,
      { 10: [] },
      {},
      [],
      [makeFile()],
      [],
      [],
    );
    expect(grade).toBe(0);
  });

  it('excludes test points when testsAffectGrade is false', () => {
    const noTestGrade = { ...baseAssignment, testsAffectGrade: false };
    const tests = [makeSubTest({ testCase: 1, passed: true })];
    const testCases = [makeTestCase({ id: 1, pointsPass: 50 })];
    const grade = calculateGrade(
      noTestGrade as unknown as import('../../types/models').AssignmentType,
      { 10: [] },
      {},
      [],
      [makeFile()],
      tests,
      testCases,
    );
    expect(grade).toBe(100); // tests don't affect grade
  });
});
