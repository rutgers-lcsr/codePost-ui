// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Card, Empty, message, Popconfirm, Space, Spin, Table, Tag, Typography } from 'antd';
import { CheckOutlined, RobotOutlined, StopOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { Course } from '../../../services/course';
import type { PendingAgentAction } from '../../../services/course';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;

interface IPendingAgentActionsCardProps {
  courseId: number;
}

/**
 * Approval gate for destructive MCP agent actions (deletes, attempt resets,
 * mass email) requested by clients that can't show an in-chat approval dialog.
 * The agent cannot touch this panel — its endpoints refuse the agent's own
 * credential — so a human must click Approve here; the agent's retry then
 * executes. Requests are single-use, expire after 10 minutes, and a denial
 * sticks until expiry, so the list polls while anything is pending.
 */
const PendingAgentActionsCard: React.FC<IPendingAgentActionsCardProps> = ({ courseId }) => {
  const queryClient = useQueryClient();
  const queryKey = ['course', courseId, 'pendingAgentActions'];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => Course.listPendingAgentActions(courseId),
    refetchInterval: (query) => ((query.state.data?.length ?? 0) > 0 ? 10_000 : 30_000),
  });
  // Defensive: an unmocked/erroring endpoint can resolve to a non-array, and
  // antd's Table throws on a non-array dataSource (rawData.some).
  const actions = Array.isArray(data) ? data : [];

  const handleApprove = async (action: PendingAgentAction) => {
    try {
      await Course.approvePendingAgentAction(courseId, action.id);
      message.success('Approved — the agent will proceed on its next attempt.');
      queryClient.invalidateQueries({ queryKey });
    } catch {
      message.error('Failed to approve the action.');
    }
  };

  const handleDeny = async (action: PendingAgentAction) => {
    try {
      await Course.denyPendingAgentAction(courseId, action.id);
      message.success('Denied — the agent will be told to stop.');
      queryClient.invalidateQueries({ queryKey });
    } catch {
      message.error('Failed to deny the action.');
    }
  };

  const describePlan = (plan: Record<string, unknown>): string => {
    try {
      const interesting = Object.entries(plan)
        .filter(([key]) => key !== 'name')
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);
      return interesting.join(' · ');
    } catch {
      return '';
    }
  };

  const columns = [
    {
      title: 'Requested action',
      key: 'tool',
      render: (action: PendingAgentAction) => (
        <Space direction="vertical" size={0}>
          <Text strong>{action.tool.replace(/^codepost_/, '').replace(/_/g, ' ')}</Text>
          {typeof action.plan?.name === 'string' && <Text type="secondary">{String(action.plan.name)}</Text>}
          <Text type="secondary" style={{ fontSize: 12 }}>
            {describePlan(action.plan)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Expires',
      key: 'expires',
      render: (action: PendingAgentAction) => <Tag color="orange">{dayjs(action.expiresAt).fromNow()}</Tag>,
    },
    {
      title: '',
      key: 'decide',
      render: (action: PendingAgentAction) =>
        action.status === 'approved' ? (
          <Tag color="green" icon={<CheckOutlined />}>
            Approved — waiting for the agent
          </Tag>
        ) : (
          <Space>
            <Popconfirm
              title="Approve this action?"
              description="The agent will proceed on its next attempt. This cannot be undone once it runs."
              onConfirm={() => handleApprove(action)}
            >
              <CPButton type="primary" icon={<CheckOutlined />} data-testid="approve-agent-action">
                Approve
              </CPButton>
            </Popconfirm>
            <Popconfirm
              title="Deny this action?"
              description="The agent will be told to stop asking and report the denial."
              onConfirm={() => handleDeny(action)}
            >
              <CPButton danger icon={<StopOutlined />}>
                Deny
              </CPButton>
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>Pending agent actions</span>
        </Space>
      }
    >
      <Paragraph type="secondary">
        When an AI agent connected to this course asks to do something destructive (delete an assignment, reset quiz
        attempts, email every student) and can&apos;t show you an approval dialog in the chat itself, the request lands
        here instead. Review what it wants to do, then Approve — the agent proceeds on its next attempt — or Deny.
        Requests work once and expire after 10 minutes.
      </Paragraph>
      {isLoading ? (
        <Spin />
      ) : actions.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No pending agent actions" />
      ) : (
        <>
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="An agent is waiting for your approval. Only approve actions you asked for."
          />
          <Table
            dataSource={actions}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            data-testid="pending-agent-actions-table"
          />
        </>
      )}
    </Card>
  );
};

export default PendingAgentActionsCard;
