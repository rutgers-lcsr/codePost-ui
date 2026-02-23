// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { Link } from 'react-router-dom';

/* other library imports */
import PreAuthFooter from './PreAuthFooter';

import landingVars from '../../styles/pages/_landingVars';
import useWindowSize from '../core/useWindowSize';

/* ant imports */
import { Layout, Steps } from 'antd';

const { Content, Footer } = Layout;

/**********************************************************************************************************************/

type SignupStep = 0 | 1 | 2;

const SignupHeader = (props: { step: SignupStep }) => {
  const windowSize = useWindowSize();
  const breakpoint = 850;
  const flexDirection = windowSize.width < breakpoint ? 'column' : 'row';
  const stepDirection = windowSize.width < breakpoint ? 'vertical' : 'horizontal';
  const paddingTopSteps = windowSize.width < breakpoint ? 40 : 0;
  return (
    <div
      style={{
        background: 'none',
        display: 'flex',
        width: '100%',
        justifyContent: 'center',
        paddingRight: 40,
        paddingLeft: 40,
        paddingTop: windowSize.width < breakpoint ? landingVars.Vpadding.headerSmallScreen : '35px',
        paddingBottom: windowSize.width < breakpoint ? 0 : '35px',
        maxWidth: '1200px',
        margin: '0 auto',
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
        <div style={{ paddingTop: paddingTopSteps }}>
          <Steps
            current={props.step}
            direction={stepDirection}
            items={[{ title: 'Choose role' }, { title: 'Create Account' }, { title: 'Start using codePost!' }]}
          />
        </div>
      </div>
    </div>
  );
};

const PreAuthSignupLayout = (props: { step: SignupStep; children: React.ReactNode }) => {
  return (
    <Layout id="PreAuth" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <Content>
        <SignupHeader step={props.step} />
        <div
          style={{
            background: '#fff',
            padding: '0px 50px 25px 50px',
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
