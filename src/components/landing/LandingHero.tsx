import * as React from 'react';
import { Link } from 'react-router-dom';

import { Typography } from 'antd';
import useWindowSize from '../core/useWindowSize';

import CPButton from '../core/CPButton';

import landingVars from '../../styles/pages/_landingVars';

import { CODE_TOUR_DEMO_ID } from '../../routes';

const LandingHero = () => {
  const windowSize = useWindowSize();
  const hero = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        textAlign: windowSize.width < landingVars.breakpoints.hero ? 'center' : 'start',
        flexDirection: 'column',
        paddingBottom: windowSize.width < landingVars.breakpoints.hero ? 40 : 0,
        paddingRight: windowSize.width < landingVars.breakpoints.hero ? 0 : landingVars.Hpadding.panelNormal,
      }}
    >
      <div style={{ fontSize: 28, lineHeight: 1.45, fontWeight: 600, color: '#4A4A4A' }}>
        <span>
          The easiest way to{' '}
          <Typography.Text mark className="codePost-title-highlight">
            grade
          </Typography.Text>{' '}
          and{' '}
          <Typography.Text mark className="codePost-title-highlight">
            comment on
          </Typography.Text>{' '}
          student code
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
        Give better feedback on programming assignments, so you can teach CS better and train good programmers.{' '}
        <span style={{ fontWeight: 600, color: '#24be85' }}>Free for universities.</span>
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: windowSize.width < landingVars.breakpoints.hero ? 'center' : 'flex-start',
          alignItems: 'center',
        }}
        className="landing__heroButtons"
      >
        <Link to="/signup">
          <CPButton style={{ width: 140, height: 50, fontSize: 17, display: 'inline' }} cpType="primary">
            Sign Up
          </CPButton>
        </Link>
        &nbsp; &nbsp;
        <CPButton style={{ width: 160, height: 50, fontSize: 17, display: 'inline' }} cpType="secondary">
          <a href={`/demo?product_tour_id=${CODE_TOUR_DEMO_ID}`} target="_blank">
            Try it out!
          </a>
        </CPButton>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: windowSize.width < landingVars.breakpoints.hero ? 'column' : 'row',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: landingVars.maxWidths.heroText }}>{hero}</div>
      <div
        style={{
          maxWidth:
            windowSize.width < landingVars.breakpoints.hero
              ? landingVars.maxWidths.heroImgSmallScreen
              : landingVars.maxWidths.heroImgNormal,
        }}
        className="landing__heroImg"
      >
        <img style={{ maxWidth: '100%' }} src={require('../../img/landing/compressed/landing_illustration.jpg')} />
      </div>
    </div>
  );
};

export default LandingHero;
