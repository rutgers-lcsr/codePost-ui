import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const CommentV = t.intersection(
  [
    GenericObject,
    t.type({
      startChar: t.number,
      endChar: t.number,
      startLine: t.number,
      endLine: t.number,
      pointDelta: t.union([t.number, t.null]),
      text: t.union([t.string, t.null]),
      file: t.number,
      rubricComment: t.union([t.number, t.null]),
    }),
    t.partial({
      author: t.string,
    }),
  ],
  'Comment',
);

const CommentVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      author: t.string,
      startChar: t.number,
      endChar: t.number,
      startLine: t.number,
      endLine: t.number,
      pointDelta: t.union([t.number, t.null]),
      text: t.union([t.string, t.null]),
      file: t.number,
      rubricComment: t.union([t.number, t.null]),
    }),
  ],
  'CommentVPatch',
);

type CommentType = t.TypeOf<typeof CommentV>;

class Comment {
  public static create = createObject(CommentV, CommentV, 'comments');
  public static read = readObject(CommentV, 'comments');
  public static update = updateObject(CommentV, CommentVPatch, 'comments');
  public static delete = deleteObject(CommentV, 'comments');
}

export { CommentType, Comment };
