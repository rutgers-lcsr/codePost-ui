import * as React from 'react';
import { Button, Toolbar} from 'react-md';
import './styles/index.scss';
import './styles/landing.scss';


const LandingTopBar = () => (
  <Toolbar
      fixed={true}
      className="topbar"
      title="codePost"
      actions = {[<Button key="About" className="Btn" flat={true}>About</Button>,
                <Button key="Login" className="Btn" flat={true}>Login</Button>,
                <Button key="SignUp" className="SignupBtn" raised={true}>Sign Up</Button>]}
    />
);

export default LandingTopBar;
