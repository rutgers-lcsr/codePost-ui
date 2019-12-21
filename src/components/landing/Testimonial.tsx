import * as React from 'react';

import useWindowSize from '../core/useWindowSize';

import { Divider } from 'antd';

import landingVars from '../../styles/pages/_landingVars';

import { Typography } from 'antd';

import Carousel from '@brainhubeu/react-carousel';
import '@brainhubeu/react-carousel/lib/style.css';

/*************************************************************************************/
/* IMAGES
/*************************************************************************************/

const adamImg = require('./../../img/landing/compressed/adam_blank.jpeg');
const eitanImg = require('./../../img/landing/compressed/eitan_mendelowitz.jpg');
const bobImg = require('./../../img/landing/compressed/bob_sedgewick.jpg');
const robertImg = require('./../../img/landing/compressed/robert_adams.jpg');
const niemaImg = require('./../../img/landing/compressed/niema_moshiri.jpg');
const kateImg = require('./../../img/landing/compressed/kate_holdener.jpg');
const nohaImg = require('./../../img/landing/compressed/noha_hazzazi.jpg');
const abbasImg = require('./../../img/landing/compressed/abbas_attarwala.jpg');
const kateKImg = require('./../../img/landing/compressed/kate_kharitonova.jpg');
const chrisImg = require('./../../img/landing/compressed/chris_bourke.jpg');

/*************************************************************************************/
/* TEXT
/*************************************************************************************/

const defaultTextStyle: React.CSSProperties = {
  fontStyle: 'italic',
  fontSize: 16,
  lineHeight: 1.57,
  color: 'grey',
};

const adamText = (
  <span style={{ ...defaultTextStyle, fontSize: 15 }}>
    codePost has allowed me to{' '}
    <Typography.Text mark className="codePost-highlight">
      efficiently grade student code
    </Typography.Text>{' '}
    on its quality without sacrificing my high standard of feedback. Its{' '}
    <Typography.Text mark className="codePost-highlight">
      first-class API
    </Typography.Text>{' '}
    makes it uniquely malleable to my different courses with very different requirements.
  </span>
);

const eitanText = (
  <span style={defaultTextStyle}>
    codePost is the best way I have found to comment on and annotate students’ programming assignments. I find it{' '}
    <Typography.Text mark className="codePost-highlight">
      much easier to give programming feedback than any other system I have tried.
    </Typography.Text>
  </span>
);

const bobText = (
  <span style={{ ...defaultTextStyle, fontSize: 18 }}>
    codePost has been a{' '}
    <Typography.Text mark className="codePost-highlight">
      paradigm shifting improvement
    </Typography.Text>{' '}
    to how we grade computer science at Princeton.
  </span>
);

const robertText = (
  <span style={defaultTextStyle}>
    codePost is a{' '}
    <Typography.Text mark className="codePost-highlight">
      game changer.
    </Typography.Text>{' '}
    It has completely eliminated the need for students to print code for grading. It is honestly{' '}
    <Typography.Text mark className="codePost-highlight">
      easier to grade on codePost than any other method I've tried in the past.
    </Typography.Text>
  </span>
);

const niemaText = (
  <span style={{ ...defaultTextStyle, fontSize: 15 }}>
    With the rapid growth of C.S. education, I was{' '}
    <Typography.Text mark className="codePost-highlight">
      worried about how I would scale my courses
    </Typography.Text>{' '}
    to meet the needs of my students. With codePost's{' '}
    <Typography.Text mark className="codePost-highlight">
      intuitive UI and top-notch Python API
    </Typography.Text>
    , I have been able to build workflows that have made all aspects of executing my course extremely streamlined,{' '}
    <Typography.Text mark className="codePost-highlight">
      even with >500 students.
    </Typography.Text>
  </span>
);

const kateText = (
  <span style={{ ...defaultTextStyle, fontSize: 15 }}>
    codePost improved my grading efficiency:{' '}
    <Typography.Text mark className="codePost-highlight">
      what used to take 4 hours to grade now takes 1 hour.
    </Typography.Text>{' '}
    This tool allowed me to automate the repetitive manual tasks and{' '}
    <Typography.Text mark className="codePost-highlight">
      focus my entire attention on the quality of students’ solutions.
    </Typography.Text>
  </span>
);

const nohaText = (
  <span style={{ ...defaultTextStyle, fontSize: 18 }}>
    codePost has been a great help as it{' '}
    <Typography.Text mark className="codePost-highlight">
      saved me tons of time{' '}
    </Typography.Text>
    and allowed me to{' '}
    <Typography.Text mark className="codePost-highlight">
      focus on my students more.
    </Typography.Text>
  </span>
);

const abbasText = (
  <span style={{ ...defaultTextStyle, fontSize: 15 }}>
    <Typography.Text mark className="codePost-highlight">
      My graders, myself and my students love codePost.
    </Typography.Text>{' '}
    The quality of feedback that I can provide to my students is far richer; my graders annotate problematic code and
    provide high-quality feedback to my students that previously was difficult.
    <div>
      <Typography.Text mark className="codePost-highlight">
        I recommend codePost very highly!
      </Typography.Text>
    </div>
  </span>
);

