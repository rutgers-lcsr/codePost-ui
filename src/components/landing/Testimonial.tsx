import * as React from 'react';

import useWindowSize from '../core/useWindowSize';

import landingVars from '../../styles/pages/_landingVars';

import { Typography } from 'antd';

const Testimonials = () => {
  const adamImg = require('./../../img/landing/compressed/adam_blank.jpeg');
  const eitanImg = require('./../../img/landing/compressed/eitan_mendelowitz.jpg');
  const bobImg = require('./../../img/landing/compressed/bob_sedgewick.jpg');

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

  const windowSize = useWindowSize();

  const bobText = (
    <span style={{ fontStyle: 'italic' }}>
      codePost has been a{' '}
      <Typography.Text mark className="codePost-highlight">
        paradigm shifting improvement
      </Typography.Text>{' '}
      to how we grade computer science at Princeton.
    </span>
  );

  return (
    <div
      style={{
        width: '100%',
      }}
      className={`display-flex justify-content-space-between flex-direction-${
        windowSize.width < landingVars.breakpoints.testimonial ? 'column' : 'row'
      } align-items-${windowSize.width < landingVars.breakpoints.testimonial ? 'center' : 'start'}`}
    >
      <Testimonial text={<div>{adamText}</div>} name="Adam Blank" thumbnail={adamImg} school="Caltech" />
      <Testimonial
        text={<div>{bobText}</div>}
        name="Robert Sedgewick"
        thumbnail={bobImg}
        school="Princeton University"
      />
      <Testimonial
        text={<div>{eitanText}</div>}
        name="Eitan Mendelowitz"
        thumbnail={eitanImg}
        school="Mount Holyoke College"
      />
    </div>
  );
};

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
        <img src={props.thumbnail} style={{ width: 40, borderRadius: 20, marginRight: 15 }} />
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

export { Testimonials, Testimonial };
