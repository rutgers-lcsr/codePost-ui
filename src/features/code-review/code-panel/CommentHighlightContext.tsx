// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import type { CommentType, SuggestedCommentType } from '../../../types/models';
import { CommentIO } from '../../../utils/comments';
import type { FileType } from '../../../utils/file';
import { findBlockElement } from './BlockUtils.tsx';

/**
 * ID offset for suggestion highlights.
 * Suggestion IDs are mapped to highlight IDs by adding this offset so they
 * don't collide with real comment IDs in the highlight system.
 */
export const SUGGESTION_ID_OFFSET = 2_000_000;

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

  // Preview state request for drag-and-drop
  setPreviewComment: (comment: CommentType | null) => void;
  // Dragging state
  setDraggingState: (id: number | null, type: string | null) => void;
  draggingCommentId: number | null;
  draggingType: string | null;

  focusedCommentId?: number;

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
export const useHoveredCommentId = (): number | null => {
  const context = useCommentHighlightStore();
  return React.useSyncExternalStore(
    context.subscribeHoveredCommentId,
    context.getHoveredCommentId,
    context.getHoveredCommentId,
  );
};

/**
 * Scroll an element into view within its nearest scrollable ancestor only.
 * Unlike `element.scrollIntoView()`, this uses `container.scrollTo()` which
 * ONLY scrolls the target container — it never propagates to parent containers,
 * preventing layout shifts (e.g. sidebar moving off-screen).
 */
export function scrollWithinContainer(
  element: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
  block: ScrollLogicalPosition = 'center',
) {
  // Walk up to find the nearest ancestor that is actually vertically scrollable.
  // We check both computed overflow-y AND whether the container actually has
  // vertical overflow — because CSS computes overflow-y:auto on containers
  // that only set overflow-x:auto, even when they have no vertical overflow.
  let container = element.parentElement;
  while (container) {
    const style = getComputedStyle(container);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && container.scrollHeight > container.clientHeight) {
      break;
    }
    container = container.parentElement;
  }
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  // Convert viewport-relative position to absolute position in scroll space
  const elementScrollTop = container.scrollTop + (elementRect.top - containerRect.top);

  let scrollTarget: number;
  if (block === 'center') {
    scrollTarget = elementScrollTop - container.clientHeight / 2 + element.clientHeight / 2;
  } else if (block === 'nearest') {
    // Already fully visible — do nothing
    if (elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom) {
      return;
    }
    // Scroll the minimum amount to bring the element into view
    if (elementRect.top < containerRect.top) {
      scrollTarget = container.scrollTop + (elementRect.top - containerRect.top);
    } else {
      scrollTarget = container.scrollTop + (elementRect.bottom - containerRect.bottom);
    }
  } else if (block === 'start') {
    scrollTarget = elementScrollTop;
  } else {
    // 'end'
    scrollTarget = elementScrollTop - container.clientHeight + element.clientHeight;
  }

  container.scrollTo({ top: Math.max(0, scrollTarget), behavior });
}

/**
 * Options for scrollHighlightIntoView, extending standard ScrollIntoViewOptions
 * with an optional lineNumber for fallback scrolling when the highlight DOM
 * element doesn't exist (e.g. windowed rendering has virtualized it away).
 */
interface ScrollHighlightOptions extends ScrollIntoViewOptions {
  lineNumber?: number;
}

/**
 * Scroll the first highlight element for a comment into view.
 * Helpful when syncing comment panel interactions with code highlights.
 *
 * When windowed rendering is active for plain code files, off-screen lines
 * are replaced by spacer divs and the `.highlight-{id}` element won't exist.
 * In that case, if `lineNumber` is provided, we programmatically scroll the
 * code container to the calculated position based on the fixed line height.
 */
