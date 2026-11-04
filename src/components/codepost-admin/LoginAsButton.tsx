// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { Button, Popconfirm } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { startImpersonation } from '../core/impersonation';

interface LoginAsButtonProps {
  email: string;
  /** Visual weight: a primary button in action columns, or a quiet text link inside a cell. */
  variant?: 'primary' | 'text';
  size?: 'small' | 'middle';
}

/**
 * Impersonate a user from the staff console. Impersonation replaces the staff session
 * with the target user's, so it always asks first; the staff session is kept for this
 * tab and a bar on every page brings it back.
 */
const LoginAsButton: React.FC<LoginAsButtonProps> = ({ email, variant = 'primary', size = 'small' }) => (
  <Popconfirm
    title={`Log in as ${email}?`}
    description="You will see codePost as this user. A bar at the bottom of every page brings you back here."
    okText="Log in as user"
    cancelText="Cancel"
    placement="topRight"
    onConfirm={() => startImpersonation(email)}
  >
    <Button
      type={variant === 'primary' ? 'primary' : 'link'}
      size={size}
      icon={<LoginOutlined />}
      aria-label={`Log in as ${email}`}
      style={variant === 'text' ? { padding: 0, height: 'auto' } : undefined}
    >
      Log in as
    </Button>
  </Popconfirm>
);

export default LoginAsButton;
