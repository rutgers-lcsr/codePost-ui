import * as React from 'react';

import { Redirect } from 'react-router-dom';

import { Alert, Icon, Input, message, Spin, Statistic, Tooltip, Typography } from 'antd';

import PreAuthLayout from '../pre-auth/PreAuthLayout';

import { AssignmentType, AssignmentStudentType } from '../../infrastructure/assignment';

import { PartnerLinkType, Submission, StudentSubmissionType } from '../../infrastructure/submission';

interface IValidateInviteProps {
  match: any;
  history: any;
  isLoggedIn: boolean;
}

const ValidateInvite = (props: IValidateInviteProps) => {
  const [status, setStatus] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const validatePartnerLink = async () => {
      const token = props.match.params.token;
      const sid = props.match.params.sid;

      try {
        const data = await Submission.validatePartnerLink(sid, { token });
        setStatus(true);
      } catch (err) {
        setStatus(false);
      }
    };

    validatePartnerLink();
  }, []);

  const redirect = () => {
    window.open('/student', '_blank');
  };

  let content;

  if (!props.isLoggedIn) {
    content = (
      <Alert
        message=""
        description={<div>Please log into your codePost account before accepting a submission invite.</div>}
        type="warning"
      />
    );
  } else if (status === undefined) {
    content = (
      <div style={{ textAlign: 'center' }}>
        <Spin />
      </div>
    );
  } else if (status) {
    content = (
      <Alert
        message="Successfully joined submission!"
        description={
          <div>
            <a onClick={redirect}>Click here</a> to go to the Student Console.
          </div>
        }
        type="success"
      />
    );
  } else {
    content = (
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
        {content}
      </div>
    </PreAuthLayout>
  );
};

export default ValidateInvite;
