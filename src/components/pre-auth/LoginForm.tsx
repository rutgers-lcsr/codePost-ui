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

  const performLogin = React.useCallback(async () => {
    setLoading(true);
    try {
      await handleLogin(email, password, redirectAfterLogin);
    } catch {
      setPassword('');
      setLoading(false);
    }
  }, [email, password, redirectAfterLogin, handleLogin]);

  const handleKeyPress = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        performLogin();
      }
    },
    [performLogin],
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
              message="Error"
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
            <Alert
              message="Error"
              description={'An unknown error occurred. Please contact us if this issue persists.'}
              type="error"
              showIcon
            />
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
        <Typography.Title level={2}>{title}</Typography.Title>
        <form>
          <Input
            prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            placeholder="Email address"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={maintenanceMode}
          />
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
          />
          {renderError(error)}
          <br />
          <br />
          <CPButton
            onClick={performLogin}
            cpType="primary"
            loading={loading}
            disabled={maintenanceMode}
          >
            Continue
          </CPButton>
        </form>
        <br />
        <br />
        <Link to="/forgot-password">Forgot password?</Link>
        <br />
        <a
          onClick={() => {
            window.open('https://help.codepost.io/en/articles/3324251-faq-where-is-my-email', '_blank');
          }}
          style={{ cursor: 'pointer' }}
        >
          Where's my sign up email?
        </a>
      </div>
    </PreAuthLayout>
  );
};

export default LoginForm;
