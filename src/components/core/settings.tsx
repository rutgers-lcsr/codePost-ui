/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

import { CopyOutlined, RedoOutlined } from '@ant-design/icons';

/* antd imports */
import { Input, message, Modal, Switch, Table, Typography, theme } from 'antd';

/* codePost imports */
import type { CourseType, UserType } from '../../types/models';

import { registrationApi, usersApi } from '../../api-client/clients';
import type { RequestAPITokenCreateRequest } from '../../api-client/apis/UsersApi';

import { normalizeUser } from '../../utils/normalizeUser';

import PeripheralPageLayout from './layouts/PeripheralPageLayout';

import { Component } from 'react';
import CPButton from '../core/CPButton';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

/**********************************************************************************************************************/

const CopyTokenIcon = ({ onClick }: { onClick: () => void }) => {
  const { token } = theme.useToken();

  return <CopyOutlined aria-label="Copy API key" style={{ color: token.colorInfo }} onClick={onClick} />;
};

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

class Settings extends Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      errorMessage: '',
      askedToReset: false,
      loading: false,
    };
  }

  public requestToken = () => {
    this.setState({ loading: true }, () => {
      usersApi
        // Endpoint uses the authenticated user; OpenAPI spec requires a body, so pass an empty object.
        .requestAPITokenCreate({ user: {} } as unknown as RequestAPITokenCreateRequest)
        .then((json) => {
          this.props.replaceUser(normalizeUser(json), false, false);
          this.setState({ askedToReset: false, loading: false });
        })
        .catch((err) => {
          console.error(err);
          this.setState({ loading: false, askedToReset: false });
          message.error('Failed to reset API token');
        });
    });
  };

  public updateShowProductTips = (setTipsValue: boolean) => {
    const payload = { showProductTips: setTipsValue };
    this.setState({ loading: true }, () => {
      usersApi
        .mePartialUpdate({ patchedUser: payload })
        .then((json) => {
          this.props.replaceUser(normalizeUser(json), false, false);
          this.setState({ loading: false });
        })
        .catch((err) => {
          console.error(err);
          this.setState({ loading: false });
          message.error('Failed to update settings');
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
    registrationApi
      .emailPasswordResetCreate({ emailPasswordResetRequest: { email: this.props.user.email! } })
      // Backend returns 200 or 400 (both are "success" in UX terms). Generated client throws on 400.
      .catch((err) => {
        // Treat 400 as success (e.g., email not found) to avoid account enumeration.
        if ((err as any)?.response?.status === 400) {
          return;
        }
        throw err;
      })
      .then(() => {
        message.success(
          <span>
            Check your email for a link to reset your password. If you don't see an email within a couple of minutes,{' '}
            <a href="/docs/faq#missing-email" target="_blank" rel="noopener noreferrer">
              please read this
            </a>
            .
          </span>,
        );
      })
      .catch((err) => {
        console.error(err);
        message.error('Failed to request password reset');
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
              <Typography.Title level={2}>Courses you can interact with via the API</Typography.Title>
              You can always{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://codepost-api.cs.rutgers.edu/api/schema/elements/"
              >
                retrieve a course
              </a>{' '}
              by its ID. If you're using the{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://codepost-api.cs.rutgers.edu/api/schema/elements/"
              >
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
      if (user.apiToken) {
        inputComponent = (
          <div>
            <label htmlFor="api-key" className="sr-only">
              Your API key
            </label>
            <Input.Password
              aria-label="Your API key"
              addonBefore="Your API key"
              className="input--disabled-normal"
              id="api-key"
              value={user.apiToken}
              prefix={
                <CPTooltip title={tooltips.settings.token.copy} hideThisOnHideTips={true}>
                  <CopyTokenIcon onClick={this.copyKeyToClipboard} />
                </CPTooltip>
              }
              disabled={true}
              addonAfter={
                <CPTooltip title={tooltips.settings.token.reset}>
                  <RedoOutlined aria-label="Reset API key" onClick={this.toggleResetStatus} />
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
        <Typography.Title level={2}>User info</Typography.Title>
        <label htmlFor="user-email" className="sr-only">
          Email
        </label>
        <Input
          id="user-email"
          aria-label="Email"
          addonBefore="Email"
          className="input--disabled-normal"
          disabled={true}
          value={user.email}
        />
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
            <Typography.Title level={2}>Enable tips</Typography.Title>
            If you're a codePost veteran and don't want to see help text and tips across the site, then you can turn
            this setting off.
          </div>
          <div style={{ paddingLeft: 40 }}>
            <label htmlFor="product-tips-switch" className="sr-only">
              Enable product tips
            </label>
            <Switch
              id="product-tips-switch"
              aria-label="Enable product tips"
              checked={user.showProductTips}
              onChange={this.updateShowProductTips.bind(this, !user.showProductTips)}
            />
          </div>
        </div>
        <br />
        <br />
        {user.canModifyRosters ? (
          <div>
            <Typography.Title level={2}>API token</Typography.Title>
            <div>
              This token can be used to authenticate yourself with the
              <a
                href="https://codepost-api.cs.rutgers.edu/api/schema/elements/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {' '}
                codePost API
              </a>
              . For more information on how to use this token, please see our API documentation.
            </div>
            <br />
            {inputComponent}
            <Modal
              open={this.state.askedToReset}
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
          <Typography.Title level={1}>Your settings:</Typography.Title>
          {settingsContent}
        </div>
      </PeripheralPageLayout>
    );
  }
}

export default Settings;
