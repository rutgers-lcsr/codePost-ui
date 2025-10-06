import * as React from 'react';

import useKeyPress from '../../core/useKeyPress';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import CodePanelHighlighting from './CodePanelHighlighting';

interface IHighlightProps {
  readOnly: boolean;
  // FIXME: commentID will be 'n/a' for nested comments
  //          consider yourself warned...
  commentID: number;
  line: number;
  className: string;
  text: string;
  onHighlightClick: (e: React.MouseEvent) => void;
}

const Highlight = (props: IHighlightProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const theme = consoleThemes.light === consoleTheme ? 'light' : 'dark';

  const cursorThemeClass = theme === 'light' ? 'highlight-cursor-light' : 'highlight-cursor-dark';

  const regex = /-0|9007199254740991/gm;
  const isNotCursor = props.className.match(regex) === null;

  const commandPressed = useKeyPress('Meta');

  let style: React.CSSProperties = {};
  let onMouseEnter;
  let onMouseLeave;
  let onClick;
  if (commandPressed) {
    style = {
      cursor: 'pointer',
      opacity: consoleTheme.highlightOpacity,
    };

    if (props.commentID !== 0 || props.commentID !== Number.MAX_SAFE_INTEGER) {
      style = { ...style, backgroundColor: consoleTheme.highlight };
    }

    onMouseEnter = (_: React.MouseEvent) => CodePanelHighlighting.brightenHighlight(props.commentID);
    onMouseLeave = (_: React.MouseEvent) => CodePanelHighlighting.darkenHighlight(props.commentID);
    onClick = props.onHighlightClick;
  } else {
    style = {
      cursor: 'auto',
      opacity: consoleTheme.highlightOpacity,
    };

    // Don't darken the cursor highlights
    if (isNotCursor) {
      CodePanelHighlighting.darkenHighlight(props.commentID);
    }
  }

  return (
    <span
      key={`${props.line}-${props.commentID}`}
      id={`line-${props.line}-${props.commentID}`}
      className={`highlight ${props.className} ${isNotCursor ? '' : cursorThemeClass}`}
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
