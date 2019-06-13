import * as React from 'react';
import { animateScroll as scroll } from 'react-scroll';

import LandingHeader from './components/Landing/LandingHeader';
import LandingLayout from './components/Landing/LandingLayout';
import LandingPanel from './components/Landing/LandingPanel';

import { AdminAnimation } from './components/Landing/LandingAnimations/Admin/AdminAnimation';
import APIAnimation from './components/Landing/LandingAnimations/API/APIAnimation';
import { GradeAnimationVideo } from './components/Landing/LandingAnimations/Grade/GradeAnimation';

import Footer from './Footer';

import Testimonials from './components/Landing/Testimonial';

import CPButton from './components/core/CPButton';

class LandingNew extends React.PureComponent<{}, {}> {
  public scrollToBottom = () => {
    scroll.scrollToBottom();
  };

  public render() {
    const hero = (
      <div style={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
        <div style={{ fontSize: 28, lineHeight: 1.2, fontWeight: 600, color: '#4A4A4A' }}>
          The easy, free code review platform for CS courses
        </div>
        <div
          style={{
            fontSize: 21,
            lineHeight: 1.4,
            maxWidth: 450,
            fontWeight: 500,
            color: '#9B9B9B',
            paddingTop: 35,
            paddingBottom: 60,
          }}
        >
          Save time and give better feedback on coding assignments, while providing insights into how your students are
          doing.
        </div>
        <div style={{ width: 150 }}>
          <CPButton style={{ width: 140, height: 50, fontSize: 17 }} onClick={this.scrollToBottom} cpType="primary">
            Sign Up
          </CPButton>
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
        <b>
          codePost integrates with your existing tools to make it easy, so you can give students better feedback without
          the hassle.
        </b>
      </div>
    );

    const panelOneText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          You’ve got a lot of student assignments to grade. Use codePost to read and evaluate code in a slick and
          seamless interface. It allows you to use structured rubrics, as well as provide custom feedback.
        </div>
        <b>Grade anywhere, better and in half the time.</b>
      </div>
    );

    const panelTwoText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          You’ve got enough to do already, so let codePost handle your course management. Create and re-use grading
          rubrics to structure grading. Keep track of assignments to make sure that every submission gets graded
          correctly. Manage your roster, and make updates easily.
        </div>
        <b>We know the administrative burdens that instructors face, so we designed codePost to eliminate them.</b>
      </div>
    );

    const panelThreeText = (
      <div>
        <div style={{ paddingBottom: 15 }}>
          We know that each CS course has its own unique requirements, tools, and processes. We also think the best run
          courses are managed with code. In that spirit, we've built the codePost API.
        </div>
        <div style={{ paddingBottom: 15 }}>
          It's expressive and composable, and allows you to <b>manage your course programmatically</b>,{' '}
          <b>integrate with other software</b> (like an LMS or homegrown solutions), and <b>perform analytics</b> on
          your course data.
        </div>
        It's also easy to use - you can start building powerful scripts in less than 10 minutes!
      </div>
    );

    const whyPanel = (
      <LandingPanel
        text={whyText}
        title="Code Review = Better Feedback"
        subTitle=""
        module={<div>module</div>}
        type="left"
        textSize="big"
      />
    );
    const panelOne = (
      <LandingPanel
        text={panelOneText}
        title="1. ANNOTATE STUDENT CODE"
        subTitle="Effortlessly annotate and grade programming assignments."
        module={<GradeAnimationVideo width={600} height={400} />}
        type="right"
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
        textSize="normal"
      />
    );
    const panelThree = (
      <LandingPanel
        text={panelThreeText}
        title="3. SIMPLIFY YOUR INFRASTRUCTURE "
        subTitle="Run your course with codePost’s API."
        module={<APIAnimation />}
        type="right"
        textSize="normal"
      />
    );
    const getStarted = (
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 30, color: '#707070', marginBottom: 5, fontWeight: 600 }}>Ready?</div>
          <div style={{ fontSize: 24, color: '#A3A3A3' }}>Get started using codePost in minutes</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CPButton
            href="/signup/staff"
            cpType="primary"
            style={{ width: 230, height: 40, fontSize: 17, lineHeight: 2.2 }}
          >
            Sign up as Course Staff
          </CPButton>
          <div style={{ fontSize: 17, color: '#A3A3A3', paddingLeft: 20, paddingRight: 20 }}>or</div>
          <CPButton
            href="/signup/student"
            cpType="secondary"
            style={{ width: 230, height: 40, fontSize: 17, lineHeight: 2.2 }}
          >
            Sign up as a student
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
