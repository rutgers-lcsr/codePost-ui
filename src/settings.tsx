import * as React from 'react';

import { Button, DialogContainer } from 'react-md';

import { UserType } from './infrastructure/user';

interface IState {
  errorMessage: string;
  askedToReset: boolean;
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
    };
  }

  public requestToken = () => {
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
        this.setState({ askedToReset: false });
      });
  };

  public toggleResetStatus = () => {
    this.setState({ askedToReset: !this.state.askedToReset });
  };

  public render() {
    const { user } = this.props;

    let settingsContent;
    if (user.canModifyRosters) {
      if (user.api_token) {
        settingsContent = (
          <div className="UserSettings__settingItem-top">
            <div className="UserSettings__settingItem__content">
              <div className="UserSettings__settingItem__name">API token</div>
              <div className="UserSettings__settingItem__description">
                This token can be used to authenticate yourself with the{' '}
                <a href="http://docs.codepost.io">codePost API</a>. For more information on how to use this token,
                please see our API documentation.
              </div>
            </div>
            <div>{user.api_token}</div>
            <div>
              <Button primary={true} raised={true} onClick={this.toggleResetStatus}>
                Reset
              </Button>
            </div>
            <DialogContainer
              visible={this.state.askedToReset}
              id="deleteSubmission-dialog"
              className="Dialog--deleteSubmission"
              title="Are you sure you want to reset your API token?"
              modal
            >
              <div>
                Your old API key will no longer work. You will need to replace all instances of your old key with your
                new key.
              </div>
              <br />
              <Button onClick={this.toggleResetStatus} primary={true} flat={true}>
                Cancel
              </Button>
              <Button onClick={this.requestToken} primary={false} flat={true}>
                Reset
              </Button>
            </DialogContainer>
          </div>
        );
      } else {
        settingsContent = (
          <div className="UserSettings__settingItem-top">
            <div className="UserSettings__settingItem__content">
              <div className="UserSettings__settingItem__name">API token</div>
              <div className="UserSettings__settingItem__description">
                This token can be used to authenticate yourself with the <a href="docs.codepost.io">codePost API</a>.
                For more information on how to use this token, please see our API documentation.
              </div>
            </div>
            <div>Create a token: </div>
            <div>
              <button onClick={this.requestToken}>create</button>
            </div>
          </div>
        );
      }
    } else {
      settingsContent = (
        <div className="UserSettings__settingItem-top">
          <div> Your Setings Go Here! </div>
        </div>
      );
    }
    return (
      <div className="UserSettings">
        <div className="UserSettings__main-container">
          <div className="UserSettings__title">User Settings</div>
          <div className="UserSettings__main-container__items">{settingsContent}</div>
        </div>
      </div>
    );
  }
}

export default Settings;
