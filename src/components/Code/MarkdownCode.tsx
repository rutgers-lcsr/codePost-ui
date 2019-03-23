import * as React from 'react';

import CommentList from './CommentList';

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
  markdown: string;
}

class MarkdownCode extends React.Component<IMarkdownCodeProps, {}> {
  public componentDidUpdate(prevProps: IMarkdownCodeProps, prevState: any) {
    // Make sure to rerender the markdown block highlighting whenever comments are deleted
    if (prevProps.comments.length > this.props.comments.length) {
      this.forceUpdate();
    }
  }

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
      const didAddComment = this.props.addComment(newComment, this.props.file);
      if (didAddComment) {
        e.currentTarget.className = 'markdown-code__block--commented';
      }
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
    if (props.index === 0) {
      return <p>{props.children}</p>;
    }
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

  public tableRenderer = (props: any) => {
    return <table style={{ margin: '10px 0px 10px 60px' }}>{props.children}</table>;
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
      table: this.tableRenderer,
    };

    const boxHeight = document.getElementById(`syntax-highlighter-${file.id}`)
      ? document.getElementById(`syntax-highlighter-${file.id}`)!.getBoundingClientRect().height
      : this.props.markdown.split('\n').length * 24;

    const commentPanelStyle = {
      height: `${boxHeight}px`,
    };

    CodePanelUtils.updateCommentPanelHeight(boxHeight);

    return (
      <div id="scroll-container" className="grade__main-container__right-panel__scroll-container">
        <div className="grade__main-container__tab-content">
          <div className="grade__main-container__tab-content__code-panel">
            <div className="code__highlighted-area">
              <div
                id={`syntax-highlighter-${this.props.file.id}`}
                className="code__syntax-highlighter"
                style={{ cursor: 'pointer', 'min-width': '400px' }}
              >
                <ReactMarkdown includeNodeIndex={true} sourcePos={true} renderers={renderers}>
                  {this.props.markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>
          <div
            id={`comment-panel-${this.props.file.id}`}
            className="grade__main-container__tab-content__comment-panel"
            style={commentPanelStyle}
          >
            <CommentList
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
