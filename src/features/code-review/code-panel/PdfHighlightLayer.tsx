// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { CommentType } from '../../../types/models';
import { useHoveredCommentId } from './CommentHighlightContext';

interface HighlightRect {
  commentId: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PdfHighlightLayerProps {
  pageNumber: number;
  comments: CommentType[];
  onHighlightClick?: (e: React.MouseEvent, commentId: number) => void;
  setHoveredCommentId?: (id: number | null) => void;
  /** Incremented on each page render to trigger highlight recomputation after resize. */
  renderVersion?: number;
}

/**
 * Checks whether a comment is a legacy page-level comment (no text selection).
 * Page-level comments have startChar=0, endChar=0, and startLine=endLine.
 */
const isPageLevelComment = (comment: CommentType): boolean => {
  return (
    (comment.startChar === 0 || comment.startChar == null) &&
    (comment.endChar === 0 || comment.endChar == null) &&
    comment.startLine === comment.endLine
  );
};

/**
 * Given a text layer element and a flat character offset, find the corresponding
 * DOM text node and offset within that node using a TreeWalker.
 */
const findNodeAtOffset = (textLayer: Element, targetOffset: number): { node: Text; offset: number } | null => {
  const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
  let charsSoFar = 0;
  let current = walker.nextNode() as Text | null;

  while (current) {
    const len = current.textContent?.length ?? 0;
    if (charsSoFar + len >= targetOffset) {
      return { node: current, offset: targetOffset - charsSoFar };
    }
    charsSoFar += len;
    current = walker.nextNode() as Text | null;
  }

  // If offset exceeds total text, clamp to the last node
  if (current === null) {
    // Walk backwards to find the last text node
    const allText: Text[] = [];
    const w2 = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
    let n = w2.nextNode() as Text | null;
    while (n) {
      allText.push(n);
      n = w2.nextNode() as Text | null;
    }
    if (allText.length > 0) {
      const last = allText[allText.length - 1];
      return { node: last, offset: last.textContent?.length ?? 0 };
    }
  }

  return null;
};

/**
 * Compute highlight rectangles for a single comment on a given page.
 * Uses DOM Range + getClientRects() to map character offsets to visual positions.
 */
const computeRectsForComment = (comment: CommentType, pageNumber: number, pageElement: Element): HighlightRect[] => {
  const textLayer = pageElement.querySelector('.textLayer');
  if (!textLayer) return [];

  const pageRect = pageElement.getBoundingClientRect();

  // Determine character range for this page
  const isStartPage = comment.startLine === pageNumber;
  const isEndPage = comment.endLine === pageNumber;
  const startOffset = isStartPage ? comment.startChar! : 0;

  // For the end offset, if this is the end page, use endChar.
  // Otherwise, use the total text length (entire page is highlighted).
  let endOffset: number;
  if (isEndPage) {
    endOffset = comment.endChar!;
  } else {
    // Sum total text in the text layer
    let total = 0;
    const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
    let n = walker.nextNode();
    while (n) {
      total += n.textContent?.length ?? 0;
      n = walker.nextNode();
    }
    endOffset = total;
  }

  if (startOffset === endOffset) return [];

  const startPoint = findNodeAtOffset(textLayer, startOffset);
  const endPoint = findNodeAtOffset(textLayer, endOffset);
  if (!startPoint || !endPoint) return [];

  const range = document.createRange();
  try {
    range.setStart(startPoint.node, startPoint.offset);
    range.setEnd(endPoint.node, endPoint.offset);
  } catch {
    return [];
  }

  const clientRects = range.getClientRects();
  if (clientRects.length === 0) return [];

  // Convert to page-relative coords, filtering out tiny/zero-size rects
  const rawRects: { top: number; left: number; right: number; bottom: number }[] = [];
  for (let i = 0; i < clientRects.length; i++) {
    const r = clientRects[i];
    if (r.width < 1 || r.height < 1) continue;
    rawRects.push({
      top: r.top - pageRect.top,
      left: r.left - pageRect.left,
      right: r.right - pageRect.left,
      bottom: r.bottom - pageRect.top,
    });
  }

  // Sort by vertical midpoint then left so we process line by line
  rawRects.sort((a, b) => {
    const midA = (a.top + a.bottom) / 2;
    const midB = (b.top + b.bottom) / 2;
    return midA - midB || a.left - b.left;
  });

  // Merge rects that overlap vertically by >50% of the smaller rect's height
  // (PDF.js text layer creates overlapping spans per line that need collapsing)
  const merged: { top: number; left: number; right: number; bottom: number }[] = [];
  for (const rect of rawRects) {
    const last = merged[merged.length - 1];
    if (last) {
      const vertOverlap = Math.min(last.bottom, rect.bottom) - Math.max(last.top, rect.top);
      const minHeight = Math.min(last.bottom - last.top, rect.bottom - rect.top);
      if (vertOverlap > minHeight * 0.5) {
        // Same visual line — extend the merged rect
        last.left = Math.min(last.left, rect.left);
        last.right = Math.max(last.right, rect.right);
        last.top = Math.min(last.top, rect.top);
        last.bottom = Math.max(last.bottom, rect.bottom);
        continue;
      }
    }
    merged.push({ ...rect });
  }

  return merged.map((r) => ({
    commentId: comment.id,
    top: r.top,
    left: r.left,
    width: r.right - r.left,
    height: r.bottom - r.top,
  }));
};

/**
 * PdfHighlightLayer renders colored overlays on top of a PDF page
 * for each comment that intersects this page.
 */
export const PdfHighlightLayer: React.FC<PdfHighlightLayerProps> = ({
  pageNumber,
  comments,
  onHighlightClick,
  setHoveredCommentId,
  renderVersion,
}) => {
  const [rects, setRects] = useState<HighlightRect[]>([]);
  const [pageLevelIds, setPageLevelIds] = useState<number[]>([]);
  const layerRef = useRef<HTMLDivElement>(null);
  const hoveredCommentId = useHoveredCommentId();

  const recompute = useCallback(() => {
    // Find the page element by data-page-number
    const pageEl = document.querySelector(`[data-page-number="${pageNumber}"]`);
    if (!pageEl) return;

    const allRects: HighlightRect[] = [];
    const pageLevel: number[] = [];

    for (const comment of comments) {
      if (isPageLevelComment(comment)) {
        pageLevel.push(comment.id);
      } else {
        const commentRects = computeRectsForComment(comment, pageNumber, pageEl);
        allRects.push(...commentRects);
      }
    }

    setRects(allRects);
    setPageLevelIds(pageLevel);
  }, [comments, pageNumber]);

  // Recompute when comments change, page renders, or after resize (renderVersion)
  useEffect(() => {
    // Small delay to ensure the text layer DOM is settled
    const timer = setTimeout(recompute, 50);
    return () => clearTimeout(timer);
  }, [recompute, renderVersion]);

  // Also recompute on resize (e.g. split-screen divider drag)
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      recompute();
    });
    const pageEl = document.querySelector(`[data-page-number="${pageNumber}"]`);
    if (pageEl) {
      observer.observe(pageEl);
    }
    return () => observer.disconnect();
  }, [pageNumber, recompute]);

  const handleClick = useCallback(
    (e: React.MouseEvent, commentId: number) => {
      e.stopPropagation();
      onHighlightClick?.(e, commentId);
      setHoveredCommentId?.(commentId);
    },
    [onHighlightClick, setHoveredCommentId],
  );

  if (rects.length === 0 && pageLevelIds.length === 0) return null;

  return (
    <div ref={layerRef} className="pdf-highlight-layer">
      {/* Page-level comment overlays (legacy: startChar=0, endChar=0) */}
      {pageLevelIds.map((id) => (
        <div
          key={`page-hl-${id}`}
          className={`pdf-page-highlight${hoveredCommentId === id ? ' pdf-page-highlight--hovered' : ''}`}
          onClick={(e) => handleClick(e, id)}
          onMouseEnter={() => setHoveredCommentId?.(id)}
          onMouseLeave={() => setHoveredCommentId?.(null)}
        />
      ))}

      {/* Text-level comment highlight rectangles */}
      {rects.map((rect, i) => (
        <div
          key={`hl-${rect.commentId}-${i}`}
          className={`pdf-highlight-rect${hoveredCommentId === rect.commentId ? ' pdf-highlight-rect--hovered' : ''}`}
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
          onClick={(e) => handleClick(e, rect.commentId)}
          onMouseEnter={() => setHoveredCommentId?.(rect.commentId)}
          onMouseLeave={() => setHoveredCommentId?.(null)}
        />
      ))}
    </div>
  );
};
