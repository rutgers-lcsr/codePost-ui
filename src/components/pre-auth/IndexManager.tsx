/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { BrowserRouter, Route, Switch } from 'react-router-dom';

/* codePost imports */
import Landing from '../../Landing';

import ForgotPasswordForm from './ForgotPasswordForm';
import LoginForm from './LoginForm';
import NoMatch from './NoMatch';
import PasswordReset from './PasswordReset';

import CreateSignup from './CreateSignup';
import JoinSignup from './JoinSignup';
import Pricing from './Pricing';
import PrivacyPolicy from './PrivacyPolicy';
import SignUpManager from './SignUpManager';
import TermsOfService from './TermsOfService';

/**********************************************************************************************************************/

interface IndexManagerProps {
  error: string;
  handleLogin: (email: string, password: string) => void;
  isAuthenticated: boolean;
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

            {/* Reminder: we used to offer an "upgrade" path */}

            <Route component={NoMatch} />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default IndexManager;
