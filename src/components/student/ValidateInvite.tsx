import * as React from 'react';

import { Alert, Icon, Input, message, Spin, Statistic, Tooltip, Typography } from 'antd';

import PreAuthLayout from '../pre-auth/PreAuthLayout';

import { AssignmentType, AssignmentStudentType } from '../../infrastructure/assignment';

import { PartnerLinkType, Submission, StudentSubmissionType } from '../../infrastructure/submission';

interface IValidateInviteProps {
  match: any;
  isLoggedIn: boolean;
}

const ValidateInvite = (props: IValidateInviteProps) => {
  const [status, setStatus] = React.useState<boolean | undefined>(false);

  React.useEffect(() => {
    // const validatePartnerLink = async () => {
    //   const data = await Submission.validatePartnerLink();
    //   setStatus(data);
    // };

    // validatePartnerLink();
    console.log('token', props.match.params.token);
  }, []);

  const redirect = () => {
    console.log('redirect!');
  };

  let message;

  if (props.isLoggedIn) {
    message = (
      <Alert
        message=""
        description={<div>Please log into your codePost account before accepting a submission invite.</div>}
        type="warning"
      />
    );
  } else if (status === undefined) {
    message = (
      <div style={{ textAlign: 'center' }}>
        <Spin />
      </div>
    );
  } else if (status) {
    message = (
      <Alert
        message="Successfully joined submission!"
        description={
          <div>
            <span>You will be redirected in...</span>
            <span>
              <Statistic.Countdown value={Date.now() + 5000} format="ss" onFinish={redirect} />
            </span>
          </div>
        }
        type="success"
      />
    );
  } else {
    message = (
      <Alert
        message="Invalid link"
        description={<div>The link provided is either expired or invalid.</div>}
        type="error"
      />
    );
  }

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <br />
        <br />
        {message}
      </div>
    </PreAuthLayout>
  );
};

export default ValidateInvite;
