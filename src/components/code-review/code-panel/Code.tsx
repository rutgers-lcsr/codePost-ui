import * as React from 'react';

import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';

import CodePanelHighlighting from './CodePanelHighlighting';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { CommentType } from '../../../infrastructure/comment';

import { POSITION } from '../../../types/common';

import { wait } from '../../../infrastructure/animation';

interface ICodeProps {
  commentCounter: number;
  showCursor: boolean;
  cursorIndex: number;
  cursorExtent: number;
}

const Code = (props: ICodeContentCoreProps & ICodeContentEditProps & ICodeProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const onMouseUp = async (event: React.MouseEvent) => {
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
      // @ts-ignore
      selection.anchorNode.id.includes('line')
    ) {
      // @ts-ignore
      startLine = selection.anchorNode.id.split('-')[1];
    } else {
      const anchorParent: any = selection.anchorNode.parentNode;
      startLine = +anchorParent.id.split('-')[1];
    }

    let endLine;
    if (
      // This selection ended on top of the code but outside of a text highlight
      // The Node is an HTMLElement
      selection.focusNode &&
      selection.focusNode.nodeName === 'DIV' &&
      // @ts-ignore
      selection.focusNode.id.includes('line')
    ) {
      // @ts-ignore
      endLine = selection.focusNode.id.split('-')[1];
    } else {
      const focusParent: any = selection.focusNode.parentNode;
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

    const newComment: CommentType = {
      id: props.commentCounter,
      endChar,
      endLine,
      file: props.file.id,
      pointDelta: 0.0,
      startChar,
      startLine,
      text: '',
      rubricComment: null,
      author: props.user,
      feedback: 0,
    };

    props.addComment(newComment, props.file);

    // FIXME: we can come up with a better solution
    await wait(5);

    CodePanelHighlighting.brightenHighlight(newComment.id, consoleTheme.highlightActive);
  };

  const onMouseDown = (event: React.MouseEvent) => {
    const callback = () => {
      onMouseUp(event);
      document.removeEventListener('mouseup', callback);
    };

    document.addEventListener('mouseup', callback);
  };

  console.log('> ', props.cursorIndex, props.cursorExtent);

  const linesOfCode = (readOnly: boolean, code: string, comments: CommentType[]) => {
    return code.split('\n').map((text: string, i: number) => {
      const style =
        props.showCursor && i >= props.cursorIndex && i < props.cursorIndex + props.cursorExtent
          ? {
              backgroundColor: 'lightblue',
              opacity: 0.2,
            }
          : {};
      return (
        <div key={i} id={`line-${i}`} onMouseDown={readOnly ? undefined : onMouseDown} style={style}>
          {text === ''
            ? ' '
            : CodePanelHighlighting.highlight(
                comments,
                text,
                i,
                readOnly,
                consoleTheme.highlight,
                props.onHighlightClick,
              )}
        </div>
      );
    });
  };
  return <div>{linesOfCode(props.readOnly, props.file.code, props.comments)}</div>;
};

export default Code;
