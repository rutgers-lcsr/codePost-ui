import * as React from 'react';
import { hexToRGB } from '../api/Utils';

import { Popover } from 'antd';

import CPTooltip from '../../../core/CPTooltip';

export interface FlowNodePosition {
  x: number;
  y: number;
}
const NODE_WIDTH = 100;
const NODE_HEIGHT = 50;

const NODE_CATEGORY_WIDTH = 150;
const NODE_CATEGORY_HEIGHT = 75;

export interface FlowNodeProps {
  id: number;
  position: FlowNodePosition;
  outgoingNodes: number[];
  icon: string;
  title: string;
  color: string;
  tint: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

interface ArrowPosition {
  start: FlowNodePosition;
  end: FlowNodePosition;
}

interface IProps {
  nodeList: FlowNodeProps[];
  canvasWidth: number;
  canvasHeight: number;
}

export const FlowChart = (props: IProps) => {
  const nodes = props.nodeList.map((node) => {
    return <FlowNode key={node.id} {...node} canvasWidth={props.canvasWidth} canvasHeight={props.canvasHeight} />;
  });

  const arrowPositions: ArrowPosition[] = [];

  props.nodeList.forEach((node) => {
    node.outgoingNodes.forEach((nodeID) => {
      const outgoingNode = props.nodeList.find((n) => {
        return n.id === nodeID;
      });
      if (outgoingNode) {
        arrowPositions.push({ start: node.position, end: outgoingNode.position });
      }
    });
  });
  const arrows = arrowPositions.map((arrowPosition) => {
    return <FlowArrow start={arrowPosition.start} end={arrowPosition.end} />;
  });

  return (
    <div style={{ position: 'relative', width: props.canvasWidth, height: props.canvasHeight }}>
      {nodes}
      {arrows}
    </div>
  );
};

const FlowNode = (props: FlowNodeProps) => {
  const widthMultiplier = props.canvasWidth ? props.canvasWidth / 100 : 1;
  const heightMultipler = props.canvasHeight ? props.canvasHeight / 100 : 1;
  const leftOffset = props.position.x * widthMultiplier - NODE_WIDTH / 2;
  const topOffset = props.position.y * heightMultipler - NODE_HEIGHT / 2;
  return (
    <div style={{ position: 'absolute', left: leftOffset, top: topOffset }}>
      <Popover content="Title" placement={props.position.x <= 50 ? 'left' : 'right'} trigger="click">
        <div
          style={{
            borderRadius: 12,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            backgroundColor: hexToRGB(props.color, (props.tint / 100).toString()),
            color: props.tint < 35 ? props.color : 'white',
            display: 'flex',
            justifyContent: 'center',
            textAlign: 'center',
            alignItems: 'center',
            boxShadow: '0 22px 25px 0 rgba(228,228,234,.22), 0 9px 23px 0 rgba(228,228,234,.5)',
            cursor: 'pointer',
          }}
          className="flowNode"
        >
          {props.title}
        </div>
      </Popover>
    </div>
  );
};

const FlowCategory = (props: FlowNodeProps) => {
  const widthMultiplier = props.canvasWidth ? props.canvasWidth / 100 : 1;
  const heightMultipler = props.canvasHeight ? props.canvasHeight / 100 : 1;
  const leftOffset = props.position.x * widthMultiplier - NODE_CATEGORY_WIDTH / 2;
  const topOffset = props.position.y * heightMultipler - NODE_CATEGORY_HEIGHT / 2;
  return (
    <div style={{ position: 'absolute', left: leftOffset, top: topOffset }}>
      <div
        style={{
          borderRadius: 12,
          width: NODE_CATEGORY_WIDTH,
          height: NODE_CATEGORY_HEIGHT,
          border: hexToRGB(props.color, (props.tint / 100).toString()),
          borderStyle: '2px solid',
          color: props.color,
          display: 'flex',
          justifyContent: 'center',
          textAlign: 'center',
          alignItems: 'center',
          boxShadow: '0 22px 25px 0 rgba(228,228,234,.22), 0 9px 23px 0 rgba(228,228,234,.5)',
          cursor: 'pointer',
        }}
        className="flowCategory"
      >
        {props.title}
      </div>
    </div>
  );
};

const FlowArrow = (props: ArrowPosition) => {
  return <div />;
};
