import * as React from 'react';

import { FlowChart } from './FlowChart.tsx';

const nodes: any[] = [
  {
    id: 0,
    title: 'Submission upload',
    position: { x: 0, y: 40 },
    outgoingNodes: [1],
    icon: 'dummy',
    color: '#24be85',
    tint: 10,
  },
  {
    id: 1,
    title: 'Autograder',
    position: { x: 25, y: 70 },
    outgoingNodes: [],
    icon: 'dummy',
    color: '#24be85',
    tint: 25,
  },
  {
    id: 2,
    title: 'Annotation',
    position: { x: 25, y: 55 },
    outgoingNodes: [],
    icon: 'dummy',
    color: '#24be85',
    tint: 25,
  },

  {
    id: 3,
    title: 'Plagiarism Detection',
    position: { x: 25, y: 40 },
    outgoingNodes: [],
    icon: 'dummy',
    color: '#24be85',
    tint: 25,
  },

  {
    id: 4,
    title: 'Quality control',
    position: { x: 50, y: 40 },
    outgoingNodes: [],
    icon: 'dummy',
    color: '#24be85',
    tint: 75,
  },
  {
    id: 5,
    title: 'Analytics',
    position: { x: 50, y: 55 },
    outgoingNodes: [],
    icon: 'dummy',
    color: '#24be85',
    tint: 75,
  },
  {
    id: 6,
    title: 'Submission return',
    position: { x: 75, y: 40 },
    outgoingNodes: [],
    icon: 'dummy',
    color: '#24be85',
    tint: 100,
  },
  {
    id: 7,
    title: 'Export to LMS',
    position: { x: 75, y: 55 },
    outgoingNodes: [],
    icon: 'dummy',
    color: '#24be85',
    tint: 100,
  },
  {
    id: 8,
    title: 'Student feedback',
    position: { x: 75, y: 70 },
    outgoingNodes: [],
    icon: 'dummy',
    color: '#24be85',
    tint: 100,
  },
];

export const LandingFlowChart = () => {
  return (
    <div style={{ paddingLeft: 40 }}>
      <FlowChart nodeList={nodes} canvasWidth={950} canvasHeight={500} />
    </div>
  );
};
