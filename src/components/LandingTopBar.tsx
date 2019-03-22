import * as React from 'react';

import { Button, Toolbar } from 'react-md';
import { Link } from 'react-router-dom';
import { animateScroll as scroll } from 'react-scroll';

const scrollToBottom = () => {
  scroll.scrollToBottom();
};

const LandingTopBar = () => (
  <Toolbar
    fixed={true}
    className="topbar--Landing"
    title={
      <div>
        <div className="topbar__logo">
          <Link to={'/'}>
            code<b>Post</b>
          </Link>
        </div>
        <div className="topbar__logo--small">
          <Link to={'/'}>
            c<b>P</b>
          </Link>
        </div>
      </div>
    }
    actions={[
      <Button href="/pricing" key="Pricing" className="LandingBtn" flat={true}>
        Pricing
      </Button>,
      <Button href="/login" key="Login" className="LandingBtn" flat={true}>
        Login
      </Button>,
      <Button key="SignUp" className="LandingBtn" primary={true} raised={true} onClick={scrollToBottom}>
        Sign Up
      </Button>,
    ]}
  />
);

export default LandingTopBar;
