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
import { setPdfVerticalMap } from '../formats/pdfSorting';
import { pdfWorkerUrl } from './pdfWorkerUrl';

/**********************************************************************************************************************/

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type PdfDocumentProxyLike = {
  numPages: number;
};

export const Pdf = (props: ICodeContentCoreProps & ICodeContentEditProps) => {
  const [numPages, setPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addComment, comments, file, readOnly, user } = props;
  const commentCounter = props.commentCounter ?? -1;

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
  // Whether every rendered page so far is scanned (no text layer) — drives default crosshair cursor
  const [isAllScanned, setIsAllScanned] = useState(false);

  // ─── Region drag-to-select state (for scanned PDFs) ───────────────────
  const [dragRect, setDragRect] = useState<{
    pageNumber: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const isDraggingRef = useRef(false);

  // Track Alt key for crosshair cursor (signals region-select mode)
  const [altHeld, setAltHeld] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

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

      addComment?.(newComment, file);
      setHoveredCommentId?.(newComment.id);
    },
    [addComment, commentCounter, file, readOnly, setHoveredCommentId, user],
  );

  // ─── Region drag handlers (Alt+drag on any page, or plain drag on scanned pages) ───
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

      // Activate on scanned pages (no text layer) or when Alt key is held.
      // Double-check the text layer at interaction time in case the deferred
      // detection hasn't run yet (the text layer populates asynchronously).
      let isScanned = scannedPages.current.has(info.pageNumber);
      if (isScanned) {
        const textLayer = info.pageEl.querySelector('.textLayer');
        const textLength = textLayer?.textContent?.trim().length ?? 0;
        if (textLength > 0) {
          // Text layer has populated since the initial check — this is NOT a scanned page
          scannedPages.current.delete(info.pageNumber);
          isScanned = false;
        }
      }
      if (!isScanned && !event.altKey) return;

      // Prevent text selection while region-dragging
      event.preventDefault();

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
        suppressNextClickRef.current = false;
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

      addComment?.(newComment, file);
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

  /**
   * Compute the flat character offset of a DOM node within a text layer.
   * Walks text nodes in document order, summing lengths until we reach the target.
   */
  const getOffsetInTextLayer = useCallback(
    (textLayer: Element, targetNode: Node, nodeOffset: number): number | null => {
      const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
      let charsSoFar = 0;
      let current = walker.nextNode() as Text | null;

      while (current) {
        if (current === targetNode) {
          return charsSoFar + nodeOffset;
        }
        charsSoFar += current.textContent?.length ?? 0;
        current = walker.nextNode() as Text | null;
      }

      // targetNode might be an Element; check if it's an ancestor of text nodes
      if (targetNode.nodeType === Node.ELEMENT_NODE) {
        // nodeOffset refers to the child index — sum text up to that child
        const walker2 = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
        let chars = 0;
        let n = walker2.nextNode() as Text | null;
        while (n) {
          // Check if this text node is past the offset-th child of targetNode
          if (n.parentNode === targetNode || targetNode.contains(n)) {
            // Count children of targetNode that precede this text node
            let idx = 0;
            let child = targetNode.firstChild;
            while (child && child !== n && !child.contains(n)) {
              idx++;
              child = child.nextSibling;
            }
            if (idx >= nodeOffset) {
              return chars;
            }
          }
          chars += n.textContent?.length ?? 0;
          n = walker2.nextNode() as Text | null;
        }
        return chars;
      }

      return null;
    },
    [],
  );

  const handleTextSelection = useCallback(
    (event: React.MouseEvent) => {
      if (readOnly) return;

      // Skip if a region drag was in progress — region mouseup handles that interaction
      if (isDraggingRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);

      // Verify the selection is inside a text layer
      const startTextLayer = (
        range.startContainer instanceof HTMLElement ? range.startContainer : range.startContainer.parentElement
      )?.closest('.textLayer');
      if (!startTextLayer) return;

      const startPage = getPageNumberFromNode(range.startContainer);
      if (startPage === null) return;

      const endPage = getPageNumberFromNode(range.endContainer) ?? startPage;

      // Compute flat character offsets within the text layer for precise per-line highlights
      const startCharOffset = getOffsetInTextLayer(startTextLayer, range.startContainer, range.startOffset);
      if (startCharOffset === null) return;

      // For end offset, find the text layer of the end page
      let endCharOffset: number | null;
      if (endPage === startPage) {
        endCharOffset = getOffsetInTextLayer(startTextLayer, range.endContainer, range.endOffset);
      } else {
        const endTextLayer = (
          range.endContainer instanceof HTMLElement ? range.endContainer : range.endContainer.parentElement
        )?.closest('.textLayer');
        if (!endTextLayer) return;
        endCharOffset = getOffsetInTextLayer(endTextLayer, range.endContainer, range.endOffset);
      }
      if (endCharOffset === null) return;

      // Ensure we have a valid selection
      if (startPage === endPage && startCharOffset === endCharOffset) return;

      event.preventDefault();
      event.stopPropagation();

      const newComment: CommentType = {
        id: commentCounter,
        startLine: startPage,
        endLine: endPage,
        startChar: startCharOffset,
        endChar: endCharOffset,
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

      addComment?.(newComment, file);
      setHoveredCommentId?.(newComment.id);

      // Clear the native selection so it doesn't linger
      selection.removeAllRanges();
    },
    [
      addComment,
      commentCounter,
      file,
      getOffsetInTextLayer,
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

  const handlePageRenderSuccess = useCallback(
    (pageNumber: number) => {
      dispatch();

      // Detect whether this page has an actual text layer (empty = scanned/image PDF).
      // The text layer is populated asynchronously by pdfjs after the canvas renders,
      // so we defer the check to give the text spans time to appear.
      const detectTextLayer = () => {
        const pageEl = document.querySelector(`[data-page-number="${pageNumber}"]`);
        if (!pageEl) return;

        const textLayer = pageEl.querySelector('.textLayer');
        const textLength = textLayer?.textContent?.trim().length ?? 0;
        const hasText = textLength > 0;
        if (!hasText) {
          scannedPages.current.add(pageNumber);
        } else {
          scannedPages.current.delete(pageNumber);
        }
        // Build char-offset → vertical-position mapping so region and text
        // comments on the same page sort by their true visual position.
        if (file.id && textLayer) {
          const pageRect = pageEl.getBoundingClientRect();
          const pageHeight = pageRect.height;
          const checkpoints: { charOffset: number; verticalPct: number }[] = [];
          const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
          let charsSoFar = 0;
          let node = walker.nextNode() as Text | null;
          while (node) {
            const parent = node.parentElement;
            if (parent && pageHeight > 0) {
              const rect = parent.getBoundingClientRect();
              checkpoints.push({
                charOffset: charsSoFar,
                verticalPct: ((rect.top - pageRect.top) / pageHeight) * 100,
              });
            }
            charsSoFar += node.textContent?.length ?? 0;
            node = walker.nextNode() as Text | null;
          }
          setPdfVerticalMap(file.id, pageNumber, checkpoints);
        }

        // Update scanned-default cursor: if every rendered page is scanned, show crosshair
        setIsAllScanned((prev) => {
          const allScanned = scannedPages.current.size > 0 && scannedPages.current.size >= (numPages ?? 0);
          return prev !== allScanned ? allScanned : prev;
        });
        setRenderVersion((v) => v + 1);
      };

      // Defer: pdfjs populates the text layer asynchronously after the canvas render
      // callback fires. Wait two frames to ensure the spans are in the DOM.
      requestAnimationFrame(() => requestAnimationFrame(detectTextLayer));

      setRenderedPages((prev) => {
        if (prev.has(pageNumber)) return prev;
        const next = new Set(prev);
        next.add(pageNumber);
        return next;
      });
    },
    [numPages, file.id],
  );

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
      className={altHeld || isDraggingRef.current || isAllScanned ? 'pdf-region-cursor' : undefined}
      style={altHeld || isDraggingRef.current || isAllScanned ? { userSelect: 'none' } : undefined}
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
            <div style={{ position: 'relative' }} onMouseUp={handleRegionMouseUp}>
              <Page
                className={getPageClassName(pageNumber)}
                data-has-comment={pageHasComments ? 'true' : undefined}
                pageNumber={pageNumber}
                width={containerWidth ?? undefined}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                onRenderSuccess={onRenderSuccess}
                onClick={onClick}
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
