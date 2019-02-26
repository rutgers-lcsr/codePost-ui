import * as React from 'react';
import { TopBarNoEmail } from '../TopBar';
import Footer from './../../Footer';

interface IProps {
  isAuthenticated: boolean;
}

class PrivacyPolicy extends React.Component<IProps, {}> {
  public render() {
    return (
      <div>
        {!this.props.isAuthenticated ? <TopBarNoEmail /> : <div />}
        <div className="Privacy">
          <div className="Privacy__title">Privacy Policy</div>
          <div>
            <div className="Privacy__item">
              Your privacy is important to us. It is codePost’s policy to respect your privacy regarding any information
              we may collect from you across our website, codepost.io, and other sites we own and operate.
            </div>

            <div className="Privacy__item">
              We only ask for personal information when we truly need it to provide a service to you. We collect it by
              fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and
              how it will be used.
            </div>

            <div className="Privacy__item">
              We only retain collected information for as long as necessary to provide you with your requested service.
              What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well
              as unauthorised access, disclosure, copying, use or modification.
            </div>
            <div className="Privacy__item">
              In compliance with FERPA, we do not share any personally identifying information or education records
              publicly or with third-parties, except when required to by law or with the consent of the student or
              university.{' '}
            </div>

            <div className="Privacy__item">
              Our website may link to external sites that are not operated by us. Please be aware that we have no
              control over the content and practices of these sites, and cannot accept responsibility or liability for
              their respective privacy policies.
            </div>

            <div className="Privacy__item">
              You are free to refuse our request for your personal information, with the understanding that we may be
              unable to provide you with some of your desired services.
            </div>

            <div className="Privacy__item">
              Your continued use of our website will be regarded as acceptance of our practices around privacy and
              personal information. If you have any questions about how we handle user data and personal information,
              feel free to contact us.
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default PrivacyPolicy;
