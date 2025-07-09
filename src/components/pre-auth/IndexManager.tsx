/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import Loadable from 'react-loadable';

import ForgotPasswordForm from './ForgotPasswordForm';
import LoginForm from './LoginForm';
import NoMatch from './NoMatch';
import PasswordReset from './PasswordReset';

import CreateSignup from './CreateSignup';
import FAQs from './FAQs';
import IntegrationsPage from './IntegrationsPage';
import JoinSignup from './JoinSignup';
import Scholarship from './Scholarship';
import AutograderDetail from './AutograderDetail';
import PrivacyPolicy from './PrivacyPolicy';
import { SignUpManager } from './SignUpManager';
import TermsOfService from './TermsOfService';
import WhyUse from './WhyUse';
import AboutUs from './AboutUs';
import { AllTestimonials } from '../landing/Testimonial';
import ValidateInvite from '../student/ValidateInvite';

import Logout from '../core/Logout';

import { CODE_DEMO } from '../../routes';

/**********************************************************************************************************************/

const AsyncLanding = Loadable({
  loader: () => import('../landing/LandingABTest'),
  loading: () => <div />,
});

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
            <Route exact={true} path={'/'} render={(props: any) => <AsyncLanding {...props} />} />

            <Route
              exact={true}
              path={'/logout'}
              render={(props: any) => <Logout {...props} handleLogout={this.props.handleLogout} />}
            />

            <Route
              exact={true}
              path={'/login'}
              render={(props: any) => (
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
              render={(props: any) => <TermsOfService {...props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/integrations'}
              render={(props: any) => <IntegrationsPage {...props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/scholarships/computer-science-education'}
              render={(props: any) => <Scholarship {...props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/autograder'}
              render={(props: any) => <AutograderDetail {...props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/faqs'}
              render={(props: any) => <FAQs {...props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/privacy'}
              render={(props: any) => <PrivacyPolicy {...props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/why-use-codepost'}
              render={(props: any) => <WhyUse {...props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/about'}
              render={(props: any) => <AboutUs {...props} isLoggedIn={this.props.isLoggedIn} />}
            />
            <Route
              exact={true}
              path={'/testimonials'}
              render={(props: any) => <AllTestimonials {...props} isLoggedIn={this.props.isLoggedIn} />}
            />

            <Route
              exact={true}
              path={'/password-reset/:uid/:token'}
              render={(props: any) => (
                <PasswordReset {...props} message={'forgot'} isLoggedIn={this.props.isLoggedIn} />
              )}
            />

            <Route
              exact={true}
              path={'/activate/:uid/:token'}
              render={(props: any) => (
                <PasswordReset {...props} message={'activate'} isLoggedIn={this.props.isLoggedIn} />
              )}
            />

            <Route
              exact={true}
              path={'/invite/:sid/:token'}
              render={(props: any) => <ValidateInvite {...props} isLoggedIn={this.props.isLoggedIn} />}
            />

            {/* prevents NoMatch from showing alongside component */}
            <Route exact={true} path={`${CODE_DEMO}/`} component={null} />

            {/* Reminder: we used to offer an "upgrade" path */}

            <Route component={NoMatch} isLoggedIn={this.props.isLoggedIn} />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default IndexManager;
