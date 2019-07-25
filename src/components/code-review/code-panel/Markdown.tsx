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

  const onBlockElementClick = (e: React.MouseEvent) => {
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
    const editable = props.readOnly ? 'readonly' : 'active';
    let className = `markdown-block markdown-block--empty ${editable}`;
    if (blockContainsComment(index)) {
      className = `markdown-block markdown-block--commented ${editable}`;
    }
    return className;
  };

  const renderers = useMarkdownRenderers(getClassName, props.readOnly ? undefined : onBlockElementClick);

  return (
    <ReactMarkdown includeNodeIndex={true} sourcePos={true} rawSourcePos={true} escapeHtml={true} renderers={renderers}>
      {markdown}
    </ReactMarkdown>
  );
};

const useMarkdownRenderers = (getClassName: (index: number) => string, onMouseUp?: (e: React.MouseEvent) => void) => {
  // Hack to determine which block elements are nested
  // topLevelChildren is initialized when the rootRenderer is called
  let topLevelChildren: number | undefined;

  const blockProps = (props: any) => {
    let isNestedBlock = false;
    if (
      topLevelChildren !== undefined &&
      props.parentChildCount &&
      topLevelChildren !== 1 &&
      topLevelChildren !== props.parentChildCount
    ) {
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
      <div id="code-markdown" className="markdown" style={{ padding: '5px 0px' }}>
        {props.children}
      </div>
    );
  };

  const headingRenderer = (props: any) => {
    const fontSize = 24 * Math.pow(0.9, props.level);
    return React.createElement(`h${props.level}`, { ...blockProps(props), style: { fontSize } }, props.children);
  };

  const paragraphRenderer = (props: any) => {
    return (
      <p {...blockProps(props)} style={{ paddingTop: '6px', paddingBottom: '6px', overflowX: 'auto' }}>
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
      return (
        <div {...blockProps(props)} style={{ marginBottom: '12px' }}>
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid black',
              borderRadius: '4px',
              fontFamily: 'monospace',
              padding: '4px',
              wordBreak: 'break-word',
            }}
          >
            {props.value ? props.value : ' '}
          </div>
        </div>
      );
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
    const rootRend = (propz: any) => {
      let isNestedBlock = false;
      if (
        topLevelChildren !== undefined &&
        props.parentChildCount &&
        topLevelChildren !== 1 &&
        topLevelChildren !== props.parentChildCount
      ) {
        isNestedBlock = true;
      }

      if (!isNestedBlock) {
        return <div {...blockProps(props)}>{propz.children}</div>;
      }
      return propz.children;
    };

    const paragraphRend = (propz: any) => {
      return <span>{propz.children}</span>;
    };

    // These renderers prevent console warnings about
    // nesting block level elements (like <p> and <div>)
    const renderers = {
      root: rootRend,
      paragraph: paragraphRend,
    };

    return <ReactMarkdown renderers={renderers}>{turndown.turndown(props.value)}</ReactMarkdown>;
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
