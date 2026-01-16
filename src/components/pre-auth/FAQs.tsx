import { Typography } from 'antd';
import { Link } from 'react-router-dom';

import useWindowSize from '../core/useWindowSize';

import landingVars from '../../styles/pages/_landingVars';

import PreAuthLayout from './PreAuthLayout';

interface IProps {
  isLoggedIn: boolean;
}

const questionStyle = { paddingTop: 10, paddingBottom: 10 };

const overviewFAQ = (
  <div id="FAQ-overview" style={questionStyle}>
    <b>What does codePost do?</b>
    <br />
    <span>
      codePost allows instructors to provide high-quality feedback on student programming work: both automated feedback
      (tests) and manual feedback (annotations directly on code, possibly from a rubric).
    </span>
  </div>
);

const userFAQ = (
  <div id="FAQ-users" style={questionStyle}>
    <b>Who uses codePost?</b>
    <br />
    <span>
      Anyone who teaches computer science or software engineering. Most (but not all) codePost users are TAs, lecturers,
      or professors teaching CS to undergraduates. But codePost works for anyone teaching CS, including high school and
      bootcamp instructors.
    </span>
  </div>
);

const apiFAQ = (
  <div id="FAQ-api" style={questionStyle}>
    <b>What is the codePost API?</b>
    <br />
    <span>
      The codePost API is a{' '}
      <a className="text-link" href="https://en.wikipedia.org/wiki/Representational_state_transfer">
        RESTful API
      </a>
      {''} that allows you to perform any operation you can perform on the codePost site from a script.
    </span>
    <br />
    <br />
    <span>
      Using the API, you can integrate with data sources (e.g. roster from a registrar or autograding output), automate
      course management (e.g. assign submissions to graders for code review), or download codePost data for analysis and
      educational research. You can really do anything: we use the API internally to power the codePost GUI.
    </span>
  </div>
);

const autograderFAQ = (
  <div id="FAQ-autograder" style={questionStyle}>
    <b>Is codePost an autograder?</b>
    <br />
    <span>Yes! codePost includes tools for writing and running tests on student code.</span>
    <br />
    <br />
    <span>
      Using the codePost autograder, you can choose to write simple tests without writing code, or write full-blown test
      suites. Either way, codePost makes it easy to run your tests on student code, either at the point of submission
      (so students can get immediate feedback) or later on in the feedback process.
    </span>
  </div>
);

const dontreviewFAQ = (
  <div id="FAQ-codereview" style={questionStyle}>
    <b>I want to keep using my own autograder. Can I still use codePost?</b>
    <br />
    <span>
      Yes! Using the codePost API, you can easily upload autograder results to codePost, allowing you to keep your
      existing autograder set-up but take advantage of codePost's other functionality (like code annotation or
      plagiarism detection).
    </span>
    <br />
    <br />
    <span>
      codePost also makes it easy to copy your existing test script logic into codePost. Doing so means you don't have
      to re-write any of your tests, but you can let codePost handle the tedium of running tests on student code,
      reporting output, automatically adjusting scores. Doing so also means you can show test output to students right
      away when they submit.
    </span>
  </div>
);

const securityFAQ = (
  <div id="FAQ-FERPA" style={questionStyle}>
    <b>Is codePost FERPA compliant?</b>
    <br />
    <span>
      We take security and students' privacy very seriously. codePost is compliant with Family Educational Rights and
      Privacy Act (FERPA) regulations. Most importantly, we commit to never share data with 3rd parties without the
      consent of the student or university and to delete all related data upon request. Please see our{' '}
      <Link to="/terms" className="text-link">
        Terms
      </Link>{' '}
      and{' '}
      <Link to="/privacy" className="text-link">
        Privacy
      </Link>{' '}
      pages for details on our policies and infrastructure.
    </span>
    <br />
    <br />
    <span>
      If you have questions, please{' '}
      <a className="text-link" href="mailto:codepost@cs.rutgers.edu">
        reach out to us
      </a>
      .
    </span>
  </div>
);

const FAQs = (props: IProps) => {
  const breakpoint = landingVars.breakpoints.faq;
  const windowSize = useWindowSize();
  const questions = [overviewFAQ, userFAQ, autograderFAQ, apiFAQ, dontreviewFAQ, securityFAQ];

  let content;

  if (windowSize.width < breakpoint) {
    content = <div style={{ maxWidth: 500 }}>{questions}</div>;
  } else {
    content = (
      <div className="display-flex flex-direction-column">
        {questions.map((q, i) => {
          if (i % 2 === 1) {
            return null;
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
        <Typography.Title level={1}>FAQs</Typography.Title>
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
