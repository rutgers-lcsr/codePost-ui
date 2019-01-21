import * as React from 'react';
import { Redirect } from 'react-router-dom';
import { ADMIN, GRADER, STUDENT } from './routes';
import { USER_APP } from './types/common';
// import './styles/index.scss';

interface IAppState {
  redirect: USER_APP | null;
}

class Home extends React.Component<{}, IAppState> {
  public state: Readonly<IAppState> = {
    redirect: null,
  };

  public constructor(props: any) {
    super(props);
    this.setState({ redirect: null });
  }

  public toggleRedirect(page: USER_APP) {
    this.setState({ redirect: page });
  }

  public render() {
    console.log('here');
    switch (this.state.redirect) {
      case USER_APP.Student:
        console.log('redirecting');
        return <Redirect push to={STUDENT} />;
      case USER_APP.Grader:
        return <Redirect push to={GRADER} />;
      case USER_APP.CourseAdmin:
        return <Redirect push to={ADMIN} />;
    }

    return (
      <div className="App">
        <div className="App__splashBtn--top" onClick={this.toggleRedirect.bind(this, USER_APP.Student)}>
          Student
        </div>
        <div className="App__splashBtn--middle" onClick={this.toggleRedirect.bind(this, USER_APP.Grader)}>
          Grader
        </div>
        <div className="App__splashBtn--bottom" onClick={this.toggleRedirect.bind(this, USER_APP.CourseAdmin)}>
          Admin
        </div>
      </div>
    );
  }
}

export default Home;
