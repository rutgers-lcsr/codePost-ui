/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Alert, Icon, Input, Typography } from 'antd';

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
      const newState = { ...prevstate };
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
        <div style={{ maxWidth: 500 }}>
          <br />
          <br />
          <Typography.Title level={1}>{this.props.title !== undefined ? this.props.title : 'Login'}</Typography.Title>
          <Input
            prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
            placeholder="Email address"
            value={this.state.email}
            onChange={this.handleChange.bind(this, 'email')}
            onKeyDown={this.handleKeyPress}
          />
          <br />
          <br />
          <Input.Password
            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
            placeholder="Password"
            value={this.state.password}
            onChange={this.handleChange.bind(this, 'password')}
            onKeyDown={this.handleKeyPress}
          />
          {this.renderError(this.props.error)}
          <br />
          <br />
          <CPButton onClick={this.handleLogin} cpType="primary" loading={this.state.loading}>
            Continue
          </CPButton>
          <br />
          <br />
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </PreAuthLayout>
    );
  }
}

export default LoginForm;
