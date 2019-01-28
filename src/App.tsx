import * as React from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import Admin from './Admin';

import IndexManager from './components/IndexManager';
import { TopBar } from './components/TopBar';

import LogInAs from './LogInAs';

import Grade from './Grade';
import Grader from './Grader';
import Home from './Home';
import { ADMIN, GRADE, GRADER, HOME, STUDENT } from './routes';

import Student from './Student';
import { IUser } from './types/common';

import NoMatch from './components/NoMatch';

interface IState {
  error: string;
  has_token: boolean;
  user?: IUser;
  toRedirect: boolean;
}

class App extends React.Component<{}, IState> {
  public constructor(props: any) {
    super(props);
    this.state = {
      error: '',
      has_token: localStorage.getItem('token') ? true : false,
      toRedirect: false,
    };
  }

  public componentDidUpdate(prevProps: any, prevState: IState) {
    if (this.state.toRedirect) {
      this.setState({ toRedirect: false });
    }
  }

  public replaceUser = (newUser: IUser) => {
    this.setState(
      {
        user: newUser,
        toRedirect: true,
      },
      () => {
        localStorage.setItem('token', newUser.token);
      },
    );
  };

  public componentDidMount() {
    if (this.state.has_token && !this.state.user) {
      fetch(`${process.env.REACT_APP_API_URL}/registration/current_user/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
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
        });
    }
  }

  public handleLogout = () => {
    localStorage.removeItem('token');
    this.setState({
      has_token: false,
      user: undefined,
      toRedirect: true,
    });
  };

  // Used to implement sliding session for JWT authenticated session
  // See discussion here: https://github.com/nsarno/knock/issues/65
  //
  // Note: we could also check to see if the token is close to expiring
  // and only attempt to refresh if true.
  public refreshToken = () => {
    if (!this.state.has_token) {
      return;
    }

    const REFRESH_MIN = 30; // should define this in a settings file somewhere
    const REFRESH_INT = 1000 * 60 * REFRESH_MIN; // convert to milliseconds

    fetch(`${process.env.REACT_APP_API_URL}/token-refresh/`, {
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
    fetch(`${process.env.REACT_APP_API_URL}/token-auth/`, {
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
          has_token: true,
          user: json.user,
          toRedirect: true,
        });
      })
      .catch((error) => {
        localStorage.removeItem('token');
        this.setState({ has_token: false, user: undefined, error: 'invalid' });
      });
  };

  public render() {
    if (this.state.toRedirect) {
      return <Redirect to={'/'} />;
    }

    // Disabling this rule means we can use the render prop of Route to pass props to components
    if (typeof this.state.user !== 'undefined') {
      const { user } = this.state;
      const courseAdminCourses = user.courseadminCourses;
      const graderCourses = user.graderCourses;
      const studentCourses = user.studentCourses;
      const email = user.email;

      const isStudent = user ? user.studentCourses.length > 0 : false;
      const isGrader = user ? user.graderCourses.length > 0 : false;
      const isAdmin = user ? user.courseadminCourses.length > 0 : false;

      /* tslint:disable:jsx-no-lambda */
      let studentRoute;
      if (isStudent) {
        studentRoute = (
          <Route
            exact={true}
            path={`${STUDENT}/:courseName?/:period?/:assignmentName?`}
            render={(props: any) => <Student {...props} email={email} initialCourses={studentCourses} />}
          />
        );
      }

      let graderRoute;
      if (isGrader) {
        graderRoute = (
          <Route
            exact={true}
            path={`${GRADER}/:courseName?/:period?/:assignmentName?`}
            render={(props: any) => <Grader {...props} email={email} initialCourses={graderCourses} />}
          />
        );
      }

      let adminRoute;
      if (isAdmin) {
        adminRoute = (
          <Route
            exact={true}
            path={`${ADMIN}/:courseName?/:period?/:panelName?/:panelArg?`}
            render={(props: any) => <Admin {...props} user={this.state.user} initialCourses={courseAdminCourses} />}
          />
        );
      }

      let gradeRoute;
      if (isGrader || isAdmin) {
        gradeRoute = (
          <Route
            exact={true}
            path={`${GRADE}/:submissionId`}
            render={(props: any) => <Grade {...props} user={this.state.user} />}
          />
        );
      }

      // If user has only one role, use / to redirect to relevant role's page. Otherwise, allow user to choose
      // role from /
      let pageSelector = null;
      if (isStudent && !isGrader && !isAdmin) {
        pageSelector = <Route exact={true} path={HOME} render={RedirectPath('student')} />;
      } else if (!isStudent && isGrader && !isAdmin) {
        pageSelector = <Route exact={true} path={HOME} render={RedirectPath('grader')} />;
      } else if (!isStudent && !isGrader && isAdmin) {
        pageSelector = <Route exact={true} path={HOME} render={RedirectPath('course-admin')} />;
      } else {
        pageSelector = <Route exact={true} path={HOME} component={Home} />;
      }

      return (
        <div>
          <TopBar email={this.state.user.email} handleLogout={this.handleLogout} />
          <div>
            <div className="AppHome">
              <BrowserRouter>
                <Switch>
                  <Route
                    exact={true}
                    path={'/loginAs/:email'}
                    render={(props: any) => <LogInAs {...props} replaceUser={this.replaceUser} />}
                  />

                  {studentRoute}
                  {graderRoute}
                  {adminRoute}
                  {gradeRoute}
                  {pageSelector}
                  <Route component={NoMatch} />
                </Switch>
              </BrowserRouter>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        <IndexManager handleLogin={this.handleLogin} error={this.state.error} />
      </div>
    );
  }
}

const RedirectPath = (route: string) => {
  return (props: any) => {
    return <Redirect to={`/${route}`} />;
  };
};

export default App;
