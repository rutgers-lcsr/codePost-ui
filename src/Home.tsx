import * as React from 'react';
import { Link } from 'react-router-dom';
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
          <Link to={GRADER}>
            Link to Grader Page
          </Link>
        </p>
      </div>
    );
  }
}

export default Home;