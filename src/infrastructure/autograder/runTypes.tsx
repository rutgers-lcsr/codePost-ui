import * as t from 'io-ts';
import { GenericObject } from '../generics';

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

const TestCategoryTestResult = t.array(BasicTestResult);

const SubmissionTestResult = t.array(SubmissionTestV);

export type TestCaseTestResultType = t.TypeOf<typeof BasicTestResult>;
export type TestCategoryTestResultType = t.TypeOf<typeof TestCategoryTestResult>;
export type SubmissionTestResultType = t.TypeOf<typeof SubmissionTestResult>;
export type BasicTestResultType = t.TypeOf<typeof BasicTestResult>;
