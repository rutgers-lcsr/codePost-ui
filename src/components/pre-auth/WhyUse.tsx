import * as React from 'react';

import { Divider, Typography } from 'antd';

import useWindowSize from '../core/useWindowSize';

import landingVars from '../../styles/pages/_landingVars';

import PreAuthLayout from './PreAuthLayout';

const midBreakPoint = landingVars.breakpoints.whyUse;

interface IPageProps {
  isLoggedIn: boolean;
}

interface IProps {
  title: string;
  features: Array<string | React.ReactElement>;
  captions: Array<string | React.ReactElement>;
  spotlights: any[];
  isFlipped: boolean;
  name: string;
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
    name: 'annotate',
    features: [
      'Make inline comments easily, with markdown',
      <span key="template">Gray out template code</span>,
      'Annotate IPython / Jupyter notebooks',
      <span key="text">
        Annotate short-answer questions (<Typography.Text code>.txt</Typography.Text> or{' '}
        <Typography.Text code>.md</Typography.Text>)
      </span>,
      'Apply rubric items while grading',
      <span key="template">Collaboratively create the rubric</span>,
      'Dark Mode!',
    ],
    spotlights: [
      <img
        src="https://cl.ly/5be426469f4b/Image%2525202019-08-12%252520at%2525205.46.08%252520PM.png"
        width="550"
        height="344"
        key="markdown"
        alt="inline markdown comments"
      />,
      <img
        src="https://cl.ly/189610d312b3/Image%2525202019-08-12%252520at%2525205.39.12%252520PM.png"
        width="550"
        height="344"
        key="template"
        alt="template code"
      />,
      <Video key="jupyter" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/ipython.mp4" />,
      <Video key="text" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/text_files.mp4" />,
      <Video key="rubric" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/rubrics.mp4" />,
      <Video
        key="collab"
        url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/collaborative_rubric.mp4"
      />,
      <img src="https://cl.ly/40709b6a88c4/DarkMode.png" width="550" height="344" key="dark" alt="dark mode" />,
    ],
    captions: [
      `Comments sit alongside code so they're easier to read.
      You can also use Markdown to format to your heart's content.`,
      `Use a template file to de-emphasize template code shared by all submissions,
      making it easier to focus on the student's work.`,
      `Place annotations on rendered IPython / Jupyter notebooks, so you can
      see results while reviewing.`,
      `If your students upload .txt files or .md files, you can annotate those just like you would annotate code. We'll render the .md files for you, too.`,
      `Apply rubrics, track how they are applied, and even retroactively alter rubric items after they've been used.`,
      `With this optional setting, admins can allow graders to participate in writing the rubric while grading.
      Easily create new rubric comments when discovering common issues in the submissions.`,
    ],
  },
  {
    title: 'For students',
    name: 'students',
    features: ['Leave feedback on feedback', 'Peer grading', 'Access scores and feedback', 'Remote office hours'],
    spotlights: [
      <img
        src="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/feedback_on_feedback.png"
        width="550"
        height="344"
        key="0"
        alt="feedback on feedback"
      />,
      <Video key="1" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/peer-grading.mp4" />,
      <Video key="2" url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/students.mp4" />,
      <Video
        key="3"
        url="https://codepost-videos.s3.us-east-2.amazonaws.com/why-use-codepost/remote-office-hours.mp4"
      />,
    ],
    captions: [
      `Students can leave feedback on the feedback they receive. Course leaders can use this
      information to fine-tune their rubrics, as well as evaluate graders.`,
      `Take advantage in peer grading. Just make your students "graders" and enable anonymous grading mode.`,
      'Students can access their scores and feedback.',
      `You can give live feedback on code that students upload, allowing you to provide office-hours quality
        feedback remotely!`,
    ],
  },
  {
    title: 'For instructors',
    name: 'instructors',
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
        alt="grader management"
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
      `Use a real-time dashboard to track the progress of grading, so no submission slips through the cracks.`,
      `Send assignment submissions through Moss for plagiarism detection, making it easy to
    run routine checks.`,
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
        textAlign: windowSize.width < midBreakPoint ? 'center' : undefined,
        marginRight: !props.isFlipped && windowSize.width > midBreakPoint ? '50px' : undefined,
        marginLeft: props.isFlipped && windowSize.width > midBreakPoint ? '50px' : undefined,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: '36px',
          marginBottom: 20,
        }}
      >
        {props.title}
      </div>
      <div>
        {props.features.map((feature, _i) => {
          return (
            <div
              key={i.toString()}
              style={{
                fontSize: '16px',
                margin: '5px 0',
                background: activeFeature === i ? '#24be85' : 'none',
                color: activeFeature === i ? 'white' : 'black',
                borderRadius: '2px',
                cursor: 'pointer',
                padding: '10px',
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
  const boxShadow =
    '8px 8px 22px 0 hsla(0, 0%, 84.7%, 0.25), 0 0 2px 0 rgba(0, 0, 0, 0.15), 10px 25px 20px 0 rgba(0, 0, 0, 0.05)';
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
          fontSize: 18,
          fontWeight: 300,
          color: 'grey',
          fontStyle: 'italic',
        }}
      >
        <div
          style={{
            transform: scaleFactor,
            boxShadow,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {props.spotlights[activeFeature]}
        </div>
        <div style={{ height: '15px' }} /> {props.captions[activeFeature]}
      </div>
    </div>
  );

  return (
    <div key="wrapper" id={props.name}>
      {!props.isFlipped || windowSize.width < midBreakPoint ? (
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
      {sections.map((section, _i) => {
        return (
          <div key={i.toString()}>
            <SectionRow
              features={section.features}
              title={section.title}
              spotlights={section.spotlights}
              captions={section.captions}
              isFlipped={i % 2 === 1}
              maxPictureWidth={600}
              name={section.name}
            />
            {i !== sections.length - 1 ? <Divider style={{ margin: '75px 0' }} /> : null}
          </div>
        );
      })}
    </div>
  );

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div id="WhyUse">
        <div style={{ marginBottom: 75, textAlign: 'center' }}>
          <Typography.Title level={1} style={{ fontSize: 30, color: 'black' }}>
            codePost users asked for these features, <span style={{ color: '#24be85' }}>so we built them.</span>{' '}
          </Typography.Title>
        </div>
        {content}
      </div>
    </PreAuthLayout>
  );
};
export default WhyUse;
