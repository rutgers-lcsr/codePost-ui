import * as React from 'react';
import { Link } from 'react-router-dom';

import { Modal, Typography } from 'antd';

import useWindowSize from '../../core/useWindowSize';

import CPButton from '../../core/CPButton';

import landingVars from '../../../styles/pages/_landingVars';

const LandingHero = () => {
  const windowSize = useWindowSize();

  const isMobile = windowSize.width < landingVars.breakpoints.mobile;
  const [modalShowing, setModalShowing] = React.useState(false);

  const buttonStyle = { width: isMobile ? 170 : 220, height: 60, fontSize: isMobile ? 16 : 22, display: 'inline' };

  const hero = (
    <div
      style={{
        textAlign: 'center',
        paddingBottom: windowSize.width < landingVars.breakpoints.hero ? 40 : 0,
      }}
      className="display-flex flex-direction-column justify-content-flex-start align-items-center"
    >
      <div style={{ fontSize: isMobile ? 24 : 36, lineHeight: 1.45, fontWeight: 600, color: '#4A4A4A' }}>
        <span>
          The best way to grade{' '}
          <Typography.Text mark className="codePost-title-highlight-new">
            student code
          </Typography.Text>
          . Built for instructors.
        </span>
      </div>
      <h1
        style={{
          fontSize: isMobile ? 20 : 24,
          lineHeight: 1.67,
          fontWeight: 400,
          color: '#606060',
          paddingTop: 35,
          paddingBottom: windowSize.width < landingVars.breakpoints.hero ? 30 : 45,
        }}
      >
        Autograder, code commenting, and other tools to help you give amazing feedback, quickly.
      </h1>
      <div
        style={{
          width: '100%',
        }}
        className={`landing__heroButtons display-flex ${
          windowSize.width < landingVars.breakpoints.removeModule ? 'flex-direction-column' : ''
        } align-items-center justify-content-center`}
      >
        <Link to="/signup/create">
          <CPButton style={buttonStyle} cpType="primary">
            Sign up
          </CPButton>
        </Link>
      </div>
      <Modal
        visible={modalShowing}
        onCancel={setModalShowing.bind(false, false)}
        footer={null}
        title="Try out codePost!"
      >
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

  return (
    <div
      style={{
        width: '100%',
      }}
      className={`display-flex align-items-center justify-content-center`}
      id="Hero"
    >
      <div style={{ maxWidth: 1000, width: 'inherit' }}>{hero}</div>
    </div>
  );
};

export default LandingHero;
