/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Image } from 'antd';
import classNames from 'classnames';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

/* codePost imports */
import { CommentType } from '../../../infrastructure/comment';
import { File, getFileContent } from '../../../infrastructure/file';
import { getBlockClassName } from './BlockUtils.tsx';
import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';
import CommentHighlightContext from './CommentHighlightContext';
import { jupyterToMarkdown } from './Jupyter';
import Link from 'antd/es/typography/Link';
import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context.js';

import { useMarkdownTheme, MarkdownThemeValues } from './useMarkdownTheme';

/**********************************************************************************************************************/
/* Jupyter Image Component
/**********************************************************************************************************************/

// Component to handle Jupyter images using blob URLs
// Memoized to prevent unnecessary re-renders and Object URL recreation
const JupyterImageComponent: React.FC<{ imageId: string }> = React.memo(({ imageId }) => {
  // Initialize with cached URL if available to prevent flicker
  const [imageUrl, setImageUrl] = React.useState<string>(() => {
    if (window.jupyterImages && window.jupyterImages.has(imageId)) {
      const imageInfo = window.jupyterImages.get(imageId)!;
      return imageInfo.objectUrl || '';
    }
    return '';
  });
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    if (window.jupyterImages && window.jupyterImages.has(imageId)) {
      const imageInfo = window.jupyterImages.get(imageId)!;

      // Check if we already have a cached object URL
      if (imageInfo.objectUrl) {
        setImageUrl(imageInfo.objectUrl);
        return; // No cleanup needed, URL is cached
      }

      const { data: imgData, format } = imageInfo;
      try {
        let objectUrl: string;

        if (format === 'image/svg+xml') {
          // SVG can be used directly as text
          const svgBlob = new Blob([imgData], { type: 'image/svg+xml' });
          objectUrl = URL.createObjectURL(svgBlob);
        } else {
          // Handle base64 encoded images (PNG, JPEG, etc.)
          const binaryString = window.atob(imgData);
          const binaryArray = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            binaryArray[i] = binaryString.charCodeAt(i);
          }

          const blob = new Blob([binaryArray.buffer], { type: format });
          objectUrl = URL.createObjectURL(blob);
        }

        // Cache the URL for future renders
        imageInfo.objectUrl = objectUrl;
        setImageUrl(objectUrl);

        // Don't revoke - keep it cached
      } catch (err) {
        setError(`Failed to create image: ${err}`);
      }
    } else {
      setError('Image data not found');
    }
  }, [imageId]);

  if (error) {
    return <div style={{ color: 'red', padding: '10px', border: '1px solid red' }}>❌ {error}</div>;
  }

  if (!imageUrl) {
    return null; // Return null instead of "Loading..." to prevent flicker
  }

  return (
    <img
      src={imageUrl}
      style={{
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        margin: '10px 0',
      }}
      alt="Jupyter Output"
    />
  );
});

// Add display name for React DevTools
JupyterImageComponent.displayName = 'JupyterImageComponent';

/**********************************************************************************************************************/
/* TypeScript Interfaces for react-markdown v9
/**********************************************************************************************************************/

