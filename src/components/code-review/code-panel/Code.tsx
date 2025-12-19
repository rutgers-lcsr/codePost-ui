import * as React from 'react';

import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';

import CodePanelHighlighting from './CodePanelHighlighting';
import CodePanelSizing from './CodePanelSizing';

import { getOperatingSystem, OS } from '../../core/operatingSystem';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { CommentIO, CommentType } from '../../../infrastructure/comment';

import { scrollHighlightIntoView, useCommentHighlightStore } from './CommentHighlightContext';

import { getFileContent } from '../../../infrastructure/file';

import { POSITION } from '../../../types/common';

import { wait } from '../../../infrastructure/animation';

import { CURSOR_DOMAIN } from '../CodeConsoleEnums';

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
}

// Code component no longer needs comments in props - gets from CommentHighlightContext
type CodePropsWithoutComments = Omit<ICodeContentCoreProps, 'comments'> & ICodeContentEditProps & ICodeProps;

const Code = (props: CodePropsWithoutComments) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const {
    comments: contextComments,
    setHoveredCommentId,
    onHighlightClick: contextOnHighlightClick,
  } = useCommentHighlightStore();

  const [cursor, setCursor] = React.useState<ICursorType>({
    startChar: 0,
    endChar: 1,
    startLine: 0,
    endLine: 0,
    lead: 'front',
  });

  // A cursorComment is a pseudo-comment with ID === 0 or Number.MAX_SAFE_INTEGER
  const cursorComment = {
    ...cursor,
    id: cursor.lead === 'back' ? 0 : Number.MAX_SAFE_INTEGER,
    file: props.file.id,
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
      file: props.file.id,
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
    scrollHighlightIntoView(newComment.id);
  };

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
    const code = getFileContent(props.file).split('\n');
    const codeScrollArea = document.getElementById('code-scroll-area');

    const handleKeydown = async (e: KeyboardEvent) => {
      if (props.cursorMode) {
        const os = getOperatingSystem();
        const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;
        if (props.showCursor === CURSOR_DOMAIN.CODE && codeScrollArea !== null) {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            await addNewComment(cursor.startLine, cursor.endLine, cursor.startChar, cursor.endChar);
            props.updateCursorDomain(CURSOR_DOMAIN.CODE_HIDDEN);
          }

          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
            let newCursor = cursor;

            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Escape') {
              newCursor = cursor.lead === 'front' ? front(cursor) : back(cursor);
            } else if (e.shiftKey && e.key === 'ArrowLeft') {
              newCursor = shiftLeft(code, cursor, e.altKey, triggerKey);
              handleHorizontalScroll(newCursor);
            } else if (e.shiftKey && e.key === 'ArrowRight') {
              newCursor = shiftRight(code, cursor, e.altKey, triggerKey);
              handleHorizontalScroll(newCursor);
            } else if (e.shiftKey && e.key === 'ArrowUp') {
              newCursor = shiftUp(code, cursor);
              handleVerticalScroll(codeScrollArea, newCursor);
            } else if (e.shiftKey && e.key === 'ArrowDown') {
              newCursor = shiftDown(code, cursor);
              handleVerticalScroll(codeScrollArea, newCursor);
            } else if (e.key === 'ArrowLeft') {
              newCursor = left(code, cursor, e.altKey);
              handleHorizontalScroll(newCursor);
            } else if (e.key === 'ArrowRight') {
              newCursor = right(code, cursor, e.altKey);
              handleHorizontalScroll(newCursor);
            } else if (e.key === 'ArrowUp') {
              newCursor = up(code, cursor);
              handleVerticalScroll(codeScrollArea, newCursor);
            } else if (e.key === 'ArrowDown') {
              newCursor = down(code, cursor);
              handleVerticalScroll(codeScrollArea, newCursor);
            }

            setCursor(newCursor);
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

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

  const onMouseUp = async (_: any) => {
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

    setCursor(newCursor);
  };

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const callback = () => {
      onMouseUp(event);
      document.removeEventListener('mouseup', callback);
    };

    document.addEventListener('mouseup', callback);
  };

  const linesOfCode = (readOnly: boolean, code: string, comments: CommentType[]) => {
    return code.split('\n').map((text: string, i: number) => {
      const t = text === '' ? ' ' : text;

      if (readOnly) {
        return (
          <div key={i} id={`line-${i}`}>
            {CodePanelHighlighting.highlight(comments, t, i, readOnly, consoleTheme.highlight, contextOnHighlightClick)}
          </div>
        );
      }

      return (
        <div key={i} id={`line-${i}`} onClick={onLineClick} onMouseDown={onMouseDown}>
          {CodePanelHighlighting.highlight(comments, t, i, readOnly, consoleTheme.highlight, contextOnHighlightClick)}
        </div>
      );
    });
  };

  // Use comments from context instead of props
  let comments = contextComments;
  if (!props.readOnly && props.cursorMode && props.showCursor === CURSOR_DOMAIN.CODE) {
    const cursorInsertIndex = CommentIO.sortedIndex(contextComments, cursorComment);
    comments = [
      ...contextComments.slice(0, cursorInsertIndex),
      cursorComment,
      ...contextComments.slice(cursorInsertIndex),
    ];
  }
  return <div>{linesOfCode(props.readOnly, getFileContent(props.file), comments)}</div>;
};

export default Code;
