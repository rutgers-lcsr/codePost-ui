// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Link } from 'react-router-dom';

import { DoubleRightOutlined } from '@ant-design/icons';

import { Modal, Typography } from 'antd';

import useWindowSize from '../core/useWindowSize';

import CPButton from '../core/CPButton';

import { Suspense } from 'react';
import landingVars from '../../styles/pages/_landingVars';
import { colors } from '../../theme/colors';

const GradeAnimationVideo = React.lazy(() => import('./landingAnimations/grade/GradeAnimationVideo'));

const LandingHero = () => {
  const windowSize = useWindowSize();
  const MAX_WIDTH = 605;
  const MAX_HEIGHT = 385;
  const [modalShowing, setModalShowing] = React.useState(false);

  const hero = (
    <div
      style={{
        textAlign: windowSize.width < landingVars.breakpoints.hero ? 'center' : 'start',
        paddingBottom: windowSize.width < landingVars.breakpoints.hero ? 40 : 0,
        paddingRight: windowSize.width < landingVars.breakpoints.hero ? 0 : landingVars.Hpadding.panelNormal,
      }}
      className="display-flex flex-direction-column justify-content-flex-start"
    >
      <div style={{ fontSize: 28, lineHeight: 1.45, fontWeight: 600, color: '#4A4A4A' }}>
        <span>
          The fastest, easiest way to give
          <Typography.Text mark className="codePost-title-highlight">
            programming
          </Typography.Text>{' '}
          feedback to students
        </span>
      </div>
      <div
        style={{
          fontSize: 18,
          lineHeight: 1.67,
          fontWeight: 400,
          color: '#606060',
          paddingTop: 35,
          paddingBottom: windowSize.width < landingVars.breakpoints.hero ? 30 : 60,
        }}
      >
        Autograding, code annotation, rubrics, plagiarism detection, and more. &nbsp;
        <Link to="/pricing">
          <span style={{ fontWeight: 600, color: colors.brandPrimary }}>Free for educators.</span>
        </Link>
      </div>
      <div
        style={{
          width: '100%',
        }}
        className={`landing__heroButtons display-flex align-items-center justify-content-${
          windowSize.width < landingVars.breakpoints.hero ? 'center' : 'flex-start'
        }`}
      >
        <Link to="/signup">
          <CPButton
            style={{
              width: 140,
              height: 50,
              fontSize: 17,
              display: 'inline',
              backgroundColor: colors.green8,
              borderColor: colors.green8,
            }}
            cpType="primary"
          >
            Sign up
          </CPButton>
        </Link>
      </div>
      <Modal open={modalShowing} onCancel={setModalShowing.bind(false, false)} footer={null} title="Try out codePost!">
        <CPButton cpType="primary" block>
          <a href={`/demo`} target="_blank" rel="noopener noreferrer">
            Interactive code annotation demo
          </a>
        </CPButton>
        <br />
        <br />
        <CPButton cpType="secondary" block>
          <a href="https://codepost.wistia.com/medias/n0ja8jbpny" target="_blank" rel="noopener noreferrer">
            Watch a video overview
          </a>
        </CPButton>
      </Modal>
    </div>
  );

  const boxShadow =
    '8px 8px 22px 0 hsla(0, 0%, 84.7%, 0.25), 0 0 2px 0 rgba(0, 0, 0, 0.15), 10px 25px 20px 0 rgba(0, 0, 0, 0.05)';

  // FIX ME -- FIX constants
  const transformSmallScreen = windowSize.width > MAX_WIDTH + 20 ? 1 : windowSize.width / (610 + 20);

  return (
    <div
      style={{
        width: '100%',
      }}
      className={`display-flex align-items-center justify-content-center flex-direction-${
        windowSize.width < landingVars.breakpoints.hero ? 'column' : 'row'
      }`}
      id="Hero"
    >
      <div style={{ maxWidth: landingVars.maxWidths.heroText }}>{hero}</div>
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
              ghost={true}
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
  );
};

export default LandingHero;