interface MarkdownNode {
  type: string;
  position?: {
    start: { line: number; column: number; offset?: number };
    end: { line: number; column: number; offset?: number };
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
  'data-is-top-level'?: boolean;
}

interface ListProps extends MarkdownNodeProps {
  ordered?: boolean;
}

/**********************************************************************************************************************/
/* Remark Plugin: Mark Top-Level Elements and Track Jupyter Cells
/**********************************************************************************************************************/

/**
 * Remark plugin to mark direct children of markdown root as top-level elements.
 * This enables accurate detection of which elements should be clickable for commenting.
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

const REMARK_PLUGINS = [remarkGfm, remarkMarkTopLevel];
const REHYPE_PLUGINS = [rehypeRaw];

/**********************************************************************************************************************/
/* Main Component
/**********************************************************************************************************************/

interface IMarkdownProps {
  commentCounter: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executionResult?: { success: boolean; output_data?: any; error?: string } | null;
  onClearOutputs?: () => void;
}

interface MarkdownContextStore {
  onHoverEnter?: (lineNumber: number) => void;
  onHoverLeave?: (lineNumber: number) => void;
  hasCommentsForLine?: (lineNumber: number) => boolean;
  getCommentsForLine?: (lineNumber: number) => CommentType[];
  isReadOnly?: boolean;
  markdownTheme: MarkdownThemeValues;
  syntaxHighlightTheme: React.ComponentProps<typeof SyntaxHighlighter>['style'];
  getClassName: (index: number) => string;
  onMouseUp: ((e: React.MouseEvent<HTMLElement>) => void) | undefined;
  onKeyDown: ((e: React.KeyboardEvent<HTMLElement>) => void) | undefined;
  isJupyter: boolean;
}

const MarkdownContext = React.createContext<MarkdownContextStore | null>(null);

const useMarkdownContext = () => {
  const context = React.useContext(MarkdownContext);
  if (!context) {
    throw new Error('useMarkdownContext must be used within a MarkdownContext.Provider');
  }
  return context;
};

const Markdown = (props: ICodeContentCoreProps & ICodeContentEditProps & IMarkdownProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const syntaxHighlightTheme = React.useMemo(() => {
    return consoleTheme?.codeTheme ?? googlecode;
  }, [consoleTheme]);

  /* Theme and styles */
  const { markdownTheme, rootStyle } = useMarkdownTheme(consoleTheme ?? null);

  const [executedContent, setExecutedContent] = React.useState<string | null>(null);

  const { readOnly: isReadOnly, commentCounter, file, addComment, user } = props;

  // Optimizing comment updates:
  // Create a structural hash of comments so we only trigger re-renders when positions/counts change,
  // not when text content changes (which happens on every keystroke during editing).
  const commentsHash = React.useMemo(() => {
    return props.comments
      .map((c) => `${c.id}:${c.startLine}:${c.endLine}:${c.rubricComment}:${c.color}:${c.pointDelta}`)
      .join('|');
  }, [props.comments]);

  const stableComments = React.useMemo(() => props.comments, [commentsHash]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize comments by line locally for the Markdown view
  // This allows us to decouple from the potentially unstable CommentHighlightContext
  const stableCommentsByLine = React.useMemo(() => {
    const map = new Map<number, CommentType[]>();
    stableComments.forEach((comment) => {
      for (let line = comment.startLine; line <= comment.endLine; line++) {
        if (!map.has(line)) {
          map.set(line, []);
        }
        map.get(line)!.push(comment);
      }
    });
    return map;
  }, [stableComments]);

  const getCommentsForLine = React.useCallback(
    (lineNumber: number): CommentType[] => {
      return stableCommentsByLine.get(lineNumber) || [];
    },
    [stableCommentsByLine],
  );

  const hasCommentsForLine = React.useCallback(
    (lineNumber: number): boolean => {
      return stableCommentsByLine.has(lineNumber);
    },
    [stableCommentsByLine],
  );

  // Convert file content to markdown format
  const fileContent = getFileContent(file);
  const codeType = File.codeType(file);
  const isJupyter = codeType === 'jupyter';

  const baseMarkdown = React.useMemo(() => {
    if (codeType === 'jupyter') {
      const converted = jupyterToMarkdown(fileContent);
      if (converted === null) {
        console.debug('[Jupyter] Unable to convert notebook file content to markdown. Falling back to placeholder.');
        return '# Error\n\nWe could not render this notebook file.';
      }
      return converted;
    }

    if (codeType === 'image') {
      return '![](' + fileContent + ')';
    }

    return fileContent;
  }, [codeType, fileContent]);

  const markdown = executedContent ?? baseMarkdown;

  // Track if we've already created a comment in this event cycle to prevent duplicates
  const commentCreatedRef = React.useRef<{ cellIndex: number; timestamp: number } | null>(null);

  // Comment highlight context
  const commentHighlight = React.useContext(CommentHighlightContext);
  const setHoveredCommentId = commentHighlight?.setHoveredCommentId;
  // We use our local stable versions of these:
  // const getCommentsForLine = commentHighlight?.getCommentsForLine;
  // const lineHasComments = commentHighlight?.lineHasComments;
  const isCommentHovered = commentHighlight?.isCommentHovered;
  const contextOnHighlightClick = commentHighlight?.onHighlightClick;

  const handleHoverEnterLine = React.useCallback(
    (lineNumber: number) => {
      if (!setHoveredCommentId) {
        return;
      }

      const commentsForLine = getCommentsForLine(lineNumber);
      if (commentsForLine.length === 0) {
        return;
      }

      setHoveredCommentId(commentsForLine[0].id);
    },
    [setHoveredCommentId, getCommentsForLine],
  );

  const handleHoverLeaveLine = React.useCallback(
    (lineNumber: number) => {
      if (!setHoveredCommentId || !isCommentHovered) {
        return;
      }

      const commentsForLine = getCommentsForLine(lineNumber);
      if (commentsForLine.some((comment) => isCommentHovered(comment.id))) {
        setHoveredCommentId(null);
      }
    },
    [setHoveredCommentId, getCommentsForLine, isCommentHovered],
  );

  type BlockInteractionEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;

  const handleExistingCommentOpen = React.useCallback(
    (event: BlockInteractionEvent, lineNumber: number): boolean => {
      if (!contextOnHighlightClick) {
        return false;
      }

      const commentsForLine = getCommentsForLine(lineNumber);
      if (commentsForLine.length === 0) {
        return false;
      }

      const primaryComment = commentsForLine[0];
      if (!primaryComment || primaryComment.id === 0 || primaryComment.id === Number.MAX_SAFE_INTEGER) {
        return false;
      }

      contextOnHighlightClick(event as unknown as React.MouseEvent, primaryComment.id);
      setHoveredCommentId?.(primaryComment.id);
      return true;
    },
    [contextOnHighlightClick, getCommentsForLine, setHoveredCommentId],
  );

  const extractLineNumber = React.useCallback((element: HTMLElement | null): number | null => {
    if (!element) {
      return null;
    }

    const attributeValue =
      element.getAttribute('index-number') ||
      element.getAttribute('data-jupyter-cell') ||
      element.getAttribute('data-cell-index');

    if (!attributeValue) {
      return null;
    }

    const parsed = parseInt(attributeValue, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, []);

  const attemptAddComment = React.useCallback(
    (lineNumber: number) => {
      if (!addComment) {
        return;
      }

      if (isJupyter) {
        const now = Date.now();
        if (
          commentCreatedRef.current &&
          commentCreatedRef.current.cellIndex === lineNumber &&
          now - commentCreatedRef.current.timestamp < 200
        ) {
          return;
        }
        commentCreatedRef.current = { cellIndex: lineNumber, timestamp: now };
      }

      const displayLine = lineNumber;

      const newComment: CommentType = {
        id: commentCounter,
        endChar: 0,
        endLine: displayLine,
        file: file.id,
        pointDelta: 0.0,
        startChar: 0,
        startLine: displayLine,
        text: '',
        rubricComment: null,
        author: user,
        feedback: 0,
        color: null,
      };

      addComment(newComment, file);
    },
    [addComment, commentCounter, file, user, isJupyter],
  );

  const handleBlockMouseUp = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const interactiveTarget = (e.target as HTMLElement | null)?.closest('a, button, input, textarea, select, label');
      if (interactiveTarget) {
        return;
      }

      const target = e.currentTarget as HTMLElement | null;
      if (!target) {
        return;
      }

      const lineNumber = extractLineNumber(target);
      if (lineNumber === null) {
        return;
      }

      if (handleExistingCommentOpen(e, lineNumber)) {
        return;
      }

      if (isReadOnly) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      attemptAddComment(lineNumber);
    },
    [handleExistingCommentOpen, isReadOnly, attemptAddComment, extractLineNumber],
  );

  const handleBlockKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key !== 'Enter' && e.key !== ' ') {
        return;
      }

      const target = e.currentTarget as HTMLElement | null;
      const lineNumber = extractLineNumber(target);
      if (lineNumber === null) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (handleExistingCommentOpen(e, lineNumber)) {
        return;
      }

      if (isReadOnly) {
        return;
      }

      attemptAddComment(lineNumber);
    },
    [extractLineNumber, handleExistingCommentOpen, isReadOnly, attemptAddComment],
  );

  const getClassName = React.useCallback(
    (lineNumber: number) => {
      // Use stableComments instead of props.comments
      return getBlockClassName(stableComments, isReadOnly, lineNumber);
    },
    [stableComments, isReadOnly],
  );

  const contextValue = React.useMemo<MarkdownContextStore>(
    () => ({
      onHoverEnter: handleHoverEnterLine,
      onHoverLeave: handleHoverLeaveLine,
      hasCommentsForLine,
      getCommentsForLine,
      isReadOnly,
      markdownTheme,
      syntaxHighlightTheme,
      getClassName,
      onMouseUp: handleBlockMouseUp,
      onKeyDown: handleBlockKeyDown,
      isJupyter,
    }),
    [
      handleHoverEnterLine,
      handleHoverLeaveLine,
      hasCommentsForLine,
      getCommentsForLine,
      isReadOnly,
      markdownTheme,
      syntaxHighlightTheme,
      getClassName,
      handleBlockMouseUp,
      handleBlockKeyDown,
      isJupyter,
    ],
  );

  // Handle external execution results (from ExecuteFileButton)
  React.useEffect(() => {
    if (!isJupyter) {
      setExecutedContent(null);

      return;
    }

    // Clean up old cached object URLs whenever execution result changes
    if (window.jupyterImages) {
      window.jupyterImages.forEach((imageInfo) => {
        if (imageInfo.objectUrl) {
          URL.revokeObjectURL(imageInfo.objectUrl);
        }
      });
      window.jupyterImages.clear();
    }

    if (!props.executionResult) {
      setExecutedContent(null);

      return;
    }

    if (props.executionResult.output_data) {
      const executedMarkdown = jupyterToMarkdown(props.executionResult.output_data);
      if (executedMarkdown !== null) {
        setExecutedContent(executedMarkdown);
      } else {
        console.debug('[Jupyter] Execution output missing valid notebook cells. Falling back to original file.');
        setExecutedContent(null);
      }
    } else {
      setExecutedContent(null);
    }
  }, [props.executionResult, isJupyter]);

  const markdownElement = React.useMemo(
    () => (
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={markdownComponents as Components}
      >
        {executedContent || markdown}
      </ReactMarkdown>
    ),
    [executedContent, markdown],
  );

  return (
    <MarkdownContext.Provider value={contextValue}>
      <div id="code-markdown" className="markdown" style={rootStyle}>
        {markdownElement}
      </div>
    </MarkdownContext.Provider>
  );
};

