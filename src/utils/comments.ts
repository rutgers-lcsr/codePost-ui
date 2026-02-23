// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { Comment, RubricComment } from '../api-client';

export type CommentType = Comment;

export class CommentIO {
  public static sortComments = (comments: CommentType[]): CommentType[] => {
    return comments.sort((a: CommentType, b: CommentType) => {
      if (a.startLine === b.startLine) {
        const aStartChar = a.startChar ?? 0;
        const bStartChar = b.startChar ?? 0;
        if (aStartChar > bStartChar) {
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
      const aStartChar = a.startChar ?? 0;
      const bStartChar = b.startChar ?? 0;
      if (aStartChar === bStartChar) {
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
      return aStartChar - bStartChar;
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

export class UiComment {
  public static isNew = (comment: CommentType) => {
    return comment.id < 0;
  };

  public static points = (comment: CommentType, rubricComment?: RubricComment): number => {
    if (rubricComment) {
      return rubricComment.pointDelta ? rubricComment.pointDelta : 0;
    }
    return comment.pointDelta ? comment.pointDelta : 0;
  };

  public static isEmpty = (comment: CommentType) => {
    return (
      (comment.text === null || comment.text?.length === 0) &&
      (comment.pointDelta === null || comment.pointDelta === 0) &&
      (comment.rubricComment === undefined || comment.rubricComment === null)
    );
  };
}
