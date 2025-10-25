import * as React from 'react';
import { CommentType } from '../../../infrastructure/comment';
import { FileType } from '../../../infrastructure/file';
import { findBlockElement } from './BlockUtils.tsx';

/**
 * Comment Highlight Context
 *
 * Centralized state management for comment highlighting in the code review interface.
 * This context provides:
 * - Comment data for the current file
 * - Hover state management
 * - Click handlers for highlighting
 * - Helper functions for comment operations
 *
 * Benefits over the previous approach:
 * - No prop drilling (comments don't need to be passed through 5 layers)
 * - Centralized hover logic (single source of truth)
 * - Easier testing (mock the context instead of prop chains)
 * - Better performance (React can optimize re-renders)
 * - Type-safe (full TypeScript support)
 */

type HoverListener = () => void;

interface CommentHighlightContextStore {
  // Current file being displayed
  file: FileType | null;

  // All comments for the current file
  comments: CommentType[];

  // Set which comment is being hovered
  setHoveredCommentId: (id: number | null) => void;

  // Handle clicking on a highlighted span
  onHighlightClick: (e: React.MouseEvent, commentId: number) => void;

  // Check if a comment ID is currently hovered
  isCommentHovered: (commentId: number) => boolean;

  // Get all comments that overlap a specific line
  getCommentsForLine: (lineNumber: number) => CommentType[];

  // Check if a line has any comments
  lineHasComments: (lineNumber: number) => boolean;

  // Add a new comment (for grading mode)
  addComment?: (comment: CommentType) => void;

  // Update an existing comment
  updateComment?: (commentId: number, updates: Partial<CommentType>) => void;

  // Delete a comment
  deleteComment?: (commentId: number) => void;

  // Read-only mode flag
  readOnly: boolean;

  // Current user (for comment authorship)
  user: string;

  // External hover store accessors for fine-grained subscriptions
  getHoveredCommentId: () => number | null;
  subscribeHoveredCommentId: (listener: HoverListener) => () => void;
}

export type CommentHighlightContextValue = CommentHighlightContextStore & {
  hoveredCommentId: number | null;
};

const CommentHighlightContext = React.createContext<CommentHighlightContextStore | null>(null);

/**
 * Access the underlying comment highlight store without subscribing to hover updates.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useCommentHighlightStore = (): CommentHighlightContextStore => {
  const context = React.useContext(CommentHighlightContext);
  if (!context) {
    throw new Error('useCommentHighlight must be used within a CommentHighlightProvider');
  }
  return context;
};

/**
 * Hook to access comment highlight context with hover state subscription
 * Must be used within a CommentHighlightProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useCommentHighlight = (): CommentHighlightContextValue => {
  const context = useCommentHighlightStore();
  const hoveredCommentId = React.useSyncExternalStore(
    context.subscribeHoveredCommentId,
    context.getHoveredCommentId,
    context.getHoveredCommentId,
  );

  return React.useMemo(
    () => ({
      ...context,
      hoveredCommentId,
    }),
    [context, hoveredCommentId],
  );
};

/**
 * Subscribe directly to hover state without accessing the rest of the context.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useHoveredCommentId = (): number | null => {
  const context = useCommentHighlightStore();
  return React.useSyncExternalStore(
    context.subscribeHoveredCommentId,
    context.getHoveredCommentId,
    context.getHoveredCommentId,
  );
};

/**
 * Scroll the first highlight element for a comment into view.
 * Helpful when syncing comment panel interactions with code highlights.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const scrollHighlightIntoView = (commentId: number, options?: ScrollIntoViewOptions) => {
  if (typeof document === 'undefined') {
    return;
  }

  if (commentId === 0 || commentId === Number.MAX_SAFE_INTEGER || commentId < 0) {
    return;
  }

  const highlightElement = document.querySelector<HTMLElement>(`.highlight-${commentId}`);

  if (!highlightElement) {
    return;
  }

  const scrollOptions: ScrollIntoViewOptions = {
    behavior: options?.behavior ?? 'smooth',
    block: options?.block ?? 'center',
    inline: options?.inline ?? 'nearest',
  };

  highlightElement.scrollIntoView(scrollOptions);
};

/**
 * Props for CommentHighlightProvider
 */
