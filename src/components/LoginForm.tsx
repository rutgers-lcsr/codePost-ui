import * as React from 'react';
import { Link } from 'react-router-dom';

import '../styles/Auth.scss';

interface ILoginFormProps {
  handleLogin: (e: any, data: any) => void;
  error: string;
}

const initialState = {
  password: '',
  username: '',
};

type State = Readonly<typeof initialState>;

class LoginForm extends React.Component<ILoginFormProps, State> {
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

  public handleLogin = (e: any) => {
    return this.props.handleLogin(e, this.state);
  };

  public renderError = (error: string) => {
    switch (error) {
      case '':
        return '';
      case 'invalid':
        return 'The username and password you entered are invalid.';
      default:
        return 'An unknown error occurred.';
    }
  };

  public render() {
    return (
      <div>
        <form onSubmit={this.handleLogin} className="container-login">
          <h4>Log In</h4>
          <label htmlFor="username">Username</label>
          <input type="text" name="username" value={this.state.username} onChange={this.handleChange} />
          <label htmlFor="password">Password</label>
          <input type="password" name="password" value={this.state.password} onChange={this.handleChange} />
          <input type="submit" />
          <br />
          <br />
          <p>{this.renderError(this.props.error)}</p>
          <Link to="/forgot-password">Forgot your password?</Link>
        </form>
      </div>
    );
  }
}

export default LoginForm;
