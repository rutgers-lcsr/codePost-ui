import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject } from './generics';

const FileTemplateV = t.intersection(
  [
    GenericObject,
    t.type({
      code: t.string,
      extension: t.string,
      name: t.string,
      assignment: t.number,
      path: t.union([t.string, t.null]),
    }),
    t.partial({}),
  ],
  'FileTemplate',
);

const FileTemplateVPost = t.intersection(
  [
    GenericObject,
    t.type({
      code: t.string,
      extension: t.string,
      name: t.string,
      assignment: t.number,
      path: t.union([t.string, t.null]),
    }),
    t.partial({}),
  ],
  'FileTemplatePost',
);

export type FileTemplateType = t.TypeOf<typeof FileTemplateV>;

export class FileTemplate {
  public static create = createObject(FileTemplateV, FileTemplateVPost, 'fileTemplates');
  public static read = readObject(FileTemplateV, 'fileTemplates');
  public static delete = deleteObject(FileTemplateV, 'fileTemplates');
}
