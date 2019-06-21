/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Col, Divider, Icon, Row, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

import ScrollableAnchor from 'react-scrollable-anchor';

/* codePost imports */
import PreAuthLayout from './PreAuthLayout';

/**********************************************************************************************************************/

interface IProps {
  isLoggedIn: boolean;
}

const textStyle = {
  width: 600,
  height: 68,
  fontSize: 30,
  textAlign: 'center',
  color: '#062a22',
  fontWeight: 'bold',
  margin: '0 auto',
} as React.CSSProperties;

const optionStyle = {
  borderRadius: 5,
  boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.15)',
  display: 'inline-block',
  textAlign: 'left',
  verticalAlign: 'middle',
  fontSize: '16px',
} as React.CSSProperties;

const premiumStyle = {
  ...optionStyle,
  width: 391,
  height: 471,
  backgroundColor: '#1b1b1b',
  marginTop: 50,
  padding: '20px 35px',
  color: '#fff',
} as React.CSSProperties;

const freeStyle = {
  ...optionStyle,
  width: 409,
  height: 510,
  backgroundColor: '#fff',
  marginTop: 60,
  padding: '40px 35px',
} as React.CSSProperties;

const freeButtonStyle = {
  borderRadius: 5,
  backgroundColor: '#24be85',
  color: '#fff',
};

const premiumButtonStyle = {
  borderRadius: 5,
  backgroundColor: '#4a4a4a',
  color: '#fff',
};

class Pricing extends React.Component<IProps, {}> {
  public render() {
    return (
      <PreAuthLayout isLoggedIn={this.props.isLoggedIn}>
        <div>
          <div style={{ textAlign: 'center' }}>
            <p style={textStyle}>codePost is free for all the courses and people you need.</p>
            <div style={freeStyle}>
              <h3 style={{ fontWeight: 'bold', fontSize: 24 }}>Free</h3>
              <p style={{ fontSize: '18px' }}>$0</p>
              <p>Full access to codePost for free.</p>
              <Divider />
              <ul style={{ padding: '0 20px' }}>
                <li>Unlimited students</li>
                <li>Unlimited course staff</li>
                <li>Unlimited submissions</li>
                <li>Full API access: up to 1000 requests/day</li>
                <li>&lt;48 hour support response time</li>
              </ul>
              <br />
              <br />
              <Link to="/signup/staff/create">
                <Button style={freeButtonStyle}>
                  Get started <Icon type="arrow-right" />
                </Button>
              </Link>
            </div>
            <div style={premiumStyle}>
              <h3 style={{ color: '#fff', fontWeight: 'bold', fontSize: 24 }}>Pro</h3>
              <p style={{ fontSize: '18px' }}>$5 / student / month </p>
              <p>Ideal for large departments that want enterprise-grade support.</p>
              <Divider />
              <ul style={{ padding: '0 20px' }}>
                <li>Unlimited students</li>
                <li>Unlimited course staff</li>
                <li>Unlimited submissions</li>
                <li>
                  Full API access: <span style={{ color: '#24be85' }}>unlimited requests</span>
                </li>
                <li>
                  <span style={{ color: '#24be85' }}>&lt;12 hour</span> support response time
                </li>
              </ul>
              <br />
              <Button style={premiumButtonStyle}>
                Get in touch <Icon type="arrow-right" />
              </Button>
            </div>
          </div>
          <br />
          <Divider />
          <br />
          <ScrollableAnchor id={'faqs'}>
            <div>
              <Typography.Title level={3}>FAQs</Typography.Title>
              <Row style={{ fontSize: 17 }}>
                <Col span={11}>
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
                      <a href="https://en.wikipedia.org/wiki/Representational_state_transfer">RESTful API</a> that
                      allows you to perform any operation you can perform on the codePost site from a script.
                    </span>
                    <br />
                    <br />
                    <span>
                      Using the API, you can integrate with data sources (e.g. roster from a registrar or autograding
                      output), automate course management (e.g. assign submissions to graders for code review), or
                      download codePost data for analysis and educational research. You can really do anything: we use
                      the API internally to power the codePost GUI.
                    </span>
                    <br />
                    <br />
                    <span>
                      Anybody can create tools, scripts, or automated reports for codePost: we publish our favorites for
                      our community to leverage <a>here</a>.
                    </span>
                  </div>
                  <br />
                  <br />
                  <div>
                    <b>I don't do code review in my course. Can I still use codePost?</b>
                    <br />
                    <span>
                      codePost is built to make code review easy. If you've struggled to implement code review in the
                      past because of resource constraints (too little time, too few graders), try codePost: we think
                      you'll find it MUCH easier to do code review at scale.
                    </span>
                    <br />
                    <br />
                    <span>
                      If you don't want to do code review, you can still make use of codePost's course management
                      functionality and API. Though we don't think of codePost as an LMS, some of our users have
                      replaced their LMS with codePost.
                    </span>
                  </div>
                </Col>
                <Col span={2} />
                <Col span={11}>
                  <div>
                    <b>Who uses codePost?</b>
                    <br />
                    <span>
                      Anyone who teaches CS. Most of our users are lecturers or professors teaching CS to
                      undergraduates.
                    </span>
                  </div>
                  <br />
                  <br />
                  <div>
                    <b>Is codePost an autograder?</b>
                    <br />
                    <span>
                      No, there are a lot of good autograders out there (including home-grown ones). codePost can
                      integrate with any autograder you want.
                    </span>
                    <br />
                    <br />
                    <span>
                      Using the codePost API, you can send the output of an autograder (e.g. a
                      <Typography.Text code>.txt</Typography.Text> file listing the tests a student passed and failed)
                      to codePost. Graders can see this file when they perform code review, and students can see it as
                      part of their graded submission when feedback is published.
                    </span>
                    <br />
                    <br />
                    <span>
                      You can take this one step further by automatically parsing autograder output, and using the
                      codePost API to make deductions to a student's grade based on failed tests.
                    </span>
                  </div>
                  <br />
                  <br />
                  <div>
                    <b>Is codePost secure?</b>
                    <br />
                    <span>
                      Security and data privacy are priorities for us. Check out our <Link to="/terms">Terms</Link> and
                      <Link to="/privacy">Privacy</Link> pages for details on our policies and infrastructure. If you
                      have questions, <a>reach out to us</a>.
                    </span>
                  </div>
                </Col>
              </Row>
            </div>
          </ScrollableAnchor>
        </div>
      </PreAuthLayout>
    );
  }
}

export default Pricing;
