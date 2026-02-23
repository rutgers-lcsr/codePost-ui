// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { SubmissionTest, TestCase } from '../../../api-client';

type DemoExecutionOptions = {
  submissionId: number;
  existingResults: SubmissionTest[];
  tests: TestCase[];
  targetTestId?: number;
  runNonce?: number;
};

const baseScoreForTest = (test: TestCase, passed: boolean, isError: boolean): number => {
  if (isError) {
    return 0;
  }

  if (passed) {
    return Math.max(test.pointsPass ?? 1, 1);
  }

  return 0;
};

const classifyTestOutcome = (testId: number, runNonce: number): { passed: boolean; isError: boolean } => {
  // Varies across runs while staying deterministic for a given (testId, runNonce).
  const selector = (Math.abs(testId) + runNonce) % 6;

  if (selector === 0) {
    return { passed: false, isError: true };
  }

  if (selector % 2 === 0) {
    return { passed: false, isError: false };
  }

  return { passed: true, isError: false };
};

const buildLogs = (
  test: TestCase,
  passed: boolean,
  isError: boolean,
  score: number,
  maxScore: number,
  runNonce: number,
): string => {
  const name = test.description || `Test ${test.id}`;
  const runLabel = `Demo Run #${runNonce}`;

  if (isError) {
    return [
      `✗ ${name}: ${score}/${maxScore}`,
      `Run: ${runLabel}`,
      'Error: RuntimeError: demo execution sandbox exception',
      'Hint: This is simulated output for demo mode.',
    ].join('\n');
  }

  if (passed) {
    return [
      `✓ ${name}: ${score}/${maxScore}`,
      `Run: ${runLabel}`,
      'Output: Simulated execution completed successfully.',
      'Hint: This is fake data generated in demo mode.',
    ].join('\n');
  }

  return [
    `✗ ${name}: ${score}/${maxScore}`,
    `Run: ${runLabel}`,
    'AssertionError: Expected output did not match.',
    'Hint: Edit code and run again to see updated simulated feedback.',
  ].join('\n');
};

const buildResultForTest = (
  test: TestCase,
  submissionId: number,
  runNonce: number,
  previous?: SubmissionTest,
): SubmissionTest => {
  const now = new Date().toISOString();
  const { passed, isError } = classifyTestOutcome(test.id, runNonce);
  const maxScore = Math.max(test.pointsPass ?? 1, 1);
  const score = baseScoreForTest(test, passed, isError);

  return {
    id: previous?.id ?? -(1000 + test.id),
    submission: submissionId,
    testCase: test.id,
    logs: buildLogs(test, passed, isError, score, maxScore, runNonce),
    passed,
    testCategory: test.testCategory ?? 0,
    created: previous?.created ?? now,
    modified: now,
    isError,
    score,
    maxScore,
    results: [
      {
        name: test.functionName || test.description || `test_${test.id}`,
        passed,
        score,
        maxScore,
        error: isError ? 'RuntimeError: demo execution sandbox exception' : undefined,
        description: test.description,
        message: passed ? `Simulated execution passed on run ${runNonce}.` : undefined,
      },
    ],
  };
};

export const buildDemoExecutionResults = ({
  submissionId,
  existingResults,
  tests,
  targetTestId,
  runNonce = 1,
}: DemoExecutionOptions): SubmissionTest[] => {
  const previousByTestCase = new Map<number, SubmissionTest>();
  existingResults.forEach((result) => previousByTestCase.set(result.testCase, result));

  const updatedByTestCase = new Map<number, SubmissionTest>(previousByTestCase);

  const targetTests = targetTestId ? tests.filter((test) => test.id === targetTestId) : tests;
  targetTests.forEach((test) => {
    const previous = previousByTestCase.get(test.id);
    updatedByTestCase.set(test.id, buildResultForTest(test, submissionId, runNonce, previous));
  });

  return Array.from(updatedByTestCase.values()).sort((a, b) => a.testCase - b.testCase);
};
