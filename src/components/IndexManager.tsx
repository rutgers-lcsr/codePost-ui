import * as React from 'react';
import { Route, Switch } from 'react-router-dom';

import Landing from '../Landing';

import ForgotPasswordForm from './ForgotPasswordForm';
import LoginForm from './LoginForm';
import NoMatch from './NoMatch';
import PasswordReset from './PasswordReset';

import JoinSignup from './JoinSignup';
import SignupForm from './SignupForm';
import SignUpManager from './SignUpManager';

interface IndexManagerProps {
  error: string;
  handleLogin: (e: any, data: any) => void;
}

class IndexManager extends React.Component<IndexManagerProps, {}> {
  public render() {
    /* tslint:disable:jsx-no-lambda */
    return (
      <div>
        <Switch>
          <Route exact={true} path={'/'} component={Landing} />

          <Route
            exact={true}
            path={'/login'}
            render={(props: any) => <LoginForm handleLogin={this.props.handleLogin} error={this.props.error} />}
          />

          <Route exact={true} path={'/forgot-password'} component={ForgotPasswordForm} />

          <Route
            exact={true}
            path={'/signup/student'}
            render={(props: any) => <JoinSignup {...props} isCreating={false} />}
          />

          <Route
            exact={true}
            path={'/signup/staff/join'}
            render={(props: any) => <JoinSignup {...props} isCreating={false} />}
          />

          <Route
            exact={true}
            path={'/signup/staff/create'}
            render={(props: any) => <SignupForm {...props} isCreating={true} />}
          />

          <Route exact={true} path={'/signup/staff'} component={SignUpManager} />

          <Route
            exact={true}
            path={'/password-reset/:uid/:token'}
            render={(props: any) => <PasswordReset {...props} message={'forgot'} />}
          />

          <Route
            exact={true}
            path={'/activate/:uid/:token'}
            render={(props: any) => <PasswordReset {...props} message={'activate'} />}
          />

          <Route component={NoMatch} />
        </Switch>
      </div>
    );
  }
}

export default IndexManager;
