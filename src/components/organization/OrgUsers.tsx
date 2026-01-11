import * as React from 'react';
import { Table, Card, Tag, Button, Space, message, Popconfirm, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { UserType } from '../../infrastructure/user';
import { Organization } from '../../infrastructure/organization';
import { ColumnsType } from 'antd/es/table';

interface IProps {
  orgId: number;
  users: UserType[];
  loading: boolean;
  onRefresh: () => void;
  ssoEnabled: boolean;
}

const OrgUsers: React.FC<IProps> = ({ orgId, users, loading, onRefresh, ssoEnabled }) => {
  const [searchText, setSearchText] = React.useState(''); // Add search state
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);

  const handleVerify = async (email: string, action: 'approve' | 'decline') => {
    setActionLoading(1); // Block interaction globally or per row implementation could be better
    try {
      await Organization.verifyUser(orgId, email, action);
      message.success(`User ${action}d successfully`);
      onRefresh();
    } catch (error) {
      // Error handled in infrastructure
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (email: string) => {
    setActionLoading(1);
    try {
      await Organization.promoteStaff(orgId, email);
      message.success('User promoted to Org Staff');
      onRefresh();
    } catch (error) {
      // Error handled in infrastructure
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemote = async (email: string) => {
    setActionLoading(1);
    try {
      await Organization.demoteStaff(orgId, email);
      message.success('User demoted from Org Staff');
      onRefresh();
    } catch (error) {
      // Error handled in infrastructure
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (email: string) => {
    setActionLoading(1);
    try {
      await Organization.removeUser(orgId, email);
      message.success('User removed from organization');
      onRefresh();
    } catch (error) {
      // Error handled in infrastructure
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (email: string) => {
    setActionLoading(1);
    try {
      await Organization.resetUserPassword(orgId, email);
      message.success('Password reset email sent');
    } catch (error) {
      // Error handled in infrastructure
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((user) => user.email.toLowerCase().includes(searchText.toLowerCase()));

  const columns: ColumnsType<UserType> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
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
      render: (_, record: any) => {
        return record.pendingValidation ? <Tag color="orange">Pending</Tag> : <Tag color="green">Active</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 350,
      render: (_, record: any) => (
        <Space wrap>
          {record.pendingValidation && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleVerify(record.email, 'approve')}
                loading={actionLoading !== null}
              >
                Approve
              </Button>
              <Popconfirm title="Are you sure?" onConfirm={() => handleVerify(record.email, 'decline')}>
                <Button danger size="small" loading={actionLoading !== null}>
                  Decline
                </Button>
              </Popconfirm>
            </>
          )}
          {!record.isOrgStaff && !record.pendingValidation && (
            <Popconfirm title="Promote to Org Staff?" onConfirm={() => handlePromote(record.email)}>
              <Button size="small">Promote</Button>
            </Popconfirm>
          )}
          {record.isOrgStaff && !record.pendingValidation && !record.codePostAdmin && (
            <Popconfirm title="Demote from Org Staff?" onConfirm={() => handleDemote(record.email)}>
              <Button danger size="small">
                Demote
              </Button>
            </Popconfirm>
          )}
          {!record.codePostAdmin && !record.pendingValidation && (
            <>
              {!ssoEnabled && (
                <Popconfirm title="Send password reset email?" onConfirm={() => handleResetPassword(record.email)}>
                  <Button size="small">Reset Password</Button>
                </Popconfirm>
              )}
              <Popconfirm title="Remove user from organization?" onConfirm={() => handleRemove(record.email)}>
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
      bordered={false}
      extra={
        <Space>
          <Input
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Button onClick={onRefresh}>Refresh</Button>
        </Space>
      }
    >
      <Table dataSource={filteredUsers} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    </Card>
  );
};

export default OrgUsers;
