// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */

import CPButton from '../core/CPButton';
import useWindowSize from '../core/useWindowSize';

/* codePost Imports */
import landingVars from '../../styles/pages/_landingVars';

const LandingGetStarted = () => {
  const windowSize = useWindowSize();

  const flexDirection = windowSize.width < landingVars.breakpoints.getStarted ? 'column' : 'row';

  return (
    <div
      style={{
        width: '100%',
        paddingLeft: 25,
        paddingRight: 25,
      }}
      className={`display-flex justify-content-space-between flex-direction-${flexDirection}`}
    >
      <div className="display-flex flex-direction-column justify-content-center">
        <div style={{ fontSize: 30, color: '#707070', marginBottom: 5, fontWeight: 600 }}>Ready?</div>
        <div style={{ fontSize: 24, color: '#666666' }}>Get started using codePost in minutes.</div>
      </div>
      <div
        style={{
          paddingTop: windowSize.width < landingVars.breakpoints.getStarted ? 25 : 0,
          paddingLeft: windowSize.width < landingVars.breakpoints.getStarted ? 0 : 20,
        }}
        className="display-flex justify-content-center align-items-center"
      >
        <CPButton href="/signup" cpType="primary" style={{ width: 160, height: 40, fontSize: 17, lineHeight: 2.2 }}>
          Sign up
        </CPButton>
      </div>
    </div>
  );
};

export default LandingGetStarted;