/**********************************************************************************************************************/
/* Component Renderers
/**********************************************************************************************************************/

// Helper hook for block props
const useBlockProps = (props: MarkdownNodeProps, commentable: boolean = true) => {
  const {
    isJupyter,
    getCommentsForLine,
    hasCommentsForLine,
    isReadOnly: renderersReadOnly,
    onHoverEnter,
    onHoverLeave,
    getClassName,
    onMouseUp,
    onKeyDown,
  } = useMarkdownContext();

  const propsAny = props as any;
  const isTopLevel =
    propsAny['data-is-top-level'] === 'true' || props.node?.properties?.['data-is-top-level'] === 'true';
  const shouldRenderAsBlock = isJupyter || isTopLevel;

  if (!shouldRenderAsBlock) {
    return {};
  }

  const rawLineNumber = props.node?.position?.start?.line;
  const lineNumber = typeof rawLineNumber === 'number' ? rawLineNumber : undefined;
  const commentsForLine = lineNumber !== undefined && getCommentsForLine ? getCommentsForLine(lineNumber) : [];
  const hasComments = lineNumber !== undefined && hasCommentsForLine ? hasCommentsForLine(lineNumber) === true : false;

  if (lineNumber !== undefined && commentable) {
    const displayIndex = lineNumber + 1;
    const commentCount = commentsForLine.length;
    const ariaLabel = hasComments
      ? `Block ${displayIndex} with ${commentCount} comment${commentCount === 1 ? '' : 's'}`
      : `Add comment on block ${displayIndex}`;
    const shouldBeFocusable = !isJupyter && (!renderersReadOnly || hasComments);

    return {
      className: !isJupyter ? classNames(getClassName(lineNumber)) : undefined,
      'index-number': !isJupyter ? lineNumber : undefined,
      onMouseUp: !isJupyter ? onMouseUp : undefined,
      onKeyDown: !isJupyter && shouldBeFocusable ? onKeyDown : undefined,
      onMouseEnter:
        !isJupyter && hasComments && onHoverEnter ? (_e: React.MouseEvent) => onHoverEnter(lineNumber) : undefined,
      onMouseLeave:
        !isJupyter && hasComments && onHoverLeave ? (_e: React.MouseEvent) => onHoverLeave(lineNumber) : undefined,
      'data-has-comment': hasComments ? 'true' : undefined,
      tabIndex: !isJupyter && shouldBeFocusable ? 0 : undefined,
      role: !isJupyter && shouldBeFocusable ? 'button' : undefined,
      'aria-label': !isJupyter && shouldBeFocusable ? ariaLabel : undefined,
    };
  }

  return {};
};

