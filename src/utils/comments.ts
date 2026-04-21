// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { Comment, RubricComment } from '../api-client';
import { isRegionComment, decodeRegion } from '../features/code-review/code-panel/pdfRegionComment';
import { File, type FileType } from './file';

export type CommentType = Comment;

/**********************************************************************************************************************/
/* CommentKind — discriminated comment type
/**********************************************************************************************************************/

/** All possible comment kinds across the platform. */
export type CommentKind = 'code' | 'markdown' | 'jupyter' | 'image' | 'pdf-page' | 'pdf-text' | 'pdf-region';

/** Derive the comment kind from a comment and its parent file (or codeType string). */
export const getCommentKind = (
  comment: Pick<CommentType, 'startChar' | 'endChar' | 'startLine' | 'endLine'>,
  fileOrCodeType: FileType | string,
): CommentKind => {
  const codeType = typeof fileOrCodeType === 'string' ? fileOrCodeType : File.codeType(fileOrCodeType);
  if (codeType !== 'pdf') return codeType as CommentKind;

  if (isRegionComment(comment)) return 'pdf-region';
  if (
    (comment.startChar === 0 || comment.startChar == null) &&
    (comment.endChar === 0 || comment.endChar == null) &&
    comment.startLine === comment.endLine
  ) {
    return 'pdf-page';
  }
  return 'pdf-text';
};

/** Get a human-readable line/page/cell label for a comment. */
export const getCommentLabel = (kind: CommentKind, startLine: number, endLine?: number): string => {
  switch (kind) {
    case 'markdown':
    case 'jupyter':
    case 'image':
      return `Cell ${startLine + 1}`;
    case 'pdf-page':
    case 'pdf-text':
    case 'pdf-region':
      return `Page ${startLine}`;
    case 'code':
    default:
      if (endLine !== undefined && endLine !== startLine) {
        return `Lines ${startLine + 1}\u2013${endLine + 1}`;
      }
      return `Line ${startLine + 1}`;
  }
};

/**********************************************************************************************************************/
/* PDF char-offset → vertical-position cache — used to sort mixed text/region comments
/**********************************************************************************************************************/

interface VerticalCheckpoint {
  charOffset: number;
  verticalPct: number;
}

const pdfVerticalMaps = new Map<string, VerticalCheckpoint[]>();

/**
 * Cache the char-offset → vertical-position mapping for a PDF page's text layer.
 * Called from Pdf.tsx after each page render. Each checkpoint maps a cumulative
 * character offset to the vertical percentage of the corresponding text span.
 */
export const setPdfVerticalMap = (fileId: number, pageNumber: number, checkpoints: VerticalCheckpoint[]): void => {
  pdfVerticalMaps.set(`${fileId}-${pageNumber}`, checkpoints);
};

/** Look up a character offset in the vertical map, interpolating between checkpoints. */
const charOffsetToVerticalPct = (fileId: number, pageNumber: number, charOffset: number): number | undefined => {
  const cps = pdfVerticalMaps.get(`${fileId}-${pageNumber}`);
  if (!cps || cps.length === 0) return undefined;

  if (charOffset <= cps[0].charOffset) return cps[0].verticalPct;
  if (charOffset >= cps[cps.length - 1].charOffset) return cps[cps.length - 1].verticalPct;

  // Binary search for the surrounding checkpoints
  let lo = 0;
  let hi = cps.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cps[mid].charOffset <= charOffset) lo = mid;
    else hi = mid;
  }

  // Linear interpolation
  const range = cps[hi].charOffset - cps[lo].charOffset;
  if (range === 0) return cps[lo].verticalPct;
  const t = (charOffset - cps[lo].charOffset) / range;
  return cps[lo].verticalPct + t * (cps[hi].verticalPct - cps[lo].verticalPct);
};

/**
 * Extract a vertical sort key for a comment.
 * For PDF files (when a vertical map is cached), both text-offset and region
 * comments are normalized to the same 0–100 vertical-percentage scale so they
 * interleave correctly by visual position on the page.
 * For non-PDF files the raw startChar offset is used.
 */
const verticalSortKey = (c: CommentType): number => {
  if (isRegionComment(c)) {
    const { topPct } = decodeRegion(c.startChar!, c.endChar!);
    return topPct;
  }
  // For PDF text comments: convert char offset to vertical percentage
  if (c.file) {
    const vPct = charOffsetToVerticalPct(c.file, c.startLine, c.startChar ?? 0);
    if (vPct !== undefined) return vPct;
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
