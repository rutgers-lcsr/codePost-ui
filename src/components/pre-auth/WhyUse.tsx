import * as React from 'react';

import { Divider, Tag, Typography } from 'antd';

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
  captions: Array<string | React.ReactElement>;
  spotlights: any[];
  isFlipped: boolean;
}

const Video = (props: { url: string }) => {
  return (
    <div style={{ width: '550px', height: '344px' }}>
      <video controls width="100%" height="100%">
        <source type="video/mp4" src={props.url} />
      </video>
    </div>
  );
};

const sections = [
  {
    title: 'Annotate code',
    features: [
      'Make inline comments easily, with markdown',
      <span key="template">
        Gray out template code &nbsp; <Tag>NEW</Tag>
      </span>,
      'Annotate IPython / Jupyter notebooks',
      <span key="text">
        Annotate short-answer questions (<Typography.Text code>.txt</Typography.Text> or{' '}
        <Typography.Text code>.md</Typography.Text>)
      </span>,
      'Apply rubric items while grading',
    ],
    spotlights: [
      <img
        src="https://cl.ly/5be426469f4b/Image%2525202019-08-12%252520at%2525205.46.08%252520PM.png"
        width="550"
        height="344"
        key="0"
      />,
      <img
        src="https://cl.ly/189610d312b3/Image%2525202019-08-12%252520at%2525205.39.12%252520PM.png"
        width="550"
        height="344"
        key="1"
      />,
      <Video key="2" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/jupyter.mp4" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="3" />,
      <img
        src="https://cl.ly/5e8d9b9f695d/Screen%252520Recording%2525202019-08-12%252520at%25252005.48%252520PM.gif"
        width="550"
        height="344"
        key="4"
      />,
    ],
    captions: [
      `codePost comments sit alongside code so they're easier to read.
      You can also use Markdown to format to your heart's content.`,
      `codePost can use a template file to de-emphasize template code shared by all submissions,
      making it easier to focus on the student's work.`,
      `codePost allows annotations to be place on rendered IPython / Jupyter notebooks, so you can
      see results while reviewing.`,
      `codePost supports text-only formats as well as code. If your students upload .txt files or .md files,
      you can annotate those just like you would annotate code. We'll render the .md files for you, too.`,
    ],
  },
  {
    title: 'For students',
    features: ['Leave feedback on feedback', 'Peer grading', 'Access scores and feedback'],
    spotlights: [
      <img
        src="https://codepost-videos.s3.us-east-2.amazonaws.com/feedback_on_feedback.png"
        width="550"
        height="344"
        key="0"
      />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="1" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="2" />,
    ],
    captions: [],
  },
  {
    title: 'For instructors',
    features: [
      'Make sure everything gets graded',
      'Grade student work anonymously',
      'Make changes to rubrics after grading',
      'Distribute work to a team of graders',
      'Audit grader consistency',
      'Learn whether students view their feedback',
    ],
    spotlights: [
      <img
        src="https://cl.ly/0444ac251096/Image%2525202019-08-13%252520at%25252011.36.30%252520PM.png"
        width="550"
        height="344"
        key="0"
      />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="1" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="2" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="3" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="4" />,
      <div style={{ width: 500, height: 312.5, background: 'red' }} key="5" />,
    ],
    captions: [],
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
  };

  // Section where we list features
  const textSection = (
    <div
      style={{
        ...columnStyle,
        textAlign: props.isFlipped ? 'right' : undefined,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: '32px',
        }}
      >
        {props.title}
      </div>
      {props.features.map((feature, i) => {
        return (
          <div
            key={i.toString()}
            style={{
              fontSize: '16px',
              margin: '5px 0',
              background: activeFeature === i ? '#47cc9724' : 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              padding: '5px',
              border: activeFeature === i ? '1px solid gray' : undefined,
              marginRight: props.isFlipped ? undefined : '50px',
              marginLeft: props.isFlipped ? '50px' : undefined,
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
        {props.spotlights[activeFeature]} <div style={{ height: '15px' }} /> {props.captions[activeFeature]}
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
            <div key={i.toString()}>
              <SectionRow
                features={section.features}
                title={section.title}
                spotlights={section.spotlights}
                captions={section.captions}
                isFlipped={i % 2 === 1}
              />
              {i !== sections.length - 1 ? <Divider style={{ margin: '75px 0' }} /> : null}
            </div>
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
