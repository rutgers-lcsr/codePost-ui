import * as React from 'react';

import useKeyPress from '../../core/useKeyPress';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

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

    onMouseEnter = (e: React.MouseEvent) =>
      CodePanelHighlighting.brightenHighlight(props.commentID, consoleTheme.highlightActive);
    onMouseLeave = (e: React.MouseEvent) =>
      CodePanelHighlighting.darkenHighlight(props.commentID, consoleTheme.highlight);
    onClick = props.onHighlightClick;
  } else {
    style = {
      cursor: 'auto',
      opacity: consoleTheme.highlightOpacity,
    };

    // Don't darken the cursor highlights
    const regex = /-0\s|9007199254740991/gm;
    if (props.className.match(regex) === null) {
      CodePanelHighlighting.darkenHighlight(props.commentID, consoleTheme.highlight);
    }
  }

  return (
    <span
      key={`${props.line}-${props.commentID}`}
      id={`line-${props.line}-${props.commentID}`}
      className={`highlight ${props.className}`}
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
