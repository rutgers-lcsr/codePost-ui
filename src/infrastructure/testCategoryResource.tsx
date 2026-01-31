import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';
import { AssignmentFileV } from './file';
import { AssignmentDataSetV } from './assignmentDataSet';

export const TestCategoryResourceV = t.intersection(
  [
    GenericObject,
    t.type({
      category: t.number,
      target_path: t.string,

      // These are nullable FKs
      file: t.union([t.number, t.null]),
      dataset: t.union([t.number, t.null]),

      // Expanded details from nested serializer
      file_details: t.union([AssignmentFileV, t.null, t.undefined]),
      dataset_details: t.union([AssignmentDataSetV, t.null, t.undefined]),
    }),
  ],
  'TestCategoryResource',
);

export const TestCategoryResourcePostV = t.type({
  category: t.number,
  target_path: t.string,
  file: t.union([t.number, t.null, t.undefined]),
  dataset: t.union([t.number, t.null, t.undefined]),
});

export const TestCategoryResourcePatchV = t.intersection([
  GenericObject,
  t.partial({
    target_path: t.string,
    file: t.union([t.number, t.null]),
    dataset: t.union([t.number, t.null]),
  }),
]);

export type TestCategoryResourceType = t.TypeOf<typeof TestCategoryResourceV>;

export class TestCategoryResource {
  public static create = createObject(TestCategoryResourceV, TestCategoryResourcePostV, 'testCategoryResources');
  public static read = readObject(TestCategoryResourceV, 'testCategoryResources');
  public static delete = deleteObject(TestCategoryResourceV, 'testCategoryResources');
  // Update usually requires Patch to be a Partial of the main type or compatible.
  // CodePost generics might expect the Patch type to be strictly defined.
  public static update = updateObject(TestCategoryResourceV, TestCategoryResourcePatchV, 'testCategoryResources');
}
