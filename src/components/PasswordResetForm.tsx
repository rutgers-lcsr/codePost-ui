import * as React from 'react';
import { FontIcon, TextField } from 'react-md';

interface IPasswordResetFormProps {
  handleSubmit: (e: any, data: any) => void;
}

const initialState = {
  password1: '',
  password2: '',
};

type State = Readonly<typeof initialState>;

class ForgotPasswordForm extends React.Component<IPasswordResetFormProps, State> {
  public readonly state: State = initialState;

  public handleChange = (label: string, value: string) => {
    const name = label;
    this.setState(
      (prevstate) => {
        const newState = { ...prevstate };
        newState[name] = value;
        return newState;
      },
      () => {
        console.log(this.state);
      },
    );
  };
  public handleSubmit = (e: any) => {
    return this.props.handleSubmit(e, this.state);
  };

  public render() {
    const { password1 } = this.state;
    const hasCapital = /[A-Z]/.test(password1);
    const hasLower = /[a-z]/.test(password1);
    const hasNumber = /[0-9]/.test(password1);
    const longEnough = password1.length > 7 && password1.length < 17;
    const passwordMatch = password1.length > 0 && password1 === this.state.password2;
    const showSubmit = hasCapital && hasLower && hasNumber && longEnough && passwordMatch;

    return (
      <div>
        <div className="passwordReset__password1">
          <TextField
            id="password-input"
            floating={true}
            label="Password"
            required={true}
            type="password"
            value={this.state.password1}
            onChange={this.handleChange.bind(this, 'password1')}
          />
          <div className="passwordReset__check-container">
            <div className="passwordReset__check-helptext">at least:</div>
            <div className="passwordReset__check">
              <div className="passwordReset__check__icon">
                <FontIcon forceSize={20} forceFontSize={true} primary={hasLower} error={!hasLower}>
                  {hasLower ? 'check' : 'close'}
                </FontIcon>
              </div>
              <div className={`passwordReset__check__text--${hasLower ? 'accept' : 'reject'}`}>1 Lowercase Letter</div>
            </div>
            <div className="passwordReset__check">
              <div className="passwordReset__check__icon">
                <FontIcon forceSize={20} forceFontSize={true} primary={hasCapital} error={!hasCapital}>
                  {hasCapital ? 'check' : 'close'}
                </FontIcon>
              </div>
              <div className={`passwordReset__check__text--${hasCapital ? 'accept' : 'reject'}`}>1 Capital Letter</div>
            </div>
            <div className="passwordReset__check">
              <div className="passwordReset__check__icon">
                <FontIcon forceSize={20} forceFontSize={true} primary={hasNumber} error={!hasNumber}>
                  {hasNumber ? 'check' : 'close'}
                </FontIcon>
              </div>
              <div className={`passwordReset__check__text--${hasNumber ? 'accept' : 'reject'}`}>1 Number</div>
            </div>
            <div className="passwordReset__check">
              <div className="passwordReset__check__icon">
                <FontIcon forceSize={20} forceFontSize={true} primary={longEnough} error={!longEnough}>
                  {longEnough ? 'check' : 'close'}
                </FontIcon>
              </div>
              <div className={`passwordReset__check__text--${longEnough ? 'accept' : 'reject'}`}>8-16 characters</div>
            </div>
          </div>
        </div>
        <div className="passwordReset__password2">
          <TextField
            id="password-input"
            floating={true}
            label="Confirm Password"
            required={true}
            type="password"
            value={this.state.password2}
            onChange={this.handleChange.bind(this, 'password2')}
          />
          <div className="passwordReset__confirmation-container">
            <div className="passwordReset__check">
              <div className="passwordReset__check__icon">
                <FontIcon forceSize={20} forceFontSize={true} primary={passwordMatch} error={!passwordMatch}>
                  {passwordMatch ? 'check' : 'close'}
                </FontIcon>
              </div>
              <div className={`passwordReset__check__text--${passwordMatch ? 'accept' : 'reject'}`}>
                Passwords match
              </div>
            </div>
          </div>
        </div>
        <div className={`passwordReset__submitBtn${showSubmit ? '' : '--hide'}`} onClick={this.handleSubmit}>
          Continue
          <FontIcon style={{ color: 'white', transform: 'scale(1.5,1.5)', marginLeft: '20px' }} inherit={true}>
            arrow_forward
          </FontIcon>
        </div>
      </div>
    );
  }
}

export default ForgotPasswordForm;
