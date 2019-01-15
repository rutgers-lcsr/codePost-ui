import * as React from 'react';
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
  error: string;
  loadState: string; // have we validated the token? Note we need to validate on server side
}

class PasswordReset extends React.Component<IPasswordResetProps, IPasswordResetState> {
  public state: Readonly<IPasswordResetState> = {
    error: '',
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
    const payload = new URLSearchParams();
    const key1 = 'uid';
    const key2 = 'token';
    payload.append(key1, this.props.match.params.uid);
    payload.append(key2, this.props.match.params.token);

    fetch('${process.env.API_URL}/registration/isTokenValid/', {
      body: payload,
      method: 'POST',
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        if (json.value) {
          this.setState({ loadState: 'valid' });
        } else {
          this.setState({ loadState: 'error', error: 'invalid_token' });
        }
      });
  };

  public handleReset = (e: any, data: any) => {
    e.preventDefault();

    const payload = new URLSearchParams();
    const key1 = 'token';
    const key2 = 'uid';
    const key3 = 'password';
    payload.append(key1, this.props.match.params.token);
    payload.append(key2, this.props.match.params.uid);
    payload.append(key3, data.password1);

    fetch('${process.env.API_URL}/resgistration/updatePassword/', {
      body: payload,
      method: 'POST',
    }).then((res) => {
      if (res.ok) {
        this.setState({ loadState: 'success' });
      }
    });
  };

  public render() {
    let message;
    switch (this.props.message) {
      case 'forgot':
        message = <p>Set a new password below.</p>;
        break;
      case 'activate':
        message = <p>Set up a codePost passowrd here to be able to access your account.</p>;
        break;
      default:
        message = '';
    }

    switch (this.state.loadState) {
      case 'valid':
        return (
          <div>
            {message}
            <PasswordResetForm handleSubmit={this.handleReset} />
          </div>
        );
        break;
      case 'updated':
        return <button>Click here to login</button>;
        break;
      case 'error':
        return <p>An error occurred. Did you already use this link to update your password?</p>;
        break;
      case 'success':
        return (
          <div>
            <p>Success! Try logging in now.</p>
          </div>
        );
        break;
      default:
        return <p>Hang tight...validating your token</p>;
    }
  }
}

export default PasswordReset;
