/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost */
import PasswordResetForm from './PasswordResetForm';

import PreAuthLayout from './PreAuthLayout';

/**********************************************************************************************************************/

/****************************************************************
This component works as follows:

(1) Receive token from user in URL (most likely by clicking on
reset password link)

(2) Validate that token is valid on server-side. If so, render
password reset form. Note this is purely a UX optimization. We
don't want to present users with the password reset *form* before
we know their token is valid, but we *do* need to resubmit the token
with the form so that that update password action on the server-side
can be authenticated.

(3) Submit the token along with the new password to server. If
action succeeds, present user with option to log in. Otherwise,
present error message.
*****************************************************************/

/* NOTE: as of right now, this page allows users who have not previously set a password
/* to do so via the /activate or /password-reset URLs. This doesn't seem to cause any
/* adverse behavior, but worth noting in case in case this information can be used to
/* debug unexpected behavior in the future.
*/

interface IPasswordResetProps {
  match: any;
  message: string;
  isLoggedIn: boolean;
}

interface IPasswordResetState {
  formErrors: { [key: string]: string };
  loadState: string; // have we validated the token? Note we need to validate on server side
  email: string;
}

class PasswordReset extends React.Component<IPasswordResetProps, IPasswordResetState> {
  public state: Readonly<IPasswordResetState> = {
    formErrors: {},
    loadState: '',
    email: '',
  };

  public componentDidMount = () => {
    this.validateToken(this.props.match.params.token);
  };

  // After validating the token, we should take it out of the URl to avoiding leaking
  // the token in HTTP referer field if the user navigates away from the page.
  // For an explanation of this vulnerability:
  // https://robots.thoughtbot.com/is-your-site-leaking-password-reset-links
  public validateToken = (_token: string) => {
    // figure out what this function does

    const payload = {
      uid: this.props.match.params.uid,
      token: this.props.match.params.token,
    };

    fetch(`${process.env.REACT_APP_API_URL}/registration/verifyRegistrationToken/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      method: 'POST',
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        if (json.isValid) {
          this.setState({ loadState: 'valid', email: json.email });
        } else {
          this.setState({ loadState: 'invalidToken' });
        }
      });
  };

  public handleReset = (password: string) => {
    const payload = {
      token: this.props.match.params.token,
      uid: this.props.match.params.uid,
      password1: password,
      password2: password,
    };

    fetch(`${process.env.REACT_APP_API_URL}/registration/registerAndSetPassword/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      method: 'POST',
    })
      .then((res) => {
        if (res.ok || res.status === 400) {
          return res.json();
        } else {
          return Promise.reject();
        }
      })
      .then((json) => {
        if (json.isValid) {
          this.setState({ loadState: 'success' });
        } else {
          this.setState({ formErrors: json.errors });
        }
      });
  };

  public render() {
    const { loadState, formErrors } = this.state;

    let content;
    switch (loadState) {
      case 'valid':
        const errorList = Object.keys(formErrors).map((el, i) => {
          return (
            <li key={i}>
              {el}: {formErrors[el]}
            </li>
          );
        });

        let message;
        switch (this.props.message) {
          case 'forgot':
            message = 'Set a new password below';
            break;
          case 'activate':
            message = 'Set your codePost password below.';
            break;
          case 'upgrade':
            message = 'Set up a new codePost password to access your old account';
            break;
          default:
            message = '';
        }

        content = (
          <div>
            <p>{message}</p>
            <p>
              Your codePost email address: <Typography.Text code>{this.state.email}</Typography.Text>
            </p>
            <PasswordResetForm handleSubmit={this.handleReset} />
            <ul>{errorList}</ul>
          </div>
        );
        break;
      case 'invalidToken':
        let newLinkMessage;
        switch (this.props.message) {
          case 'forgot':
            newLinkMessage = (
              <span>
                Request a new password reset link <Link to="/forgot-password/">here</Link>.
              </span>
            );
            break;
          case 'activate':
            newLinkMessage = (
              <span>
                Request a new account activation link <Link to="/signup/join/">here</Link>.
              </span>
            );
            break;
          case 'upgrade':
            newLinkMessage = (
              <span>
                Request a new account upgrade link <Link to="/upgrade/">here</Link>.
              </span>
            );
            break;
          default:
            newLinkMessage = '';
        }

        content = (
          <div>
            <Typography.Title level={4}>There's something wrong with your link.</Typography.Title>Make sure you haven't
            received a more recent email from us (only the latest link will work).
            <br />
            <br />
            <div>{newLinkMessage}</div>
          </div>
        );

        break;
      case 'success':
        content = (
          <div>
            <Typography.Title level={4}>Success!</Typography.Title>
            <div>
              Try <Link to="/login">logging in</Link> now.
            </div>
          </div>
        );

        break;
      default:
        content = <p>Hang tight...validating your token</p>;
    }

    let title = '';
    switch (this.props.message) {
      case 'forgot':
        title = 'Reset your password';
        break;
      case 'activate':
        title = 'Set your password';
        break;
      case 'upgrade':
        title = 'Set your password';
        break;
    }

    return (
      <PreAuthLayout isLoggedIn={this.props.isLoggedIn}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <br />
          <br />
          <Typography.Title level={1}>{title}</Typography.Title>
          {content}
        </div>
      </PreAuthLayout>
    );
  }
}

export default PasswordReset;
