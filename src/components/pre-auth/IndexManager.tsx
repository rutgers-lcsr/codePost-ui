/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Route, Routes } from 'react-router-dom';

import { LegacyRouteRenderer, RouteComponentProps } from '../../router/legacy';

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

import { ADMIN, CODE, CODE_DEMO, GRADER, STUDENT } from '../../routes';

/**********************************************************************************************************************/

const AsyncLanding = React.lazy(() => import('../landing/LandingABTest'));

interface IndexManagerProps {
  error: string;
  handleLogin: (email: string, password: string, toRedirect: boolean) => Promise<void>;
  handleLogout: () => void;
  isLoggedIn: boolean;
  email?: string;
}

class IndexManager extends React.Component<IndexManagerProps> {
  public render() {
    /* tslint:disable:jsx-no-lambda */
    return (
      <div>
        <Routes>
          <Route
            path="/"
            element={
              <LegacyRouteRenderer
                path="/"
                end
                render={(props: RouteComponentProps) => (
                  <React.Suspense fallback={<div />}>
                    <AsyncLanding {...props} />
                  </React.Suspense>
                )}
              />
            }
          />

          <Route
            path="/logout"
            element={
              <LegacyRouteRenderer
                path="/logout"
                end
                render={(props: RouteComponentProps) => <Logout {...props} handleLogout={this.props.handleLogout} />}
              />
            }
          />

          <Route
            path="/login"
            element={
              <LegacyRouteRenderer
                path="/login"
                end
                render={(_props: RouteComponentProps) => (
                  <LoginForm
                    handleLogin={this.props.handleLogin}
                    error={this.props.error}
                    redirectAfterLogin={true}
                    maintenanceMode={false}
                  />
                )}
              />
            }
          />

          <Route
            path="/forgot-password"
            element={
              <LegacyRouteRenderer
                path="/forgot-password"
                end
                render={(props: RouteComponentProps) => (
                  <ForgotPasswordForm {...props} isLoggedIn={this.props.isLoggedIn} />
                )}
              />
            }
          />
          <Route
            path="/signup/join"
            element={
              <LegacyRouteRenderer
                path="/signup/join"
                end
                render={(subprops: RouteComponentProps) => <JoinSignup {...subprops} email={this.props.email} />}
              />
            }
          />
          <Route
            path="/signup/create"
            element={
              <LegacyRouteRenderer
                path="/signup/create"
                end
                render={(props: RouteComponentProps) => <CreateSignup {...props} isLoggedIn={this.props.isLoggedIn} />}
              />
            }
          />
          <Route path="/signup" element={<LegacyRouteRenderer path="/signup" end render={() => <SignUpManager />} />} />
          <Route
            path="/terms"
            element={
              <LegacyRouteRenderer
                path="/terms"
                end
                render={(props: RouteComponentProps) => (
                  <TermsOfService {...props} isLoggedIn={this.props.isLoggedIn} />
                )}
              />
            }
          />
          <Route
            path="/integrations"
            element={
              <LegacyRouteRenderer
                path="/integrations"
                end
                render={(props: RouteComponentProps) => (
                  <IntegrationsPage {...props} isLoggedIn={this.props.isLoggedIn} />
                )}
              />
            }
          />
          <Route
            path="/scholarships/computer-science-education"
            element={
              <LegacyRouteRenderer
                path="/scholarships/computer-science-education"
                end
                render={(props: RouteComponentProps) => <Scholarship {...props} isLoggedIn={this.props.isLoggedIn} />}
              />
            }
          />
          <Route
            path="/autograder"
            element={
              <LegacyRouteRenderer
                path="/autograder"
                end
                render={(props: RouteComponentProps) => (
                  <AutograderDetail {...props} isLoggedIn={this.props.isLoggedIn} />
                )}
              />
            }
          />
          <Route
            path="/faqs"
            element={
              <LegacyRouteRenderer
                path="/faqs"
                end
                render={(props: RouteComponentProps) => <FAQs {...props} isLoggedIn={this.props.isLoggedIn} />}
              />
            }
          />
          <Route
            path="/privacy"
            element={
              <LegacyRouteRenderer
                path="/privacy"
                end
                render={(props: RouteComponentProps) => <PrivacyPolicy {...props} isLoggedIn={this.props.isLoggedIn} />}
              />
            }
          />
          <Route
            path="/why-use-codepost"
            element={
              <LegacyRouteRenderer
                path="/why-use-codepost"
                end
                render={(props: RouteComponentProps) => <WhyUse {...props} isLoggedIn={this.props.isLoggedIn} />}
              />
            }
          />
          <Route
            path="/about"
            element={
              <LegacyRouteRenderer
                path="/about"
                end
                render={(props: RouteComponentProps) => <AboutUs {...props} isLoggedIn={this.props.isLoggedIn} />}
              />
            }
          />
          <Route
            path="/testimonials"
            element={
              <LegacyRouteRenderer
                path="/testimonials"
                end
                render={(props: RouteComponentProps) => (
                  <AllTestimonials {...props} isLoggedIn={this.props.isLoggedIn} />
                )}
              />
            }
          />

          <Route
            path="/password-reset/:uid/:token"
            element={
              <LegacyRouteRenderer
                path="/password-reset/:uid/:token"
                end
                render={(props: RouteComponentProps<{ uid: string; token: string }>) => (
                  <PasswordReset {...props} message={'forgot'} isLoggedIn={this.props.isLoggedIn} />
                )}
              />
            }
          />

          <Route
            path="/activate/:uid/:token"
            element={
              <LegacyRouteRenderer
                path="/activate/:uid/:token"
                end
                render={(props: RouteComponentProps<{ uid: string; token: string }>) => (
                  <PasswordReset {...props} message={'activate'} isLoggedIn={this.props.isLoggedIn} />
                )}
              />
            }
          />

          <Route
            path="/invite/:sid/:token"
            element={
              <LegacyRouteRenderer
                path="/invite/:sid/:token"
                end
                render={(props: RouteComponentProps<{ sid: string; token: string }>) => (
                  <ValidateInvite {...props} isLoggedIn={this.props.isLoggedIn} />
                )}
              />
            }
          />

          <Route
            path={`${CODE_DEMO}/`}
            element={<LegacyRouteRenderer path={`${CODE_DEMO}/`} end render={() => null} />}
          />

          {/* Protected routes - show login form when accessed without authentication */}
          <Route
            path={`${STUDENT}/:courseName?/:period?/:assignmentName?`}
            element={
              <LegacyRouteRenderer
                path={`${STUDENT}/:courseName?/:period?/:assignmentName?`}
                end
                render={() => (
                  <LoginForm
                    handleLogin={this.props.handleLogin}
                    error={this.props.error}
                    title={'Login to see this page'}
                    redirectAfterLogin={false}
                  />
                )}
              />
            }
          />

          <Route
            path={`${GRADER}/:courseName?/:period?/:assignmentName?/:panelName1?`}
            element={
              <LegacyRouteRenderer
                path={`${GRADER}/:courseName?/:period?/:assignmentName?/:panelName1?`}
                end
                render={() => (
                  <LoginForm
                    handleLogin={this.props.handleLogin}
                    error={this.props.error}
                    title={'Login to see this page'}
                    redirectAfterLogin={false}
                  />
                )}
              />
            }
          />

          <Route
            path={`${ADMIN}/:courseName?/:period?/:panelName1?/:panelName2?`}
            element={
              <LegacyRouteRenderer
                path={`${ADMIN}/:courseName?/:period?/:panelName1?/:panelName2?`}
                end
                render={() => (
                  <LoginForm
                    handleLogin={this.props.handleLogin}
                    error={this.props.error}
                    title={'Login to see this page'}
                    redirectAfterLogin={false}
                  />
                )}
              />
            }
          />

          <Route
            path={`${CODE}/:submissionId`}
            element={
              <LegacyRouteRenderer
                path={`${CODE}/:submissionId`}
                end
                render={() => (
                  <LoginForm
                    handleLogin={this.props.handleLogin}
                    error={this.props.error}
                    title={'Login to see this page'}
                    redirectAfterLogin={false}
                  />
                )}
              />
            }
          />

          <Route
            path="/settings"
            element={
              <LegacyRouteRenderer
                path="/settings"
                end
                render={() => (
                  <LoginForm
                    handleLogin={this.props.handleLogin}
                    error={this.props.error}
                    title={'Login to see this page'}
                    redirectAfterLogin={false}
                  />
                )}
              />
            }
          />

          <Route
            path="*"
            element={
              <LegacyRouteRenderer
                path="*"
                render={(props: RouteComponentProps) => <NoMatch {...props} isLoggedIn={this.props.isLoggedIn} />}
              />
            }
          />
        </Routes>
      </div>
    );
  }
}

export default IndexManager;
