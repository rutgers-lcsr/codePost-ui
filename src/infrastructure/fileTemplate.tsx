import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const FileTemplateV = t.intersection(
  [
    GenericObject,
    t.type({
      data: t.string,
      extension: t.string,
      name: t.string,
      assignment: t.number,
      path: t.union([t.string, t.null]),
      required: t.boolean,
    }),
    t.partial({}),
  ],
  'FileTemplate',
);

const FileTemplateVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      data: t.string,
      extension: t.string,
      name: t.string,
      assignment: t.number,
      path: t.union([t.string, t.null]),
      required: t.boolean,
    }),
  ],
  'FileTemplate',
);

const FileTemplateVPost = t.intersection(
  [
    GenericObject,
    t.type({
      data: t.string,
      extension: t.string,
      name: t.string,
      assignment: t.number,
      path: t.union([t.string, t.null]),
      required: t.boolean,
    }),
    t.partial({}),
  ],
  'FileTemplatePost',
);

export type FileTemplateType = t.TypeOf<typeof FileTemplateV>;

export class FileTemplate {
  public static create = createObject(FileTemplateV, FileTemplateVPost, 'fileTemplates');
  public static read = readObject(FileTemplateV, 'fileTemplates');
  public static update = updateObject(FileTemplateV, FileTemplateVPatch, 'fileTemplates');
  public static delete = deleteObject(FileTemplateV, 'fileTemplates');
}
