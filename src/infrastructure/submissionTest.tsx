import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject } from './generics';

const SubmissionTestV = t.intersection(
  [
    GenericObject,
    t.type({
      testCase: t.number,
      submission: t.number,
      logs: t.string,
      passed: t.union([t.boolean, t.null]),
    }),
    t.partial({}),
  ],
  'SubmissionTest',
);

export type SubmissionTestType = t.TypeOf<typeof SubmissionTestV>;

export class SubmissionTest {
  public static create = createObject(SubmissionTestV, SubmissionTestV, 'submissionTests');
  public static read = readObject(SubmissionTestV, 'submissionTests');
  public static delete = deleteObject(SubmissionTestV, 'submissionTests');
}
