import * as React from "react"

interface IForgotPasswordFormProps {
  handleReset: (e: any, data: any) => void
}

const initialState = {
  email: '',
}

type State = Readonly<typeof initialState>;

class ForgotPasswordForm extends React.Component<IForgotPasswordFormProps, State> {
  public readonly state: State = initialState

  public handleChange = (e: any) => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState(prevstate => {
      const newState = { ...prevstate };
      newState[name] = value;
      return newState;
    });
  }

  public handleLogin = (e: any) => {
    return this.props.handleReset(e, this.state);
  }

  public render() {
    return (
      <form onSubmit={this.handleLogin}>
        <h4>Reset your password</h4>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          id="id_email"
          value={this.state.email}
          onChange={this.handleChange}
        />
        <input type="submit" />
      </form>
    );
  }
}

export default ForgotPasswordForm;