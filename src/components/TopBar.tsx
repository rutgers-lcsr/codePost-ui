import * as React from 'react';
import { FontIcon } from 'react-md';
import { Link } from 'react-router-dom';
import { HOME } from '../routes';

interface IProps {
  email: string;
  handleLogout: (event: any) => void;
  showSettings: boolean;
  isChromeBrowser: boolean;
}

const TopBar = (props: IProps) => {
  let settingsButton = null;
  if (props.showSettings) {
    settingsButton = (
      <div className="topbar__settingsIcon">
        <Link to={'/settings'}>
          <FontIcon>settings</FontIcon>
        </Link>
      </div>
    );
  }

  let browserWarning = <div />;
  console.log(props.isChromeBrowser);
  if (!props.isChromeBrowser) {
    browserWarning = (
      <div className="topbar__browser-warning">
        codePost was built for use in chrome. Some features may not be fully functional in your current browser.
      </div>
    );
  }
  return (
    <div>
      <div className="topbar">
        <div key="topbar__logo" className="topbar__logo">
          <Link to={HOME}>
            code<b>Post</b>
          </Link>
        </div>
        <div key="topbar__spacing" className="topbar__spacing" />
        {browserWarning}
        <div key="topbar__welcome" className="topbar__welcome">
          <div className="topbar__welcome__text"> Hello, {props.email} </div>
          {settingsButton}
          <div key="Logout" className="topbar__welcome__logout" onClick={props.handleLogout}>
            Logout
          </div>
        </div>
      </div>
      <div className="topbar__spacing" />
    </div>
  );
};

const TopBarNoEmail = () => {
  return (
    <div>
      <div className="topbar">
        <div key="topbar__logo" className="topbar__logo">
          <Link to={HOME}>
            code<b>Post</b>
          </Link>
        </div>
        <div key="topbar__spacing" className="topbar__spacing" />
      </div>
      <div className="topbar__spacing" />
    </div>
  );
};

export { TopBar, TopBarNoEmail };
