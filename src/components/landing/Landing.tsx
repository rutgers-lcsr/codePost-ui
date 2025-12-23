/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { Suspense } from 'react';

import { HashLink as Link } from 'react-router-hash-link';

import { ArrowRightOutlined } from '@ant-design/icons';

import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

/* codePost Imports */
import landingVars from '../../styles/pages/_landingVars';
import CPButton from '../core/CPButton';

// Section components
import LandingAnnotationPanel from './LandingAnnotationPanel';
import LandingGetStarted from './LandingGetStarted';
import LandingHeader from './LandingHeader';
import LandingHero from './LandingHero';
import LandingLayout from './LandingLayout';
import LandingPanel from './LandingPanel';

// Other design elements
import PreAuthFooter from '../pre-auth/PreAuthFooter';
import { Testimonials } from './Testimonial';

import APIExample from './LandingAPIExample';

// import AutograderModule from './landingAnimations/autograder/AutograderModule';

const Integrations = React.lazy(() => import('./Integrations'));
const AutograderModule = React.lazy(() => import('./landingAnimations/autograder/AutograderModule'));
const LandingFlowChart = React.lazy(() => import('./landingAnimations/flowchart/LandingFlowChart'));
/**********************************************************************************************************************/

class Landing extends React.Component<IWithWindowWatcherProps> {
  public componentDidMount() {
    // Calendly widget setup
    const head = document.querySelector('head');
    const script = document.createElement('script');
    script.setAttribute('src', 'https://assets.calendly.com/assets/external/widget.js');
    const link = document.createElement('link');
    link.setAttribute('href', 'https://assets.calendly.com/assets/external/widget.css');
    link.setAttribute('rel', 'stylesheet');
    head!.appendChild(script);
    head!.appendChild(link);

    // const calendlyDivTop = document.getElementById('calendly-button-top');
    const calendlyDivBottom = document.getElementById('calendly-button-bottom');
    calendlyDivBottom!.setAttribute(
      'onclick',
      "Calendly.showPopupWidget('https://calendly.com/codepost/');return false;",
    );

    const calendlyDiv = document.getElementById('calendly-button-hero');
    calendlyDiv!.setAttribute('onclick', "Calendly.showPopupWidget('https://calendly.com/codepost/');return false;");
  }

  public render() {
    const panelOne = <LandingAnnotationPanel />;

    const panelTwo = (
      <LandingPanel
        text={
          <div>
            <div style={{ paddingBottom: 15 }}>
              Autograding student code can help you and your students identify correctness mistakes efficiently.
              codePost provides (a) tools to help you write tests without writing lots of overhead code, and (b) makes
              it easy to run your tests on students code and report results.
            </div>
          </div>
        }
        title="AUTOMATE CORRECTNESS TESTS"
        subTitle="Easily write and run tests against student code"
        type="right"
        moduleMaxWidth={595}
        moduleMaxHeight={550}
        textSize="normal"
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
          <div id="panelTwo">
            <div style={{ paddingBottom: 15 }}>
              You can use codePost to do everything from collecting student work, to distributing results, and
              everything in between.
              <div style={{ paddingTop: 15 }}>
                <div style={{ fontWeight: 600, paddingBottom: 5 }}>Managing a team of graders?</div>
                <div>
                  codePost includes tools to help you run a large course team: distribute work to graders, set up a
                  rubric to ensure consistent, fair feedback, and use{' '}
                  <a href="https://commandbar.com" style={{ textDecoration: 'underline' }}>intuitive keyboard shortcuts</a> to review on grader work.
                </div>
              </div>
            </div>
            <Link to="/why-use-codePost#instructors" target="_blank">
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
        title="COMPLETE FEEDBACK WORKFLOW"
        subTitle="Everything you need to run your course"
        module={
          <Suspense fallback={<div style={{ width: 500, height: 400 }} />}>
            <LandingFlowChart />
          </Suspense>
        }
        type="left"
        moduleMaxWidth={700}
        moduleMaxHeight={405}
        textSize="normal"
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
              integrations={['canvas', 'blackboard', 'jupyter', 'moss', 'github', 'jsfiddle', 'homegrown', 'more']}
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
                  Integrating tools is a big pain. That's why we built the codePost API. It allows you to
                  <ul>
                    <li>
                      <span style={{ fontWeight: 600 }}>integrate with other software</span>, such as your LMS,
                      autograder, and version control systems,
                    </li>
                    <li>
                      <span style={{ fontWeight: 600 }}>automate common tasks</span>, such as synchronizing rosters from
                      your Registrar or LMS, and
                    </li>
                    <li>
                      <span style={{ fontWeight: 600 }}>analyze your course data</span>, so that you can find and track
                      insights against your goals.
                    </li>
                  </ul>
                  It's actually easy to use - you can write useful, short scripts in 10 minutes.
                </div>
              </div>
            }
            title="API-FIRST: OPEN AND INTEROPERABLE"
            subTitle="Write short scripts with the codePost API"
            module={panelFourModule}
            type="right"
            moduleMaxWidth={600}
            moduleMaxHeight={500}
            textSize="normal"
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

    return (
      <LandingLayout
        // @ts-expect-error: legacy-ts-ignore
        location={this.props.location}
        topBar={<LandingHeader />}
        hero={<LandingHero />}
        testimonial={
          <div className="landing__testimonials">
            <Testimonials />
          </div>
        }
        panelOne={panelOne}
        panelTwo={panelTwo}
        panelThree={panelThree}
        panelFour={panelFour}
        getStarted={<LandingGetStarted />}
        footer={
          <div id="PreAuth">
            <PreAuthFooter />
          </div>
        }
      />
    );
  }
}

export default withWindowWatcher(Landing);
