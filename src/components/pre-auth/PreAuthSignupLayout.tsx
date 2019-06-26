/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { Link } from 'react-router-dom';

/* other library imports */
import PreAuthFooter from './PreAuthFooter';

import useWindowSize from '../core/useWindowSize';

/* ant imports */
import { Layout, Steps } from 'antd';
const { Step } = Steps;

const { Content, Footer } = Layout;

/**********************************************************************************************************************/

type SignupStep = 0 | 1 | 2;

const SignupHeader = (props: { step: SignupStep }) => {
  const windowSize = useWindowSize();
  const breakpoint = 850;
  const flexDirection = windowSize.width < breakpoint ? 'column' : 'row';
  const stepDirection = windowSize.width < breakpoint ? 'vertical' : 'horizontal';
  const padding = windowSize.width < breakpoint ? 15 : 0;
  return (
    <div
      style={{
        background: 'none',
        display: 'flex',
        width: '100%',
        justifyContent: 'center',
        paddingRight: 40,
        paddingLeft: 40,
        paddingTop: 20,
        paddingBottom: windowSize.width < breakpoint ? 0 : 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection,
          width: '100%',
          maxWidth: 1200,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Link style={{ fontSize: 34, color: 'black', marginRight: 5 }} to={'/'}>
            code<b>Post</b>
          </Link>
        </div>
        <div style={{ paddingTop: padding }}>
          <Steps current={props.step} direction={stepDirection}>
            <Step title="1. Choose role" />
            <Step title="2. Create Account" />
            <Step title="3. Start using codePost!" />
          </Steps>
        </div>
      </div>
    </div>
  );
};

const PreAuthSignupLayout = (props: { step: SignupStep; children: React.ReactChild }) => {
  return (
    <Layout id="PreAuth" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <Content>
        <SignupHeader step={props.step} />
        <div
          style={{
            background: '#fff',
            padding: '40px 50px 25px 50px',
            maxWidth: 1100,
            margin: '0 auto',
          }}
        >
          {props.children}
        </div>
      </Content>
      <Footer
        style={{
          background: 'rgb(234,234,234)',
          width: '100%',
          padding: 0,
          marginTop: 50,
        }}
      >
        <PreAuthFooter />
      </Footer>
    </Layout>
  );
};

export default PreAuthSignupLayout;
