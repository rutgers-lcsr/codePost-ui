import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import TurndownService from 'turndown';

import * as turndownPluginGfm from 'turndown-plugin-gfm';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

import { CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';

// package to convert html to markdown
const turndown = new TurndownService();
turndown.use(turndownPluginGfm.tables);

interface IMarkdownListProps {
  comments: CommentType[];
  addComment: (comment: any, file: FileType) => boolean;
  file: FileType;
  markdown: string;
  commentCounter: number;
  updateCommentCounter: () => void;
}
class MarkdownList extends React.PureComponent<IMarkdownListProps, {}> {
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
        // @ts-ignore
        style={{ paddingTop: '6px', paddingBottom: '6px' }}
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
    let codeString = props.value;
    if (props.language && props.language !== 'output') {
      codeString = (
        <SyntaxHighlighter
          language={props.language}
          style={googlecode}
          customStyle={{ backgroundColor: 'transparent', borderWidth: '0px' }}
          showLineNumbers={false}
          wrapLines={false}
        >
          {props.value}
        </SyntaxHighlighter>
      );
    }
    const code = React.createElement('code', className ? { className } : null, codeString);
    return React.createElement(
      'pre',
      {
        className: `${this.rendererClassName(this.props.comments, props.index)} ipynb-code__${props.language}`,
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

  // Parse html encountered to markdown
  // We convert all html in an input/html cell to markdown in CodePanel,
  // but some html might be put in a 'markdown' cell type. This function converts that to markdown
  public parsedHtmlRenderer = (props: any) => {
    return (
      <div
        onClick={this.onBlockElementClick}
        className={this.rendererClassName(this.props.comments, props.index)}
        index-number={props.index}
      >
        <ReactMarkdown>{turndown.turndown(props.value)}</ReactMarkdown>
      </div>
    );
  };

  public render() {
    const renderers = {
      paragraph: this.paragraphRenderer,
      heading: this.headingRenderer,
      list: this.listRenderer,
      code: this.codeRenderer,
      thematicBreak: this.thematicBreakRenderer,
      blockquote: this.blockQuoteRenderer,
      table: this.tableRenderer,
      html: this.parsedHtmlRenderer,
    };

    return (
      <div className="code__highlighted-area">
        <div
          id={`syntax-highlighter-${this.props.file.id}`}
          className="code__syntax-highlighter markdown-code"
          style={{ cursor: 'pointer', minWidths: '400px' }}
        >
          <ReactMarkdown includeNodeIndex={true} sourcePos={true} renderers={renderers} escapeHtml={true}>
            {this.props.markdown}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
}

export default MarkdownList;
