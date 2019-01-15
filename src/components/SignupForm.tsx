import * as React from 'react';
import { OrganizationType } from '../infrastructure/organization';

interface IState {
  password1: string;
  password2: string;
  email: string;
  hasSubmitted: boolean;
  confirmEmailSent: boolean;
  orgCheck: boolean;
  organization?: OrganizationType;
  tempOrgName: string;
  pendingValidation: boolean;
  validated: boolean;
}

interface IProps {
  isCreating: boolean;
}

class SignUpAndJoinForm extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    password1: '',
    password2: '',
    email: '',
    hasSubmitted: false,
    confirmEmailSent: false,
    orgCheck: false,
    pendingValidation: false,
    validated: false,
    tempOrgName: '',
  };

  private interval: any;

  public handleChange = (e: any) => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[name] = value;
      return newState;
    });
  };

  public restart = (e: any) => {
    this.setState({
      password1: '',
      password2: '',
      email: '',
      hasSubmitted: false,
      orgCheck: false,
      pendingValidation: false,
      validated: false,
    });
  };

  public handleSignup = (e: any) => {
    e.preventDefault();
    if (this.props.isCreating) {
      this.setState({ hasSubmitted: true }, () => {
        const payload = {
          username: this.state.email,
          email: this.state.email,
          password1: this.state.password1,
          password2: this.state.password2,
        };

        fetch('/registration/getOrganizationFromEmail/', {
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
              return Promise.reject();
            }
          })
          .then((json) => {
            this.setState({ organization: json.organization, orgCheck: true });
          });
      });
    } else {
      this.setState({ hasSubmitted: true }, () => {
        const payload = {
          username: this.state.email,
          email: this.state.email,
          password1: this.state.password1,
          password2: this.state.password2,
        };

        fetch('/registration/emailRegistration/', {
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
    }

    // figure out if there is an organization that matches submitted email
    // if no
    // if user is creating, ask user what organization they are affiliated with
    // if user isn't creating, bounce

    // if yes
    // if user is creating, ask them to confirm they are affiliated with Uni and can create courses => verify
    // if user isn't creating, check to see if they are affiliated with Uni

    // if they don't check, bounce
    // if they do check and they are creating => verify
    // if they do check and they aren't creating => verify that the user is attached to courses
  };

  public validateCreatingUser = (e: any) => {
    const { organization, email } = this.state;
    e.preventDefault();
    const orgName = organization ? organization.name : '';

    this.setState({ pendingValidation: true }, () => {
      fetch(`/registration/validateNewAdminUser/?email=${email}&organization=${orgName}`).then((res) => {
        if (res.status === 204) {
          this.interval = setInterval(() => {
            this.checkUserValidation();
          }, 10000);
          return Promise.resolve();
        } else {
          return Promise.reject();
        }
      });
    });
  };

  public checkUserValidation = () => {
    fetch(`/registration/checkStatusNewAdminUser?email=${this.state.email}`)
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        } else {
          return Promise.reject();
        }
      })
      .then((json) => {
        if (json.activated) {
          clearInterval(this.interval);
          console.log('done!');
        }
      });
  };

  public setTemporaryOrganization = (e: any) => {
    e.preventDefault();
    const tempOrg = {
      id: -1,
      name: this.state.tempOrgName,
      shortname: this.state.tempOrgName,
      emailDomain: this.state.email,
    };
    this.setState({ organization: tempOrg });
  };

  public render() {
    const { hasSubmitted, confirmEmailSent, orgCheck, organization, pendingValidation } = this.state;
    const { isCreating } = this.props;

    if (hasSubmitted) {
      if (isCreating) {
        if (pendingValidation) {
          return <div>Hang tight...we're validating your email</div>;
        }

        if (!orgCheck && !organization) {
          return <div>Hang tight...</div>;
        } else if (orgCheck && !organization) {
          return (
            <div>
              <form onSubmit={this.setTemporaryOrganization}>
                <p> What is the name of your organization? </p>
                <input type="text" name="tempOrgName" value={this.state.tempOrgName} onChange={this.handleChange} />
                <input type="submit" />
              </form>
            </div>
          );
        } else if (orgCheck && organization) {
          return (
            <form onSubmit={this.validateCreatingUser}>
              <input type="checkbox" /> Please check the box to indicate you are authorized to manage a course at{' '}
              {organization.name}.
              <input type="submit" />
            </form>
          );
        } else {
          return <div>Not sure how we got here..</div>;
        }
      } else {
        if (confirmEmailSent) {
          return <div>Check your email to continue activating your account!</div>;
        } else {
          return <div>Hang tight...</div>;
        }
      }
    }

    return (
      <form onSubmit={this.handleSignup}>
        <h4>Sign Up</h4>
        <p>Don't forget to use your organization's .edu address</p>
        <br />
        <label htmlFor="email">email</label>
        <input type="text" name="email" value={this.state.email} onChange={this.handleChange} />
        <br />
        <label htmlFor="password">password</label>
        <input type="password" name="password1" value={this.state.password1} onChange={this.handleChange} />
        <br />
        <label htmlFor="password">confirm password</label>
        <input type="password" name="password2" value={this.state.password2} onChange={this.handleChange} />
        <br />
        <input type="submit" />
      </form>
    );
  }
}

export default SignUpAndJoinForm;
