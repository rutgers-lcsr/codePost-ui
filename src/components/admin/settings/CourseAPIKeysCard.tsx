// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Empty,
  Flex,
  Input,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { CopyOutlined, DeleteOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { Course } from '../../../services/course';
import type { CourseAPIKey, CourseAPIKeyCreateResponse, CourseAPIKeyScope } from '../../../services/course';
import { apiErrorMessage } from '../../../lib/apiError';
import { assignmentKeys } from '../../../lib/queryKeys';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface ICourseAPIKeysCardProps {
  courseId: number;
}

const CourseAPIKeysCard: React.FC<ICourseAPIKeysCardProps> = ({ courseId }) => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState('');
  const [newKeyScope, setNewKeyScope] = React.useState<CourseAPIKeyScope>('read');
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
      const result = await Course.createAPIKey(courseId, newKeyName.trim(), newKeyScope);
      setCreatedKey(result);
      setNewKeyName('');
      setNewKeyScope('read');
      message.success('API key created.');
      queryClient.invalidateQueries({ queryKey });
    } catch (err: unknown) {
      message.error(apiErrorMessage(err, 'name', 'scope') ?? 'Failed to create API key.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (keyId: number) => {
    try {
      await Course.deleteAPIKey(courseId, keyId);
      message.success('API key revoked.');
      queryClient.invalidateQueries({ queryKey });
    } catch (err: unknown) {
      message.error(apiErrorMessage(err) ?? 'Failed to revoke API key.');
    }
  };

  const handleToggleActive = async (key: CourseAPIKey) => {
    try {
      await Course.updateAPIKey(courseId, key.id, { isActive: !key.isActive });
      message.success(key.isActive ? 'API key deactivated.' : 'API key reactivated.');
      queryClient.invalidateQueries({ queryKey });
    } catch (err: unknown) {
      message.error(apiErrorMessage(err) ?? 'Failed to update API key.');
    }
  };

  const handleChangeScope = async (key: CourseAPIKey, scope: CourseAPIKeyScope) => {
    try {
      await Course.updateAPIKey(courseId, key.id, { scope });
      message.success(`API key scope changed to ${scope}.`);
      queryClient.invalidateQueries({ queryKey });
    } catch (err: unknown) {
      message.error(apiErrorMessage(err, 'scope') ?? 'Failed to change API key scope.');
    }
  };

  const confirmChangeScope = (key: CourseAPIKey, scope: CourseAPIKeyScope) => {
    if (scope !== 'admin') {
      handleChangeScope(key, scope);
      return;
    }
    Modal.confirm({
      title: 'Give this key full admin access?',
      content:
        'It will be able to delete course content, reset quiz attempts, email students, and sign in to codePost as ' +
        'any member of this course, instructors included.',
      okText: 'Make admin',
      okButtonProps: { danger: true },
      onOk: () => handleChangeScope(key, scope),
    });
  };

  const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const mcpSnippet = `claude mcp add --transport http codepost ${apiBase}/mcp --header "Authorization: CourseKey <your-key>"`;

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
      width: 130,
      // Pinned with the actions: in a narrow card the middle scrolls, the key's name never leaves.
      fixed: 'left' as const,
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
      title: 'Scope',
      dataIndex: 'scope',
      key: 'scope',
      width: 115,
      render: (scope: CourseAPIKeyScope, record: CourseAPIKey) => {
        const colors: Record<CourseAPIKeyScope, string> = {
          read: 'green',
          write: 'orange',
          admin: 'red',
        };
        return (
          <Select<CourseAPIKeyScope>
            size="small"
            variant="borderless"
            aria-label={`Scope for ${record.name}`}
            value={scope ?? 'read'}
            onChange={(next) => confirmChangeScope(record, next)}
            popupMatchSelectWidth={false}
            options={(['read', 'write', 'admin'] as const).map((s) => ({
              value: s,
              label: <Tag color={colors[s]}>{s}</Tag>,
            }))}
          />
        );
      },
    },
    {
      title: 'Prefix',
      dataIndex: 'keyPrefix',
      key: 'keyPrefix',
      width: 100,
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
      width: 100,
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
      width: 115,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {dayjs(v).format('MMM D, YYYY')}
        </Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      // Pinned: the card is narrower than the columns, so the middle scrolls and the actions stay put.
      fixed: 'right' as const,
      render: (_: unknown, record: CourseAPIKey) => (
        <Space.Compact size="small">
          <Button size="small" onClick={() => handleToggleActive(record)}>
            {record.isActive ? 'Disable' : 'Enable'}
          </Button>
          <Tooltip title="Revoke key">
            <Button
              size="small"
              danger
              className="cp-quiet-delete"
              aria-label={`Revoke key ${record.name}`}
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
          </Tooltip>
        </Space.Compact>
      ),
    },
  ];

  return (
    <>
      <Card
        data-testid="course-api-keys-card"
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
        {isLoading ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : keys.length === 0 ? (
          <Empty description="No API keys yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            scroll={{ x: 'max-content' }}
            dataSource={keys}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            style={{ borderRadius: 6, overflow: 'hidden' }}
          />
        )}

        {/* The facts behind the table, one per labelled row, folded: the task is to see or make a key. */}
        <Collapse
          ghost
          size="small"
          style={{ marginTop: 12 }}
          items={[
            {
              key: 'how',
              label: 'How course API keys work',
              children: (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(80px, max-content) 1fr',
                    columnGap: 16,
                    rowGap: 10,
                    fontSize: 13,
                  }}
                >
                  <Text strong style={{ fontSize: 13 }}>
                    Scope
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    A key reaches this course only. A token minted with it to act as a student is limited to this course
                    too.
                  </Text>
                  <Text strong style={{ fontSize: 13 }}>
                    Use it
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Send <Text code>Authorization: CourseKey {'<token>'}</Text> with each request, from a script, a
                    Jupyter integration or an AI agent.
                  </Text>
                  <Text strong style={{ fontSize: 13 }}>
                    Claude Code
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Let an agent manage the course over MCP:{' '}
                    <Text code copyable={{ text: mcpSnippet }}>
                      {mcpSnippet}
                    </Text>
                  </Text>
                  <Text strong style={{ fontSize: 13 }}>
                    Levels
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <Tag style={{ fontSize: 12 }}>read</Tag> looks things up. <Tag style={{ fontSize: 12 }}>write</Tag>{' '}
                    adds course setup: assignments, quizzes, rubrics, autograder.{' '}
                    <Tag style={{ fontSize: 12 }}>admin</Tag> also allows deletes, attempt resets and emailing students,
                    each of which still needs a confirmation code from <Text strong>Pending agent actions</Text> below.
                  </Text>
                  <Text strong style={{ fontSize: 13 }}>
                    Privacy
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    At every level the agent never sees student email addresses: students appear as aliases you can
                    resolve under <Text strong>Student aliases</Text> below.
                  </Text>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Create Key Modal */}
      <Modal
        title="Create Course API Key"
        open={isCreateModalOpen && !createdKey}
        onCancel={() => {
          setIsCreateModalOpen(false);
          setNewKeyName('');
          setNewKeyScope('read');
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
          <Text>
            Access level. This is enforced server-side: AI agents connected with this key never even see tools above its
            level.
          </Text>
          <Select<CourseAPIKeyScope>
            value={newKeyScope}
            onChange={setNewKeyScope}
            options={[
              {
                value: 'read',
                label: 'Read only — answer questions about the course (recommended)',
              },
              {
                value: 'write',
                label: 'Read & write — manage assignments and settings; no deletes, no emailing students',
              },
              {
                value: 'admin',
                label: 'Full admin — includes deletes, attempt resets, and emailing students',
              },
            ]}
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
