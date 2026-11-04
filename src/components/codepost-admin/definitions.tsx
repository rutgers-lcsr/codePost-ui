// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

/** Terms the staff console counts without explaining anywhere else. */
export const DEFINITIONS = {
  platformAdmins: 'codePost staff: superusers who can open this console.',
  courseAdmins: 'Instructors: anyone who administers at least one course.',
  inactiveUsers: 'Never signed in, or no sign-in for 90 days.',
} as const;

/** A stat title with its definition one hover (or focus) away. */
export const definedTitle = (label: string, definition: string) => (
  <span>
    {label}{' '}
    <Tooltip title={definition} trigger={['hover', 'focus']}>
      <InfoCircleOutlined aria-label={definition} tabIndex={0} style={{ fontSize: 12 }} />
    </Tooltip>
  </span>
);
