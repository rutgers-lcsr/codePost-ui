import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject, createObjectDetail } from './generics';

const TestCaseV = t.intersection(
  [
    GenericObject,
    t.type({
      sortKey: t.number,
      testCategory: t.number,
      name: t.string,
      text: t.string,
      expectedOutput: t.string,
      pointsPass: t.number,
      pointsFail: t.number,
      language: t.string,
      type: t.string,
      fileName: t.string,
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
      name: t.string,
      text: t.string,
      expectedOutput: t.string,
      pointsPass: t.number,
      pointsFail: t.number,
      language: t.string,
      type: t.string,
      fileName: t.string,
    }),
  ],
  'TestCasePatch',
);

const TestCaseOutputs = t.intersection([
  GenericObject,
  t.type({
    name: t.string,
    passed: t.boolean,
    log: t.string,
  }),
]);

export type TestCaseType = t.TypeOf<typeof TestCaseV>;

export class TestCase {
  public static create = createObject(TestCaseV, TestCaseV, 'testCases');
  public static read = readObject(TestCaseV, 'testCases');
  public static delete = deleteObject(TestCaseV, 'testCases');
  public static update = updateObject(TestCaseV, TestCaseVPatch, 'testCases');

  public static run = createObjectDetail(TestCaseOutputs, GenericObject, 'testCases', 'run');

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
