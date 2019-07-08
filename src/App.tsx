/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Redirect, Route, Switch } from 'react-router-dom';

import Loadable from 'react-loadable';

/* codePost imports */
import LogInAs from './components/core/LogInAs';

import Home from './components/core/Home';

import { ADMIN, CODE, GRADER, HOME, STUDENT } from './routes';

import { CourseType } from './infrastructure/course';
import { UserType } from './infrastructure/user';

import IndexManager from './components/pre-auth/IndexManager';

import Settings from './components/core/settings';

import RouterLoading from './components/core/RouterLoading';

import ForbiddenManager from './components/pre-auth/ForbiddenManager';

import { runFSSetup } from './components/utils/Fullstory';

/******************************************************************************
 * Asynchronous components to dynamically load app code via code splitting
 ******************************************************************************/

const AsyncStudent = Loadable({
  loader: () => import('./components/student/Student'),
  loading: RouterLoading,
});

const AsyncGrader = Loadable({
  loader: () => import('./components/grader/Grader'),
  loading: RouterLoading,
});

const AsyncGrade = Loadable({
  loader: () => import('./components/grade/Grade'),
  loading: RouterLoading,
});

const AsyncAdmin = Loadable({
  loader: () => import('./components/admin/Admin'),
  loading: RouterLoading,
});

/*****************************************************************************/

interface IState {
  error: string;
  has_token: boolean;
  user?: UserType;
  toRedirect: boolean;
  triedLoading: boolean;
  // theme: {[key: string]: string}
}

class App extends React.Component<{}, IState> {
  public constructor(props: any) {
    super(props);
    this.state = {
      error: '',
      has_token: localStorage.getItem('token') ? true : false,
      toRedirect: false,
      triedLoading: false,
    };
  }

  public componentDidUpdate(prevProps: any, prevState: IState) {
    if (this.state.toRedirect) {
      this.setState({ toRedirect: false });
    }

    // On login, initiate fullstory logging
    if (prevState.user !== this.state.user && this.state.user !== undefined) {
      if (!(process.env.NODE_ENV && process.env.NODE_ENV === 'development')) {
        runFSSetup(this.state.user.email);
      }
    }
  }

  public replaceUser = (newUser: UserType, redirect: boolean) => {
    this.setState(
      {
        user: newUser,
        toRedirect: redirect,
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
          this.setState({ user: json, triedLoading: true });
          this.refreshToken();
        })
        .catch((error) => {
          this.setState({ triedLoading: true });
          this.handleLogout();
        });
    } else {
      this.setState({ triedLoading: true });
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
      triedLoading: true,
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
        (window as any).gtag('set', { user_id: json.user.id });
        (window as any).gtag('set', 'organization', json.user.organization);
      })
      .catch((error) => {
        this.handleLogout();
      });
  };

  public handleLogin = (username: string, password: string, toRedirect: boolean) => {
    this.setState({ error: '' });
    return fetch(`${process.env.REACT_APP_API_URL}/token-auth/`, {
      body: JSON.stringify({ username, password }),
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
          toRedirect,
        });
        (window as any).gtag('set', { user_id: json.user.id });
        (window as any).gtag('set', 'organization', json.user.organization);
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

    if (typeof this.state.user !== 'undefined') {
      const { user } = this.state;
      const courseAdminCourses = user.courseadminCourses;
      const graderCourses = user.graderCourses;
      const studentCourses = user.studentCourses;
      const superGraderCourses = this.state.user.superGraderCourses;
      const sectionsLed = user.leaderSections;

      const isStudent = user ? user.studentCourses.length > 0 : false;
      const isGrader = user ? user.graderCourses.length > 0 : false;
      const isAdmin = user ? user.courseadminCourses.length > 0 || user.canCreateCourses : false;

      if (isAdmin || isGrader) {
        (window as any).Intercom('boot', {
          app_id: 'kg4u5rp1',
          email: user.email,
          user_id: user.email,
          custom_launcher_selector: '#IntercomDefaultWidget',
          isAdmin: String(isAdmin),
          isGrader: String(isGrader),
        });
      } else {
        (window as any).Intercom('shutdown');
      }

      /* tslint:disable:jsx-no-lambda */
      let studentRoute;
      if (isStudent) {
        studentRoute = (
          <Route
            exact={true}
            path={`${STUDENT}/:courseName?/:period?`}
            render={(props: any) => (
              <AsyncStudent
                {...props}
                user={this.state.user}
                handleLogout={this.handleLogout}
                initialCourses={studentCourses}
              />
            )}
          />
        );
      }

      let graderRoute;
      if (isGrader) {
        graderRoute = (
          <Route
            exact={true}
            path={`${GRADER}/:courseName?/:period?/:assignmentName?/:panelName1?`}
            render={(props: any) => (
              <AsyncGrader
                {...props}
                user={this.state.user}
                handleLogout={this.handleLogout}
                superGraderCourses={superGraderCourses}
                courses={graderCourses}
                sectionsLed={sectionsLed}
              />
            )}
          />
        );
      }

      let adminRoute;
      if (isAdmin) {
        adminRoute = (
          <Route
            exact={true}
            path={`${ADMIN}/:courseName?/:period?/:panelName1?/:panelName2?`}
            render={(props: any) => (
              <AsyncAdmin
                {...props}
                addCourse={this.addCourseToAdminList}
                user={this.state.user}
                initialCourses={courseAdminCourses}
                logout={this.handleLogout}
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
            path={`${CODE}/:submissionId`}
            render={(props: any) => <AsyncGrade {...props} user={this.state.user} handleLogout={this.handleLogout} />}
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
        pageSelector = <Route exact={true} path={HOME} render={RedirectPath('admin')} />;
      } else {
        pageSelector = (
          <Route
            exact={true}
            path={HOME}
            render={(props: any) => (
              <Home
                {...props}
                isLoggedIn={true}
                isStudent={isStudent}
                isGrader={isGrader}
                isAdmin={isAdmin}
                handleLogout={this.handleLogout}
                user={this.state.user}
              />
            )}
          />
        );
      }

      // const isChromeBrowser = window.hasOwnProperty('chrome');

      return (
        <Switch>
          <Route
            exact={true}
            path={'/loginAs/:email'}
            render={(props: any) => <LogInAs {...props} replaceUser={this.replaceUser} />}
          />

          <Route
            exact={true}
            path={'/settings'}
            render={(props: any) => (
              <Settings
                {...props}
                user={this.state.user}
                handleLogout={this.handleLogout}
                replaceUser={this.replaceUser}
              />
            )}
          />

          {pageSelector}
          {studentRoute}
          {graderRoute}
          {adminRoute}
          {gradeRoute}
          <IndexManager
            handleLogin={this.handleLogin}
            error={this.state.error}
            isLoggedIn={true}
            handleLogout={this.handleLogout}
          />
        </Switch>
      );
    }

    if (this.state.triedLoading) {
      return (
        <div>
          <ForbiddenManager handleLogin={this.handleLogin} error={this.state.error} />
          <IndexManager
            handleLogin={this.handleLogin}
            error={this.state.error}
            isLoggedIn={false}
            handleLogout={this.handleLogout}
          />
        </div>
      );
    } else {
      (window as any).Intercom('boot', {
        app_id: 'kg4u5rp1',
        custom_launcher_selector: '#IntercomDefaultWidget',
      });
      return <div />;
    }
  }
}

const RedirectPath = (route: string) => {
  return (props: any) => {
    return <Redirect to={`/${route}`} />;
  };
};

export default App;
