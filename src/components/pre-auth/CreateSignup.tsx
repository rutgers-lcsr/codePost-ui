/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Alert, Checkbox, Divider, Icon, Input, Progress, Radio, Switch, Typography } from 'antd';

/* other library imports */
import Select from 'react-select';

import { Link } from 'react-router-dom';

/* codePost imports */
import { IOption } from '../../types/common';

import universities from './universities';

import PreAuthSignupLayout from './PreAuthSignupLayout';

import CPButton from '../core/CPButton';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import { Testimonial } from '../landing/Testimonial';

/**********************************************************************************************************************/

enum STATUS {
  INPUT,
  CONFIRM_AUTHORITY,
  PENDING_VALIDATION,
  BAD_EMAIL,
  VALIDATION_SUCCESS,
  VALIDATION_ONGOING,
  VALIDATION_FAILURE,
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
  };

  private interval: any;
  private progressInterval: any;

  public componentDidUpdate(oldProps: IProps, oldState: IState) {
    if (!oldState.createNewOrg && this.state.createNewOrg) {
      console.log('bump');
      this.setState({ selectedOrg: { label: '', value: '' } });
    }
  }

  public handleChange = (label: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const name = label;
    const newValue = event.target.value;
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[name] = newValue;
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

  public validateNewUser = () => {
    if (!this.state.selectedOrg) {
      return;
    }

    const payload = {
      email: this.state.email,
      organization: this.state.selectedOrg.value,
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
                this.setState({ progress: 100, status: STATUS.VALIDATION_ONGOING });
              } else {
                this.setState({ progress: parseInt(newProgress.toFixed(0), 10) });
              }
            }, PROGRESS_INCREMENT_TIME);
          });
        })
        .catch((err) => {
          this.setState({ status: STATUS.BAD_EMAIL });
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
          if (json.status) {
            this.setState({ status: STATUS.VALIDATION_SUCCESS, progress: 100 });
          } else {
            this.setState({ status: STATUS.VALIDATION_FAILURE });
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
   * - Confirm authority
   * - Await validation
   * - Respond to email
   *
   */
  public render() {
    const { selectedOrg } = this.state;
    const spacing = <div style={{ paddingTop: this.props.windowwidth < 700 ? 10 : 40 }} />;

    let content;
    switch (this.state.status) {
      case STATUS.INPUT:
        content = (
          <div>
            Tier: &nbsp; &nbsp;
            <Radio.Group defaultValue={1}>
              <Radio value={1}>Free</Radio>
              <Radio value={2} disabled={true}>
                Pro
              </Radio>
            </Radio.Group>
            <CPTooltip placement={'bottom'} title={tooltips.preauth.create.proPricing} type="question" />
            {spacing}
            <Input
              placeholder={'Your email'}
              value={this.state.email}
              onChange={this.handleChange.bind(this, 'email')}
              prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
            />
            <br />
            <br />
            <Select
              placeholder={
                <div>
                  <Icon type="team" style={{ color: 'rgba(0,0,0,.25)' }} />
                  &nbsp; Select your organization (type to search)
                </div>
              }
              options={universities}
              onChange={this.handleOrgChange}
              value={this.state.selectedOrg}
              isDisabled={this.state.createNewOrg}
            />
            <br />
            <Switch defaultChecked={this.state.check2} onChange={this.toggleCheck.bind(this.props, 'createNewOrg')} />
            <span>&nbsp; &nbsp; Can't find your organization? Create a new one.</span>
            {this.state.createNewOrg ? (
              <div>
                <br />
                <Input placeholder="Your organization" onChange={this.handleChange.bind(this, 'newOrg')} />
              </div>
            ) : null}
            {spacing}
            <div style={{ display: 'flex' }}>
              <Link to="/signup">
                <CPButton cpType="secondary">Back</CPButton>
              </Link>
              &nbsp; &nbsp; &nbsp; &nbsp;
              <CPButton
                cpType="primary"
                onClick={this.changeStatus.bind(this, STATUS.CONFIRM_AUTHORITY)}
                disabled={
                  !(this.state.selectedOrg || this.state.newOrg) ||
                  (!this.state.newOrg && this.state.selectedOrg!.label === '')
                }
              >
                Continue
              </CPButton>
            </div>
            {spacing}
            <Divider />
            <span>
              Having trouble? Contact us at <b>team@codepost.io</b>.{spacing}
              <Link to="/signup/join">Want to join a course instead?</Link>
              <br />
            </span>
          </div>
        );
        break;
      case STATUS.CONFIRM_AUTHORITY:
        const orgName = selectedOrg ? selectedOrg.label : this.state.newOrg;
        content = (
          <div>
            <span>
              You selected <b>{orgName}</b>. Please review the following before proceeding.
            </span>
            <br />
            <br />
            <span>
              <Checkbox value={this.state.check1} onChange={this.toggleCheck.bind(this, 'check1')} /> I confirm that I
              have the authority to create a course for&nbsp;<b>{orgName}</b>.
            </span>
            <br />
            <br />
            <span>
              <Checkbox value={this.state.check2} onChange={this.toggleCheck.bind(this, 'check2')} /> I agree to the
              codePost <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
            </span>
            <br />
            <br />
            <CPButton cpType="secondary" onClick={this.changeStatus.bind(this, STATUS.INPUT)}>
              Back
            </CPButton>
            &nbsp; &nbsp; &nbsp; &nbsp;
            <CPButton
              cpType="primary"
              disabled={!this.state.check1 || !this.state.check2}
              onClick={this.validateNewUser}
            >
              Continue
            </CPButton>
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
        content = (
          <div>
            <Progress percent={this.state.progress} />
            <br />
            <br />
            <Alert
              message="You're all set!"
              description="Check your email to finish setting up your account."
              type="success"
            />
          </div>
        );
        break;
      case STATUS.VALIDATION_FAILURE:
        content = (
          <div>
            <Progress percent={this.state.progress} status="exception" />
            <br />
            <br />
            <Alert
              message="Whoops!"
              description="We couldn't verify that you belong to the organization you selected. If you think this is a
              mistake, please contact us at <b>team@codepost.io</b>"
              type="error"
            />
          </div>
        );
        break;
      case STATUS.BAD_EMAIL:
        content = (
          <Alert
            message="Whoops!"
            description="It looks like the organization you're trying to join has a different email domain than
             the one you're using. Make sure you're using your institution's email and try signing up again!"
            type="error"
          />
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
            justifyContent: 'space-between',
            flexDirection,
          }}
        >
          <div>
            <Typography.Title level={1}>Create a new course with codePost</Typography.Title>
            <div style={{ maxWidth: 600 }}>{content}</div>
          </div>
          <div
            style={{
              marginLeft: this.props.windowwidth < 750 ? 0 : 40,
              marginTop: this.props.windowwidth < 750 ? 40 : 0,
              padding: '25px 15px',
              boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.1)',
              borderRadius: 8,
            }}
          >
            <Testimonial
              text={<div>{bobText}</div>}
              name="Robert Sedgewick"
              thumbnail={bobImg}
              school="Princeton University"
            />
          </div>
        </div>
      </PreAuthSignupLayout>
    );
  }
}

export default withWindowWatcher(CreateSignup);
