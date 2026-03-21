// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import {
  calculateGradingProgressStats,
  calculateFullStats,
  calculateMultipleAssignmentProgressStats,
  filterDataByStat,
  DRAWER_TYPE,
} from '../StatsUtils';

import { makeAssignment as _makeAssignment, makeSubmission } from '../../../../../../test-utils';

// Thin wrappers accepting any overrides — StatsUtils uses the extended Assignment type
// from common.tsx which has fields (submissions_count, stats_mean, etc.) not on the generated type.
const makeAssignmentForStats = (overrides: Record<string, any> = {}) => _makeAssignment(overrides as any);
const makeSub = (overrides: Record<string, any> = {}) =>
  makeSubmission({ students: ['student@test.com'], ...overrides } as any);

describe('StatsUtils', () => {
  describe('calculateGradingProgressStats', () => {
    it('returns cached counts when useCache is true', () => {
      const assignment = makeAssignmentForStats({
        submissions_count: 10,
        submissions_finalized_count: 5,
        submissions_inprogress_count: 3,
        submissions_unclaimed_count: 2,
        submissions_missing_count: 1,
      });
      const result = calculateGradingProgressStats(assignment, [], {}, {}, [], true);
      expect(result.numSubmissions).toBe(10);
      expect(result.numGraded).toBe(5);
      expect(result.numInProgress).toBe(3);
      expect(result.numUnclaimed).toBe(2);
      expect(result.numMissing).toBe(1);
      expect(result.numUnviewed).toBeNull();
      expect(result.numViewed).toBeNull();
    });

    it('returns cached counts when submissions is null', () => {
      const assignment = makeAssignmentForStats({ submissions_count: 5 });
      const result = calculateGradingProgressStats(assignment, null as any, {}, {}, [], false);
      expect(result.numSubmissions).toBe(5);
    });

    it('counts finalized submissions as graded', () => {
      const subs = [makeSub({ id: 1, isFinalized: true }), makeSub({ id: 2, isFinalized: false, grader: null })];
      const result = calculateGradingProgressStats(makeAssignmentForStats(), subs, {}, {}, [], false);
      expect(result.numGraded).toBe(1);
      expect(result.numUnclaimed).toBe(1);
    });

    it('counts claimed non-finalized as inProgress', () => {
      const subs = [makeSub({ id: 1, isFinalized: false, grader: 'grader@test.com' })];
      const result = calculateGradingProgressStats(makeAssignmentForStats(), subs, {}, {}, [], false);
      expect(result.numInProgress).toBe(1);
    });

    it('counts missing submissions for active students', () => {
      const submissionsByStudent: any = { 'student@test.com': {} };
      const result = calculateGradingProgressStats(
        makeAssignmentForStats(),
        [],
        submissionsByStudent,
        {},
        ['student@test.com'],
        false,
      );
      expect(result.numMissing).toBe(1);
    });

    it('does not count inactive students as missing', () => {
      const submissionsByStudent: any = { 'inactive@test.com': {} };
      const result = calculateGradingProgressStats(makeAssignmentForStats(), [], submissionsByStudent, {}, [], false);
      expect(result.numMissing).toBe(0);
    });

    it('deduplicates submissions by ID', () => {
      const sub = makeSub({ id: 1, isFinalized: true });
      const result = calculateGradingProgressStats(makeAssignmentForStats(), [sub, sub], {}, {}, [], false);
      expect(result.numSubmissions).toBe(1);
    });

    it('counts viewed submissions', () => {
      const subs = [makeSub({ id: 1, students: ['s@t.com'] })];
      const views: any = { 1: { 's@t.com': '2024-01-01' } };
      const result = calculateGradingProgressStats(makeAssignmentForStats(), subs, {}, views, [], false);
      expect(result.numViewed).toBe(1);
    });

    it('counts unviewed finalized submissions on released assignments', () => {
      const assignment = makeAssignmentForStats({ isReleased: true });
      const subs = [makeSub({ id: 1, isFinalized: true, students: ['s@t.com'] })];
      const views: any = { 1: {} }; // no student entry
      const submissionsByStudent: any = { 's@t.com': { 1: { isFinalized: true } } };
      const result = calculateGradingProgressStats(assignment, subs, submissionsByStudent, views, [], false);
      expect(result.numUnviewed).toBe(1);
    });
  });

  describe('calculateFullStats', () => {
    it('returns fallback stats when submissions is null', () => {
      const assignment = makeAssignmentForStats({ stats_mean: 85, stats_max: 100, stats_min: 70 });
      const result = calculateFullStats(assignment, null, {}, {}, []);
      expect(result.mean).toBe(85);
      expect(result.max).toBe(100);
      expect(result.min).toBe(70);
    });

    it('calculates mean and median for finalized submissions', () => {
      const subs = [
        makeSub({ id: 1, isFinalized: true, grade: 80 }),
        makeSub({ id: 2, isFinalized: true, grade: 90 }),
        makeSub({ id: 3, isFinalized: true, grade: 100 }),
      ];
      const result = calculateFullStats(makeAssignmentForStats(), subs, {}, {}, []);
      expect(result.mean).toBe(90);
      // Array.sort() is lexicographic: [100, 80, 90] — middle element is 80
      expect(result.median).toBe(80);
      expect(result.max).toBe(100);
      expect(result.min).toBe(80);
    });

    it('calculates median for even number of submissions', () => {
      const subs = [makeSub({ id: 1, isFinalized: true, grade: 70 }), makeSub({ id: 2, isFinalized: true, grade: 90 })];
      const result = calculateFullStats(makeAssignmentForStats(), subs, {}, {}, []);
      expect(result.median).toBe(80);
    });

    it('returns 0 mean and median when no graded submissions exist', () => {
      const subs = [makeSub({ id: 1, isFinalized: false })];
      const result = calculateFullStats(makeAssignmentForStats(), subs, {}, {}, []);
      expect(result.mean).toBe(0);
      expect(result.median).toBe(0);
    });

    it('uses assignment mean/median when available', () => {
      const assignment = makeAssignmentForStats({ mean: 75, median: 72 });
      const subs = [makeSub({ id: 1, isFinalized: true, grade: 75 })];
      const result = calculateFullStats(assignment, subs, {}, {}, []);
      expect(result.mean).toBe(75);
      expect(result.median).toBe(72);
    });
  });

  describe('calculateMultipleAssignmentProgressStats', () => {
    it('returns stats keyed by assignment ID', () => {
      const a1 = makeAssignmentForStats({ id: 10, submissions_count: 3 });
      const a2 = makeAssignmentForStats({ id: 20, submissions_count: 5 });
      const subs: any = { 10: [], 20: [] };
      const result = calculateMultipleAssignmentProgressStats([a1, a2], subs, {}, {}, [], true);
      expect(result[10].numSubmissions).toBe(3);
      expect(result[20].numSubmissions).toBe(5);
    });

    it('handles missing submissions for an assignment', () => {
      const a1 = makeAssignmentForStats({ id: 1 });
      const result = calculateMultipleAssignmentProgressStats([a1], {}, {}, {}, [], true);
      expect(result[1].numSubmissions).toBe(0);
    });
  });

  describe('filterDataByStat', () => {
    const assignment = makeAssignmentForStats();
    const subs = [
      makeSub({ id: 1, isFinalized: true, grader: 'g@t.com', students: ['s1@t.com'] }),
      makeSub({ id: 2, isFinalized: false, grader: 'g@t.com', students: ['s2@t.com'] }),
      makeSub({ id: 3, isFinalized: false, grader: null, students: ['s3@t.com'] }),
    ];

    it('returns all submissions for Submitted type', () => {
      const result = filterDataByStat(assignment, {}, DRAWER_TYPE.Submitted, subs, {}, []);
      expect(result).toHaveLength(3);
    });

    it('returns only finalized for Graded type', () => {
      const result = filterDataByStat(assignment, {}, DRAWER_TYPE.Graded, subs, {}, []);
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('s1@t.com');
    });

    it('returns claimed non-finalized for InProgress type', () => {
      const result = filterDataByStat(assignment, {}, DRAWER_TYPE.InProgress, subs, {}, []);
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('s2@t.com');
    });

    it('returns unclaimed for Unclaimed type', () => {
      const result = filterDataByStat(assignment, {}, DRAWER_TYPE.Unclaimed, subs, {}, []);
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('s3@t.com');
    });

    it('returns missing students for Missing type', () => {
      const submissionsByStudent: any = { 'missing@t.com': {} };
      const result = filterDataByStat(assignment, submissionsByStudent, DRAWER_TYPE.Missing, [], {}, ['missing@t.com']);
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('missing@t.com');
      expect(result[0].subID).toBeNull();
    });

    it('returns viewed students for Viewed type', () => {
      const viewSubs = [makeSub({ id: 1, students: ['s@t.com'] })];
      const views: any = { 1: { 's@t.com': '2024-01-01' } };
      const result = filterDataByStat(assignment, {}, DRAWER_TYPE.Viewed, viewSubs, views, []);
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('s@t.com');
    });

    it('returns unviewed students for Unviewed type', () => {
      const viewSubs = [makeSub({ id: 1, isFinalized: true, students: ['s@t.com'] })];
      const views: any = { 1: {} }; // entry exists but student not in it
      const submissionsByStudent: any = { 's@t.com': { 1: { isFinalized: true } } };
      const result = filterDataByStat(assignment, submissionsByStudent, DRAWER_TYPE.Unviewed, viewSubs, views, []);
      expect(result).toHaveLength(1);
    });

    it('returns empty for None type', () => {
      const result = filterDataByStat(assignment, {}, DRAWER_TYPE.None, subs, {}, []);
      expect(result).toHaveLength(0);
    });
  });
});
