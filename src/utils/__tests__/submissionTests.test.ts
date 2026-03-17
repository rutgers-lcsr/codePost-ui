// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { getLatestSubmissionTests } from '../submissionTests';
import type { SubmissionTestType } from '../../types/models';

function makeTest(overrides: Partial<SubmissionTestType>): SubmissionTestType {
  return {
    id: 1,
    submission: 100,
    testCase: 1,
    logs: '',
    passed: true,
    testCategory: 1,
    created: '2025-01-01T00:00:00Z',
    modified: '2025-01-01T00:00:00Z',
    ...overrides,
  } as SubmissionTestType;
}

describe('getLatestSubmissionTests', () => {
  it('returns the latest test per testCase based on modified date', () => {
    const tests = [
      makeTest({ id: 1, testCase: 10, modified: '2025-01-01T00:00:00Z' }),
      makeTest({ id: 2, testCase: 10, modified: '2025-06-01T00:00:00Z' }),
      makeTest({ id: 3, testCase: 20, modified: '2025-03-01T00:00:00Z' }),
    ];

    const result = getLatestSubmissionTests(tests);
    expect(result).toHaveLength(2);

    const byTestCase = Object.fromEntries(result.map((t) => [t.testCase, t]));
    expect(byTestCase[10].id).toBe(2); // later modified
    expect(byTestCase[20].id).toBe(3);
  });

  it('returns empty array for empty input', () => {
    expect(getLatestSubmissionTests([])).toEqual([]);
  });

  it('returns single test when only one exists per testCase', () => {
    const tests = [
      makeTest({ id: 1, testCase: 10, modified: '2025-01-01T00:00:00Z' }),
      makeTest({ id: 2, testCase: 20, modified: '2025-01-01T00:00:00Z' }),
    ];

    const result = getLatestSubmissionTests(tests);
    expect(result).toHaveLength(2);
  });

  it('handles all tests belonging to the same testCase', () => {
    const tests = [
      makeTest({ id: 1, testCase: 10, modified: '2025-01-01T00:00:00Z' }),
      makeTest({ id: 2, testCase: 10, modified: '2025-06-01T00:00:00Z' }),
      makeTest({ id: 3, testCase: 10, modified: '2025-03-01T00:00:00Z' }),
    ];

    const result = getLatestSubmissionTests(tests);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('preserves all fields of the selected test', () => {
    const tests = [
      makeTest({ id: 5, testCase: 10, passed: false, logs: 'error output', modified: '2025-01-01T00:00:00Z' }),
    ];
    const result = getLatestSubmissionTests(tests);
    expect(result[0].passed).toBe(false);
    expect(result[0].logs).toBe('error output');
  });
});
