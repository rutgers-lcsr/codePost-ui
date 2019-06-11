import * as React from 'react';

import { Redirect, Route, Switch } from 'react-router-dom';

import { Snackbar } from 'react-md';

import IndexManager from './components/IndexManager';
import TermsOfService from './components/TermsAndPrivacy/TermsOfService';
// import { TopBar } from './components/TopBar';

import LogInAs from './LogInAs';

import Home from './Home';

import { ADMIN, GRADE, GRADER, HOME, STUDENT } from './routes';

import { IToast } from './types/common';

import { CourseType } from './infrastructure/course';
import { UserType } from './infrastructure/user';

import Settings from './settings';

import RouterLoading from './RouterLoading';

import { AdminAnimation } from './components/LandingAnimations/Admin/AdminAnimation';
import APIAnimation from './components/LandingAnimations/API/APIAnimation';

import Loadable from 'react-loadable';

/******************************************************************************
 * Asynchronous components to dynamically load app code via code splitting
 ******************************************************************************/

const AsyncStudent = Loadable({
  loader: () => import('./Student'),
  loading: RouterLoading,
});

const AsyncGrader = Loadable({
  loader: () => import('./Grader'),
  loading: RouterLoading,
});

const AsyncGrade = Loadable({
  loader: () => import('./Grade'),
  loading: RouterLoading,
});

const AsyncAdmin = Loadable({
  loader: () => import('./Admin'),
  loading: RouterLoading,
});

/*****************************************************************************/

interface IState {
  error: string;
  has_token: boolean;
  user?: UserType;
  toRedirect: boolean;
  toasts: IToast[];
  longToasts: IToast[];
  errorToasts: IToast[];
  triedLoading: boolean;
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
      triedLoading: false,
    };
  }

  public componentDidUpdate(prevProps: any, prevState: IState) {
    if (this.state.toRedirect) {
      this.setState({ toRedirect: false });
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
        (window as any).gtag('set', { user_id: json.user.id });
        (window as any).gtag('set', 'organization', json.user.organization);
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
            path={`${STUDENT}/:courseName?/:period?/:assignmentName?`}
            render={(props: any) => (
              <AsyncStudent {...props} email={email} handleLogout={this.handleLogout} initialCourses={studentCourses} />
            )}
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
              <AsyncGrader
                {...props}
                email={email}
                handleLogout={this.handleLogout}
                superGraderCourses={superGraderCourses}
                initialCourses={graderCourses}
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
            path={`${GRADE}/:submissionId`}
            render={(props: any) => (
              <AsyncGrade
                {...props}
                user={this.state.user}
                addToast={this.addToast}
                addErrorToast={this.addErrorToast}
              />
            )}
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
        pageSelector = (
          <Route
            exact={true}
            path={HOME}
            render={(props: any) => (
              <Home {...props} isAuthed={true} isStudent={isStudent} isGrader={isGrader} isAdmin={isAdmin} />
            )}
          />
        );
      }

      const snackBarStyle = {
        width: '100%',
        fontWeight: 500,
        fontSize: 14,
        backgroundColor: '#24b47e',
        maxWidth: '100%',
      };

      const errorSnackBarStyle = {
        width: '100%',
        fontWeight: 500,
        fontSize: 14,
        backgroundColor: 'red',
        maxWidth: '100%',
      };

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
            render={(props: any) => <Settings {...props} user={this.state.user} replaceUser={this.replaceUser} />}
          />
          <Route
            exact={true}
            path={'/terms'}
            render={(props: any) => <TermsOfService {...props} isAuthenticated={true} />}
          />
          <Route
            exact={true}
            path={'/animations/api'}
            render={(props: any) => <APIAnimation {...props} isAuthenticated={true} />}
          />
          <Route
            exact={true}
            path={'/animations/admin'}
            render={(props: any) => <AdminAnimation {...props} isAuthenticated={true} />}
          />

          {pageSelector}
          {studentRoute}
          {graderRoute}
          {adminRoute}
          {gradeRoute}
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
            autohideTimeout={5000}
            onDismiss={this.dismissErrorToast}
            style={errorSnackBarStyle}
          />
        </Switch>
      );
    }

    if (this.state.triedLoading) {
      return (
        <div>
          <IndexManager handleLogin={this.handleLogin} error={this.state.error} />
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
