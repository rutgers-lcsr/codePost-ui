import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from '../generics';

const BashFileV = t.intersection(
  [
    GenericObject,
    t.type({
      testCategory: t.number,
      code: t.string,
    }),
    t.partial({}),
  ],
  'SolutionFile',
);

const BashFileVPost = t.intersection(
  [
    GenericObject,
    t.type({
      testCategory: t.number,
      code: t.string,
    }),
    t.partial({}),
  ],
  'SolutionFilePost',
);

const BashFileVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      code: t.string,
    }),
  ],
  'SolutionFilePatch',
);

export type BashFileType = t.TypeOf<typeof BashFileV>;

export class BashFile {
  public static create = createObject(BashFileV, BashFileVPost, 'autograder/bashFiles');
  public static read = readObject(BashFileV, 'autograder/bashFiles');
  public static delete = deleteObject(BashFileV, 'autograder/bashFiles');
  public static update = updateObject(BashFileV, BashFileVPatch, 'autograder/bashFiles');
}
