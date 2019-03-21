import * as React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import Landing from '../Landing';

import ForgotPasswordForm from './ForgotPasswordForm';
import LoginForm from './LoginForm';
import NoMatch from './NoMatch';
import PasswordReset from './PasswordReset';

import CreateSignup from './CreateSignup';
import JoinSignup from './JoinSignup';
import Pricing from './Pricing';
import SignUpManager from './SignUpManager';
import PrivacyPolicy from './TermsAndPrivacy/PrivacyPolicy';
import TermsOfService from './TermsAndPrivacy/TermsOfService';
import UpgradeSignup from './UpgradeSignup';

interface IndexManagerProps {
  error: string;
  handleLogin: (e: any, data: any) => void;
}

class IndexManager extends React.Component<IndexManagerProps, {}> {
  public render() {
    /* tslint:disable:jsx-no-lambda */
    return (
      <div>
        <BrowserRouter>
          <Switch>
            <Route exact={true} path={'/'} component={Landing} />

            <Route
              exact={true}
              path={'/login'}
              render={(props: any) => <LoginForm handleLogin={this.props.handleLogin} error={this.props.error} />}
            />

            <Route exact={true} path={'/upgrade'} component={UpgradeSignup} />
            <Route exact={true} path={'/forgot-password'} component={ForgotPasswordForm} />
            <Route exact={true} path={'/signup/student'} component={JoinSignup} />
            <Route exact={true} path={'/signup/staff/join'} component={JoinSignup} />
            <Route exact={true} path={'/signup/staff/create'} component={CreateSignup} />
            <Route exact={true} path={'/signup/staff'} component={SignUpManager} />
            <Route
              exact={true}
              path={'/terms'}
              render={(props: any) => <TermsOfService {...props} isAuthenticated={false} />}
            />
            <Route
              exact={true}
              path={'/pricing'}
              render={(props: any) => <Pricing {...props} isAuthenticated={false} />}
            />
            <Route
              exact={true}
              path={'/privacy'}
              render={(props: any) => <PrivacyPolicy {...props} isAuthenticated={false} />}
            />

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

            <Route
              exact={true}
              path={'/upgrade/:uid/:token'}
              render={(props: any) => <PasswordReset {...props} message={'upgrade'} />}
            />

            <Route component={NoMatch} />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default IndexManager;
