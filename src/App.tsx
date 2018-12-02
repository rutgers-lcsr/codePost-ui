import * as React from 'react';
import { Route, Switch } from 'react-router-dom';

import IndexManager from './components/IndexManager';
import TopBar from './components/TopBar';

import Grader from './Grader';
import Home from './Home';
import { GRADER, HOME, STUDENT } from './routes';
import Student from './Student';

import './styles/index.scss';

import { IUser } from './types/common';

interface IStudentState {
  error: string;
  logged_in: boolean;
  user: IUser;
}

class App extends React.Component<{}, IStudentState> {
  public constructor(props: any) {
    super(props);
    this.state = {
      error: '',
      logged_in: localStorage.getItem('token') ? true : false,
      user: { email: '', id: 0 },
    };
  }

  public componentDidMount() {
    if (this.state.logged_in) {
      fetch('http://localhost:8000/core/current_user/', {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
          // Mainly to handle token timeout
          if (res.ok) {
            return res.json();
          }
          return Promise.reject();
        })
        .then((json) => {
          this.setState({ user: json });
          this.refreshToken();
        })
        .catch((error) => {
          this.handleLogout();
          this.setState({ logged_in: false });
        });
    }
  }

  public handleLogout = () => {
    localStorage.removeItem('token');
    this.setState({ logged_in: false, user: { email: '', id: 0 } });
  };

  // Used to implement sliding session for JWT authenticated session
  // See discussion here: https://github.com/nsarno/knock/issues/65
  //
  // Note: we could also check to see if the token is close to expiring
  // and only attempt to refresh if true.
  public refreshToken = () => {
    if (!this.state.logged_in) {
      return;
    }

    const REFRESH_MIN = 30; // should define this in a settings file somewhere
    const REFRESH_INT = 1000 * 60 * REFRESH_MIN; // convert to milliseconds

    fetch('http://localhost:8000/token-refresh/', {
      body: JSON.stringify({ token: localStorage.getItem('token') }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return Promise.reject();
      })
      .then((json) => {
        localStorage.setItem('token', json.token);
        setInterval(this.refreshToken, REFRESH_INT);
      })
      .catch((error) => {
        this.handleLogout();
      });
  };

  public handleLogin = (e: any, data: any) => {
    e.preventDefault();
    fetch('http://localhost:8000/token-auth/', {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return Promise.reject();
      })
      .then((json) => {
        localStorage.setItem('token', json.token);
        this.setState({
          error: '',
          logged_in: true,
          user: json.user,
        });
      })
      .catch((error) => {
        this.handleLogout();
        this.setState({ error: 'invalid' });
      });
  };

  public render() {
    /* tslint:disable:jsx-no-lambda */
    // Disabling this rule means we can use the render prop of Route to pass props to components
    if (this.state.logged_in) {
      return (
        <div>
          <TopBar email={this.state.user.email} handleLogout={this.handleLogout} />
          <div>
            <div className="AppHome">
              <Switch>
                <Route exact={true} path={STUDENT} component={Student} />
                <Route exact={true} path={GRADER} component={Grader} />
                <Route exact={true} path={HOME} component={Home} />
              </Switch>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="App">
        <IndexManager handleLogin={this.handleLogin} error={this.state.error} />
      </div>
    );
  }
}

export default App;
