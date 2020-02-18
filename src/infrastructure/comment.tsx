import * as t from 'io-ts';

import { RubricCommentType } from './rubricComment';

import { createObject, deleteObject, GenericObject, readObject, updateObject, updateObjectDetail } from './generics';

export const CommentV = t.intersection(
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
      feedback: t.number,
      color: t.union([t.string, t.null]),
    }),
    t.partial({
      author: t.string,
      isSaved: t.boolean,
      color: t.union([t.string, t.null]),
      tags: t.array(t.string),
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
      color: t.union([t.string, t.null]),
      tags: t.array(t.string),
    }),
  ],
  'CommentVPatch',
);

const CommentVFeedback = t.intersection([
  GenericObject,
  t.type({
    feedback: t.number,
  }),
]);

export type CommentType = t.TypeOf<typeof CommentV>;

export class CommentIO {
  public static create = createObject(CommentV, CommentV, 'comments');
  public static read = readObject(CommentV, 'comments');
  public static update = updateObject(CommentV, CommentVPatch, 'comments');
  public static delete = deleteObject(CommentV, 'comments');

  public static updateFeedback = updateObjectDetail(CommentV, CommentVFeedback, 'comments', 'feedback');

  public static sortComments = (comments: CommentType[]): CommentType[] => {
    return comments.sort((a: CommentType, b: CommentType) => {
      if (a.startLine === b.startLine) {
        if (a.startChar > b.startChar) {
          return 1;
        }
        if (a.id < 0 && b.id < 0) {
          return a.id + b.id;
        } else if (a.id > 0 && b.id > 0) {
          return a.id - b.id;
        } else if (b.id < 0) {
          return -1;
        } else {
          return 1;
        }
      }
      if (a.startLine > b.startLine) {
        return 1;
      }
      return -1;
    });
  };

  public static compare = (a: CommentType, b: CommentType) => {
    if (a.startLine === b.startLine) {
      if (a.startChar === b.startChar) {
        if (a.id > 0 && b.id > 0) {
          return a.id - b.id;
        } else if (a.id < 0 && b.id < 0) {
          return a.id + b.id;
        } else if (a.id < 0) {
          return 1;
        } else {
          return -1;
        }
      }
      return a.startChar - b.startChar;
    }
    return a.startLine - b.startLine;
  };

  public static sortedIndex = (comments: CommentType[], insert: CommentType): number => {
    let currIndex = 0;
    const len = comments.length;
    comments.some((comment: CommentType, index: number) => {
      const cmp = CommentIO.compare(comment, insert) >= 0;
      if (!cmp && index === len - 1) {
        currIndex = len;
      } else {
        currIndex = index;
      }
      return cmp;
    });
    return currIndex;
  };
}

/* tslint:disable:max-classes-per-file */
export class UiComment {
  public static isNew = (comment: CommentType) => {
    return comment.id < 0;
  };

  public static points = (comment: CommentType, rubricComment?: RubricCommentType): number => {
    if (rubricComment) {
      return rubricComment.pointDelta ? rubricComment.pointDelta : 0;
    } else {
      return comment.pointDelta ? comment.pointDelta : 0;
    }
  };

  public static isEmpty = (comment: CommentType) => {
    return (
      (comment.text === null || comment.text.length === 0) &&
      (comment.pointDelta === null || comment.pointDelta === 0) &&
      (comment.rubricComment === undefined || comment.rubricComment === null)
    );
  };
}

export const CommentMock: CommentType = {
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
  feedback: 0,
  color: null,
};

// export { CommentType, CommentIO, CommentMock, UiComment };
