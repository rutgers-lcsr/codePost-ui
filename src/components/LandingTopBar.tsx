import * as React from 'react';

import { Button, Toolbar } from 'react-md';

import '../styles/landing.scss';

const LandingTopBar = () => (
  <Toolbar
    fixed={true}
    className="topbar"
    title="codePost"
    actions={[
      <Button key="About" className="Btn" flat={true}>
        About
      </Button>,
      <Button href="/login" key="Login" className="Btn" flat={true}>
        Login
      </Button>,
      <Button href="/signup/staff" key="SignUp" className="SignupBtn" raised={true}>
        Sign Up | Course Staff
      </Button>,
      <Button href="/signup/student" key="SignUp" className="SignupBtn" raised={true}>
        Sign Up | Students
      </Button>,
    ]}
  />
);

export default LandingTopBar;
