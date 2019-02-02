import * as React from 'react';
import LandingTopBar from './components/LandingTopBar';

class Landing extends React.Component {
  public render() {
    return (
      <div className="Landing">
        <LandingTopBar />
        <div className="Hero">
          <div className="Description col-md-5">
            <div className="logo">
              code<b>Post</b>
            </div>
            <div className="Description-head">Give better feedback on CS assignments</div>
            <div className="Description-text">
              codePost makes it easy to provide high-quality feedback on programming assignments, so you focus on
              teaching.
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
            <div className="stats col-md-4 text-center">
              >30,000
              <div className="stats subtext text-center">assignments graded</div>
            </div>
            <div className="stats col-md-4 text-center">
              >3,000
              <div className="stats subtext text-center">students</div>
            </div>
            <div className="stats col-md-4 text-center">
              >20
              <div className="stats subtext text-center">courses managed</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Landing;
