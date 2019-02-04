import * as React from 'react';
import { TextField } from 'react-md';
const initialState = {
  email: '',
  status: '',
};

type State = Readonly<typeof initialState>;

class ForgotPasswordForm extends React.Component<{}, State> {
  public readonly state: State = initialState;

  public handleChange = (name: string, value: string) => {
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[name] = value;
      return newState;
    });
  };

  public handleReset = (e: any) => {
    e.preventDefault();

    const payload = new URLSearchParams();
    const data = this.state;

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
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

  public render() {
    let content;
    switch (this.state.status) {
      case 'success':
        content = <div className="SignUpManager__center-text"> Email sent successfully! </div>;
        break;
      case 'failure':
        content = <div className="SignUpManager__center-text"> An unknown error occurred... </div>;
        break;
      default:
        content = (
          <div className="SignUpManager__form">
            <div>
              <TextField
                id="email-input"
                floating={true}
                label="Email"
                required={true}
                value={this.state.email}
                onChange={this.handleChange.bind(this, 'email')}
              />
            </div>
            <div className="SignUpManager__submitBtn" onClick={this.handleReset}>
              Submit
            </div>
          </div>
        );
        break;
    }

    return (
      <div className="SignUpManager">
        <div className="SignUpManager__main-container">
          <div className="SignUpManager__title">Reset your password</div>
          {content}
        </div>
      </div>
    );
  }
}

export default ForgotPasswordForm;
