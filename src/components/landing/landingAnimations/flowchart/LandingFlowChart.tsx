import * as React from 'react';

import { FlowChart } from './FlowChart.tsx';

const nodes: any[] = [
  {
    id: 0,
    title: 'Submission upload',
    position: { x: 0, y: 40 },
    icon: 'cloud-upload',
    color: '#24be85',
    tint: 10,
    popoverContent:
      "Easily integrate your existing submission system (LMS, homegrown), or use codePost's student upload tool.",
  },
  {
    id: 1,
    title: 'Autograder',
    position: { x: 33, y: 70 },
    icon: 'code',
    color: '#24be85',
    tint: 25,
    popoverContent: `Integrate your autograder so that test outputs are included in the student's submission. codePost built-in autograder is coming soon!`,
  },
  {
    id: 2,
    title: 'Annotation',
    position: { x: 33, y: 55 },
    icon: 'highlight',
    color: '#24be85',
    tint: 25,
    popoverContent: `Annotate your student's code with the easiest code annotation tool.`,
  },

  {
    id: 3,
    title: 'Plagiarism Detection',
    position: { x: 33, y: 40 },
    icon: 'exception',
    color: '#24be85',
    tint: 25,
    popoverContent: `Run all your student's submissions through plagiarism detection (MOSS) with a single button click.`,
  },

  {
    id: 4,
    title: 'Quality control',
    position: { x: 66, y: 40 },
    icon: 'dashboard',
    color: '#24be85',
    tint: 75,
    popoverContent: `Track grading progress with a central dashboard, and view stats across TAs to identify areas to review.`,
  },
  {
    id: 5,
    title: 'Analytics',
    position: { x: 66, y: 55 },
    icon: 'bar-chart',
    color: '#24be85',
    tint: 75,
    popoverContent: `See data across all your submissions, such as most common errors, in order to find areas to updating grading (e.g., updating rubric) or to focus on in the next lecture.`,
  },
  {
    id: 6,
    title: 'Submission return',
    position: { x: 100, y: 40 },
    icon: 'inbox',
    color: '#24be85',
    tint: 100,
    popoverContent: `Distribute student feedback with a single click, and allow them to access a modern interface. `,
  },
  {
    id: 7,
    title: 'Export to LMS',
    position: { x: 100, y: 55 },
    icon: 'export',
    color: '#24be85',
    tint: 100,
    popoverContent: `Export your grades from codePost to your LMS, or other system of record.`,
  },
  {
    id: 8,
    title: 'Student feedback',
    position: { x: 100, y: 70 },
    icon: 'message',
    color: '#24be85',
    tint: 100,
    popoverContent: `Collect feedback from your students on their grading. codePost allows for students to mark which comments were most helpful, and to optionally submit regrade requests.`,
  },
  {
    id: 10,
    title: 'Collect',
    position: { x: 0, y: 20 },
    outgoingNodes: [11],
    icon: 'dummy',
    color: '#24be85',
    tint: 10,
    isCategory: true,
  },
  {
    id: 11,
    title: 'Grade',
    position: { x: 33, y: 20 },
    outgoingNodes: [12],
    icon: 'dummy',
    color: '#24be85',
    tint: 25,
    isCategory: true,
  },
  {
    id: 12,
    title: 'Review',
    position: { x: 66, y: 20 },
    outgoingNodes: [13],
    icon: 'dummy',
    color: '#24be85',
    tint: 75,
    isCategory: true,
  },
  {
    id: 13,
    title: 'Return',
    position: { x: 100, y: 20 },
    outgoingNodes: [14],
    icon: 'dummy',
    color: '#24be85',
    tint: 100,
    isCategory: true,
  },
];

export const LandingFlowChart = () => {
  return (
    <div className="flowChart">
      <FlowChart nodeList={nodes} canvasWidth={500} canvasHeight={400} />
    </div>
  );
};