const MarkdownParagraph = (props: MarkdownNodeProps) => {
  const blockProps = useBlockProps(props);
  // If paragraph only contains a code block, unwrap it to avoid DOM nesting warnings
  const hasOnlyCodeChild =
    React.Children.count(props.children) === 1 &&
    React.Children.toArray(props.children).every((child) => React.isValidElement(child) && child.type === 'code');

  if (hasOnlyCodeChild) {
    return <>{props.children}</>;
  }

  return (
    <p
      {...blockProps}
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

const MarkdownList = (props: ListProps) => {
  const blockProps = useBlockProps(props);
  const filteredAttrs = Object.fromEntries(Object.entries(blockProps).filter(([_, value]) => value !== undefined));
  return React.createElement(props.ordered ? 'ol' : 'ul', filteredAttrs, props.children);
};

const MarkdownCode = (props: CodeProps) => {
  const { markdownTheme, syntaxHighlightTheme, isJupyter } = useMarkdownContext();
  const blockProps = useBlockProps(props, true);

  const { className, children } = props;
  const inline = !props['data-is-top-level'];
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  if (inline) {
    return (
      <code
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          backgroundColor: markdownTheme.inlineCodeBg,
          color: markdownTheme.inlineCodeColor,
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.9em',
          fontWeight: 500,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          border: `1px solid ${markdownTheme.inlineCodeBorder}`,
        }}
      >
        {children}
      </code>
    );
  }

  if (language === 'output') {
    return (
      <div style={{ margin: '4px 0px 8px 0px', display: 'block', width: '100%', boxSizing: 'border-box' }}>
        <div
          style={{
            backgroundColor: markdownTheme.outputBackground,
            border: `1px solid ${markdownTheme.outputBorder}`,
            borderLeft: '3px solid #52c41a',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '13px',
            padding: '8px 12px',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'block',
          }}
        >
          {codeString || ' '}
        </div>
      </div>
    );
  }

  if (language === 'error') {
    return (
      <div style={{ margin: '4px 0px 8px 0px', display: 'block', width: '100%', boxSizing: 'border-box' }}>
        <div
          style={{
            backgroundColor: markdownTheme.outputBackground,
            border: `1px solid ${markdownTheme.outputBorder}`,
            borderLeft: '3px solid #ff4d4f',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '13px',
            padding: '8px 12px',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'block',
            color: '#cf1322',
          }}
        >
          {codeString || ' '}
        </div>
      </div>
    );
  }

  // Memoize SyntaxHighlighter
  const highlighter = React.useMemo(
    () => (
      <SyntaxHighlighter
        language={language || 'text'}
        style={syntaxHighlightTheme}
        customStyle={{
          backgroundColor: markdownTheme.codeBackground,
          borderTop: '0px',
          borderRight: '0px',
          borderBottom: '0px',
          margin: '0px', // Handled by wrapper
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          overflowX: 'auto',
          wordBreak: 'break-word',
          maxWidth: '100%',
          boxSizing: 'border-box',
          color: markdownTheme.text,
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
      >
        {codeString || ' '}
      </SyntaxHighlighter>
    ),
    [language, codeString, syntaxHighlightTheme, markdownTheme],
  );

  const extraJupyterStyles = isJupyter
    ? {
        border: `1px solid ${markdownTheme.jupyterCellBorder}`,
        padding: '10px',
        boxShadow: 'inset 0 0 2px #64b5f6',
      }
    : {};

  return (
    <div
      {...blockProps}
      style={{
        margin: '8px 0px 10px 0px',
        width: '100%',
        ...extraJupyterStyles,
      }}
    >
      {highlighter}
    </div>
  );
};

const MarkdownThematicBreak = (props: MarkdownNodeProps) => {
  const blockProps = useBlockProps(props);
  return <hr {...blockProps} />;
};

const MarkdownBlockQuote = (props: MarkdownNodeProps) => {
  const { markdownTheme } = useMarkdownContext();
  const blockProps = useBlockProps(props);
  return (
    <div {...blockProps} style={{ margin: '8px 0px 10px 0px' }}>
      <blockquote
        style={{
          marginBottom: '0px',
          paddingLeft: '12px',
          borderLeft: `3px solid ${markdownTheme.blockQuoteBorder}`,
        }}
      >
        {props.children}
      </blockquote>
    </div>
  );
};

const MarkdownTable = (props: MarkdownNodeProps) => {
  const blockProps = useBlockProps(props);
  return (
    <div {...blockProps} style={{ padding: '8px 10px 10px 30px', margin: '8px 0px 10px 0px', overflowX: 'auto' }}>
      <table className="markdown-table">{props.children}</table>
    </div>
  );
};

const MarkdownHeading = (props: HeadingProps) => {
  const blockProps = useBlockProps(props);
  const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
  const headingIndex = Math.min(Math.max(props.level ?? 1, 1), headingTags.length) - 1;
  const Tag = headingTags[headingIndex];
  return (
    <Tag
      {...blockProps}
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

const MarkdownDiv = (props: MarkdownNodeProps) => {
  const {
    getClassName,
    getCommentsForLine,
    isReadOnly: renderersReadOnly,
    onHoverEnter,
    onHoverLeave,
    onMouseUp,
    onKeyDown,
  } = useMarkdownContext();

  // Check if this div has special attributes
  const properties = props.node?.properties || {};

  // Try different possible property names for the image data attribute
  const imageId = (properties['data-jupyter-image'] ||
    properties['dataJupyterImage'] ||
    properties['data_jupyter_image']) as string;

  if (imageId) {
    // For image divs, render without blockProps (images are outputs, not commentable)
    return (
      <div>
        <JupyterImageComponent imageId={imageId} />
      </div>
    );
  }

  // Check for cell index marker (for Jupyter notebooks)
  const cellIndex = (properties['dataCellIndex'] || properties['data-cell-index']) as string;
  const cellUuid = (properties['dataCellUuid'] || properties['data-cell-uuid'] || properties['datacelluuid']) as string;

  if (cellIndex !== undefined) {
    const cellNum = parseInt(cellIndex, 10);
    const cellComments = !Number.isNaN(cellNum) && getCommentsForLine ? getCommentsForLine(cellNum) : [];
    const cellHasComments = cellComments.length > 0;
    const cellIsInteractive = !Number.isNaN(cellNum) && (!renderersReadOnly || cellHasComments);
    const cellDisplayIndex = Number.isNaN(cellNum) ? undefined : cellNum + 1;
    const cellAriaLabel =
      cellDisplayIndex !== undefined && cellIsInteractive
        ? cellHasComments
          ? `Cell ${cellDisplayIndex} with ${cellComments.length} comment${cellComments.length === 1 ? '' : 's'}`
          : `Add comment on cell ${cellDisplayIndex}`
        : undefined;

    // Create a safe props object
    const safeProps: Record<string, unknown> = {};
    Object.keys(properties).forEach((key) => {
      if (
        key !== 'dataCellIndex' &&
        key !== 'data-cell-index' &&
        key !== 'indexNumber' &&
        key !== 'index-number' &&
        key !== 'dataCellUuid' &&
        key !== 'data-cell-uuid' &&
        key !== 'datacelluuid'
      ) {
        safeProps[key] = properties[key];
      }
    });

    const baseClassName = getClassName(cellNum);
    const baseClassTokens = baseClassName.split(' ').filter(Boolean);
    const staticClasses = baseClassTokens.filter((cls) => !cls.startsWith('markdown-block--'));

    const computedClassName = classNames(
      staticClasses,
      'jupyter-block',
      {
        'markdown-block--commented': cellHasComments,
        'markdown-block--empty': !cellHasComments,
      },
      cellComments.map((comment) => `highlight-${comment.id}`),
    );

    return (
      <div
        data-jupyter-cell={cellIndex}
        data-cell-uuid={cellUuid}
        className={computedClassName}
        index-number={cellIndex}
        data-has-comment={cellHasComments ? 'true' : undefined}
        onMouseUp={onMouseUp}
        onKeyDown={cellIsInteractive ? onKeyDown : undefined}
        onMouseEnter={cellHasComments && onHoverEnter ? (_e) => onHoverEnter(cellNum) : undefined}
        onMouseLeave={cellHasComments && onHoverLeave ? (_e) => onHoverLeave(cellNum) : undefined}
        tabIndex={cellIsInteractive ? 0 : undefined}
        role={cellIsInteractive ? 'button' : undefined}
        aria-label={cellAriaLabel}
        {...safeProps}
        title={`Cell ${1 + parseInt(cellIndex)}`}
      >
        {props.children}
      </div>
    );
  }

  // Regular div handling
  const blockProps = useBlockProps(props);
  return <div {...blockProps}>{props.children}</div>;
};

const MarkdownImage = (props: MarkdownNodeProps) => {
  const properties = props.node?.properties || {};
  let src = properties['src'] as string;
  let alt = properties['alt'] as string;

  // remove relative urls as we cannot resolve them in the browser.
  if (!src || !(src.startsWith('data') || src.startsWith('http'))) {
    alt = `\`${src}\``;
    src = '';
  }

  if (src.startsWith('http')) {
    try {
      // check if its a video domain
      const VIDEODOMAINS = ['youtube.com', 'vimeo.com', 'dailymotion.com', 'wistia.com', 'vidyard.com'];
      if (VIDEODOMAINS.some((domain) => src.toLowerCase().includes(domain))) {
        return <video controls src={src} />;
      }
    } catch (err) {
      console.error(err);
      return <Image width={300} src="" alt={`Unable to render ${src}`} preview={false} />;
    }
  }

  return (
    <Image
      title={src == '' && alt ? `Unable to render ${alt}` : undefined}
      width={200}
      src={src == '' ? undefined : src}
      alt={alt}
      onMouseOver={(e) => console.log('Hovered over image', e)}
      preview={false}
    />
  );
};

const MarkdownLink = (props: MarkdownNodeProps) => {
  const { markdownTheme } = useMarkdownContext();
  const { node } = props;
  const href = (node?.properties?.href as string) || '';
  const title = (node?.properties?.title as string) || '';

  return (
    <Link
      href={href}
      title={title}
      style={{
        fontWeight: 600,
        color: markdownTheme.linkColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = markdownTheme.hoverLinkColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = markdownTheme.linkColor;
      }}
    >
      {props.children}
    </Link>
  );
};

const markdownComponents = {
  p: MarkdownParagraph,
  h1: (props: MarkdownNodeProps) => <MarkdownHeading {...props} level={1} />,
  h2: (props: MarkdownNodeProps) => <MarkdownHeading {...props} level={2} />,
  h3: (props: MarkdownNodeProps) => <MarkdownHeading {...props} level={3} />,
  h4: (props: MarkdownNodeProps) => <MarkdownHeading {...props} level={4} />,
  h5: (props: MarkdownNodeProps) => <MarkdownHeading {...props} level={5} />,
  h6: (props: MarkdownNodeProps) => <MarkdownHeading {...props} level={6} />,
  ul: (props: MarkdownNodeProps) => <MarkdownList {...props} ordered={false} />,
  ol: (props: MarkdownNodeProps) => <MarkdownList {...props} ordered={true} />,
  img: MarkdownImage,
  code: MarkdownCode,
  hr: MarkdownThematicBreak,
  blockquote: MarkdownBlockQuote,
  table: MarkdownTable,
  div: MarkdownDiv,
  a: MarkdownLink,
};

export default Markdown;
