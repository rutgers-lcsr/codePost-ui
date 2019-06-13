import * as React from 'react';

const Testimonials = () => {
  const adamImg = require('./../../img/landing/adam_blank.jpeg');
  const eitanImg = require('./../../img/landing/eitan_mendelowitz.jpg');
  const bobImg = require('./../../img/landing/bob_sedgewick.png');

  const adamText =
    'codePost has allowed me to efficiently grade student code on its quality without\
     sacrificing my high standard of feedback.\
     Its first-class API makes it uniquely malleable to my different courses with very different requirements';
  const eitanText =
    'codePost is the best way I have found to comment on and annotate students’ programming assignments.\
   I find it much easier to give programming feedback than any other system I have tried.';
  const bobText = 'codePost has been a paradigm shifting improvement to how we grade computer science at Princeton';

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
      <Testimonial text={<div>{adamText}</div>} name="Adam Blank" thumbnail={adamImg} school="Caltech" />
      <Testimonial
        text={<div>{eitanText}</div>}
        name="Bob Sedgewick"
        thumbnail={bobImg}
        school="Princeton University"
      />
      <Testimonial
        text={<div>{bobText}</div>}
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
        fontSize: 14,
        lineHeight: 1.57,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 300,
        justifyContent: 'space-between',
      }}
    >
      {props.text}
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
