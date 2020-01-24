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

const TestEditorResult = t.type({
  logs: t.string,
  results: t.array(BasicTestResult),
});

const SubmissionTestResult = t.type({
  logs: t.union([t.string, t.null]),
  submissionTests: t.array(SubmissionTestV),
  message: t.string,
});

export type SubmissionTestResultType = t.TypeOf<typeof SubmissionTestResult>;
export type BasicTestResultType = t.TypeOf<typeof BasicTestResult>;
export type TestEditorResultType = t.TypeOf<typeof TestEditorResult>;
