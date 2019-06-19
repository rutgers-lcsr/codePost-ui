import * as React from 'react';

import { Typography } from 'antd';

const Testimonials = () => {
  const adamImg = require('./../../img/landing/adam_blank.jpeg');
  const eitanImg = require('./../../img/landing/eitan_mendelowitz.jpg');
  const bobImg = require('./../../img/landing/bob_sedgewick.png');

  const adamText = (
    <span>
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
    <span>
      codePost is the best way I have found to comment on and annotate students’ programming assignments. I find it{' '}
      <Typography.Text mark className="codePost-highlight">
        much easier to give programming feedback than any other system I have tried.
      </Typography.Text>
    </span>
  );

  const bobText = (
    <span>
      codePost has been a{' '}
      <Typography.Text mark className="codePost-highlight">
        paradigm shifting improvement
      </Typography.Text>{' '}
      to how we grade computer science at Princeton.
    </span>
  );

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
      <Testimonial text={<div>{adamText}</div>} name="Adam Blank" thumbnail={adamImg} school="Caltech" />
      <Testimonial text={<div>{bobText}</div>} name="Bob Sedgewick" thumbnail={bobImg} school="Princeton University" />
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
  return (
    <div
      style={{
        fontSize: 16,
        lineHeight: 1.57,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 300,
        justifyContent: 'space-between',
      }}
    >
      {props.text}
      <br />
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
        <img src={props.thumbnail} style={{ width: 40, borderRadius: 20, marginRight: 15 }} />
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 17, lineHeight: 1.18 }}>
          <div style={{ fontWeight: 600 }}>{props.name}</div>
          <div>{props.school}</div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
