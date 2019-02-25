import * as React from 'react';
import { CircularProgress, FontIcon, TextField } from 'react-md';
import { OrganizationType } from '../infrastructure/organization';

interface IState {
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

  isLoading: boolean;
}

class CreateSignup extends React.Component<{}, IState> {
  public state: Readonly<IState> = {
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
    isLoading: false,
  };

  private interval: any;

  public handleChange = (label: string, value: string) => {
    const name = label;
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
    };

    this.setState({ pendingValidation: true, isLoading: true }, () => {
      setTimeout(() => {
        this.setState({ isLoading: false });
      }, 120000);
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
      return (
        <div className="SignUpManager">
          <div className="SignUpManager__main-container">
            <div className="SignUpManager__center-text">Sorry, your email doesn't match this organization's</div>
          </div>
        </div>
      );
    }

    if (validationFailed) {
      return (
        <div className="SignUpManager">
          <div className="SignUpManager__main-container">
            <div className="SignUpManager__center-text">Sorry, your request was denied.</div>
          </div>
        </div>
      );
    }

    if (hasSubmitted) {
      if (orgCheck) {
        return (
          <div className="SignUpManager">
            <div className="SignUpManager__main-container">
              <div className="SignUpManager__title">Create a new course with codePost</div>
              <div className="SignUpManager__form">
                <form onSubmit={this.setTemporaryOrganization}>
                  <div> What is the name of your organization? </div>
                  <TextField
                    id="org-input"
                    floating={true}
                    placeholder="Princeton University"
                    label="Organization Name"
                    required={true}
                    value={tempOrgName}
                    onChange={this.handleChange.bind(this, 'tempOrgName')}
                  />
                  <div className="SignUpManager__submitBtn" onClick={this.setTemporaryOrganization}>
                    Continue
                    <FontIcon
                      style={{ color: 'white', transform: 'scale(1.5,1.5)', marginLeft: '20px' }}
                      inherit={true}
                    >
                      arrow_forward
                    </FontIcon>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      }

      if (confirmAuthority && organization) {
        return (
          <div className="SignUpManager">
            <div className="SignUpManager__main-container">
              <div className="SignUpManager__title">Create a new course with codePost</div>
              <div className="SignUpManager__form">
                <div className="SignUpManager__subtitle">
                  By clicking 'I Confirm', you confirm you have the authority to create a class for{' '}
                  <b>{organization.name}</b>.
                </div>
                <div className="SignUpManager__form__ConfirmAuthority">
                  <div className="SignUpManager__form__helptext">
                    I Confirm that I have the authority to administer a course for <b>{organization.name}</b>.
                  </div>
                  <input type="checkbox" />
                </div>
                <div className="SignUpManager__submitBtn" onClick={this.validateCreatingUser}>
                  Continue
                  <FontIcon style={{ color: 'white', transform: 'scale(1.5,1.5)', marginLeft: '20px' }} inherit={true}>
                    arrow_forward
                  </FontIcon>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (confirmEmailSent) {
        return (
          <div className="SignUpManager">
            <div className="SignUpManager__main-container">
              <div className="SignUpManager__center-text">Check your email to continue activating your account!</div>
            </div>
          </div>
        );
      }

      if (pendingValidation) {
        if (this.state.isLoading) {
          return (
            <div className="SignUpManager">
              <div className="SignUpManager__main-container">
                <div className="SignUpManager__center-text">Hang tight...we're validating your email</div>
                <CircularProgress id="progress" className="progress-circle" style={{ marginBottom: '30px' }} />
              </div>
            </div>
          );
        } else {
          return (
            <div className="SignUpManager">
              <div className="SignUpManager__main-container">
                <div className="SignUpManager__center-text">
                  We need more time to verify your information. Please check your email in a few hours.{' '}
                </div>
              </div>
            </div>
          );
        }
      }

      return (
        <div className="SignUpManager">
          <div className="SignUpManager__main-container">
            <div className="SignUpManager__center-text">Hang tight...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="SignUpManager">
        <div className="SignUpManager__main-container">
          <div className="SignUpManager__title">Create a new course with codePost</div>
          <div className="SignUpManager__form--lessPadding">
            <div className="SignUpManager__form__email--abovePass">
              <TextField
                id="email-input"
                floating={true}
                label="Email"
                required={true}
                value={this.state.email}
                onChange={this.handleChange.bind(this, 'email')}
              />
              <div className="SignUpManager__form__helptext">Don't forget to use your organization's edu address!</div>
            </div>
            <div className="SignUpManager__submitBtn" onClick={this.handleSignup}>
              Continue
              <FontIcon style={{ color: 'white', transform: 'scale(1.5,1.5)', marginLeft: '20px' }} inherit={true}>
                arrow_forward
              </FontIcon>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateSignup;
