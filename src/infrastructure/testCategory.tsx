import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

export const TestCategoryV = t.intersection(
  [
    GenericObject,
    t.type({
      assignment: t.number,
      name: t.string,
      testCases: t.array(t.number),
      testScript: t.union([t.string, t.null]),
      maxPoints: t.union([t.number, t.null]),
      sortKey: t.union([t.number, t.null]),
      targetFileName: t.union([t.string, t.null]),
      // helperFiles: t.array(t.number), // Deprecated
      resources: t.array(t.any), // Using t.any to avoid circular dependency issues, or import TestCategoryResourceV
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
      testScript: t.union([t.string, t.null]),
      maxPoints: t.union([t.number, t.null]),
      sortKey: t.union([t.number, t.null]),
      targetFileName: t.union([t.string, t.null]),
      // helperFiles: t.array(t.number), // Deprecated
    }),
  ],
  'TestCategory',
);

const TestCategoryPatchV = t.intersection(
  [
    GenericObject,
    t.partial({
      name: t.string,
      testScript: t.union([t.string, t.null]),
      maxPoints: t.union([t.number, t.null]),
      sortKey: t.union([t.number, t.null]),
      targetFileName: t.union([t.string, t.null]),
      // helperFiles: t.array(t.number), // Deprecated
    }),
  ],
  'TestCategory',
);

export type TestCategoryType = t.TypeOf<typeof TestCategoryV>;
export class TestCategory {
  public static create = createObject(TestCategoryV, TestCategoryPostV, 'testCategories');
  public static read = readObject(TestCategoryV, 'testCategories');
  public static delete = deleteObject(TestCategoryV, 'testCategories');
  public static update = updateObject(TestCategoryV, TestCategoryPatchV, 'testCategories');

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
