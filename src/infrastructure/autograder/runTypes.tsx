import * as t from 'io-ts';
import { GenericObject } from '../generics';

import { SubmissionTestV } from '../submissionTest';

export const TaskV = t.type({
  task: t.string,
});

const TestCaseTestResult = t.type({
  passed: t.boolean,
  logs: t.string,
  isError: t.boolean,
  testCase: t.number,
  testCategory: t.number,
});

const TestCategoryTestResult = t.array(TestCaseTestResult);

const SubmissionTestResult = t.array(SubmissionTestV);

export type TestCaseTestResultType = t.TypeOf<typeof TestCaseTestResult>;
export type TestCategoryTestResultType = t.TypeOf<typeof TestCategoryTestResult>;
export type SubmissionTestResultType = t.TypeOf<typeof SubmissionTestResult>;
