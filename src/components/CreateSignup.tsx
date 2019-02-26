import * as React from 'react';
import { CircularProgress, FontIcon, SelectionControl, TextField } from 'react-md';
import { TopBarNoEmail } from './TopBar';

import Select from 'react-select';

import { IOption } from '../types/common';

import { Link } from 'react-router-dom';

const universities = [
  { label: 'Princeton University (@princeton.edu)', value: 'princeton' },
  { label: 'Harvard University (@harvard.edu)', value: 'harvard' },
  { label: 'Yale University (@yale.edu)', value: 'yale' },
  { label: 'Cornell University (@cornell.edu)', value: 'cornell' },
];

interface IState {
  email: string;
  selectedOrg: IOption;
  check1: boolean;
  check2: boolean;
  newOrg: string;

  // Sign up states
  createNewOrg: boolean;
  hasSubmitted: boolean;
  confirmAuthority: boolean;
  pendingValidation: boolean;
  validated: boolean;
  confirmEmailSent: boolean;

  // Error states
  badEmailMatch: boolean;
  validationFailed: boolean;

  isLoading: boolean;
}

class CreateSignup extends React.Component<{}, IState> {
  public state: Readonly<IState> = {
    email: '',
    selectedOrg: { value: '', label: '' },
    check1: false,
    check2: false,
    newOrg: '',
    createNewOrg: false,
    hasSubmitted: false,
    confirmAuthority: false,
    pendingValidation: false,
    validated: false,
    confirmEmailSent: false,
    badEmailMatch: false,
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

  public handleOrgChange = (newVal: IOption) => {
    this.setState({ selectedOrg: newVal });
  };

  public toggleCheck = (label: string) => {
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = !this.state[label];
      return newState;
    });
  };

  public handleSignup = (e: any) => {
    e.preventDefault();
    if (this.state.createNewOrg) {
      this.setState(
        {
          selectedOrg: {
            label: this.state.newOrg,
            value: this.state.newOrg.replace(' ', '').toLowerCase(),
          },
        },
        () => {
          // avoid race condition
          this.setState({ hasSubmitted: true, confirmAuthority: true });
        },
      );
    } else {
      this.setState({ hasSubmitted: true, confirmAuthority: true });
    }
  };

  public validateNewUser = (e: any) => {
    if (!this.state.check1 || !this.state.check2) {
      return;
    }

    const payload = {
      email: this.state.email,
      organization: this.state.selectedOrg.value,
    };

    this.setState({ confirmAuthority: false }, () => {
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
          this.setState({ pendingValidation: true, isLoading: true });
        })
        .catch((err) => {
          this.setState({ badEmailMatch: true });
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
          console.log(json);
          if (json.status) {
            this.setState({ confirmEmailSent: true, pendingValidation: false });
          } else {
            this.setState({ confirmEmailSent: false, pendingValidation: false, validationFailed: true });
          }
        }
      });
  };

  /*
   * Sign up flow:
   * - Enter email and select organization
   * - Confirm authority
   * - Await validation
   * - Respond to email
   *
   */
  public render() {
    const {
      pendingValidation,
      badEmailMatch,
      confirmEmailSent,
      validationFailed,
      confirmAuthority,
      hasSubmitted,
      selectedOrg,
    } = this.state;

    if (badEmailMatch) {
      return (
        <div>
          <TopBarNoEmail />
          <div className="SignUpManager">
            <div className="SignUpManager__main-container">
              <div className="SignUpManager__center-text">
                Sorry, your email doesn't match the organization you selected.
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (confirmEmailSent) {
      return (
        <div>
          <TopBarNoEmail />
          <div className="SignUpManager">
            <div className="SignUpManager__main-container">
              <div className="SignUpManager__center-text">Check your email to continue activating your account!</div>
            </div>
          </div>
        </div>
      );
    }

    if (validationFailed) {
      return (
        <div>
          <TopBarNoEmail />
          <div className="SignUpManager">
            <div className="SignUpManager__main-container">
              <div className="SignUpManager__center-text">
                We need more time to verify your information. We'll email you shortly.
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (confirmAuthority) {
      return (
        <div>
          <TopBarNoEmail />
          <div className="SignUpManager">
            <div className="SignUpManager__main-container">
              <div className="SignUpManager__title">Create a new course with codePost</div>
              <div className="SignUpManager__form">
                <div className="SignUpManager__subtitle">
                  You selected <b>{selectedOrg.label}</b>. Please review the following before proceeding.
                </div>
                <div className="SignUpManager__form__ConfirmAuthority">
                  <div>
                    <div className="SignUpManager__form__helptext">
                      I confirm that I have the authority to create a course for&nbsp;<b>{selectedOrg.label}</b>. &nbsp;
                      &nbsp;
                      <SelectionControl
                        id="toggleAuthority"
                        defaultChecked={this.state.check1}
                        name="toggleAuthority"
                        type="checkbox"
                        onChange={this.toggleCheck.bind(this.props, 'check1')}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="SignUpManager__form__helptext">
                      I agree to the codePost&nbsp; <Link to="/terms">Terms of Service</Link> &nbsp;and&nbsp;{' '}
                      <Link to="/privacy">Privacy Policy</Link>. &nbsp; &nbsp;
                      <SelectionControl
                        id="toggleTerms"
                        defaultChecked={this.state.check2}
                        name="toggleTerms"
                        type="checkbox"
                        onChange={this.toggleCheck.bind(this.props, 'check2')}
                      />
                    </div>
                  </div>
                </div>
                <div
                  className={`SignUpManager__submitBtn${this.state.check1 && this.state.check2 ? '' : '--disabled'}`}
                  onClick={this.validateNewUser}
                >
                  Continue
                  <FontIcon style={{ color: 'white', transform: 'scale(1.5,1.5)', marginLeft: '20px' }} inherit={true}>
                    arrow_forward
                  </FontIcon>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (pendingValidation) {
      if (this.state.isLoading) {
        return (
          <div>
            <TopBarNoEmail />
            <div className="SignUpManager">
              <div className="SignUpManager__main-container">
                <div className="SignUpManager__center-text">Hang tight...we're validating your email</div>
                <CircularProgress id="progress" className="progress-circle" style={{ marginBottom: '30px' }} />
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div>
            <TopBarNoEmail />
            <div className="SignUpManager">
              <div className="SignUpManager__main-container">
                <div className="SignUpManager__center-text">
                  We need more time to verify your information. We'll email you shortly.{' '}
                </div>
              </div>
            </div>
          </div>
        );
      }
    }

    // Catch-all cases
    if (hasSubmitted) {
      return (
        <div>
          <TopBarNoEmail />
          <div className="SignUpManager">
            <div className="SignUpManager__main-container">
              <div className="SignUpManager__center-text">Hang tight...</div>
              <CircularProgress id="progress" className="progress-circle" style={{ marginTop: '60px' }} />
            </div>
          </div>
        </div>
      );
    } else {
      let createNew = null;
      if (this.state.createNewOrg) {
        createNew = (
          <div>
            <TextField
              id="new-organization-input"
              floating={true}
              label="Organization"
              required={true}
              onChange={this.handleChange.bind(this, 'newOrg')}
            />
          </div>
        );
      }

      return (
        <div>
          <TopBarNoEmail />
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
                  <div className="SignUpManager__form__helptext">
                    Don't forget to use your organization's edu address!
                  </div>
                </div>
                <div className="SignUpManager__form__email--abovePass">
                  <Select
                    placeholder={'Select your organization'}
                    options={universities}
                    onChange={this.handleOrgChange}
                    value={this.state.selectedOrg.label === '' ? null : this.state.selectedOrg}
                    isDisabled={this.state.createNewOrg}
                  />
                </div>
                <div className="SignUpManager__form__helptext">
                  Can't find your organization? Create a new one.{' '}
                  <SelectionControl
                    id="toggleCreateCourse"
                    defaultChecked={this.state.check2}
                    name="toggleTerms"
                    type="checkbox"
                    onChange={this.toggleCheck.bind(this.props, 'createNewOrg')}
                  />
                </div>
                {createNew}
                <div className="SignUpManager__submitBtn" onClick={this.handleSignup}>
                  Continue
                  <FontIcon style={{ color: 'white', transform: 'scale(1.5,1.5)', marginLeft: '20px' }} inherit={true}>
                    arrow_forward
                  </FontIcon>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default CreateSignup;
