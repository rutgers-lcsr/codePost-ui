// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

/**
 * PDF-specific comment sorting utilities.
 *
 * PDF pages can contain both text-offset comments and region (bounding-box) comments.
 * To display them in visual order in the comment sidebar, we normalize both types
 * to a 0–100 vertical-percentage scale using a char-offset → Y-position mapping
 * cached from the PDF text layer.
 */

import { isRegionComment, decodeRegion } from '../code-panel/pdfRegionComment';
import type { CommentLike } from './types';

/**********************************************************************************************************************/
/* Vertical-position cache
/**********************************************************************************************************************/

interface VerticalCheckpoint {
  charOffset: number;
  verticalPct: number;
}

const verticalMaps = new Map<string, VerticalCheckpoint[]>();

/**
 * Cache the char-offset → vertical-position mapping for a PDF page's text layer.
 * Called from Pdf.tsx after each page render. Each checkpoint maps a cumulative
 * character offset to the vertical percentage of the corresponding text span.
 */
export const setPdfVerticalMap = (fileId: number, pageNumber: number, checkpoints: VerticalCheckpoint[]): void => {
  verticalMaps.set(`${fileId}-${pageNumber}`, checkpoints);
};

/** Look up a character offset in the vertical map, interpolating between checkpoints. */
const charOffsetToVerticalPct = (fileId: number, pageNumber: number, charOffset: number): number | undefined => {
  const cps = verticalMaps.get(`${fileId}-${pageNumber}`);
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

/**********************************************************************************************************************/
/* Sort-key resolution
/**********************************************************************************************************************/

/**
 * Extract a vertical sort key for a PDF comment.
 *
 * Region comments use the encoded `topPct` directly.
 * Text comments use the cached vertical map to interpolate their Y position.
 * Falls back to `startChar` when no vertical map is available.
 */
export const pdfCommentSortKey = (comment: CommentLike): number => {
  if (isRegionComment(comment)) {
    const { topPct } = decodeRegion(comment.startChar!, comment.endChar!);
    return topPct;
  }
  // For PDF text comments: convert char offset to vertical percentage
  if (comment.file) {
    const vPct = charOffsetToVerticalPct(comment.file, comment.startLine ?? 0, comment.startChar ?? 0);
    if (vPct !== undefined) return vPct;
  }
  return comment.startChar ?? 0;
};
