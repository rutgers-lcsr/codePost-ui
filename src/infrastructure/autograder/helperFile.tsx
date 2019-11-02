import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from '../generics';

const HelperFileV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      testCategory: t.number,
      code: t.string,
      path: t.union([t.string, t.null]),
      created: t.string,
    }),
    t.partial({}),
  ],
  'SolutionFile',
);

const HelperFileVPost = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      testCategory: t.number,
      code: t.string,
      path: t.union([t.string, t.null]),
    }),
    t.partial({}),
  ],
  'SolutionFilePost',
);

const HelperFileVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      name: t.string,
      code: t.string,
      path: t.union([t.string, t.null]),
    }),
  ],
  'SolutionFilePatch',
);

export type HelperFileType = t.TypeOf<typeof HelperFileV>;

export class HelperFile {
  public static create = createObject(HelperFileV, HelperFileVPost, 'autograder/helperFiles');
  public static read = readObject(HelperFileV, 'autograder/helperFiles');
  public static delete = deleteObject(HelperFileV, 'autograder/helperFiles');
  public static update = updateObject(HelperFileV, HelperFileVPatch, 'autograder/helperFiles');
}
