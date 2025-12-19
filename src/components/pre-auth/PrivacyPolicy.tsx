/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Typography } from 'antd';

/* codePost imports */
import PreAuthLayout from './PreAuthLayout';

/**********************************************************************************************************************/

interface IProps {
  isLoggedIn: boolean;
}

class PrivacyPolicy extends React.Component<IProps> {
  public render() {
    return (
      <PreAuthLayout isLoggedIn={this.props.isLoggedIn}>
        <div>
          <Typography.Title level={3}>Privacy Policy</Typography.Title>

          <Typography.Paragraph>
            Your privacy is important to us. It is codePost’s policy to respect your privacy regarding any information
            we may collect from you across our website, codepost.io, and other sites we own and operate.
          </Typography.Paragraph>

          <Typography.Paragraph>
            We only ask for personal information when we truly need it to provide a service to you. We collect it by
            fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how
            it will be used.
          </Typography.Paragraph>

          <Typography.Paragraph>
            We only retain collected information for as long as necessary to provide you with your requested service.
            What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as
            unauthorised access, disclosure, copying, use or modification.
          </Typography.Paragraph>
          <Typography.Paragraph>
            In compliance with FERPA, we do not share any personally identifying information or education records
            publicly or with third-parties, except when required to by law or with the consent of the student or
            university.
          </Typography.Paragraph>

          <Typography.Paragraph>
            Our website may link to external sites that are not operated by us. Please be aware that we have no control
            over the content and practices of these sites, and cannot accept responsibility or liability for their
            respective privacy policies.
          </Typography.Paragraph>

          <Typography.Paragraph>
            You are free to refuse our request for your personal information, with the understanding that we may be
            unable to provide you with some of your desired services.
          </Typography.Paragraph>

          <Typography.Paragraph>
            Your continued use of our website will be regarded as acceptance of our practices around privacy and
            personal information. If you have any questions about how we handle user data and personal information, feel
            free to contact us at <a href="mailto:team@codepost.io">team@codepost.io</a>.
          </Typography.Paragraph>
        </div>
      </PreAuthLayout>
    );
  }
}

export default PrivacyPolicy;
