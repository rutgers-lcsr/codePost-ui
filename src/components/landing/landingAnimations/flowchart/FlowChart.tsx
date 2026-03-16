// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import useWindowSize from '../../../core/useWindowSize';

import landingVars from '../../../../styles/pages/_landingVars';

import * as Icons from '@ant-design/icons';

import { Popover } from 'antd';

// Map legacy icon names to new antd icon components
const iconMap: { [key: string]: React.ComponentType<{ style?: React.CSSProperties }> } = {
  import: Icons.ImportOutlined,
  'cloud-upload': Icons.CloudUploadOutlined,
  message: Icons.MessageOutlined,
  code: Icons.CodeOutlined,
  highlight: Icons.HighlightOutlined,
  profile: Icons.ProfileOutlined,
  dashboard: Icons.DashboardOutlined,
  'bar-chart': Icons.BarChartOutlined,
  inbox: Icons.InboxOutlined,
  export: Icons.ExportOutlined,
  like: Icons.LikeOutlined,
  redo: Icons.RedoOutlined,
};

function hexToRGB(hex: string, alpha: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

export interface FlowNodePosition {
  x: number;
  y: number;
}
const NODE_WIDTH = 100;
const NODE_HEIGHT = 50;

const NODE_CATEGORY_WIDTH = 120;
const NODE_CATEGORY_HEIGHT = 75;

export interface FlowNodeProps {
  id: number;
  position: FlowNodePosition;
  icon: string;
  title: string;
  color: string;
  tint: number;
  canvasWidth?: number;
  canvasHeight?: number;
  isCategory?: boolean;
  popoverContent?: string;
  outgoingNodes?: number[];
}

interface ArrowPosition {
  start: FlowNodeProps;
  end: FlowNodeProps;
  canvasWidth?: number;
  canvasHeight?: number;
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
    if (!node.isCategory || !node.outgoingNodes) return;
    node.outgoingNodes.forEach((nodeID) => {
      const outgoingNode = props.nodeList.find((n) => {
        return n.id === nodeID;
      });
      if (outgoingNode) {
        arrowPositions.push({ start: node, end: outgoingNode });
      }
    });
  });
  const arrows = arrowPositions.map((arrowPosition, i) => {
    return (
      <FlowArrow
        key={i.toString()}
        start={arrowPosition.start}
        end={arrowPosition.end}
        canvasWidth={props.canvasWidth}
        canvasHeight={props.canvasHeight}
      />
    );
  });

  return (
    <div
      style={{
        position: 'relative',
        width: props.canvasWidth,
        height: props.canvasHeight,
        marginLeft: NODE_CATEGORY_WIDTH / 2,
        marginRight: NODE_CATEGORY_WIDTH / 2,
      }}
    >
      {nodes}
      {arrows}
    </div>
  );
};

const FlowNode = (props: FlowNodeProps) => {
  const windowSize = useWindowSize();
  const widthMultiplier = props.canvasWidth ? props.canvasWidth / 100 : 1;
  const heightMultipler = props.canvasHeight ? props.canvasHeight / 100 : 1;
  const width = props.isCategory ? NODE_CATEGORY_WIDTH : NODE_WIDTH;
  const height = props.isCategory ? NODE_CATEGORY_HEIGHT : NODE_HEIGHT;

  const leftOffset = props.position.x * widthMultiplier - width / 2;
  const topOffset = props.position.y * heightMultipler - height / 2;

  const node = (
    <div
      style={{
        borderRadius: 12,
        fontSize: props.isCategory ? 16 : 12,
        width: width,
        height: height,
        backgroundColor: props.isCategory ? '#FFF' : hexToRGB(props.color, (props.tint / 100).toString()),
        color: props.isCategory ? '#0d7354' : '#02261e',
        border: props.isCategory ? `5px solid ${hexToRGB(props.color, (props.tint / 100).toString())}` : '',
        display: 'flex',
        justifyContent: 'center',
        fontWeight: props.isCategory ? 500 : 400,
        textAlign: 'center',
        alignItems: 'center',
        boxShadow: '0 22px 25px 0 rgba(228,228,234,.22), 0 9px 23px 0 rgba(228,228,234,.5)',
        cursor: props.isCategory ? '' : 'pointer',
      }}
      className={props.isCategory ? 'flowNodeCategory' : 'flowNode'}
    >
      {!props.isCategory &&
        (() => {
          const IconComponent = iconMap[props.icon];
          return IconComponent ? <IconComponent style={{ color: '#02261e', fontSize: 20, marginRight: 5 }} /> : null;
        })()}
      <div style={{ maxWidth: 60, minWidth: 60 }}>{props.title}</div>
    </div>
  );

  const nestedNode = props.isCategory ? (
    node
  ) : (
    <Popover
      content={props.popoverContent ? props.popoverContent : ''}
      placement={
        windowSize.width < landingVars.breakpoints.mobile && props.position.x > 30 && props.position.x < 67
          ? 'bottom'
          : props.position.x <= 50
            ? 'right'
            : 'left'
      }
      trigger="hover"
      mouseEnterDelay={0.3}
      overlayStyle={{ maxWidth: 250, textAlign: 'center' }}
    >
      {node}
    </Popover>
  );

  return <div style={{ position: 'absolute', left: leftOffset, top: topOffset }}>{nestedNode}</div>;
};

const FlowArrow = (props: ArrowPosition) => {
  const startColor = hexToRGB(props.start.color, (props.start.tint / 100).toString());
  const endColor = hexToRGB(props.end.color, (props.end.tint / 100).toString());
  const xPostition =
    props.start.position.x * (props.canvasWidth ? props.canvasWidth / 100 : 1) + NODE_CATEGORY_WIDTH / 2;
  const yPosition = props.start.position.y * (props.canvasHeight ? props.canvasHeight / 100 : 1);
  return (
    <div
      className="flowArrow"
      style={{
        background: `linear-gradient(to right, ${startColor}, ${endColor})`,
        left: xPostition,
        top: yPosition,
        zIndex: -1,
      }}
    />
  );
};
