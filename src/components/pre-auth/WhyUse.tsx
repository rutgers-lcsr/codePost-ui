import * as React from 'react';

import { Divider, Tag, Typography } from 'antd';

import _ from 'lodash';

import useWindowSize from '../core/useWindowSize';

import landingVars from '../../styles/pages/_landingVars';

const midBreakPoint = landingVars.breakpoints.whyUse;

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
  maxPictureWidth: number;
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
      <Video key="2" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/ipython.mp4" />,
      <Video key="3" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/text_files.mp4" />,
      <Video key="4" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/rubrics.mp4" />,
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
      `When grading with codePost, you and your graders can apply rubrics. You can also track how rubrics are applied,
      and even retroactively alter rubric items after they've been used.`,
    ],
  },
  {
    title: 'For students',
    features: ['Leave feedback on feedback', 'Peer grading', 'Access scores and feedback'],
    spotlights: [
      <img
        src="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/feedback_on_feedback.png"
        width="550"
        height="344"
        key="0"
      />,
      <Video key="1" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/peer-grading.mp4" />,
      <Video key="2" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/students.mp4" />,
    ],
    captions: [
      `In codePost, students can leave feedback on the feedback they receive. Course leaders can use this
      information to fine-tune their rubrics, as well as evaluate graders.`,
      `You can take advantage in peer grading with codePost. Just make your students "graders" and enable anonymous
      grading mode.`,
      'Students use codePost to access their scores and feedback.',
    ],
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
      <Video key="1" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/anonymous-grading.mp4" />,
      <Video key="2" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/change-rubric.mp4" />,
      <Video key="3" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/distribute-work.mp4" />,
      <Video
        key="4"
        url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/grader-consistency.mp4"
      />,
      <Video key="5" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/feedback-views.mp4" />,
    ],
    captions: [
      `codePost gives course leaders a dashboard that helps track the progress of grading, so no submission
    slips through the cracks.`,
      `Anonymous Grading Mode hides student identity from graders, preventing conflicts of interest or implicit
      bias to influence grading.`,
      `Changes made to rubrics after grading propagate to all submissions to which the rubric has been applied.
      So you can easily change a deduction or fix a typo.`,
      `codePost's queue-based work distribution system removes the need for instructors to assign submissions
      to graders for review. You can also order the queue however you want`,
      `Some graders can be harsher score-wise than others. This isn't fair to students. codePost lets you audit
    grader work to ensure consistency.`,
      'See whether students are viewing the feedback you spend so much time giving!',
    ],
  },
];

const SectionRow = (props: IProps) => {
  const [activeFeature, setActiveFeature] = React.useState(0);
  const windowSize = useWindowSize();

  // Inline styles
  const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    flexBasis: '100%',
    flex: '1',
  };
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: windowSize.width < midBreakPoint ? 'column' : ('row' as 'row'),
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'center',
  };

  // Section where we list features
  const textSection = (
    <div
      style={{
        ...columnStyle,
        textAlign: windowSize.width < midBreakPoint ? 'center' : props.isFlipped ? 'right' : undefined,
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
      <div
        style={{
          marginRight: !props.isFlipped && windowSize.width > midBreakPoint ? '50px' : undefined,
          marginLeft: props.isFlipped && windowSize.width > midBreakPoint ? '50px' : undefined,
        }}
      >
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
                transition: '0.3s ease',
                fontWeight: activeFeature === i ? 500 : 400,
                textAlign: windowSize.width < midBreakPoint ? 'center' : 'left',
              }}
              onClick={setActiveFeature.bind(false, i)}
            >
              {feature}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Section where we show a picture or GIF demonstrating the active feature
  const scaleFactor =
    windowSize.width < props.maxPictureWidth ? `scale(${windowSize.width / props.maxPictureWidth})` : '';
  const pictureSection = (
    <div
      style={{
        ...columnStyle,
        textAlign: !props.isFlipped ? 'right' : undefined,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          alignItems: 'center',
        }}
      >
        <div style={{ transform: scaleFactor }}>{props.spotlights[activeFeature]}</div>
        <div style={{ height: '15px' }} /> {props.captions[activeFeature]}
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
  let content;

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
              maxPictureWidth={600}
            />
            {i !== sections.length - 1 ? <Divider style={{ margin: '75px 0' }} /> : null}
          </div>
        );
      })}
    </div>
  );

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
