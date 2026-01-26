import * as React from 'react';
import { Link } from 'react-router-dom';

import { Modal } from 'antd';

import useWindowSize from '../../core/useWindowSize';

import CPButton from '../../core/CPButton';

import landingVars from '../../../styles/pages/_landingVars';
import { colors } from '../../../theme/colors';

const LandingHero = () => {
  const windowSize = useWindowSize();

  const isMobile = windowSize.width < landingVars.breakpoints.mobile;
  const [modalShowing, setModalShowing] = React.useState(false);

  // Modernized button styles
  const primaryButtonStyle = {
    width: isMobile ? 180 : 240,
    height: isMobile ? 50 : 64,
    fontSize: isMobile ? 18 : 24,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green9,
    borderColor: colors.green9,
    boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)', // Premium shadow effect (adjust color if needed to match brand green)
    borderRadius: '8px',
  };

  const hero = (
    <div
      style={{
        textAlign: 'center',
        paddingBottom: windowSize.width < landingVars.breakpoints.hero ? 60 : 20, // Increased bottom padding for breathing room
        paddingTop: isMobile ? 40 : 80, // Added top padding
      }}
      className="display-flex flex-direction-column justify-content-flex-start align-items-center"
    >
      <h1
        style={{
          fontSize: isMobile ? 32 : 56, // Significantly larger font size
          lineHeight: 1.2,
          fontWeight: 700,
          color: '#1a1a1a', // Darker for better contrast
          margin: 0,
          letterSpacing: '-0.02em', // Modern tight tracking
          maxWidth: 900,
        }}
      >
        The Feedback Platform for{' '}
        <span className="codePost-title-highlight-new" style={{ color: colors.green9 }}>
          Computer Science
        </span>
        .
      </h1>
      <p
        style={{
          fontSize: isMobile ? 18 : 24,
          lineHeight: 1.6,
          fontWeight: 400,
          color: '#4a4a4a',
          paddingTop: 24,
          paddingBottom: 48,
          margin: 0,
          maxWidth: 700,
        }}
      >
        Grade Code, PDFs, and Jupyter Notebooks in one unified workflow.
      </p>
      <div
        style={{
          width: '100%',
          gap: '16px', // Use flex gap
        }}
        className={`landing__heroButtons display-flex ${windowSize.width < landingVars.breakpoints.removeModule ? 'flex-direction-column' : ''
          } align-items-center justify-content-center`}
      >
        <Link to="/signup/create">
          <CPButton style={primaryButtonStyle} cpType="primary">
            Sign up for free
          </CPButton>
        </Link>
        <div style={{ width: isMobile ? 0 : 20 }} /> {/* Spacer if gap not supported, though gap is mostly safe now */}
        <CPButton
          onClick={setModalShowing.bind(null, true)}
          style={{
            ...primaryButtonStyle,
            backgroundColor: 'transparent',
            borderColor: colors.green9,
            color: colors.green9,
            boxShadow: 'none',
          }}
          cpType="default" // Changed from secondary/ghost to just default with overrides
        >
          See a demo
        </CPButton>
      </div>

      <Modal open={modalShowing} onCancel={setModalShowing.bind(false, false)} footer={null} title="Try out codePost!" centered>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 0' }}>
          <CPButton cpType="primary" block size="large" href={`/demo`} target="_blank" rel="noopener noreferrer">
            Interactive code annotation demo
          </CPButton>
          <CPButton cpType="default" block size="large" href="https://codepost.wistia.com/medias/n0ja8jbpny" target="_blank" rel="noopener noreferrer">
            Watch a video overview
          </CPButton>
        </div>
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
      <div style={{ maxWidth: 1200, width: 'inherit', padding: '0 24px' }}>{hero}</div>
    </div>
  );
};

export default LandingHero;
