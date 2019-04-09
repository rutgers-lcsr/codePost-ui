import * as React from 'react';
import { FontIcon, LinearProgress, SelectionControl, TextField } from 'react-md';
import { TopBarNoEmail } from './TopBar';

import Select from 'react-select';

import { IOption } from '../types/common';

import { Link } from 'react-router-dom';

import universities from './universities';

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
  progress: number | null;
}

const PROGRESS_INCREMENT_TIME = 10;
const PROGRESS_MAX_TIME = 45000;
const USER_VALIDATION_INTERVAL = 5000;

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
    progress: null,
  };

  private interval: any;
  private progressInterval: any;

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
        this.setState({ isLoading: false, progress: null });
        clearInterval(this.progressInterval);
      }, PROGRESS_MAX_TIME);
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
          }, USER_VALIDATION_INTERVAL);
          this.setState({ progress: 1, pendingValidation: true, isLoading: true }, () => {
            this.progressInterval = setInterval(() => {
              const currentProgress = this.state.progress;
              if (currentProgress !== null) {
                const newProgress = currentProgress + (PROGRESS_INCREMENT_TIME * 100) / PROGRESS_MAX_TIME;
                this.setState({ progress: newProgress });
              } else {
                this.setState({ progress: 1 });
              }
            }, PROGRESS_INCREMENT_TIME);
          });
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
          clearInterval(this.progressInterval);
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
                Please make sure your email correctly matches the email domain for the organization entered. If you
                don’t have an .edu email or have other issues, please contact us at team@codepost.io and we can help you
                get set up with a demo account.
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
                      I agree to the codePost&nbsp;{' '}
                      <Link to="/terms" target="_blank">
                        Terms of Service
                      </Link>{' '}
                      &nbsp;and&nbsp;{' '}
                      <Link to="/privacy" target="_blank">
                        Privacy Policy
                      </Link>
                      . &nbsp; &nbsp;
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
      console.log(this.state.progress);
      if (this.state.isLoading) {
        const { progress } = this.state;
        let loadingText;
        if (progress === null || progress < 33) {
          loadingText = 'Creating your account...';
        } else if (progress < 70) {
          loadingText = 'Validating your information...';
        } else {
          loadingText = 'Setting up your API profile...';
        }
        return (
          <div>
            <TopBarNoEmail />
            <div className="SignUpManager">
              <div className="SignUpManager__main-container">
                <LinearProgress
                  id="progress"
                  className="linear-progress--validation"
                  value={this.state.progress ? this.state.progress : 0}
                  style={{ marginBottom: '30px' }}
                />
                <div className="SignUpManager__center-text">{loadingText}</div>
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
              <LinearProgress id="progress" style={{ marginTop: '60px' }} />
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
                <div className="SignUpManager__footer">
                  Having trouble? Contact us at <b>team@codepost.io</b>.
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
