// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { Comment, RubricComment } from '../api-client';
import { fileTypeRegistry, type CommentKind } from '../features/code-review/formats';
import { pdfCommentSortKey } from '../features/code-review/formats/pdfSorting';
import { type FileType } from './file';

export type CommentType = Comment;

// Re-export setPdfVerticalMap from the PDF sorting module for consumers
// that previously imported it from this file (Pdf.tsx, tests).
export { setPdfVerticalMap } from '../features/code-review/formats/pdfSorting';

/**********************************************************************************************************************/
/* CommentKind — discriminated comment type
/**********************************************************************************************************************/

export type { CommentKind };

/** Derive the comment kind from a comment and its parent file (or codeType string). */
export const getCommentKind = (
  comment: Pick<CommentType, 'startChar' | 'endChar' | 'startLine' | 'endLine'>,
  fileOrCodeType: FileType | string,
): CommentKind => {
  if (typeof fileOrCodeType === 'string') {
    // Legacy path: caller passed a codeType string. Look up the file type
    // and delegate to its resolveCommentKind.
    const ft = fileTypeRegistry.getById(fileOrCodeType);
    return ft ? ft.resolveCommentKind(comment) : (fileOrCodeType as CommentKind);
  }
  return fileTypeRegistry.resolveCommentKind(fileOrCodeType, comment);
};

/** Get a human-readable line/page/cell label for a comment. */
export const getCommentLabel = (kind: CommentKind, startLine: number, endLine?: number): string => {
  // Look up the owning file type via commentKinds (handles sub-kinds like 'pdf-text')
  const ft = fileTypeRegistry.getByCommentKind(kind);
  return ft ? ft.commentLabel(startLine, endLine) : `Line ${startLine + 1}`;
};

/**********************************************************************************************************************/
/* Comment sorting — delegates PDF sort-key resolution to the PDF file type definition
/**********************************************************************************************************************/

/**
 * Extract a sort key for ordering comments within the same startLine.
 * For PDF comments, normalizes text-offset and region comments to a shared
 * 0–100 vertical-percentage scale via the PDF definition's sort key.
 * For non-PDF comments, uses the raw startChar offset.
 */
const commentSortKey = (c: CommentType): number => pdfCommentSortKey(c);

export class CommentIO {
  public static sortComments = (comments: CommentType[]): CommentType[] => {
    return comments.sort((a: CommentType, b: CommentType) => {
      if (a.startLine === b.startLine) {
        const aKey = commentSortKey(a);
        const bKey = commentSortKey(b);
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
      const aKey = commentSortKey(a);
      const bKey = commentSortKey(b);
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
