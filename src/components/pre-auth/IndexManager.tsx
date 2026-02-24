// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Route, Routes } from 'react-router-dom';

import ForgotPasswordForm from './ForgotPasswordForm';
import LoginForm from './LoginForm';
import NoMatch from './NoMatch';
import PasswordReset from './PasswordReset';

import { AllTestimonials } from '../landing/Testimonial';
import ValidateInvite from '../student/ValidateInvite';
import AboutUs from './AboutUs';
import AutograderDetail from './AutograderDetail';
import ChangeLog from './ChangeLog';
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
const AsyncDocs = React.lazy(() => import('../docs/DocsPage'));

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
            path="/"
            element={
              <React.Suspense fallback={<div />}>
                <AsyncLanding />
              </React.Suspense>
            }
          />

          <Route path="/logout" element={<Logout handleLogout={this.props.handleLogout} />} />

          <Route
            path="/login"
            element={
              <LoginForm
                handleLogin={this.props.handleLogin}
                error={this.props.error}
                redirectAfterLogin={true}
                maintenanceMode={false}
              />
            }
          />

          <Route path="/forgot-password" element={<ForgotPasswordForm isLoggedIn={this.props.isLoggedIn} />} />
          <Route path="/signup/join" element={<JoinSignup email={this.props.email} />} />
          <Route path="/signup/create" element={<CreateSignup isLoggedIn={this.props.isLoggedIn} />} />
          <Route path="/signup" element={<SignUpManager />} />
          <Route path="/terms" element={<TermsOfService isLoggedIn={this.props.isLoggedIn} />} />
          <Route path="/integrations" element={<IntegrationsPage isLoggedIn={this.props.isLoggedIn} />} />
          <Route
            path="/scholarships/computer-science-education"
            element={<Scholarship isLoggedIn={this.props.isLoggedIn} />}
          />
          <Route path="/autograder" element={<AutograderDetail isLoggedIn={this.props.isLoggedIn} />} />
          <Route
            path="/docs/*"
            element={
              <React.Suspense fallback={<div />}>
                <AsyncDocs />
              </React.Suspense>
            }
          />
          <Route path="/faqs" element={<FAQs isLoggedIn={this.props.isLoggedIn} />} />
          <Route path="/privacy" element={<PrivacyPolicy isLoggedIn={this.props.isLoggedIn} />} />
          <Route path="/why-use-codepost" element={<WhyUse isLoggedIn={this.props.isLoggedIn} />} />
          <Route path="/about" element={<AboutUs isLoggedIn={this.props.isLoggedIn} />} />
          <Route path="/changelog" element={<ChangeLog isLoggedIn={this.props.isLoggedIn} />} />
          <Route path="/testimonials" element={<AllTestimonials isLoggedIn={this.props.isLoggedIn} />} />

          <Route
            path="/password-reset/:uid/:token"
            element={<PasswordReset message={'forgot'} isLoggedIn={this.props.isLoggedIn} />}
          />

          <Route
            path="/activate/:uid/:token"
            element={<PasswordReset message={'activate'} isLoggedIn={this.props.isLoggedIn} />}
          />

          <Route path="/invite/:sid/:token" element={<ValidateInvite isLoggedIn={this.props.isLoggedIn} />} />

          <Route path={`${CODE_DEMO}/`} element={null} />

          {/* Protected routes - show login form when accessed without authentication */}
          <Route path={`${STUDENT}/:courseName?/:period?/:assignmentName?`} element={loginElement} />

          <Route path={`${GRADER}/:courseName?/:period?/:assignmentName?/:panelName1?`} element={loginElement} />

          <Route path={`${ADMIN}/:courseName?/:period?/:panelName1?/:panelName2?`} element={loginElement} />

          <Route path={`${CODE}/:submissionId`} element={loginElement} />

          <Route path="/settings" element={loginElement} />
          <Route path="/organization/*" element={loginElement} />

          <Route path="*" element={<NoMatch isLoggedIn={this.props.isLoggedIn} />} />
        </Routes>
      </div>
    );
  }
}

export default IndexManager;
