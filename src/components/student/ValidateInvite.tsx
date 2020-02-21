import * as React from 'react';

import { Redirect } from 'react-router-dom';

import { Alert, Button, Icon, Input, message, Spin, Statistic, Tooltip, Typography } from 'antd';

import PreAuthLayout from '../pre-auth/PreAuthLayout';

import { AssignmentType, AssignmentStudentType } from '../../infrastructure/assignment';

import { PartnerLinkType, Submission, StudentSubmissionType } from '../../infrastructure/submission';

interface IValidateInviteProps {
  match: any;
  history: any;
  isLoggedIn: boolean;
}

enum STATUS {
  IDLE,
  LOADING,
  SUCCESS,
  INVALID,
}

const ValidateInvite = (props: IValidateInviteProps) => {
  const [submission, setSubmission] = React.useState<any>(undefined);
  const [status, setStatus] = React.useState<STATUS>(STATUS.IDLE);

  React.useEffect(() => {
    const validatePartnerLinkAndReturn = async () => {
      const token = props.match.params.token;
      const sid = props.match.params.sid;

      try {
        const data = await Submission.validatePartnerLinkAndReturn(sid, { token });
        setSubmission(data);
      } catch (err) {
        setStatus(STATUS.INVALID);
        setSubmission(undefined);
      }
    };

    validatePartnerLinkAndReturn();
  }, []);

  const join = async () => {
    const token = props.match.params.token;
    const sid = props.match.params.sid;

    setStatus(STATUS.LOADING);
    try {
      const data = await Submission.validatePartnerLink(sid, { token });
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      setStatus(STATUS.INVALID);
    }
  };

  const redirect = () => {
    // FIXME: user is getting logged out for some reason
    props.history.push('/student');
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
  } else if (status === STATUS.LOADING || (status === STATUS.IDLE && submission === undefined)) {
    content = (
      <div style={{ textAlign: 'center' }}>
        <Spin />
      </div>
    );
  } else if (status === STATUS.IDLE && submission !== undefined) {
    content = (
      <Alert
        message="Joining submission with..."
        description={
          <div>
            <ul>
              {submission.students.map((email: string) => {
                return <li>{email}</li>;
              })}
            </ul>
            <br />
            <Button onClick={join}>Join</Button>
          </div>
        }
        type="info"
      />
    );
  } else if (status === STATUS.SUCCESS) {
    content = (
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
