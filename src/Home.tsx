import * as React from 'react';
import { Link } from 'react-router-dom';
import { GRADER, LANDING, STUDENT } from './routes';
import './styles/App.scss';
import { GRADER, STUDENT } from './routes';
import './styles/App.scss';

class Home extends React.Component {
  public render() {
    return (
      <div className="App">
        <p className="App-intro">
          <Link to={STUDENT}>
            Link to Student Page
          </Link>
        </p>
        <p className="App-intro">
          <Link to={LANDING}>
            Link to Landing Page
          <Link to={GRADER}>
            Link to Grader Page
          </Link>
        </p>
      </div>
    );
  }
}

export default Home;