// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import useWindowSize from '../core/useWindowSize';

import { DoubleRightOutlined } from '@ant-design/icons';

import { Button, Divider, Typography } from 'antd';

import landingVars from '../../styles/pages/_landingVars';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { A11y, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import PreAuthLayout from '../pre-auth/PreAuthLayout';
import { colors } from '../../theme/colors';

/*************************************************************************************/
/* IMAGES
/*************************************************************************************/

import abbasImg from './../../img/landing/compressed/abbas_attarwala.jpg';
import adamImg from './../../img/landing/compressed/adam_blank.jpeg';
import alekseyImg from './../../img/landing/compressed/aleksey_gurtovoy.jpg';
import bobImg from './../../img/landing/compressed/bob_sedgewick.jpg';
import chrisImg from './../../img/landing/compressed/chris_bourke.jpg';
import eitanImg from './../../img/landing/compressed/eitan_mendelowitz.jpg';
import kateImg from './../../img/landing/compressed/kate_holdener.jpg';
import kateKImg from './../../img/landing/compressed/kate_kharitonova.jpg';
import michaelImg from './../../img/landing/compressed/michael_clarkson.jpg';
import niemaImg from './../../img/landing/compressed/niema_moshiri.jpg';
import nohaImg from './../../img/landing/compressed/noha_hazzazi.jpg';
import robertImg from './../../img/landing/compressed/robert_adams.jpg';

/*************************************************************************************/
/* TEXT
/*************************************************************************************/

const defaultTextStyle: React.CSSProperties = {
  fontStyle: 'italic',
  fontSize: 16,
  lineHeight: 1.57,
  color: '#545454',
};

const adamText = (
  <span style={{ ...defaultTextStyle, fontSize: '94%' }}>
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
  <span style={{ ...defaultTextStyle, fontSize: '100%' }}>
    codePost is the best way I have found to comment on and annotate students’ programming assignments. I find it{' '}
    <Typography.Text mark className="codePost-highlight">
      much easier to give programming feedback than any other system I have tried.
    </Typography.Text>
  </span>
);

const bobText = (
  <span style={{ ...defaultTextStyle, fontSize: '107%' }}>
    codePost has been a{' '}
    <Typography.Text mark className="codePost-highlight">
      paradigm shifting improvement
    </Typography.Text>{' '}
    to how we grade computer science at Princeton.
  </span>
);

const robertText = (
  <span style={{ ...defaultTextStyle, fontSize: '97%' }}>
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
  <span style={{ ...defaultTextStyle, fontSize: '94%' }}>
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
      even with {'>'} 500 students.
    </Typography.Text>
  </span>
);

const kateText = (
  <span style={{ ...defaultTextStyle, fontSize: '87%' }}>
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
  <span style={{ ...defaultTextStyle, fontSize: '107%' }}>
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
  <span style={{ ...defaultTextStyle, fontSize: '94%' }}>
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
  <span style={{ ...defaultTextStyle, fontSize: '92%' }}>
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
  <span style={{ ...defaultTextStyle, fontSize: '83%' }}>
    codePost has really improved the way that we grade and evaluate code. The rubric feature has ensured a{' '}
    <Typography.Text mark className="codePost-highlight">
      higher level of consistency
    </Typography.Text>{' '}
    across many graders. My favorite part has been its outstanding API and wrapper library which allows me to{' '}
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

const alekseyText = (
  <span style={{ ...defaultTextStyle, fontSize: '88%' }}>
    codePost{' '}
    <Typography.Text mark className="codePost-highlight">
      changed not only the way I grade assignments, but also the way I teach.
    </Typography.Text>{' '}
    The ability to provide students with personalized, targeted feedback on their submissions at scale allowed me to
    experiment with things like graded in-class assignments and feel{' '}
    <Typography.Text mark className="codePost-highlight">
      more connected with each student and their learning journey.
    </Typography.Text>
  </span>
);

const michaelText = (
  <span style={{ ...defaultTextStyle, fontSize: '94%' }}>
    codePost's annotation UI has made it{' '}
    <Typography.Text mark className="codePost-highlight">
      much easier to give comprehensive and consistent feedback
    </Typography.Text>{' '}
    to students about their code quality. The codePost team has been a pleasure to work with, even adding a major
    feature (regrading) quite quickly.
  </span>
);

interface TestimonialData {
  text: React.ReactElement;
  name: string;
  thumbnail: string;
  school: string;
}

const testmonialInfo: TestimonialData[] = [
  { text: adamText, name: 'Adam Blank', thumbnail: adamImg, school: 'Caltech' },
  { text: bobText, name: 'Robert Sedgewick', thumbnail: bobImg, school: 'Princeton University' },
  { text: kateText, name: 'Kate Holdener', thumbnail: kateImg, school: 'Saint Louis University' },
  { text: michaelText, name: 'Michael Clarkson', thumbnail: michaelImg, school: 'Cornell University' },
  { text: niemaText, name: 'Niema Moshiri', thumbnail: niemaImg, school: 'UC San Diego' },
  { text: kateKText, name: 'Kate Kharitonova', thumbnail: kateKImg, school: 'UC Santa Barbara' },
  { text: nohaText, name: 'Noha Hazzazi', thumbnail: nohaImg, school: 'Howard University' },
  { text: alekseyText, name: 'Aleksey Gurtovoy', thumbnail: alekseyImg, school: 'University of Iowa' },
  { text: chrisText, name: 'Chris Bourke', thumbnail: chrisImg, school: 'University of Nebraska' },
  { text: robertText, name: 'Robert Adams', thumbnail: robertImg, school: 'Grand Valley State University' },
  { text: eitanText, name: 'Eitan Mendelowitz', thumbnail: eitanImg, school: 'Mount Holyoke College' },
  { text: abbasText, name: 'Abbas Attarwala', thumbnail: abbasImg, school: 'Boston University' },
];

/*************************************************************************************/

// Source: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle<T>(a: T[]) {
  let j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

/*************************************************************************************/
/******************************* Landing Testimonials ********************************/
/*************************************************************************************/

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
      <div style={{ fontSize: 16 }}>{props.text}</div>
    </div>
  );
};

