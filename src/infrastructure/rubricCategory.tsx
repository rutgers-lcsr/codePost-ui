import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const RubricCategoryV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      rubricComments: t.array(t.number),
      assignment: t.number,
    }),
    t.partial({
      pointLimit: t.number,
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
      pointLimit: t.number,
    }),
  ],
  'RubricCategoryPatch',
);

type RubricCategoryType = t.TypeOf<typeof RubricCategoryV>;

class RubricCategory {
  public static create = createObject(RubricCategoryV, RubricCategoryV, 'rubricCategories');
  public static read = readObject(RubricCategoryV, 'rubricCategories');
  public static update = updateObject(RubricCategoryV, RubricCategoryVPatch, 'rubricCategories');
  public static delete = deleteObject(RubricCategoryV, 'rubricCategories');
}

export { RubricCategoryType, RubricCategory, RubricCategoryV, RubricCategoryVPatch };
