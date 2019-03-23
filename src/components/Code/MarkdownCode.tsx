import * as React from 'react';

import MarkdownCommentList from './MarkdownCommentList';

import CodePanelUtils from './CodePanelUtils';

import ReactMarkdown from 'react-markdown';

import { ICommentToRubricCommentMap } from '../../types/common';

import { CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';
import { SubmissionType } from '../../infrastructure/submission';

interface IMarkdownCodeProps {
  submission: SubmissionType;
  file: FileType;
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  // giving a partial comment breaks the IComment type constraint, could make some fields optional?
  addComment: (comment: any, file: FileType) => boolean;
  commentCounter: number;
  updateCommentCounter: () => void;

  activeCommentId?: number;
  changeActive: (id: number | number) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean) => boolean;
  updateSubmissionGrade: () => void;
  unsavedComments: number[];
}

class MarkdownCode extends React.Component<IMarkdownCodeProps, {}> {
  public componentDidUpdate(prevProps: IMarkdownCodeProps, prevState: any) {
    if (prevProps.comments.length > this.props.comments.length) {
      this.forceUpdate();
    }
  }

  public onMouseUp = (event: any) => {
    const selection = window.getSelection();

    if (selection.toString() === '') {
      return;
    }

    console.log('onMouseUps');

    // // Hack to avoid messing with Node type checking
    // const anchorParent: any = selection.anchorNode.parentNode;
    // let startLine = +anchorParent.id.split("-")[1];

    // const extentParent: any = selection.extentNode.parentNode;
    // let endLine = +extentParent.id.split("-")[1];

    // // Check to see if the comment was made backwards
    // if (startLine !== null && endLine != null && startLine > endLine) {
    //   // swap endlines
    //   const temp1 = startLine;
    //   startLine = endLine;
    //   endLine = temp1;
    // }

    // let startChar = CodePanelUtils.getSelectionOffsetRelativeToParent(
    //   document.querySelector(`div#line-${startLine}`),
    //   null,
    //   POSITION.Start
    // );
    // let endChar = CodePanelUtils.getSelectionOffsetRelativeToParent(
    //   document.querySelector(`div#line-${endLine}`),
    //   null,
    //   POSITION.End
    // );

    // if (startLine === endLine) {
    //   // Handle reverse highlight in a single line
    //   const temp1 = startChar;
    //   const temp2 = endChar;
    //   startChar = temp1 < temp2 ? temp1 : temp2;
    //   endChar = temp1 < temp2 ? temp2 : temp1;
    // }

    // const newComment = {
    //   id: this.props.commentCounter,
    //   endChar,
    //   endLine,
    //   file: this.props.file.id,
    //   pointDelta: 0.0,
    //   startChar,
    //   startLine,
    //   text: ""
    // };

    // this.props.updateCommentCounter();
    // this.props.addComment(newComment, this.props.file);
  };

  // public linesOfCode = (
  //   readOnly: boolean,
  //   code: string,
  //   comments: CommentType[]
  // ) => {
  //   const splitCode = code.split("\n");

  //   if (readOnly) {
  //     return splitCode.map((item: string, i: number) => {
  //       // Don't skip rendering lines with no text
  //       if (item === "") {
  //         return (
  //           <div key={i} id={`line-${i}`}>
  //             &nbsp;
  //           </div>
  //         );
  //       }
  //       return (
  //         <div key={i} id={`line-${i}`}>
  //           {CodePanelUtils.highlight(comments, item, i)}
  //         </div>
  //       );
  //     });
  //   } else {
  //     return splitCode.map((item: string, i: number) => {
  //       // Don't skip rendering lines with no text
  //       if (item === "") {
  //         return (
  //           <div key={i} id={`line-${i}`} onMouseUp={this.onMouseUp}>
  //             &nbsp;
  //           </div>
  //         );
  //       }
  //       return (
  //         <div key={i} id={`line-${i}`} onMouseUp={this.onMouseUp}>
  //           {CodePanelUtils.highlight(comments, item, i)}
  //         </div>
  //       );
  //     });
  //   }
  // };

  public onBlockElementClick = (e: any) => {
    const index = e.currentTarget.getAttribute('index-number');
    if (index) {
      const newComment = {
        id: this.props.commentCounter,
        endChar: 0,
        endLine: +index,
        file: this.props.file.id,
        pointDelta: 0.0,
        startChar: 0,
        startLine: +index,
        text: '',
      };

      this.props.updateCommentCounter();
      this.props.addComment(newComment, this.props.file);
      e.currentTarget.className = 'markdown-code__block--commented';
    }
  };

  public blockContainsComment = (comments: CommentType[], index: number): boolean => {
    return (
      comments.filter((comment: CommentType) => {
        return comment.startLine === index;
      }).length > 0
    );
  };

