import * as React from 'react';
import { Link } from 'react-router-dom';
import { animateScroll as scroll } from 'react-scroll';

import CPButton from '../core/CPButton';

const scrollToBottom = () => {
  scroll.scrollToBottom();
};

const LandingHeader = () => {
  const linkStyle = { fontSize: 17, color: '#062A22', paddingBottom: 10, marginLeft: 25 };
  return (
    <div
      style={{
        background: 'none',
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <div>
          <Link style={{ fontSize: 34, color: 'black' }} to={'/'}>
            code<b>Post</b>
          </Link>
        </div>
        <a style={{ ...linkStyle }} href="https://help.codepost.io/docs">
          Docs
        </a>
        <a style={{ ...linkStyle }} href="/pricing">
          Pricing
        </a>
      </div>
      <div style={{ paddingBottom: 5 }}>
        <a style={{ ...linkStyle, marginRight: 25 }} href="/login">
          Login
        </a>
        <CPButton
          style={{ width: 120, height: 40, fontSize: 17, marginLeft: 20 }}
          cpType="primary"
          onClick={scrollToBottom}
          key="Pricing"
        >
          Sign Up
        </CPButton>
      </div>
    </div>
  );
};

export default LandingHeader;
