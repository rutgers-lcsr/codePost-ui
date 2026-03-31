// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
import type { CommentType } from '../../../types/models';
import { File, getFileContent } from '../../../utils/file';
import { getBlockClassName } from './BlockUtils.tsx';
import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';
import CommentHighlightContext, { SUGGESTION_ID_OFFSET } from './CommentHighlightContext';
import { jupyterToMarkdown, normalizeNotebookJson, type Notebook } from './Jupyter';
import Editor from '@monaco-editor/react';
import Link from 'antd/es/typography/Link';
import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context.js';

import { useMarkdownTheme, MarkdownThemeValues } from './useMarkdownTheme';
import type { OutputData } from '../../../utils/fileExecution';

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

interface FileWithId {
  id: number;
}

const hasNumericFileId = (value: unknown): value is FileWithId => {
  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return false;
  }

  return typeof value.id === 'number';
};

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
  return (tree: MarkdownNode) => {
    if (tree.type !== 'root' || !tree.children) {
      return;
    }

    // Mark direct children of root as top-level
    tree.children.forEach((child: MarkdownNode) => {
      child.data = child.data || {};
      child.data.hProperties = child.data.hProperties || {};
      // Top level means that its the start of the line
      child.data.hProperties['data-is-top-level'] = 'true';
    });
  };
}

const REMARK_PLUGINS = [remarkGfm, remarkMarkTopLevel];
const REHYPE_PLUGINS = [rehypeRaw];
const NOTEBOOK_CHANGE_DEBOUNCE_MS = 150;
const VIDEO_DOMAINS = ['youtube.com', 'vimeo.com', 'dailymotion.com', 'wistia.com', 'vidyard.com'];

/**********************************************************************************************************************/
/* Main Component
/**********************************************************************************************************************/

interface IMarkdownProps {
  commentCounter: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executionResult?: { success: boolean; output_data?: OutputData; error?: string } | null;
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
  isEditMode: boolean;
  onCellContentChange: (cellIndex: number, newContent: string) => void;
}

interface MarkdownCellContextStore {
  cellIndex: number | null;
  cellType: string | null;
}