const kateKText = (
  <span style={{ ...defaultTextStyle, fontSize: 15 }}>
    The ability to see a properly-rendered Jupyter notebook in codePost has been{' '}
    <Typography.Text mark className="codePost-highlight">
      invaluable in our Data Science courses
    </Typography.Text>
    . codePost's team has also been{' '}
    <Typography.Text mark className="codePost-highlight">
      very responsive to our feedback
    </Typography.Text>{' '}
    and feature requests.
  </span>
);

const chrisText = (
  <span style={{ ...defaultTextStyle, fontSize: 13, lineHeight: 1.2 }}>
    codePost has really improved the way that we grade and evaluate code. The rubric feature has ensured a{' '}
    <Typography.Text mark className="codePost-highlight">
      higher level of consistency
    </Typography.Text>{' '}
    across many graders. My favorite part has been its outstanding API and provided python wrapper library which allows
    me to{' '}
    <Typography.Text mark className="codePost-highlight">
      fully automate
    </Typography.Text>{' '}
    the grading assignment process. I definitely saw a{' '}
    <Typography.Text mark className="codePost-highlight">
      greater improvement in students
    </Typography.Text>{' '}
    as a result of codePost.
  </span>
);

/*************************************************************************************/

// Source: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a: any[]) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

const Testimonial = (props: { text: React.ReactElement; thumbnail: string; name: string; school: string }) => {
  const windowSize = useWindowSize();

  return (
    <div
      style={{
        maxWidth: windowSize.width < landingVars.breakpoints.testimonial ? 600 : 300,
        marginLeft: 15,
        marginBottom: windowSize.width < landingVars.breakpoints.testimonial ? 30 : 0,
        marginTop: windowSize.width < landingVars.breakpoints.testimonial ? 20 : 0,
        padding: '0px 6px',
      }}
      className="display-flex flex-direction-column justify-content-flex-start"
    >
      <div className="display-flex flex-direction-row justify-content-flex-start align-items-center">
        <img alt="" src={props.thumbnail} style={{ width: 40, borderRadius: 20, marginRight: 15 }} />
        <div className="display-flex flex-direction-column" style={{ fontSize: 17, lineHeight: 1.18 }}>
          <div style={{ fontWeight: 600 }}>{props.name}</div>
          <div>{props.school}</div>
        </div>
      </div>
      <div style={{ height: windowSize.width < landingVars.breakpoints.testimonial ? 10 : 22 }} />
      <div style={{ textAlign: 'center' }}>{props.text}</div>
    </div>
  );
};

const testimonials = [
  <Testimonial text={adamText} name="Adam Blank" thumbnail={adamImg} school="Caltech" />,
  <Testimonial text={bobText} name="Robert Sedgewick" thumbnail={bobImg} school="Princeton University" />,
  <Testimonial text={eitanText} name="Eitan Mendelowitz" thumbnail={eitanImg} school="Mount Holyoke College" />,
  <Testimonial text={robertText} name="Robert Adams" thumbnail={robertImg} school="Grand Valley State University" />,
  <Testimonial text={kateText} name="Kate Holdener" thumbnail={kateImg} school="Saint Louis University" />,
  <Testimonial text={niemaText} name="Niema Moshiri" thumbnail={niemaImg} school="UC San Diego" />,
  <Testimonial text={nohaText} name="Noha Hazzazi" thumbnail={nohaImg} school="Howard University" />,
  <Testimonial text={abbasText} name="Abbas Attarwala" thumbnail={abbasImg} school="Boston University" />,
  <Testimonial text={kateKText} name="Kate Kharitonova" thumbnail={kateKImg} school="UC Santa Barbara" />,
  <Testimonial text={chrisText} name="Chris Bourke" thumbnail={chrisImg} school="University of Nebraska" />,
];

/*************************************************************************************/

const Testimonials = () => {
  const [permutation] = React.useState(testimonials.slice(0, 2).concat(shuffle(testimonials.slice(2))));

  const windowSize = useWindowSize();

  const slidesPerPage = windowSize.width < landingVars.breakpoints.testimonial ? 1 : 3;

  return (
    <div>
      <div className={'display-flex justify-content-center flex-direction-column align-items-center'}>
        <Typography.Title level={3}>codePost isn’t just another grading tool</Typography.Title>
        <span style={{ maxWidth: '700px', lineHeight: '24px', fontSize: '16px' }}>
          <p style={{ breakInside: 'avoid' }}>
            We rebuilt the feedback-giving process from the ground up to make you brilliant at what you do: teaching the
            next generation of programmers.
          </p>
          <p style={{ breakInside: 'avoid' }}>
            codePost is fast and easy-to-use.{' '}
            <span style={{ fontWeight: 600, color: '#24be85' }}>Actually easy to use.</span> And it includes advanced
            features that will supercharge your teaching and save you time.
          </p>
          <p style={{ breakInside: 'avoid' }}>
            Leave comments on code with your keyboard. Write tests that compare student code against solution code in
            seconds. Triage regrade requests. To name but a few.
          </p>
        </span>
        <br />
      </div>
      <br />
      <br />
      <Carousel slidesPerPage={slidesPerPage} arrows infinite>
        {permutation}
      </Carousel>
      <Divider />
    </div>
  );
};

export { Testimonials, Testimonial };
