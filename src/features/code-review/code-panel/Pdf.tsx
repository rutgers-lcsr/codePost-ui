// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* other library imports */
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';

import { pdfjs } from 'react-pdf';

/* codePost imports */
import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';

import type { CommentType } from '../../../types/models';
import { File, getFileContent } from '../../../utils/file';

import CommentHighlightContext from './CommentHighlightContext';
import { PdfHighlightLayer } from './PdfHighlightLayer';
import { Divider } from 'antd';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';
import { encodeRegion } from './pdfRegionComment';

/**********************************************************************************************************************/

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

type PdfDocumentProxyLike = {
  numPages: number;
};

export const Pdf = (props: ICodeContentCoreProps & ICodeContentEditProps) => {
  const [numPages, setPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addComment, commentCounter, comments, file, readOnly, user } = props;

  const hasInitialWidth = useRef(false);
  // Prevents the click handler from firing right after a text selection (mouseup fires first, then click)
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timerId: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const newWidth = entry.contentRect.width;
        // Set immediately on first measurement so the PDF isn't zero-width
        if (!hasInitialWidth.current) {
          hasInitialWidth.current = true;
          setContainerWidth(newWidth);
          return;
        }
        // Debounce subsequent resizes to avoid blanking the entire screen
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => {
          setContainerWidth(newWidth);
        }, 200);
      }
    });
    observer.observe(el);
    return () => {
      if (timerId) clearTimeout(timerId);
      observer.disconnect();
    };
  }, []);

  const theme = useContext(ConsoleThemeContext);
  const commentHighlight = useContext(CommentHighlightContext);
  const setHoveredCommentId = commentHighlight?.setHoveredCommentId;
  const lineHasComments = commentHighlight?.lineHasComments;
  const contextOnHighlightClick = commentHighlight?.onHighlightClick;

  // Track which pages have rendered their text layers so highlights can be drawn
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  // Incremented on every page render to trigger highlight recomputation (e.g. after resize)
  const [renderVersion, setRenderVersion] = useState(0);

  // Track pages whose text layers are empty (scanned/image PDFs)
  const scannedPages = useRef<Set<number>>(new Set());

  // ─── Region drag-to-select state (for scanned PDFs) ───────────────────
  const [dragRect, setDragRect] = useState<{
    pageNumber: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const isDraggingRef = useRef(false);

  const hasCommentsForPage = useCallback(
    (pageNumber: number): boolean => {
      if (!lineHasComments) {
        return false;
      }

      return lineHasComments(pageNumber);
    },
    [lineHasComments],
  );

  const handlePageClick = useCallback(
    (event: React.MouseEvent, pageNumber: number) => {
      // After a text selection or region drag, suppress the click.
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        return;
      }

      // Check for an active text selection first
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        // User selected text — handled by handleTextSelection on mouseup
        return;
      }

      if (readOnly) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      // Page-level comment (legacy behavior)
      const newComment: CommentType = {
        id: commentCounter,
        endChar: 0,
        endLine: pageNumber,
        file: file.id ?? 0,
        pointDelta: 0.0,
        startChar: 0,
        startLine: pageNumber,
        text: '',
        rubricComment: null,
        author: user,
        feedback: 0,
        color: '',
      };

      addComment(newComment, file);
      setHoveredCommentId?.(newComment.id);
    },
    [addComment, commentCounter, file, readOnly, setHoveredCommentId, user],
  );

  // ─── Region drag handlers (scanned PDFs) ──────────────────────────────
  const getPageElementAndNumber = useCallback(
    (target: EventTarget): { pageEl: HTMLElement; pageNumber: number } | null => {
      const el = (target as HTMLElement).closest('[data-page-number]') as HTMLElement | null;
      if (!el) return null;
      const num = parseInt(el.getAttribute('data-page-number')!, 10);
      return isNaN(num) ? null : { pageEl: el, pageNumber: num };
    },
    [],
  );

  const handleRegionMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (readOnly) return;
      const info = getPageElementAndNumber(event.target as EventTarget);
      if (!info) return;
      // Only activate on scanned (no-text) pages
      if (!scannedPages.current.has(info.pageNumber)) return;

      const rect = info.pageEl.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      isDraggingRef.current = true;
      setDragRect({ pageNumber: info.pageNumber, startX: x, startY: y, currentX: x, currentY: y });
    },
    [readOnly, getPageElementAndNumber],
  );

  const handleRegionMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDraggingRef.current || !dragRect) return;
      const info = getPageElementAndNumber(event.target as EventTarget);
      if (!info || info.pageNumber !== dragRect.pageNumber) return;

      const rect = info.pageEl.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
      setDragRect((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
    },
    [dragRect, getPageElementAndNumber],
  );

  const handleRegionMouseUp = useCallback(
    (event: React.MouseEvent) => {
      if (!isDraggingRef.current || !dragRect) {
        return;
      }
      isDraggingRef.current = false;

      const left = Math.min(dragRect.startX, dragRect.currentX);
      const top = Math.min(dragRect.startY, dragRect.currentY);
      const right = Math.max(dragRect.startX, dragRect.currentX);
      const bottom = Math.max(dragRect.startY, dragRect.currentY);

      // Ignore tiny drags (less than ~2% in both dimensions) — treat as a click
      if (right - left < 2 && bottom - top < 2) {
        setDragRect(null);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressNextClickRef.current = true;

      const { startChar, endChar } = encodeRegion(left, top, right, bottom);

      const newComment: CommentType = {
        id: commentCounter,
        startLine: dragRect.pageNumber,
        endLine: dragRect.pageNumber,
        startChar,
        endChar,
        file: file.id ?? 0,
        pointDelta: 0.0,
        text: '',
        rubricComment: null,
        author: user,
        feedback: 0,
        color: '',
      };

      addComment(newComment, file);
      setHoveredCommentId?.(newComment.id);
      setDragRect(null);
    },
    [addComment, commentCounter, dragRect, file, setHoveredCommentId, user],
  );

  // ─── Text selection → comment creation ─────────────────────────────────
  // Walk up the DOM to find the enclosing react-pdf Page element and its page number.
  const getPageNumberFromNode = useCallback((node: Node): number | null => {
    let el: Node | null = node;
    while (el) {
      if (el instanceof HTMLElement) {
        const pageNum = el.getAttribute('data-page-number');
        if (pageNum) return parseInt(pageNum, 10);
      }
      el = el.parentNode;
    }
    return null;
  }, []);

  // Compute a flat character offset for `node` at `offset` within the page's .textLayer.
  // Walks all text-layer spans in DOM order, summing textContent lengths.
  const getCharOffsetInTextLayer = useCallback((node: Node, offset: number, textLayer: Element): number => {
    let charOffset = 0;
    const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (current === node) {
        return charOffset + offset;
      }
      charOffset += current.textContent?.length ?? 0;
      current = walker.nextNode();
    }
    // Fallback: node not found in the text layer — return the total length
    return charOffset;
  }, []);

  const handleTextSelection = useCallback(
    (event: React.MouseEvent) => {
      if (readOnly) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);

      // Verify the selection is inside a text layer
      const startTextLayer = (
        range.startContainer instanceof HTMLElement ? range.startContainer : range.startContainer.parentElement
      )?.closest('.textLayer');
      const endTextLayer = (
        range.endContainer instanceof HTMLElement ? range.endContainer : range.endContainer.parentElement
      )?.closest('.textLayer');
      if (!startTextLayer || !endTextLayer) return;

      const startPage = getPageNumberFromNode(range.startContainer);
      const endPage = getPageNumberFromNode(range.endContainer);
      if (startPage === null || endPage === null) return;

      // Calculate character offsets within the text layer
      let startChar = getCharOffsetInTextLayer(range.startContainer, range.startOffset, startTextLayer);
      let endChar = getCharOffsetInTextLayer(range.endContainer, range.endOffset, endTextLayer);

      // Normalize direction (user may have selected bottom-to-top)
      let finalStartPage = startPage;
      let finalEndPage = endPage;
      if (finalStartPage > finalEndPage || (finalStartPage === finalEndPage && startChar > endChar)) {
        [finalStartPage, finalEndPage] = [finalEndPage, finalStartPage];
        [startChar, endChar] = [endChar, startChar];
      }

      event.preventDefault();
      event.stopPropagation();

      const newComment: CommentType = {
        id: commentCounter,
        startLine: finalStartPage,
        endLine: finalEndPage,
        startChar,
        endChar,
        file: file.id ?? 0,
        pointDelta: 0.0,
        text: '',
        rubricComment: null,
        author: user,
        feedback: 0,
        color: '',
      };

      // Suppress the click event that will fire after this mouseup
      suppressNextClickRef.current = true;

      addComment(newComment, file);
      setHoveredCommentId?.(newComment.id);

      // Clear the native selection so it doesn't linger
      selection.removeAllRanges();
    },
    [
      addComment,
      commentCounter,
      file,
      getCharOffsetInTextLayer,
      getPageNumberFromNode,
      readOnly,
      setHoveredCommentId,
      user,
    ],
  );

  const onDocumentLoadSuccess = (pdf: PdfDocumentProxyLike) => {
    setPages(pdf.numPages);
    dispatch();
  };

  // FIXME: This is a hack to trigger comment placements to reload after the PDF has loaded.
  // The PDF can take some time to load, and if the placement isn't triggered the comments will stay on top
  // Passing in refs to the <Comments /> and triggering comment placement from <CodeConent /> doesn't work because
  // of a typescript issue with being unable to use react.forwardRef(), which we need to do because each <Comments />
  // object is wrapped in a HOC with withWindowWatcher.
  const dispatch = () => {
    const event = new Event('pdf-loaded');
    document.dispatchEvent(event);
  };

  const handlePageRenderSuccess = useCallback((pageNumber: number) => {
    dispatch();
    // Detect whether this page has an actual text layer (empty = scanned/image PDF)
    const pageEl = document.querySelector(`[data-page-number="${pageNumber}"]`);
    if (pageEl) {
      const textLayer = pageEl.querySelector('.textLayer');
      const hasText = textLayer ? (textLayer.textContent?.trim().length ?? 0) > 0 : false;
      if (!hasText) {
        scannedPages.current.add(pageNumber);
      } else {
        scannedPages.current.delete(pageNumber);
      }
    }
    setRenderedPages((prev) => {
      if (prev.has(pageNumber)) return prev;
      const next = new Set(prev);
      next.add(pageNumber);
      return next;
    });
    setRenderVersion((v) => v + 1);
  }, []);

  // PDF pages don't use markdown-block classes — all highlight rendering
  // is handled by PdfHighlightLayer. Using a plain class avoids the
  // border / background / padding that _markdown.scss applies.
  const getPageClassName = useCallback(
    (_pageNumber: number) => {
      return readOnly ? 'readonly' : 'active';
    },
    [readOnly],
  );

  const pageEventHandlers = useMemo(
    () =>
      Array.from({ length: numPages ?? 0 }, (_, index) => {
        const pageNumber = index + 1;
        const pageHasComments = hasCommentsForPage(pageNumber);

        return {
          pageNumber,
          pageHasComments,
          onClick: (event: React.MouseEvent) => handlePageClick(event, pageNumber),
          onRenderSuccess: () => handlePageRenderSuccess(pageNumber),
        };
      }),
    [handlePageClick, handlePageRenderSuccess, hasCommentsForPage, numPages],
  );

  // Get comments for a specific page (for highlight rendering)
  const getCommentsForPage = useCallback(
    (pageNumber: number): CommentType[] => {
      return comments.filter((c) => c.startLine! <= pageNumber && c.endLine! >= pageNumber);
    },
    [comments],
  );

  // Compute the visual drag selection rectangle (percentage-based within the page)
  const selectionStyle = useMemo(() => {
    if (!dragRect) return null;
    const left = Math.min(dragRect.startX, dragRect.currentX);
    const top = Math.min(dragRect.startY, dragRect.currentY);
    const width = Math.abs(dragRect.currentX - dragRect.startX);
    const height = Math.abs(dragRect.currentY - dragRect.startY);
    return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` };
  }, [dragRect]);

  if (File.codeType(props.file) !== 'pdf') {
    // This should never happen, but if it does we don't want to render a broken PDF viewer, so we render an empty block instead.
    return <div className="markdown-block markdown-block--empty" />;
  }

  return (
    <div
      ref={containerRef}
      onMouseUp={handleTextSelection}
      onMouseDown={handleRegionMouseDown}
      onMouseMove={handleRegionMouseMove}
    >
      <Document
        file={getFileContent(props.file)}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => console.error('Error loading PDF:', error)}
      >
        {pageEventHandlers.map(({ pageNumber, pageHasComments, onClick, onRenderSuccess }) => (
          <React.Fragment key={`page_${pageNumber}`}>
            {pageNumber === 1 && (
              <Divider titlePlacement="right" style={{ margin: '16px 0', color: theme.consoleTheme.text }}>
                {pageNumber}
              </Divider>
            )}
            <div style={{ position: 'relative' }}>
              <Page
                className={getPageClassName(pageNumber)}
                data-has-comment={pageHasComments ? 'true' : undefined}
                pageNumber={pageNumber}
                width={containerWidth ?? undefined}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                onRenderSuccess={onRenderSuccess}
                onClick={onClick}
                onMouseUp={handleRegionMouseUp}
              />
              {renderedPages.has(pageNumber) && (
                <PdfHighlightLayer
                  pageNumber={pageNumber}
                  comments={getCommentsForPage(pageNumber)}
                  onHighlightClick={contextOnHighlightClick}
                  setHoveredCommentId={setHoveredCommentId}
                  renderVersion={renderVersion}
                />
              )}
              {dragRect && dragRect.pageNumber === pageNumber && selectionStyle && (
                <div className="pdf-region-selection" style={selectionStyle} />
              )}
            </div>
            <Divider
              titlePlacement="right"
              style={{ margin: '16px 0', color: theme.consoleTheme.text }}
              key={`divider_${pageNumber}`}
            >
              {pageNumber + 1}
            </Divider>
          </React.Fragment>
        ))}
      </Document>
    </div>
  );
};
