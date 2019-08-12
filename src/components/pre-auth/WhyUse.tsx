import * as React from 'react';

import { Tag, Typography } from 'antd';

import _ from 'lodash';

import useWindowSize from '../core/useWindowSize';

import landingVars from '../../styles/pages/_landingVars';

import PreAuthLayout from './PreAuthLayout';

interface IPageProps {
  isLoggedIn: boolean;
}

interface IProps {
  title: string;
  features: Array<string | React.ReactElement>;
  spotlights: any[];
  isFlipped: boolean;
}

const sections = [
  {
    title: 'Annotate code',
    features: [
      'Make inline comments easily, with markdown',
      <span key="template">
        Gray out template code &nbsp; <Tag>NEW</Tag>
      </span>,
      'Annotate IPython / Jupyter notebooks',
      'Annotate short-answer questions (.txt or .md)',
      'Apply rubric items while grading',
    ],
    spotlights: [
      <img
        src="https://cl.ly/9fa6855f4acf/Screen%252520Recording%2525202019-08-11%252520at%25252004.24%252520PM.gif"
        width="500"
        height="312.5"
        key="0"
      />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="1" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="2" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="3" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="4" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="5" />,
    ],
  },
  {
    title: 'For students',
    features: ['Leave feedback on feedback', 'Peer grading', 'Access scores and feedback'],
    spotlights: [
      <img
        src="https://cl.ly/9fa6855f4acf/Screen%252520Recording%2525202019-08-11%252520at%25252004.24%252520PM.gif"
        width="500"
        height="312.5"
        key="0"
      />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="1" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="2" />,
    ],
  },
  {
    title: 'For instructors',
    features: [
      'Grade student work anonymously',
      'Make sure everything gets graded',
      'Make changes to rubrics after grading',
      'Distribute work to a team of graders',
      'Audit grader consistency',
      'Learn whether students view their feedback',
    ],
    spotlights: [
      <img
        src="https://cl.ly/9fa6855f4acf/Screen%252520Recording%2525202019-08-11%252520at%25252004.24%252520PM.gif"
        width="500"
        height="312.5"
        key="0"
      />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="1" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="2" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="3" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="4" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="5" />,
    ],
  },
];

const SectionRow = (props: IProps) => {
  const [activeFeature, setActiveFeature] = React.useState(0);

  // Inline styles
  const columnStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', flexBasis: '100%', flex: '1' };
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: '50px',
  };

  // Section where we list features
  const textSection = (
    <div
      style={{
        ...columnStyle,
        textAlign: props.isFlipped ? 'center' : undefined,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '32px' }}>{props.title}</div>
      {props.features.map((feature, i) => {
        return (
          <div
            key={i.toString()}
            style={{
              fontSize: '16px',
              maxWidth: 500,
              margin: '5px 0',
              background: activeFeature === i ? '#47cc9724' : 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              padding: '5px',
              border: activeFeature === i ? '1px solid gray' : undefined,
            }}
            onClick={setActiveFeature.bind(false, i)}
          >
            {feature}
          </div>
        );
      })}
    </div>
  );

  // Section where we show a picture or GIF demonstrating the active feature
  const pictureSection = (
    <div
      style={{
        ...columnStyle,
        textAlign: !props.isFlipped ? 'right' : undefined,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {props.spotlights[activeFeature]} Content shown: {activeFeature}
      </div>
    </div>
  );

  return (
    <div key="wrapper">
      {!props.isFlipped ? (
        <div style={rowStyle}>
          {textSection}
          {pictureSection}
        </div>
      ) : (
        <div style={rowStyle}>
          {pictureSection}
          {textSection}
        </div>
      )}
      <br />
      <br />
    </div>
  );
};

const WhyUse = (props: IPageProps) => {
  const breakpoint = landingVars.breakpoints.faq;
  const windowSize = useWindowSize();

  let content;

  if (windowSize.width < breakpoint) {
    content = <div style={{ maxWidth: 500 }}>{'content goes here'}</div>;
  } else {
    content = (
      <div>
        {sections.map((section, i) => {
          return (
            <SectionRow
              key={i.toString()}
              features={section.features}
              title={section.title}
              spotlights={section.spotlights}
              isFlipped={i % 2 === 1}
            />
          );
        })}
      </div>
    );
  }

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div>
        <Typography.Title level={4}>Why use codePost?</Typography.Title>
        {content}
      </div>
    </PreAuthLayout>
  );
};
export default WhyUse;
