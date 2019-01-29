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

    if (user.canModifyRosters) {
      if (user.api_token) {
        return (
          <div>
            <p>
              API token: {user.api_token}
              <button onClick={this.toggleResetStatus}>reset</button>
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
            </p>
          </div>
        );
      } else {
        return (
          <div>
            <p>
              API token: <button onClick={this.requestToken}>create</button>
            </p>
            )
          </div>
        );
      }
    } else {
      return <p> Your settings go here! </p>;
    }
  }
}

export default Settings;
