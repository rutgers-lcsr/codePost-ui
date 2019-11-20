import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject, createObjectDetail } from './generics';
import { TaskV } from './autograder/runTypes';

const TestCategoryV = t.intersection(
  [
    GenericObject,
    t.type({
      assignment: t.number,
      name: t.string,
      testCases: t.array(t.number),
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

//  Defail Route : Run
const TestInputs = t.intersection([GenericObject, t.type({ submission: t.union([t.number, t.null]) })]);

export type TestCategoryType = t.TypeOf<typeof TestCategoryV>;

export class TestCategory {
  public static create = createObject(TestCategoryV, TestCategoryPostV, 'testCategories');
  public static read = readObject(TestCategoryV, 'testCategories');
  public static delete = deleteObject(TestCategoryV, 'testCategories');
  public static update = updateObject(TestCategoryV, TestCategoryPatchV, 'testCategories');

  public static run = createObjectDetail(TaskV, TestInputs, 'testCategories', 'run');

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
