import * as React from 'react';
import { Link } from 'react-router-dom';
import { ADMIN, GRADER, STUDENT } from './routes';
import './styles/index.scss';

class Home extends React.Component {
  public render() {
    return (
      <div className="App">
        <p className="App-intro">
          <Link to={STUDENT}>Link to Student Page</Link>
        </p>
        <p className="App-intro">
          <Link to={GRADER}>Link to Grader Page</Link>
        </p>
        <p className="App-intro">
          <Link to={ADMIN}>Link to Admin Page</Link>
        </p>
      </div>
    );
  }
}

export default Home;
