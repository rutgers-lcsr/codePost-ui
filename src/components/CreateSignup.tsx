import * as React from 'react';
import { OrganizationType } from '../infrastructure/organization';

interface IState {
  password1: string;
  password2: string;
  email: string;

  // Join Flow states
  hasSubmitted: boolean;
  confirmEmailSent: boolean;

  // Create Flow states
  orgCheck: boolean;
  confirmAuthority: boolean;
  organization?: OrganizationType;
  tempOrgName: string;
  pendingValidation: boolean;
  validated: boolean;

  // Error states
  badEmailMatch: boolean;
  validationFailed: boolean;
}

class CreateSignup extends React.Component<{}, IState> {
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
    badEmailMatch: false,
    confirmAuthority: false,
    validationFailed: false,
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

  public handleSignup = (e: any) => {
    e.preventDefault();
    this.setState({ hasSubmitted: true }, () => {
      const payload = {
        username: this.state.email,
        email: this.state.email,
        password1: this.state.password1,
        password2: this.state.password2,
      };

      fetch(`${process.env.REACT_APP_API_URL}/registration/getOrganizationFromEmail/`, {
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
        })
        .catch((err) => {
          console.log(err);
        });
    });
  };

  public validateCreatingUser = (e: any) => {
    const { organization } = this.state;
    e.preventDefault();
    const orgName = organization ? organization.name : '';

    const payload = {
      email: this.state.email,
      organization: orgName,
      password1: this.state.password1,
      password2: this.state.password2,
    };

    this.setState({ pendingValidation: true }, () => {
      fetch(`${process.env.REACT_APP_API_URL}/registration/validateNewAdminUser/`, {
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
          this.interval = setInterval(() => {
            this.checkUserValidation();
          }, 10000);
          this.setState({ pendingValidation: true, confirmAuthority: false });
        });
    });
  };

  public checkUserValidation = () => {
    fetch(`${process.env.REACT_APP_API_URL}/registration/checkStatusNewAdminUser?email=${this.state.email}`)
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        } else {
          return Promise.reject();
        }
      })
      .then((json) => {
        console.log(json);
        if (!json.pending) {
          clearInterval(this.interval);
          if (json.status) {
            this.setState({ confirmEmailSent: true, pendingValidation: false });
          } else {
            this.setState({ confirmEmailSent: true, pendingValidation: false, validationFailed: true });
          }
        }
      });
  };

  public setTemporaryOrganization = (e: any) => {
    e.preventDefault();
    const payload = {
      email: this.state.email,
      organizationName: this.state.tempOrgName,
    };

    fetch(`${process.env.REACT_APP_API_URL}/registration/getOrganizationFromName/`, {
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
        if (json.exists && !json.validEmail) {
          this.setState({ badEmailMatch: true, orgCheck: false });
        } else {
          if (json.exists) {
            this.setState({ organization: json.organization, orgCheck: false, confirmAuthority: true });
          } else {
            const tempOrg = {
              id: -1,
              name: this.state.tempOrgName,
              shortname: this.state.tempOrgName,
              emailDomain: this.state.email,
            };

            this.setState({ organization: tempOrg, orgCheck: false, confirmAuthority: true });
          }
        }
      });
  };

  public render() {
    const {
      hasSubmitted,
      confirmEmailSent,
      orgCheck,
      tempOrgName,
      pendingValidation,
      badEmailMatch,
      confirmAuthority,
      organization,
      validationFailed,
    } = this.state;

    if (badEmailMatch) {
      return <div>Sorry, your email doesn't match this organization's</div>;
    }

    if (validationFailed) {
      return <div>Sorry, your request was denied.</div>;
    }

    if (hasSubmitted) {
      if (orgCheck) {
        return (
          <div>
            <form onSubmit={this.setTemporaryOrganization}>
              <p> What is the name of your organization? </p>
              <input type="text" name="tempOrgName" value={tempOrgName} onChange={this.handleChange} />
              <input type="submit" />
            </form>
          </div>
        );
      }

      if (confirmAuthority && organization) {
        return (
          <div>
            <p>By hitting submit, you confirm you have the authority to create a class for {organization.name}</p>
            <input type="checkbox" />
            <button onClick={this.validateCreatingUser}>Continue</button>
          </div>
        );
      }

      if (confirmEmailSent) {
        return <div>Check your email to continue activating your account!</div>;
      }

      if (pendingValidation) {
        return <div>Hang tight...we're validating your email</div>;
      }

      return <div>Hang tight...</div>;
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

export default CreateSignup;
