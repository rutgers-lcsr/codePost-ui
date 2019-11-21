import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject, createObjectDetail } from './generics';
import { TaskV } from './autograder/runTypes';
export const TestCaseV = t.intersection(
  [
    GenericObject,
    t.type({
      sortKey: t.number,
      testCategory: t.number,
      description: t.string,
      type: t.string,
      pointsPass: t.number,
      pointsFail: t.number,
      text: t.string,
      modified: t.string,
      fileName: t.string,
      function: t.string,
      input: t.string,
      expectedOutput: t.string,
      checkReturn: t.boolean,
      exposed: t.boolean,
    }),
    t.partial({}),
  ],
  'TestCase',
);

const TestCaseVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      sortKey: t.number,
      testCategory: t.number,
      description: t.string,
      type: t.string,
      pointsPass: t.number,
      pointsFail: t.number,
      text: t.string,
      fileName: t.string,
      function: t.string,
      input: t.string,
      expectedOutput: t.string,
      checkReturn: t.boolean,
      exposed: t.boolean,
    }),
  ],
  'TestCasePatch',
);

const TestCaseVPost = t.intersection(
  [
    GenericObject,
    t.type({
      sortKey: t.number,
      testCategory: t.number,
      description: t.string,
      type: t.string,
      pointsPass: t.number,
      pointsFail: t.number,
      text: t.string,
      fileName: t.string,
      function: t.string,
      input: t.string,
      expectedOutput: t.string,
      checkReturn: t.boolean,
      exposed: t.boolean,
    }),
    t.partial({}),
  ],
  'TestCasePost',
);

export type TestCaseType = t.TypeOf<typeof TestCaseV>;

export class TestCase {
  public static create = createObject(TestCaseV, TestCaseVPost, 'testCases');
  public static read = readObject(TestCaseV, 'testCases');
  public static delete = deleteObject(TestCaseV, 'testCases');
  public static update = updateObject(TestCaseV, TestCaseVPatch, 'testCases');

  public static run = createObjectDetail(TaskV, GenericObject, 'testCases', 'run');

  public static sort = (testCases: TestCaseType[]): TestCaseType[] => {
    const compare = (a: TestCaseType, b: TestCaseType) => {
      if (a.sortKey === b.sortKey) {
        if (a.id < 0 || b.id < 0) {
          return b.id - a.id;
        }
        return a.id - b.id; // lower ids first
      } else {
        return a.sortKey - b.sortKey; // lower sortKeys first
      }
    };

    return testCases.sort(compare);
  };
}
