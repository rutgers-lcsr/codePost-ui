/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { BrowserRouter, Route, Switch } from 'react-router-dom';

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
    return (
      <div>
        <BrowserRouter>
          <Switch>
            <Route
              exact={true}
              path={`${STUDENT}/:courseName?/:period?/:assignmentName?`}
              render={(_props: any) => (
                <LoginForm
                  handleLogin={this.props.handleLogin}
                  error={this.props.error}
                  title={'Login to see this page'}
                  redirectAfterLogin={false}
                />
              )}
            />

            <Route
              exact={true}
              path={`${GRADER}/:courseName?/:period?/:assignmentName?/:panelName1?`}
              render={(_props: any) => (
                <LoginForm
                  handleLogin={this.props.handleLogin}
                  error={this.props.error}
                  title={'Login to see this page'}
                  redirectAfterLogin={false}
                />
              )}
            />

            <Route
              exact={true}
              path={`${ADMIN}/:courseName?/:period?/:panelName1?/:panelName2?`}
              render={(_props: any) => (
                <LoginForm
                  handleLogin={this.props.handleLogin}
                  error={this.props.error}
                  title={'Login to see this page'}
                  redirectAfterLogin={false}
                />
              )}
            />

            <Route
              exact={true}
              path={`${CODE}/:submissionId`}
              render={(_props: any) => (
                <LoginForm
                  handleLogin={this.props.handleLogin}
                  error={this.props.error}
                  title={'Login to see this page'}
                  redirectAfterLogin={false}
                />
              )}
            />

            <Route
              exact={true}
              path={'/settings'}
              render={(_props: any) => (
                <LoginForm
                  handleLogin={this.props.handleLogin}
                  error={this.props.error}
                  title={'Login to see this page'}
                  redirectAfterLogin={false}
                />
              )}
            />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default ForbiddenManager;
