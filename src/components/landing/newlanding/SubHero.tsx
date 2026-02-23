// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { DoubleRightOutlined } from '@ant-design/icons';

import { Typography } from 'antd';

import useWindowSize from '../../core/useWindowSize';

import CPButton from '../../core/CPButton';

import { Testimonials } from './Testimonial';

import { Suspense } from 'react';
import landingVars from '../../../styles/pages/_landingVars';

const GradeAnimationVideo = React.lazy(() => import('./../landingAnimations/grade/GradeAnimationVideo'));

const SubHero = () => {
  const windowSize = useWindowSize();
  const MAX_WIDTH = 605;
  const MAX_HEIGHT = 385;

  const boxShadow =
    '8px 8px 22px 0 hsla(0, 0%, 84.7%, 0.25), 0 0 2px 0 rgba(0, 0, 0, 0.15), 10px 25px 20px 0 rgba(0, 0, 0, 0.05)';

  // FIX ME -- FIX constants
  const transformSmallScreen = windowSize.width > MAX_WIDTH + 20 ? 1 : windowSize.width / (610 + 20);

  return (
    <div>
      <div
        className={`display-flex ${
          windowSize.width < landingVars.breakpoints.verticalPanels ? 'flex-direction-column' : ''
        } justify-content-center align-items-center`}
      >
        <div
          className={'display-flex flex-direction-column justify-content-center align-items-center'}
          style={{
            textAlign: 'center',
            paddingRight: windowSize.width < landingVars.breakpoints.verticalPanels ? 0 : 50,
          }}
        >
          <Typography.Title level={2}>codePost isn’t just another grading tool</Typography.Title>
          <span style={{ maxWidth: '700px', lineHeight: 1.5, fontSize: '17px', marginTop: 15 }}>
            <p style={{ breakInside: 'avoid', marginBottom: '1.2em' }}>
              We rebuilt the feedback-giving process from the ground up to make you brilliant at what you do: teaching
              the next generation of programmers.
            </p>
            <p style={{ breakInside: 'avoid', marginBottom: '1.2em' }}>
              codePost is fast and easy-to-use.{' '}
              <span style={{ fontWeight: 600, color: '#476b63' }}>Actually easy to use.</span> And it includes advanced
              features that will supercharge your teaching and save you time.
            </p>
            <p style={{ breakInside: 'avoid', marginBottom: '1.2em' }}>
              Leave comments on code with your keyboard. Write tests that compare student code against solution code in
              seconds. Triage regrade requests. To name but a few.
            </p>
          </span>
          <br />
        </div>
        <div>
          {windowSize.width < landingVars.breakpoints.removeModule ? (
            <div />
          ) : (
            <div>
              <div
                style={{
                  maxWidth: MAX_WIDTH,
                  maxHeight: MAX_HEIGHT,
                  minWidth: windowSize.width > landingVars.breakpoints.hero ? MAX_WIDTH : 0,
                  borderRadius: 5,
                  overflow: 'hidden',
                  marginTop: 10,
                  marginBottom: 15,
                  boxShadow,
                  transform: windowSize.width < landingVars.breakpoints.hero ? `scale(${transformSmallScreen})` : '',
                }}
                className="display-flex justify-content-center align-items-center"
              >
                <Suspense fallback={<div style={{ width: 610, height: 390 }} />}>
                  <GradeAnimationVideo width={610} height={390} controls={500} />
                </Suspense>
              </div>
              <CPButton
                key="Demo"
                href="https://codepost.cs.rutgers.edu/demo"
                target="_blank"
                cpType="link"
                style={{ fontWeight: 600, fontSize: 20, float: 'right' }}
                className="demo-link"
              >
                Try it out
                <DoubleRightOutlined className="demo-link__arrow" />
              </CPButton>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 900,
          }}
        >
          <div className="landing__testimonials">
            <Testimonials />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubHero;