  public rendererClassName = (comments: CommentType[], index: number): string => {
    let className = 'markdown-code__block--empty';
    if (this.blockContainsComment(comments, index)) {
      className = 'markdown-code__block--commented';
    }
    return className;
  };

  public headingRenderer = (props: any) => {
    return React.createElement(
      `h${props.level}`,
      {
        className: this.rendererClassName(this.props.comments, props.index),
        'index-number': props.index,
        onClick: this.onBlockElementClick,
        style: {},
      },
      props.children,
    );
  };

  public paragraphRenderer = (props: any) => {
    return (
      <p
        className={this.rendererClassName(this.props.comments, props.index)}
        index-number={props.index}
        onClick={this.onBlockElementClick}
        style={{}}
      >
        {props.children}
      </p>
    );
  };

  public listRenderer = (props: any) => {
    return React.createElement(
      props.ordered ? 'ol' : 'ul',
      {
        className: this.rendererClassName(this.props.comments, props.index),
        'index-number': props.index,
        onClick: this.onBlockElementClick,
      },
      props.children,
    );
  };

  public codeRenderer = (props: any) => {
    const className = props.language && `language-${props.language}`;
    const code = React.createElement('code', className ? { className } : null, props.value);
    return React.createElement(
      'pre',
      {
        className: this.rendererClassName(this.props.comments, props.index),
        'index-number': props.index,
        onClick: this.onBlockElementClick,
      },
      code,
    );
  };

  public thematicBreakRenderer = (props: any) => {
    return (
      <hr
        className={this.rendererClassName(this.props.comments, props.index)}
        index-number={props.index}
        onClick={this.onBlockElementClick}
      >
        {props.children}
      </hr>
    );
  };

  public blockQuoteRenderer = (props: any) => {
    return (
      <blockquote
        className={this.rendererClassName(this.props.comments, props.index)}
        index-number={props.index}
        onClick={this.onBlockElementClick}
      >
        {props.children}
      </blockquote>
    );
  };

  public render() {
    const {
      file,
      readOnly,
      comments,
      changeActive,
      rubricComments,
      activeCommentId,
      deleteComment,
      updateComment,
    } = this.props;

    const renderers = {
      paragraph: this.paragraphRenderer,
      heading: this.headingRenderer,
      list: this.listRenderer,
      code: this.codeRenderer,
      thematicBreak: this.thematicBreakRenderer,
      blockquote: this.blockQuoteRenderer,
    };

    // const linesOfCode = this.linesOfCode(
    //   this.props.readOnly,
    //   this.props.file.code,
    //   this.props.comments
    // );

    // const numberOfLines = linesOfCode.length;
    // const lineHeight = document.querySelector("div#line-0")
    //   ? document.querySelector("div#line-0")!.getBoundingClientRect().height
    //   : 18; // 18 as estimate
    // const boxPaddingAndBorder = 15;

    // const codeHeight = numberOfLines * lineHeight + boxPaddingAndBorder;

    // const lineNumberStyle = {
    //   height: `${codeHeight - boxPaddingAndBorder}px`
    // };

    const commentPanelStyle = {
      height: '400px',
    };

    CodePanelUtils.updateCommentPanelHeight(400);

    // const codeString = this.props.file.code;

    // const extensionMatch = /^(?:\.?)(.*)/;
    // const extension = extensionMatch.exec(this.props.file.extension)![1];
    // const language = LangMap.languages(extension)[0];

    const markdown = this.props.file.code;

    return (
      <div id="scroll-container" className="grade__main-container__right-panel__scroll-container">
        <div className="grade__main-container__tab-content">
          <div className="grade__main-container__tab-content__code-panel">
            <div className="code__highlighted-area">
              <div
                id={`syntax-highlighter-${this.props.file.id}`}
                className="code__syntax-highlighter"
                style={{ cursor: 'pointer' }}
              >
                <ReactMarkdown includeNodeIndex={true} sourcePos={true} renderers={renderers}>
                  {markdown}
                </ReactMarkdown>
              </div>
              {/* <div className="code__underlay">
                <div id={`code-underlay-pre-${this.props.file.id}`} className="code__underlay__pre">
                  <div className="code__underlay--line-numbers">1</div>
                  <div className="code__underlay--code">{markdown}</div>
                </div>
              </div> */}
            </div>
          </div>
          <div
            id={`comment-panel-${this.props.file.id}`}
            className="grade__main-container__tab-content__comment-panel"
            style={commentPanelStyle}
          >
            <MarkdownCommentList
              file={file}
              readOnly={readOnly}
              comments={comments}
              rubricComments={rubricComments}
              activeCommentId={activeCommentId}
              changeActive={changeActive}
              deleteComment={deleteComment}
              updateComment={updateComment}
              updateSubmissionGrade={this.props.updateSubmissionGrade}
              unsavedComments={this.props.unsavedComments}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default MarkdownCode;