export const scrollHighlightIntoView = (commentId: number, options?: ScrollHighlightOptions) => {
  if (typeof document === 'undefined') {
    return;
  }

  if (commentId === 0 || commentId === Number.MAX_SAFE_INTEGER || commentId < 0) {
    return;
  }

  const highlightElement = document.querySelector<HTMLElement>(`.highlight-${commentId}`);

  if (highlightElement) {
    scrollWithinContainer(highlightElement, options?.behavior ?? 'smooth', options?.block ?? 'center');
    return;
  }

  // Secondary fallback: element exists but no highlight class (e.g. notebook cell or block element).
  // Try to find the element by its index-number attribute (used by notebooks and markdown blocks).
  if (options?.lineNumber != null) {
    const blockElement = document.querySelector<HTMLElement>(`[index-number="${options.lineNumber}"]`);
    if (blockElement) {
      scrollWithinContainer(blockElement, options?.behavior ?? 'smooth', options?.block ?? 'center');
      return;
    }
  }

  // Last-resort fallback: element not in DOM (windowed rendering). Scroll by line number.
  if (options?.lineNumber != null) {
    const scrollContainer = document.querySelector<HTMLElement>('.code-panel--code');
    if (!scrollContainer) return;

    const LINE_HEIGHT = 20; // matches themeVars.grade.codeLineHeight
    const codeContainer = document.getElementById('code-container');
    const containerOffset = codeContainer ? codeContainer.offsetTop : 0;
    const codeOffset = containerOffset + 30; // .code-container padding-top

    const targetTop = codeOffset + options.lineNumber * LINE_HEIGHT;
    const centeredTop = targetTop - scrollContainer.clientHeight / 2;

    scrollContainer.scrollTo({
      top: Math.max(0, centeredTop),
      behavior: options?.behavior ?? 'smooth',
    });
  }
};

/**
 * Props for CommentHighlightProvider
 */
export interface CommentHighlightProviderProps {
  children: React.ReactNode;
  file: FileType | null;
  comments: CommentType[];
  suggestions?: SuggestedCommentType[];
  readOnly: boolean;
  user: string;
  onHighlightClick: (e: React.MouseEvent) => void;
  onHighlightSelect?: (commentId: number, event: React.MouseEvent) => void;
  addComment?: (comment: CommentType, file: FileType) => void;
  updateComment?: (commentId: number, updates: Partial<CommentType>) => void;
  deleteComment?: (commentId: number) => void;
  focusedCommentId?: number;
}

/**
 * Comment Highlight Provider Component
 */
