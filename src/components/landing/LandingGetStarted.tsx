/* react imports */
import * as React from 'react';

import CPButton from '../core/CPButton';
import useWindowSize from '../core/useWindowSize';

/* codePost Imports */
import landingVars from './_landingVars';

const LandingGetStarted = () => {
  const windowSize = useWindowSize();

  const flexDirection = windowSize.width < landingVars.breakpoints.getStarted ? 'column' : 'row';

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        paddingLeft: 25,
        paddingRight: 25,
        flexDirection,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 30, color: '#707070', marginBottom: 5, fontWeight: 600 }}>Ready?</div>
        <div style={{ fontSize: 24, color: '#A3A3A3' }}>Get started using codePost in minutes.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <CPButton href="/signup" cpType="primary" style={{ width: 160, height: 40, fontSize: 17, lineHeight: 2.2 }}>
          Sign up
        </CPButton>
        &nbsp; &nbsp;
        <CPButton
          style={{ width: 160, height: 40, fontSize: 17, lineHeight: 2.2, display: 'inline' }}
          id="calendly-button"
          cpType="secondary"
        >
          Schedule demo
        </CPButton>
      </div>
    </div>
  );
};

export default LandingGetStarted;
