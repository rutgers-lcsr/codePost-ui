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

class LandingOld extends React.Component<IWithWindowWatcherProps, {}> {
  public componentDidMount() {}

  public render() {
    const panelOne = <LandingAnnotationPanel />;

    const panelTwo = (
      <LandingPanel
        text={
          <div id="panel">
            <div style={{ paddingBottom: 15 }}>
              Identify correctness mistakes efficiently, in courses of all sizes. Take advantage of simple no-code
              tests, or write flexible tests using short scripts. All tests run on codePost servers, and{' '}
              <a
                href="https://help.codepost.io/en/articles/3550689-what-languages-does-the-codepost-autograder-support"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span style={{ fontWeight: 500, cursor: 'pointer' }} className="landing__link">
                  all major languages are supported
                </span>
              </a>
              .
            </div>
            <Link to="/autograder" target="_blank" rel="noopener noreferrer">
              <CPButton
                key="panelTwoButton"
                cpType="link"
                style={{ background: 'white', fontSize: 16, padding: 0 }}
                className="landing__link"
              >
                Learn more
                <ArrowRightOutlined className="landing__link__arrow" />
              </CPButton>
            </Link>
          </div>
        }
        title="Autograder"
        subTitle="Easily write and run tests against student code"
        type="right"
        moduleMaxWidth={595}
        moduleMaxHeight={550}
        removeModelSmallScreen={false}
        module={
          <Suspense fallback={<div style={{ width: 480, height: 550 }} />}>
            <AutograderModule />
          </Suspense>
        }
        gutterSize={50}
      />
    );

    const panelThree = (
      <LandingPanel
        text={
          <div id="panel">
            <div style={{ paddingBottom: 15 }}>
              Use codePost to do everything from collecting student work, to distributing results, and everything in
              between.
              <div style={{ paddingTop: 15 }}>
                <div style={{ fontWeight: 600, paddingBottom: 5 }}>Managing a team of graders?</div>
                <div style={{ fontSize: '85%' }}>
                  codePost includes tools to help you run a large course team: distribute work, set up a rubric to
                  ensure consistent, fair feedback, and use{' '}
                  <a href="https://commandbar.com">intuitive keyboard shortcuts</a> to review on grader work.
                </div>
              </div>
            </div>
            <Link to="/why-use-codePost#instructors" target="_blank" rel="noopener noreferrer">
              <CPButton
                key="panelTwoButton"
                cpType="link"
                style={{ background: 'white', fontSize: 16, padding: 0 }}
                className="landing__link"
              >
                Learn more
                <ArrowRightOutlined className="landing__link__arrow" />
              </CPButton>
            </Link>
          </div>
        }
        title="One tool to rule them all"
        subTitle="Everything you need to run your course"
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
        gutterSize={50}
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
                <div style={{ paddingBottom: 15 }}>
                  Closed platforms are a pain. That's why we built the codePost API. It allows you to
                  <ul>
                    <li>
                      <span style={{ fontWeight: 600 }}>integrate with other software</span>, like your LMS,
                    </li>
                    <li>
                      <span style={{ fontWeight: 600 }}>automate common tasks</span>, such as syncing rosters from your
                      registrar, and
                    </li>
                    <li>
                      <span style={{ fontWeight: 600 }}>analyze your course data</span>.
                    </li>
                  </ul>
                  You can write useful, short scripts in 10 minutes. Or take advantage of our{' '}
                  <a href="https://codepost.cs.rutgers.edu/integrations" target="_blank" rel="noopener noreferrer">
                    <span style={{ fontWeight: 500, cursor: 'pointer' }} className="landing__link">
                      native integrations
                    </span>
                  </a>
                  .
                </div>
              </div>
            }
            title="API-first: open and interoperable"
            subTitle="Write short scripts with the codePost API"
            module={panelFourModule}
            type="right"
            moduleMaxWidth={600}
            moduleMaxHeight={500}
            removeModelSmallScreen={true}
            bevel={false}
            gutterSize={50}
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
      textAlign: 'center' as 'center',
    };
    const logoWidth = this.props.windowwidth < landingVars.breakpoints.verticalPanels ? 70 : 115;
    return (
      <LandingLayout
        // @ts-ignore
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
