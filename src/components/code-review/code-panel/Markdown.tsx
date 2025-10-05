/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import remarkGfm from 'remark-gfm';

/* codePost imports */
import { CommentType } from '../../../infrastructure/comment';
import { File } from '../../../infrastructure/file';
import { getBlockClassName } from './BlockUtils.tsx';
import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';
import { jupyterToMarkdown } from './Jupyter';

/**********************************************************************************************************************/
/* TypeScript Interfaces for react-markdown v9
/**********************************************************************************************************************/

interface MarkdownNode {
  type: string;
  position?: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  data?: {
    isTopLevel?: boolean;
    hProperties?: Record<string, unknown>;
  };
  properties?: Record<string, unknown>;
  children?: MarkdownNode[];
}

interface MarkdownNodeProps {
  node?: MarkdownNode;
  children?: React.ReactNode;
  properties?: Record<string, unknown>;
}

interface HeadingProps extends MarkdownNodeProps {
  level: number;
}

interface CodeProps extends MarkdownNodeProps {
  inline?: boolean;
  className?: string;
}

interface ListProps extends MarkdownNodeProps {
  ordered?: boolean;
}

/**********************************************************************************************************************/
/* Remark Plugin: Mark Top-Level Elements
/**********************************************************************************************************************/

/**
 * Remark plugin to mark direct children of markdown root as top-level elements.
 * This enables accurate detection of which elements should be clickable for commenting,
 * avoiding nested blocks like list items or nested blockquotes.
 *
 * Data flow: markdown → remark (marks isTopLevel) → HTML → component props
 */
function remarkMarkTopLevel() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    if (tree.type !== 'root' || !tree.children) {
      return;
    }

    // Mark direct children of root as top-level
    tree.children.forEach((child: MarkdownNode) => {
      child.data = child.data || {};
      child.data.hProperties = child.data.hProperties || {};
      child.data.hProperties['data-is-top-level'] = 'true';
    });
  };
}

/**********************************************************************************************************************/
/* Main Component
/**********************************************************************************************************************/

interface IMarkdownProps {
  commentCounter: number;
}

