import * as React from 'react';

import useKeyPress from '../../core/useKeyPress';

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
  const { setHoveredCommentId, isCommentHovered } = useCommentHighlightStore();
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
    cursor: isCursorHighlight ? 'auto' : 'pointer',
    opacity: consoleTheme.highlightOpacity,
    // DON'T set backgroundColor inline - let CSS handle it for better control
    // Inline styles override CSS classes, preventing our hover effects from working
  };

  let onMouseEnter;
  let onMouseLeave;
  let onClick: ((event: React.MouseEvent) => void) | undefined;

  if (commandPressed || !isCursorHighlight) {
    // Use React state instead of DOM manipulation for hover effects
    onMouseEnter = (_: React.MouseEvent) => {
      // When hovering over a highlight with multiple comments, set the first one as hovered
      // This enables bidirectional highlighting with the comment panel
      if (commentIDs.length > 0) {
        if (props.onMouseEnter) {
          props.onMouseEnter(commentIDs[0]);
        } else {
          setHoveredCommentId(commentIDs[0]);
        }
      }
    };

    onMouseLeave = (_: React.MouseEvent) => {
      // Clear hover state when mouse leaves
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

  return (
    <span
      key={`${props.line}-${props.commentID}`}
      id={`line-${props.line}-${props.commentID}`}
      className={`highlight ${props.className} ${isNotCursor ? '' : cursorThemeClass} ${isThisHighlightHovered ? 'highlight--hovered' : ''}`}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {props.text}
    </span>
  );
};

export default Highlight;
