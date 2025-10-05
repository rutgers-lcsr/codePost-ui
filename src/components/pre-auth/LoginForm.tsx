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

const initialState = {
  email: '',
  password: '',
  loading: false,
};

type State = Readonly<typeof initialState>;

class LoginForm extends React.Component<ILoginFormProps, State> {
  public readonly state: State = initialState;

  public handleChange = (label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    this.setState((prevstate) => {
      const newState: any = { ...prevstate };
      newState[label] = newValue;
      return newState;
    });
  };

  public handleLogin = () => {
    this.setState({ loading: true });
    this.props.handleLogin(this.state.email, this.state.password, this.props.redirectAfterLogin).catch(() => {
      this.setState({ password: '', loading: false });
    });
  };

  public handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13) {
      this.handleLogin();
    }
  };

  public renderError = (error: string) => {
    switch (error) {
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

  public render() {
    return (
      <PreAuthLayout isLoggedIn={false}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <br />
          {this.props.maintenanceMode ? (
            <Typography.Title level={2} style={{ textAlign: 'center', color: 'orange' }}>
              CodePost is currently down for maintenance. Please try logging back in later.
            </Typography.Title>
          ) : (
            <div />
          )}
          <br />
          <Typography.Title level={2}>{this.props.title !== undefined ? this.props.title : 'Login'}</Typography.Title>
          <form>
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Email address"
              name="email"
              value={this.state.email}
              onChange={this.handleChange.bind(this, 'email')}
              onKeyDown={this.handleKeyPress}
              disabled={this.props.maintenanceMode}
            />
            <br />
            <br />
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Password"
              autoComplete="current-password"
              value={this.state.password}
              onChange={this.handleChange.bind(this, 'password')}
              onKeyDown={this.handleKeyPress}
              visibilityToggle={false}
              disabled={this.props.maintenanceMode}
            />
            {this.renderError(this.props.error)}
            <br />
            <br />
            <CPButton
              onClick={this.handleLogin}
              cpType="primary"
              loading={this.state.loading}
              disabled={this.props.maintenanceMode}
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
  }
}

export default LoginForm;
