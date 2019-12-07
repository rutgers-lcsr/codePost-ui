import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

export const RubricCategoryV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      rubricComments: t.array(t.number),
      assignment: t.number,
      pointLimit: t.union([t.number, t.null]),
      sortKey: t.number,
      requireMutuallyExclusive: t.boolean,
    }),
    t.partial({
      helpText: t.string,
    }),
  ],
  'RubricCategory',
);

const RubricCategoryStudentV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      rubricComments: t.array(t.number),
      assignment: t.number,
      pointLimit: t.union([t.number, t.null]),
      sortKey: t.number,
    }),
  ],
  'RubricCategory',
);

export const RubricCategoryVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      name: t.string,
      rubricComments: t.array(t.number),
      assignment: t.number,
      pointLimit: t.union([t.number, t.null]),
      helpText: t.string,
      sortKey: t.number,
      requireMutuallyExclusive: t.boolean,
    }),
  ],
  'RubricCategoryPatch',
);

export type RubricCategoryType = t.TypeOf<typeof RubricCategoryV>;
export type RubricCategoryStudentType = t.TypeOf<typeof RubricCategoryStudentV>;
export type RubricCategoryPatchType = t.TypeOf<typeof RubricCategoryVPatch>;

export class RubricCategory {
  public static create = createObject(RubricCategoryV, RubricCategoryV, 'rubricCategories');
  public static read = readObject(RubricCategoryV, 'rubricCategories');
  public static update = updateObject(RubricCategoryV, RubricCategoryVPatch, 'rubricCategories');
  public static delete = deleteObject(RubricCategoryV, 'rubricCategories');

  public static compare = (a: RubricCategoryType, b: RubricCategoryType) => {
    if (a.sortKey === b.sortKey) {
      return a.id - b.id;
    } else {
      return a.sortKey - b.sortKey;
    }
  };
}

export const RubricCategoryMock: RubricCategoryType = {
  id: 1,
  name: 'Mocked Category',
  helpText: 'mocked category help text',
  rubricComments: [1],
  assignment: 1,
  pointLimit: 4,
  sortKey: 0,
  requireMutuallyExclusive: false,
};

// export {
//   RubricCategoryType,
//   RubricCategoryPatchType,
//   RubricCategory,
//   RubricCategoryV,
//   RubricCategoryVPatch,
//   RubricCategoryStudentType,
//   RubricCategoryMock,
// };
