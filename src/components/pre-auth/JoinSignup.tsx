/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Alert, Input, Spin, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import PreAuthSignupLayout from './PreAuthSignupLayout';

import CPButton from '../core/CPButton';

/**********************************************************************************************************************/

interface IState {
  email: string;

  // Join Flow states
  hasSubmitted: boolean;
  confirmEmailSent: boolean;
}

class JoinSignup extends React.Component<{}, IState> {
  public state: Readonly<IState> = {
    email: '',
    hasSubmitted: false,
    confirmEmailSent: false,
  };

  public handleChange = (name: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[name] = newValue;
      return newState;
    });
  };

  public handleSignup = (e: any) => {
    e.preventDefault();
    this.setState({ hasSubmitted: true }, () => {
      const payload = {
        username: this.state.email,
        email: this.state.email,
      };

      fetch(`${process.env.REACT_APP_API_URL}/registration/emailRegistration/`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (res.status === 200) {
            return res.json();
          } else {
            return Promise.reject(res.status);
          }
        })
        .then((res) => {
          this.setState({ confirmEmailSent: res.success });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  };

  public render() {
    const { hasSubmitted, confirmEmailSent } = this.state;

    let content;
    if (hasSubmitted) {
      content = confirmEmailSent ? (
        <Alert message={'Success!'} description="Check your email to finish signing up." />
      ) : (
        <span>
          Hang tight...sending you an email &nbsp; &nbsp; <Spin />
        </span>
      );
    } else {
      content = (
        <div>
          <Input
            placeholder="jill@princeton.edu"
            value={this.state.email}
            onChange={this.handleChange.bind(this, 'email')}
          />
          <div>
            Don't forget to use your organization's <Typography.Text code>.edu</Typography.Text> address!
          </div>
          <br />
          <div style={{ display: 'flex' }}>
            <Link to="/signup/staff">
              <CPButton cpType="secondary">Back</CPButton>
            </Link>
            &nbsp; &nbsp; &nbsp; &nbsp;
            <CPButton cpType="primary" onClick={this.handleSignup}>
              Continue
            </CPButton>
          </div>
        </div>
      );
    }

    return (
      <PreAuthSignupLayout step={1}>
        <div style={{ maxWidth: 500 }}>
          <br />
          <br />
          <Typography.Title level={1}>Join a course on codePost</Typography.Title>
          {content}
        </div>
      </PreAuthSignupLayout>
    );
  }
}

export default JoinSignup;
