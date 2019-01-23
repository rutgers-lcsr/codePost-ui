import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const FileV = t.intersection(
  [
    GenericObject,
    t.type({
      code: t.string,
      comments: t.array(t.number),
      extension: t.string,
      name: t.string,
      submission: t.number,
    }),
    t.partial({}),
  ],
  'File',
);

const FileVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      code: t.string,
      comments: t.array(t.number),
      extension: t.string,
      name: t.string,
      submission: t.number,
    }),
  ],
  'FilePatch',
);

type FileType = t.TypeOf<typeof FileV>;

class File {
  public static create = createObject(FileV, FileV, 'files');
  public static read = readObject(FileV, 'files');
  public static update = updateObject(FileV, FileVPatch, 'files');
  public static delete = deleteObject(FileV, 'files');
}

export { FileType, File };
