import * as React from 'react';

import { Typography } from 'antd';
import { Link } from 'react-router-dom';

import useWindowSize from '../core/useWindowSize';

import PreAuthLayout from './PreAuthLayout';

interface IProps {
  isLoggedIn: boolean;
}

const FAQs = (props: IProps) => {
  const breakpoint = 700;
  const windowSize = useWindowSize();
  const flexDirection = windowSize.width < breakpoint ? 'column' : 'row';

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div>
        <Typography.Title level={3}>FAQs</Typography.Title>
        <div
          style={{
            fontSize: 17,
            display: 'flex',
            flexDirection,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ maxWidth: 500, marginRight: windowSize.width < breakpoint ? 0 : 40 }}>
            <div>
              <b>What does codePost do?</b>
              <br />
              <span>codePost allows you to easily annotate student code and return graded work to students.</span>
            </div>
            <br />
            <br />
            <div>
              <b>What is the codePost API?</b>
              <br />
              <span>
                The codePost API is a{' '}
                <a href="https://en.wikipedia.org/wiki/Representational_state_transfer">RESTful API</a> that allows you
                to perform any operation you can perform on the codePost site from a script.
              </span>
              <br />
              <br />
              <span>
                Using the API, you can integrate with data sources (e.g. roster from a registrar or autograding output),
                automate course management (e.g. assign submissions to graders for code review), or download codePost
                data for analysis and educational research. You can really do anything: we use the API internally to
                power the codePost GUI.
              </span>
              <br />
              <br />
              <span>
                Anybody can create tools, scripts, or automated reports for codePost: we publish our favorites for our
                community to leverage <a>here</a>.
              </span>
            </div>
            <br />
            <br />
            <div>
              <b>I don't do code review in my course. Can I still use codePost?</b>
              <br />
              <span>
                codePost is built to make code review easy. If you've struggled to implement code review in the past
                because of resource constraints (too little time, too few graders), try codePost: we think you'll find
                it MUCH easier to do code review at scale.
              </span>
              <br />
              <br />
              <span>
                If you don't want to do code review, you can still make use of codePost's course management
                functionality and API. Though we don't think of codePost as an LMS, some of our users have replaced
                their LMS with codePost.
              </span>
            </div>
          </div>
          <div style={{ maxWidth: 500 }}>
            <div>
              <b>Who uses codePost?</b>
              <br />
              <span>
                Anyone who teaches CS. Most of our users are lecturers or professors teaching CS to undergraduates.
              </span>
            </div>
            <br />
            <br />
            <div>
              <b>Is codePost an autograder?</b>
              <br />
              <span>
                No, there are a lot of good autograders out there (including home-grown ones). codePost can integrate
                with any autograder you want.
              </span>
              <br />
              <br />
              <span>
                Using the codePost API, you can send the output of an autograder (e.g. a
                <Typography.Text code>.txt</Typography.Text> file listing the tests a student passed and failed) to
                codePost. Graders can see this file when they perform code review, and students can see it as part of
                their graded submission when feedback is published.
              </span>
              <br />
              <br />
              <span>
                You can take this one step further by automatically parsing autograder output, and using the codePost
                API to make deductions to a student's grade based on failed tests.
              </span>
            </div>
            <br />
            <br />
            <div>
              <b>Is codePost secure?</b>
              <br />
              <span>
                Security and data privacy are priorities for us. Check out our <Link to="/terms">Terms</Link> and
                <Link to="/privacy"> Privacy</Link> pages for details on our policies and infrastructure. If you have
                questions, <a>reach out to us</a>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </PreAuthLayout>
  );
};
export default FAQs;
