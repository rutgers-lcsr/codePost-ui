import { Icon, Layout } from 'antd';
import React from 'react';
const { useState, useEffect } = React;

import { SimpleAssignments } from './SimpleAssignments';
import { SimpleGraderRoster } from './SimpleGraderRoster';
import { SimpleMenu } from './SimpleMenu';
import { SimpleRubric } from './SimpleRubric';
import { SimpleStudentDrilldown } from './SimpleStudentDrilldown';
import { SimpleStudentSubmissions } from './SimpleStudentSubmissions';

const { Content, Sider } = Layout;

enum SCREEN {
  Assignments, // Manage Assignments
  AssignmentsMouseover, // Manage Assignments with a row highlighted
  Rubric, // Rubric
  Submissions, // Submission Student Overview
  SubmissionsMouseover, // Submission Student Overview with first row Highlighted
  StudentDrilldown, // Submission Student Drilldown
  GraderRoster, // Roster Grader
  None, // No screen showing
}

// The main Admin animation and the only one with state
// Has a counter keeping track of time steps, and on each time step, refers to a map
// to determine which child to render
function AdminAnimation() {
  const [counter, setCounter] = useState(0);
  const [pause, setPause] = useState(false);

  const numSteps = 11;

  // set the interval to incremnet the counter
  useEffect(
    () => {
      const interval = setInterval(() => {
        if (!pause) {
          setCounter((x: number) => {
            return x === numSteps ? 0 : x + 1;
          });
        } else {
          clearInterval(interval);
        }
      }, 2000);

      return () => {
        clearInterval(interval);
      };
    },
    [pause],
  );

  const calculateKeys = (time: number) => {
    switch (time) {
      case 0:
        return { select: '2', open: '', content: SCREEN.Assignments };
      case 1:
        return { select: '2', open: '', content: SCREEN.AssignmentsMouseover };
      case 2:
        return { select: '2', open: '', content: SCREEN.Rubric };
      case 3:
        return { select: '2', open: '', content: SCREEN.Rubric };
      case 4:
        return { select: '2', open: 'submissions', content: SCREEN.Rubric };
      case 5:
        return { select: '0', open: 'submissions', content: SCREEN.Submissions };
      case 6:
        return { select: '0', open: 'submissions', content: SCREEN.SubmissionsMouseover };
      case 7:
        return { select: '0', open: 'submissions', content: SCREEN.StudentDrilldown };
      case 8:
        return { select: '0', open: '', content: SCREEN.StudentDrilldown };
      case 9:
        return { select: '0', open: 'roster', content: SCREEN.StudentDrilldown };
      case 10:
        return { select: '4', open: 'roster', content: SCREEN.GraderRoster };
      case 11:
        return { select: '4', open: '', content: SCREEN.GraderRoster };
      default:
        return { select: '', open: '', content: SCREEN.None };
    }
  };

  const togglePause = () => {
    setPause(!pause);
  };
  const pauseButton = pause ? (
    <Icon type="play-circle" style={{ fontSize: 40 }} />
  ) : (
    <Icon type="pause-circle" style={{ fontSize: 40 }} />
  );

  return (
    <div className="animation--admin">
      <div style={{ maxWidth: 800, minWidth: 800, maxHeight: 500, position: 'relative' }}>
        <div
          onClick={togglePause}
          style={{ cursor: 'pointer', position: 'absolute', bottom: 15, right: 10, zIndex: 99999 }}
        >
          {pauseButton}
        </div>
        <Layout>
          <Sider width={160} className="Animation2__sider">
            <SimpleMenu number={[calculateKeys(counter).select]} openKey={[calculateKeys(counter).open]} />
          </Sider>
          <Content>
            <RenderContent screen={calculateKeys(counter).content} />
          </Content>
        </Layout>
      </div>
    </div>
  );
}

const RenderContent = (props: { screen: SCREEN }) => {
  switch (props.screen) {
    case SCREEN.Assignments:
      return <SimpleAssignments mouseOver={false} />;
    case SCREEN.AssignmentsMouseover:
      return <SimpleAssignments mouseOver={true} />;
    case SCREEN.Rubric:
      return <SimpleRubric />;
    case SCREEN.Submissions:
      return <SimpleStudentSubmissions mouseOver={false} />;
    case SCREEN.SubmissionsMouseover:
      return <SimpleStudentSubmissions mouseOver={true} />;
    case SCREEN.StudentDrilldown:
      return <SimpleStudentDrilldown student="student0" />;
    case SCREEN.GraderRoster:
      return <SimpleGraderRoster />;
    case SCREEN.None:
      return <div />;
  }
};

export { AdminAnimation };
