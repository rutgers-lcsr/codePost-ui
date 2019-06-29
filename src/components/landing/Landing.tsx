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

    const calendlyDiv = document.getElementById('calendly-button');
    calendlyDiv!.setAttribute('onclick', "Calendly.showPopupWidget('https://calendly.com/codepost/');return false;");
  }

  public render() {
    const whyText = (
      <div>
        Autograding can tell your students whether their code is correct, but
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ul style={{ maxWidth: 400, textAlign: 'start' }}>
            <li> Autograder output without context is confusing</li>
            <li> Bad code can still pass correctness tests</li>
          </ul>
        </div>
        <div style={{ fontWeight: 600, lineHeight: 1.5 }}>
          codePost integrates with your existing tools to make it easy to do code review, so you can give students
          better feedback without the hassle.
        </div>
      </div>
    );

    const panelOneText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          Use codePost to annotate code effortlessly, with easy-to-read comments that don't clutter code. You and your
          course staff can provide custom feedback, as well as apply standardized rubrics.
        </div>
        <div style={{ fontWeight: 600, lineHeight: 1.5 }}>Pen-and-paper quality annotations, in the browser.</div>
      </div>
    );

    const panelTwoText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          Don't let course management take time away from teaching. Manage rosters, create assignments, and make sure
          everything gets graded within a lightweight, intuitive interface. And when you want, dive into your course
          data to audit grading, mine for pedagogical insights, and more.
        </div>
        <div style={{ fontWeight: 600, lineHeight: 1.5 }}>
          Easy course management that so you can spend more time teaching.
        </div>
      </div>
    );

    const panelThreeText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          We know that each CS course has its own unique requirements, tools, and processes. We also think the best run
          courses are managed with code. In that spirit, we've built the codePost API.
        </div>
        <div style={{ paddingBottom: 15, lineHeight: 1.5 }}>
          It's expressive and composable, and allows you to{' '}
          <span style={{ fontWeight: 600 }}>manage your course programmatically</span>,{' '}
          <span style={{ fontWeight: 600 }}>integrate with other software</span> (like an LMS or homegrown solutions),
          and <span style={{ fontWeight: 600 }}>perform analytics</span> on your course data.
        </div>
        It's also easy to use - you can start building powerful scripts in less than 10 minutes!
      </div>
    );

    const whyPanel = (
      <LandingPanel
        text={whyText}
        title="Code Review = Better Feedback"
        subTitle=""
        module={<div>{<CodeReview />}</div>}
        type="left"
        moduleMaxWidth={725}
        moduleMaxHeight={1000}
        textSize="big"
        removeModelSmallScreen={true}
        bevel={false}
      />
    );
    const panelOne = (
      <LandingPanel
        text={panelOneText}
        title="1. ANNOTATE STUDENT CODE"
        subTitle="Effortlessly annotate and grade programming assignments."
        module={<GradeAnimationVideo width={610} height={390} controls={500} />}
        type="right"
        moduleMaxWidth={610}
        moduleMaxHeight={380}
        textSize="normal"
        removeModelSmallScreen={false}
        bevel={true}
      />
    );
    const panelTwo = (
      <LandingPanel
        text={panelTwoText}
        title="2. MANAGE YOUR COURSE"
        subTitle="Data at your fingertips, when you want it."
        module={<AdminAnimation />}
        type="left"
        moduleMaxWidth={610}
        moduleMaxHeight={375}
        textSize="normal"
        removeModelSmallScreen={false}
        bevel={true}
      />
    );
    const panelThree = (
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <div style={{ marginBottom: 50, width: '100%' }}>
          <LandingPanel
            text={panelThreeText}
            title="3. CUSTOMIZE AND AUTOMATE"
            subTitle="Run your course with codePost’s API."
            module={<APIAnimation />}
            type="right"
            moduleMaxWidth={600}
            moduleMaxHeight={500}
            textSize="normal"
            removeModelSmallScreen={true}
            bevel={false}
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
