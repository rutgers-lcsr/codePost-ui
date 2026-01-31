import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject } from './generics';

export const SubmissionTestV = t.intersection(
  [
    GenericObject,
    t.type({
      testCase: t.number,
      testCategory: t.number,
      submission: t.number,
      logs: t.string,
      passed: t.boolean,
      created: t.string,
      modified: t.string,
      isError: t.boolean,
    }),
    t.partial({
      score: t.number,
      maxScore: t.number,
      results: t.union([t.array(t.any), t.null]),
    }),
  ],
  'SubmissionTest',
);

export type SubmissionTestType = t.TypeOf<typeof SubmissionTestV>;

export class SubmissionTest {
  public static create = createObject(SubmissionTestV, SubmissionTestV, 'submissionTests');
  public static read = readObject(SubmissionTestV, 'submissionTests');
  public static delete = deleteObject(SubmissionTestV, 'submissionTests');
  public static getLatest = (tests: SubmissionTestType[]) => {
    const byTestCase: { [id: number]: SubmissionTestType } = {};
    for (const test of tests) {
      const thisCase = byTestCase[test.testCase];
      if (!thisCase || thisCase.modified < test.modified) {
        byTestCase[test.testCase] = test;
      }
    }

    return Object.values(byTestCase);
  };
}
