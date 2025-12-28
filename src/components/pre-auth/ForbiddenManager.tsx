/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Route, Routes } from 'react-router-dom';

/* codePost imports */
import LoginForm from './LoginForm';

import { ADMIN, CODE, GRADER, STUDENT } from '../../routes';

/**********************************************************************************************************************/

interface IndexManagerProps {
  error: string;
  handleLogin: (email: string, password: string, toRedirect: boolean) => Promise<void>;
}

class ForbiddenManager extends React.Component<IndexManagerProps> {
  public render() {
    /* tslint:disable:jsx-no-lambda */
    const loginElement = (
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
            element={loginElement}
          />

          <Route
            path={`${GRADER}/:courseName?/:period?/:assignmentName?/:panelName1?`}
            element={loginElement}
          />

          <Route
            path={`${ADMIN}/:courseName?/:period?/:panelName1?/:panelName2?`}
            element={loginElement}
          />

          <Route
            path={`${CODE}/:submissionId`}
            element={loginElement}
          />

          <Route path={'/settings'} element={loginElement} />
        </Routes>
      </div>
    );
  }
}

export default ForbiddenManager;
