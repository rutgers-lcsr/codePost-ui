// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { Table, Card, Tag, Button, Space, Popconfirm, Alert, Empty, Skeleton, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import type { Organization, PendingAdminUser } from '../../api-client';
import { PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import useDefaultPageSize from '../utils/useDefaultPageSize';
import AdminPageHeader from './AdminPageHeader';
import useWindowSize from '../core/useWindowSize';
import { usePendingAdminRequests, type Decision } from './pendingAdminRequests';

const { Text } = Typography;

/** How long a decision stays undoable before it is sent; the row leaves the list straight away. */

interface PendingAdminsTableProps {
  organizations: Organization[];
  /** Called after an approve or deny succeeds, so the sidebar badge can update. */
  onChanged?: () => void;
  /** Rendered inside the Users page's tabs, which carry the page title. */
  hideHeader?: boolean;
}

const PendingAdminsTable: React.FC<PendingAdminsTableProps> = ({ organizations, onChanged, hideHeader = false }) => {
  const [selectedKeys, setSelectedKeys] = React.useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useDefaultPageSize();
  // A phone has room for the email and two icon buttons; bulk selection is a desktop affordance.
  const isPhone = useWindowSize().width < 768;
  const { pendingUsers, hiddenEmails, loading, loadError, fetchPendingAdmins, defer } =
    usePendingAdminRequests(onChanged);

  const act = (kind: Decision, email: string) => defer(kind, [email]);

  // One confirmation for the whole selection; the endpoint takes one email at a time.
  const actMany = (kind: Decision) => {
    defer(
      kind,
      pendingUsers
        .filter((u) => selectedKeys.includes(u.id))
        .map((u) => u.email ?? '')
        .filter(Boolean),
    );
    setSelectedKeys([]);
  };

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
      {hideHeader ? (
        // Inside the Users page's Requests tab the page carries the title; keep only Refresh.
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchPendingAdmins} loading={loading}>
            Refresh
          </Button>
        </div>
      ) : (
        <AdminPageHeader
          title="Admin Requests"
          subtitle="People who asked for course admin access. Approving a request with no organization also creates one."
          actions={
            <Button icon={<ReloadOutlined />} onClick={fetchPendingAdmins} loading={loading}>
              Refresh
            </Button>
          }
        />
      )}

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
