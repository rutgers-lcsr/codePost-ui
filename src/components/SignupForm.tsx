import * as React from 'react';

interface ISignupFormProps {
  handleSignup: (e: any, data: any) => void;
}

const initialState = {
  password: '',
  username: '',
};

type State = Readonly<typeof initialState>;

class SignupForm extends React.Component<ISignupFormProps, State> {
  public readonly state: State = initialState;

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
    return this.props.handleSignup(e, this.state);
  };

  public render() {
    return (
      <form onSubmit={this.handleSignup}>
        <h4>Sign Up</h4>
        <label htmlFor="username">Username</label>
        <input type="text" name="username" value={this.state.username} onChange={this.handleChange} />
        <label htmlFor="password">Password</label>
        <input type="password" name="password" value={this.state.password} onChange={this.handleChange} />
        <input type="submit" />
      </form>
    );
  }
}

export default SignupForm;
