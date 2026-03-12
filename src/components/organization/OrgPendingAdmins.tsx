// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Table, Card, Tag, Button, Space, message, Popconfirm, Alert, Typography, Empty } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { User } from '../../api-client';
import { getAuthToken } from '../../utils/auth';
import { PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import useDefaultPageSize from '../utils/useDefaultPageSize';
import { ColumnsType } from 'antd/es/table';

interface PendingUser extends User {
  pendingValidation?: boolean;
  dateJoined?: string;
}

interface IProps {
  orgId: number;
}

const OrgPendingAdmins: React.FC<IProps> = ({ orgId }) => {
  const [pendingUsers, setPendingUsers] = React.useState<PendingUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [pageSize, setPageSize] = useDefaultPageSize();

  const fetchPendingAdmins = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${orgId}/pending_admins/`, {
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
  }, [orgId]);

  React.useEffect(() => {
    fetchPendingAdmins();
  }, [fetchPendingAdmins]);

  const handleApprove = async (email: string) => {
    setActionLoading(email);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${orgId}/approve_admin/`, {
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
        message.error('Failed to approve user');
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${orgId}/deny_admin/`, {
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
        message.error('Failed to deny user');
      }
    } catch (error) {
      console.error(error);
      message.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnsType<PendingUser> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
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
            onClick={() => record.email && handleApprove(record.email)}
            loading={actionLoading === record.email}
            disabled={!record.email}
          >
            Approve
          </Button>
          <Popconfirm
            title="Deny this admin request?"
            description="This user will not be able to create courses."
            onConfirm={() => record.email && handleDeny(record.email)}
          >
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              loading={actionLoading === record.email}
              disabled={!record.email}
            >
              Deny
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Pending Course Admin Requests
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Users who have requested to become course admins in your organization. Approve to grant them the ability to
        create and manage courses.
      </Typography.Paragraph>

      {pendingUsers.length > 0 && (
        <Alert
          message={`You have ${pendingUsers.length} pending request${pendingUsers.length !== 1 ? 's' : ''}`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title="Pending Requests"
        bordered={false}
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

export default OrgPendingAdmins;
