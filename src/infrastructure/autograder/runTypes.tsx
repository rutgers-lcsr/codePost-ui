import * as t from 'io-ts';
import { GenericObject } from '../generics';

import { SubmissionTestV } from '../submissionTest';

export const TaskV = t.type({
  task: t.string,
});

const TestCaseTestResult = t.intersection([
  GenericObject,
  t.type({
    passed: t.boolean,
    log: t.string,
    isError: t.boolean,
  }),
]);

const TestCategoryTestResult = t.array(
  t.type({
    id: t.number,
    description: t.string,
    passed: t.boolean,
    log: t.string,
    isError: t.boolean,
  }),
);

const SubmissionTestResult = t.array(SubmissionTestV);

export type TestCaseTestResultType = t.TypeOf<typeof TestCaseTestResult>;
export type TestCategoryTestResultType = t.TypeOf<typeof TestCategoryTestResult>;
export type SubmissionTestResultType = t.TypeOf<typeof SubmissionTestResult>;
