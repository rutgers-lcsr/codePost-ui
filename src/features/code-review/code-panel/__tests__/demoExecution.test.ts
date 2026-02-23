// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';

import type { SubmissionTest, TestCase } from '../../../../api-client';
import { buildDemoExecutionResults } from '../demoExecution';

const makeTestCase = (id: number, description: string, testCategory: number, pointsPass = 2): TestCase =>
  ({
    id,
    assignment: 1,
    testCategory,
    sortKey: id,
    description,
    type: 'unit',
    pointsFail: 0,
    pointsPass,
    text: '',
    modified: '2026-01-01T00:00:00.000Z',
    output: '',
    checkReturn: true,
    exposed: true,
    instances: [],
    explanation: '',
    lastSolutionRun: 0,
    outputIsFile: false,
    isFlexible: false,
    outputIsRegexp: false,
    expectPlot: false,
    dataSet: null,
    targetCellId: null,
  }) as TestCase;

describe('buildDemoExecutionResults', () => {
  it('creates fake results with non-zero max scores', () => {
    const tests = [makeTestCase(1, 'Passing demo case', 10), makeTestCase(2, 'Failing demo case', 10)];

    const results = buildDemoExecutionResults({
      submissionId: 123,
      tests,
      existingResults: [],
      runNonce: 1,
    });

    expect(results).toHaveLength(2);
    expect(results[0].testCase).toBe(1);
    expect(results[0].maxScore).toBeGreaterThan(0);
    expect(results[0].logs).toContain('Demo Run #1');

    expect(results[1].testCase).toBe(2);
    expect(results[1].maxScore).toBeGreaterThan(0);
  });

  it('changes output content between runs', () => {
    const tests = [makeTestCase(3, 'Run variance demo case', 10)];

    const firstRun = buildDemoExecutionResults({
      submissionId: 123,
      tests,
      existingResults: [],
      runNonce: 1,
    });

    const secondRun = buildDemoExecutionResults({
      submissionId: 123,
      tests,
      existingResults: firstRun,
      runNonce: 2,
    });

    expect(firstRun[0].logs).toContain('Demo Run #1');
    expect(secondRun[0].logs).toContain('Demo Run #2');
    expect(firstRun[0].logs).not.toEqual(secondRun[0].logs);
  });

  it('updates only targeted test when running single test', () => {
    const tests = [makeTestCase(1, 'Case 1', 10), makeTestCase(5, 'Case 5 error', 10)];

    const previous: SubmissionTest[] = [
      {
        id: 111,
        submission: 123,
        testCase: 1,
        logs: 'old logs',
        passed: true,
        testCategory: 10,
        created: '2026-01-01T00:00:00.000Z',
        modified: '2026-01-01T00:00:00.000Z',
        isError: false,
      },
    ];

    const results = buildDemoExecutionResults({
      submissionId: 123,
      tests,
      existingResults: previous,
      targetTestId: 5,
      runNonce: 4,
    });

    expect(results).toHaveLength(2);

    const original = results.find((result) => result.testCase === 1)!;
    expect(original.id).toBe(111);
    expect(original.logs).toBe('old logs');

    const updated = results.find((result) => result.testCase === 5)!;
    expect(updated.logs).toContain('Demo Run #4');
    expect(updated.maxScore).toBeGreaterThan(0);
    expect(typeof updated.passed).toBe('boolean');
  });
});
