import * as React from 'react';
import { Link } from 'react-router-dom';

import { Typography } from 'antd';
import useWindowSize from '../core/useWindowSize';

import CPButton from '../core/CPButton';

import landingVars from './_landingVars';

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
        paddingRight: windowSize.width < landingVars.breakpoints.hero ? 0 : landingVars.Hpadding.panel,
      }}
    >
      <div style={{ fontSize: 28, lineHeight: 1.45, fontWeight: 600, color: '#4A4A4A' }}>
        <span>
          The easy, free{' '}
          <Typography.Text mark className="codePost-title-highlight">
            code review
          </Typography.Text>{' '}
          platform for CS courses
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
        Save time and give better feedback on coding assignments, while providing insights into how your students are
        doing.
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: windowSize.width < landingVars.breakpoints.hero ? 'center' : 'flex-start',
          alignItems: 'center',
        }}
      >
        <Link to="/signup">
          <CPButton style={{ width: 140, height: 50, fontSize: 17, display: 'inline' }} cpType="primary">
            Sign Up
          </CPButton>
        </Link>
        &nbsp; &nbsp;
        <CPButton
          style={{ width: 160, height: 50, fontSize: 17, display: 'inline' }}
          id="calendly-button"
          cpType="secondary"
        >
          Schedule demo
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
      >
        <img style={{ maxWidth: '100%' }} src={require('./landing_illustration.png')} />
      </div>
    </div>
  );
};

export default LandingHero;
