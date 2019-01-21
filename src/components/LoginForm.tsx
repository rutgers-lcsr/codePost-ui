import * as React from 'react';
import { FontIcon, TextField } from 'react-md';
import { Link } from 'react-router-dom';
import { TopBarNoEmail } from './TopBar';

import '../styles/Auth.scss';

interface ILoginFormProps {
  handleLogin: (e: any, data: any) => void;
}

const initialState = {
  password: '',
  username: '',
};

type State = Readonly<typeof initialState>;

class LoginForm extends React.Component<ILoginFormProps, State> {
  public readonly state: State = initialState;

  public handleChange = (label: string, value: string) => {
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = value;
      return newState;
    });
  };

  public handleLogin = (e: any) => {
    return this.props.handleLogin(e, this.state);
  };

  public render() {
    return (
      <div>
        <TopBarNoEmail />
        <div className="login">
          <div className="login__main-container">
            <div className="login__main-container__title">Login</div>
            <div className="login__main-container__forms">
              <div className="login__main-container__forms__item">
                <TextField
                  id="username-input"
                  floating={true}
                  label="email"
                  required={true}
                  value={this.state.username}
                  onChange={this.handleChange.bind(this, 'username')}
                />
              </div>
              <div className="login__main-container__forms__item">
                <TextField
                  id="password-input"
                  floating={true}
                  label="password"
                  required={true}
                  type="password"
                  value={this.state.password}
                  onChange={this.handleChange.bind(this, 'password')}
                />
              </div>
              <div className="login__main-container__loginBtn" onClick={this.handleLogin}>
                Continue
                <FontIcon style={{ color: 'white', transform: 'scale(1.5,1.5)', marginLeft: '20px' }} inherit={true}>
                  arrow_forward
                </FontIcon>
              </div>
              <br />
              <br />
            </div>
            <div className="login__main-container__footer">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginForm;
