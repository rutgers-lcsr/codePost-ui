import * as React from "react"

const initialState = {
  email: '',
  status: '',
}

type State = Readonly<typeof initialState>;

class ForgotPasswordForm extends React.Component<{}, State> {
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

  public handleReset = (e: any) => {
    e.preventDefault();

    const payload = new URLSearchParams();
    const data = this.state;

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        payload.append(key, data[key]);
      }
    }

    fetch('http://localhost:8000/api/users/emailPasswordReset/', {
      body: payload,
      method: 'POST',
    })
      .then(res => {
        if (res.ok) {
          this.setState({status: 'success'})
        } else {
          this.setState({status: 'failure'})
        }
      });
  }

  public render() {

    // Should perform more granular error checking based on response code
    // We can do this as we encounter different types of errors. For now, it seems
    // like the only error state occurs if someone enters an email address that
    // isn't associated with a user
    // We should differentiate this from a random server error (resp. code = 500)
    switch(this.state.status) {
      case 'success':
        return (<div> Email sent successfully! </div>);
        break;
      case 'failure':
        return (<div> An unknown error occurred... </div>);
        break;
      default:
        break;
    }

    return (
      <form onSubmit={this.handleReset}>
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