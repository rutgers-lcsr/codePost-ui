/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Icon, Input, Modal, Tooltip, Typography } from 'antd';

/* codePost imports */
import { UserType } from './infrastructure/user';

import PreAuthLayout from './components/pre-auth/PreAuthLayout';

import CPButton from './components/core/CPButton';

/**********************************************************************************************************************/

interface IState {
  errorMessage: string;
  askedToReset: boolean;
  loading: boolean;
}

interface IProps {
  user: UserType;
  match: any;
  history: any;
  replaceUser: (newUser: UserType, redirect: boolean) => void;
}

class Settings extends React.Component<IProps, IState> {
  public constructor(props: any) {
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
          Authorization: `JWT ${localStorage.getItem('token') || ''}`,
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
          this.props.replaceUser(json, false);
          this.setState({ askedToReset: false, loading: false });
        });
    });
  };

  public toggleResetStatus = () => {
    this.setState({ askedToReset: !this.state.askedToReset });
  };

  public render() {
    const { user } = this.props;

    let inputComponent;
    if (user.canModifyRosters) {
      if (user.api_token) {
        inputComponent = (
          <Input.Password
            addonBefore="Your API key"
            value={user.api_token}
            addonAfter={
              <Tooltip title="Reset key">
                <Icon type="redo" onClick={this.toggleResetStatus} />
              </Tooltip>
            }
          />
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
        <Input addonBefore="Email" value={user.email} />
        <br />
        <br />
        <Typography.Title level={4}>Organization info</Typography.Title>
        Member of: <Typography.Text strong>{user.organization}</Typography.Text>
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
      <PreAuthLayout isLoggedIn={true}>
        <div style={{ width: 600, margin: '0 auto' }}>
          <Typography.Title level={3}>Your settings:</Typography.Title>
          {settingsContent}
        </div>
      </PreAuthLayout>
    );
  }
}

export default Settings;
