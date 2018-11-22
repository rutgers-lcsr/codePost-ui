import * as React from 'react';
import { Link } from 'react-router-dom';
import { LANDING, STUDENT } from './routes';
import './styles/App.scss';

import logo from './logo.svg';

class Home extends React.Component {
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p className="App-intro">
          <Link to={STUDENT}>
            Link to Student Page
          </Link>
        </p>
        <p className="App-intro">
          <Link to={LANDING}>
            Link to Landing Page
          </Link>
        </p>
      </div>
    );
  }
}

export default Home;