const Testimonials = () => {
  const [permutation] = React.useState(() => {
    const testimonials = [...testmonialInfo];
    return testimonials.slice(0, 2).concat(shuffle(testimonials.slice(2)));
  });

  const windowSize = useWindowSize();

  const slidesPerView = windowSize.width < landingVars.breakpoints.testimonial ? 1 : 3;

  return (
    <div id="Testimonials">
      <div
        className={'display-flex justify-content-center flex-direction-column align-items-center'}
        style={{ textAlign: windowSize.width < landingVars.breakpoints.verticalPanels ? 'center' : 'left' }}
      >
        <Typography.Title level={2}>codePost isn't just another grading tool</Typography.Title>
        <span style={{ maxWidth: '700px', lineHeight: '24px', fontSize: '16px' }}>
          <p style={{ breakInside: 'avoid' }}>
            We rebuilt the feedback-giving process from the ground up to make you brilliant at what you do: teaching the
            next generation of programmers.
          </p>
          <p style={{ breakInside: 'avoid' }}>
            codePost is fast and easy-to-use.{' '}
            <span style={{ fontWeight: 600, color: colors.brandPrimary }}>Actually easy to use.</span> And it includes
            advanced features that will supercharge your teaching and save you time.
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
      <Swiper
        modules={[Navigation, Pagination, A11y]}
        spaceBetween={30}
        slidesPerView={slidesPerView}
        navigation
        pagination={{ clickable: true }}
        loop
        style={{ paddingBottom: '40px' }}
      >
        {permutation.map((t) => (
          <SwiperSlide key={`testimonial-${t.name}`}>
            <Testimonial text={t.text} name={t.name} thumbnail={t.thumbnail} school={t.school} />
          </SwiperSlide>
        ))}
      </Swiper>
      <Button
        href="https://codepost.cs.rutgers.edu/testimonials"
        target="_blank"
        type="link"
        ghost={true}
        style={{ fontWeight: 600, fontSize: 20, float: 'right', marginTop: 10, marginBottom: 25 }}
        className="testimonials-link"
      >
        View all testimonials
        <DoubleRightOutlined className="testimonials-link__arrow" />
      </Button>
      <Divider />
    </div>
  );
};

