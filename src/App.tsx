/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import Loadable from 'react-loadable';

/* codePost imports */
import LogInAs from './components/core/LogInAs';

import DashboardLayout from './components/codepost-admin/DashboardLayout';

import Home from './components/core/Home';

import { ADMIN, CODE, CODE_DEMO, GRADER, HOME, STUDENT } from './routes';

import { AssignmentType } from './infrastructure/assignment';
import { CourseType } from './infrastructure/course';
import { UserType } from './infrastructure/user';

import IndexManager from './components/pre-auth/IndexManager';
import RemoteAuthFailed from './components/pre-auth/RemoteAuthFailed';
import RemoteAuthRedirect from './components/pre-auth/RemoteAuthRedirect';

import Settings from './components/core/settings';

import RouterLoading from './components/core/RouterLoading';

import ForbiddenManager from './components/pre-auth/ForbiddenManager';

import { runFSSetup, identifyUserForFS, shutdownFS } from './components/utils/Fullstory';

import { ShowTooltipContext } from './components/core/tooltips';

import { consoleArt } from './components/utils/consoleArt';

import { clearLocalSettings } from './components/utils/LocalSettings';

import { IBaseFileUpload } from './components/admin/assignments/assignments/SubmissionUpload/FileReader';

/******************************************************************************
 * Asynchronous components to dynamically load app code via code splitting
 ******************************************************************************/

const AsyncStudent = Loadable({
  loader: () => import('./components/student/StudentManager'),
  loading: RouterLoading,
});

const AsyncGrader = Loadable({
  loader: () => import('./components/grader/GraderManager'),
  loading: RouterLoading,
});

const AsyncAdmin = Loadable({
  loader: () => import('./components/admin/AdminManager'),
  loading: RouterLoading,
});

const AsyncGrade = Loadable({
  loader: () => import('./components/code-review/CodeConsole'),
  loading: RouterLoading,
});

/*****************************************************************************/

const anonymousUser: UserType = {
  email: 'anonymous@university.edu',
  id: -1,
  token: '',
  organization: 1,
  canCreateCourses: false,
  canModifyRosters: false,
  api_token: null,
  studentCourses: [],
  graderCourses: [],
  superGraderCourses: [],
  courseadminCourses: [],
  leaderSections: [],
  student_sections: [],
  showProductTips: true,
  codePostAdmin: false,
  hasCredentials: false,
};

const domains = ['mooc.codepost.io', 'localhost:3000', 'compedu.stanford.edu', 'princeton.edu'];

/*****************************************************************************/

const superUsers = ['james@codepost.io', 'vinay@codepost.io', 'richard@codepost.io'];

const inProduction = !(process.env.NODE_ENV && process.env.NODE_ENV === 'development');

/*****************************************************************************/

interface IState {
  error: string;
  has_token: boolean;
  user?: UserType;
  toRedirect: boolean;
  triedLoading: boolean;
  isSuperUser: boolean;
  // theme: {[key: string]: string}

  studentUploadShortcut?: {
    assignmentID: number;
    files: IBaseFileUpload[];
  };
  auth_type: string;
  propToken: string;
}

class App extends React.Component<{}, IState> {
  private loginCount: number;
  public constructor(props: any) {
    super(props);
    try {
      localStorage.setItem('source', 'codePost');
    } catch (err) {
      alert(
        `codePost needs permission from your browser to start.
Please follow these steps for your current browser...

Google Chrome:
  - Open up Chrome cookie settings:
      chrome://settings/content/cookies
  - Click Allow -> Add -> https://codepost.io
      See a screenshot here:
      https://share.getcloudapp.com/eDu69Dnz
  - Try refreshing!

Firefox:
  - Open up Firefox cookie settings:
      about:preferences#privacy
  - Click Cookies and Site Data -> Manage Permissions
  - Type in https://codepost.io -> Allow -> Save Changes
  - Try refreshing!
      `,
      );
    }

    console.log(...consoleArt);
    this.loginCount = 0;

    // are we getting a token from the URL?
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      window.history.replaceState({}, document.title, window.location.href.replace(/\&token=[^&]*/gm, ''));
    }

