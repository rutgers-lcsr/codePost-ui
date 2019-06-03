import * as React from 'react';

// import SyntaxHighlighter from 'react-syntax-highlighter';
// import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

// import CommentList from './CommentList';

import CodePanelUtils from './CodePanelUtils';

import { POSITION } from '../../types/common';

import { CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';
// import { AnonymousSubmissionType } from '../../infrastructure/submission';

// import LangMap from 'lang-map';

interface ICodeProps {
  // submission: AnonymousSubmissionType;
  file: FileType;
  comments: CommentType[];
  // rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  // giving a partial comment breaks the IComment type constraint, could make some fields optional?
  addComment: (comment: CommentType, file: FileType) => boolean;

  // activeCommentId?: number;
  // changeActive: (id: number | number) => void;
  // deleteComment: (comment: CommentType, file: FileType) => void;
  // updateComment: (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean) => boolean;
  // updateSubmissionGrade: () => void;
  // unsavedComments: number[];
}

const Code = (props: ICodeProps) => {
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

  // public render() {
  // const {
  //   file,
  //   readOnly,
  //   comments,
  //   changeActive,
  //   rubricComments,
  //   activeCommentId,
  //   deleteComment,
  //   updateComment,
  // } = this.props;

  // const linesOfCode = this.linesOfCode(this.props.readOnly, this.props.file.code, this.props.comments);

  // const numberOfLines = linesOfCode.length;
  // const lineHeight = document.querySelector('div#line-0')
  //   ? document.querySelector('div#line-0')!.getBoundingClientRect().height
  //   : 18; // 18 as estimate
  // const boxPaddingAndBorder = 15;

  // const codeHeight = numberOfLines * lineHeight + boxPaddingAndBorder;

  // const lineNumberStyle = {
  //   height: `${codeHeight - boxPaddingAndBorder}px`,
  // };

  // const commentPanelStyle = {
  //   height: `${codeHeight}px`,
  // };

  // CodePanelUtils.updateCommentPanelHeight(codeHeight);

  // const codeString = this.props.file.code;

  // const extensionMatch = /^(?:\.?)(.*)/;
  // const extension = extensionMatch.exec(this.props.file.extension)![1];
  // const language = LangMap.languages(extension)[0];

  // return linesOfCode;

  // return (
  //   <div id="scroll-container" className="grade__main-container__right-panel__scroll-container">
  //     <div className="grade__main-container__tab-content">
  //       <div className="grade__main-container__tab-content__code-panel">
  //         <div className="code__highlighted-area">
  //           <div id={`syntax-highlighter-${this.props.file.id}`} className="code__syntax-highlighter">
  //             <SyntaxHighlighter language={language} style={googlecode} showLineNumbers={true} wrapLines={false}>
  //               {codeString}
  //             </SyntaxHighlighter>
  //           </div>
  //           <div className="code__underlay">
  //             <div id={`code-underlay-pre-${this.props.file.id}`} className="code__underlay__pre">
  //               <div className="code__underlay--line-numbers" style={lineNumberStyle}>
  //                 {numberOfLines}
  //               </div>
  //               <div className="code__underlay--code">{linesOfCode}</div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //       <div
  //         id={`comment-panel-${this.props.file.id}`}
  //         className="grade__main-container__tab-content__comment-panel"
  //         style={commentPanelStyle}
  //       >
  //         <CommentList
  //           file={file}
  //           readOnly={readOnly}
  //           comments={comments}
  //           rubricComments={rubricComments}
  //           activeCommentId={activeCommentId}
  //           changeActive={changeActive}
  //           deleteComment={deleteComment}
  //           updateComment={updateComment}
  //           updateSubmissionGrade={this.props.updateSubmissionGrade}
  //           unsavedComments={this.props.unsavedComments}
  //         />
  //       </div>
  //     </div>
  //   </div>
  // );
};
// }
export default Code;
