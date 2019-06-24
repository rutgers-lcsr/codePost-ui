import * as React from 'react';

import useKeyPress from '../../core/useKeyPress';

import CodePanelHighlighting from './CodePanelHighlighting';

interface IHighlightProps {
  readOnly: boolean;
  commentID: number;
  line: number;
  className: string;
  text: string;
  onHighlightClick: any;
}

const Highlight = (props: IHighlightProps) => {
  const commandPressed = useKeyPress('Meta');

  let style: React.CSSProperties = {};
  let onMouseEnter;
  let onMouseLeave;
  let onClick;
  if (commandPressed) {
    style = { cursor: 'pointer' };
    onMouseEnter = (e: any) => CodePanelHighlighting.brightenHighlight(props.commentID);
    onMouseLeave = (e: any) => CodePanelHighlighting.darkenHighlight(props.commentID);
    onClick = props.onHighlightClick;
  } else {
    style = { cursor: 'auto' };
    CodePanelHighlighting.darkenHighlight(props.commentID);
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
