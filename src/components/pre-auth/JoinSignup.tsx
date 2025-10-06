/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';

/* ant imports */
import { Alert, Checkbox, Input, Spin, Tooltip, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

import { RouteComponentProps } from 'react-router';

import queryString from 'query-string';

/* codePost imports */
import PreAuthSignupLayout from './PreAuthSignupLayout';

import CPButton from '../core/CPButton';

/**********************************************************************************************************************/

// interface IState {
//   email: string;
//   acceptedTerms: boolean;

//   // Join Flow states
//   hasSubmitted: boolean;
//   confirmEmailSent: boolean;
// }

const JoinSignup = (props: RouteComponentProps & { email?: string }) => {
  const [email, setEmail] = React.useState(props.email || '');
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(props.email ? true : false);
  const parsedCode = queryString.parse(props.location.search).code;
  const [inviteCode, setInviteCode] = React.useState(
    typeof parsedCode === 'string' ? parsedCode : Array.isArray(parsedCode) ? parsedCode[0] || '' : '',
  );
  const [invalidCode, setInvalidCode] = React.useState(false);
  const [invalidEmail, setInvalidEmail] = React.useState(false);

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasSubmitted(true);
    const payload = {
      username: email,
      email: email,
      token: inviteCode,
    };

    fetch(`${process.env.REACT_APP_API_URL}/registration/emailRegistration/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 200 || res.status === 403) {
          return res.json();
        } else {
          return Promise.reject(res.status);
        }
      })
      .then((res) => {
        if (res.success) {
          setConfirmEmailSent(res.success);
        } else if (!res.code_valid) {
          setHasSubmitted(false);
          setInvalidCode(true);
        } else if (!res.email_valid) {
          setInvalidCode(false);
          setHasSubmitted(false);
          setInvalidEmail(true);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  let content;
  if (hasSubmitted) {
    content = confirmEmailSent ? (
      <Alert
        message={'Success!'}
        description={
          props.email ? (
            <span>
              Head back to your{' '}
              <a target="_blank" href="/student">
                Student Console
              </a>{' '}
              to check out your new course.
            </span>
          ) : (
            <span>
              Check your email to finish signing up. If you don't see an email within a couple of minutes,{' '}
              <a href="http://help.codepost.io/en/articles/3324251-faq-where-is-my-email" target="_blank">
                please read this
              </a>
              .
            </span>
          )
        }
      />
    ) : (
      <span>
        Hang tight...sending you an email &nbsp; &nbsp; <Spin />
      </span>
    );
  } else {
    content = (
      <div>
        Invite code:{' '}
        <Input
          placeholder="abc123"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          addonAfter={
            <Tooltip title="If you don't have one of these, ask your instructor.">
              <QuestionCircleOutlined style={{ cursor: 'pointer' }} />
            </Tooltip>
          }
        />
        {invalidCode && <span style={{ color: 'red' }}>Your invite code is invalid.</span>}
        <br />
        <br />
        Email:{' '}
        <Input
          placeholder="jill@princeton.edu"
          defaultValue={email}
          disabled={props.email ? true : false}
          onChange={(e) => setEmail(e.target.value)}
        />
        {invalidEmail && (
          <span style={{ color: 'red' }}>
            Your email doesn't match the whitelist for this course. Make sure you're using your organizational (e.g.
            .edu) email.
          </span>
        )}
        <br />
        <br />
        {props.email === undefined && (
          <span>
            <Checkbox checked={acceptedTerms} onClick={() => setAcceptedTerms(!acceptedTerms)} /> I agree to the
            codePost <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
          </span>
        )}
        <br />
        <br />
        <div style={{ display: 'flex' }}>
          <Link to="/signup">
            <CPButton cpType="secondary">Back</CPButton>
          </Link>
          &nbsp; &nbsp; &nbsp; &nbsp;
          <CPButton cpType="primary" onClick={handleSignup} disabled={!acceptedTerms}>
            {props.email ? 'Join course' : 'Continue'}
          </CPButton>
        </div>
      </div>
    );
  }

  return (
    <PreAuthSignupLayout step={1}>
      <div style={{ maxWidth: 500 }}>
        <br />
        <br />
        <Typography.Title level={1}>Join a course on codePost</Typography.Title>
        {content}
      </div>
    </PreAuthSignupLayout>
  );
};

export default JoinSignup;
