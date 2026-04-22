// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';

import CodePanelHighlighting from './CodePanelHighlighting';
import CodePanelSizing from './CodePanelSizing';

import { getOsTriggerKeyFromEvent } from '../../../components/core/operatingSystem';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { CommentIO, type CommentType } from '../../../utils/comments';

import { scrollHighlightIntoView, useCommentHighlightStore } from './CommentHighlightContext';

import { getFileContent, type FileType } from '../../../utils/file';

import { POSITION } from '../../../types/common';

import { wait } from '../../../utils/animation';

import { CURSOR_DOMAIN } from '../CodeConsoleEnums';

import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import themeVars from '../../../styles/abstracts/_theme.js';

import {
  back,
  down,
  front,
  ICursorType,
  LeadPosition,
  left,
  right,
  shiftDown,
  shiftLeft,
  shiftRight,
  shiftUp,
  up,
} from './Cursor';

interface ICodeProps {
  commentCounter: number;
  cursorMode: boolean;
  showCursor: CURSOR_DOMAIN;
  updateCursorDomain: (domain: CURSOR_DOMAIN) => void;
  onCursorChange?: (cursor: ICursorType) => void;
  onUpdateCommentLocation?: (
    commentId: number,
    newStartLine: number,
    newEndLine: number,
    newStartChar: number,
    newEndChar: number,
  ) => void;
}

// Code component no longer needs comments in props - gets from CommentHighlightContext
type CodePropsWithoutComments = Omit<ICodeContentCoreProps, 'comments'> & ICodeContentEditProps & ICodeProps;

