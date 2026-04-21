// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { Comment, RubricComment } from '../api-client';
import { isRegionComment, decodeRegion } from '../features/code-review/code-panel/pdfRegionComment';

export type CommentType = Comment;

/** Extract a vertical sort key for a comment. Region comments sort by topPct; others by startChar. */
const verticalSortKey = (c: CommentType): number => {
  if (isRegionComment(c)) {
    const { topPct } = decodeRegion(c.startChar!, c.endChar!);
    // Place region comments in a separate range above text-offset values so they
    // sort after text-offset comments on the same page while preserving their
    // relative vertical order among themselves.
    return 100_000 + topPct;
  }
  return c.startChar ?? 0;
};

export class CommentIO {
  public static sortComments = (comments: CommentType[]): CommentType[] => {
    return comments.sort((a: CommentType, b: CommentType) => {
      if (a.startLine === b.startLine) {
        const aKey = verticalSortKey(a);
        const bKey = verticalSortKey(b);
        if (aKey > bKey) {
          return 1;
        }
        if (aKey < bKey) {
          return -1;
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
      const aKey = verticalSortKey(a);
      const bKey = verticalSortKey(b);
      if (aKey === bKey) {
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
      return aKey - bKey;
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
      (!comment.text || comment.text.length === 0) &&
      (comment.pointDelta === null || comment.pointDelta === 0) &&
      (comment.rubricComment === undefined || comment.rubricComment === null)
    );
  };
}
