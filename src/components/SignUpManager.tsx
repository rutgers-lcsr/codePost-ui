import * as React from 'react';
import { Redirect } from 'react-router-dom';
import '../styles/index.scss';
import { TopBarNoEmail } from './TopBar';

enum SignUpType {
  newCourse,
  existingCourse,
}

interface IState {
  redirect: SignUpType | null;
}

class SignUpManager extends React.Component<{}, IState> {
  public state: Readonly<IState> = {
    redirect: null,
  };

  public toggleRedirect(page: SignUpType) {
    this.setState({ redirect: page });
  }

  public render() {
    switch (this.state.redirect) {
      case SignUpType.newCourse:
        console.log('redirecting');
        return <Redirect push to={'/signup/staff/create'} />;
      case SignUpType.existingCourse:
        return <Redirect push to={'/signup/staff/join'} />;
    }

    return (
      <div>
        <TopBarNoEmail />
        <div className="SignUpManager">
          <div className="SignUpManager__main-container">
            <div className="SignUpManager__title">Join codePost</div>
            <div className="SignUpManager__item">
              <div className="SignUpManager__Staff">
                <div
                  onClick={this.toggleRedirect.bind(this, SignUpType.existingCourse)}
                  className="SignUpManager__Staff--left"
                  key="SignUp"
                >
                  Join an existing course
                </div>
                <div
                  onClick={this.toggleRedirect.bind(this, SignUpType.newCourse)}
                  className="SignUpManager__Staff--right"
                  key="SignUp"
                >
                  Create a new course
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SignUpManager;
