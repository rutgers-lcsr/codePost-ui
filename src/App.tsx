/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { lazy, ReactElement, ReactNode, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import '@ant-design/v5-patch-for-react-19';

/* other library imports */
import { Navigate, Route, Routes } from 'react-router-dom';

import { LegacyRouteRenderer, RouteComponentProps } from './router/legacy';

/* codePost imports */
import LogInAs from './components/core/LogInAs';
import Logout from './components/core/Logout';

import DashboardLayout from './components/codepost-admin/DashboardLayout';

import Home from './components/core/Home';

import { ADMIN, CODE, CODE_DEMO, GRADER, HEALTH_CHECK, HOME, STUDENT } from './routes';

import { AssignmentType } from './infrastructure/assignment';
import { CourseType } from './infrastructure/course';
import { UserType } from './infrastructure/user';

import IndexManager from './components/pre-auth/IndexManager';
import RemoteAuthFailed from './components/pre-auth/RemoteAuthFailed';

import Settings from './components/core/settings';

import RouterLoading from './components/core/RouterLoading';

import ForbiddenManager from './components/pre-auth/ForbiddenManager';

import { ShowTooltipContext } from './components/core/tooltips';

import { consoleArt } from './components/utils/consoleArt';

import { clearLocalSettings } from './components/utils/LocalSettings';

import { IBaseFileUpload } from './components/admin/assignments/assignments/SubmissionUpload/FileReader';

/******************************************************************************
 * Asynchronous components to dynamically load app code via code splitting
 ******************************************************************************/

const AsyncStudent = lazy(() => import('./components/student/StudentManager'));
const AsyncGrader = lazy(() => import('./components/grader/GraderManager'));
const AsyncAdmin = lazy(() => import('./components/admin/AdminManager'));
const AsyncGrade = lazy(() => import('./components/code-review/CodeConsole'));

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

/*****************************************************************************/

const App: React.FC = () => {
  // State management
  const [error, setError] = useState<string>('');
  const [hasToken, setHasToken] = useState<boolean>(() => !!localStorage.getItem('token'));
  const [user, setUser] = useState<UserType | undefined>(undefined);
  const [toRedirect, setToRedirect] = useState<boolean>(false);
  const [triedLoading, setTriedLoading] = useState<boolean>(false);
  const [isSuperUser, setIsSuperUser] = useState<boolean>(() => localStorage.getItem('isSuperUser') !== null);
  const [studentUploadShortcut, setStudentUploadShortcut] = useState<
    { assignmentID: number; files: IBaseFileUpload[] } | undefined
  >(undefined);
  const [authType, setAuthType] = useState<string>('JWT');
  const [propToken, setPropToken] = useState<string>('');

  // Refs for mutable values
  const loginCountRef = useRef<number>(0);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize localStorage on mount
  useEffect(() => {
    try {
      localStorage.setItem('source', 'codePost');
    } catch (err) {
      alert(
        `codePost needs permission from your browser to start.
Please follow these steps for your current browser...

Google Chrome:
  - Open up Chrome cookie settings:
      chrome://settings/content/cookies
  - Click Allow -> Add -> https://codepost.cs.rutgers.edu
      See a screenshot here:
      https://share.getcloudapp.com/eDu69Dnz
  - Try refreshing!

Firefox:
  - Open up Firefox cookie settings:
      about:preferences#privacy
  - Click Cookies and Site Data -> Manage Permissions
  - Type in https://codepost.cs.rutgers.edu -> Allow -> Save Changes
  - Try refreshing!
      `,
      );
    }

    console.log(...consoleArt);

    // Check for token in URL
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      window.history.replaceState({}, document.title, window.location.href.replace(/&token=[^&]*/gm, ''));
      setHasToken(true);
    }
  }, []);

  // Utility functions
  const getTokenExpiration = useCallback((token: string): number => {
    const jwtBody = token.split('.')[1];
    const decoded = JSON.parse(atob(jwtBody));
    decoded.exp = decoded.exp * 1000; // convert to milliseconds
    return decoded.exp;
  }, []);

  const wrapTooltipContext = useCallback(
    (node: ReactNode): ReactNode => {
      const wrappedNode = <Suspense fallback={<RouterLoading />}>{node}</Suspense>;

      if (user !== undefined) {
        return <ShowTooltipContext.Provider value={user.showProductTips}>{wrappedNode}</ShowTooltipContext.Provider>;
      } else {
        return wrappedNode;
      }
    },
    [user],
  );

  // User management functions
  const replaceUser = useCallback((newUser: UserType, redirect: boolean, isSuperUserParam: boolean) => {
    setUser(newUser);
    setToRedirect(redirect);
    setIsSuperUser((prev) => prev || isSuperUserParam);
    localStorage.setItem('token', newUser.token);
  }, []);

  const addCreatedCourse = useCallback(
    (course: CourseType) => {
      if (!user) {
        return;
      }

      const newUser = { ...user };
      newUser.courseadminCourses.push(course);
      newUser.graderCourses.push(course);
      setUser(newUser);
    },
    [user],
  );

  const addAssignment = useCallback(
    (assignment: AssignmentType) => {
      if (!user) return;

      const courseLists = [user.graderCourses, user.studentCourses];

      for (const courseList of courseLists) {
        const toChange = courseList.find((el) => el.id === assignment.course);

        if (toChange) {
          toChange.assignments = [...toChange.assignments, assignment.id];
        }
      }
    },
    [user],
  );

  const deleteAssignment = useCallback(
    (assignment: AssignmentType) => {
      if (!user) return;

      const courseLists = [user.graderCourses, user.studentCourses];

      for (const courseList of courseLists) {
        const toChange = courseList.find((el) => el.id === assignment.course);

        if (toChange) {
          toChange.assignments = toChange.assignments.filter((el) => el !== assignment.id);
        }
      }
    },
    [user],
  );

  // Token refresh functionality
  const refreshToken = useCallback(
    (currentUser: UserType) => {
      if (!hasToken) {
        return;
      }

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
          const exp = getTokenExpiration(json.token);
          const now = new Date().getTime();

          refreshTimerRef.current = setTimeout(
            () => {
              refreshToken(currentUser);
            },
            Math.max(0, exp - now - 1000),
          );

          (window as Window & typeof globalThis & { gtag?: (...args: unknown[]) => void }).gtag?.('set', {
            user_id: currentUser.id,
          });
          (window as Window & typeof globalThis & { gtag?: (...args: unknown[]) => void }).gtag?.(
            'set',
            'organization',
            currentUser.organization,
          );
        })
        .catch((err) => {
          console.error('Token refresh failed:', err);
        });
    },
    [hasToken, getTokenExpiration],
  );

  // Login/Logout handlers
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    clearLocalSettings();

    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    setHasToken(false);
    setUser(undefined);
    setToRedirect(true);
    setTriedLoading(true);
  }, []);

  const handleLogin = useCallback(
    (username: string, password: string, shouldRedirect: boolean) => {
      setError('');
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
          const jwtToken = json.token;
          localStorage.setItem('token', json.token);

          setError('');
          setHasToken(true);
          setUser(json.user);
          setToRedirect(shouldRedirect);
          setIsSuperUser(superUsers.indexOf(json.user.email) > -1);

          (window as Window & typeof globalThis & { gtag?: (...args: unknown[]) => void }).gtag?.('set', {
            user_id: json.user.id,
          });
          (window as Window & typeof globalThis & { gtag?: (...args: unknown[]) => void }).gtag?.(
            'set',
            'organization',
            json.user.organization,
          );

          const exp = getTokenExpiration(jwtToken);
          const now = new Date().getTime();

          refreshTimerRef.current = setTimeout(
            () => {
              refreshToken(json.user);
            },
            Math.max(0, exp - now - 1000),
          );
        })
        .catch((_error) => {
          localStorage.removeItem('token');
          setHasToken(false);
          setUser(undefined);
          setError('invalid');
          return Promise.reject();
        });
    },
    [getTokenExpiration, refreshToken],
  );

  // Try to login with existing token
  const tryToLogin = useCallback(() => {
    if (hasToken && !user && loginCountRef.current < 4) {
      let authHeader = `Bearer ${localStorage.getItem('token')}`;
      if (authType === 'Firebase') {
        if (propToken === '') {
          return;
        }
        authHeader = `Firebase ${propToken}`;
      }

      fetch(`${process.env.REACT_APP_API_URL}/registration/current_user/`, {
        headers: {
          Authorization: authHeader,
        },
      })
        .then(async (res) => {
          if (res.ok) {
            const currentUser = await res.json();

            localStorage.setItem('token', currentUser.token);
            setUser(currentUser);
            setTriedLoading(true);
            setIsSuperUser((prev) => superUsers.indexOf(currentUser.email) > -1 || prev);
            setAuthType('JWT');

            refreshToken(currentUser);
          } else if (res.status === 401) {
            setTriedLoading(true);
            handleLogout();
          } else {
            setTimeout(() => {
              loginCountRef.current += 1;
              tryToLogin();
            }, 1000);
          }
        })
        .catch((_error) => {
          setTimeout(() => {
            loginCountRef.current += 1;
            tryToLogin();
          }, 1000);
        });
    } else {
      setTriedLoading(true);
    }
  }, [hasToken, user, authType, propToken, refreshToken, handleLogout]);

  // Message handler for cross-origin authentication
  const messageHandler = useCallback(
    (event: MessageEvent) => {
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

      if (typeof event.data !== 'string') {
        return;
      }

      try {
        const payload = JSON.parse(event.data);

        if (!Object.prototype.hasOwnProperty.call(payload, 'token') || payload.token === '') {
          return;
        }

        const token = payload.token;

        let source = 'remote';
        if (Object.prototype.hasOwnProperty.call(payload, 'source')) {
          source = payload.source;
        }

        let uploadShortcut;
        if (Object.prototype.hasOwnProperty.call(payload, 'assignment') && payload.assignment !== undefined) {
          uploadShortcut = {
            assignmentID: payload.assignment,
            files: [],
          };

          if (Object.prototype.hasOwnProperty.call(payload, 'files')) {
            uploadShortcut = {
              ...uploadShortcut,
              files: payload.files,
            };
          }
        }

        let auth = 'JWT';
        if (Object.prototype.hasOwnProperty.call(payload, 'auth_type') && payload.auth_type !== undefined) {
          auth = payload.auth_type;
        }

        localStorage.setItem('source', source);

        if (!user) {
          setHasToken(true);
          setStudentUploadShortcut(uploadShortcut);
          setAuthType(auth);
          setPropToken(token);
          loginCountRef.current = 0;
          // tryToLogin will be called by useEffect
        } else if (studentUploadShortcut === undefined && uploadShortcut !== undefined) {
          setStudentUploadShortcut(uploadShortcut);
        }
      } catch (err) {
        console.log(err);
      }
    },
    [user, studentUploadShortcut],
  );

  // ComponentDidMount equivalent
  useEffect(() => {
    window.addEventListener('message', messageHandler, false);
    tryToLogin();

    return () => {
      window.removeEventListener('message', messageHandler, false);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger tryToLogin when hasToken changes
  useEffect(() => {
    if (hasToken && !user && !triedLoading) {
      tryToLogin();
    } else if (!hasToken && !triedLoading) {
      // No token available, mark as tried loading to show login screen
      setTriedLoading(true);
    }
  }, [hasToken, user, triedLoading, tryToLogin]);

  // Handle toRedirect state
  useEffect(() => {
    if (toRedirect) {
      setToRedirect(false);
    }
  }, [toRedirect]);

  // Sync isSuperUser with localStorage
  useEffect(() => {
    if (isSuperUser) {
      localStorage.setItem('isSuperUser', 'true');
    } else {
      localStorage.removeItem('isSuperUser');
    }
  }, [isSuperUser]);

  // Handle CommandBar user identification
  useEffect(() => {
    if (user) {
      window.CommandBar.boot({
        id: user.email,
      });
    }
  }, [user]);

  // Render
  if (toRedirect) {
    return <Navigate to="/" replace />;
  }

  const renderDemoRoute = () => (
    <Route
      path={`${CODE_DEMO}/*`}
      element={
        <LegacyRouteRenderer
          path={CODE_DEMO}
          render={(props: RouteComponentProps) =>
            wrapTooltipContext(
              <AsyncGrade
                {...props}
                user={user === undefined ? anonymousUser : user}
                handleLogout={handleLogout}
                inDemoMode={true}
              />,
            )
          }
        />
      }
    />
  );

  if (user !== undefined) {
    const courseAdminCourses = user.courseadminCourses;
    const graderCourses = user.graderCourses;
    const studentCourses = user.studentCourses;
    const superGraderCourses = user.superGraderCourses;
    const sectionsLed = user.leaderSections;

    const isStudent = studentCourses.length > 0;
    const isGrader = graderCourses.length > 0;
    const isAdmin = courseAdminCourses.length > 0 || user.canCreateCourses;
    const isCodePostAdmin = user.codePostAdmin;

    const inCodeInPlace =
      studentCourses.length + graderCourses.length + courseAdminCourses.length === 1 &&
      ((isStudent && studentCourses[0].id === 925) ||
        (isGrader && graderCourses.length > 0 && graderCourses[0].id === 925) ||
        (isAdmin && courseAdminCourses.length > 0 && courseAdminCourses[0].id === 925));

    if (inCodeInPlace || localStorage.getItem('source') !== 'codePost') {
      (window as Window & typeof globalThis & { Intercom?: (...args: unknown[]) => void }).Intercom?.('shutdown');
    } else if (isAdmin || isGrader) {
      (window as Window & typeof globalThis & { Intercom?: (...args: unknown[]) => void }).Intercom?.('boot', {
        app_id: 'kg4u5rp1',
        email: user.email,
        user_id: user.email,
        custom_launcher_selector: '#IntercomDefaultWidget',
        isAdmin: String(isAdmin),
        isGrader: String(isGrader),
      });
    } else if (isStudent) {
      (window as Window & typeof globalThis & { Intercom?: (...args: unknown[]) => void }).Intercom?.('boot', {
        app_id: 'kg4u5rp1',
        custom_launcher_selector: '#IntercomDefaultWidget',
        isStudent: String(isStudent),
      });
    } else {
      (window as Window & typeof globalThis & { Intercom?: (...args: unknown[]) => void }).Intercom?.('shutdown');
    }

    const consoleProps = {
      user,
      handleLogout,
      addAssignment,
      deleteAssignment,
      addCourse: addCreatedCourse,
      superGraderCourses,
      sectionsLed,
    };

    const loginAsRoute = isCodePostAdmin ? (
      <Route
        path="/loginAs/*"
        element={
          <LegacyRouteRenderer
            path="/loginAs"
            render={(props: RouteComponentProps) => <LogInAs {...props} replaceUser={replaceUser} />}
          />
        }
      />
    ) : null;

    const dashboardRoute = isCodePostAdmin ? <Route path="/dashboard" element={<DashboardLayout />} /> : null;

    const settingsRoute = (
      <Route
        path="/settings"
        element={
          <LegacyRouteRenderer
            path="/settings"
            end
            render={(props: RouteComponentProps) =>
              wrapTooltipContext(
                <Settings
                  {...props}
                  user={user === undefined ? anonymousUser : user}
                  handleLogout={handleLogout}
                  replaceUser={replaceUser}
                />,
              )
            }
          />
        }
      />
    );

    const studentRoute = isStudent ? (
      <Route
        path={`${STUDENT}/*`}
        element={
          <LegacyRouteRenderer
            path={STUDENT}
            render={(props: RouteComponentProps) =>
              wrapTooltipContext(<AsyncStudent {...props} {...consoleProps} initialCourses={studentCourses} />)
            }
          />
        }
      />
    ) : null;

    const graderRoute = isGrader ? (
      <Route
        path={`${GRADER}/*`}
        element={
          <LegacyRouteRenderer
            path={GRADER}
            render={(props: RouteComponentProps) =>
              wrapTooltipContext(<AsyncGrader {...props} {...consoleProps} initialCourses={graderCourses} />)
            }
          />
        }
      />
    ) : null;

    const adminRoute = isAdmin ? (
      <Route
        path={`${ADMIN}/*`}
        element={
          <LegacyRouteRenderer
            path={ADMIN}
            render={(props: RouteComponentProps) =>
              wrapTooltipContext(<AsyncAdmin {...props} {...consoleProps} initialCourses={courseAdminCourses} />)
            }
          />
        }
      />
    ) : null;

    const gradeRoute = (
      <Route
        path={`${CODE}/:submissionId`}
        element={
          <LegacyRouteRenderer
            path={`${CODE}/:submissionId`}
            end
            render={(props: RouteComponentProps<{ submissionId: string }>) =>
              wrapTooltipContext(
                <AsyncGrade
                  {...props}
                  user={user === undefined ? anonymousUser : user}
                  handleLogout={handleLogout}
                  inDemoMode={false}
                />,
              )
            }
          />
        }
      />
    );

    const logoutRoute = (
      <Route
        path="/logout"
        element={
          <LegacyRouteRenderer
            path="/logout"
            end
            render={(props: RouteComponentProps) => <Logout {...props} handleLogout={handleLogout} />}
          />
        }
      />
    );

    let homeRoute: ReactElement;
    if (isStudent && !isGrader && !isAdmin) {
      homeRoute = <Route path={HOME} element={<Navigate to="/student" replace />} />;
    } else if (!isStudent && isGrader && !isAdmin) {
      homeRoute = <Route path={HOME} element={<Navigate to="/grader" replace />} />;
    } else if (!isStudent && !isGrader && isAdmin) {
      homeRoute = <Route path={HOME} element={<Navigate to="/admin" replace />} />;
    } else {
      homeRoute = (
        <Route
          path={HOME}
          element={
            <LegacyRouteRenderer
              path={HOME}
              end
              render={(props: RouteComponentProps) => (
                <Home
                  {...props}
                  isStudent={isStudent}
                  isGrader={isGrader}
                  isAdmin={isAdmin}
                  handleLogout={handleLogout}
                  user={user === undefined ? anonymousUser : user}
                />
              )}
            />
          }
        />
      );
    }

    return (
      <Routes>
        {loginAsRoute}
        {dashboardRoute}
        {settingsRoute}
        {homeRoute}
        {studentRoute}
        {graderRoute}
        {adminRoute}
        {gradeRoute}
        {renderDemoRoute()}
        <Route path={HEALTH_CHECK} element={<div>OK</div>} />
        {logoutRoute}
        <Route path="*" element={<Navigate to={HOME} replace />} />
      </Routes>
    );
  }

  if (triedLoading && localStorage.getItem('source') === 'Code in Place') {
    return (
      <div>
        <Routes>
          <Route path="*" element={<RemoteAuthFailed />} />
        </Routes>
      </div>
    );
  }

  if (triedLoading) {
    return <IndexManager handleLogin={handleLogin} error={error} isLoggedIn={false} handleLogout={handleLogout} />;
  }

  if (localStorage.getItem('source') === 'codePost') {
    (window as Window & typeof globalThis & { Intercom?: (...args: unknown[]) => void }).Intercom?.('boot', {
      app_id: 'kg4u5rp1',
      custom_launcher_selector: '#IntercomDefaultWidget',
    });
  }

  return <div />;
};

export default App;