const Markdown = (props: ICodeContentCoreProps & ICodeContentEditProps & IMarkdownProps) => {
  // Convert file content to markdown format
  let markdown: string;
  if (File.codeType(props.file) === 'jupyter') {
    markdown = jupyterToMarkdown(props.file.code);
  } else if (File.codeType(props.file) === 'image') {
    markdown = '![](' + props.file.code + ')';
  } else {
    markdown = props.file.code;
  }

  // Handle click on markdown block elements to add comments
  const onBlockElementClick = (e: React.MouseEvent) => {
    const lineNumberStr = e.currentTarget.getAttribute('index-number');
    if (lineNumberStr) {
      const lineNumber = parseInt(lineNumberStr, 10);
      const newComment: CommentType = {
        id: props.commentCounter,
        endChar: 0,
        endLine: lineNumber,
        file: props.file.id,
        pointDelta: 0.0,
        startChar: 0,
        startLine: lineNumber,
        text: '',
        rubricComment: null,
        author: props.user,
        feedback: 0,
        color: null,
      };

      props.addComment(newComment, props.file);
    }
  };

  const components = useMarkdownRenderers(
    getBlockClassName.bind({}, props.comments, props.readOnly),
    props.readOnly ? undefined : onBlockElementClick,
  );

  const remarkPlugins = [remarkGfm, remarkMarkTopLevel];

  return (
    <div id="code-markdown" className="markdown" style={{ padding: '5px 0px' }}>
      <ReactMarkdown skipHtml remarkPlugins={remarkPlugins} components={components as Components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

/**********************************************************************************************************************/
/* Component Renderers
/**********************************************************************************************************************/

const useMarkdownRenderers = (getClassName: (index: number) => string, onMouseUp?: (e: React.MouseEvent) => void) => {
  /**
   * Generate props for block-level elements.
   * Only applies click handlers and styling to top-level elements (marked by remark plugin).
   */
  const blockProps = (props: MarkdownNodeProps) => {
    const lineNumber = props.node?.position?.start?.line;
    const isTopLevel = props.node?.properties?.['data-is-top-level'] === 'true';

    if (lineNumber !== undefined && isTopLevel) {
      return {
        className: getClassName(lineNumber),
        'index-number': lineNumber,
        onMouseUp,
      };
    }

    return {};
  };

  // Paragraph renderer - handle code blocks that might be wrapped in <p>
  const paragraphRenderer = (props: MarkdownNodeProps) => {
    // If paragraph only contains a code block, unwrap it to avoid DOM nesting warnings
    const hasOnlyCodeChild =
      React.Children.count(props.children) === 1 &&
      React.Children.toArray(props.children).every((child) => React.isValidElement(child) && child.type === 'code');

    if (hasOnlyCodeChild) {
      return <>{props.children}</>;
    }

    return (
      <p
        {...blockProps(props)}
        style={{
          paddingTop: '4px',
          paddingBottom: '4px',
          overflowX: 'auto',
          whiteSpace: 'normal',
        }}
      >
        {props.children}
      </p>
    );
  };

  // List renderer (ordered or unordered)
  const listRenderer = (props: ListProps) => {
    return React.createElement(props.ordered ? 'ol' : 'ul', blockProps(props), props.children);
  };

  // Code renderer - handles both inline code and code blocks
  const codeRenderer = (props: CodeProps) => {
    const { inline, className, children, ...rest } = props;

    // Extract language from className (format: "language-python")
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    // Extract text content from children
    const codeString = String(children).replace(/\n$/, '');

    // Inline code (like `code`)
    if (inline) {
      return (
        <code
          style={{
            fontFamily: 'monospace',
            backgroundColor: '#f5f5f5',
            padding: '2px 4px',
            borderRadius: '3px',
            whiteSpace: 'pre',
          }}
        >
          {children}
        </code>
      );
    }

    // Block code with special "output" language
    if (language === 'output') {
      return (
        <div {...blockProps(rest)} style={{ margin: '8px 0px 10px 0px' }}>
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid black',
              borderRadius: '4px',
              fontFamily: 'monospace',
              padding: '4px',
              wordBreak: 'break-word',
              whiteSpace: 'pre',
              overflowX: 'auto',
            }}
          >
            {codeString || ' '}
          </div>
        </div>
      );
    }

    // Block code with syntax highlighting
    return (
      <SyntaxHighlighter
        language={language || 'text'}
        style={googlecode}
        customStyle={{
          backgroundColor: '#f2f2f2',
          borderTop: '0px',
          borderRight: '0px',
          borderBottom: '0px',
          margin: '8px 0px 10px 0px',
          fontFamily: 'monospace',
          whiteSpace: 'pre',
          overflowX: 'auto',
        }}
        showLineNumbers={false}
        wrapLines={false}
        {...blockProps(rest)}
      >
        {codeString || ' '}
      </SyntaxHighlighter>
    );
  };

  // Horizontal rule renderer
  const thematicBreakRenderer = (props: MarkdownNodeProps) => {
    return <hr {...blockProps(props)} />;
  };

  // Blockquote renderer
  const blockQuoteRenderer = (props: MarkdownNodeProps) => {
    return (
      <div {...blockProps(props)} style={{ margin: '8px 0px 10px 0px' }}>
        <blockquote style={{ marginBottom: '0px', paddingLeft: '12px', borderLeft: '3px solid #ddd' }}>
          {props.children}
        </blockquote>
      </div>
    );
  };

  // Table renderer with wrapper for styling
  const tableRenderer = (props: MarkdownNodeProps) => {
    return (
      <div
        {...blockProps(props)}
        style={{ padding: '8px 10px 10px 30px', margin: '8px 0px 10px 0px', overflowX: 'auto' }}
      >
        <table className="markdown-table">{props.children}</table>
      </div>
    );
  };
  const headingRenderer = (props: HeadingProps) => {
    const Tag = `h${props.level}` as keyof JSX.IntrinsicElements;
    return (
      <Tag
        {...blockProps(props)}
        style={{
          marginTop: props.level <= 2 ? '16px' : '12px',
          marginBottom: '8px',
          fontWeight: 'normal',
          lineHeight: 1.4,
          scrollMarginTop: '100px',
        }}
      >
        {props.children}
      </Tag>
    );
  };
  return {
    // Map markdown element types to custom renderers (react-markdown v9 format)
    p: paragraphRenderer,
    h1: (props: MarkdownNodeProps) => headingRenderer({ ...props, level: 1 }),
    h2: (props: MarkdownNodeProps) => headingRenderer({ ...props, level: 2 }),
    h3: (props: MarkdownNodeProps) => headingRenderer({ ...props, level: 3 }),
    h4: (props: MarkdownNodeProps) => headingRenderer({ ...props, level: 4 }),
    h5: (props: MarkdownNodeProps) => headingRenderer({ ...props, level: 5 }),
    h6: (props: MarkdownNodeProps) => headingRenderer({ ...props, level: 6 }),
    ul: (props: MarkdownNodeProps) => listRenderer({ ...props, ordered: false }),
    ol: (props: MarkdownNodeProps) => listRenderer({ ...props, ordered: true }),
    code: codeRenderer,
    hr: thematicBreakRenderer,
    blockquote: blockQuoteRenderer,
    table: tableRenderer,
  };
};

export default Markdown;
