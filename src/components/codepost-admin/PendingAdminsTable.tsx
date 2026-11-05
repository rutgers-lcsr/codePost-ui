// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { Table, Card, Tag, Button, Space, message, Popconfirm, Alert, Empty, Skeleton, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import type { Organization, PendingAdminUser } from '../../api-client';
import { dashboardApi } from '../../api-client/clients';
import { apiErrorMessageAsync, responseErrorMessage } from '../../lib/apiError';
import { getAuthToken } from '../../utils/auth';
import { PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import useDefaultPageSize from '../utils/useDefaultPageSize';
import AdminPageHeader from './AdminPageHeader';
import useWindowSize from '../core/useWindowSize';

const { Text } = Typography;

type Decision = 'approve' | 'deny';

/** How long a decision stays undoable before it is sent; the row leaves the list straight away. */
const UNDO_WINDOW_MS = 8000;

interface DeferredDecision {
  kind: Decision;
  emails: string[];
  timer: number;
}

interface PendingAdminsTableProps {
  organizations: Organization[];
  /** Called after an approve or deny succeeds, so the sidebar badge can update. */
  onChanged?: () => void;
}

const PendingAdminsTable: React.FC<PendingAdminsTableProps> = ({ organizations, onChanged }) => {
  const [pendingUsers, setPendingUsers] = React.useState<PendingAdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = React.useState<React.Key[]>([]);
  // Decisions wait UNDO_WINDOW_MS before they are sent (deny deletes the account, so the server
  // offers no way back); their rows leave the table at once and come back on Undo.
  const deferredRef = React.useRef<Map<string, DeferredDecision>>(new Map());
  const [hiddenEmails, setHiddenEmails] = React.useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useDefaultPageSize();
  // A phone has room for the email and two icon buttons; bulk selection is a desktop affordance.
  const isPhone = useWindowSize().width < 768;

  const fetchPendingAdmins = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // The client is generated without runtime mapping, so the wire key stays snake_case.
      const rows = (await dashboardApi.pendingAdminsList()) as Array<PendingAdminUser & { date_joined?: string }>;
      setPendingUsers(
        rows.map(({ date_joined, ...user }) => ({ ...user, dateJoined: date_joined ?? user.dateJoined ?? '' })),
      );
    } catch (error) {
      setLoadError((await apiErrorMessageAsync(error)) ?? 'Pending requests could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPendingAdmins();
  }, [fetchPendingAdmins]);

  // Plain fetch on purpose: the endpoint reads `user_email` (as schema.yaml documents) but the
  // generated client's PendingAdminActionRequest model names the field `userEmail`.
  const postAction = async (kind: Decision, email: string, keepalive = false) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/dashboard/${kind}_pending_admin/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
      body: JSON.stringify({ user_email: email }),
      keepalive,
    });
    if (!res.ok) throw new Error(await responseErrorMessage(res));
  };

  const syncHidden = () => {
    const emails = new Set<string>();
    deferredRef.current.forEach((d) => d.emails.forEach((e) => emails.add(e)));
    setHiddenEmails(emails);
  };

  const commit = async (key: string) => {
    const deferred = deferredRef.current.get(key);
    if (!deferred) return;
    deferredRef.current.delete(key);
    const failed: string[] = [];
    for (const email of deferred.emails) {
      try {
        await postAction(deferred.kind, email);
      } catch {
        failed.push(email);
      }
    }
    if (failed.length > 0) message.error(`Could not ${deferred.kind}: ${failed.join(', ')}`);
    await fetchPendingAdmins();
    syncHidden();
    onChanged?.();
  };

  const undo = (key: string) => {
    const deferred = deferredRef.current.get(key);
    if (!deferred) return;
    window.clearTimeout(deferred.timer);
    deferredRef.current.delete(key);
    syncHidden();
    message.open({ key, type: 'info', content: 'Undone. The request is back in the list.', duration: 2 });
  };

  const defer = (kind: Decision, emails: string[]) => {
    if (emails.length === 0) return;
    const key = `${kind}:${Date.now()}`;
    const timer = window.setTimeout(() => commit(key), UNDO_WINDOW_MS);
    deferredRef.current.set(key, { kind, emails, timer });
    syncHidden();
    setSelectedKeys([]);
    const what =
      emails.length === 1
        ? kind === 'approve'
          ? `${emails[0]} approved.`
          : `Request from ${emails[0]} denied.`
        : `${emails.length} requests ${kind === 'approve' ? 'approved' : 'denied'}.`;
    message.open({
      key,
      type: 'success',
      duration: UNDO_WINDOW_MS / 1000,
      content: (
        <span>
          {what}{' '}
          <Button type="link" size="small" onClick={() => undo(key)} style={{ padding: '0 4px' }}>
            Undo
          </Button>
        </span>
      ),
    });
  };

  // Leaving the page (tab close, or navigating within the console) sends what is still waiting,
  // so a decision never silently evaporates with its Undo window.
  React.useEffect(() => {
    const flush = () => {
      deferredRef.current.forEach((d) => {
        window.clearTimeout(d.timer);
        d.emails.forEach((email) => postAction(d.kind, email, true).catch(() => {}));
      });
      deferredRef.current.clear();
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
    // postAction only reads module-level config; it is stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = (kind: Decision, email: string) => defer(kind, [email]);

  // One confirmation for the whole selection; the endpoint takes one email at a time.
  const actMany = (kind: Decision) =>
    defer(
      kind,
      pendingUsers
        .filter((u) => selectedKeys.includes(u.id))
        .map((u) => u.email ?? '')
        .filter(Boolean),
    );

  const orgName = (id: number | null | undefined) => organizations.find((o) => o.id === id)?.name;
  const hasRequestDates = pendingUsers.some((u) => u.dateJoined);

  const columns: ColumnsType<PendingAdminUser> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
    },
    {
      title: 'Organization',
      key: 'organization',
      responsive: ['sm'],
      render: (_, record) =>
        orgName(record.organization) ?? (
          <Tag color="blue" title="Approving creates a new organization for this user">
            New organization
          </Tag>
        ),
      sorter: (a, b) => (orgName(a.organization) || '').localeCompare(orgName(b.organization) || ''),
    },
    ...(hasRequestDates
      ? [
          {
            title: 'Requested',
            key: 'dateJoined',
            dataIndex: 'dateJoined',
            width: 160,
            responsive: ['md' as const],
            render: (date: string | null | undefined) => (date ? new Date(date).toLocaleDateString() : '—'),
            sorter: (a: PendingAdminUser, b: PendingAdminUser) => {
              const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
              const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
              return dateA - dateB;
            },
          },
        ]
      : []),
    {
      title: 'Actions',
      key: 'actions',
      width: isPhone ? 96 : 230,
      // Pinned, so Approve and Deny stay in reach on a phone instead of past the fold.
      fixed: 'right',
      render: (_, record) => {
        const email = record.email ?? '';
        const org = orgName(record.organization);
        // With rows ticked, the selection is the decision in progress: single-row buttons step back.
        const rowDisabled = selectedKeys.length > 0;
        return (
          <Space title={rowDisabled ? 'Clear the selection to decide one request on its own' : undefined}>
            <Popconfirm
              placement="topRight"
              title={`Approve ${email} as a course admin?`}
              description={
                org
                  ? `They will be able to create and manage courses in ${org}.`
                  : 'A new organization will be created for them, and they will be able to create and manage courses in it.'
              }
              okText="Approve"
              onConfirm={() => act('approve', email)}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                aria-label={`Approve ${email}`}
                disabled={rowDisabled}
              >
                {isPhone ? null : 'Approve'}
              </Button>
            </Popconfirm>
            <Popconfirm
              placement="topRight"
              title={`Deny the request from ${email}?`}
              description="They will not be granted course admin privileges."
              okText="Deny"
              okButtonProps={{ danger: true }}
              onConfirm={() => act('deny', email)}
            >
              <Button danger size="small" icon={<CloseOutlined />} aria-label={`Deny ${email}`} disabled={rowDisabled}>
                {isPhone ? null : 'Deny'}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Admin Requests"
        subtitle="People who asked for course admin access. Approving a request with no organization also creates one."
        actions={
          <Button icon={<ReloadOutlined />} onClick={fetchPendingAdmins} loading={loading}>
            Refresh
          </Button>
        }
      />

      {loadError && (
        <Alert
          type="error"
          showIcon
          title="Pending requests could not be loaded"
          description={loadError}
          action={
            <Button size="small" onClick={fetchPendingAdmins}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Card variant="borderless">
        {/* Always rendered, so selecting a row does not push the table down. */}
        {isPhone ? null : selectedKeys.length === 0 ? (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, lineHeight: '24px' }}>
            Select rows to approve or deny several requests with one confirmation.
          </Text>
        ) : (
          <Space wrap style={{ marginBottom: 12 }}>
            <Text>{selectedKeys.length} selected</Text>
            <Popconfirm
              title={`Approve ${selectedKeys.length} request${selectedKeys.length === 1 ? '' : 's'}?`}
              description="Each person becomes a course admin in their organization; a new organization is created where none exists."
              okText={`Approve ${selectedKeys.length}`}
              onConfirm={() => actMany('approve')}
            >
              <Button type="primary" size="small" icon={<CheckOutlined />}>
                Approve selected
              </Button>
            </Popconfirm>
            <Popconfirm
              title={`Deny ${selectedKeys.length} request${selectedKeys.length === 1 ? '' : 's'}?`}
              description="They will not be granted course admin privileges."
              okText={`Deny ${selectedKeys.length}`}
              okButtonProps={{ danger: true }}
              onConfirm={() => actMany('deny')}
            >
              <Button danger size="small" icon={<CloseOutlined />}>
                Deny selected
              </Button>
            </Popconfirm>
            <Button type="text" size="small" onClick={() => setSelectedKeys([])}>
              Clear
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Row buttons are paused while rows are selected.
            </Text>
          </Space>
        )}
        {pendingUsers.filter((u) => !hiddenEmails.has(u.email ?? '')).length === 0 && !loading && !loadError ? (
          <Empty description="No pending admin requests" />
        ) : (
          <Table
            dataSource={pendingUsers.filter((u) => !hiddenEmails.has(u.email ?? ''))}
            columns={columns}
            rowKey="id"
            loading={loading}
            locale={loading ? { emptyText: <Skeleton active title={false} paragraph={{ rows: 4 }} /> } : undefined}
            rowSelection={isPhone ? undefined : { selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
            scroll={{ x: 'max-content' }}
            pagination={{
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              onShowSizeChange: (_current, size) => setPageSize(size),
              onChange: (_page, size) => setPageSize(size),
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default PendingAdminsTable;
