// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Alert, Button, Spin } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { UserType } from '../../types/models';

interface LogInAsProps {
  replaceUser: (user: UserType, redirect: boolean, isSuperUser: boolean) => void;
}

const LogInAs: React.FC<LogInAsProps> = ({ replaceUser }) => {
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Get email from query string
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';

  const issueRequest = useCallback(async () => {
    if (!email) {
      setErrorMessage('No email provided in URL');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${email}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const user: UserType = await response.json();
      replaceUser(user, true, true);
    } catch (err) {
      console.error('Login as error:', err);
      setErrorMessage('An error occurred. You probably do not have permission to perform this action!');
      setLoading(false);
    }
  }, [email, replaceUser]);

  useEffect(() => {
    // Automatically trigger login when component mounts
    issueRequest();
  }, [issueRequest]);

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '100px auto',
        padding: 20,
        textAlign: 'center',
      }}
    >
      {loading && (
        <div>
          <Spin size="large" />
          <h2 style={{ marginTop: 20 }}>Logging in as {email}...</h2>
          <p>Please wait while we switch your account.</p>
        </div>
      )}

      {errorMessage && (
        <div>
          <Alert message="Login Failed" description={errorMessage} type="error" showIcon style={{ marginBottom: 20 }} />
          <Button type="primary" size="large" onClick={issueRequest}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default LogInAs;
