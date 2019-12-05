/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { HashLink as Link } from 'react-router-hash-link';

import { Icon } from 'antd';

/* codePost Imports */
import landingVars from '../../styles/pages/_landingVars';

import CPButton from '../core/CPButton';

// Section components
import LandingGetStarted from './LandingGetStarted';
import LandingHeader from './LandingHeader';
import LandingHero from './LandingHero';
import LandingLayout from './LandingLayout';
import LandingPanel from './LandingPanel';

import { LandingFlowChart } from './landingAnimations/flowchart/LandingFlowChart';

// Animations
import GradeAnimationVideo from './landingAnimations/grade/GradeAnimationVideo';

// Other design elements
import PreAuthFooter from '../pre-auth/PreAuthFooter';
import { Testimonials } from './Testimonial';

import APIExample from './LandingAPIExample';
import CodeReview from './LandingCodeReview';

import Integrations from './Integrations';

/**********************************************************************************************************************/

class Landing extends React.PureComponent<{}, {}> {
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
    const calendlyDivFooter = document.getElementById('calendly-button-footer');
    calendlyDivBottom!.setAttribute(
      'onclick',
      "Calendly.showPopupWidget('https://calendly.com/codepost/');return false;",
    );
    calendlyDivFooter!.setAttribute(
      'onclick',
      "Calendly.showPopupWidget('https://calendly.com/codepost/');return false;",
    );
  }

  public render() {
    const panelOneText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          Use codePost to annotate programming assignments with easy-to-read comments that don't clutter code. You and
          your course staff can provide custom feedback, as well as apply standardized rubrics. And we support iPython
          notebooks too.
        </div>
      </div>
    );

    const panelTwoText = (
      <div id="panelTwo">
        <div style={{ paddingBottom: 15 }}>
          Setting up a course in codePost is easy: upload submissions to review and return graded work to students with
          a few clicks.
          <div style={{ paddingTop: 15 }}>
            <div style={{ fontWeight: 600, paddingBottom: 5 }}>Managing a team of graders?</div>
            <div>
              codePost lets you dispatch work to graders, perform quality control on their work, and set up a rubric
              that lets you track what errors students are making.
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
            <Icon type="arrow-right" className="landing__link__arrow" />
          </CPButton>
        </Link>
      </div>
    );

    const panelThreeText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          Integrating tools is a big pain. That's why we built the codePost API. It allows you to
          <ul>
            <li>
              <span style={{ fontWeight: 600 }}>integrate with other software</span>, such as your LMS, autograder, and
              version control systems,
            </li>
            <li>
              <span style={{ fontWeight: 600 }}>automate common tasks</span>, such as synchronizing rosters from your
              Registrar or LMS, and
            </li>
            <li>
              <span style={{ fontWeight: 600 }}>analyze your course data</span>, so that you can find and track insights
              against your goals.
            </li>
          </ul>
          It's actually easy to use - you can write useful, short scripts in 10 minutes.
        </div>
      </div>
    );

    const panelOne = (
      <LandingPanel
        text={panelOneText}
        title="1. ANNOTATE STUDENT CODE"
        subTitle="Effortlessly annotate and grade programming assignments"
        module={<GradeAnimationVideo width={610} height={390} controls={500} />}
        type="left"
        moduleMaxWidth={595}
        moduleMaxHeight={380}
        textSize="normal"
        removeModelSmallScreen={true}
        bevel={true}
        gutterSize={50}
      />
    );
    const panelTwo = (
      <LandingPanel
        text={panelTwoText}
        title="2. MANAGE YOUR COURSE"
        subTitle="Less time configuring software, more time teaching"
        module={<LandingFlowChart />}
        type="right"
        moduleMaxWidth={700}
        moduleMaxHeight={405}
        textSize="normal"
        removeModelSmallScreen={false}
        bevel={false}
        gutterSize={50}
      />
    );

    const panelThreeModule = (
      <div className="display-flex align-items-center">
        <div style={{ display: 'inline-block', width: '500px' }}>
          <Integrations
            integrations={['canvas', 'blackboard', 'jupyter', 'moss', 'github', 'jsfiddle', 'homegrown', 'more']}
          />
        </div>
      </div>
    );
    const panelThree = (
      <div className="display-flex align-items-center flex-direction-column">
        <div style={{ marginBottom: 50, width: '100%' }}>
          <LandingPanel
            text={panelThreeText}
            title="3. INTEGRATE WITH ANYTHING"
            subTitle="Write short scripts with the codePost API"
            module={panelThreeModule}
            type="left"
            moduleMaxWidth={600}
            moduleMaxHeight={500}
            textSize="normal"
            removeModelSmallScreen={true}
            bevel={false}
            gutterSize={50}
          />
        </div>
        <div style={{ maxWidth: landingVars.maxWidths.apiExample, width: '100%' }}>
          <APIExample />
        </div>
      </div>
    );

    return (
      <LandingLayout
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

export default Landing;
