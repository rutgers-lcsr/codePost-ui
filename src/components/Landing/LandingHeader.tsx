import * as React from 'react';
import { Link } from 'react-router-dom';

import CPButton from '../core/CPButton';

const LandingHeader = () => {
  const linkStyle = { fontSize: 18, fontWeight: 600, color: '#313131', paddingBottom: 10, marginLeft: 40 };
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
          <Link style={{ fontSize: 34, color: 'black', marginRight: 5 }} to={'/'}>
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
        <Link to="/signup">
          <CPButton style={{ width: 120, height: 40, fontSize: 17, marginLeft: 20 }} cpType="primary" key="SignUp">
            Sign Up
          </CPButton>
        </Link>
      </div>
    </div>
  );
};

export default LandingHeader;
