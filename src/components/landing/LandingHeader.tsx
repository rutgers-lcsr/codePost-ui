import * as React from 'react';
import { Link } from 'react-router-dom';

import { Collapse, Icon } from 'antd';
const Panel = Collapse.Panel;

import landingVars from './_landingVars';

import CPButton from '../core/CPButton';
import useWindowSize from '../core/useWindowSize';

const LandingHeader = () => {
  const windowSize = useWindowSize();

  if (windowSize.width < landingVars.breakpoints.header) {
    const linkStyle = {
      fontSize: 14,
      fontWeight: 600,
      color: '#313131',
      paddingLeft: 15,
      paddingTop: 15,
      paddingBottom: 15,
    };
    const expandIcon = (_: any) => {
      return <Icon type="menu" style={{ marginRight: 10 }} />;
    };
    return (
      <Collapse bordered={false} expandIconPosition="right" expandIcon={expandIcon}>
        <Panel
          header={
            <Link style={{ fontSize: 24, color: 'black', paddingLeft: 10 }} to={'/'}>
              code<b style={{ color: '#24be85' }}>Post</b>
            </Link>
          }
          style={{ paddingBottom: 5, paddingTop: 5 }}
          key="1"
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'left',
              justifyContent: 'space-between',
            }}
          >
            <a style={{ ...linkStyle }} href="https://help.codepost.io/docs">
              Docs
            </a>
            <Link style={{ ...linkStyle }} to="/pricing">
              Pricing
            </Link>
            <Link style={{ ...linkStyle }} to="/faqs">
              FAQs
            </Link>
            <Link style={{ ...linkStyle }} to="/login">
              Login
            </Link>
            <Link style={{ ...linkStyle, background: '#24be85', color: 'white' }} to="/signup">
              Sign Up
            </Link>
          </div>
        </Panel>
      </Collapse>
    );
  } else {
    const linkStyle = {
      fontSize: 18,
      fontWeight: 600,
      color: '#313131',
      paddingBottom: 10,
      marginLeft: 40,
      cursor: 'pointer',
    };
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            background: 'none',
            display: 'flex',
            maxWidth: landingVars.maxWidths.header,
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingRight: 40,
            paddingLeft: 40,
            paddingTop: 35,
            paddingBottom: 35,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div>
              <Link style={{ fontSize: 34, color: 'black', marginRight: 5 }} to={'/'}>
                code<b style={{ color: '#24be85' }}>Post</b>
              </Link>
            </div>
            <a style={{ ...linkStyle }} href="https://help.codepost.io/docs">
              Docs
            </a>
            <Link style={{ ...linkStyle }} to="/pricing">
              Pricing
            </Link>
            <Link style={{ ...linkStyle }} to="/faqs">
              FAQs
            </Link>
          </div>
          <div style={{ paddingBottom: 4 }}>
            <a style={{ ...linkStyle, marginRight: 25 }} href="/login">
              Login
            </a>
            <Link to="/signup">
              <CPButton style={{ width: 120, height: 40, fontSize: 17, marginLeft: 20 }} cpType="primary" key="SignUp">
                Sign Up
              </CPButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }
};

export default LandingHeader;
