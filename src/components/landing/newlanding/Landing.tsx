// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { Suspense } from 'react';

import { HashLink as Link } from 'react-router-hash-link';

import { ArrowRightOutlined } from '@ant-design/icons';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

/* codePost Imports */
import landingVars from '../../../styles/pages/_landingVars';
import CPButton from '../../core/CPButton';

// Section components
import LandingGetStarted from './../LandingGetStarted';
import LandingHeader from './../LandingHeader';
import LandingAnnotationPanel from './LandingAnnotationPanel';
import LandingHero from './LandingHero';
import LandingLayout from './LandingLayout';
import LandingPanel from './LandingPanel';

import SubHero from './SubHero';

// Other design elements
import PreAuthFooter from '../../pre-auth/PreAuthFooter';

import APIExample from './../LandingAPIExample';

// import AutograderModule from './landingAnimations/autograder/AutograderModule';

const Integrations = React.lazy(() => import('./../Integrations'));
const AutograderModule = React.lazy(() => import('./../landingAnimations/autograder/AutograderModule'));
const LandingFlowChart = React.lazy(() => import('./../landingAnimations/flowchart/LandingFlowChart'));
/**********************************************************************************************************************/

import buImg from '../../../img/landing/compressed/logos/bu.png';
import caltechImg from '../../../img/landing/compressed/logos/caltech.png';
import cornellImg from '../../../img/landing/compressed/logos/cornell.png';
import iowaImg from '../../../img/landing/compressed/logos/iowa.png';
import princetonImg from '../../../img/landing/compressed/logos/princeton.png';
import ucsdImg from '../../../img/landing/compressed/logos/ucsd.png';

class LandingOld extends React.Component<IWithWindowWatcherProps> {
  public componentDidMount() {}

