import * as React from 'react';
import { Button } from 'react-md';
import Footer from './../Footer';
import LandingTopBar from './LandingTopBar';

interface IProps {
  isAuthenticated: boolean;
}

class Pricing extends React.Component<IProps, {}> {
  public render() {
    return (
      <div className="Pricing">
        <div className="Pricing__background" />
        <LandingTopBar />
        <div className="Pricing__title-box">
          <div className="Pricing__title1">
            codePost is free for as long as you want, <br />
            for as many courses and people that you need.
          </div>
        </div>
        <div className="Pricing__main-container">
          <div className="Pricing__free">
            <div className="Pricing__free__title">Free</div>
            <div className="Pricing__free__subtext">Full access to codePost features for no cost.</div>
            <div className="Pricing__free__features">
              <div className="Pricing__free__item">
                <img className="Pricing__free__item__check" src={require('../img/green-check.png')} />
                <div className="Pricing__free__item__text">
                  <b>Unlimited</b> Students
                </div>
              </div>
              <div className="Pricing__free__item">
                <img className="Pricing__free__item__check" src={require('../img/green-check.png')} />
                <div className="Pricing__free__item__text">
                  <b>Unlimited</b> Course Staff
                </div>
              </div>
              <div className="Pricing__free__item">
                <img className="Pricing__free__item__check" src={require('../img/green-check.png')} />
                <div className="Pricing__free__item__text">
                  <b>Unlimited</b> Submissions
                </div>
              </div>
              <div className="Pricing__free__item">
                <img className="Pricing__free__item__check" src={require('../img/green-check.png')} />
                <div className="Pricing__free__item__text">
                  <b>Importing rubrics</b> and rosters
                </div>
              </div>
              <div className="Pricing__free__item">
                <img className="Pricing__free__item__check" src={require('../img/green-check.png')} />
                <div className="Pricing__free__item__text">
                  <b>Access</b> to a repository of <b>common API scripts</b>
                </div>
              </div>
              <div className="Pricing__free__item">
                <img className="Pricing__free__item__check" src={require('../img/green-check.png')} />
                <div className="Pricing__free__item__text">
                  Full API access for up to <b>1000 requests/day</b>
                </div>
              </div>
              <div className="Pricing__free__item">
                <img className="Pricing__free__item__check" src={require('../img/green-check.png')} />
                <div className="Pricing__free__item__text">
                  <b>Support for integrations</b> and API scripts
                </div>
              </div>
              <div className="Pricing__free__item">
                <img className="Pricing__free__item__check" src={require('../img/green-check.png')} />
                <div className="Pricing__free__item__text">
                  Guaranteed <b>24 hour</b> response time
                </div>
              </div>
            </div>
            <Button href="/signup/staff" flat={true} key="CourseStaffSignUp" className="Pricing__free__action">
              Sign Up
            </Button>
          </div>
          <div className="Pricing__premium">
            <div className="Pricing__premium__title">Premium</div>
            <div className="Pricing__premium__subtext">Additional features. Ideal for online code academies.</div>
            <div className="Pricing__premium__features">
              <div className="Pricing__premium__item">
                <div className="Pricing__premium__item__text">Unlimited number of API requests/day</div>
              </div>
              <div className="Pricing__premium__item">
                <div className="Pricing__premium__item__text">Guaranteed 3 hour response time</div>
              </div>
              <div className="Pricing__premium__item">
                <div className="Pricing__premium__item__text">White label (custom logo + styles)</div>
              </div>
            </div>
            <Button
              href="mailto:team@codepost.io"
              flat={true}
              key="CourseStaffSignUp"
              className="Pricing__premium__action"
            >
              Contact Us
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default Pricing;
