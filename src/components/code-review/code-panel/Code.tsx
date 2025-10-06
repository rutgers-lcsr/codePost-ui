import * as React from 'react';

import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';

import CodePanelHighlighting from './CodePanelHighlighting';
import CodePanelSizing from './CodePanelSizing';

import { getOperatingSystem, OS } from '../../core/operatingSystem';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { CommentIO, CommentType } from '../../../infrastructure/comment';

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

const Code = (props: ICodeContentCoreProps & ICodeContentEditProps & ICodeProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

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

    CodePanelHighlighting.brightenHighlight(newComment.id);
  };

  // Handle code scrolling
  const handleVerticalScroll = (codeScrollArea: any, _cursor: ICursorType) => {
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
    const code = props.file.code.split('\n');
    const codeScrollArea = document.getElementById('code-scroll-area');

    const handleKeydown = async (e: any) => {
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

  const onMouseUp = async (_: React.MouseEvent) => {
    const selection = window.getSelection();
    // https://developer.mozilla.org/en-US/docs/Web/API/Selection/isCollapsed
    // selection.isCollapsed
    if (
      selection === null ||
      selection.toString() === '' ||
      selection.anchorNode === null ||
      selection.focusNode === null
    ) {
      return;
    }

    let startLine;
    if (
      // This selection ended on top of the code but outside of a text highlight
      // The Node is an HTMLElement
      selection.anchorNode &&
      selection.anchorNode.nodeName === 'DIV' &&
      (selection.anchorNode as HTMLElement).id.includes('line')
    ) {
      startLine = +(selection.anchorNode as HTMLElement).id.split('-')[1];
    } else {
      const anchorParent = selection.anchorNode.parentNode as HTMLElement;
      startLine = +anchorParent?.id.split('-')[1];
    }

    let endLine;
    if (
      // This selection ended on top of the code but outside of a text highlight
      // The Node is an HTMLElement
      selection.focusNode &&
      selection.focusNode.nodeName === 'DIV' &&
      (selection.focusNode as HTMLElement).id.includes('line')
    ) {
      endLine = +(selection.focusNode as HTMLElement).id.split('-')[1];
    } else {
      const focusParent = selection.focusNode.parentNode as HTMLElement;
      endLine = +focusParent.id.split('-')[1];
    }

    // Check to see if the comment was made backwards
    if (startLine !== null && endLine != null && startLine > endLine) {
      // swap endlines
      const temp1 = startLine;
      startLine = endLine;
      endLine = temp1;
    }

    let startChar = CodePanelHighlighting.getSelectionOffsetRelativeToParent(
      document.querySelector(`div#line-${startLine}`),
      null,
      POSITION.Start,
    );
    let endChar = CodePanelHighlighting.getSelectionOffsetRelativeToParent(
      document.querySelector(`div#line-${endLine}`),
      null,
      POSITION.End,
    );

    if (startLine === endLine) {
      // Handle reverse highlight in a single line
      const temp1 = startChar;
      const temp2 = endChar;
      startChar = temp1 < temp2 ? temp1 : temp2;
      endChar = temp1 < temp2 ? temp2 : temp1;
    }

    // Catch all to prevent errors
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
      return;
    }

    await addNewComment(startLine, endLine, startChar, endChar);
  };

  const onLineClick = (e: any) => {
    if (e.target.id.split('-').length < 2) {
      return;
    }
    const lineNumber = +e.target.id.split('-')[1];
    const lineLength = e.target.textContent.length;

    const startChar = e.target.textContent.search(/\S/);

    const newCursor = {
      startChar: startChar === -1 ? 0 : startChar,
      endChar: lineLength,
      startLine: lineNumber,
      endLine: lineNumber,
      lead: 'front' as LeadPosition,
    };

    setCursor(newCursor);
  };

  const onMouseDown = (event: any) => {
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
            {CodePanelHighlighting.highlight(comments, t, i, readOnly, consoleTheme.highlight, props.onHighlightClick)}
          </div>
        );
      }

      return (
        <div key={i} id={`line-${i}`} onClick={onLineClick} onMouseDown={onMouseDown}>
          {CodePanelHighlighting.highlight(comments, t, i, readOnly, consoleTheme.highlight, props.onHighlightClick)}
        </div>
      );
    });
  };

  let comments = props.comments;
  if (!props.readOnly && props.cursorMode && props.showCursor === CURSOR_DOMAIN.CODE) {
    const cursorInsertIndex = CommentIO.sortedIndex(props.comments, cursorComment);
    comments = [
      ...props.comments.slice(0, cursorInsertIndex),
      cursorComment,
      ...props.comments.slice(cursorInsertIndex),
    ];
  }

  return <div>{linesOfCode(props.readOnly, props.file.code, comments)}</div>;
};

export default Code;
