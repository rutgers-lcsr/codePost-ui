/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useState, useEffect } from 'react';

/* ant imports */
import { Typography } from 'antd';

/* other library imports */
import { Link, useParams } from 'react-router-dom';

/* codePost */
import PasswordResetForm from './PasswordResetForm';

import PreAuthLayout from './PreAuthLayout';

/**********************************************************************************************************************/

/****************************************************************
This component works as follows:

(1) Receive token from user in URL (most likely by clicking on
reset password link)

(2) Validate that token is valid on server-side. If so, render
password reset form. Note this is purely a UX optimization. We
don't want to present users with the password reset *form* before
we know their token is valid, but we *do* need to resubmit the token
with the form so that that update password action on the server-side
can be authenticated.

(3) Submit the token along with the new password to server. If
action succeeds, present user with option to log in. Otherwise,
present error message.
*****************************************************************/

/* NOTE: as of right now, this page allows users who have not previously set a password
/* to do so via the /activate or /password-reset URLs. This doesn't seem to cause any
/* adverse behavior, but worth noting in case in case this information can be used to
/* debug unexpected behavior in the future.
*/

interface IPasswordResetProps {
  message: string;
  isLoggedIn: boolean;
}

const PasswordReset: React.FC<IPasswordResetProps> = ({ message, isLoggedIn }) => {
  const params = useParams<{ uid: string; token: string }>();
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [loadState, setLoadState] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // After validating the token, we should take it out of the URl to avoiding leaking
  // the token in HTTP referer field if the user navigates away from the page.
  // For an explanation of this vulnerability:
  // https://robots.thoughtbot.com/is-your-site-leaking-password-reset-links
  const validateToken = () => {
    const payload = {
      uid: params.uid,
      token: params.token,
    };

    fetch(`${process.env.REACT_APP_API_URL}/registration/verifyRegistrationToken/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      method: 'POST',
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        if (json.isValid) {
          setLoadState('valid');
          setEmail(json.email);
        } else {
          setLoadState('invalidToken');
        }
      });
  };

  useEffect(() => {
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token, params.uid]);

  const handleReset = (password: string) => {
    const payload = {
      token: params.token,
      uid: params.uid,
      password1: password,
      password2: password,
    };

    fetch(`${process.env.REACT_APP_API_URL}/registration/registerAndSetPassword/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      method: 'POST',
    })
      .then((res) => {
        if (res.ok || res.status === 400) {
          return res.json();
        } else {
          return Promise.reject();
        }
      })
      .then((json) => {
        if (json.isValid) {
          setLoadState('success');
        } else {
          setFormErrors(json.errors);
        }
      });
  };

  let content;
  switch (loadState) {
    case 'valid': {
      const errorList = Object.keys(formErrors).map((el, i) => {
        return (
          <li key={i}>
            {el}: {formErrors[el]}
          </li>
        );
      });

      let messageText;
      switch (message) {
        case 'forgot':
          messageText = 'Set a new password below';
          break;
        case 'activate':
          messageText = 'Set your codePost password below.';
          break;
        case 'upgrade':
          messageText = 'Set up a new codePost password to access your old account';
          break;
        default:
          messageText = '';
      }

      content = (
        <div>
          <p>{messageText}</p>
          <p>
            Your codePost email address: <Typography.Text code>{email}</Typography.Text>
          </p>
          <PasswordResetForm handleSubmit={handleReset} />
          <ul>{errorList}</ul>
        </div>
      );
      break;
    }
    case 'invalidToken': {
      let newLinkMessage;
      switch (message) {
        case 'forgot':
          newLinkMessage = (
            <span>
              Request a new password reset link <Link to="/forgot-password/">here</Link>.
            </span>
          );
          break;
        case 'activate':
          newLinkMessage = (
            <span>
              Request a new account activation link <Link to="/signup/join/">here</Link>.
            </span>
          );
          break;
        case 'upgrade':
          newLinkMessage = (
            <span>
              Request a new account upgrade link <Link to="/upgrade/">here</Link>.
            </span>
          );
          break;
        default:
          newLinkMessage = '';
      }

      content = (
        <div>
          <Typography.Title level={4}>There's something wrong with your link.</Typography.Title>Make sure you haven't
          received a more recent email from us (only the latest link will work).
          <br />
          <br />
          <div>{newLinkMessage}</div>
        </div>
      );

      break;
    }
    case 'success':
      content = (
        <div>
          <Typography.Title level={4}>Success!</Typography.Title>
          <div>
            Try <Link to="/login">logging in</Link> now.
          </div>
        </div>
      );

      break;
    default:
      content = <p>Hang tight...validating your token</p>;
  }

  let title = '';
  switch (message) {
    case 'forgot':
      title = 'Reset your password';
      break;
    case 'activate':
      title = 'Set your password';
      break;
    case 'upgrade':
      title = 'Set your password';
      break;
  }

  return (
    <PreAuthLayout isLoggedIn={isLoggedIn}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <br />
        <br />
        <Typography.Title level={1}>{title}</Typography.Title>
        {content}
      </div>
    </PreAuthLayout>
  );
};

export default PasswordReset;