export interface CommentHighlightProviderProps {
  children: React.ReactNode;
  file: FileType | null;
  comments: CommentType[];
  readOnly: boolean;
  user: string;
  onHighlightClick: (e: React.MouseEvent) => void;
  onHighlightSelect?: (commentId: number, event: React.MouseEvent) => void;
  addComment?: (comment: CommentType, file: FileType) => void;
  updateComment?: (commentId: number, updates: Partial<CommentType>) => void;
  deleteComment?: (commentId: number) => void;
}

/**
 * Comment Highlight Provider Component
 *
 * Wraps the code display components and provides comment/highlight state.
 * Should be placed at the CodeContent level so all child components can access it.
 *
 * Usage:
 * ```tsx
 * <CommentHighlightProvider
 *   file={currentFile}
 *   comments={fileComments}
 *   readOnly={false}
 *   user={currentUser}
 *   onHighlightClick={handleClick}
 *   addComment={handleAddComment}
 * >
 *   <Code />
 *   <Comments />
 * </CommentHighlightProvider>
 * ```
 */
export const CommentHighlightProvider: React.FC<CommentHighlightProviderProps> = (props) => {
  const {
    children,
    file,
    comments,
    readOnly,
    user,
    onHighlightClick: externalOnHighlightClick,
    onHighlightSelect: externalOnHighlightSelect,
    addComment: externalAddComment,
    updateComment: externalUpdateComment,
    deleteComment: externalDeleteComment,
  } = props;
  // External hover state store managed outside React render cycle
  const hoverStoreRef = React.useRef<{ value: number | null; listeners: Set<HoverListener> }>({
    value: null,
    listeners: new Set(),
  });

  // Track DOM nodes currently marked as hovered so we can clean them up without re-rendering Markdown/PDF
  const hoveredElementsRef = React.useRef<HTMLElement[]>([]);

  const clearHoveredElements = React.useCallback(() => {
    if (hoveredElementsRef.current.length === 0) {
      return;
    }

    hoveredElementsRef.current.forEach((element) => {
      element.classList.remove('highlight--hovered');
      element.classList.remove('markdown-block--focused');
    });
    hoveredElementsRef.current = [];
  }, []);

  const notifyHoverListeners = React.useCallback(() => {
    hoverStoreRef.current.listeners.forEach((listener) => {
      listener();
    });
  }, []);

  const applyHoverStyling = React.useCallback(
    (commentId: number | null) => {
      clearHoveredElements();

      if (!file) {
        if (hoverStoreRef.current.value !== null) {
          hoverStoreRef.current.value = null;
        }
        return;
      }

      if (commentId === null) {
        return;
      }

      const activeComment = comments.find((comment) => comment.id === commentId);

      if (!activeComment) {
        if (hoverStoreRef.current.value !== null) {
          hoverStoreRef.current.value = null;
        }
        return;
      }

      const nextElements: HTMLElement[] = [];

      for (let line = activeComment.startLine; line <= activeComment.endLine; line += 1) {
        const element = findBlockElement(file, line) as HTMLElement | null;
        if (element && !nextElements.includes(element)) {
          element.classList.add('highlight--hovered');
          element.classList.add('markdown-block--focused');
          nextElements.push(element);
        }
      }

      hoveredElementsRef.current = nextElements;
    },
    [clearHoveredElements, comments, file],
  );

  const setHoveredCommentId = React.useCallback(
    (id: number | null) => {
      const previous = hoverStoreRef.current.value;
      hoverStoreRef.current.value = id;
      applyHoverStyling(id);
      if (previous !== hoverStoreRef.current.value) {
        notifyHoverListeners();
      }
    },
    [applyHoverStyling, notifyHoverListeners],
  );

  const getHoveredCommentId = React.useCallback(() => {
    return hoverStoreRef.current.value;
  }, []);

  const subscribeHoveredCommentId = React.useCallback((listener: HoverListener) => {
    hoverStoreRef.current.listeners.add(listener);
    return () => {
      hoverStoreRef.current.listeners.delete(listener);
    };
  }, []);

  // Memoize comments by line for performance
  const commentsByLine = React.useMemo(() => {
    const map = new Map<number, CommentType[]>();

    comments.forEach((comment) => {
      // Add comment to all lines it spans
      for (let line = comment.startLine; line <= comment.endLine; line++) {
        if (!map.has(line)) {
          map.set(line, []);
        }
        map.get(line)!.push(comment);
      }
    });

    return map;
  }, [comments]);

  // Get comments for a specific line
  const getCommentsForLine = React.useCallback(
    (lineNumber: number): CommentType[] => {
      return commentsByLine.get(lineNumber) || [];
    },
    [commentsByLine],
  );

  // Check if a line has comments
  const lineHasComments = React.useCallback(
    (lineNumber: number): boolean => {
      return commentsByLine.has(lineNumber) && commentsByLine.get(lineNumber)!.length > 0;
    },
    [commentsByLine],
  );

  // Check if a comment is hovered
  const isCommentHovered = React.useCallback((commentId: number): boolean => {
    return hoverStoreRef.current.value === commentId;
  }, []);

  // Handle highlight click with comment ID
  const onHighlightClick = React.useCallback(
    (e: React.MouseEvent, commentId: number) => {
      if (commentId !== 0 && commentId !== Number.MAX_SAFE_INTEGER) {
        setHoveredCommentId(commentId);
        externalOnHighlightSelect?.(commentId, e);
      }

      const target = e.target as HTMLElement | null;
      const element = target ?? (e.currentTarget as HTMLElement | null);
      if (element) {
        element.dataset.commentId = commentId.toString();
      }
      externalOnHighlightClick(e);
    },
    [externalOnHighlightClick, externalOnHighlightSelect, setHoveredCommentId],
  );

  // Wrap addComment to include file parameter
  const addComment = React.useCallback(
    (comment: CommentType) => {
      if (file && externalAddComment) {
        externalAddComment(comment, file);
      }
    },
    [file, externalAddComment],
  );

  const contextValue = React.useMemo<CommentHighlightContextStore>(
    () => ({
      file,
      comments,
      setHoveredCommentId,
      onHighlightClick,
      isCommentHovered,
      getCommentsForLine,
      lineHasComments,
      addComment: externalAddComment ? addComment : undefined,
      updateComment: externalUpdateComment,
      deleteComment: externalDeleteComment,
      readOnly,
      user,
      getHoveredCommentId,
      subscribeHoveredCommentId,
    }),
    [
      file,
      comments,
      onHighlightClick,
      isCommentHovered,
      getCommentsForLine,
      lineHasComments,
      addComment,
      externalAddComment,
      externalUpdateComment,
      externalDeleteComment,
      readOnly,
      user,
      setHoveredCommentId,
      getHoveredCommentId,
      subscribeHoveredCommentId,
    ],
  );

  // Apply hover styling without forcing Markdown/PDF to re-render
  React.useLayoutEffect(() => {
    const previous = hoverStoreRef.current.value;
    applyHoverStyling(previous);
    if (hoverStoreRef.current.value !== previous) {
      notifyHoverListeners();
    }

    return clearHoveredElements;
  }, [applyHoverStyling, clearHoveredElements, notifyHoverListeners]);

  return <CommentHighlightContext.Provider value={contextValue}>{children}</CommentHighlightContext.Provider>;
};

export default CommentHighlightContext;
