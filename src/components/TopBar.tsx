import * as React from 'react';
import { Link } from 'react-router-dom';
import { HOME } from '../routes';

interface IProps {
  email: string;
  handleLogout: (event: any) => void;
}

const TopBar = (props: IProps) => {
  return (
    <div>
      <div className="topbar">
        <div key="topbar__logo" className="topbar__logo">
          <Link to={HOME}>
            code<span className="topbar__codePost-P">P</span>ost
          </Link>
        </div>
        <div key="topbar__spacing" className="topbar__spacing" />
        <div key="topbar__welcome" className="topbar__welcome">
          <div className="topbar__welcome__text"> Hello, {props.email} </div>
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
            code<span className="topbar__codePost-P">P</span>ost
          </Link>
        </div>
        <div key="topbar__spacing" className="topbar__spacing" />
      </div>
      <div className="topbar__spacing" />
    </div>
  );
};

export { TopBar, TopBarNoEmail };
