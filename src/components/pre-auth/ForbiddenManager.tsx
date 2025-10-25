/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Route, Routes } from 'react-router-dom';

import { LegacyRouteRenderer } from '../../router/legacy';

/* codePost imports */
import LoginForm from './LoginForm';

import { ADMIN, CODE, GRADER, STUDENT } from '../../routes';

/**********************************************************************************************************************/

interface IndexManagerProps {
  error: string;
  handleLogin: (email: string, password: string, toRedirect: boolean) => Promise<void>;
}

class ForbiddenManager extends React.Component<IndexManagerProps, {}> {
  public render() {
    /* tslint:disable:jsx-no-lambda */
    const renderLogin = () => (
      <LoginForm
        handleLogin={this.props.handleLogin}
        error={this.props.error}
        title={'Login to see this page'}
        redirectAfterLogin={false}
      />
    );

    return (
      <div>
        <Routes>
          <Route
            path={`${STUDENT}/:courseName?/:period?/:assignmentName?`}
            element={
              <LegacyRouteRenderer
                path={`${STUDENT}/:courseName?/:period?/:assignmentName?`}
                end
                render={renderLogin}
              />
            }
          />

          <Route
            path={`${GRADER}/:courseName?/:period?/:assignmentName?/:panelName1?`}
            element={
              <LegacyRouteRenderer
                path={`${GRADER}/:courseName?/:period?/:assignmentName?/:panelName1?`}
                end
                render={renderLogin}
              />
            }
          />

          <Route
            path={`${ADMIN}/:courseName?/:period?/:panelName1?/:panelName2?`}
            element={
              <LegacyRouteRenderer
                path={`${ADMIN}/:courseName?/:period?/:panelName1?/:panelName2?`}
                end
                render={renderLogin}
              />
            }
          />

          <Route
            path={`${CODE}/:submissionId`}
            element={<LegacyRouteRenderer path={`${CODE}/:submissionId`} end render={renderLogin} />}
          />

          <Route path={'/settings'} element={<LegacyRouteRenderer path={'/settings'} end render={renderLogin} />} />
        </Routes>
      </div>
    );
  }
}

export default ForbiddenManager;
