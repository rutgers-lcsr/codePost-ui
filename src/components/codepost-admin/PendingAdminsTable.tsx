// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { Table, Card, Tag, Button, Space, message, Popconfirm, Alert, Empty } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAuthToken } from '../../utils/auth';
import { PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import useDefaultPageSize from '../utils/useDefaultPageSize';
import AdminPageHeader from './AdminPageHeader';
import { ColumnsType } from 'antd/es/table';

interface PendingAdminUser {
  id: number;
  email: string;
  dateJoined?: string;
  organization?: number;
  organizationName?: string;
  pendingValidation?: boolean;
}

const PendingAdminsTable: React.FC = () => {
  const [pendingUsers, setPendingUsers] = React.useState<PendingAdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [pageSize, setPageSize] = useDefaultPageSize();

  const fetchPendingAdmins = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/dashboard/pending_admins/`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data);
      } else {
        message.error('Failed to load pending admins');
      }
    } catch (error) {
      console.error(error);
      message.error('An error occurred while loading pending admins');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPendingAdmins();
  }, [fetchPendingAdmins]);

  const handleApprove = async (email: string) => {
    setActionLoading(email);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/dashboard/approve_pending_admin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ user_email: email }),
      });

      if (res.ok) {
        message.success(`${email} has been approved as a course admin`);
        fetchPendingAdmins();
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to approve user');
      }
    } catch (error) {
      console.error(error);
      message.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (email: string) => {
    setActionLoading(email);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/dashboard/deny_pending_admin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ user_email: email }),
      });

      if (res.ok) {
        message.success(`${email} has been denied`);
        fetchPendingAdmins();
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to deny user');
      }
    } catch (error) {
      console.error(error);
      message.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnsType<PendingAdminUser> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
    },
    {
      title: 'Organization',
      dataIndex: 'organizationName',
      key: 'organizationName',
      render: (name: string) => name || <Tag color="blue">New Org</Tag>,
      sorter: (a, b) => (a.organizationName || '').localeCompare(b.organizationName || ''),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: () => <Tag color="orange">Pending</Tag>,
    },
    {
      title: 'Requested',
      key: 'dateJoined',
      dataIndex: 'dateJoined',
      width: 200,
      render: (date: string) => (date ? new Date(date).toLocaleDateString() : '-'),
      sorter: (a, b) => {
        const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
        const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record.email)}
            loading={actionLoading === record.email}
          >
            Approve
          </Button>
          <Popconfirm
            title="Deny this admin request?"
            description="The user will not be granted course admin privileges."
            onConfirm={() => handleDeny(record.email)}
          >
            <Button danger size="small" icon={<CloseOutlined />} loading={actionLoading === record.email}>
              Deny
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <AdminPageHeader
        title="Pending Admin Requests"
        subtitle="Users requesting course admin privileges across all organizations. New organization requests require codePost staff approval."
      />

      {pendingUsers.length > 0 && (
        <Alert
          message={`${pendingUsers.length} pending request${pendingUsers.length !== 1 ? 's' : ''} awaiting review`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        variant="borderless"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchPendingAdmins} loading={loading}>
            Refresh
          </Button>
        }
      >
        {pendingUsers.length === 0 && !loading ? (
          <Empty description="No pending admin requests" />
        ) : (
          <Table
            dataSource={pendingUsers}
            columns={columns}
            rowKey="id"
            loading={loading}
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
