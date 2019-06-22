import * as React from 'react';

import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';

import CodePanelHighlighting from './CodePanelHighlighting';

import { CommentType } from '../../../infrastructure/comment';

import { POSITION } from '../../../types/common';

interface ICodeProps {
  commentCounter: number;
}

const Code = (props: ICodeContentCoreProps & ICodeContentEditProps & ICodeProps) => {
  const onMouseUp = (event: React.MouseEvent) => {
    const selection = window.getSelection();

    if (selection.toString() === '') {
      return;
    }

    // Hack to avoid messing with Node type checking
    const anchorParent: any = selection.anchorNode.parentNode;
    let startLine = +anchorParent.id.split('-')[1];

    const extentParent: any = selection.extentNode.parentNode;
    let endLine = +extentParent.id.split('-')[1];

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
    };

    props.addComment(newComment, props.file);
  };

  const linesOfCode = (readOnly: boolean, code: string, comments: CommentType[]) => {
    return code.split('\n').map((item: string, i: number) => {
      return (
        <div key={i} id={`line-${i}`} onMouseUp={readOnly ? undefined : onMouseUp}>
          {item === '' ? ' ' : CodePanelHighlighting.highlight(comments, item, i)}
        </div>
      );
    });
  };
  return <div>{linesOfCode(props.readOnly, props.file.code, props.comments)}</div>;
};

export default Code;
