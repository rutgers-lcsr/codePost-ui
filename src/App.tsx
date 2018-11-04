import * as React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Grader from './Grader';
import Home from './Home';
import { GRADER, HOME, STUDENT } from './routes';
import Student from './Student';
import './styles/App.scss';

class App extends React.Component {
  public render() {
    return (
      <div className="AppHome">
        <BrowserRouter>
          <Switch>
            <Route exact={true} path={GRADER} component={Grader} />
            <Route exact={true} path={STUDENT} component={Student} />
            <Route exact={true} path={HOME} component={Home} />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
