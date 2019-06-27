import * as React from 'react';

import useKeyPress from '../../core/useKeyPress';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import CodePanelHighlighting from './CodePanelHighlighting';

interface IHighlightProps {
  readOnly: boolean;
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
    style = { cursor: 'pointer' };
    onMouseEnter = (e: React.MouseEvent) =>
      CodePanelHighlighting.brightenHighlight(props.commentID, consoleTheme.highlightActive);
    onMouseLeave = (e: React.MouseEvent) =>
      CodePanelHighlighting.darkenHighlight(props.commentID, consoleTheme.highlight);
    onClick = props.onHighlightClick;
  } else {
    style = { cursor: 'auto' };
    CodePanelHighlighting.darkenHighlight(props.commentID, consoleTheme.highlight);
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
