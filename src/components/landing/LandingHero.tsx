import * as React from 'react';
import { Link } from 'react-router-dom';

import { Modal, Typography } from 'antd';

import useWindowSize from '../core/useWindowSize';

import CPButton from '../core/CPButton';

import landingVars from '../../styles/pages/_landingVars';

import { CODE_TOUR_DEMO_ID } from '../../routes';

import GradeAnimationVideo from './landingAnimations/grade/GradeAnimationVideo';

const LandingHero = () => {
  const windowSize = useWindowSize();
  const MAX_WIDTH = 595;
  const MAX_HEIGHT = 385;
  const [modalShowing, setModalShowing] = React.useState(false);

  const tryItClick = () => {
    setModalShowing(true);
  };

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
        <CPButton
          style={{ width: 160, height: 50, fontSize: 17, display: 'inline' }}
          cpType="secondary"
          onClick={tryItClick}
        >
          Try it out!
        </CPButton>
      </div>
      <Modal
        visible={modalShowing}
        onCancel={setModalShowing.bind(false, false)}
        footer={null}
        title="Try out codePost!"
      >
        <CPButton cpType="primary" block>
          <a href={`/demo?product_tour_id=${CODE_TOUR_DEMO_ID}`} target="_blank">
            Interactive code annotation demo
          </a>
        </CPButton>
        <br />
        <br />
        <CPButton cpType="secondary" block>
          <a href="https://codepost.wistia.com/medias/n0ja8jbpny" target="_blank">
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
        display: 'flex',
        flexDirection: windowSize.width < landingVars.breakpoints.hero ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div style={{ maxWidth: landingVars.maxWidths.heroText }}>{hero}</div>
      <div
        style={{
          maxWidth: MAX_WIDTH,
          maxHeight: MAX_HEIGHT,
          minWidth: windowSize.width > landingVars.breakpoints.hero ? MAX_WIDTH : 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 5,
          overflow: 'hidden',
          boxShadow,
          transform: windowSize.width < landingVars.breakpoints.hero ? `scale(${transformSmallScreen})` : '',
        }}
      >
        <GradeAnimationVideo width={610} height={390} controls={500} />
      </div>
    </div>
  );
};

export default LandingHero;