/*************************************************************************************/
/*************************** View all Testimonials Page ******************************/
/*************************************************************************************/

type position = 'right' | 'left';

const AltTestimonial = (props: {
  text: React.ReactElement;
  thumbnail: string;
  name: string;
  school: string;
  position: position;
  primary: boolean;
}) => {
  const windowSize = useWindowSize();

  const largeScreenWidth = props.primary ? 640 : 460;
  const color = props.primary ? 'rgba(36, 190, 133, 0.3)' : 'rgba(0, 0, 0, 0.15)';
  const marginLeft = props.position === 'right' ? 45 : 0;
  const fontSize = windowSize.width < landingVars.breakpoints.testimonial ? 18 : 20;

  return (
    <div
      style={{
        maxWidth: windowSize.width < landingVars.breakpoints.testimonial ? 600 : largeScreenWidth,
        marginLeft: marginLeft,
        padding: '30px',
        borderRadius: 8,
        boxShadow: `0 2px 10px ${color}`,
      }}
      className="display-flex flex-direction-column justify-content-space-between"
    >
      <div style={{ fontSize: fontSize }}>{props.text}</div>
      <div style={{ height: windowSize.width < landingVars.breakpoints.testimonial ? 10 : 30 }} />
      <div className={`display-flex flex-direction-row justify-content-flex-end align-items-center`}>
        <img alt="" src={props.thumbnail} style={{ width: 60, borderRadius: 30, marginRight: 15 }} />
        <div className="display-flex flex-direction-column" style={{ fontSize: 17, lineHeight: 1.18 }}>
          <div style={{ fontWeight: 600 }}>{props.name}</div>
          <div>{props.school}</div>
        </div>
      </div>
    </div>
  );
};

interface IProps {
  isLoggedIn: boolean;
}

const AllTestimonials = (props: IProps) => {
  const windowSize = useWindowSize();
  const shuffledTestimonials = testmonialInfo;

  const toRender: TestimonialData[][] = [];
  const itemsPerRow = windowSize.width < landingVars.breakpoints.testimonial ? 1 : 2;
  const rowPadding = windowSize.width < landingVars.breakpoints.testimonial ? '10px 0px' : '30px 0px';
  const justifyRow = windowSize.width < landingVars.breakpoints.testimonial ? 'center' : 'space-between';

  for (let i = 0; i < shuffledTestimonials.length; i += itemsPerRow) {
    const row = [];
    for (let z = 0; z < itemsPerRow; z++) {
      row.push(shuffledTestimonials[i + z]);
    }
    toRender.push(row);
  }
  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div>
        <Typography.Title level={1} style={{ color: '#758275', textAlign: 'center' }}>
          Instructor Testimonials
        </Typography.Title>
        {toRender.map((row, i) => {
          return (
            <div key={`row-${i}`} style={{ display: 'flex', justifyContent: justifyRow, padding: rowPadding }}>
              {row.map((rowItem: TestimonialData, j) => {
                return (
                  <AltTestimonial
                    key={`row-item-${i}-${j}`}
                    text={rowItem.text}
                    thumbnail={rowItem.thumbnail}
                    name={rowItem.name}
                    school={rowItem.school}
                    position={j % 2 ? 'right' : 'left'}
                    primary={(j % 2 && i % 2) || (!(j % 2) && !(i % 2)) ? true : false}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </PreAuthLayout>
  );
};

export { AllTestimonials, Testimonial, Testimonials };
