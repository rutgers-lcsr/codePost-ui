/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* codePost Imports */
import landingVars from '../../styles/pages/_landingVars';

// Section components
import LandingGetStarted from './LandingGetStarted';
import LandingHeader from './LandingHeader';
import LandingHero from './LandingHero';
import LandingLayout from './LandingLayout';
import LandingPanel from './LandingPanel';

// Animations
import { AdminAnimation } from './landingAnimations/admin/AdminAnimation';
import APIAnimation from './landingAnimations/api/APIAnimation';
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
    const whyText = (
      <div>
        <div style={{ fontWeight: 400, lineHeight: 1.5, paddingBottom: 20, fontSize: 14 }}>
          Code review is the process of manually reviewing student code and making comments to explain errors and make
          suggestions.
        </div>
        <div style={{ fontWeight: 500, lineHeight: 1.5, paddingBottom: 10, fontSize: 15, color: '#24be85' }}>
          Can I still use my autograder?
        </div>
        <div style={{ fontWeight: 400, lineHeight: 1.5, paddingBottom: 10, fontSize: 14 }}>
          Yes! If you use an autograder, you can make it more effective by incorporating code review.
        </div>
        <div style={{ fontWeight: 400, lineHeight: 1.5, paddingBottom: 10, fontSize: 14 }}>
          Autograding can tell your students whether their code is correct, but, by itself,{' '}
          <span style={{ fontWeight: 600 }}>the output can be confusing</span>, and{' '}
          <span style={{ fontWeight: 600 }}>bad code can still pass correctness tests.</span>
        </div>
        <div style={{ fontWeight: 400, lineHeight: 1.5, paddingBottom: 10, fontSize: 14 }}>
          With code review, you can explain autograder output and give feedback on everything an autograder can't
          evaluate.
        </div>
      </div>
    );

    const panelOneText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          Use codePost to annotate programming assignments with easy-to-read comments that don't clutter code. You and
          your course staff can provide custom feedback, as well as apply standardized rubrics. And we support iPython
          notebooks too.
        </div>
        <div style={{ fontWeight: 600, lineHeight: 1.5 }}>Pen-and-paper quality annotations, in the browser</div>
      </div>
    );

    const panelTwoText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          Don't let course management take time away from teaching. Manage your course and make sure everything gets
          graded within a lightweight, intuitive interface. Dive into your course data anytime to understand how your
          students are doing, audit grading, and mine for pedagogical insights.
        </div>
        <div style={{ fontWeight: 600, lineHeight: 1.5 }}>
          Easy course management, so you can spend more time teaching
        </div>
      </div>
    );

    const panelThreeText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          Integrating tools is a big pain. We also think the best run courses are managed with code. That's why we built
          the codePost API. It allows you to
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
        <div style={{ paddingBottom: 15, lineHeight: 1.5 }}>
          Our users have connected codePost with tools such as{' '}
          <span style={{ fontWeight: 600 }}>GitHub, JupyterHub, MOSS, Blackboard, Canvas, Moodle</span>, and more using
          the codePost API!
        </div>
      </div>
    );

    const whyPanel = (
      <LandingPanel
        text={whyText}
        title="What is code review?"
        subTitle=""
        module={<div>{<CodeReview />}</div>}
        type="left"
        moduleMaxWidth={600}
        moduleMaxHeight={800}
        textSize="normal"
        removeModelSmallScreen={true}
        bevel={false}
        gutterSize={85}
      />
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
        removeModelSmallScreen={false}
        bevel={true}
        gutterSize={50}
      />
    );
    const panelTwo = (
      <LandingPanel
        text={panelTwoText}
        title="2. MANAGE YOUR COURSE"
        subTitle="Less time configuring software, more time teaching"
        module={<AdminAnimation />}
        type="right"
        moduleMaxWidth={610}
        moduleMaxHeight={375}
        textSize="normal"
        removeModelSmallScreen={false}
        bevel={true}
        gutterSize={50}
      />
    );

    const panelThreeModule = (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'inline-block' }}>
          <APIAnimation />
        </div>
        <div style={{ display: 'inline-block', width: '210px' }}>
          <Integrations integrations={['github', 'blackboard', 'jupyter', 'moss', 'canvas', 'more']} />
        </div>
      </div>
    );
    const panelThree = (
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <div style={{ marginBottom: 50, width: '100%' }}>
          <LandingPanel
            text={panelThreeText}
            title="3. CUSTOMIZE + AUTOMATE EVERYTHING"
            subTitle="Run your course with codePost’s API"
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
        whyPanel={whyPanel}
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
