import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject } from './generics';

const TestCaseV = t.intersection(
  [
    GenericObject,
    t.type({
      sortKey: t.number,
      assignment: t.number,
      name: t.string,
      text: t.string,
      expectedOutput: t.string,
      pointsPass: t.number,
      pointsFail: t.number,
      language: t.string,
      type: t.string,
    }),
    t.partial({}),
  ],
  'TestCase',
);

export type TestCaseType = t.TypeOf<typeof TestCaseV>;

export class TestCase {
  public static create = createObject(TestCaseV, TestCaseV, 'testCases');
  public static read = readObject(TestCaseV, 'testCases');
  public static delete = deleteObject(TestCaseV, 'testCases');

  public static sort = (testCases: TestCaseType[]): TestCaseType[] => {
    // First sort by Assignment 'sortKey', then by ID
    const compare = (a: TestCaseType, b: TestCaseType) => {
      if (a.sortKey === b.sortKey) {
        return a.id - b.id; // lower ids first
      } else {
        return a.sortKey - b.sortKey; // lower sortKeys first
      }
    };

    return testCases.sort(compare);
  };
}
