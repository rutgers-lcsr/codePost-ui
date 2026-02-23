// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { FlowChart } from './FlowChart.tsx';
import { colors } from '../../../../theme/colors';

const nodes: any[] = [
  {
    id: 0,
    title: 'Import code',
    position: { x: 0, y: 40 },
    icon: 'import',
    color: colors.brandPrimary,
    tint: 10,
    popoverContent:
      'You can integrate any system for code submission -- LMS, GitHub, or your own tool. Students submit there, and then you can review their code in codePost after import.',
  },
  {
    id: 1,
    title: 'Direct upload',
    position: { x: 0, y: 55 },
    icon: 'cloud-upload',
    color: colors.brandPrimary,
    tint: 10,
    popoverContent: `Use codePost's built-in submission system for an easy way to collect student work.`,
  },
  {
    id: 2,
    title: 'Office hours',
    position: { x: 0, y: 70 },
    icon: 'message',
    color: colors.brandPrimary,
    tint: 10,
    popoverContent:
      'Use office hours mode to give students quick feedback on their code. Students share a link to their code, you add comments, then students see the comments.',
  },
  {
    id: 3,
    title: 'Autograder',
    position: { x: 33, y: 70 },
    icon: 'code',
    color: colors.brandPrimary,
    tint: 25,
    popoverContent: `Use codePost's built in autograder, or integrate your autograder to view test output alongside student code.`,
  },
  {
    id: 4,
    title: 'Annotation',
    position: { x: 33, y: 55 },
    icon: 'highlight',
    color: colors.brandPrimary,
    tint: 25,
    popoverContent: `Effortlessly annotate your students' code with comments, points, and rubric items.`,
  },
  {
    id: 6,
    title: 'Standard Rubrics',
    position: { x: 33, y: 85 },
    icon: 'profile',
    color: colors.brandPrimary,
    tint: 25,
    popoverContent:
      'Write standard rubrics to ensure consistent grading, capture pedagogical data, and minimize copy-pasting.',
  },
  {
    id: 7,
    title: 'Quality control',
    position: { x: 66, y: 40 },
    icon: 'dashboard',
    color: colors.brandPrimary,
    tint: 75,
    popoverContent: `Manage a large course? codePost provides a birds-eye-view of the grading process to make sure everything gets graded by the right person. Monitor the work of your TAs to ensure consistent quality and fairness.`,
  },
  {
    id: 8,
    title: 'Analytics',
    position: { x: 66, y: 55 },
    icon: 'bar-chart',
    color: colors.brandPrimary,
    tint: 75,
    popoverContent: `Mine pedagogical data: learn what types of errors your students make most often.`,
  },
  {
    id: 9,
    title: 'Submission return',
    position: { x: 100, y: 40 },
    icon: 'inbox',
    color: colors.brandPrimary,
    tint: 100,
    popoverContent: `Distribute student feedback with a single click.`,
  },
  {
    id: 10,
    title: 'Export to LMS',
    position: { x: 100, y: 55 },
    icon: 'export',
    color: colors.brandPrimary,
    tint: 100,
    popoverContent: `Export grades from codePost to your LMS or any other system of record.`,
  },
  {
    id: 11,
    title: 'Student feedback',
    position: { x: 100, y: 70 },
    icon: 'like',
    color: colors.brandPrimary,
    tint: 100,
    popoverContent: `Learn whether your feedback was helpful to your students, so you can become a better feedback-giver.`,
  },
  {
    id: 12,
    title: 'Submit',
    position: { x: 0, y: 20 },
    outgoingNodes: [13],
    icon: 'dummy',
    color: colors.brandPrimary,
    tint: 10,
    isCategory: true,
  },
  {
    id: 13,
    title: 'Grade',
    position: { x: 33, y: 20 },
    outgoingNodes: [14],
    icon: 'dummy',
    color: colors.brandPrimary,
    tint: 25,
    isCategory: true,
  },
  {
    id: 14,
    title: 'Analyze',
    position: { x: 66, y: 20 },
    outgoingNodes: [15],
    icon: 'dummy',
    color: colors.brandPrimary,
    tint: 75,
    isCategory: true,
  },
  {
    id: 15,
    title: 'Return',
    position: { x: 100, y: 20 },
    outgoingNodes: [],
    icon: 'dummy',
    color: colors.brandPrimary,
    tint: 100,
    isCategory: true,
  },
  {
    id: 16,
    title: 'Regrade requests',
    position: { x: 100, y: 85 },
    icon: 'redo',
    color: colors.brandPrimary,
    tint: 100,
    popoverContent: `Allow students to request a regrade, and then respond to their requests without leaving codePost.`,
  },
];

const LandingFlowChart = () => {
  return (
    <div className="flowChart">
      <FlowChart nodeList={nodes} canvasWidth={500} canvasHeight={400} />
    </div>
  );
};

export default LandingFlowChart;
