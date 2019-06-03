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
      isSaved: t.boolean,
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

class CommentIO {
  public static create = createObject(CommentV, CommentV, 'comments');
  public static read = readObject(CommentV, 'comments');
  public static update = updateObject(CommentV, CommentVPatch, 'comments');
  public static delete = deleteObject(CommentV, 'comments');
}

const CommentMock: CommentType = {
  id: 1,
  text: 'This is a mocked comment',
  pointDelta: null,
  startChar: 1,
  endChar: 3,
  startLine: 0,
  endLine: 0,
  file: 1,
  rubricComment: 1,
  author: 'grader@myschool.edu',
};

export { CommentType, CommentIO, CommentMock };
