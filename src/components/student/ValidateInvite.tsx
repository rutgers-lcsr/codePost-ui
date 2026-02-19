import * as React from 'react';

import { Alert, Button, Spin } from 'antd';
import { useParams } from 'react-router-dom';

import { colors } from '../../theme/colors';
import PreAuthLayout from '../pre-auth/PreAuthLayout';

import { Submission } from '../../services/submission';

interface IValidateInviteProps {
  isLoggedIn: boolean;
}

enum STATUS {
  IDLE,
  LOADING,
  SUCCESS,
  INVALID,
}

const ValidateInvite = (props: IValidateInviteProps) => {
  const params = useParams<{ sid: string; token: string }>();
  const [submission, setSubmission] = React.useState<any>(undefined);
  const [status, setStatus] = React.useState<STATUS>(STATUS.IDLE);

  React.useEffect(() => {
    const validatePartnerLinkAndReturn = async () => {
      const token = params.token;
      const sid = params.sid;

      if (!token || !sid) return;

      try {
        const data = await Submission.validatePartnerLinkAndReturn(parseInt(sid, 10), token);
        setSubmission(data);
      } catch (err) {
        setStatus(STATUS.INVALID);
        setSubmission(undefined);
      }
    };

    validatePartnerLinkAndReturn();
  }, [params.sid, params.token]);

  const join = async () => {
    const token = params.token;
    const sid = params.sid;

    if (!token || !sid) return;

    setStatus(STATUS.LOADING);
    try {
      await Submission.validatePartnerLink(parseInt(sid, 10), token);
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      setStatus(STATUS.INVALID);
    }
  };

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
            <span style={{ color: colors.brandPrimary }} onClick={redirect}>
              Click here
            </span>{' '}
            to go to the Student Console.
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