export const CommentHighlightProvider: React.FC<CommentHighlightProviderProps> = (props) => {
  const {
    children,
    file,
    comments,
    suggestions,
    readOnly,
    user,
    onHighlightClick: externalOnHighlightClick,
    onHighlightSelect: externalOnHighlightSelect,
    addComment: externalAddComment,
    updateComment: externalUpdateComment,
    deleteComment: externalDeleteComment,
    focusedCommentId,
  } = props;

  const [previewComment, setPreviewComment] = React.useState<CommentType | null>(null);
  const [draggingCommentId, _setDraggingCommentId] = React.useState<number | null>(null);
  const [draggingType, _setDraggingType] = React.useState<string | null>(null);

  const setDraggingState = React.useCallback((id: number | null, type: string | null) => {
    _setDraggingCommentId(id);
    _setDraggingType(type);
  }, []);

  // Derived comments list that includes the preview comment and suggestion pseudo-comments.
  // Suggestions are mapped to CommentType with IDs offset by SUGGESTION_ID_OFFSET so the
  // highlight system can render them alongside regular comments.
  const effectiveComments = React.useMemo(() => {
    let base = comments;
    if (previewComment) {
      base = comments.map((c) => (c.id === previewComment.id ? previewComment : c));
    }
    if (!suggestions || suggestions.length === 0) return base;
    const pseudoComments: CommentType[] = suggestions.map(
      (s) =>
        ({
          id: s.id + SUGGESTION_ID_OFFSET,
          text: s.text,
          startLine: s.startLine,
          endLine: s.endLine,
          startChar: s.startChar ?? 0,
          // When endChar is 0 (default from the AI backend), use MAX_SAFE_INTEGER
          // so getHighlights() highlights the full line instead of skipping it
          // (startChar === endChar === 0 causes the highlight to be skipped entirely).
          endChar: s.endChar || Number.MAX_SAFE_INTEGER,
          file: s.file,
          pointDelta: s.pointDelta ?? 0,
          author: 'AI',
        }) as unknown as CommentType,
    );
    // The highlight system expects sorted input (CodePanelHighlighting.highlight
    // parameter is named sortedComments, and Code.tsx uses CommentIO.sortedIndex).
    return [...base, ...pseudoComments].sort(CommentIO.compare);
  }, [comments, previewComment, suggestions]);

  // External hover state store managed outside React render cycle
  const hoverStoreRef = React.useRef<{ value: number | null; listeners: Set<HoverListener> }>({
    value: focusedCommentId || null,
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
      // Don't clear and re-apply if it's the same comment, unless file changed
      // But we need to be careful if line numbers changed (unlikely during simple typing, but possible)
      // For now, simple optimization: compare IDs?
      // But we cleared elements already? No, this function calls clear.

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

      const activeComment = effectiveComments.find((comment) => comment.id === commentId);

      if (!activeComment) {
        if (hoverStoreRef.current.value !== null && hoverStoreRef.current.value === commentId) {
          // Keep the ID in store but cleanup styling if comment not found (e.g. deleted)
          // Actually if provided prop says focus ID, and we can't find it, we should probably reset?
          // For now, strict:
          // hoverStoreRef.current.value = null;
        }
        return;
      }

      const nextElements: HTMLElement[] = [];

      for (let line = activeComment.startLine!; line <= activeComment.endLine!; line += 1) {
        const element = findBlockElement(file, line) as HTMLElement | null;
        if (element && !nextElements.includes(element)) {
          // Skip DOM class manipulation for PDF pages — PdfHighlightLayer handles hover styling
          if (!element.hasAttribute('data-page-number')) {
            element.classList.add('highlight--hovered');
            element.classList.add('markdown-block--focused');
          }
          nextElements.push(element);
        }
      }

      hoveredElementsRef.current = nextElements;
    },
    [clearHoveredElements, effectiveComments, file],
  );

  // Keep hover store in sync with focusedCommentId prop
  React.useEffect(() => {
    if (focusedCommentId !== undefined) {
      if (hoverStoreRef.current.value !== focusedCommentId) {
        hoverStoreRef.current.value = focusedCommentId;
        // Re-apply styling immediately
        applyHoverStyling(focusedCommentId);
        notifyHoverListeners();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedCommentId]);

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

    effectiveComments.forEach((comment) => {
      // Add comment to all lines it spans
      for (let line = comment.startLine!; line <= comment.endLine!; line++) {
        if (!map.has(line)) {
          map.set(line, []);
        }
        map.get(line)!.push(comment);
      }
    });

    return map;
  }, [effectiveComments]);

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
      comments: effectiveComments,
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
      setPreviewComment,
      setDraggingState,
      draggingCommentId,
      draggingType,
      focusedCommentId,
    }),
    [
      file,
      effectiveComments,
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
      setPreviewComment,
      setDraggingState,
      draggingCommentId,
      draggingType,
      focusedCommentId,
    ],
  );

  // Apply hover styling without forcing Markdown/PDF to re-render
  React.useLayoutEffect(() => {
    const currentHover = hoverStoreRef.current.value;
    applyHoverStyling(currentHover);
    return clearHoveredElements;
  }, [applyHoverStyling, clearHoveredElements]); // Removed notifyHoverListeners from deps, shouldn't trigger here?

  return <CommentHighlightContext.Provider value={contextValue}>{children}</CommentHighlightContext.Provider>;
};

export default CommentHighlightContext;