  public render() {
    const panelOne = <LandingAnnotationPanel />;

    const panelTwo = (
      <LandingPanel
        text={
          <div>
            <div style={{ paddingBottom: 24 }}>
              Native support for Python, Java, R, and more. First-class rendering for <strong>Jupyter Notebooks</strong>{' '}
              and <strong>PDFs</strong>.
              <br />
              <br />
              Give feedback wherever your students work.
            </div>
            <Link to="/autograder" target="_blank" rel="noopener noreferrer">
              <CPButton
                key="panelTwoButton"
                cpType="link"
                style={{ background: 'transparent', fontSize: 18, padding: 0, fontWeight: 600 }}
                className="landing__link"
              >
                Explore Review Tools
                <ArrowRightOutlined className="landing__link__arrow" />
              </CPButton>
            </Link>
          </div>
        }
        title="Review Anything"
        subTitle="Universal feedback tools."
        type="right"
        moduleMaxWidth={595}
        moduleMaxHeight={550}
        removeModelSmallScreen={false}
        module={
          <Suspense fallback={<div style={{ width: 480, height: 550 }} />}>
            <AutograderModule />
          </Suspense>
        }
        gutterSize={80}
      />
    );

    const panelThree = (
      <LandingPanel
        text={
          <div>
            <div style={{ paddingBottom: 24 }}>
              Docker-based isolation for secure testing. Templates for <strong>Python, Java, R</strong>, and many
              others.
              <br />
              <br />
              Run simple I/O tests or complex script-based suites.
            </div>
            <Link to="/autograder" target="_blank" rel="noopener noreferrer">
              <CPButton
                key="panelThreeButton"
                cpType="link"
                style={{ background: 'transparent', fontSize: 18, padding: 0, fontWeight: 600 }}
                className="landing__link"
              >
                See Autograder
                <ArrowRightOutlined className="landing__link__arrow" />
              </CPButton>
            </Link>
          </div>
        }
        title="Industrial-Strength Automation"
        subTitle="Test securely, grade instantly."
        module={
          <Suspense fallback={<div style={{ width: 500, height: 400 }} />}>
            <LandingFlowChart />
          </Suspense>
        }
        type="left"
        moduleMaxWidth={700}
        moduleMaxHeight={405}
        removeModelSmallScreen={true}
        bevel={false}
        gutterSize={80}
      />
    );

    const panelFourModule = (
      <div className="display-flex align-items-center">
        <div style={{ display: 'inline-block', width: '500px' }}>
          <Suspense fallback={<div style={{ width: 500, height: 400 }} />}>
            <Integrations
              integrations={['canvas', 'blackboard', 'jupyter', 'github', 'jsfiddle', 'homegrown', 'more']}
            />
          </Suspense>
        </div>
      </div>
    );
    const panelFour = (
      <div className="display-flex align-items-center flex-direction-column">
        <div
          style={{
            marginBottom: 50,
            width: '100%',
          }}
        >
          <LandingPanel
            text={
              <div>
                <div style={{ paddingBottom: 24 }}>
                  Manage rosters, sync with LMS, coordinate TAs with granular permissions, and ensure consistency with
                  shared rubrics.
                  <br />
                  <br />
                  Built for large courses.
                </div>
                <a href="/why-use-codePost#instructors" target="_blank" rel="noopener noreferrer">
                  <CPButton
                    key="panelFourButton"
                    cpType="link"
                    style={{ background: 'transparent', fontSize: 18, padding: 0, fontWeight: 600 }}
                    className="landing__link"
                  >
                    View Management Tools
                    <ArrowRightOutlined className="landing__link__arrow" />
                  </CPButton>
                </a>
              </div>
            }
            title="Scale Your Team"
            subTitle="Built for Large Courses"
            module={panelFourModule}
            type="right"
            moduleMaxWidth={600}
            moduleMaxHeight={500}
            removeModelSmallScreen={true}
            bevel={false}
            gutterSize={80}
          />
        </div>
        {this.props.windowwidth < landingVars.breakpoints.removeModule ? (
          <div />
        ) : (
          <div style={{ maxWidth: landingVars.maxWidths.apiExample, width: '100%' }}>
            <APIExample />
          </div>
        )}
      </div>
    );

    const schoolStyle = {
      minWidth: 70,
      paddingTop: 5,
      paddingBottom: 5,
      maxWidth: 115,
      fontWeight: 600,
      textAlign: 'center' as const,
    };
    const logoWidth = this.props.windowwidth < landingVars.breakpoints.verticalPanels ? 70 : 115;
    return (
      <LandingLayout
        // @ts-expect-error: legacy-ts-ignore
        location={this.props.location}
        topBar={<LandingHeader />}
        hero={<LandingHero />}
        testimonial={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: 'inherit',
                opacity: 0.6,
                maxWidth: this.props.windowwidth < landingVars.breakpoints.mobile ? 275 : 1000,
              }}
            >
              <div style={{ float: 'left', fontSize: 22, fontWeight: 600, marginBottom: 20 }}>
                {this.props.windowwidth < landingVars.breakpoints.mobile
                  ? 'Trusted by instructors at:'
                  : 'Trusted by instructors at top Computer Science programs'}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  opacity: 1,
                  fontSize: 18,
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ ...schoolStyle, color: 'rgba(188, 38, 26)' }}>
                  <img src={buImg} width={logoWidth} alt="Boston University" />
                </div>
                <div style={{ ...schoolStyle, color: 'rgba(231,115,55)' }}>
                  <img src={caltechImg} width={logoWidth} alt="Caltech" />
                </div>
                <div style={{ ...schoolStyle, color: 'rgba(233,137,64)' }}>
                  <img src={princetonImg} width={logoWidth} alt="Princeton University" />
                </div>
                <div style={{ ...schoolStyle, color: '#c6a438' }}>
                  <img src={iowaImg} width={logoWidth} alt="Iowa University" />
                </div>
                <div style={{ ...schoolStyle, color: 'rgba(21, 39,70)' }}>
                  <img src={ucsdImg} width={logoWidth} alt="University of California, San Diego" />
                </div>
                <div style={{ ...schoolStyle, color: 'rgba(156,35,38)' }}>
                  <img src={cornellImg} width={logoWidth - 20} alt="Cornell University" />
                </div>
              </div>
            </div>
          </div>
        }
        panelOne={panelOne}
        panelTwo={panelTwo}
        panelThree={panelThree}
        panelFour={panelFour}
        getStarted={<LandingGetStarted />}
        subHero={<SubHero />}
        footer={
          <div id="PreAuth">
            <PreAuthFooter />
          </div>
        }
      />
    );
  }
}

export default withWindowWatcher(LandingOld);
