import * as React from 'react';
import { Redirect } from 'react-router-dom';
import { ADMIN, GRADER, STUDENT } from './routes';
import { USER_APP } from './types/common';
// import './styles/index.scss';

interface IAppState {
  redirect: USER_APP | null;
}

interface IProps {
  isStudent: boolean;
  isGrader: boolean;
  isAdmin: boolean;
}

class Home extends React.Component<IProps, IAppState> {
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
    switch (this.state.redirect) {
      case USER_APP.Student:
        console.log('redirecting');
        return <Redirect push to={STUDENT} />;
      case USER_APP.Grader:
        return <Redirect push to={GRADER} />;
      case USER_APP.CourseAdmin:
        return <Redirect push to={ADMIN} />;
    }

    // If user hsa no courses:
    if (!this.props.isStudent && !this.props.isGrader && !this.props.isAdmin) {
      return (
        <div className="App">
          <div className="App__splash-text">You are not enrolled in any courses.</div>
        </div>
      );
    }

    const studentBtn = this.props.isStudent ? (
      <div className="App__splashBtn" onClick={this.toggleRedirect.bind(this, USER_APP.Student)}>
        <div className="App__splash-header">Student</div>
        <div className="App__splash-divider" />
        <img className="App__splashIcon" src={require('./img/splash-code.png')} />
      </div>
    ) : (
      <div />
    );
    const graderBtn = this.props.isGrader ? (
      <div className="App__splashBtn" onClick={this.toggleRedirect.bind(this, USER_APP.Grader)}>
        <div className="App__splash-header">Grader</div>
        <div className="App__splash-divider" />
        <img className="App__splashIcon" src={require('./img/splash-speech-bubble.png')} />
      </div>
    ) : (
      <div />
    );

    const adminBtn = this.props.isAdmin ? (
      <div className="App__splashBtn" onClick={this.toggleRedirect.bind(this, USER_APP.CourseAdmin)}>
        <div className="App__splash-header">Admin</div>
        <div className="App__splash-divider" />
        <img className="App__splashIcon" src={require('./img/splash-stats.png')} />
      </div>
    ) : (
      <div />
    );

    return (
      <div className="App">
        <div className="App__splash-text">Select your role:</div>
        <div className="App__splash-buttonContainer">
          {studentBtn}
          {graderBtn}
          {adminBtn}
        </div>
      </div>
    );
  }
}

export default Home;
