import * as React from "react"
import ForgotPasswordForm from './ForgotPasswordForm';
import LoginForm from './LoginForm';

interface IndexButtonsProps {
  error: string,
  handleLogin: (e: any, data: any) => void,
  handleReset: (e: any, data: any) => void,
}

interface IIndexState {
  displayed_form: string,
}

class IndexButtons extends React.Component<IndexButtonsProps, IIndexState> {
  public state: Readonly<IIndexState> = {
    displayed_form: '',
  }

  public toggleLogin = (e: any) => {
    switch (this.state.displayed_form) {
      case 'login':
        this.setState({displayed_form: ''});
        break;
      default:
        this.setState({displayed_form: 'login'});
    }
  }

  public toggleReset = (e: any) => {
    switch (this.state.displayed_form) {
      case 'forgot':
        this.setState({displayed_form: ''});
        break;
      default:
        this.setState({displayed_form: 'forgot'});
    }
  }

  public render() {
    let form;
    switch (this.state.displayed_form) {
      case 'login':
        form = <LoginForm handleLogin={this.props.handleLogin} />;
        break;
      case 'forgot':
        form = <ForgotPasswordForm handleReset={this.props.handleReset} />;
        break;
      default:
        form = null;
    }

    let error;
    switch (this.props.error) {
      case 'invalid':
        error = 'Invalid username and password'
        break;
      default:
        error = null
    }

    return (
      <div>
          <button onClick={this.toggleLogin}>Login</button>
          <button onClick={this.toggleReset}>Forgot your password?</button>
          <br />
          {form}
          <p>{error}</p>
      </div>
    );
  }
}

export default IndexButtons;