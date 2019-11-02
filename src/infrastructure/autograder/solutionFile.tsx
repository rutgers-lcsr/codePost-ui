import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from '../generics';

const SolutionFileV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      assignment: t.number,
      code: t.string,
      path: t.union([t.string, t.null]),
      created: t.string,
    }),
    t.partial({}),
  ],
  'SolutionFile',
);

const SolutionFileVPost = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      assignment: t.number,
      code: t.string,
      path: t.union([t.string, t.null]),
    }),
    t.partial({}),
  ],
  'SolutionFilePost',
);

const SolutionFileVPatch = t.intersection(
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

export type SolutionFileType = t.TypeOf<typeof SolutionFileV>;

export class SolutionFile {
  public static create = createObject(SolutionFileV, SolutionFileVPost, 'autograder/solutionFiles');
  public static read = readObject(SolutionFileV, 'autograder/solutionFiles');
  public static delete = deleteObject(SolutionFileV, 'autograder/solutionFiles');
  public static update = updateObject(SolutionFileV, SolutionFileVPatch, 'autograder/solutionFiles');
}
