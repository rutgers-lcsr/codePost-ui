import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const RubricCategoryV = t.intersection(
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

const RubricCategoryVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      name: t.string,
      rubricComments: t.array(t.number),
      assignment: t.number,
      pointLimit: t.union([t.number, t.null]),
    }),
  ],
  'RubricCategoryPatch',
);

type RubricCategoryType = t.TypeOf<typeof RubricCategoryV>;
type RubricCategoryPatchType = t.TypeOf<typeof RubricCategoryVPatch>;

class RubricCategory {
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

export { RubricCategoryType, RubricCategoryPatchType, RubricCategory, RubricCategoryV, RubricCategoryVPatch };
