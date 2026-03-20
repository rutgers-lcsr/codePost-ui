// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { lazy, ReactElement, ReactNode, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* other library imports */
import { Navigate, Route, Routes } from 'react-router-dom';

/* codePost imports */
import LogInAs from './components/core/LogInAs';
import Logout from './components/core/Logout';

import Dashboard from './components/codepost-admin/Dashboard';

import Home from './components/core/Home';

import { ADMIN, CODE, CODE_DEMO, GRADER, HEALTH_CHECK, HOME, STUDENT } from './routes';

import { Course, User } from './api-client';
import { Assignment } from './types/common';

import { registrationApi, tokenAuthApi, tokenRefreshApi } from './api-client/clients';
import { ResponseError, type InitOverrideFunction } from './api-client/runtime';

import { normalizeUser } from './utils/normalizeUser';

import IndexManager from './components/pre-auth/IndexManager';
import ChangeLog from './components/pre-auth/ChangeLog';
import RemoteAuthFailed from './components/pre-auth/RemoteAuthFailed';
import TermsOfService from './components/pre-auth/TermsOfService';

import Settings from './components/core/settings';

import RouterLoading from './components/core/RouterLoading';

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
const AsyncOrg = lazy(() => import('./components/organization/OrgDashboard'));
const AsyncGrade = lazy(() => import('./features/code-review/CodeConsole'));
const AsyncDemoLanding = lazy(() => import('./features/code-review/DemoLanding'));
const AsyncDemoAdmin = lazy(() => import('./features/code-review/DemoAdmin'));
const AsyncDemoGrader = lazy(() => import('./features/code-review/DemoGrader'));
const AsyncDevTools = lazy(() => import('./components/dev/DevTools'));
const AsyncDocs = lazy(() => import('./components/docs/DocsPage'));

/*****************************************************************************/

const anonymousUser: User = {
  email: 'anonymous@university.edu',
  id: -1,
  token: '',
  password: '',
  organization: 1,
  canCreateCourses: false,
  canModifyRosters: false,
  apiToken: null,
  studentCourses: [],
  graderCourses: [],
  superGraderCourses: [],
  courseadminCourses: [],
  leaderSections: [],
  studentSections: [],
  showProductTips: true,
  codePostAdmin: false,
  hasCredentials: false,
  isOrgStaff: false,
};

const domains = ['mooc.codepost.io', 'localhost:3000', 'compedu.stanford.edu', 'princeton.edu'];

/*****************************************************************************/

const superUsers = ['james@codepost.io', 'vinay@codepost.io', 'richard@codepost.io'];

/*****************************************************************************/

