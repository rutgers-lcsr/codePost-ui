// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Table, Card, Tag, Button, Space, message, Popconfirm, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { User } from '../../api-client';
import { getAuthToken } from '../../utils/auth';
import { PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import useDefaultPageSize from '../utils/useDefaultPageSize';
import { ColumnsType } from 'antd/es/table';

// Extend User to include pendingValidation which comes from the API but isn't in the generated model
interface OrgUser extends User {
  pendingValidation?: boolean;
}

interface IProps {
  orgId: number;
  users: OrgUser[];
  loading: boolean;
  onRefresh: () => void;
  ssoEnabled: boolean;
}

const OrgUsers: React.FC<IProps> = ({ orgId, users, loading, onRefresh, ssoEnabled }) => {
  const [searchText, setSearchText] = React.useState(''); // Add search state
  const [pageSize, setPageSize] = useDefaultPageSize();
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);

  const performAction = async (endpoint: string, body: Record<string, string>, successMessage: string) => {
    setActionLoading(1);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${orgId}/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        message.success(successMessage);
        onRefresh();
      } else {
        message.error('Action failed');
      }
    } catch (error) {
      console.error(error);
      message.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (email: string, action: 'approve' | 'decline') => {
    await performAction('verify_user', { user_email: email, action }, `User ${action}d successfully`);
  };

  const handlePromote = async (email: string) => {
    await performAction('promote_staff', { user_email: email }, 'User promoted to Org Staff');
  };

  const handleDemote = async (email: string) => {
    await performAction('demote_staff', { user_email: email }, 'User demoted from Org Staff');
  };

  const handleRemove = async (email: string) => {
    await performAction('remove_user', { user_email: email }, 'User removed from organization');
  };

  const handleResetPassword = async (email: string) => {
    setActionLoading(1);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${orgId}/reset_user_password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ user_email: email }),
      });
      if (res.ok) {
        message.success('Password reset email sent');
      } else {
        message.error('Failed to send password reset email');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((user) => (user.email || '').toLowerCase().includes(searchText.toLowerCase()));

  const columns: ColumnsType<OrgUser> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_, record) => (
        <>
          {record.isOrgStaff && <Tag color="gold">Org Staff</Tag>}
          {record.codePostAdmin && <Tag color="red">Superuser</Tag>}
          {/* Basic role inference based on courses could go here */}
        </>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        return record.pendingValidation ? <Tag color="orange">Pending</Tag> : <Tag color="green">Active</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 350,
      render: (_, record) => (
        <Space wrap>
          {record.pendingValidation && record.email && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleVerify(record.email!, 'approve')}
                loading={actionLoading !== null}
              >
                Approve
              </Button>
              <Popconfirm title="Are you sure?" onConfirm={() => handleVerify(record.email!, 'decline')}>
                <Button danger size="small" loading={actionLoading !== null}>
                  Decline
                </Button>
              </Popconfirm>
            </>
          )}
          {!record.isOrgStaff && !record.pendingValidation && record.email && (
            <Popconfirm title="Promote to Org Staff?" onConfirm={() => handlePromote(record.email!)}>
              <Button size="small">Promote</Button>
            </Popconfirm>
          )}
          {record.isOrgStaff && !record.pendingValidation && !record.codePostAdmin && record.email && (
            <Popconfirm title="Demote from Org Staff?" onConfirm={() => handleDemote(record.email!)}>
              <Button danger size="small">
                Demote
              </Button>
            </Popconfirm>
          )}
          {!record.codePostAdmin && !record.pendingValidation && record.email && (
            <>
              {!ssoEnabled && (
                <Popconfirm title="Send password reset email?" onConfirm={() => handleResetPassword(record.email!)}>
                  <Button size="small">Reset Password</Button>
                </Popconfirm>
              )}
              <Popconfirm title="Remove user from organization?" onConfirm={() => handleRemove(record.email!)}>
                <Button danger size="small">
                  Remove
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Users"
      variant="borderless"
      extra={
        <Space>
          <Input
            placeholder="Search users..."
            aria-label="Search users"
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Button onClick={onRefresh}>Refresh</Button>
        </Space>
      }
    >
      <Table
        dataSource={filteredUsers}
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
    </Card>
  );
};

export default OrgUsers;
