import * as React from 'react';
import { Link } from 'react-router-dom';
import PasswordResetForm from './PasswordResetForm';

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
}

interface IPasswordResetState {
  formErrors: { [key: string]: string };
  loadState: string; // have we validated the token? Note we need to validate on server side
}

class PasswordReset extends React.Component<IPasswordResetProps, IPasswordResetState> {
  public state: Readonly<IPasswordResetState> = {
    formErrors: {},
    loadState: '',
  };

  public componentDidMount = () => {
    this.validateToken(this.props.match.params.token);
  };

  // After validating the token, we should take it out of the URl to avoiding leaking
  // the token in HTTP referer field if the user navigates away from the page.
  // For an explanation of this vulnerability:
  // https://robots.thoughtbot.com/is-your-site-leaking-password-reset-links
  public validateToken = (token: any) => {
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
          this.setState({ loadState: 'valid' });
        } else {
          this.setState({ loadState: 'invalidToken' });
        }
      });
  };

  public handleReset = (e: any, data: any) => {
    e.preventDefault();

    const payload = {
      token: this.props.match.params.token,
      uid: this.props.match.params.uid,
      password1: data.password1,
      password2: data.password2,
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
          console.log(json);
          this.setState({ formErrors: json.errors });
        }
      });
  };

  public render() {
    const { loadState, formErrors } = this.state;

    let message;
    switch (this.props.message) {
      case 'forgot':
        message = <p>Set a new password below.</p>;
        break;
      case 'activate':
        message = <p>Set up a codePost password here to be able to access your account.</p>;
        break;
      default:
        message = '';
    }

    switch (loadState) {
      case 'valid':
        const errorList = Object.keys(formErrors).map((el, i) => {
          return (
            <li key={i}>
              {el}: {formErrors[el]}
            </li>
          );
        });
        return (
          <div>
            {message}
            <PasswordResetForm handleSubmit={this.handleReset} />
            <ul>{errorList}</ul>
          </div>
        );
        break;
      case 'invalidToken':
        return <p>Your URL is invalid. Have you used this link to reset your password before?</p>;
        break;
      case 'success':
        return (
          <div>
            <p>
              Success! Try <Link to="/login">logging in</Link> now.
            </p>
          </div>
        );
        break;
      default:
        return <p>Hang tight...validating your token</p>;
    }
  }
}

export default PasswordReset;
