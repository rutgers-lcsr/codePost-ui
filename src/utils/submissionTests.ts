import type { SubmissionTestType } from '../types/models';

export const getLatestSubmissionTests = (tests: SubmissionTestType[]): SubmissionTestType[] => {
  const byTestCase: Record<number, SubmissionTestType> = {};
  for (const test of tests) {
    const current = byTestCase[test.testCase];
    if (!current || current.modified < test.modified) {
      byTestCase[test.testCase] = test;
    }
  }
  return Object.values(byTestCase);
};
