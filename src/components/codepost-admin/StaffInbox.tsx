// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * The staff console's landing page as a to-do list: what is waiting, most urgent first, one
 * sentence and one button each; then the things that are fine, in the same order, so the page
 * has the same shape on a bad day and a good day; then the platform's totals as one line.
 */
import React, { useContext } from 'react';
import { Button, Modal, Skeleton, Space, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router';

import type { AssignmentDeadline, DashboardStats, Organization } from '../../api-client';
import { StatusDfeEnum } from '../../api-client/models/index';
import { formatWindow, nextSafeWindow } from './deployWindows';
import type { SavedBanner } from './MaintenanceBannerPanel';
import { usePendingAdminRequests } from './pendingAdminRequests';
import { CHECKS, NEXT_STEPS, SystemHealthContext, type AnyCheck } from './systemHealthModel';
import { personPath, staffPath, type StaffPage } from './staffRoutes';
import { DEFINITIONS } from './definitions';

const { Text } = Typography;

// Tag text dark enough for 12px on each tint (antd's presets sit near 3.3:1).
const BAD_TAG: React.CSSProperties = { color: '#a8071a', background: '#fff1f0', borderColor: '#ffa39e' };
const WARN_TAG: React.CSSProperties = { color: '#ad4e00', background: '#fff7e6', borderColor: '#ffd591' };
const OK_TAG: React.CSSProperties = { color: '#0d7354', background: '#f0fff6', borderColor: '#9ce6c3' };
const OFF_TAG: React.CSSProperties = { color: 'rgba(0, 0, 0, 0.65)', background: '#fafafa', borderColor: '#d9d9d9' };

interface InboxRow {
  key: string;
  chip: React.ReactNode;
  what: React.ReactNode;
  why?: React.ReactNode;
  action: React.ReactNode;
  /** Below the sentence: the first few requests, decided here. */
  extra?: React.ReactNode;
}

interface StaffInboxProps {
  stats: DashboardStats;
  deadlines: AssignmentDeadline[] | null;
  /** The due dates did not load: say so, rather than "no due dates". */
  deadlinesUnknown: boolean;
  banner: SavedBanner;
  pendingCount: number;
  /** The requests could not be counted: say so, rather than "none waiting". */
  pendingUnknown: boolean;
  organizations: Organization[];
  /** A decision was made here: the sidebar's counts need refreshing. */
  onPendingChanged: () => void;
  goTo: (page: StaffPage, tab?: string) => void;
  onJump: () => void;
  isPhone: boolean;
}

const age = (iso?: string | null): string => {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
};

const StaffInbox: React.FC<StaffInboxProps> = ({
  stats,
  deadlines,
  deadlinesUnknown,
  banner,
  pendingCount,
  pendingUnknown,
  organizations,
  onPendingChanged,
  goTo,
  onJump,
  isPhone,
}) => {
  const health = useContext(SystemHealthContext);
  const pending = usePendingAdminRequests(onPendingChanged);
  const safeWindow = deadlines ? nextSafeWindow(deadlines, new Date()) : null;
  // Confirmations come from the hook so they take the console's theme and keyboard focus.
  const [modal, modalHolder] = Modal.useModal();
  const buttonSize = isPhone ? 'middle' : 'small';

  // The console's own data (health with its acknowledgement, banner, due dates) decides when the list
  // is judged; the request list loads inside its row, so a second visit never shows a skeleton.
  const settled =
    !!health &&
    (health.health !== null || health.unavailable) &&
    (health.ackLoaded || health.unavailable) &&
    banner.loaded &&
    (deadlines !== null || deadlinesUnknown);

  const queue: InboxRow[] = [];
  const handled: InboxRow[] = [];

  // ── Health: one row per failing check, errors before warnings ─────────────
  if (health) {
    const failingChecks = CHECKS.map((c) => ({ ...c, check: (health.health?.[c.key] as AnyCheck | undefined) ?? null }))
      .filter((c) => c.check && c.check.status !== StatusDfeEnum.Ok)
      .sort(
        (a, b) =>
          (a.check?.status === StatusDfeEnum.Error ? -1 : 1) - (b.check?.status === StatusDfeEnum.Error ? -1 : 1),
      );
    if (health.unavailable) {
      queue.push({
        key: 'health-unavailable',
        chip: <Tag style={BAD_TAG}>Unknown</Tag>,
        what: 'The health check did not answer',
        why: health.error,
        action: (
          <Button size={buttonSize} onClick={health.checkHealth} loading={health.loading}>
            Retry
          </Button>
        ),
      });
    } else if (failingChecks.length > 0 && !health.acknowledged) {
      for (const c of failingChecks) {
        const row = c.check as AnyCheck & { detail?: string | null; label?: string; status: StatusDfeEnum };
        const steps = NEXT_STEPS[c.key](row as never);
        queue.push({
          key: `health-${c.key}`,
          chip: (
            <Tag style={row.status === StatusDfeEnum.Error ? BAD_TAG : WARN_TAG}>
              {row.status === StatusDfeEnum.Error ? 'Down' : 'Degraded'}
            </Tag>
          ),
          what: `${c.name}: ${row.detail || row.label || 'not healthy'}`,
          why: <>Next: {steps.next}</>,
          action: (
            <Button type="primary" size={buttonSize} onClick={() => goTo('Platform', 'health')}>
              Open check
            </Button>
          ),
        });
      }
    } else if (health.health) {
      handled.push({
        key: 'health-ok',
        chip: (
          <Tag style={health.acknowledged ? OFF_TAG : OK_TAG}>{health.acknowledged ? 'Acknowledged' : 'Healthy'}</Tag>
        ),
        what: health.acknowledged
          ? `${health.failing.join(', ')}: acknowledged by ${health.ackWho} ${health.ackWhen}`
          : 'Database, task queue, cache, migrations and disk all pass',
        why: health.lastUpdated ? `Checked ${health.lastUpdated.toLocaleTimeString()}` : undefined,
        action: (
          <Button type="link" size={buttonSize} onClick={() => goTo('Platform', 'health')}>
            Details
          </Button>
        ),
      });
    }
  }

  // ── Admin access requests: the first few are decided here ─────────────────
  const requests = pending.visibleUsers;
  // A decision just made here is already out of the list but not yet out of the console's count.
  const count = pending.loading ? pendingCount : Math.max(requests.length, pendingCount - pending.hiddenEmails.size);
  const decide = (kind: 'approve' | 'deny', email: string) =>
    modal.confirm({
      title: kind === 'approve' ? `Approve ${email}?` : `Deny ${email}?`,
      content:
        kind === 'approve'
          ? 'They get course admin access; a request with no organization creates one.'
          : 'The request and the account are removed. You have eight seconds to undo.',
      okText: kind === 'approve' ? 'Approve' : 'Deny',
      okButtonProps: kind === 'deny' ? { danger: true } : undefined,
      onOk: () => pending.defer(kind, [email]),
    });
  if (pendingUnknown || pending.loadError) {
    queue.push({
      key: 'requests-unknown',
      chip: <Tag style={BAD_TAG}>Unknown</Tag>,
      what: 'Admin access requests could not be checked',
      why: pending.loadError ?? 'The request list did not answer.',
      action: (
        <Button
          size={buttonSize}
          loading={pending.loading}
          onClick={() => {
            onPendingChanged();
            void pending.fetchPendingAdmins();
          }}
        >
          Retry
        </Button>
      ),
    });
  } else if (count > 0) {
    const oldest = requests.reduce<string | null>(
      (acc, u) => (!acc || (u.dateJoined && u.dateJoined < acc) ? (u.dateJoined ?? acc) : acc),
      null,
    );
    const withoutOrg = requests.filter((u) => !u.organization).length;
    queue.push({
      key: 'requests',
      chip: <Tag style={WARN_TAG}>{count} waiting</Tag>,
      what: `${count} ${count === 1 ? 'person' : 'people'} asked for course admin access`,
      why:
        [oldest ? `Oldest ${age(oldest)}` : null, withoutOrg ? `${withoutOrg} without an organization` : null]
          .filter(Boolean)
          .join(' · ') || undefined,
      action: (
        <Button type="primary" size={buttonSize} onClick={() => goTo('People', 'requests')}>
          Review
        </Button>
      ),
      extra: pending.loading ? (
        <Skeleton active title={false} paragraph={{ rows: 2, width: ['60%', '55%'] }} />
      ) : requests.length > 0 ? (
        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
          {requests.slice(0, 3).map((u) => {
            const email = u.email ?? '';
            const org = organizations.find((o) => o.id === u.organization)?.name;
            return (
              <Space key={u.id} wrap size={[8, 4]} style={{ fontSize: 13 }}>
                <Link to={personPath(u.id)}>{email}</Link>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {org ?? 'new organization'}
                  {u.dateJoined ? ` · ${age(u.dateJoined)}` : ''}
                </Text>
                <Space size={4} style={{ whiteSpace: 'nowrap' }}>
                  <Button size={buttonSize} aria-label={`Approve ${email}`} onClick={() => decide('approve', email)}>
                    Approve
                  </Button>
                  <Button
                    size={buttonSize}
                    type="link"
                    danger
                    aria-label={`Deny ${email}`}
                    onClick={() => decide('deny', email)}
                  >
                    Deny
                  </Button>
                </Space>
              </Space>
            );
          })}
          {requests.length > 3 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              and {requests.length - 3} more on the Requests tab
            </Text>
          )}
        </Space>
      ) : undefined,
    });
  } else {
    handled.push({
      key: 'requests-none',
      chip: <Tag style={OK_TAG}>None</Tag>,
      what: 'No admin access requests waiting',
      action: (
        <Button type="link" size={buttonSize} onClick={() => goTo('People', 'requests')}>
          Requests
        </Button>
      ),
    });
  }

  // ── Banner: showing is worth knowing; off is fine ──────────────────────────
  if (banner.state.key === 'live' || banner.state.key === 'scheduled') {
    queue.push({
      key: 'banner',
      chip: (
        <Tag style={banner.state.key === 'live' ? WARN_TAG : OFF_TAG}>
          {banner.state.key === 'live' ? 'Live' : 'Scheduled'}
        </Tag>
      ),
      what:
        banner.state.key === 'live'
          ? 'A maintenance banner is showing to everyone'
          : `Maintenance banner ${banner.state.label.toLowerCase()}`,
      why: banner.saved?.message,
      action: (
        <Button type="primary" size={buttonSize} onClick={() => goTo('Tools', 'banner')}>
          Open banner
        </Button>
      ),
    });
  } else {
    handled.push({
      key: 'banner-off',
      chip: <Tag style={OFF_TAG}>{banner.state.key === 'expired' ? 'Expired' : 'Off'}</Tag>,
      what: 'No maintenance banner showing',
      action: (
        <Button type="link" size={buttonSize} onClick={() => goTo('Tools', 'banner')}>
          Open banner
        </Button>
      ),
    });
  }

  // ── Deploy window ──────────────────────────────────────────────────────────
  if (deadlinesUnknown) {
    handled.push({
      key: 'deploy-unknown',
      chip: <Tag style={OFF_TAG}>Unknown</Tag>,
      what: 'Deploy window unknown: the due dates did not load',
      action: (
        <Button type="link" size={buttonSize} onClick={() => goTo('Platform', 'deploy-calendar')}>
          Calendar
        </Button>
      ),
    });
  } else if (deadlines && !safeWindow) {
    queue.push({
      key: 'deploy',
      chip: <Tag style={WARN_TAG}>No window</Tag>,
      what: 'No 3-day gap between due dates in the next 60 days',
      why: 'Deploy between the smallest due dates, or warn the courses first.',
      action: (
        <Button type="primary" size={buttonSize} onClick={() => goTo('Platform', 'deploy-calendar')}>
          Calendar
        </Button>
      ),
    });
  } else if (safeWindow) {
    handled.push({
      key: 'deploy-ok',
      chip: <Tag style={OK_TAG}>{formatWindow(safeWindow)}</Tag>,
      what: `Safe deploy window: ${safeWindow.days} days with no due dates`,
      action: (
        <Button type="link" size={buttonSize} onClick={() => goTo('Platform', 'deploy-calendar')}>
          Calendar
        </Button>
      ),
    });
  }

  const renderRow = (row: InboxRow, quiet: boolean) => (
    <div
      key={row.key}
      style={{
        display: 'grid',
        gridTemplateColumns: isPhone ? 'auto 1fr' : 'auto 1fr auto',
        gap: '6px 12px',
        alignItems: 'start',
        padding: '10px 14px',
        background: quiet ? '#fafaf8' : '#fff',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <span>{row.chip}</span>
      <div style={{ minWidth: 0 }}>
        <Text style={{ fontWeight: quiet ? 500 : 600, color: quiet ? 'rgba(0,0,0,0.65)' : undefined }}>{row.what}</Text>
        {row.why && (
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            {row.why}
          </Text>
        )}
        {row.extra && <div style={{ marginTop: 6 }}>{row.extra}</div>}
      </div>
      <span style={{ justifySelf: isPhone ? 'start' : 'end', gridColumn: isPhone ? '1 / -1' : undefined }}>
        {row.action}
      </span>
    </div>
  );

  const list = (rows: InboxRow[], quiet: boolean, label: string) => (
    <section
      aria-label={label}
      style={{ border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}
    >
      <div style={{ display: 'grid', marginTop: -1 }}>{rows.map((r) => renderRow(r, quiet))}</div>
    </section>
  );

  const peopleLink = (label: string, search: string) => (
    <Link to={`${staffPath('People')}${search}`} style={{ color: '#0d7354' }}>
      {label}
    </Link>
  );

  return (
    <div>
      {modalHolder}
      {/* The jump palette drawn on the page: the second job starts on the first screen, and on a phone. */}
      <Button
        onClick={onJump}
        icon={<SearchOutlined />}
        aria-label="Find a person, a course or a page (Ctrl+K)"
        style={{
          width: '100%',
          maxWidth: 560,
          justifyContent: 'flex-start',
          color: 'rgba(0,0,0,0.45)',
          marginBottom: 16,
        }}
      >
        Find a person, a course or a page…
        {!isPhone && (
          <kbd
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: 4,
              padding: '0 5px',
            }}
          >
            Ctrl K
          </kbd>
        )}
      </Button>

      {!settled ? (
        <div style={{ border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <Skeleton active title={false} paragraph={{ rows: 4 }} />
        </div>
      ) : queue.length > 0 ? (
        list(queue, false, 'Waiting for you')
      ) : (
        <section
          aria-label="Waiting for you"
          style={{
            border: '1px solid #9ce6c3',
            background: '#f0fff6',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 16,
          }}
        >
          <Text strong style={{ color: '#0d7354' }}>
            Nothing needs attention.
          </Text>{' '}
          <Text type="secondary">
            Checked {health?.lastUpdated ? health.lastUpdated.toLocaleTimeString() : 'just now'}
            {safeWindow ? ` · safe deploy window ${formatWindow(safeWindow)}, ${safeWindow.days} days.` : '.'}
          </Text>
        </section>
      )}

      {settled && handled.length > 0 && list(handled, true, 'Handled and healthy')}

      {/* The platform at a glance: one line of linked nouns, not tiles. */}
      <Text type="secondary" style={{ fontSize: 13 }}>
        {peopleLink(`${stats.totalUniqueUsers.toLocaleString()} users`, '')} ·{' '}
        {peopleLink(`${stats.totalStudents.toLocaleString()} students`, '?role=student')} ·{' '}
        {peopleLink(`${stats.totalGraders.toLocaleString()} graders`, '?role=grader')} ·{' '}
        {peopleLink(`${stats.totalCourseAdmins} course admins`, '?role=course_admin')} ·{' '}
        <Link to={staffPath('Courses')} style={{ color: '#0d7354' }}>
          {stats.activeCourses} active courses
        </Link>{' '}
        in{' '}
        <Link to={staffPath('Courses', 'organizations')} style={{ color: '#0d7354' }}>
          {stats.totalOrganizations} organizations
        </Link>{' '}
        · {peopleLink(`${stats.totalInactiveUsers.toLocaleString()} idle 90+ days`, '?inactive=1')}
        <span className="sr-only">. Idle means {DEFINITIONS.inactiveUsers}</span>
      </Text>
    </div>
  );
};

export default StaffInbox;
