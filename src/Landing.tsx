import * as React from 'react';
import LandingTopBar from './components/LandingTopBar';

class Landing extends React.Component {
  public render() {
    return (
      <div className="Landing">
        <LandingTopBar />
        <div className="Hero">
          <div className="Description col-md-5">
            <div className="logo">codePost</div>
            <div className="Description-head">Teach Computer Science Better.</div>
            <div className="Description-text">
              codePost makes grading and course management easy, allowing you to focus on what's important: helping your
              students improve and become power programmers!
            </div>
          </div>
          <div className="Hero-image col-md-7" />
        </div>
        <div className="pathBox">
          <svg viewBox="0 0 1280 100" preserveAspectRatio="none">
            <path d="M0 0 C 20 50, 1180 50, 1280 0" stroke="transparent" fill="#e9e9e9" />
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
              3<div className="stats subtext text-center">years of battle-tested use</div>
            </div>
            <div className="footnote">And thousands of administrator headaches prevented!</div>
          </div>
        </div>
      </div>
    );
  }
}

export default Landing;
