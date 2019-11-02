import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject, createObjectDetail } from './generics';

const TestCategoryV = t.intersection(
  [
    GenericObject,
    t.type({
      assignment: t.number,
      name: t.string,
      testCases: t.array(t.number),
      helperFiles: t.array(t.number),
      bashFile: t.union([t.number, t.null]),
      type: t.string,
    }),
  ],
  'TestCategory',
);

const TestCategoryPostV = t.intersection(
  [
    GenericObject,
    t.type({
      assignment: t.number,
      name: t.string,
      type: t.string,
    }),
  ],
  'TestCategory',
);

const TestCategoryPatchV = t.intersection(
  [
    GenericObject,
    t.partial({
      name: t.string,
    }),
  ],
  'TestCategory',
);

const TestOutputs = t.intersection([
  GenericObject,
  t.type({
    name: t.string,
    passed: t.boolean,
    log: t.string,
  }),
]);

export type TestCategoryType = t.TypeOf<typeof TestCategoryV>;

export class TestCategory {
  public static create = createObject(TestCategoryV, TestCategoryPostV, 'testCategories');
  public static read = readObject(TestCategoryV, 'testCategories');
  public static delete = deleteObject(TestCategoryV, 'testCategories');
  public static update = updateObject(TestCategoryV, TestCategoryPatchV, 'testCategories');

  public static run = createObjectDetail(TestOutputs, GenericObject, 'testCategories', 'run');

  public static sort = (categories: TestCategoryType[]): TestCategoryType[] => {
    const compare = (a: TestCategoryType, b: TestCategoryType) => {
      if (a.id < 0 || b.id < 0) {
        return b.id - a.id;
      }
      return a.id - b.id; // lower ids first
    };
    return categories.sort(compare);
  };
}
