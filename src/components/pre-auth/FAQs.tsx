import * as React from 'react';

import { Typography } from 'antd';
import { Link } from 'react-router-dom';

import useWindowSize from '../core/useWindowSize';

import landingVars from '../../styles/pages/_landingVars';

import PreAuthLayout from './PreAuthLayout';

import ScrollableAnchor from 'react-scrollable-anchor';

interface IProps {
  isLoggedIn: boolean;
}

const questionStyle = { paddingTop: 10, paddingBottom: 10 };

const overviewFAQ = (
  <ScrollableAnchor id={'FAQ-overview'}>
    <div style={questionStyle}>
      <b>What does codePost do?</b>
      <br />
      <span>codePost allows you to easily annotate student code and return graded work to students.</span>
    </div>
  </ScrollableAnchor>
);

const userFAQ = (
  <ScrollableAnchor id={'FAQ-users'}>
    <div style={questionStyle}>
      <b>Who uses codePost?</b>
      <br />
      <span>
        Anyone who teaches CS. Most (but not all) codePost users are TAs, lecturers, or professors teaching CS to
        undergraduates. But codePost works for anyone teaching CS, including high school and bootcamp instructors.
      </span>
    </div>
  </ScrollableAnchor>
);

const apiFAQ = (
  <ScrollableAnchor id={'FAQ-api'}>
    <div style={questionStyle}>
      <b>What is the codePost API?</b>
      <br />
      <span>
        The codePost API is a <a href="https://en.wikipedia.org/wiki/Representational_state_transfer">RESTful API</a>
        {''} that allows you to perform any operation you can perform on the codePost site from a script.
      </span>
      <br />
      <br />
      <span>
        Using the API, you can integrate with data sources (e.g. roster from a registrar or autograding output),
        automate course management (e.g. assign submissions to graders for code review), or download codePost data for
        analysis and educational research. You can really do anything: we use the API internally to power the codePost
        GUI.
      </span>
      <br />
      <br />
      <span>
        Anybody can create tools, scripts, or automated reports for codePost: we publish our favorites for our community
        to leverage <a href="https://github.com/codepost-io">here</a>.
      </span>
    </div>
  </ScrollableAnchor>
);

const autograderFAQ = (
  <ScrollableAnchor id="FAQ-autograder">
    <div style={questionStyle}>
      <b>Is codePost an autograder?</b>
      <br />
      <span>
        No, there are a lot of good autograders out there (including home-grown ones). codePost can integrate with any
        autograder you want.
      </span>
      <br />
      <br />
      <span>
        Using the codePost API, you can send submissions to an autograder for evaluation, and then send autograding
        output (e.g., a <Typography.Text code>.txt</Typography.Text> file listing the tests a student passed and failed)
        to codePost. Graders can view and annotate this file during code review, and students can see it as part of
        their graded submission when feedback is published.
      </span>
      <br />
      <br />
      <span>
        You can take this one step further by automatically parsing autograder output, and using the codePost API to
        make deductions to a student's grade based on failed or passed tests.
      </span>
    </div>
  </ScrollableAnchor>
);

const dontreviewFAQ = (
  <ScrollableAnchor id="FAQ-codereview">
    <div style={questionStyle}>
      <b>I only use autograding in my course, and don’t do any code review. Can I still use codePost?</b>
      <br />
      <span>
        codePost is built to make code review easy. If you've struggled to implement code review in the past because of
        resource constraints (too little time, too few graders), try codePost: we think you'll find it MUCH easier to do
        code review at scale.
      </span>
      <br />
      <br />
      <span>
        Code review is a spectrum. Skimming student submissions to check for completeness is also a form of code review
        that codePost can help with!
      </span>
      <br />
      <br />
      <span>
        If you don't want to do code review, you can still make use of codePost's course management functionality and
        API. Though we don't think of codePost as an LMS, some of our users have replaced their LMS with codePost.
      </span>
    </div>
  </ScrollableAnchor>
);

const securityFAQ = (
  <ScrollableAnchor id="FAQ-FERPA">
    <div style={questionStyle}>
      <b>Is codePost FERPA compliant?</b>
      <br />
      <span>
        We take security and students' privacy very seriously. codePost is compliant with Family Educational Rights and
        Privacy Act (FERPA) regulations. Most importantly, we commit to never share data with 3rd parties without the
        consent of the student or university and to delete all related data upon request. Please see our{' '}
        <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy</Link> pages for details on our policies and
        infrastructure.
      </span>
      <br />
      <br />
      <span>
        If you have questions, please <a href="mailto:team@codepost.io">reach out to us</a>.
      </span>
    </div>
  </ScrollableAnchor>
);

const FAQs = (props: IProps) => {
  const breakpoint = landingVars.breakpoints.faq;
  const windowSize = useWindowSize();
  const questions = [overviewFAQ, userFAQ, apiFAQ, autograderFAQ, dontreviewFAQ, securityFAQ];

  let content;

  if (windowSize.width < breakpoint) {
    content = <div style={{ maxWidth: 500 }}>{questions}</div>;
  } else {
    content = (
      <div className="display-flex flex-direction-column">
        {questions.map((q, i) => {
          if (i % 2 === 1) {
            return;
          }
          return (
            <div key={i} className="display-flex flex-direction-row justify-content-space-between">
              <div style={{ maxWidth: 500, marginRight: 50 }}>{q}</div>
              <div style={{ maxWidth: 500 }}>{questions[i + 1]}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div>
        <Typography.Title level={3}>FAQs</Typography.Title>
        <div
          style={{
            fontSize: 17,
          }}
          className="display-flex justify-content-center"
        >
          {content}
        </div>
      </div>
    </PreAuthLayout>
  );
};
export default FAQs;
