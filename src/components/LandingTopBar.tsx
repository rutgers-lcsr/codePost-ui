import * as React from 'react';

import { Button, Toolbar } from 'react-md';

import '../styles/landing.scss';

const LandingTopBar = () => (
  <Toolbar
    fixed={true}
    className="topbar--Landing"
    title="codePost"
    actions={[
      <Button href="/login" key="Login" className="LandingBtn" flat={true}>
        Login
      </Button>,
      <Button href="/signup/staff" key="SignUp" className="LandingBtn" primary={true} raised={true}>
        Sign Up | Course Staff
      </Button>,
      <Button href="/signup/student" key="SignUp" className="LandingBtn" primary={true} raised={true}>
        Sign Up | Students
      </Button>,
    ]}
  />
);

export default LandingTopBar;
