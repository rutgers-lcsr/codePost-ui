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
  if (File.codeType(props.file) === 'jupyter') {
    markdown = jupyterToMarkdown(props.file.code);
  } else {
    markdown = props.file.code;
  }

  const onBlockElementClick = (e: any) => {
    console.log('clicking');
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

      console.log('clicked', newComment);

      props.addComment(newComment, props.file);

      // props.addComment(newComment, props.file);
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
    let className = 'markdown-block markdown-block--empty active';
    if (blockContainsComment(index)) {
      className = 'markdown-block markdown-block--commented active';
    }
    return className;
  };

  const renderers = useMarkdownRenderers(onBlockElementClick, getClassName);

  return (
    <ReactMarkdown includeNodeIndex={true} sourcePos={true} rawSourcePos={true} escapeHtml={true} renderers={renderers}>
      {markdown}
    </ReactMarkdown>
  );
};

const useMarkdownRenderers = (onMouseUp: any, getClassName: (index: any) => string) => {
  // Hack to determine which block elements are nested
  // topLevelChildren is initialized when the rootRenderer is called
  let topLevelChildren: number | undefined;

  const blockProps = (props: any) => {
    let isNestedBlock = false;
    if (topLevelChildren !== undefined && props.parentChildCount && topLevelChildren !== props.parentChildCount) {
      isNestedBlock = true;
    }

    if (!isNestedBlock) {
      return {
        className: getClassName(props.index),
        'index-number': props.index,
        onMouseUp,
      };
    }
    return {};
  };

  const rootRenderer = (props: any) => {
    topLevelChildren = props.children.length;
    return (
      <div id="code-markdown" className="markdown">
        {props.children}
      </div>
    );
  };

  const headingRenderer = (props: any) => {
    return React.createElement(`h${props.level}`, blockProps(props), props.children);
  };

  const paragraphRenderer = (props: any) => {
    return (
      <p {...blockProps(props)} style={{ paddingTop: '6px', paddingBottom: '6px' }}>
        {props.children}
      </p>
    );
  };

  const listRenderer = (props: any) => {
    return React.createElement(props.ordered ? 'ol' : 'ul', blockProps(props), props.children);
  };

  const codeRenderer = (props: any) => {
    if (props.language !== 'output') {
      return (
        <SyntaxHighlighter
          language={props.language}
          style={googlecode}
          customStyle={{
            backgroundColor: '#f2f2f2',
            borderTop: '0px',
            borderRight: '0px',
            borderBottom: '0px',
            margin: '0px 0px 12px 0px',
          }}
          showLineNumbers={false}
          wrapLines={false}
          {...blockProps(props)}
        >
          {props.value ? props.value : ' '}
        </SyntaxHighlighter>
      );
    } else {
      // FIXME special case for output rendering
      return <div {...blockProps(props)}>output!!!!!</div>;
    }
  };

  const thematicBreakRenderer = (props: any) => {
    return <hr {...blockProps(props)}>{props.children}</hr>;
  };

  // @ts-ignore
  const blockQuoteRenderer = (props: any) => {
    return (
      <div {...blockProps(props)} style={{ marginBottom: '12px' }}>
        <blockquote style={{ marginBottom: '0px' }}>{props.children}</blockquote>
      </div>
    );
  };

  const tableRenderer = (props: any) => {
    return (
      <div {...blockProps(props)} style={{ padding: '10px 10px 10px 30px', marginBottom: '12px' }}>
        <table className="markdown-table">{props.children}</table>
      </div>
    );
  };

  // Parse html encountered to markdown
  // We convert all html in an input/html cell to markdown in CodePanel,
  // but some html might be put in a 'markdown' cell type. This function converts that to markdown
  const parsedHtmlRenderer = (props: any) => {
    return (
      <div {...blockProps(props)}>
        <ReactMarkdown>{turndown.turndown(props.value)}</ReactMarkdown>
      </div>
    );
  };

  return {
    root: rootRenderer,
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
