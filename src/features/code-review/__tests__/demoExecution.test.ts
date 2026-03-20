// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { buildDemoExecutionResults } from '../code-panel/demoExecution';
import type { TestCase, SubmissionTest } from '../../../api-client';

const makeTestCase = (overrides: Partial<TestCase> = {}): TestCase =>
  ({
    id: 1,
    testCategory: 10,
    description: 'Test 1',
    functionName: 'test_1',
    pointsPass: 5,
    ...overrides,
  }) as TestCase;

describe('buildDemoExecutionResults', () => {
  it('returns results for all tests when no targetTestId', () => {
    const tests = [makeTestCase({ id: 1 }), makeTestCase({ id: 2 })];
    const results = buildDemoExecutionResults({
      submissionId: 100,
      existingResults: [],
      tests,
    });
    expect(results).toHaveLength(2);
    expect(results[0].submission).toBe(100);
  });

  it('only updates targetTestId when provided', () => {
    const tests = [makeTestCase({ id: 1 }), makeTestCase({ id: 2 })];
    const existing: SubmissionTest[] = [
      {
        id: -1001,
        submission: 100,
        testCase: 1,
        logs: 'old',
        passed: true,
        testCategory: 10,
        created: '2025-01-01T00:00:00Z',
        modified: '2025-01-01T00:00:00Z',
        isError: false,
        score: 5,
        maxScore: 5,
        results: [],
      },
      {
        id: -1002,
        submission: 100,
        testCase: 2,
        logs: 'old',
        passed: false,
        testCategory: 10,
        created: '2025-01-01T00:00:00Z',
        modified: '2025-01-01T00:00:00Z',
        isError: false,
        score: 0,
        maxScore: 5,
        results: [],
      },
    ];
    const results = buildDemoExecutionResults({
      submissionId: 100,
      existingResults: existing,
      tests,
      targetTestId: 2,
    });
    expect(results).toHaveLength(2);
    // Test 1 should be unchanged
    expect(results[0].logs).toBe('old');
    // Test 2 should be updated
    expect(results[1].logs).not.toBe('old');
  });

  it('preserves existing result id when re-running', () => {
    const tests = [makeTestCase({ id: 1 })];
    const existing: SubmissionTest[] = [
      {
        id: 42,
        submission: 100,
        testCase: 1,
        logs: '',
        passed: true,
        testCategory: 10,
        created: '2025-01-01T00:00:00Z',
        modified: '2025-01-01T00:00:00Z',
        isError: false,
        score: 5,
        maxScore: 5,
        results: [],
      },
    ];
    const results = buildDemoExecutionResults({
      submissionId: 100,
      existingResults: existing,
      tests,
    });
    expect(results[0].id).toBe(42);
  });

  it('generates deterministic results based on runNonce', () => {
    const tests = [makeTestCase({ id: 1 }), makeTestCase({ id: 2 }), makeTestCase({ id: 3 })];
    const r1 = buildDemoExecutionResults({ submissionId: 1, existingResults: [], tests, runNonce: 1 });
    const r2 = buildDemoExecutionResults({ submissionId: 1, existingResults: [], tests, runNonce: 1 });
    expect(r1.map((r) => r.passed)).toEqual(r2.map((r) => r.passed));
  });

  it('produces different outcomes with different runNonce', () => {
    const tests = Array.from({ length: 6 }, (_, i) => makeTestCase({ id: i + 1 }));
    const r1 = buildDemoExecutionResults({ submissionId: 1, existingResults: [], tests, runNonce: 0 });
    const r2 = buildDemoExecutionResults({ submissionId: 1, existingResults: [], tests, runNonce: 3 });
    // With different nonces, at least one outcome should differ
    const passes1 = r1.map((r) => r.passed);
    const passes2 = r2.map((r) => r.passed);
    expect(passes1).not.toEqual(passes2);
  });

  it('covers error outcome (selector === 0)', () => {
    // We need testId + runNonce ≡ 0 (mod 6), e.g. testId=6, runNonce=0
    const tests = [makeTestCase({ id: 6 })];
    const results = buildDemoExecutionResults({ submissionId: 1, existingResults: [], tests, runNonce: 0 });
    expect(results[0].isError).toBe(true);
    expect(results[0].score).toBe(0);
    expect(results[0].logs).toContain('RuntimeError');
  });

  it('covers failure outcome (selector even, non-zero)', () => {
    // testId + runNonce ≡ 2 (mod 6) -> selector=2, even && !0 => failed
    const tests = [makeTestCase({ id: 2 })];
    const results = buildDemoExecutionResults({ submissionId: 1, existingResults: [], tests, runNonce: 0 });
    expect(results[0].passed).toBe(false);
    expect(results[0].isError).toBe(false);
    expect(results[0].logs).toContain('AssertionError');
  });

  it('covers pass outcome (selector odd)', () => {
    // testId + runNonce ≡ 1 (mod 6) -> selector=1, odd => passed
    const tests = [makeTestCase({ id: 1 })];
    const results = buildDemoExecutionResults({ submissionId: 1, existingResults: [], tests, runNonce: 0 });
    expect(results[0].passed).toBe(true);
    expect(results[0].isError).toBe(false);
    expect(results[0].logs).toContain('successfully');
  });

  it('sorts results by testCase', () => {
    const tests = [makeTestCase({ id: 3 }), makeTestCase({ id: 1 }), makeTestCase({ id: 2 })];
    const results = buildDemoExecutionResults({ submissionId: 1, existingResults: [], tests });
    expect(results.map((r) => r.testCase)).toEqual([1, 2, 3]);
  });

  it('uses default id when no previous result', () => {
    const tests = [makeTestCase({ id: 5 })];
    const results = buildDemoExecutionResults({ submissionId: 1, existingResults: [], tests });
    expect(results[0].id).toBe(-(1000 + 5));
  });

  it('handles test with null pointsPass', () => {
    const tests = [makeTestCase({ id: 1, pointsPass: undefined })];
    const results = buildDemoExecutionResults({ submissionId: 1, existingResults: [], tests, runNonce: 0 });
    expect(results[0].maxScore).toBe(1);
  });
});
