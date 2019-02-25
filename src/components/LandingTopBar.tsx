import * as React from 'react';

import { Button, Toolbar } from 'react-md';
import { animateScroll as scroll } from 'react-scroll';

const scrollToBottom = () => {
  scroll.scrollToBottom();
};

const LandingTopBar = () => (
  <Toolbar
    fixed={true}
    className="topbar--Landing"
    title="codePost"
    actions={[
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
