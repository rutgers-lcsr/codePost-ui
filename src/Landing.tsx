import * as React from 'react';
import { Button } from 'react-md';
import './styles/index.scss';
import './styles/landing.scss';
import LandingTopBar from './components/LandingTopBar';

class Landing extends React.Component {
  public state: any = {
    active:"admins"
  }

  private readonly vidTypes = {
    "admins": require("./img/admin-vid.mp4"),
    "graders": require("./img/grader-vid.mp4"),
    "students": require("./img/student-screenshot.png")
  };

  public handleClick(name : string) {
    this.setState( { active : name } );
  }

  public render() {
    return (
      <div className="Landing">
        <LandingTopBar />
        <div className="Hero">
          <div className="Description col-md-5">
            <div className="logo">
              codePost
            </div>
            <div className="Description-head">
              Teach Computer Science Better.
            </div>
            <div className="Description-text">
              codePost makes grading and course management easy, allowing you to focus on what's important: helping your students improve and become power programmers.
            </div>
          </div>
          <div className="Hero-image col-md-7"> Some image
          </div>
        </div>
        <div className="pathBox">
          <svg viewBox="0 0 1280 100" preserveAspectRatio="none">
            <path d="M0 0 C 20 50, 1180 50, 1280 0" stroke="transparent" fill="#e9e9e9"/>
          </svg>
        </div>
        <div className="Numbers">
          <div className="stats">
            <div className="stats col-md-3 text-center">
              >30000+
              <div className="stats subtext text-center">assignments graded</div>
            </div>
            <div className="stats col-md-3 text-center">
              >3000+
              <div className="stats subtext text-center">student users</div>
            </div>
            <div className="stats col-md-3 text-center">
              20
              <div className="stats subtext text-center">courses managed*</div>
            </div>
            <div className="stats col-md-3 text-center">
              3
              <div className="stats subtext text-center">years of battle-tested use</div>
            </div>
            <div className="footnote">
              And thousands of administrator headaches prevented!
            </div>
          </div>
        </div>
        <div className="buffer" />
        <div className="newFlow">
          <div className="headline col-md-4">
          codePost streamlines the Computer Science course workflow
          </div>
          <div className="diagram col-md-8">
            <div className="admin row">
              <div className="text">
              <b>Seamless course management</b> and visibility.
              <b> Analytics</b> for continuous improvement.
              <b> Modularized assignments</b>, enabling re-usability from semester to semester.
              </div>
              <div className="title">
              Administrators
              </div>
              <img className="admin-new-icon" src={require("./img/admin-new.png")} />
            </div>
            <div className="cP-logo row">
              <img className="logo-icon" src={require("./img/logo-landing.png")} />
            </div>
            <div className="grader-student row">
              <div className="student col-md-6">
                <div className="title">
                Students
                </div>
                <div className="text">
                <b>No more paper</b>, finally.
                Assignments all in one place, <b> never lose one again.</b>
                <b> Targeted conversations</b> with TAs and professors.
                </div>
                <img className="student-new-icon" src={require("./img/student-new.png")} />
              </div>
              <div className="grader col-md-6">
                <div className="title">
                  Graders
                  </div>
                <div className="text">
                <b>More accuracy and consistency</b>, in half of the time.
                <b>Track</b> student improvement, and help them where it matters.
                <b>Grade on-the-go</b>, anywhere.
                </div>
                <img className="grader-new-icon" src={require("./img/graders-new.png")} />
              </div>
            </div>
          </div>
        </div>
        <div className="buffer" />
        <div className="oldFlow">
          <div className="problems col-md-8">
            <div className="headline row">
              Existing solutions are <b>clunky</b>, <b>difficult</b>, and <b>distracting</b>.
            </div>
            <div className="admin row">
              <div className="title col-md-3"> Administrators
              </div>
              <div className="icons col-md-3">
                <img className="admin-icon" src={require("./img/admin_old.png")} />
              </div>
              <div className="text col-md-5">
                <div className="bullet row"><b>No visibility</b> on data and trends.
                </div>
                <div className="bullet row"><b>Time-intensive</b> manual processes.
                </div>
                <div className="bullet row">Bullet 3
                </div>
              </div>
            </div>
            <div className="grader row">
              <div className="title col-md-3"> Graders
              </div>
              <div className="icons col-md-3">
                <img className="grader-icon" src={require("./img/grader_old.png")} />
              </div>
              <div className="text col-md-6">
                <div className="bullet row"><b>Unstructured</b> feedback to students.
                </div>
                <div className="bullet row"><b>Paper-based</b>.
                </div>
                <div className="bullet row"><b>Slow</b> to grade.
                </div>
              </div>
            </div>
            <div className="student row">
              <div className="title col-md-3"> Students
              </div>
              <div className="icons col-md-3">
                <img className="student-icon" src={require("./img/student_old.png")} />
              </div>
              <div className="text col-md-6">
                <div className="bullet row"><b>Difficult to understand</b> hand-written comments.
                </div>
                <div className="bullet row"><b>Easy to lose</b> feedback.
                </div>
                <div className="bullet row">Bullet 3
                </div>
              </div>
            </div>
          </div>
          <div className="CP-headline col-md-4">
            <div className="bullet-bold">
              codePost just works, so you don't have to
            </div>
          </div>
        </div>
        <div className="buffer" />
        <div className="siteVideos">
          <div className="navButtons col-md-4">
            <div className="rows">
            { Object.keys(this.vidTypes).map((vidName : any,link : any) => {
              const active = (vidName === this.state.active) ? " active" : "";
              return (
                <div className="row" key={ vidName + "-row" }>
                  <Button key={vidName} onClick={this.handleClick.bind(this, vidName)} className={vidName + "-btn" + active} flat={true}>For {vidName}</Button>
                </div>
              )}
            ) }
            </div>
          </div>
          <div className="videos col-md-8">
            <video className="video" loop={true} autoPlay={true} muted={true} preload="auto" src={this.vidTypes[this.state.active]} />
          </div>
        </div>
        <div className="buffer" />
        <div className="testomonials">
          <div className="trustedBy">
            <div className="text">Trusted By:</div>
            <img className="princeton-logo" src={require("./img/princeton-logo.png")} />
          </div>
        </div>
        <div className="buffer" />
      </div>
    );
  }
}

export default Landing;
