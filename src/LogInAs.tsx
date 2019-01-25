import * as React from 'react';
import { IUser } from './types/common';

interface IState {
  errorMessage: string;
}

interface IProps {
  match: any;
  history: any;
  replaceUser: (user: IUser) => void;
}

class LogInAs extends React.Component<IProps, IState> {
  public constructor(props: any) {
    super(props);
    this.state = {
      errorMessage: '',
    };
  }

  public issueRequest = () => {
    fetch(`${process.env.REACT_APP_API_URL}/users/1/loginAs/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return Promise.reject(res);
      })
      .then((user) => {
        this.props.replaceUser(user);
      })
      .catch((err) => {
        this.setState({
          errorMessage: 'An error occurred. You probably do not have permission to perform this action!',
        });
      });
  };

  public render() {
    return (
      <div>
        <button onClick={this.issueRequest}>Login as {this.props.match.params.email}</button>
        <p>{this.state.errorMessage}</p>
      </div>
    );
  }
}

export default LogInAs;
