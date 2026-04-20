// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { UserOutlined } from '@ant-design/icons';

/* ant imports */
import { Alert, Input, Typography } from 'antd';

/* codePost imports */
import PreAuthLayout from './PreAuthLayout';

import CPButton from '../core/CPButton';

/**********************************************************************************************************************/

const initialState = {
  email: '',
  status: '',
};

type State = Readonly<typeof initialState>;

interface IProps {
  isLoggedIn: boolean;
}

class ForgotPasswordForm extends React.Component<IProps, State> {
  public readonly state: State = initialState;

  public handleChange = (name: keyof State, event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[name] = newValue;
      return newState;
    });
  };

  public handleReset = () => {
    const payload = new URLSearchParams();
    const data = this.state;

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // @ts-expect-error: legacy-ts-ignore
        payload.append(key, data[key]);
      }
    }

    fetch(`${process.env.REACT_APP_API_URL}/registration/emailPasswordReset/`, {
      body: payload,
      method: 'POST',
    }).then((res) => {
      if (res.ok) {
        this.setState({ status: 'success' });
      } else {
        this.setState({ status: 'failure' });
      }
    });
  };

  public resetState = () => {
    this.setState({
      email: '',
      status: '',
    });
  };

  public render() {
    let content;
    switch (this.state.status) {
      case 'success':
        content = (
          <Alert
            onClose={this.resetState}
            title="Success!"
            description={
              <span>
                Check your email for a link. Follow that to reset your password. If you don't see an email within a
                couple of minutes,{' '}
                <a href="/docs/faq#missing-email" target="_blank" className="text-link">
                  please read this
                </a>
                .
              </span>
            }
            type="success"
          />
        );
        break;
      case 'failure':
        content = (
          <Alert
            title="Error"
            description="An unknown error occurred. Please contact us if this message persists."
            type="error"
          />
        );
        break;
      default:
        content = (
          <div>
            <p>We'll send you an email with a password reset link.</p>
            <Input
              value={this.state.email}
              onChange={this.handleChange.bind(this, 'email')}
              placeholder="Email address"
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            />
            <br />
            <br />
            <CPButton onClick={this.handleReset} cpType="primary">
              Submit
            </CPButton>
          </div>
        );
        break;
    }

    return (
      <PreAuthLayout isLoggedIn={this.props.isLoggedIn}>
        <div style={{ width: 500, margin: '0 auto' }}>
          <br />
          <br />
          <Typography.Title level={1}>Reset your password</Typography.Title>
          {content}
        </div>
      </PreAuthLayout>
    );
  }
}

export default ForgotPasswordForm;
