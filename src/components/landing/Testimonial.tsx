import * as React from 'react';

import useWindowSize from '../core/useWindowSize';

import { Button } from 'antd';

import landingVars from '../../styles/pages/_landingVars';

import { Typography } from 'antd';

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

/*************************************************************************************/
/* TEXT
/*************************************************************************************/

const adamText = (
  <span style={{ fontStyle: 'italic' }}>
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
  <span style={{ fontStyle: 'italic' }}>
    codePost is the best way I have found to comment on and annotate students’ programming assignments. I find it{' '}
    <Typography.Text mark className="codePost-highlight">
      much easier to give programming feedback than any other system I have tried.
    </Typography.Text>
  </span>
);

const bobText = (
  <span style={{ fontStyle: 'italic' }}>
    codePost has been a{' '}
    <Typography.Text mark className="codePost-highlight">
      paradigm shifting improvement
    </Typography.Text>{' '}
    to how we grade computer science at Princeton.
  </span>
);

const robertText = (
  <span style={{ fontStyle: 'italic' }}>
    codePost is a{' '}
    <Typography.Text mark className="codePost-highlight">
      game changer.
    </Typography.Text>{' '}
    It has completely eliminated the need for students to print code for grading.{' '}
    <Typography.Text mark className="codePost-highlight">
      It is honestly easier to grade on codePost than any other method I've tried in the past.
    </Typography.Text>
  </span>
);

const niemaText = (
  <span style={{ fontStyle: 'italic' }}>
    With the rapid growth of C.S. education, I was{' '}
    <Typography.Text mark className="codePost-highlight">
      worried about how I would scale my courses
    </Typography.Text>{' '}
    to meet the needs of my students.
    <Typography.Text mark className="codePost-highlight">
      With codePost's intuitive UI and top-notch Python API
    </Typography.Text>
    , I have been able to build workflows that have made all aspects of executing my course extremely streamlined,{' '}
    <Typography.Text mark className="codePost-highlight">
      even with >500 students.
    </Typography.Text>
  </span>
);

const kateText = (
  <span style={{ fontStyle: 'italic' }}>
    codePost improved my grading efficiency:{' '}
    <Typography.Text mark className="codePost-highlight">
      what used to take 4 hours to grade now takes 1 hour.
    </Typography.Text>{' '}
    This tool allowed me to{' '}
    <Typography.Text mark className="codePost-highlight">
      automate the repetitive manual tasks and focus my entire attention on the quality of students’ solutions.
    </Typography.Text>
  </span>
);

const nohaText = (
  <span style={{ fontStyle: 'italic' }}>
    codePost has been a great help as it{' '}
    <Typography.Text mark className="codePost-highlight">
      saved me tons of time and allowed me to focus on my students more.
    </Typography.Text>
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
        fontSize: 16,
        lineHeight: 1.57,
        maxWidth: windowSize.width < landingVars.breakpoints.testimonial ? 600 : 300,
        marginLeft: 15,
        marginBottom: windowSize.width < landingVars.breakpoints.testimonial ? 30 : 0,
        marginTop: windowSize.width < landingVars.breakpoints.testimonial ? 20 : 0,
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
      {props.text}
    </div>
  );
};

const testimonials = [
  <Testimonial text={<div>{adamText}</div>} name="Adam Blank" thumbnail={adamImg} school="Caltech" />,
  <Testimonial text={<div>{bobText}</div>} name="Robert Sedgewick" thumbnail={bobImg} school="Princeton University" />,
  <Testimonial
    text={<div>{eitanText}</div>}
    name="Eitan Mendelowitz"
    thumbnail={eitanImg}
    school="Mount Holyoke College"
  />,
  <Testimonial
    text={<div>{robertText}</div>}
    name="Robert Adams"
    thumbnail={robertImg}
    school="Grand Valley State University"
  />,
  <Testimonial text={<div>{kateText}</div>} name="Kate Holdener" thumbnail={kateImg} school="Saint Louis University" />,
  <Testimonial text={<div>{niemaText}</div>} name="Niema Moshiri" thumbnail={niemaImg} school="UCSD" />,
  <Testimonial text={<div>{nohaText}</div>} name="Noha Hazzazi" thumbnail={nohaImg} school="Howard University" />,
];

/*************************************************************************************/

const Testimonials = () => {
  const [startIndex, setStartIndex] = React.useState(0);
  const [permutation] = React.useState(shuffle(testimonials.map((el, i) => i)));

  const windowSize = useWindowSize();

  return (
    <div
      style={{
        width: '100%',
        alignItems: 'center',
      }}
      className={`display-flex justify-content-space-between flex-direction-${
        windowSize.width < landingVars.breakpoints.testimonial ? 'column' : 'row'
      } align-items-${windowSize.width < landingVars.breakpoints.testimonial ? 'center' : 'start'}`}
    >
      {startIndex === 0 ? null : (
        <Button icon="arrow-left" onClick={() => setStartIndex(Math.max(0, startIndex - 1))} />
      )}
      {testimonials[permutation[startIndex]]}
      {testimonials[permutation[startIndex + 1]]}
      {testimonials[permutation[startIndex + 2]]}
      {startIndex === testimonials.length - 3 ? null : (
        <Button icon="arrow-right" onClick={() => setStartIndex(Math.min(testimonials.length - 3, startIndex + 1))} />
      )}
    </div>
  );
};

export { Testimonials, Testimonial };
