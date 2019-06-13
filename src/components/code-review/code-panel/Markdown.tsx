import * as React from 'react';

import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';

import { CommentType } from '../../../infrastructure/comment';
import { File } from '../../../infrastructure/file';

import { jupyterToMarkdown } from './Jupyter';

import ReactMarkdown from 'react-markdown';

import TurndownService from 'turndown';
import * as turndownPluginGfm from 'turndown-plugin-gfm';

const turndown = new TurndownService();
turndown.use(turndownPluginGfm.tables);

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

interface IMarkdownProps {
  commentCounter: number;
}

const Markdown = (props: ICodeContentCoreProps & ICodeContentEditProps & IMarkdownProps) => {
  let markdown;
  if (File.isJupyter(props.file)) {
    markdown = jupyterToMarkdown(props.file.code);
  } else {
    markdown = props.file.code;
  }

  const onBlockElementClick = (e: any) => {
    const index = e.currentTarget.getAttribute('index-number');
    if (index) {
      const newComment: CommentType = {
        id: props.commentCounter,
        endChar: 0,
        endLine: +index,
        file: props.file.id,
        pointDelta: 0.0,
        startChar: 0,
        startLine: +index,
        text: '',
        rubricComment: null,
        author: props.user,
      };

      props.addComment(newComment, props.file);
      // if (didAddComment) {
      //   e.currentTarget.className = 'markdown-code__block--commented';
      // }
    }
  };

  const blockContainsComment = (index: number): boolean => {
    return (
      props.comments.filter((comment: CommentType) => {
        return comment.startLine === index;
      }).length > 0
    );
  };

  const getClassName = (index: number): string => {
    let className = 'markdown-code__block--empty';
    if (blockContainsComment(index)) {
      className = 'markdown-code__block--commented';
    }
    return className;
  };

  const renderers = useMarkdownRenderers(onBlockElementClick, getClassName);
  console.log('renderers', renderers);

  // <ReactMarkdown includeNodeIndex={true} sourcePos={true} renderers={renderers} escapeHtml={true}>
  return (
    <div id="code-underlay" style={{ position: 'absolute', top: '25px', overflow: 'scroll' }}>
      <ReactMarkdown includeNodeIndex={true} sourcePos={true} escapeHtml={true}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

const useMarkdownRenderers = (onClick: any, getClassName: (index: any) => string) => {
  const headingRenderer = (props: any) => {
    return React.createElement(
      `h${props.level}`,
      {
        className: getClassName(props.index),
        'index-number': props.index,
        onClick,
        style: {},
      },
      props.children,
    );
  };

  const paragraphRenderer = (props: any) => {
    if (props.index === 0) {
      return <p>{props.children}</p>;
    }
    return (
      <p
        className={getClassName(props.index)}
        index-number={props.index}
        onClick={onClick}
        // @ts-ignore
        style={{ paddingTop: '6px', paddingBottom: '6px' }}
      >
        {props.children}
      </p>
    );
  };

  const listRenderer = (props: any) => {
    return React.createElement(
      props.ordered ? 'ol' : 'ul',
      {
        className: getClassName(props.index),
        'index-number': props.index,
        onClick,
      },
      props.children,
    );
  };

  const codeRenderer = (props: any) => {
    const className = props.language && `language-${props.language}`;
    let codeString = props.value ? props.value : ' ';
    if (props.value && props.language && props.language !== 'output') {
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
        className: `${getClassName(props.index)} ipynb-code__${props.language}`,
        'index-number': props.index,
        onClick,
      },
      code,
    );
  };

  const thematicBreakRenderer = (props: any) => {
    return (
      <hr className={getClassName(props.index)} index-number={props.index} onClick={onClick}>
        {props.children}
      </hr>
    );
  };

  const blockQuoteRenderer = (props: any) => {
    return (
      <blockquote className={getClassName(props.index)} index-number={props.index} onClick={onClick}>
        {props.children}
      </blockquote>
    );
  };

  const tableRenderer = (props: any) => {
    return <table style={{ margin: '10px 0px 10px 60px' }}>{props.children}</table>;
  };

  // Parse html encountered to markdown
  // We convert all html in an input/html cell to markdown in CodePanel,
  // but some html might be put in a 'markdown' cell type. This function converts that to markdown
  const parsedHtmlRenderer = (props: any) => {
    return (
      <div onClick={onClick} className={getClassName(props.index)} index-number={props.index}>
        <ReactMarkdown>{turndown.turndown(props.value)}</ReactMarkdown>
      </div>
    );
  };

  return {
    paragraph: paragraphRenderer,
    heading: headingRenderer,
    list: listRenderer,
    code: codeRenderer,
    thematicBreak: thematicBreakRenderer,
    blockquote: blockQuoteRenderer,
    table: tableRenderer,
    html: parsedHtmlRenderer,
  };
};

export default Markdown;
