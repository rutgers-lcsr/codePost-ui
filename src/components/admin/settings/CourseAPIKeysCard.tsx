// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  message,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { CopyOutlined, DeleteOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { Course } from '../../../services/course';
import type { CourseAPIKey, CourseAPIKeyCreateResponse } from '../../../services/course';
import { assignmentKeys } from '../../../lib/queryKeys';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;

interface ICourseAPIKeysCardProps {
  courseId: number;
}

const CourseAPIKeysCard: React.FC<ICourseAPIKeysCardProps> = ({ courseId }) => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [createdKey, setCreatedKey] = React.useState<CourseAPIKeyCreateResponse | null>(null);

  const queryKey = assignmentKeys.apiKeys(courseId);

  const { data: keys = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => Course.listAPIKeys(courseId),
  });

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      message.warning('Please enter a name for the key.');
      return;
    }
    setIsCreating(true);
    try {
      const result = await Course.createAPIKey(courseId, newKeyName.trim());
      setCreatedKey(result);
      setNewKeyName('');
      message.success('API key created.');
      queryClient.invalidateQueries({ queryKey });
    } catch (err: unknown) {
      const errObj = err as { body?: { error?: string } };
      message.error(errObj?.body?.error ?? 'Failed to create API key.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (keyId: number) => {
    try {
      await Course.deleteAPIKey(courseId, keyId);
      message.success('API key revoked.');
      queryClient.invalidateQueries({ queryKey });
    } catch {
      message.error('Failed to revoke API key.');
    }
  };

  const handleToggleActive = async (key: CourseAPIKey) => {
    try {
      await Course.updateAPIKey(courseId, key.id, { isActive: !key.isActive });
      message.success(key.isActive ? 'API key deactivated.' : 'API key reactivated.');
      queryClient.invalidateQueries({ queryKey });
    } catch {
      message.error('Failed to update API key.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard.');
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: CourseAPIKey) => (
        <Space>
          <KeyOutlined style={{ color: record.isActive ? '#198665' : '#bfbfbf' }} />
          <Text strong={record.isActive} type={record.isActive ? undefined : 'secondary'}>
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      width: 90,
      render: (isActive: boolean) =>
        isActive ? (
          <Badge status="success" text={<Text style={{ fontSize: 13 }}>Active</Text>} />
        ) : (
          <Badge
            status="default"
            text={
              <Text type="secondary" style={{ fontSize: 13 }}>
                Inactive
              </Text>
            }
          />
        ),
    },
    {
      title: 'Prefix',
      dataIndex: 'keyPrefix',
      key: 'keyPrefix',
      width: 110,
      render: (prefix: string) => (
        <Text code style={{ fontSize: 12 }}>
          {prefix}...
        </Text>
      ),
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 110,
      render: (v: string | null) =>
        v ? (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {dayjs(v).fromNow()}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 13 }}>
            Never
          </Text>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'created',
      key: 'created',
      width: 110,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {dayjs(v).format('MMM D, YYYY')}
        </Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: CourseAPIKey) => (
        <Space.Compact size="small">
          <Button size="small" onClick={() => handleToggleActive(record)}>
            {record.isActive ? 'Disable' : 'Enable'}
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Permanently revoke this key?',
                content: 'Any integrations using this key will stop working.',
                okText: 'Revoke',
                okButtonProps: { danger: true },
                onOk: () => handleDelete(record.id),
              });
            }}
          />
        </Space.Compact>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <Flex align="center" gap={8}>
            <KeyOutlined style={{ fontSize: 18, color: '#198665' }} />
            <Typography.Title level={2} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              Course API Keys
            </Typography.Title>
            <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
              {keys.length}
            </Tag>
          </Flex>
        }
        extra={
          <CPButton cpType="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            Create Key
          </CPButton>
        }
        style={{ marginBottom: 24, borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.06)' }}
        styles={{ header: { borderBottom: '1px solid rgba(0, 0, 0, 0.05)' } }}
      >
        <Paragraph type="secondary" style={{ marginBottom: 16, fontSize: 13 }}>
          API keys allow external tools (scripts, Jupyter integrations, etc.) to access this course&#39;s data. Each key
          is scoped to this course only &mdash; it cannot access other courses. When used to impersonate a student, the
          resulting token is also restricted to this course.
        </Paragraph>
        <Paragraph type="secondary" style={{ marginBottom: 16, fontSize: 13 }}>
          Usage example: to use the API key with a Jupyter integration, set the{' '}
          <Text code>Authorization: CourseKey {'<token>'}</Text> header to{' '}
        </Paragraph>

        {isLoading ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : keys.length === 0 ? (
          <Empty description="No API keys yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            dataSource={keys}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            style={{ borderRadius: 6, overflow: 'hidden' }}
          />
        )}
      </Card>

      {/* Create Key Modal */}
      <Modal
        title="Create Course API Key"
        open={isCreateModalOpen && !createdKey}
        onCancel={() => {
          setIsCreateModalOpen(false);
          setNewKeyName('');
        }}
        onOk={handleCreate}
        okText="Create"
        confirmLoading={isCreating}
        okButtonProps={{ disabled: !newKeyName.trim() }}
      >
        <Flex vertical gap={12} style={{ marginTop: 16 }}>
          <Text>Give this key a descriptive name so you can identify it later.</Text>
          <Input
            placeholder="e.g., Jupyter Integration, Grading Script"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onPressEnter={handleCreate}
            maxLength={128}
            count={{ show: true }}
          />
        </Flex>
      </Modal>

      {/* Show Created Key Modal (one-time display) */}
      <Modal
        title="API Key Created"
        open={!!createdKey}
        onCancel={() => {
          setCreatedKey(null);
          setIsCreateModalOpen(false);
        }}
        footer={[
          <CPButton
            key="copy"
            cpType="primary"
            icon={<CopyOutlined />}
            onClick={() => createdKey && copyToClipboard(`CourseKey ${createdKey.key}`)}
          >
            Copy Full Token
          </CPButton>,
          <CPButton
            key="copy-raw"
            cpType="secondary"
            icon={<CopyOutlined />}
            onClick={() => createdKey && copyToClipboard(createdKey.key)}
          >
            Copy Key Only
          </CPButton>,
          <CPButton
            key="done"
            cpType="secondary"
            onClick={() => {
              setCreatedKey(null);
              setIsCreateModalOpen(false);
            }}
          >
            Done
          </CPButton>,
        ]}
      >
        <Flex vertical gap={16} style={{ marginTop: 16 }}>
          <Alert
            type="warning"
            showIcon
            title="Save this key now — you won't be able to see it again."
            style={{ borderRadius: 6 }}
          />
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Key Name
            </Text>
            <Text strong>{createdKey?.name}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              API Key
            </Text>
            <Input.TextArea
              readOnly
              value={createdKey?.key}
              autoSize={{ minRows: 2 }}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Use this key in the <Text code>Authorization</Text> header:
            </Text>
            <Flex gap={4} align="start" style={{ marginTop: 4 }}>
              <Input.TextArea
                readOnly
                value={`CourseKey ${createdKey?.key ?? '<key>'}`}
                autoSize={{ minRows: 1 }}
                style={{ fontFamily: 'monospace', fontSize: 12, background: '#f6f6f6', flex: 1 }}
              />
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => createdKey && copyToClipboard(`CourseKey ${createdKey.key}`)}
              />
            </Flex>
          </div>
        </Flex>
      </Modal>
    </>
  );
};

export default CourseAPIKeysCard;
