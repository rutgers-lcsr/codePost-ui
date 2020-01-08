import * as React from 'react';
import { Link } from 'react-router-dom';

import { Modal, Typography } from 'antd';

import useWindowSize from '../../core/useWindowSize';

import CPButton from '../../core/CPButton';

import landingVars from '../../../styles/pages/_landingVars';

const LandingHero = () => {
  const windowSize = useWindowSize();
  const [modalShowing, setModalShowing] = React.useState(false);

  const hero = (
    <div
      style={{
        textAlign: 'center',
        paddingBottom: windowSize.width < landingVars.breakpoints.hero ? 40 : 0,
      }}
      className="display-flex flex-direction-column justify-content-flex-start align-items-center"
    >
      <div style={{ fontSize: 36, lineHeight: 1.45, fontWeight: 600, color: '#4A4A4A' }}>
        <span>
          The fastest, easiest way for instructors to give{' '}
          <Typography.Text mark className="codePost-title-highlight">
            programming feedback
          </Typography.Text>{' '}
          to students
        </span>
      </div>
      <div
        style={{
          fontSize: 24,
          lineHeight: 1.67,
          fontWeight: 400,
          color: '#606060',
          paddingTop: 35,
          paddingBottom: windowSize.width < landingVars.breakpoints.hero ? 30 : 45,
        }}
      >
        Autograder, code commenting, rubrics, plagiarism checker, and more. &nbsp;
        <span style={{ fontWeight: 600, color: '#476b63' }}>Free for educators.</span>
      </div>
      <div
        style={{
          width: '100%',
        }}
        className={`landing__heroButtons display-flex align-items-center justify-content-center`}
      >
        <CPButton
          style={{ width: 220, height: 75, fontSize: 24, display: 'inline' }}
          cpType="secondary"
          id="calendly-button-hero"
        >
          Schedule demo
        </CPButton>
        &nbsp; &nbsp;
        <Link to="/signup/create">
          <CPButton style={{ width: 220, height: 75, fontSize: 24, display: 'inline' }} cpType="primary">
            Sign up free
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
      className={`display-flex align-items-center justify-content-center flex-direction-${
        windowSize.width < landingVars.breakpoints.hero ? 'column' : 'row'
      }`}
      id="Hero"
    >
      <div style={{ maxWidth: 1000 }}>{hero}</div>
    </div>
  );
};

export default LandingHero;