const Code = (props: CodePropsWithoutComments) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const {
    comments: contextComments,
    setHoveredCommentId,
    onHighlightClick: contextOnHighlightClick,
    setPreviewComment,
    draggingCommentId,
    draggingType,
    focusedCommentId,
  } = useCommentHighlightStore();

  const [cursor, setCursor] = React.useState<ICursorType>({
    startChar: 0,
    endChar: 1,
    startLine: 0,
    endLine: 0,
    lead: 'front',
  });

  // Reset cursor when file changes (previously handled by key-based remounting)
  const fileId = (props.file as FileType & { id?: number }).id;
  React.useEffect(() => {
    setCursor({ startChar: 0, endChar: 1, startLine: 0, endLine: 0, lead: 'front' });
  }, [fileId]);

  const handleCursorChange = (newCursor: ICursorType) => {
    setCursor(newCursor);
    if (props.onCursorChange) {
      props.onCursorChange(newCursor);
    }
  };

  // --- Windowed rendering: only render visible lines for performance ---
  const wordWrap = useCodeConsoleStore((s) => s.wordWrap);
  const fileContent = getFileContent(props.file);
  const lines = React.useMemo(() => fileContent.split('\n'), [fileContent]);
  const LINE_HEIGHT = themeVars.grade.codeLineHeight; // 20px
  const OVERSCAN = 20;
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 80 });

  React.useEffect(() => {
    // Disable windowing when word-wrap is on (line heights vary)
    if (wordWrap) {
      setVisibleRange({ start: 0, end: lines.length - 1 });
      return;
    }

    const scrollContainer = document.querySelector('.code-panel--code') as HTMLElement | null;
    if (!scrollContainer) return;

    let rafId: number | null = null;

    const updateRange = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const scrollTop = scrollContainer.scrollTop;
        const viewportHeight = scrollContainer.clientHeight;
        const codeContainer = document.getElementById('code-container');
        const containerOffset = codeContainer ? codeContainer.offsetTop : 0;
        const codeOffset = containerOffset + 30; // .code-container padding-top
        const adjustedScrollTop = Math.max(0, scrollTop - codeOffset);
        const start = Math.max(0, Math.floor(adjustedScrollTop / LINE_HEIGHT) - OVERSCAN);
        const end = Math.min(
          lines.length - 1,
          Math.ceil((adjustedScrollTop + viewportHeight) / LINE_HEIGHT) + OVERSCAN,
        );
        setVisibleRange((prev) => {
          if (prev.start === start && prev.end === end) return prev;
          return { start, end };
        });
      });
    };

    updateRange();
    scrollContainer.addEventListener('scroll', updateRange, { passive: true });
    const ro = new ResizeObserver(updateRange);
    ro.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener('scroll', updateRange);
      ro.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [wordWrap, lines.length, LINE_HEIGHT]);

  // Refs for the keydown handler to avoid stale closures without re-attaching on every render
  const cursorRef = React.useRef(cursor);
  cursorRef.current = cursor;
  const addNewCommentRef = React.useRef(
    async (_startLine: number, _endLine: number, _startChar: number, _endChar: number) => {},
  );
  const handleCursorChangeRef = React.useRef(handleCursorChange);

  // Helper to calculate new positions based on drag event
  const calculateNewCommentPosition = (
    e: React.DragEvent,
    type: string,
    comment: CommentType,
  ): {
    startLine: number;
    endLine: number;
    startChar: number;
    endChar: number;
  } | null => {
    const targetLine = getLineNumberFromNode(e.target as Node);
    if (targetLine === null) return null;

    let targetChar = 0;
    if ('caretRangeFromPoint' in document) {
      const range = (
        document as unknown as { caretRangeFromPoint: (x: number, y: number) => Range }
      ).caretRangeFromPoint(e.clientX, e.clientY);
      if (range) {
        const lineElement = document.getElementById(`line-${targetLine}`);
        if (lineElement) {
          targetChar = CodePanelHighlighting.getSelectionOffsetRelativeToParent(
            lineElement,
            range.startContainer,
            POSITION.Start,
            range.startOffset,
          );
        }
      }
    }
    if (targetChar < 0) targetChar = 0;

    let newStartLine = comment.startLine!;
    let newEndLine = comment.endLine!;
    let newStartChar = comment.startChar!;
    let newEndChar = comment.endChar!;

    if (type === 'COMMENT_MOVE') {
      const lineDiff = targetLine - comment.startLine!;
      newStartLine = comment.startLine! + lineDiff;
      newEndLine = comment.endLine! + lineDiff;
      const charLen = comment.endChar! - comment.startChar!;
      newStartChar = targetChar;
      newEndChar = targetChar + charLen;
    }

    // Validation
    const isBefore = newStartLine < newEndLine || (newStartLine === newEndLine && newStartChar <= newEndChar);
    if (!isBefore) return null;

    return { startLine: newStartLine, endLine: newEndLine, startChar: newStartChar, endChar: newEndChar };
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggingCommentId || !draggingType) return;

    const comment = contextComments.find((c) => c.id === draggingCommentId);
    if (!comment) return;

    const result = calculateNewCommentPosition(e, draggingType, comment);
    if (result) {
      setPreviewComment({
        ...comment,
        startLine: result.startLine,
        endLine: result.endLine,
        startChar: result.startChar,
        endChar: result.endChar,
      });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPreviewComment(null); // Clear preview

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (!props.onUpdateCommentLocation || !data.id) return;

      const comment = contextComments.find((c) => c.id === data.id);
      if (!comment) return;

      const result = calculateNewCommentPosition(e, data.type, comment);
      if (result) {
        props.onUpdateCommentLocation(data.id, result.startLine, result.endLine, result.startChar, result.endChar);
      }
    } catch {
      // Ignore
    }
  };

  // A cursorComment is a pseudo-comment with ID === 0 or Number.MAX_SAFE_INTEGER
  const cursorComment = {
    ...cursor,
    id: cursor.lead === 'back' ? 0 : Number.MAX_SAFE_INTEGER,
    file: props.file.id ?? 0,
    pointDelta: 0.0,
    text: '',
    rubricComment: null,
    author: props.user,
    feedback: 0,
    color: '',
  };

  const addNewComment = async (startLine: number, endLine: number, startChar: number, endChar: number) => {
    const newComment: CommentType = {
      startLine,
      endLine,
      startChar,
      endChar,
      id: props.commentCounter,
      file: props.file.id ?? 0,
      pointDelta: 0.0,
      text: '',
      rubricComment: null,
      author: props.user,
      feedback: 0,
      color: '',
    };

    props.addComment(newComment, props.file);
    props.updateCursorDomain(CURSOR_DOMAIN.CODE_HIDDEN);

    // FIXME: we can come up with a better solution
    await wait(5);

    setHoveredCommentId(newComment.id);
    scrollHighlightIntoView(newComment.id, { lineNumber: startLine });
  };

  // Keep refs in sync (after addNewComment is defined)
  addNewCommentRef.current = addNewComment;
  handleCursorChangeRef.current = handleCursorChange;

  // Handle code scrolling
  const handleVerticalScroll = (codeScrollArea: HTMLElement | null, _cursor: ICursorType) => {
    if (!codeScrollArea) {
      return;
    }

    const cursorTop = _cursor.startLine * CodePanelSizing.pixelsPerLine();
    const cursorBottom = cursorTop + (_cursor.endLine - _cursor.startLine) * CodePanelSizing.pixelsPerLine();

    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    if (cursorTop < codeScrollArea.scrollTop) {
      setTimeout(() => {
        codeScrollArea.scrollTop = cursorTop;
      });
    } else if (cursorBottom - codeScrollArea.scrollTop > windowHeight - 170) {
      setTimeout(() => {
        codeScrollArea.scrollTop = cursorBottom - windowHeight + 170;
      });
    }
  };

  const handleHorizontalScroll = (c: ICursorType) => {
    const codeMain = document.getElementById('code-main');
    if (codeMain !== null) {
      const leadHorizontalPosition = c.lead === 'front' ? 9.2 * c.endChar : 9.2 * c.startChar;
      if (leadHorizontalPosition > codeMain.offsetWidth + codeMain.scrollLeft) {
        const maxScrollLeft = codeMain.scrollWidth - codeMain.clientWidth;
        codeMain.scrollLeft = Math.min(maxScrollLeft, leadHorizontalPosition + 10);
      } else if (leadHorizontalPosition < codeMain.scrollLeft) {
        codeMain.scrollLeft = 0;
      }
    }
  };

  React.useEffect(() => {
    const code = lines;
    const codeScrollArea = document.getElementById('code-scroll-area');

    const handleKeydown = async (e: KeyboardEvent) => {
      if (props.cursorMode) {
        const triggerKey = getOsTriggerKeyFromEvent(e);
        const currentCursor = cursorRef.current;
        if (props.showCursor === CURSOR_DOMAIN.CODE && codeScrollArea !== null) {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            await addNewCommentRef.current(
              currentCursor.startLine,
              currentCursor.endLine,
              currentCursor.startChar,
              currentCursor.endChar,
            );
            props.updateCursorDomain(CURSOR_DOMAIN.CODE_HIDDEN);
          }

          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
            let newCursor = currentCursor;

            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Escape') {
              newCursor = currentCursor.lead === 'front' ? front(currentCursor) : back(currentCursor);
            } else if (e.shiftKey && e.key === 'ArrowLeft') {
              newCursor = shiftLeft(code, currentCursor, e.altKey, triggerKey);
              handleHorizontalScroll(newCursor);
            } else if (e.shiftKey && e.key === 'ArrowRight') {
              newCursor = shiftRight(code, currentCursor, e.altKey, triggerKey);
              handleHorizontalScroll(newCursor);
            } else if (e.shiftKey && e.key === 'ArrowUp') {
              newCursor = shiftUp(code, currentCursor);
              handleVerticalScroll(codeScrollArea, newCursor);
            } else if (e.shiftKey && e.key === 'ArrowDown') {
              newCursor = shiftDown(code, currentCursor);
              handleVerticalScroll(codeScrollArea, newCursor);
            } else if (e.key === 'ArrowLeft') {
              newCursor = left(code, currentCursor, e.altKey);
              handleHorizontalScroll(newCursor);
            } else if (e.key === 'ArrowRight') {
              newCursor = right(code, currentCursor, e.altKey);
              handleHorizontalScroll(newCursor);
            } else if (e.key === 'ArrowUp') {
              newCursor = up(code, currentCursor);
              handleVerticalScroll(codeScrollArea, newCursor);
            } else if (e.key === 'ArrowDown') {
              newCursor = down(code, currentCursor);
              handleVerticalScroll(codeScrollArea, newCursor);
            }

            handleCursorChangeRef.current(newCursor);
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.file, props.cursorMode, props.showCursor, props.updateCursorDomain, lines]);

  // Helper function to find line number by walking up DOM tree
  const getLineNumberFromNode = (node: Node | null): number | null => {
    if (!node) return null;

    let currentNode: Node | null = node;

    // Walk up the DOM tree until we find an element with line-N id
    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        const id = element.id;

        if (id && id.startsWith('line-')) {
          const lineNum = parseInt(id.split('-')[1], 10);
          if (!isNaN(lineNum) && lineNum >= 0) {
            return lineNum;
          }
        }
      }
      currentNode = currentNode.parentNode;
    }

    return null;
  };

  const onMouseUp = async (_: MouseEvent | React.MouseEvent<HTMLDivElement>) => {
    try {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;

      // IMMEDIATELY capture selection data before any async operations
      // This prevents race conditions where selection is cleared before we process it
      const selectionData = {
        selectedText: selection?.toString() ?? '',
        anchorNode: selection?.anchorNode ?? null,
        focusNode: selection?.focusNode ?? null,
        anchorOffset: selection?.anchorOffset ?? 0,
        focusOffset: selection?.focusOffset ?? 0,
        rangeCount: selection?.rangeCount ?? 0,
        startContainer: range?.startContainer ?? null,
        endContainer: range?.endContainer ?? null,
        startOffset: range?.startOffset ?? 0,
        endOffset: range?.endOffset ?? 0,
      };

      // Early validation checks
      if (
        !selectionData.anchorNode ||
        !selectionData.focusNode ||
        selectionData.selectedText.trim() === '' ||
        selectionData.startContainer === null ||
        selectionData.endContainer === null ||
        selectionData.rangeCount === 0
      ) {
        return;
      }

      // Find line numbers using improved DOM traversal
      let startLine = getLineNumberFromNode(selectionData.startContainer);
      let endLine = getLineNumberFromNode(selectionData.endContainer);

      // Validate line numbers were found
      if (startLine === null || endLine === null) {
        console.warn('[Comment Selection] Could not determine line numbers from selection');
        return;
      }

      let startNode = selectionData.startContainer;
      let endNode = selectionData.endContainer;
      let startOffset = selectionData.startOffset;
      let endOffset = selectionData.endOffset;

      // Normalize line order (handle backwards selection)
      if (startLine > endLine) {
        [startLine, endLine] = [endLine, startLine];
        [startNode, endNode] = [endNode, startNode];
        [startOffset, endOffset] = [endOffset, startOffset];
      }

      // Get the line elements for character offset calculation
      const startLineEl = document.querySelector(`div#line-${startLine}`);
      const endLineEl = document.querySelector(`div#line-${endLine}`);

      if (!startLineEl || !endLineEl) {
        console.warn('[Comment Selection] Could not find line elements', { startLine, endLine });
        return;
      }

      if (!startNode || !endNode) {
        console.warn('[Comment Selection] Could not resolve selection nodes', { startNode, endNode });
        return;
      }

      // Calculate character offsets using selection data
      // Use the more reliable getSelectionOffsetRelativeToParent but with captured data
      let startChar = CodePanelHighlighting.getSelectionOffsetRelativeToParent(
        startLineEl,
        startNode,
        POSITION.Start,
        startOffset,
      );
      let endChar = CodePanelHighlighting.getSelectionOffsetRelativeToParent(
        endLineEl,
        endNode,
        POSITION.End,
        endOffset,
      );

      // Handle single-line selection with reverse highlighting
      if (startLine === endLine && startChar > endChar) {
        [startChar, endChar] = [endChar, startChar];
      }

      // Final validation
      if (
        isNaN(startLine) ||
        startLine < 0 ||
        isNaN(endLine) ||
        endLine < 0 ||
        isNaN(startChar) ||
        startChar < 0 ||
        isNaN(endChar) ||
        endChar < 0
      ) {
        console.warn('[Comment Selection] Invalid position values', {
          startLine,
          endLine,
          startChar,
          endChar,
        });
        return;
      }

      // Log successful selection for debugging
      console.log('[Comment Selection] Success, calling addNewComment');

      // Feature: Highlight to Move
      // If a comment is currently focused, move it instead of creating a new one
      if (focusedCommentId !== undefined && focusedCommentId !== 0 && focusedCommentId !== Number.MAX_SAFE_INTEGER) {
        const focusedComment = contextComments.find((c) => c.id === focusedCommentId);
        if (focusedComment && props.onUpdateCommentLocation) {
          props.onUpdateCommentLocation(focusedCommentId, startLine, endLine, startChar, endChar);
          // Clear selection to indicate action taken
          selection?.removeAllRanges();
          return;
        }
      }

      await addNewComment(startLine, endLine, startChar, endChar);
    } catch (error) {
      console.error('[Comment Selection Error]', error, {
        selection: window.getSelection()?.toString(),
        anchorNode: window.getSelection()?.anchorNode,
        focusNode: window.getSelection()?.focusNode,
      });
    }
  };

  const onLineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const idParts = element.id.split('-');

    if (idParts.length < 2) {
      return;
    }
    const lineNumber = Number(idParts[1]);
    const textContent = element.textContent ?? '';
    const lineLength = textContent.length;

    const startChar = textContent.search(/\S/);

    const newCursor = {
      startChar: startChar === -1 ? 0 : startChar,
      endChar: lineLength,
      startLine: lineNumber,
      endLine: lineNumber,
      lead: 'front' as LeadPosition,
    };

    handleCursorChange(newCursor);
  };

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const callback = () => {
      onMouseUp(event);
      document.removeEventListener('mouseup', callback);
    };

    document.addEventListener('mouseup', callback);
  };

  const onHoverEnter = React.useCallback(
    (commentId: number) => {
      setHoveredCommentId(commentId);
    },
    [setHoveredCommentId],
  );

  const onHoverLeave = React.useCallback(
    (_: number) => {
      setHoveredCommentId(null);
    },
    [setHoveredCommentId],
  );

  // Merge cursor into comments
  let comments = contextComments;
  if (!props.readOnly && props.cursorMode && props.showCursor === CURSOR_DOMAIN.CODE) {
    const cursorInsertIndex = CommentIO.sortedIndex(contextComments, cursorComment);
    comments = [
      ...contextComments.slice(0, cursorInsertIndex),
      cursorComment,
      ...contextComments.slice(cursorInsertIndex),
    ];
  }

  // Windowed rendering: render only visible lines + spacers for off-screen lines.
  // In word-wrap mode, render all lines (line heights are variable).
  const renderLines = () => {
    const result: React.ReactNode[] = [];
    // Clamp range to current file length (protects against stale range during file switch)
    const start = Math.max(0, Math.min(visibleRange.start, lines.length - 1));
    const end = Math.min(visibleRange.end, lines.length - 1);

    const useWindowing = !wordWrap && lines.length > 0;
    const renderStart = useWindowing ? start : 0;
    const renderEnd = useWindowing ? end : lines.length - 1;

    // Top spacer for lines above visible range
    if (useWindowing && renderStart > 0) {
      result.push(<div key="spacer-top" style={{ height: renderStart * LINE_HEIGHT }} />);
    }

    for (let i = renderStart; i <= renderEnd; i++) {
      const text = lines[i];
      const t = text === '' ? ' ' : text;

      if (props.readOnly) {
        result.push(
          <div key={i} id={`line-${i}`}>
            {CodePanelHighlighting.highlight(
              comments,
              t,
              i,
              props.readOnly,
              consoleTheme.highlight,
              contextOnHighlightClick,
              onHoverEnter,
              onHoverLeave,
            )}
          </div>,
        );
      } else {
        result.push(
          <div
            key={i}
            id={`line-${i}`}
            onClick={onLineClick}
            onMouseDown={onMouseDown}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            {CodePanelHighlighting.highlight(
              comments,
              t,
              i,
              props.readOnly,
              consoleTheme.highlight,
              contextOnHighlightClick,
              onHoverEnter,
              onHoverLeave,
            )}
          </div>,
        );
      }
    }

    // Bottom spacer for lines below visible range
    if (useWindowing && renderEnd < lines.length - 1) {
      result.push(<div key="spacer-bottom" style={{ height: (lines.length - 1 - renderEnd) * LINE_HEIGHT }} />);
    }

    return result;
  };

  return <div>{renderLines()}</div>;
};

export default Code;
