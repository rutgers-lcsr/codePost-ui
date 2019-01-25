import * as React from 'react';

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

  public handleChange = (e: any) => {
    const name = e.target.name;
    const value = e.target.value;
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

    if (hasSubmitted && !confirmEmailSent) {
      return <div>Hang tight...sending your email</div>;
    }

    if (hasSubmitted && confirmEmailSent) {
      return <div>Check your email to finish creating your account!</div>;
    }

    return (
      <form onSubmit={this.handleSignup}>
        <h4>Sign Up</h4>
        <p>Don't forget to use your organization's .edu address</p>
        <br />
        <label htmlFor="email">email</label>
        <input type="text" name="email" value={this.state.email} onChange={this.handleChange} />
        <br />
        <input type="submit" />
      </form>
    );
  }
}

export default JoinSignup;
