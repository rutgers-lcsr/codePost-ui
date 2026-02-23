// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { LockOutlined, UserOutlined } from '@ant-design/icons';

/* ant imports */
import { Alert, Input, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import PreAuthLayout from './PreAuthLayout';

import CPButton from '../core/CPButton';

/**********************************************************************************************************************/

interface ILoginFormProps {
  handleLogin: (email: string, password: string, toRedirect: boolean) => Promise<void>;
  error: string;
  title?: string;
  redirectAfterLogin: boolean;
  maintenanceMode?: boolean;
}

const LoginForm: React.FC<ILoginFormProps> = ({
  handleLogin,
  error,
  title = 'Login',
  redirectAfterLogin,
  maintenanceMode,
}) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState<'email' | 'password'>('email');

  const performLogin = React.useCallback(async () => {
    setLoading(true);
    try {
      await handleLogin(email, password, redirectAfterLogin);
    } catch {
      setPassword('');
      setLoading(false);
    }
  }, [email, password, redirectAfterLogin, handleLogin]);

  const checkSSO = React.useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/sso/check/?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.sso_enabled) {
        // Auto-redirect to SSO provider
        const redirectUrl = `${process.env.REACT_APP_API_URL}/auth/sso/login/${data.provider}/?email=${encodeURIComponent(email)}`;
        window.location.href = redirectUrl;
      } else {
        setStep('password');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      // Fallback to password on error
      setStep('password');
      setLoading(false);
    }
  }, [email]);

  const handleKeyPress = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (step === 'email') {
          e.preventDefault();
          checkSSO();
        } else if (step === 'password') {
          performLogin();
        }
      }
    },
    [step, checkSSO, performLogin],
  );

  const renderError = (errorMsg: string) => {
    switch (errorMsg) {
      case '':
        return '';
      case 'invalid':
        return (
          <div>
            <br />
            <Alert
              title="Error"
              description={'The email and password you entered are invalid.'}
              type="error"
              showIcon
            />
          </div>
        );
      default:
        return (
          <div>
            <br />
            <Alert title="Error" description={errorMsg} type="error" showIcon />
          </div>
        );
    }
  };

  return (
    <PreAuthLayout isLoggedIn={false}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <br />
        {maintenanceMode ? (
          <Typography.Title level={2} style={{ textAlign: 'center', color: 'orange' }}>
            CodePost is currently down for maintenance. Please try logging back in later.
          </Typography.Title>
        ) : (
          <div />
        )}
        <br />
        <Typography.Title level={1}>{title}</Typography.Title>
        <form onSubmit={(e) => e.preventDefault()}>
          <Input
            prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            placeholder="Email address"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={maintenanceMode || step !== 'email'}
            autoFocus={step === 'email'}
          />

          {step === 'password' && (
            <>
              <br />
              <br />
              <Input.Password
                prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                visibilityToggle={false}
                disabled={maintenanceMode}
                autoFocus
              />
            </>
          )}

          {renderError(error)}

          <br />
          <br />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {step === 'email' && (
              <CPButton onClick={checkSSO} cpType="primary" loading={loading} disabled={maintenanceMode || !email}>
                Continue
              </CPButton>
            )}

            {step === 'password' && (
              <CPButton onClick={performLogin} cpType="primary" loading={loading} disabled={maintenanceMode}>
                Log In
              </CPButton>
            )}

            {step !== 'email' && (
              <a
                onClick={() => {
                  setStep('email');
                  setPassword('');
                }}
                style={{ cursor: 'pointer' }}
              >
                Use a different email
              </a>
            )}
          </div>
        </form>
        <br />
        <br />
        <br />
        <br />
        <Link to="/forgot-password" className="text-link">
          Forgot password?
        </Link>
        <br />
        <a
          onClick={() => {
            window.open('/docs/faq#missing-email', '_blank');
          }}
          style={{ cursor: 'pointer' }}
          className="text-link"
        >
          Where's my sign up email?
        </a>
      </div>
    </PreAuthLayout>
  );
};

export default LoginForm;
