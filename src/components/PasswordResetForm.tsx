import * as React from "react"

interface IPasswordResetFormProps {
  handleSubmit: (e: any, data: any) => void
}

const initialState = {
  password1: '',
  password2: '',
}

type State = Readonly<typeof initialState>;

class ForgotPasswordForm extends React.Component<IPasswordResetFormProps, State> {
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

  public handleSubmit = (e: any) => {
    return this.props.handleSubmit(e, this.state);
  }

  public render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <h4>Reset your password</h4>
        <label htmlFor="password1">Password </label>
        <input
          type="password"
          name="password1"
          onChange={this.handleChange}
        />
        <br />
        <br />
        <label htmlFor="password2">Confirm Password </label>
        <input
          type="password"
          name="password2"
          onChange={this.handleChange}
        />
        <br />
        <br />
        {this.state.password1 !== ""
          && this.state.password1===this.state.password2
          ? <input type="submit" />
          : ""}
      </form>
    );
  }
}

export default ForgotPasswordForm;