const MarkdownContext = React.createContext<MarkdownContextStore | null>(null);
const MarkdownCellContext = React.createContext<MarkdownCellContextStore>({ cellIndex: null, cellType: null });

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

  const { readOnly: isReadOnly, commentCounter, file, addComment, user, onContentChange } = props;

  // Optimizing comment updates:
  // Create a structural hash of comments so we only trigger re-renders when positions/counts change,
  // not when text content changes (which happens on every keystroke during editing).
  const commentsHash = React.useMemo(() => {
    return props.comments
      .map((c) => `${c.id}:${c.startLine}:${c.endLine}:${c.rubricComment}:${c.color}:${c.pointDelta}`)
      .join('|');
  }, [props.comments]);

  const stableComments = React.useMemo(
    () => props.comments,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commentsHash],
  );

  // Memoize comments by line locally for the Markdown view
  // This allows us to decouple from the potentially unstable CommentHighlightContext
  const stableCommentsByLine = React.useMemo(() => {
    const map = new Map<number, CommentType[]>();
    stableComments.forEach((comment) => {
      for (let line = comment.startLine!; line <= comment.endLine!; line++) {
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

  // For inline notebook editing: parse the notebook JSON and keep a mutable ref
  const notebookRef = React.useRef<Notebook | null>(null);
  const notebookSyncTimeoutRef = React.useRef<number | null>(null);
  const pendingNotebookPayloadRef = React.useRef<string | null>(null);

  const notebookContent = props.isEditMode && props.temporaryContent ? props.temporaryContent : fileContent;

  // Create a stable debounced change handler for prop updates
  // This decouples the local editor state (which is fast) from the expensive parent re-render (which is slow)

  React.useEffect(() => {
    if (isJupyter) {
      notebookRef.current = normalizeNotebookJson(notebookContent);
    }
  }, [isJupyter, notebookContent]);

  const flushPendingNotebookSync = React.useCallback(() => {
    if (notebookSyncTimeoutRef.current !== null) {
      window.clearTimeout(notebookSyncTimeoutRef.current);
      notebookSyncTimeoutRef.current = null;
    }

    const pendingPayload = pendingNotebookPayloadRef.current;
    if (pendingPayload !== null) {
      onContentChange(pendingPayload);
      pendingNotebookPayloadRef.current = null;
    }
  }, [onContentChange]);

  React.useEffect(() => {
    return () => {
      flushPendingNotebookSync();
    };
  }, [flushPendingNotebookSync]);

  // Handler for when a code cell is edited in-place
  const onCellContentChange = React.useCallback(
    (cellIndex: number, newContent: string) => {
      if (!isJupyter || !notebookRef.current) return;

      // Create a shallow copy of the notebook structure to avoid deep cloning
      // This is much faster for typing performance
      const currentNotebook = notebookRef.current;
      const updatedCells = [...currentNotebook.cells];

      if (updatedCells[cellIndex]) {
        // Shallow copy the specific cell we're modifying
        updatedCells[cellIndex] = {
          ...updatedCells[cellIndex],
          source: newContent,
        };

        const updatedNotebook = {
          ...currentNotebook,
          cells: updatedCells,
        };

        notebookRef.current = updatedNotebook;

        // Serialize back and notify parent (debounced) to reduce expensive parent updates while typing.
        pendingNotebookPayloadRef.current = JSON.stringify(updatedNotebook, null, 1);

        if (notebookSyncTimeoutRef.current !== null) {
          window.clearTimeout(notebookSyncTimeoutRef.current);
        }

        notebookSyncTimeoutRef.current = window.setTimeout(() => {
          const pendingPayload = pendingNotebookPayloadRef.current;
          if (pendingPayload !== null) {
            onContentChange(pendingPayload);
            pendingNotebookPayloadRef.current = null;
          }
          notebookSyncTimeoutRef.current = null;
        }, NOTEBOOK_CHANGE_DEBOUNCE_MS);
      }
    },
    [isJupyter, onContentChange],
  );

  const baseMarkdown = React.useMemo(() => {
    if (codeType === 'jupyter') {
      const converted = jupyterToMarkdown(notebookContent);
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
  }, [codeType, fileContent, notebookContent]);

  const markdown = executedContent ?? baseMarkdown;
  const deferredMarkdown = React.useDeferredValue(markdown);

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
  // Use the context's getCommentsForLine for hover — it includes suggestion pseudo-comments
  const effectiveGetCommentsForLine = commentHighlight?.getCommentsForLine ?? getCommentsForLine;

  const handleHoverEnterLine = React.useCallback(
    (lineNumber: number) => {
      if (!setHoveredCommentId) {
        return;
      }

      const commentsForLine = effectiveGetCommentsForLine(lineNumber);
      if (commentsForLine.length === 0) {
        return;
      }

      setHoveredCommentId(commentsForLine[0].id);
    },
    [setHoveredCommentId, effectiveGetCommentsForLine],
  );

  const handleHoverLeaveLine = React.useCallback(
    (lineNumber: number) => {
      if (!setHoveredCommentId || !isCommentHovered) {
        return;
      }

      const commentsForLine = effectiveGetCommentsForLine(lineNumber);
      if (commentsForLine.some((comment) => isCommentHovered(comment.id))) {
        setHoveredCommentId(null);
      }
    },
    [setHoveredCommentId, effectiveGetCommentsForLine, isCommentHovered],
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

      // Check if file has an ID (FileLike mocks do not)
      if (!hasNumericFileId(file)) {
        console.warn('Cannot add comment to file without ID');
        return;
      }

      const fileId = file.id;

      const newComment: CommentType = {
        id: commentCounter,
        endChar: 0,
        endLine: displayLine,
        file: fileId,
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
      isEditMode: props.isEditMode,
      onCellContentChange,
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
      props.isEditMode,
      onCellContentChange,
    ],
  );

  // Handle external execution results (from ExecuteFileButton)
  React.useEffect(() => {
    if (!isJupyter) {
      setExecutedContent(null);

      return;
    }

    if (!props.executionResult) {
      setExecutedContent(null);

      return;
    }

    // Clean up old cached object URLs when replacing with new execution results
    if (window.jupyterImages) {
      window.jupyterImages.forEach((imageInfo) => {
        if (imageInfo.objectUrl) {
          URL.revokeObjectURL(imageInfo.objectUrl);
        }
      });
      window.jupyterImages.clear();
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
        {deferredMarkdown}
      </ReactMarkdown>
    ),
    [deferredMarkdown],
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
    isEditMode,
  } = useMarkdownContext();

  const propsWithAttributes = props as MarkdownNodeProps & Record<string, unknown>;
  const isTopLevel =
    propsWithAttributes['data-is-top-level'] === 'true' || props.node?.properties?.['data-is-top-level'] === 'true';
  const shouldRenderAsBlock = isJupyter || isTopLevel;

  if (!shouldRenderAsBlock) {
    return {};
  }

  // In edit mode, disable all comment interactions
  if (isEditMode) {
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
  const { markdownTheme, syntaxHighlightTheme, isJupyter, isEditMode, onCellContentChange } = useMarkdownContext();
  const { cellIndex, cellType } = React.useContext(MarkdownCellContext);
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

  const highlighter = (
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
  );

  // In edit mode, render Monaco editor for code cells (not output/error)
  // Check cellType to ensure we only render editor for actual Code Cells, not code blocks in Markdown Cells
  if (
    isEditMode &&
    isJupyter &&
    cellType === 'code' &&
    language !== 'output' &&
    language !== 'error' &&
    cellIndex !== null &&
    !inline
  ) {
    const lineCount = (codeString || ' ').split('\n').length;
    const editorHeight = Math.max(lineCount * 20 + 20, 60);
    const capturedCellIndex = cellIndex;

    return (
      <div
        {...blockProps}
        style={{
          margin: '8px 0px 10px 0px',
          width: '100%',
          border: `2px solid #1890ff`,
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <Editor
          height={`${editorHeight}px`}
          width="100%"
          language={language || 'python'}
          value={codeString === 'undefined' ? '' : codeString || ''}
          onChange={(value) => {
            onCellContentChange(capturedCellIndex, value || '');
          }}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'off',
            folding: false,
            glyphMargin: false,
            lineDecorationsWidth: 8,
            lineNumbersMinChars: 0,
            padding: { top: 4, bottom: 4 },
            fontSize: 13,
            fontFamily: 'monospace',
            renderLineHighlight: 'none',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'auto',
            },
          }}
          theme="vs-dark"
        />
      </div>
    );
  }

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
    isEditMode,
  } = useMarkdownContext();
  // Also read from CommentHighlightContext to include suggestion pseudo-comments.
  // The local getCommentsForLine from MarkdownContext only has real comments, so
  // notebook cells wouldn't get highlight-{id} classes for suggestions without this.
  const commentHighlightCtx = React.useContext(CommentHighlightContext);
  const blockProps = useBlockProps(props);

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
  const cellType = (properties['dataCellType'] || properties['data-cell-type']) as string;

  if (cellIndex !== undefined) {
    const cellNum = parseInt(cellIndex, 10);

    // Real comments only (from local markdown context) — used for "commented" styling
    const cellComments = !Number.isNaN(cellNum) && getCommentsForLine ? getCommentsForLine(cellNum) : [];
    const cellHasComments = cellComments.length > 0;
    // Effective comments including suggestion pseudo-comments — used for highlight classes
    // and hover handlers so suggestions work the same as real comments in notebooks.
    const effectiveCellComments =
      !Number.isNaN(cellNum) && commentHighlightCtx?.getCommentsForLine
        ? commentHighlightCtx.getCommentsForLine(cellNum)
        : cellComments;
    const cellHasAnyHighlights = effectiveCellComments.length > 0;
    const cellIsInteractive = !Number.isNaN(cellNum) && (!renderersReadOnly || cellHasAnyHighlights);
    const cellDisplayIndex = Number.isNaN(cellNum) ? undefined : cellNum + 1;
    const cellAriaLabel =
      cellDisplayIndex !== undefined && cellIsInteractive
        ? cellHasAnyHighlights
          ? `Cell ${cellDisplayIndex} with ${effectiveCellComments.length} comment${effectiveCellComments.length === 1 ? '' : 's'}`
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
        key !== 'dataCellUuid' &&
        key !== 'data-cell-uuid' &&
        key !== 'datacelluuid' &&
        key !== 'dataCellType' &&
        key !== 'data-cell-type'
      ) {
        safeProps[key] = properties[key];
      }
    });

    const baseClassName = getClassName(cellNum);
    const baseClassTokens = baseClassName.split(' ').filter(Boolean);
    const staticClasses = baseClassTokens.filter((cls) => !cls.startsWith('markdown-block--'));

    // Check if this cell has suggestion-only highlights (no real comments, only AI suggestions)
    const hasSuggestionsOnly = !cellHasComments && effectiveCellComments.some((c) => c.id >= SUGGESTION_ID_OFFSET);

    const computedClassName = classNames(
      staticClasses,
      'jupyter-block',
      {
        'markdown-block--commented': cellHasComments,
        'markdown-block--empty': !cellHasComments,
      },
      // Use effectiveCellComments so suggestion pseudo-comments also get highlight-{id} classes
      effectiveCellComments.map((comment) => `highlight-${comment.id}`),
    );

    // Override the CSS custom properties for suggestion cells so they render
    // with a blue theme instead of the default green/yellow comment theme.
    // Inline styles are needed because the root-level theme sets these vars
    // via inline style, which has higher priority than stylesheet rules.
    const suggestionStyle: React.CSSProperties | undefined = hasSuggestionsOnly
      ? ({
          '--markdown-highlight-bg':
            'linear-gradient(90deg, rgba(24, 144, 255, 0.08) 0%, rgba(24, 144, 255, 0.04) 50%, rgba(255, 255, 255, 0.95) 100%)',
          '--markdown-highlight-shadow': 'inset 0 0 0 1px rgba(24, 144, 255, 0.15), 0 1px 2px rgba(24, 144, 255, 0.08)',
          '--markdown-highlight-border-color': 'rgba(24, 144, 255, 0.5)',
          '--markdown-highlight-hover-bg':
            'linear-gradient(90deg, rgba(24, 144, 255, 0.15) 0%, rgba(24, 144, 255, 0.08) 45%, rgba(255, 255, 255, 0.95) 100%)',
          '--markdown-highlight-hover-border-color': 'rgba(24, 144, 255, 0.7)',
          '--markdown-highlight-hover-shadow':
            'inset 0 0 0 1.5px rgba(24, 144, 255, 0.35), 0 4px 12px rgba(24, 144, 255, 0.2)',
          '--markdown-commented-bg':
            'linear-gradient(90deg, rgba(24, 144, 255, 0.06) 0%, rgba(24, 144, 255, 0.03) 100%)',
          '--markdown-commented-border-color': 'rgba(24, 144, 255, 0.35)',
          '--markdown-focused-bg':
            'linear-gradient(90deg, rgba(24, 144, 255, 0.15) 0%, rgba(24, 144, 255, 0.1) 45%, rgba(24, 144, 255, 0.06) 100%)',
          '--markdown-focused-border-color': 'rgba(24, 144, 255, 0.65)',
          '--markdown-focused-shadow': '0px 6px 16px rgba(24, 144, 255, 0.2)',
        } as React.CSSProperties)
      : undefined;

    return (
      <MarkdownCellContext.Provider
        value={{ cellIndex: Number.isNaN(cellNum) ? null : cellNum, cellType: cellType || null }}
      >
        <div
          data-jupyter-cell={cellIndex}
          data-cell-uuid={cellUuid}
          className={computedClassName}
          style={suggestionStyle}
          index-number={cellIndex}
          data-has-comment={cellHasComments ? 'true' : undefined}
          onMouseUp={isEditMode ? undefined : onMouseUp}
          onKeyDown={isEditMode ? undefined : cellIsInteractive ? onKeyDown : undefined}
          onMouseEnter={
            isEditMode ? undefined : cellHasAnyHighlights && onHoverEnter ? (_e) => onHoverEnter(cellNum) : undefined
          }
          onMouseLeave={
            isEditMode ? undefined : cellHasAnyHighlights && onHoverLeave ? (_e) => onHoverLeave(cellNum) : undefined
          }
          tabIndex={isEditMode ? undefined : cellIsInteractive ? 0 : undefined}
          role={isEditMode ? undefined : cellIsInteractive ? 'button' : undefined}
          aria-label={isEditMode ? undefined : cellAriaLabel}
          {...safeProps}
          title={`Cell ${1 + parseInt(cellIndex)}`}
        >
          {props.children}
        </div>
      </MarkdownCellContext.Provider>
    );
  }

  // Regular div handling
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
    // check if its a video domain
    if (VIDEO_DOMAINS.some((domain) => src.toLowerCase().includes(domain))) {
      // need to wrap this in an error boundary
      return <video controls src={src} />;
    }
  }

  return (
    <Image
      title={src == '' && alt ? `Unable to render ${alt}` : undefined}
      width={200}
      src={src == '' ? undefined : src}
      alt={alt}
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
