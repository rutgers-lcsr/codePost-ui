// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { Button } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import type { Course, User } from '../../api-client';
import { endImpersonation, stashedImpersonator } from './impersonation';

interface ImpersonationBarProps {
  /** The account currently signed in (the one being impersonated). */
  user?: User | null;
}

/**
 * What this account can do, in the words staff use: "student in CS 101 · Fall 2023" when there is one
 * course, "student in 2 courses, grader in 1" when there are several, "no course roles" for a bare account.
 */
export function describeRoles(user: User | null | undefined): string {
  if (!user) return '';
  const superGraderIds = new Set((user.superGraderCourses ?? []).map((c) => c.id));
  const roles: Array<[string, Course[]]> = [
    ['admin', user.courseadminCourses ?? []],
    ['super grader', user.superGraderCourses ?? []],
    // Super graders are graders too; count each course once.
    ['grader', (user.graderCourses ?? []).filter((c) => !superGraderIds.has(c.id))],
    ['student', user.studentCourses ?? []],
  ];
  const held = roles.filter(([, courses]) => courses.length > 0);
  if (held.length === 0) return 'no course roles';
  const total = held.reduce((n, [, courses]) => n + courses.length, 0);
  if (total === 1) {
    const [role, [course]] = held[0];
    return `${role} in ${[course.name, course.period].filter(Boolean).join(' · ')}`;
  }
  return held
    .map(
      ([role, courses], i) =>
        `${role} in ${courses.length}${i === 0 ? (courses.length === 1 ? ' course' : ' courses') : ''}`,
    )
    .join(', ');
}

/**
 * Shown on every page while a staff member is acting as another user: who you are right now, what that
 * account can do, that what you do here is real, and one click back to the staff console. Fixed to the
 * bottom so it never covers a page header; the page gets matching bottom padding so it covers nothing else.
 */
const ImpersonationBar: React.FC<ImpersonationBarProps> = ({ user }) => {
  const active = !!stashedImpersonator();
  const barRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const bar = barRef.current;
    if (!active || !bar) return undefined;
    const reserve = () => {
      document.body.style.paddingBottom = `${bar.offsetHeight}px`;
    };
    reserve();
    const observer = new ResizeObserver(reserve);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = '';
    };
  }, [active]);
  if (!active) return null;
  const roles = describeRoles(user);
  return (
    <div
      ref={barRef}
      role="status"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1100,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '8px 16px',
        // An amber band: console chrome, and a caution, on top of whatever page is being viewed.
        borderTop: '3px solid #ffc53d',
        background: '#1b1b1b',
        color: 'rgba(255, 255, 255, 0.92)',
        fontSize: 13,
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.25)',
      }}
    >
      <span>
        Staff console: you are logged in as <strong>{user?.email || 'another user'}</strong>
        {roles ? <span style={{ color: 'rgba(255, 255, 255, 0.72)' }}> ({roles})</span> : null}.{' '}
        <strong style={{ color: '#ffd666' }}>Actions here are real</strong> and saved as this user.
      </span>
      <Button size="small" icon={<RollbackOutlined />} onClick={endImpersonation}>
        Return to staff console
      </Button>
    </div>
  );
};

export default ImpersonationBar;