    this.state = {
      error: '',
      has_token: localStorage.getItem('token') ? true : false,
      toRedirect: false,
      triedLoading: false,

      // Used to account for situation in which a superUser uses loginas to login
      // as a user, and then refreshes or opens app in a new window.
      // In these situations, the user will remain loggedinas (because the
      // JWT they obtained via loginas persists), but this.state.isSuperUser will reset.
      // We want to be able to distinguish these sessions from genuine user sessions,
      // so we can record the latter but not the former with FS.
      //
      // This token persists the value of this.state.isSuperUser across app instances,
      // while the session orginally triggered via loginas is active.
      isSuperUser: localStorage.getItem('isSuperUser') !== null,
      studentUploadShortcut: undefined,
      auth_type: 'JWT',
      propToken: '',
    };
  }

  public componentDidUpdate(prevProps: any, prevState: IState) {
    if (this.state.toRedirect) {
      this.setState({ toRedirect: false });
    }

    // Keep this token in sync with this.state.isSuperUser
    if (this.state.isSuperUser) {
      localStorage.setItem('isSuperUser', 'true');
    } else {
      localStorage.removeItem('isSuperUser');
    }

    // On login, identify user to Fullstory
    if (inProduction) {
      if (prevState.user !== this.state.user && this.state.user !== undefined) {
        // we experienced a login or loginas event
        if (this.state.isSuperUser) {
          if (!prevState.isSuperUser) {
            // If we were previously recording a non-superUser (logged in or pre-auth) with FS, then stop.
            // Note: without this check, we'll try to shutdown a non-existant FS session when superusers
            // login.
            shutdownFS();
          }
        } else {
          if (prevState.isSuperUser) {
            // We need to start the FS session before we identify it
            runFSSetup();
            identifyUserForFS(this.state.user.email);
          } else {
            // FS session was initiated in componentDidMount
            identifyUserForFS(this.state.user.email);
          }
        }
      }
    }

    // Load CommandBar with user identity (only run on initial login)
    if (!prevState.user && this.state.user) {
      window.CommandBar.boot({
        id: this.state.user.email, // [required] A unique string to identify the current user
      });
    }
  }

  public replaceUser = (newUser: UserType, redirect: boolean, isSuperUser: boolean) => {
    this.setState(
      (oldState: IState) => {
        return {
          user: newUser,
          toRedirect: redirect,
          isSuperUser: oldState.isSuperUser || isSuperUser,
        };
      },
      () => {
        localStorage.setItem('token', newUser.token);
      },
    );
  };

  public messageHandler = (event: any) => {
    let found = false;
    for (const domain of domains) {
      if (event.origin.indexOf(domain) !== -1) {
        found = true;
        break;
      }
    }
    if (!found) {
      return;
    }

    try {
      const payload = JSON.parse(event.data);

      if (!payload.hasOwnProperty('token') || payload.token === '') {
        return;
      }

      const token = payload.token;

      let source = 'remote';
      if (payload.hasOwnProperty('source')) {
        source = payload.source;
      }

      let studentUploadShortcut;
      if (payload.hasOwnProperty('assignment') && payload.assignment !== undefined) {
        studentUploadShortcut = {
          assignmentID: payload.assignment,
          files: [],
        };

        if (payload.hasOwnProperty('files')) {
          studentUploadShortcut = {
            ...studentUploadShortcut,
            files: payload.files,
          };
        }
      }

      let auth_type = 'JWT';
      if (payload.hasOwnProperty('auth_type') && payload.auth_type !== undefined) {
        auth_type = payload.auth_type;
      }

      localStorage.setItem('source', source);

      // This will fail for admins who are switching around users
      // because we won't reauthenticate them with the new message
      if (!this.state.user) {
        this.setState({ has_token: true, studentUploadShortcut, auth_type, propToken: token }, () => {
          this.loginCount = 0;
          this.tryToLogin();
        });
        return;
      } else if (this.state.studentUploadShortcut === undefined && studentUploadShortcut !== undefined) {
        this.setState({ studentUploadShortcut });
        return;
      }
    } finally {
      return;
    }
  };

  public tryToLogin = () => {
    if (this.state.has_token && !this.state.user && this.loginCount < 4) {
      // Make sure we don't use a prefix that is mismatched with token
      let authHeader = `Bearer ${localStorage.getItem('token')}`;
      if (this.state.auth_type === 'Firebase') {
        if (this.state.propToken === '') {
          return;
        }
        authHeader = `Firebase ${this.state.propToken}`;
      }

      fetch(`${process.env.REACT_APP_API_URL}/registration/current_user/`, {
        headers: {
          Authorization: authHeader,
        },
      })
        .then(async (res) => {
          if (res.ok) {
            const json = await res.json();

            localStorage.setItem('token', json.token);
            this.setState((oldState) => {
              return {
                user: json,
                triedLoading: true,
                isSuperUser: superUsers.indexOf(json.email) > -1 || oldState.isSuperUser,
                auth_type: 'JWT',
              };
            });
            // this.refreshToken();
          } else if (res.status === 401) {
            // A status code of 401 indicates that the provided token is invalid => the user needs
            // to login again, so we log them out.

            this.setState({ triedLoading: true });
            this.handleLogout();
          } else {
            // A different error status code indicates some contextual problem, like a network connectivity problem.
            // If this happens, try every 1s to login every 1s.
            //
            // Issue with this approach: if our API server is unavailable, the site will appear as a blank page
            // (rather than showing users the pre-auth site).

            setTimeout(() => {
              this.loginCount += 1;
              this.tryToLogin();
            }, 1000);
          }
        })
        .catch((error) => {
          setTimeout(() => {
            this.loginCount += 1;
            this.tryToLogin();
          }, 1000);
        });
    } else {
      this.setState({ triedLoading: true });
    }
  };

  public componentDidMount() {
    if (inProduction && !this.state.isSuperUser) {
      runFSSetup();
    }

    window.addEventListener('message', this.messageHandler, false);

    this.tryToLogin();
  }

  public componentWillUnmount = () => {
    window.removeEventListener('message', this.messageHandler, false);
  };

  // Adds a newly created course to the user's admin and grader course lists
  public addCreatedCourse = (course: CourseType) => {
    if (!this.state.user) {
      return;
    }

    const newUser = this.state.user;
    newUser.courseadminCourses.push(course);
    newUser.graderCourses.push(course);
    this.setState({ user: newUser });
  };

  public handleLogout = () => {
    localStorage.removeItem('token');
    clearLocalSettings();
    this.setState({
      has_token: false,
      user: undefined,
      toRedirect: true,
      triedLoading: true,
    });
  };

  // Adds a newly created assignment to the appropriate course object
  public addAssignment = (assignment: AssignmentType) => {
    // User might also be a grader and/or student of course
    const courseLists = [this.state.user!.graderCourses, this.state.user!.studentCourses];

    for (const courseList of courseLists) {
      const toChange = courseList.find((el) => {
        return el.id === assignment.course;
      });

      // Update via mutation
      if (toChange) {
        toChange.assignments = [...toChange.assignments, assignment.id];
      }
    }
  };

  // Removes a deleted assignment from the appropriate course object
  public deleteAssignment = (assignment: AssignmentType) => {
    // User might also be a grader and/or student of course
    const courseLists = [this.state.user!.graderCourses, this.state.user!.studentCourses];

    for (const courseList of courseLists) {
      const toChange = courseList.find((el) => {
        return el.id === assignment.course;
      });

      // Update via mutation
      if (toChange) {
        toChange.assignments = toChange.assignments.filter((el) => {
          return el !== assignment.id;
        });
      }
    }
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
      });
  };

  public wrapTooltipContext = (node: React.ReactNode) => {
    if (typeof this.state.user !== 'undefined') {
      return <ShowTooltipContext.Provider value={this.state.user.showProductTips}>{node}</ShowTooltipContext.Provider>;
    } else {
      return node;
    }
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
          isSuperUser: superUsers.indexOf(json.user.email) > -1,
        });
        (window as any).gtag('set', { user_id: json.user.id });
        (window as any).gtag('set', 'organization', json.user.organization);
      })
      .catch((error) => {
        localStorage.removeItem('token');
        this.setState({ has_token: false, user: undefined, error: 'invalid' });
        return Promise.reject();
      });
  };

  public render() {
    if (this.state.toRedirect) {
      return <Redirect to={'/'} />;
    }

    /* tslint:disable:jsx-no-lambda */
    const demoRoute = (
      <Route
        exact={true}
        path={`${CODE_DEMO}/`}
        render={(props: any) =>
          this.wrapTooltipContext(
            <AsyncGrade
              {...props}
              user={this.state.user === undefined ? anonymousUser : this.state.user}
              handleLogout={this.handleLogout}
              inDemoMode={true}
            />,
          )
        }
      />
    );

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
      const isCodePostAdmin = user ? user.codePostAdmin : false;

      // FIXME: CIP
      //  User has a single course and the course is code in place
      const inCodeInPlace = user
        ? user.studentCourses.length + user.graderCourses.length + user.courseadminCourses.length === 1 &&
          ((isStudent && user.studentCourses[0].id === 925) ||
            (isGrader && user.graderCourses.length > 0 && user.graderCourses[0].id === 925) ||
            (isAdmin && user.courseadminCourses.length > 0 && user.courseadminCourses[0].id === 925))
        : false;

      let loginasRoute;
      let dashboardRoute;
      if (isCodePostAdmin) {
        loginasRoute = (
          <Route
            exact={true}
            path={'/loginAs/:email'}
            render={(props: any) => <LogInAs {...props} replaceUser={this.replaceUser} />}
          />
        );
        dashboardRoute = (
          <Route
            exact={true}
            path={'/dashboard'}
            render={(props: any) => (
              <DashboardLayout {...props} isLoggedIn={true} handleLogout={this.handleLogout} user={this.state.user} />
            )}
          />
        );
      }

      // const isLostCodeInPlace = user
      //   ? user.courseadminCourses.length === 0 &&
      //     user.graderCourses.length === 0 &&
      //     user.studentCourses.length === 1 &&
      //     user.studentCourses[0].id === 925 &&
      //     localStorage.getItem('source') === 'codePost'
      //   : false;

      // if (isLostCodeInPlace && !this.state.isSuperUser) {
      //   return (
      //     <div>
      //       <BrowserRouter>
      //         <Switch>
      //           <Route component={RemoteAuthRedirect} />
      //         </Switch>
      //       </BrowserRouter>
      //     </div>
      //   );
      // }
      if (inCodeInPlace || localStorage.getItem('source') !== 'codePost') {
        (window as any).Intercom('shutdown');
      } else if (isAdmin || isGrader) {
        (window as any).Intercom('boot', {
          app_id: 'kg4u5rp1',
          email: user.email,
          user_id: user.email,
          custom_launcher_selector: '#IntercomDefaultWidget',
          isAdmin: String(isAdmin),
          isGrader: String(isGrader),
        });
      } else if (isStudent) {
        (window as any).Intercom('boot', {
          app_id: 'kg4u5rp1',
          custom_launcher_selector: '#IntercomDefaultWidget',
          isStudent: String(isStudent),
        });
      } else {
        (window as any).Intercom('shutdown');
      }

      const consoleProps = {
        user: this.state.user,
        handleLogout: this.handleLogout,
        addAssignment: this.addAssignment,
        deleteAssignment: this.deleteAssignment,
        addCourse: this.addCreatedCourse,
        superGraderCourses,
        sectionsLed,
      };

      /* tslint:disable:jsx-no-lambda */
      let studentRoute;
      if (isStudent) {
        studentRoute = (
          <Route
            path={STUDENT}
            render={(props: any) =>
              this.wrapTooltipContext(
                <AsyncStudent
                  {...props}
                  {...consoleProps}
                  initialCourses={studentCourses}
                  uploadShortcut={this.state.studentUploadShortcut}
                  // uploadShortcut={{
                  //   assignmentID: 2,
                  //   files: [
                  //     { name: 'template.py', data: 'helloworld' },
                  //     { name: 'second.py', data: 'yoyoyo\nasdfasdf]\nasdf' },
                  //   ],
                  // }}
                />,
              )
            }
          />
        );
      }

      let graderRoute;
      if (isGrader) {
        graderRoute = (
          <Route
            path={GRADER}
            render={(props: any) =>
              this.wrapTooltipContext(<AsyncGrader {...props} {...consoleProps} initialCourses={graderCourses} />)
            }
          />
        );
      }

      let adminRoute;
      if (isAdmin) {
        adminRoute = (
          <Route
            path={ADMIN}
            render={(props: any) =>
              this.wrapTooltipContext(<AsyncAdmin {...props} {...consoleProps} initialCourses={courseAdminCourses} />)
            }
          />
        );
      }

      const gradeRoute = (
        <Route
          exact={true}
          path={`${CODE}/:submissionId`}
          render={(props: any) => {
            return this.wrapTooltipContext(
              <AsyncGrade {...props} user={this.state.user} handleLogout={this.handleLogout} inDemoMode={false} />,
            );
          }}
        />
      );

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

      return (
        <Switch>
          {loginasRoute}
          {dashboardRoute}

          <Route
            exact={true}
            path={'/settings'}
            render={(props: any) =>
              this.wrapTooltipContext(
                <Settings
                  {...props}
                  user={this.state.user}
                  handleLogout={this.handleLogout}
                  replaceUser={this.replaceUser}
                />,
              )
            }
          />

          {pageSelector}
          {studentRoute}
          {graderRoute}
          {adminRoute}
          {gradeRoute}
          {demoRoute}
          <IndexManager
            handleLogin={this.handleLogin}
            error={this.state.error}
            isLoggedIn={true}
            email={this.state.user!.email}
            handleLogout={this.handleLogout}
          />
        </Switch>
      );
    }

    if (this.state.triedLoading && localStorage.getItem('source') === 'Code in Place') {
      return (
        <div>
          <BrowserRouter>
            <Switch>
              <Route component={RemoteAuthFailed} />
            </Switch>
          </BrowserRouter>
        </div>
      );
    } else if (this.state.triedLoading) {
      return (
        <div>
          <Switch>{demoRoute}</Switch>
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
      if (localStorage.getItem('source') === 'codePost') {
        (window as any).Intercom('boot', {
          app_id: 'kg4u5rp1',
          custom_launcher_selector: '#IntercomDefaultWidget',
        });
      }
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
