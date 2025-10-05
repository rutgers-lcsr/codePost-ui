/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import ForgotPasswordForm from './ForgotPasswordForm';
import LoginForm from './LoginForm';
import NoMatch from './NoMatch';
import PasswordReset from './PasswordReset';

import { AllTestimonials } from '../landing/Testimonial';
import ValidateInvite from '../student/ValidateInvite';
import AboutUs from './AboutUs';
import AutograderDetail from './AutograderDetail';
import CreateSignup from './CreateSignup';
import FAQs from './FAQs';
import IntegrationsPage from './IntegrationsPage';
import JoinSignup from './JoinSignup';
import PrivacyPolicy from './PrivacyPolicy';
import Scholarship from './Scholarship';
import { SignUpManager } from './SignUpManager';
import TermsOfService from './TermsOfService';
import WhyUse from './WhyUse';

import Logout from '../core/Logout';

import { CODE_DEMO } from '../../routes';

/**********************************************************************************************************************/

const AsyncLanding = React.lazy(() => import('../landing/LandingABTest'));

interface IndexManagerProps {
  error: string;
  handleLogin: (email: string, password: string, toRedirect: boolean) => Promise<void>;
  handleLogout: () => void;
  isLoggedIn: boolean;
  email?: string;
}

class IndexManager extends React.Component<IndexManagerProps, {}> {
  public render() {
    /* tslint:disable:jsx-no-lambda */
    return (
      <div>
        <BrowserRouter>
          <Switch>
            <Route
              exact={true}
              path={'/'}
              render={(_props: any) => (
                <React.Suspense fallback={<div />}>
                  <AsyncLanding {..._props} />
                </React.Suspense>
              )}
            />

            <Route
              exact={true}
              path={'/logout'}
              render={(_props: any) => <Logout {..._props} handleLogout={this.props.handleLogout} />}
            />

            <Route
              exact={true}
              path={'/login'}
              render={(_props: any) => (
                <LoginForm
                  handleLogin={this.props.handleLogin}
                  error={this.props.error}
                  redirectAfterLogin={true}
                  maintenanceMode={false}
                />
              )}
            />

            <Route exact={true} path={'/forgot-password'} component={ForgotPasswordForm} />
            <Route
              exact={true}
              path={'/signup/join'}
              render={(subprops: any) => <JoinSignup {...subprops} email={this.props.email} />}
            />
            <Route exact={true} path={'/signup/create'} component={CreateSignup} />
            <Route exact={true} path={'/signup'} component={SignUpManager} />
            <Route
              exact={true}
              path={'/terms'}
              render={(_props: any) => <TermsOfService {..._props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/integrations'}
              render={(_props: any) => <IntegrationsPage {..._props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/scholarships/computer-science-education'}
              render={(_props: any) => <Scholarship {..._props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/autograder'}
              render={(_props: any) => <AutograderDetail {..._props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/faqs'}
              render={(_props: any) => <FAQs {..._props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/privacy'}
              render={(_props: any) => <PrivacyPolicy {..._props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/why-use-codepost'}
              render={(_props: any) => <WhyUse {..._props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/about'}
              render={(_props: any) => <AboutUs {..._props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/testimonials'}
              render={(_props: any) => <AllTestimonials {..._props} isLoggedIn={this.props.isLoggedIn} />}
            />

            <Route
              exact={true}
              path={'/password-reset/:uid/:token'}
              render={(_props: any) => (
                <PasswordReset {..._props} message={'forgot'} isLoggedIn={this.props.isLoggedIn} />
              )}
            />

            <Route
              exact={true}
              path={'/activate/:uid/:token'}
              render={(_props: any) => (
                <PasswordReset {..._props} message={'activate'} isLoggedIn={this.props.isLoggedIn} />
              )}
            />

            <Route
              exact={true}
              path={'/invite/:sid/:token'}
              render={(_props: any) => <ValidateInvite {..._props} isLoggedIn={this.props.isLoggedIn} />}
            />

            {/* prevents NoMatch from showing alongside component */}
            <Route exact={true} path={`${CODE_DEMO}/`} render={() => null} />

            {/* Reminder: we used to offer an "upgrade" path */}

            <Route render={(props) => <NoMatch {...props} isLoggedIn={this.props.isLoggedIn} />} />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default IndexManager;
