// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { ExclamationCircleOutlined, InfoCircleTwoTone, TeamOutlined, UserOutlined } from '@ant-design/icons';

/* ant imports */
import { Alert, Checkbox, Divider, Input, Modal, Progress, Switch, Typography } from 'antd';

/* other library imports */
import Select, { SingleValue } from 'react-select';

import { Link } from 'react-router-dom';

/* codePost imports */
import { IOption } from '../../types/common';

import universities from './universities';

import PreAuthSignupLayout from './PreAuthSignupLayout';

import CPButton from '../core/CPButton';
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import { Testimonial } from '../landing/Testimonial';

/**********************************************************************************************************************/

enum STATUS {
  INPUT,
  PENDING_VALIDATION,
  BAD_EMAIL,
  VALIDATION_SUCCESS,
  VALIDATION_ONGOING,
  VALIDATION_REJECTED,
  VALIDATION_ERROR,
  PENDING_APPROVAL,
}

// Standard Normal variate using Box-Muller transform.
// Source: https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
const randomNormal = () => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// Regex match for standard email rules
// Source: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
// Source for formatting with typescript length restriction: https://stackoverflow.com/a/34755045

/* eslint-disable no-useless-escape */
const emailRegex = new RegExp(
  [
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))/,
    /@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  ]
    .map((r) => {
      return r.source;
    })
    .join(''),
);

// Regex match for new organizations.
const organizationRegex = /^.*$/;
/* eslint-enable no-useless-escape */

interface IState {
  email: string;
  selectedOrg?: IOption;
  check1: boolean;
  check2: boolean;
  newOrg?: string;

  // Sign up states
  status: STATUS;
  createNewOrg: boolean;
  progress: number;

  // Misc
  matchOrg: string;
  isNewOrg: boolean;
}

interface IProps extends IWithWindowWatcherProps {
  isLoggedIn: boolean;
}

const PROGRESS_INCREMENT_TIME = 100;
const USER_VALIDATION_INTERVAL = 5000;

