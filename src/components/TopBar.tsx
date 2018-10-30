import * as React from 'react';
import logo from '../logo.svg';
import '../styles/index.scss';

const TopBar = () => {
  return (
    <div id="topbar">
      <img src={logo} className="App-logo" alt="logo" />
      <span className="topbar-logo">
        code<span className="codePost-P">P</span>ost
      </span>
    </div>
  );
}

export default TopBar;