import * as React from 'react';

import CodePanelUtils from './CodePanelUtils';

import { POSITION } from '../../types/common';

import { CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';
// import { AnonymousSubmissionType } from '../../infrastructure/submission';

interface ICodeCoreProps {
  // submission: AnonymousSubmissionType;
  file: FileType;
  comments: CommentType[];
  readOnly: boolean;
  user: string;
}

interface ICodeEditProps {
  addComment: (comment: CommentType, file: FileType) => void;
}

const Code = (props: ICodeCoreProps & ICodeEditProps) => {
  const [commentCounter, setCommentCounter] = React.useState(-1);

  const onMouseUp = (event: any) => {
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

    let startChar = CodePanelUtils.getSelectionOffsetRelativeToParent(
      document.querySelector(`div#line-${startLine}`),
      null,
      POSITION.Start,
    );
    let endChar = CodePanelUtils.getSelectionOffsetRelativeToParent(
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
      id: commentCounter,
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

    setCommentCounter(commentCounter - 1);

    props.addComment(newComment, props.file);
  };

  const linesOfCode = (readOnly: boolean, code: string, comments: CommentType[]) => {
    return code.split('\n').map((item: string, i: number) => {
      return (
        <div key={i} id={`line-${i}`} onMouseUp={readOnly ? undefined : onMouseUp}>
          {item === '' ? ' ' : CodePanelUtils.highlight(comments, item, i)}
        </div>
      );
    });
  };

  return <div>{linesOfCode(props.readOnly, props.file.code, props.comments)}</div>;
};

const makeReadOnly = (Component: React.ComponentType<ICodeCoreProps & ICodeEditProps>) => {
  return class WrappedComponent extends React.Component<ICodeCoreProps, {}> {
    public addComment = (comment: CommentType, file: FileType) => {
      return;
    };

    public render() {
      return <Component {...this.props as ICodeCoreProps} addComment={this.addComment} />;
    }
  };
};

export const GradeCode = Code;
export const StudentCode = makeReadOnly(Code);

export default Code;
