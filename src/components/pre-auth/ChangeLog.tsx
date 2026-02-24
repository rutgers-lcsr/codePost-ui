// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface IProps {
  isLoggedIn: boolean;
}

/**
 * Redirects visitors to the docs-integrated changelog.
 * Kept as a thin wrapper so existing /changelog links and footer references keep working.
 */
const ChangeLog = (_props: IProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/docs/changelog', { replace: true });
  }, [navigate]);

  return null;
};

export default ChangeLog;
