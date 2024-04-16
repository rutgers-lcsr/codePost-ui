/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import {
  InfoCircleTwoTone,
  QuestionCircleOutlined,
  TeamOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

/* ant imports */
import { Alert, Checkbox, Divider, Input, Progress, Switch, Typography, Modal } from 'antd';

/* other library imports */
import Select from 'react-select';

import { Link } from 'react-router-dom';

/* codePost imports */
import { IOption } from '../../types/common';

import universities from './universities';

import PreAuthSignupLayout from './PreAuthSignupLayout';

import CPButton from '../core/CPButton';
import CPTooltip from '../core/CPTooltip';
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
  };

  private interval: any;
  private progressInterval: any;

  public componentDidUpdate(oldProps: IProps, oldState: IState) {
    if (!oldState.createNewOrg && this.state.createNewOrg) {
      this.setState({ selectedOrg: { label: '', value: '' } });
    }
  }

  public handleChange = (label: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const name = label;
    const newValue = event.target.value;
    this.setState((prevstate) => {
      const newState: any = { ...prevstate };
      newState[name] = newValue;
      return newState;
    });
  };

  public handleOrgChange = (newVal: IOption) => {
    this.setState({ selectedOrg: newVal });
  };

  public toggleCheck = (label: string) => {
    this.setState((prevstate) => {
      const newState: any = { ...prevstate };
      // @ts-ignore
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
          } else {
            // after triggering validation process, check status at interval defined by USER_VALIDATION_INTERVAL
            this.interval = setInterval(() => {
              this.checkUserValidation();
            }, USER_VALIDATION_INTERVAL);

            // start progress counter
            this.setState({ progress: 1 }, () => {
              // update counter periodically
              this.progressInterval = setInterval(() => {
                const currentProgress = this.state.progress;
                const newProgress = currentProgress + 0.15 + Math.abs(randomNormal()) * 0.3;
                if (newProgress >= 100) {
                  clearInterval(this.interval);
                  clearInterval(this.progressInterval);
                  this.setState({
                    progress: 100,
                    status: STATUS.VALIDATION_ONGOING,
                  });
                } else {
                  this.setState({
                    progress: parseInt(newProgress.toFixed(0), 10),
                  });
                }
              }, PROGRESS_INCREMENT_TIME);
            });
          }
        })
        .catch((err) => {
          this.setState({ status: STATUS.VALIDATION_SUCCESS, progress: 100 });
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
            <Input
              placeholder={'Your email'}
              value={this.state.email}
              onChange={this.handleChange.bind(this, 'email')}
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            />
            <br />
            <br />
            <Select
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
            <Switch onChange={this.toggleCheck.bind(this.props, 'createNewOrg')} />
            <span>&nbsp; &nbsp; Can't find your organization? Create a new one.</span>
            {this.state.createNewOrg ? (
              <div>
                <br />
                <Input
                  placeholder="Your organization"
                  value={this.state.newOrg}
                  onChange={this.handleChange.bind(this, 'newOrg')}
                />
              </div>
            ) : null}
            <div>
              <div style={{ paddingTop: 80 }} />
              <Checkbox
                value={this.state.check2}
                onChange={this.toggleCheck.bind(this, 'check2')}
                style={{ marginRight: 10 }}
              />
              I agree to the codePost <Link to="/terms">Terms of Service</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>.
            </div>
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
              message="You're almost there!"
              description="We'll email soon with more instructions so you can finish setting up your account."
              type="success"
            />
          </div>
        );
        break;
      case STATUS.VALIDATION_SUCCESS:
        const mailToString = `mailto:team@codepost.io?subject=Never%20Received%20Signup%20Email&body=Hi,%20I%20never
        %20received%20my%20codePost%20signup%20email.%20Could%20you%20please%20look%20into%20it%3f`;
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
                  <a href="http://help.codepost.io/en/articles/3324251-faq-where-is-my-email" target="_blank">
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
    const bobImg = require('./../../img/landing/compressed/bob_sedgewick.jpg');
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
                  <Link to="/signup/join">clicking here</Link>.
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
