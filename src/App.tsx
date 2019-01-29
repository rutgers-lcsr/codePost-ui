import * as React from 'react';

import { Redirect, Route, Switch } from 'react-router-dom';
import { Snackbar } from 'react-md';

import Admin from './Admin';

import IndexManager from './components/IndexManager';
import { TopBar } from './components/TopBar';

import LogInAs from './LogInAs';

import Grade from './Grade';
import Grader from './Grader';
import Home from './Home';
import { ADMIN, GRADE, GRADER, HOME, STUDENT } from './routes';

import Student from './Student';
import { IToast, IUser } from './types/common';

import NoMatch from './components/NoMatch';

import { CourseType } from './infrastructure/course';

interface IState {
  error: string;
  has_token: boolean;
  user?: IUser;
  toRedirect: boolean;
  toasts: IToast[];
  longToasts: IToast[];
  errorToasts: IToast[];
}

class App extends React.Component<{}, IState> {
  public constructor(props: any) {
    super(props);
    this.state = {
      error: '',
      has_token: localStorage.getItem('token') ? true : false,
      toRedirect: false,
      toasts: [],
      longToasts: [],
      errorToasts: [],
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

  public addCourseToAdminList = (course: CourseType) => {
    if (!this.state.user) {
      return;
    }

    const newUser = this.state.user;
    newUser.courseadminCourses.push(course);
    this.setState({ user: newUser });
  };

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

  // ------------------- Toast functions -------------------

  public addToast = (text: string, action: string | undefined) => {
    const toasts = this.state.toasts.slice();
    toasts.push({ text, action });
    this.setState({ toasts });
  };

  public addLongToast = (text: string, action: string | undefined) => {
    const longToasts = this.state.longToasts.slice();
    longToasts.push({ text, action });
    this.setState({ longToasts });
  };

  public addErrorToast = (text: string, action: string | undefined) => {
    const errorToasts = this.state.errorToasts.slice();
    errorToasts.push({ text, action });
    this.setState({ errorToasts });
  };

  public dismissToast = () => {
    const [, ...toasts] = this.state.toasts;
    this.setState({ toasts });
  };

  public dismissLongToast = () => {
    const [, ...longToasts] = this.state.longToasts;
    this.setState({ longToasts });
  };

  public dismissErrorToast = () => {
    const [, ...errorToasts] = this.state.errorToasts;
    this.setState({ errorToasts });
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
      const superGraderCourses = this.state.user.superGraderCourses;
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
            render={(props: any) => (
              <Grader {...props} email={email} superGraderCourses={superGraderCourses} initialCourses={graderCourses} />
            )}
          />
        );
      }

      let adminRoute;
      if (isAdmin) {
        adminRoute = (
          <Route
            exact={true}
            path={`${ADMIN}/:courseName?/:period?/:panelName?/:panelArg?`}
            render={(props: any) => (
              <Admin
                {...props}
                addCourse={this.addCourseToAdminList}
                user={this.state.user}
                initialCourses={courseAdminCourses}
                        addToast={this.addToast}
                        addLongToast={this.addLongToast}
                        addErrorToast={this.addErrorToast}
              />
            )}
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

      const snackBarStyle = {
        width: '100%',
        fontWeight: 500,
        fontSize: 14,
        backgroundColor: '#2ecd70',
        maxWidth: '100%',
      };

      const errorSnackBarStyle = {
        width: '100%',
        fontWeight: 500,
        fontSize: 14,
        backgroundColor: 'red',
        maxWidth: '100%',
      };

      return (
        <div>
          <TopBar email={this.state.user.email} handleLogout={this.handleLogout} />
          <div>
            <div className="AppHome">
              <Switch>
                <Route
                  exact={true}
                  path={'/loginAs/:email'}
                  render={(props: any) => <LogInAs {...props} replaceUser={this.replaceUser} />}
                />

                {pageSelector}
                {studentRoute}
                {graderRoute}
                {adminRoute}
                {gradeRoute}

                <Route component={NoMatch} />
              <Snackbar
                id="short-snackbar"
                className="short-snackbar"
                toasts={this.state.toasts}
                autohide={true}
                lastChild={true}
                autohideTimeout={2000}
                onDismiss={this.dismissToast}
                style={snackBarStyle}
              />
              <Snackbar
                id="long-snackbar"
                className="long-snackbar"
                toasts={this.state.longToasts}
                autohide={true}
                lastChild={true}
                autohideTimeout={4000}
                onDismiss={this.dismissLongToast}
                style={snackBarStyle}
              />
              <Snackbar
                id="error-snackbar"
                className="error-snackbar"
                toasts={this.state.errorToasts}
                autohide={true}
                lastChild={true}
                autohideTimeout={2000}
                onDismiss={this.dismissErrorToast}
                style={errorSnackBarStyle}
              />                  
                  
              </Switch>
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
