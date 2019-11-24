import * as t from 'io-ts';

import { SubmissionTestV } from '../submissionTest';

export const TaskV = t.type({
  task: t.string,
});

const BasicTestResult = t.type({
  passed: t.boolean,
  logs: t.string,
  isError: t.boolean,
  testCase: t.number,
  testCategory: t.number,
});

const SubmissionTestResult = t.array(SubmissionTestV);

export type SubmissionTestResultType = t.TypeOf<typeof SubmissionTestResult>;
export type BasicTestResultType = t.TypeOf<typeof BasicTestResult>;
