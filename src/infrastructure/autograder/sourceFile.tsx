import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject, readObjectDetail } from '../generics';
import { TaskV } from './runTypes';

const SourceFileV = t.intersection(
  [
    GenericObject,
    t.type({
      environment: t.number,
      code: t.string,
      name: t.string,
    }),
    t.partial({}),
  ],
  'SourceFile',
);

const SourceFileVPost = t.intersection(
  [
    GenericObject,
    t.type({
      environment: t.number,
      code: t.string,
      name: t.string,
    }),
    t.partial({}),
  ],
  'SourceFilePost',
);

const SourceFileVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      code: t.string,
    }),
  ],
  'SourceFilePatch',
);

export type SourceFileType = t.TypeOf<typeof SourceFileV>;

export class SourceFile {
  public static create = createObject(SourceFileV, SourceFileVPost, 'autograder/sourceFiles');
  public static read = readObject(SourceFileV, 'autograder/sourceFiles');
  public static delete = deleteObject(SourceFileV, 'autograder/sourceFiles');
  public static update = updateObject(SourceFileV, SourceFileVPatch, 'autograder/sourceFiles');
  public static run = readObjectDetail(TaskV, 'autograder/sourceFiles', 'run');
}
