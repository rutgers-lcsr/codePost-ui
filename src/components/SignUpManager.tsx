import * as React from 'react';
import { Button } from 'react-md';
import '../styles/index.scss';
import '../styles/landing.scss';

const SignUpManager = () => (
  <ul>
    <li>
      <Button href="/signup/staff/join" className="SignupBtn" key="SignUp" flat={true}>
        Join an existing course
      </Button>
    </li>
    <li>
      <Button href="/signup/staff/create" className="SignupBtn" key="SignUp" flat={true}>
        Create a new course
      </Button>
    </li>
  </ul>
);

export default SignUpManager;
