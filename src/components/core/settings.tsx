/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { RouteComponentProps } from 'react-router';

import { CopyOutlined, RedoOutlined } from '@ant-design/icons';

/* antd imports */
import { Input, message, Modal, Switch, Table, Typography } from 'antd';

/* codePost imports */
import { CourseType } from '../../infrastructure/course';
import { UserType } from '../../infrastructure/user';

import PeripheralPageLayout from './layouts/PeripheralPageLayout';

import { Component } from 'react';
import CPButton from '../core/CPButton';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

/**********************************************************************************************************************/

interface IState {
  errorMessage: string;
  askedToReset: boolean;
  loading: boolean;
}

interface IProps {
  user: UserType;
  handleLogout: () => void;
  replaceUser: (user: UserType, redirect: boolean, isSuperUser: boolean) => void;
}

class Settings extends Component<IProps & RouteComponentProps, IState> {
  public constructor(props: IProps & RouteComponentProps) {
    super(props);
    this.state = {
      errorMessage: '',
      askedToReset: false,
      loading: false,
    };
  }

  public requestToken = () => {
    this.setState({ loading: true }, () => {
      fetch(`${process.env.REACT_APP_API_URL}/users/requestAPIToken/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return Promise.reject();
        })
        .then((json) => {
          this.props.replaceUser(json, false, false);
          this.setState({ askedToReset: false, loading: false });
        });
    });
  };

  public updateShowProductTips = (setTipsValue: boolean) => {
    const payload = { showProductTips: setTipsValue };
    this.setState({ loading: true }, () => {
      fetch(`${process.env.REACT_APP_API_URL}/users/me/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return Promise.reject();
        })
        .then((json) => {
          this.props.replaceUser(json, false, false);
          this.setState({ loading: false });
        });
    });
  };

  public copyKeyToClipboard = () => {
    const copyText = document.getElementById('api-key') as HTMLInputElement;
    if (copyText) {
      const element = document.createElement('textarea');
      element.value = copyText.value;
      document.body.appendChild(element);
      navigator.clipboard.writeText(element.value);
      document.body.removeChild(element);
      message.info('API key copied to clipboard.');
    }
  };

  public toggleResetStatus = () => {
    this.setState({ askedToReset: !this.state.askedToReset });
  };

  public sendPasswordResetEmail = () => {
    fetch(`${process.env.REACT_APP_API_URL}/registration/emailPasswordReset/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: this.props.user.email }),
      method: 'POST',
    })
      .then((res) => {
        if (res.ok || res.status === 400) {
          return res.json();
        } else {
          return Promise.reject();
        }
      })
      .then(() => {
        message.success(
          <span>
            Check your email for a link to reset your password. If you don't see an email within a couple of minutes,{' '}
            <a href="http://help.codepost.io/en/articles/3324251-faq-where-is-my-email" target="_blank">
              please read this
            </a>
            .
          </span>,
        );
      });
  };

  public buildCourseTable = (courses: CourseType[]) => {
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Period',
        dataIndex: 'period',
        key: 'period',
      },
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
      },
    ];

    const rows = courses.filter((course) => {
      return course.period !== 'demo';
    });

    return (
      <Table
        title={() => {
          return (
            <div>
              <Typography.Title level={4}>Courses you can interact with via the API</Typography.Title>
              You can always{' '}
              <a target="_window" href="https://docs.codepost.io/reference#retrieve-a-specific-course">
                retrieve a course
              </a>{' '}
              by its ID. If you're using the{' '}
              <a target="_window" href="https://docs.codepost.io/docs/first-steps-with-the-codepost-python-sdk">
                codePost SDK
              </a>
              , you can retrieve a course by ID or (name, period) -- both are unique.
            </div>
          );
        }}
        columns={columns}
        dataSource={rows}
      />
    );
  };

  public render() {
    const { user } = this.props;

    let inputComponent;
    if (user.canModifyRosters) {
      if (user.api_token) {
        inputComponent = (
          <div>
            <Input.Password
              addonBefore="Your API key"
              className="input--disabled-normal"
              id="api-key"
              value={user.api_token}
              prefix={
                <CPTooltip title={tooltips.settings.token.copy} hideThisOnHideTips={true}>
                  <CopyOutlined style={{ color: '#1890ff' }} onClick={this.copyKeyToClipboard} />
                </CPTooltip>
              }
              disabled={true}
              addonAfter={
                <CPTooltip title={tooltips.settings.token.reset}>
                  <RedoOutlined onClick={this.toggleResetStatus} />
                </CPTooltip>
              }
            />
            <br />
            <br />
            {this.buildCourseTable(user.courseadminCourses)}
          </div>
        );
      } else {
        inputComponent = (
          <CPButton cpType="primary" block onClick={this.requestToken} loading={this.state.loading}>
            Create your first API token
          </CPButton>
        );
      }
    }

    const settingsContent = (
      <div>
        <Typography.Title level={4}>User info</Typography.Title>
        <Input addonBefore="Email" className="input--disabled-normal" disabled={true} value={user.email} />
        <br />
        <br />
        <CPButton cpType="secondary" onClick={this.sendPasswordResetEmail}>
          Reset password
        </CPButton>
        <br />
        <br />
        <br />
        <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
          <div style={{ flexGrow: 1 }}>
            <Typography.Title level={4}>Enable tips</Typography.Title>
            If you're a codePost veteran and don't want to see help text and tips across the site, then you can turn
            this setting off.
          </div>
          <div style={{ paddingLeft: 40 }}>
            <Switch
              checked={user.showProductTips}
              onChange={this.updateShowProductTips.bind(this, !user.showProductTips)}
            />
          </div>
        </div>
        <br />
        <br />
        {user.canModifyRosters ? (
          <div>
            <Typography.Title level={4}>API token</Typography.Title>
            <div>
              This token can be used to authenticate yourself with the
              <a href="http://docs.codepost.io"> codePost API</a>. For more information on how to use this token, please
              see our API documentation.
            </div>
            <br />
            {inputComponent}
            <Modal
              visible={this.state.askedToReset}
              title="Are you sure you want to reset your API token?"
              okText="Reset"
              onOk={this.requestToken}
              onCancel={this.toggleResetStatus}
            >
              <div>
                Your old API key will no longer work. You will need to replace all instances of your old key with your
                new key.
              </div>
            </Modal>
          </div>
        ) : null}
      </div>
    );

    return (
      <PeripheralPageLayout user={this.props.user} handleLogout={this.props.handleLogout}>
        <div id="Settings" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Typography.Title level={3}>Your settings:</Typography.Title>
          {settingsContent}
        </div>
      </PeripheralPageLayout>
    );
  }
}

export default Settings;