class CreateSignup extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    email: '',
    check1: false,
    check2: false,

    status: STATUS.INPUT,
    createNewOrg: false,
    progress: 0,

    matchOrg: '',
    isNewOrg: false,
  };

  private interval: ReturnType<typeof setInterval> | undefined;
  private progressInterval: ReturnType<typeof setInterval> | undefined;

  public componentDidUpdate(_oldProps: IProps, _oldState: IState) {
    if (!_oldState.createNewOrg && this.state.createNewOrg) {
      this.setState({ selectedOrg: { label: '', value: '' } });
    }
  }

  public componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  public handleChange = (label: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const name = label;
    const newValue = event.target.value;
    this.setState((prevstate) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newState: any = { ...prevstate };
      newState[name] = newValue;
      return newState;
    });
  };

  public handleOrgChange = (newVal: SingleValue<IOption>) => {
    if (newVal) {
      this.setState({ selectedOrg: newVal });
    }
  };

  public toggleCheck = (label: string) => {
    this.setState((prevstate) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newState: any = { ...prevstate };
      // @ts-expect-error: legacy-ts-ignore
      newState[label] = !this.state[label];
      return newState;
    });
  };

  public validationHandler = () => {
    if (this.state.email.indexOf('edu') === -1) {
      Modal.confirm({
        title: 'Are you using the right email address?',
        icon: <ExclamationCircleOutlined />,
        content: "Make sure to use your organization's email.",
        okText: 'Use this email address',
        cancelText: 'Use a different email',
        onOk: this.validateNewUser,
      });
    } else {
      this.validateNewUser();
    }
  };

  public validateNewUser = () => {
    // If selected organization, make sure it is valid. If a new org was created, make sure it is valid.
    if ((!this.state.createNewOrg && !this.state.selectedOrg) || (this.state.createNewOrg && !this.state.newOrg)) {
      return;
    }

    const payload = {
      email: this.state.email,
      organization: this.state.createNewOrg ? this.state.newOrg : this.state.selectedOrg!.value,
    };

    this.setState({ status: STATUS.PENDING_VALIDATION }, () => {
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
          if (!json.success) {
            this.setState({ status: STATUS.BAD_EMAIL, matchOrg: json.org });
          } else if (json.pending) {
            // New flow: request is pending approval — show pending state immediately
            this.setState({
              isNewOrg: json.is_new_org,
            });

            // Start progress bar animation, then transition to PENDING_APPROVAL
            this.setState({ progress: 1 }, () => {
              this.progressInterval = setInterval(() => {
                const currentProgress = this.state.progress;
                const newProgress = currentProgress + 0.15 + Math.abs(randomNormal()) * 0.3;
                if (newProgress >= 100) {
                  clearInterval(this.progressInterval);
                  this.setState({
                    progress: 100,
                    status: STATUS.PENDING_APPROVAL,
                  });
                } else {
                  this.setState({
                    progress: parseInt(newProgress.toFixed(0), 10),
                  });
                }
              }, PROGRESS_INCREMENT_TIME);
            });

            // Also poll for approval status
            this.interval = setInterval(() => {
              this.checkUserValidation();
            }, USER_VALIDATION_INTERVAL);
          } else {
            // User already existed and was already approved (e.g. admin already exists)
            this.setState({ progress: 100, status: STATUS.VALIDATION_SUCCESS });
          }
        })
        .catch((_err) => {
          this.setState({ status: STATUS.VALIDATION_ERROR, progress: 100 });
        });
    });
  };

  public getProgressMessage = (progress: number) => {
    if (progress < 30) {
      return 'Setting up your account...';
    } else if (progress < 54) {
      return 'Creating your API credentials...';
    } else {
      return 'Wrapping things up...';
    }
  };

  public checkUserValidation = () => {
    fetch(
      `${process.env.REACT_APP_API_URL}/registration/checkStatusNewAdminUser?email=${this.state.email.replace(
        /\+/g,
        '%2B',
      )}`,
    )
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
          if (json.status) {
            this.setState({ status: STATUS.VALIDATION_SUCCESS, progress: 100 });
          } else {
            this.setState({ status: STATUS.VALIDATION_REJECTED });
          }
        }
      });
  };

  public changeStatus = (newStatus: STATUS) => {
    this.setState({ status: newStatus });
  };

  /*
   * Sign up flow:
   * - Enter email and select organization
   * - Await validation
   * - Respond to email
   *
   */
  public render() {
    const spacing = <div style={{ paddingTop: this.props.windowwidth < 700 ? 10 : 20 }} />;

    let content;
    switch (this.state.status) {
      case STATUS.INPUT:
        content = (
          <div>
            {spacing}
            <label htmlFor="create-email-input">Your email</label>
            <Input
              id="create-email-input"
              placeholder={'Your email'}
              value={this.state.email}
              onChange={this.handleChange.bind(this, 'email')}
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            />
            <br />
            <br />
            <div id="org-select-label" style={{ marginBottom: 5 }}>
              Select your organization
            </div>
            <Select
              aria-label="Select your organization"
              aria-labelledby="org-select-label"
              placeholder={
                <div>
                  <TeamOutlined style={{ color: 'rgba(0,0,0,.25)' }} />
                  &nbsp; Select your organization (type to search)
                </div>
              }
              options={universities}
              onChange={this.handleOrgChange}
              value={this.state.selectedOrg}
              isDisabled={this.state.createNewOrg}
            />
            <br />
            <label htmlFor="create-new-org-switch">
              <Switch id="create-new-org-switch" onChange={this.toggleCheck.bind(this.props, 'createNewOrg')} />
              <span>&nbsp; &nbsp; Can't find your organization? Create a new one.</span>
            </label>
            {this.state.createNewOrg ? (
              <div>
                <br />
                <label htmlFor="new-org-input">Your organization</label>
                <Input
                  id="new-org-input"
                  placeholder="Your organization"
                  value={this.state.newOrg}
                  onChange={this.handleChange.bind(this, 'newOrg')}
                />
              </div>
            ) : null}
            <div style={{ paddingTop: 80 }} />
            <Checkbox
              value={this.state.check2}
              onChange={this.toggleCheck.bind(this, 'check2')}
              style={{ marginRight: 10 }}
            >
              I agree to the codePost{' '}
              <Link to="/terms" className="text-link">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-link">
                Privacy Policy
              </Link>
              .
            </Checkbox>
            {spacing}
            <div style={{ display: 'flex' }}>
              <Link to="/signup">
                <CPButton cpType="secondary">Back</CPButton>
              </Link>
              &nbsp; &nbsp; &nbsp; &nbsp;
              <CPButton
                cpType="primary"
                onClick={this.validationHandler}
                disabled={
                  !(
                    (this.state.createNewOrg && this.state.newOrg && organizationRegex.test(this.state.newOrg)) ||
                    (!this.state.createNewOrg && this.state.selectedOrg && /\S/.test(this.state.selectedOrg.label))
                  ) ||
                  !emailRegex.test(this.state.email) ||
                  !this.state.check2
                }
              >
                Continue to codePost
              </CPButton>
            </div>
            {spacing}
            <Divider />
            <div style={{ marginTop: 5 }}>
              Having trouble? Contact us at <b>team@codepost.io</b>.{spacing}
            </div>
          </div>
        );
        break;
      case STATUS.PENDING_VALIDATION:
        content = (
          <div>
            <Progress percent={this.state.progress} status="active" />
            {this.getProgressMessage(this.state.progress)}
          </div>
        );
        break;
      case STATUS.VALIDATION_ONGOING:
        content = (
          <div>
            <Progress percent={this.state.progress} />
            <br />
            <br />
            <Alert
              title="Registration Pending Approval"
              description="Your account is waiting for manual approval from our team. We've received your request and will email you as soon as your organization is verified."
              type="info"
            />
          </div>
        );
        break;
      case STATUS.PENDING_APPROVAL:
        content = (
          <div>
            <Progress percent={100} />
            <br />
            <br />
            <Alert
              message="Request Submitted Successfully"
              description={
                this.state.isNewOrg ? (
                  <div>
                    <p>
                      Since{' '}
                      <strong>{this.state.createNewOrg ? this.state.newOrg : this.state.selectedOrg?.label}</strong> is
                      a new organization on codePost, our team needs to review your request before your account can be
                      activated.
                    </p>
                    <p style={{ marginTop: 8 }}>
                      We&apos;ve sent you a confirmation email. You&apos;ll receive another email once your account has
                      been approved. This usually takes less than one business day.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p>
                      Your request to join{' '}
                      <strong>{this.state.createNewOrg ? this.state.newOrg : this.state.selectedOrg?.label}</strong> as
                      a course admin has been sent to your organization&apos;s staff for review.
                    </p>
                    <p style={{ marginTop: 8 }}>
                      We&apos;ve sent you a confirmation email. You&apos;ll receive another email once your request has
                      been approved.
                    </p>
                  </div>
                )
              }
              type="info"
              showIcon
            />
            <div style={{ marginTop: 16 }}>
              <Typography.Text type="secondary">
                Have questions? Contact us at <a href="mailto:codepost@cs.rutgers.edu">codepost@cs.rutgers.edu</a>.
              </Typography.Text>
            </div>
          </div>
        );
        break;
      case STATUS.VALIDATION_SUCCESS:
        content = (
          <div>
            <Progress percent={this.state.progress} />
            <br />
            <br />
            <Alert
              message="You're all set!"
              description={
                <div>
                  Check your email to finish setting up your account. If you don't see an email within a couple of
                  minutes,{' '}
                  <a href="/docs/faq#missing-email" target="_blank" className="text-link">
                    please read this
                  </a>
                  .
                </div>
              }
              type="success"
            />
          </div>
        );
        break;
      case STATUS.VALIDATION_REJECTED:
        content = (
          <div>
            <Progress percent={this.state.progress} status="exception" />
            <br />
            <br />
            <Alert
              message="Whoops!"
              description={`We need a little more time to validate your account.
                Please contact us at team@codepost.io to continue setting up your account.`}
              type="error"
            />
          </div>
        );
        break;
      case STATUS.VALIDATION_ERROR:
        content = (
          <div>
            <Progress percent={this.state.progress} status="exception" />
            <br />
            <br />
            <Alert
              message="Whoops!"
              description={`Something went wrong.
                Please contact the codePost team at team@codepost.io to continue signing up.`}
              type="error"
            />
          </div>
        );
        break;
      default:
        content = <span>Something went wrong...</span>;
    }

    const bobText = (
      <span style={{ fontStyle: 'italic' }}>
        codePost has been a{' '}
        <Typography.Text mark className="codePost-highlight">
          paradigm shifting improvement
        </Typography.Text>{' '}
        to how we grade computer science at Princeton.
      </span>
    );
    const bobImg = new URL('./../../img/landing/compressed/bob_sedgewick.jpg', import.meta.url).href;
    const flexDirection = this.props.windowwidth < 750 ? 'column' : 'row';

    return (
      <PreAuthSignupLayout step={this.state.status === STATUS.VALIDATION_SUCCESS ? 2 : 1}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection,
            paddingTop: 20,
          }}
        >
          <div style={{ marginRight: this.props.windowwidth < 750 ? 0 : 25 }}>
            <Typography.Title level={1}>Sign up as an instructor</Typography.Title>
            <Alert
              message={
                <div style={{ color: 'rgba(0,0,0,0.6)' }}>
                  <InfoCircleTwoTone twoToneColor="#bbbbbb" style={{ marginRight: 5 }} />{' '}
                  <b style={{ fontWeight: 500 }}>Not an instructor?</b> If you're a student, sign up by{' '}
                  <Link to="/signup/join" className="text-link">
                    clicking here
                  </Link>
                  .
                </div>
              }
              type="info"
              style={{
                paddingTop: '5px',
                paddingBottom: '5px',
                marginBottom: '15px',
              }}
            />
            <div style={{ maxWidth: 600 }}>{content}</div>
          </div>
          {this.state.status === STATUS.INPUT ? (
            <div
              style={{
                marginLeft: this.props.windowwidth < 750 ? 0 : 75,
                marginTop: this.props.windowwidth < 750 ? 40 : 0,
                padding: '25px 15px',
                boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.1)',
                borderRadius: 8,
                width: 300,
              }}
            >
              <Testimonial
                text={<div>{bobText}</div>}
                name="Robert Sedgewick"
                thumbnail={bobImg}
                school="Princeton University"
              />
            </div>
          ) : null}
        </div>
      </PreAuthSignupLayout>
    );
  }
}

export default withWindowWatcher(CreateSignup);
