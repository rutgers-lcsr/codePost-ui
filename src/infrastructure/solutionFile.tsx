import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject } from './generics';

const SolutionFileV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      assignment: t.number,
      code: t.string,
      extension: t.string,
      path: t.union([t.string, t.null]),
    }),
    t.partial({}),
  ],
  'SolutionFile',
);

export type SolutionFileType = t.TypeOf<typeof SolutionFileV>;

export class SolutionFile {
  public static create = createObject(SolutionFileV, SolutionFileV, 'solutionFiles');
  public static read = readObject(SolutionFileV, 'solutionFiles');
  public static delete = deleteObject(SolutionFileV, 'solutionFiles');
}
