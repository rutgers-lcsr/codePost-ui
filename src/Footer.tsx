import * as React from 'react';
import { Link } from 'react-router-dom';

class Footer extends React.Component<{}, {}> {
  public componentDidMount() {
    // Calendly widget setup
    const head = document.querySelector('head');
    const script = document.createElement('script');
    script.setAttribute('src', 'https://assets.calendly.com/assets/external/widget.js');
    const link = document.createElement('link');
    link.setAttribute('href', 'https://assets.calendly.com/assets/external/widget.css');
    link.setAttribute('rel', 'stylesheet');
    head!.appendChild(script);
    head!.appendChild(link);
    const calendlyFooter = document.getElementById('calendly-footer');
    calendlyFooter!.setAttribute('onclick', "Calendly.showPopupWidget('https://calendly.com/codepost/');return false;");
  }

  public render() {
    return (
      <div className="Footer">
        <div className="Footer__copyright">© codePost 2019</div>
        <div className="Footer__rightBox">
          <div className="Footer__rightBox__item">
            <a href="http://updates.codepost.io" target="_blank">
              Updates
            </a>
          </div>
          <div className="Footer__rightBox__item">
            <a href="http://docs.codepost.io" target="_blank">
              API Docs
            </a>
          </div>
          <div className="Footer__rightBox__item">
            <a href="mailto:team@codepost.io">Contact Us</a>
          </div>
          <div id="calendly-footer" className="Footer__rightBox__item">
            <a> Schedule a demo </a>
          </div>
          <div className="Footer__rightBox__item">
            <Link to={'/privacy'}>Privacy</Link>
          </div>
          <div className="Footer__rightBox__item">
            <Link to={'/terms'}>Terms</Link>
          </div>
        </div>
      </div>
    );
  }
}

export default Footer;
