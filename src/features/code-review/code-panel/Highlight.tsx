// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import useKeyPress from '../../../components/core/useKeyPress';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import { useCommentHighlightStore, useHoveredCommentId } from './CommentHighlightContext';

interface IHighlightProps {
  readOnly: boolean;
  // FIXME: commentID will be 'n/a' for nested comments
  //          consider yourself warned...
  commentID: number;
  line: number;
  className: string;
  text: string;
  onHighlightClick: (e: React.MouseEvent, commentId: number) => void;
  onMouseEnter?: (commentId: number) => void;
  onMouseLeave?: (commentId: number) => void;
}

const Highlight = (props: IHighlightProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const { setHoveredCommentId, isCommentHovered, setDraggingState, setPreviewComment } = useCommentHighlightStore();
  const hoveredCommentId = useHoveredCommentId();

  const theme = consoleThemes.light === consoleTheme ? 'light' : 'dark';

  const cursorThemeClass = theme === 'light' ? 'highlight-cursor-light' : 'highlight-cursor-dark';

  const regex = /-0|9007199254740991/gm;
  const isNotCursor = props.className.match(regex) === null;

  const commandPressed = useKeyPress('Meta');

  // Extract ALL comment IDs from the className for nested/overlapping highlights
  // className can be like: "highlight-123" or "highlight-123 highlight-456"
  const commentIDs = React.useMemo(() => {
    const classNames = props.className.split(' ');
    return classNames
      .filter((cls) => cls.startsWith('highlight-'))
      .map((cls) => parseInt(cls.replace('highlight-', ''), 10))
      .filter((id) => !isNaN(id) && id !== 0 && id !== Number.MAX_SAFE_INTEGER);
  }, [props.className]);

  // Always enable hover effects for non-cursor highlights to help users see what's highlighted
  const isCursorHighlight = props.commentID === 0 || props.commentID === Number.MAX_SAFE_INTEGER;

  // Check if any of this span's comment IDs are currently hovered
  const isThisHighlightHovered = commentIDs.some((id) => isCommentHovered(id));

  // Build style with hover state - use CSS class for background color control
  const style: React.CSSProperties = {
    cursor: isCursorHighlight ? 'auto' : 'grab',
    opacity: consoleTheme.highlightOpacity,
    // DON'T set backgroundColor inline - let CSS handle it for better control
    // Inline styles override CSS classes, preventing our hover effects from working
  };

  // Debounce hover intent to avoid jittery scrolling during quick mouse sweeps.
  // The CSS hover class is applied instantly; only the context state update (which triggers
  // sidebar scroll) is delayed.
  const HOVER_DEBOUNCE_MS = 150;
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  let onMouseEnter;
  let onMouseLeave;
  let onClick: ((event: React.MouseEvent) => void) | undefined;

  if (commandPressed || !isCursorHighlight) {
    onMouseEnter = (_: React.MouseEvent) => {
      if (commentIDs.length > 0) {
        // Cancel any pending clear
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        // Debounce the state update so quick mouse passes don't trigger sidebar scroll
        hoverTimerRef.current = setTimeout(() => {
          if (props.onMouseEnter) {
            props.onMouseEnter(commentIDs[0]);
          } else {
            setHoveredCommentId(commentIDs[0]);
          }
        }, HOVER_DEBOUNCE_MS);
      }
    };

    onMouseLeave = (_: React.MouseEvent) => {
      // Cancel pending hover — mouse left before debounce fired
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      if (commentIDs.length > 0 && commentIDs.includes(hoveredCommentId || -1)) {
        if (props.onMouseLeave) {
          props.onMouseLeave(commentIDs[0]);
        } else {
          setHoveredCommentId(null);
        }
      }
    };

    onClick = (event: React.MouseEvent) => {
      const primaryCommentId = commentIDs.length > 0 ? commentIDs[0] : props.commentID;
      if (primaryCommentId !== undefined) {
        props.onHighlightClick(event, primaryCommentId);
      }
    };
  }

  const handleDragEnd = () => {
    setDraggingState(null, null);
    setPreviewComment(null);
  };

  return (
    <span
      key={`${props.line}-${props.commentID}`}
      id={`line-${props.line}-${props.commentID}`}
      className={`highlight ${props.className} ${isNotCursor ? '' : cursorThemeClass} ${isThisHighlightHovered ? 'highlight--hovered' : ''}`}
      style={{
        ...style,
        position: 'relative', // Ensure handles are positioned relative to the highlight
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      draggable={!isCursorHighlight && !props.readOnly}
      onDragStart={(e) => {
        if (!isCursorHighlight && !props.readOnly && commentIDs.length > 0) {
          e.dataTransfer.effectAllowed = 'move';
          const type = 'COMMENT_MOVE';
          e.dataTransfer.setData('application/json', JSON.stringify({ type, id: commentIDs[0] }));
          setDraggingState(commentIDs[0], type);
        }
      }}
      onDragEnd={handleDragEnd}
    >
      {props.text}
    </span>
  );
};

export default Highlight;
