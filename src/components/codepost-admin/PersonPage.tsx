// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * One person, everything staff do with them in one place: who they are, Log in as, their roles
 * with Edit, a pending admin request with Approve and Deny, the courses they are on, and a way
 * into the activity log filtered to them. Addressed by id (`/dashboard/people/:id`), so the
 * address carries no email. A drawer over the People list, full-screen on a phone.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Drawer, Grid, Modal, Result, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { CrownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

import type { Course, Organization, User } from '../../api-client';
import { usersApi } from '../../api-client/clients';
import { apiErrorMessageAsync } from '../../lib/apiError';
import { usePlatformCapabilities } from '../../stores/usePermissionsStore';
import EditUserDialog from './EditUserDialog';
import { SIDER_COLLAPSED_WIDTH } from './StaffSidebar';
import LoginAsButton from './LoginAsButton';
import { usePendingAdminRequests } from './pendingAdminRequests';
import { staffPath } from './staffRoutes';

const { Text } = Typography;

type Role = 'student' | 'grader' | 'super grader' | 'course admin';
// One neutral tint per role, dark enough for 12px text; a hue per role was decoration.
const ROLE_TAG: Record<Role, React.CSSProperties> = {
  student: { color: '#0d7354', background: '#f0fff6', borderColor: '#9ce6c3' },
  grader: { color: '#0b53c7', background: '#e6f4ff', borderColor: '#91caff' },
  'super grader': { color: '#531dab', background: '#f9f0ff', borderColor: '#d3adf7' },
  'course admin': { color: '#ad4e00', background: '#fff7e6', borderColor: '#ffd591' },
};
const WARN_TAG: React.CSSProperties = { color: '#ad4e00', background: '#fff7e6', borderColor: '#ffd591' };

interface PersonPageProps {
  id: number;
  organizations: Organization[];
  isPhone: boolean;
  /** Closing the drawer: back to the People list, keeping its filters. */
  onClose: () => void;
  /** A role or a request changed: the console's counts need refreshing. */
  onChanged: () => void;
}

const PersonPage: React.FC<PersonPageProps> = ({ id, organizations, isPhone, onClose, onChanged }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [modal, modalHolder] = Modal.useModal();
  const screens = Grid.useBreakpoint();
  const platformCaps = usePlatformCapabilities();
  const canImpersonate = platformCaps.impersonate_user !== false;

  // A second person opened before the first answered: only the latest request may set state.
  const loadSeq = useRef(0);
  const load = async () => {
    const seq = ++loadSeq.current;
    setError(null);
    setNotFound(false);
    try {
      const fetched = await usersApi.retrieve({ email: String(id) });
      if (seq !== loadSeq.current) return;
      setUser(fetched);
    } catch (e) {
      if (seq !== loadSeq.current) return;
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 404) setNotFound(true);
      else setError((await apiErrorMessageAsync(e)) ?? 'This person could not be loaded.');
    }
  };
  useEffect(() => {
    setUser(null);
    load();
    // Only the id matters; load reads nothing else that changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  // Once an approve or deny lands (after its undo window) the roles here and the lists behind change.
  const pending = usePendingAdminRequests(() => {
    load();
    onChanged();
  });

  const request = pending.visibleUsers.find((u) => u.id === id);
  const email = user?.email ?? '';
  const organization = organizations.find((o) => o.id === user?.organization)?.name;

  const courseRows: { key: string; course: Course; role: Role }[] = user
    ? [
        ...user.courseadminCourses.map((course) => ({ course, role: 'course admin' as Role })),
        ...user.superGraderCourses.map((course) => ({ course, role: 'super grader' as Role })),
        ...user.graderCourses.map((course) => ({ course, role: 'grader' as Role })),
        ...user.studentCourses.map((course) => ({ course, role: 'student' as Role })),
      ]
        .map((row) => ({ ...row, key: `${row.course.id}-${row.role}` }))
        .sort((a, b) => a.course.name.localeCompare(b.course.name) || a.course.period.localeCompare(b.course.period))
    : [];
  const roles = Array.from(new Set(courseRows.map((r) => r.role)));

  const decide = (kind: 'approve' | 'deny') =>
    modal.confirm({
      title: kind === 'approve' ? `Approve ${email}?` : `Deny ${email}?`,
      content:
        kind === 'approve'
          ? 'They get course admin access; a request with no organization creates one.'
          : 'The request and the account are removed. You have eight seconds to undo.',
      okText: kind === 'approve' ? 'Approve' : 'Deny',
      okButtonProps: kind === 'deny' ? { danger: true } : undefined,
      // The drawer stays open: closing it would end the undo window at once.
      onOk: () => pending.defer(kind, [email]),
    });

  const section = (title: string, body: React.ReactNode, extra?: React.ReactNode) => (
    <section aria-label={title} style={{ display: 'grid', gap: 6 }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }} align="baseline">
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.45)',
          }}
        >
          {title}
        </Text>
        {extra}
      </Space>
      {body}
    </section>
  );

  const body = notFound ? (
    <Result
      status="404"
      title="No one has this id"
      subTitle="The person may have been removed, or the link is old."
      extra={<Button onClick={onClose}>Back to People</Button>}
    />
  ) : error ? (
    <Result
      status="error"
      title="This person could not be loaded"
      subTitle={error}
      extra={<Button onClick={load}>Try again</Button>}
    />
  ) : !user ? (
    <Skeleton active paragraph={{ rows: 8 }} />
  ) : (
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      {section(
        'Roles',
        <Space wrap size={[6, 6]}>
          {user.codePostAdmin && (
            <Tag icon={<CrownOutlined />} style={WARN_TAG}>
              platform admin
            </Tag>
          )}
          {roles.map((role) => (
            <Tag key={role} style={ROLE_TAG[role]}>
              {role}
            </Tag>
          ))}
          {user.isOrgStaff && <Tag>organization staff</Tag>}
          {roles.length === 0 && !user.codePostAdmin && <Text type="secondary">No course roles</Text>}
        </Space>,
        <Button size="small" onClick={() => setEditing(true)}>
          Edit roles
        </Button>,
      )}
      {request &&
        section(
          'Request',
          <Space wrap size={[8, 6]} align="center">
            <Text>
              Asked for course admin access
              {request.dateJoined ? ` on ${new Date(request.dateJoined).toLocaleDateString()}` : ''}
              {request.organization ? '' : ', with no organization yet'}.
            </Text>
            <Button size="small" onClick={() => decide('approve')}>
              Approve
            </Button>
            <Button size="small" type="link" danger onClick={() => decide('deny')}>
              Deny
            </Button>
          </Space>,
        )}
      {section(
        'Courses',
        courseRows.length === 0 ? (
          <Text type="secondary">Not on any course.</Text>
        ) : (
          <Table
            size="small"
            pagination={false}
            dataSource={courseRows}
            columns={[
              {
                title: 'Course',
                key: 'course',
                render: (_: unknown, r) => (
                  <span>
                    {r.course.name} <Text type="secondary">{r.course.period}</Text>
                  </span>
                ),
              },
              {
                title: 'Role',
                key: 'role',
                width: 130,
                render: (_: unknown, r) => <Tag style={ROLE_TAG[r.role]}>{r.role}</Tag>,
              },
              {
                title: 'Organization',
                key: 'org',
                responsive: ['sm'],
                render: (_: unknown, r) => organizations.find((o) => o.id === r.course.organization)?.name ?? '—',
              },
              {
                title: '',
                key: 'open',
                width: 70,
                render: (_: unknown, r) => (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate(`${staffPath('Courses')}?q=${encodeURIComponent(r.course.name)}`)}
                  >
                    Open
                  </Button>
                ),
              },
            ]}
          />
        ),
      )}
      {section(
        'Activity',
        <Button
          type="link"
          size="small"
          style={{ padding: 0, justifySelf: 'start' }}
          onClick={() => navigate(staffPath('Platform', 'activity'), { state: { q: email } })}
        >
          Open the activity log filtered to this person
        </Button>,
      )}
    </Space>
  );

  return (
    <Drawer
      open
      onClose={onClose}
      placement="right"
      // Full width on a phone; up to the collapsed sider on a tablet; antd's large size beyond that.
      styles={{
        wrapper: { width: isPhone ? '100%' : screens.lg ? 736 : `calc(100vw - ${SIDER_COLLAPSED_WIDTH}px)` },
      }}
      title={
        <Space style={{ justifyContent: 'space-between', width: '100%' }} align="center" wrap>
          <span>
            <Text strong style={{ fontSize: 16 }}>
              {email || 'Person'}
            </Text>
            {organization && (
              <Text type="secondary" style={{ display: 'block', fontSize: 12, fontWeight: 400 }}>
                {organization}
              </Text>
            )}
          </span>
          {canImpersonate && email && <LoginAsButton email={email} variant="primary" size="small" />}
        </Space>
      }
    >
      {modalHolder}
      {body}
      {user && (
        <EditUserDialog
          open={editing}
          user={user}
          organizations={organizations}
          onClose={() => setEditing(false)}
          onSuccess={() => {
            setEditing(false);
            load();
            onChanged();
          }}
        />
      )}
    </Drawer>
  );
};

export default PersonPage;