const App: React.FC = () => {
  // State management
  const [error, setError] = useState<string>('');
  const [hasToken, setHasToken] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return !!localStorage.getItem('token') || !!urlParams.get('token');
  });
  const [user, setUser] = useState<User | undefined>(undefined);
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
    } catch {
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
    const redirectUrl = urlParams.get('redirect');

    if (urlToken) {
      localStorage.setItem('token', urlToken);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      window.history.replaceState({}, document.title, newUrl.toString());

      setHasToken(true);
      setTriedLoading(false); // Reset this so the login effect can run

      // If redirect URL is provided, redirect after token is set
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } else {
      // Check for error in URL
      const urlError = urlParams.get('error');
      if (urlError) {
        setError(decodeURIComponent(urlError));

        // Clear any existing token to prevent auto-login retry interference
        localStorage.removeItem('token');
        setHasToken(false); // Update state to reflect logout

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('error');
        window.history.replaceState({}, document.title, newUrl.toString());
      }
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
  const replaceUser = useCallback((newUser: User, redirect: boolean, isSuperUserParam: boolean) => {
    // Stop any pending refresh from the previous identity before switching users.
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    setUser(newUser);
    setToRedirect(redirect);
    setIsSuperUser(isSuperUserParam);

    if (newUser.token) {
      localStorage.setItem('token', newUser.token);
      setHasToken(true);
    } else {
      localStorage.removeItem('token');
      setHasToken(false);
    }
  }, []);

  const addCreatedCourse = useCallback(
    (course: Course) => {
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
    (assignment: Assignment) => {
      if (!user) return;

      const courseLists = [user.graderCourses, user.studentCourses];

      for (const courseList of courseLists) {
        const toChange = courseList.find((el) => el.id === assignment.course);

        if (toChange) {
          const mutableCourse = toChange as typeof toChange & { assignments: number[] };
          mutableCourse.assignments = [...toChange.assignments, assignment.id];
        }
      }
    },
    [user],
  );

  const deleteAssignment = useCallback(
    (assignment: Assignment) => {
      if (!user) return;

      const courseLists = [user.graderCourses, user.studentCourses];

      for (const courseList of courseLists) {
        const toChange = courseList.find((el) => el.id === assignment.course);

        if (toChange) {
          const mutableCourse = toChange as typeof toChange & { assignments: number[] };
          mutableCourse.assignments = toChange.assignments.filter((el) => el !== assignment.id);
        }
      }
    },
    [user],
  );

  // Token refresh functionality
  const refreshToken = useCallback(
    (currentUser: User) => {
      if (!hasToken) {
        return;
      }

      const existingToken = localStorage.getItem('token') || '';
      if (!existingToken) {
        return;
      }

      tokenRefreshApi
        .create({ tokenRefreshSliding: { token: existingToken } })
        .then((json: { token: string }) => {
          // If token changed while this request was in-flight (e.g., loginAs),
          // ignore this stale refresh response to avoid switching identities back.
          const currentToken = localStorage.getItem('token') || '';
          if (!currentToken || currentToken !== existingToken) {
            return;
          }

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
      return tokenAuthApi
        .createRaw({ jWT: { username, password } })
        .then((response) => response.raw.json())
        .then((json: { token: string; user: unknown }) => {
          const jwtToken = json.token;
          localStorage.setItem('token', json.token);

          setError('');
          setHasToken(true);
          const normalizedUser = normalizeUser(json.user);
          setUser(normalizedUser);
          setToRedirect(shouldRedirect);
          setIsSuperUser(superUsers.indexOf(normalizedUser.email ?? '') > -1);

          (window as Window & typeof globalThis & { gtag?: (...args: unknown[]) => void }).gtag?.('set', {
            user_id: normalizedUser.id,
          });
          (window as Window & typeof globalThis & { gtag?: (...args: unknown[]) => void }).gtag?.(
            'set',
            'organization',
            normalizedUser.organization,
          );

          const exp = getTokenExpiration(jwtToken);
          const now = new Date().getTime();

          refreshTimerRef.current = setTimeout(
            () => {
              refreshToken(normalizedUser);
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

      const initOverrides: InitOverrideFunction | undefined =
        authType === 'Firebase'
          ? async ({ init }) => ({
              ...init,
              headers: {
                ...(init.headers || {}),
                Authorization: authHeader,
              },
            })
          : undefined;

      registrationApi
        .currentUserRetrieve(initOverrides)
        .then((currentUser) => {
          if (currentUser) {
            const normalizedUser = normalizeUser(currentUser);

            if (normalizedUser.token) {
              localStorage.setItem('token', normalizedUser.token);
            } else {
              localStorage.removeItem('token');
            }
            setUser(normalizedUser);
            setTriedLoading(true);
            setIsSuperUser((prev) => superUsers.indexOf(normalizedUser.email ?? '') > -1 || prev);
            setAuthType('JWT');

            refreshToken(normalizedUser);
          }
        })
        .catch((error: unknown) => {
          if (error instanceof ResponseError && error.response?.status === 401) {
            setTriedLoading(true);
            handleLogout();
            return;
          }
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

      if (typeof event.data !== 'string' || event.data === '') {
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

    // Only try to login if there is no error in the URL and no new token provided
    // If there is an error, avoiding auto-login avoids overwrite
    // If there is a token, setHasToken(true) above will trigger the second useEffect to login
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('error') && !urlParams.get('token')) {
      tryToLogin();
    }

    return () => {
      window.removeEventListener('message', messageHandler, false);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

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

  const consoleProps = useMemo(
    () => ({
      user: user ?? anonymousUser,
      handleLogout,
      addAssignment,
      deleteAssignment,
      addCourse: addCreatedCourse,
      superGraderCourses: user?.superGraderCourses ?? [],
      sectionsLed: user?.leaderSections ?? [],
    }),
    [user, handleLogout, addAssignment, deleteAssignment, addCreatedCourse],
  );

  // Render
  if (toRedirect) {
    return <Navigate to="/" replace />;
  }

  const renderDemoRoute = () => {
    const demoConsole = wrapTooltipContext(
      <AsyncGrade user={user === undefined ? anonymousUser : user} handleLogout={handleLogout} inDemoMode={true} />,
    );
    const demoLanding = (
      <Suspense fallback={<RouterLoading />}>
        <AsyncDemoLanding />
      </Suspense>
    );
    return (
      <Route path={`${CODE_DEMO}/*`}>
        <Route index element={demoLanding} />
        <Route path="grader" element={demoConsole} />
        <Route path="student" element={demoConsole} />
        <Route
          path="admin"
          element={
            <Suspense fallback={<RouterLoading />}>
              <AsyncDemoAdmin />
            </Suspense>
          }
        />
        <Route
          path="grader-console"
          element={
            <Suspense fallback={<RouterLoading />}>
              <AsyncDemoGrader />
            </Suspense>
          }
        />
        {/* Backward compat: bare /demo with ?sample= still works */}
        <Route path="*" element={demoConsole} />
      </Route>
    );
  };

  if (user !== undefined) {
    const courseAdminCourses = user.courseadminCourses;
    const graderCourses = user.graderCourses;
    const studentCourses = user.studentCourses;
    const superGraderCourses = user.superGraderCourses;

    const graderAccessibleCourses = Array.from(
      new Map([...graderCourses, ...superGraderCourses].map((course) => [course.id, course])).values(),
    );

    const isStudent = studentCourses.length > 0;
    const isGrader = graderAccessibleCourses.length > 0;
    const isAdmin = courseAdminCourses.length > 0 || user.canCreateCourses;
    const isCodePostAdmin = user.codePostAdmin;
    const canAccessSuperAdminConsole = isCodePostAdmin || isSuperUser;

    const inCodeInPlace =
      studentCourses.length + graderAccessibleCourses.length + courseAdminCourses.length === 1 &&
      ((isStudent && studentCourses[0].id === 925) ||
        (isGrader && graderAccessibleCourses.length > 0 && graderAccessibleCourses[0].id === 925) ||
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

    const loginAsRoute = <Route path="/loginAs/*" element={<LogInAs replaceUser={replaceUser} />} />;

    const docsRoute = (
      <Route
        path="/docs/*"
        element={
          <Suspense fallback={<RouterLoading />}>
            <AsyncDocs />
          </Suspense>
        }
      />
    );

    const termsRoutes = (
      <>
        <Route path="/terms" element={<TermsOfService isLoggedIn={true} />} />
        <Route path="/terms-of-service" element={<TermsOfService isLoggedIn={true} />} />
        <Route path="/tos" element={<TermsOfService isLoggedIn={true} />} />
        <Route path="/changelog" element={<ChangeLog isLoggedIn={true} />} />
      </>
    );

    const dashboardRoute = canAccessSuperAdminConsole ? <Route path="/dashboard" element={<Dashboard />} /> : null;

    const settingsRoute = (
      <Route
        path="/settings"
        element={wrapTooltipContext(
          <Settings
            user={user === undefined ? anonymousUser : user}
            handleLogout={handleLogout}
            replaceUser={replaceUser}
          />,
        )}
      />
    );

    const studentRoute = isStudent ? (
      <Route
        path={`${STUDENT}/*`}
        element={wrapTooltipContext(
          <AsyncStudent {...consoleProps} initialCourses={studentCourses} baseURL={STUDENT} />,
        )}
      />
    ) : null;

    const graderRoute = isGrader ? (
      <Route
        path={`${GRADER}/*`}
        element={wrapTooltipContext(
          <AsyncGrader {...consoleProps} initialCourses={graderAccessibleCourses} baseURL={GRADER} />,
        )}
      />
    ) : null;

    const adminRoute = isAdmin ? (
      <Route
        path={`${ADMIN}/*`}
        element={wrapTooltipContext(
          <AsyncAdmin {...consoleProps} initialCourses={courseAdminCourses} baseURL={ADMIN} />,
        )}
      />
    ) : null;

    const orgRoute = user.isOrgStaff ? (
      <Route
        path="/organization/*"
        element={wrapTooltipContext(<AsyncOrg user={user} handleLogout={handleLogout} baseURL="/organization" />)}
      />
    ) : null;

    const gradeRoute = (
      <Route
        path={`${CODE}/:submissionId`}
        element={wrapTooltipContext(
          <AsyncGrade
            user={user === undefined ? anonymousUser : user}
            handleLogout={handleLogout}
            inDemoMode={false}
          />,
        )}
      />
    );

    const logoutRoute = <Route path="/logout" element={<Logout handleLogout={handleLogout} />} />;

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
            <Home
              isStudent={isStudent}
              isGrader={isGrader}
              isAdmin={isAdmin}
              handleLogout={handleLogout}
              user={user === undefined ? anonymousUser : user}
            />
          }
        />
      );
    }

    return (
      <>
        <Routes>
          {loginAsRoute}
          {dashboardRoute}
          {settingsRoute}
          {docsRoute}
          {termsRoutes}
          {homeRoute}
          {studentRoute}
          {graderRoute}
          {adminRoute}
          {orgRoute}
          {gradeRoute}
          {renderDemoRoute()}
          <Route path={HEALTH_CHECK} element={<div>OK</div>} />
          {logoutRoute}
          <Route path="*" element={<Navigate to={HOME} replace />} />
        </Routes>
        {process.env.NODE_ENV === 'development' && (
          <Suspense fallback={null}>
            <AsyncDevTools replaceUser={replaceUser} />
          </Suspense>
        )}
      </>
    );
  }

  if (triedLoading && localStorage.getItem('source') === 'Code in Place') {
    return (
      <div>
        <Routes>
          <Route
            path="/docs/*"
            element={
              <Suspense fallback={<RouterLoading />}>
                <AsyncDocs />
              </Suspense>
            }
          />
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

  // Public routes (Docs, etc)
  return (
    <Routes>
      <Route
        path="/docs/*"
        element={
          <Suspense fallback={<RouterLoading />}>
            <AsyncDocs />
          </Suspense>
        }
      />
      <Route path="/terms" element={<TermsOfService isLoggedIn={false} />} />
      <Route path="/terms-of-service" element={<TermsOfService isLoggedIn={false} />} />
      <Route path="/tos" element={<TermsOfService isLoggedIn={false} />} />
      <Route path="/changelog" element={<ChangeLog isLoggedIn={false} />} />
      {renderDemoRoute()}
      <Route path="*" element={<div />} />
    </Routes>
  );
};

export default App;
