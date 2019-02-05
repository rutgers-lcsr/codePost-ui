import * as React from 'react';
import { FontIcon, TextField } from 'react-md';

interface IState {
  email: string;

  // Join Flow states
  hasSubmitted: boolean;
  confirmEmailSent: boolean;
}

class UpgradeSignup extends React.Component<{}, IState> {
  public state: Readonly<IState> = {
    email: '',
    hasSubmitted: false,
    confirmEmailSent: false,
  };

  public handleChange = (name: string, value: string) => {
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[name] = value;
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

      fetch(`${process.env.REACT_APP_API_URL}/registration/upgradeAccount/`, {
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

    if (hasSubmitted) {
      const message = confirmEmailSent
        ? 'Check your email to finish upgrading your account!'
        : 'Hang tight...sending your email';
      return (
        <div className="SignUpManager">
          <div className="SignUpManager__main-container">
            <div className="SignUpManager__center-text">{message}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="SignUpManager">
        <div className="SignUpManager__main-container">
          <div className="SignUpManager__title">Upgrade your codePost Account</div>
          <div className="SignUpManager__subtitle">
            Upgrading your account will give you access to all of your old data. To do so, you will need to re-verify
            your email address and set a new password.
          </div>
          <div className="SignUpManager__form">
            <div>
              <TextField
                id="email-input"
                floating={true}
                placeholder="jill@princeton.edu"
                label="Email"
                required={true}
                value={this.state.email}
                onChange={this.handleChange.bind(this, 'email')}
              />
              <div className="SignUpManager__form__helptext">
                Don't forget to use the same email address from your old account!
              </div>
            </div>
            <div className="SignUpManager__submitBtn" onClick={this.handleSignup}>
              Continue
              <FontIcon style={{ color: 'white', transform: 'scale(1.5,1.5)', marginLeft: '20px' }} inherit={true}>
                arrow_forward
              </FontIcon>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default UpgradeSignup;
