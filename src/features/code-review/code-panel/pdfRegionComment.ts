// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

/**
 * Encoding utilities for region-based PDF comments (for scanned/image PDFs without text layers).
 *
 * Region comments store a bounding box (left, top, right, bottom) as percentages (0–100)
 * of the page dimensions, packed into the existing startChar/endChar integer fields.
 *
 * A sentinel value (REGION_COMMENT_MARKER = 1,000,000) distinguishes region comments from
 * text-offset comments and page-level comments (startChar=0, endChar=0).
 *
 * Encoding:
 *   startChar = MARKER + left * 101 + top
 *   endChar   = MARKER + right * 101 + bottom
 *
 * This gives integer-percentage precision (1%) which is sufficient for visual region selection.
 */

const REGION_COMMENT_MARKER = 1_000_000;

/** Returns true if the comment is a region-based (bounding-box) comment. */
export const isRegionComment = (comment: { startChar?: number | null; endChar?: number | null }): boolean =>
  (comment.startChar ?? 0) >= REGION_COMMENT_MARKER && (comment.endChar ?? 0) >= REGION_COMMENT_MARKER;

/** Encode a bounding box (percentages 0–100) into startChar/endChar. */
export const encodeRegion = (
  leftPct: number,
  topPct: number,
  rightPct: number,
  bottomPct: number,
): { startChar: number; endChar: number } => {
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));
  return {
    startChar: REGION_COMMENT_MARKER + clamp(leftPct) * 101 + clamp(topPct),
    endChar: REGION_COMMENT_MARKER + clamp(rightPct) * 101 + clamp(bottomPct),
  };
};

/** Decode startChar/endChar back into a bounding box (percentages 0–100). */
export const decodeRegion = (
  startChar: number,
  endChar: number,
): { leftPct: number; topPct: number; rightPct: number; bottomPct: number } => {
  const s = startChar - REGION_COMMENT_MARKER;
  const e = endChar - REGION_COMMENT_MARKER;
  return {
    leftPct: Math.floor(s / 101),
    topPct: s % 101,
    rightPct: Math.floor(e / 101),
    bottomPct: e % 101,
  };
};
