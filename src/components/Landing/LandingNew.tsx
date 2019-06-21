/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { Link } from 'react-router-dom';

/* antd imports */
import { Typography } from 'antd';

/* codePost Imports */

// Section components
import LandingHeader from './LandingHeader';
import LandingLayout from './LandingLayout';
import LandingPanel from './LandingPanel';

// Animations
import { AdminAnimation } from './LandingAnimations/Admin/AdminAnimation';
import APIAnimation from './LandingAnimations/API/APIAnimation';
import { GradeAnimationVideo } from './LandingAnimations/Grade/GradeAnimation';

// Other design elements
import CPButton from '../core/CPButton';
import Footer from './Footer';
import Testimonials from './Testimonial';

import APIExample from './LandingAPIExample';
import CodeReview from './LandingCodeReview';

/**********************************************************************************************************************/

class LandingNew extends React.PureComponent<{}, {}> {
  public render() {
    const hero = (
      <div style={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
        <div style={{ fontSize: 28, lineHeight: 1.45, fontWeight: 600, color: '#4A4A4A' }}>
          <span>
            The easy, free{' '}
            <Typography.Text mark className="codePost-title-highlight">
              code review
            </Typography.Text>{' '}
            platform for CS courses
          </span>
        </div>
        <div
          style={{
            fontSize: 18,
            lineHeight: 1.67,
            maxWidth: 450,
            fontWeight: 400,
            color: '#606060',
            paddingTop: 35,
            paddingBottom: 60,
          }}
        >
          Save time and give better feedback on coding assignments, while providing insights into how your students are
          doing.
        </div>
        <div style={{ width: 350 }}>
          <Link to="/signup" style={{ marginTop: 25 }}>
            <CPButton style={{ width: 140, height: 50, fontSize: 17, display: 'inline' }} cpType="primary">
              Sign Up
            </CPButton>
          </Link>
          &nbsp; &nbsp;
          <a href="https://calendly.com/codepost">
            <CPButton style={{ width: 160, height: 50, fontSize: 17, display: 'inline' }} cpType="secondary">
              Schedule demo
            </CPButton>
          </a>
        </div>
      </div>
    );

    const whyText = (
      <div>
        Autograding can tell your students whether their code is correct, but
        <ul>
          <li> Autograder output without context is confusing</li>
          <li> Bad code can still pass correctness tests</li>
        </ul>
        <div style={{ fontWeight: 600, lineHeight: 1.5 }}>
          codePost integrates with your existing tools to make it easy to do code review, so you can give students
          better feedback without the hassle.
        </div>
      </div>
    );

    const panelOneText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          Use codePost to read and evaluate code in a slick and seamless interface. It allows you to use structured
          rubrics, as well as provide custom feedback.
        </div>
        <div style={{ fontWeight: 600, lineHeight: 1.5 }}>Grade anywhere, better and in half the time.</div>
      </div>
    );

    const panelTwoText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          You’ve got enough to do already, so let codePost handle your course management. Create and re-use grading
          rubrics to structure grading. Keep track of assignments to make sure that every submission gets graded
          correctly. Manage your roster, and make updates easily.
        </div>
        <div style={{ fontWeight: 600, lineHeight: 1.5 }}>
          We know the administrative burdens that instructors face, so we designed codePost to eliminate them.
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
        textSize="big"
      />
    );
    const panelOne = (
      <LandingPanel
        text={panelOneText}
        title="1. ANNOTATE STUDENT CODE"
        subTitle="Effortlessly annotate and grade programming assignments."
        module={<GradeAnimationVideo width={610} height={390} />}
        type="right"
        moduleMaxWidth={610}
        textSize="normal"
      />
    );
    const panelTwo = (
      <LandingPanel
        text={panelTwoText}
        title="2. MANAGE YOUR COURSE"
        subTitle="Audit grading and simplifiy administrative workload. "
        module={<AdminAnimation />}
        type="left"
        moduleMaxWidth={600}
        textSize="normal"
      />
    );
    const panelThree = (
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <div style={{ marginBottom: 75 }}>
          <LandingPanel
            text={panelThreeText}
            title="3. SIMPLIFY YOUR INFRASTRUCTURE "
            subTitle="Run your course with codePost’s API."
            module={<APIAnimation />}
            type="right"
            moduleMaxWidth={600}
            textSize="normal"
          />
        </div>
        <div style={{ maxWidth: 900, width: '100%' }}>
          <APIExample />
        </div>
      </div>
    );
    const getStarted = (
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 30, color: '#707070', marginBottom: 5, fontWeight: 600 }}>Ready?</div>
          <div style={{ fontSize: 24, color: '#A3A3A3' }}>Get started using codePost in minutes.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CPButton href="/signup" cpType="primary" style={{ width: 230, height: 40, fontSize: 17, lineHeight: 2.2 }}>
            Sign up
          </CPButton>
        </div>
      </div>
    );
    return (
      <LandingLayout
        topBar={<LandingHeader />}
        hero={hero}
        testimonial={<Testimonials />}
        whyPanel={whyPanel}
        panelOne={panelOne}
        panelTwo={panelTwo}
        panelThree={panelThree}
        getStarted={getStarted}
        footer={<Footer />}
      />
    );
  }
}

export default LandingNew;
