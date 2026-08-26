// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Card, Empty, message, Popconfirm, Space, Spin, Table, Tag, Typography } from 'antd';
import { RobotOutlined, StopOutlined } from '@ant-design/icons';
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
 * Confirmation codes for destructive MCP agent actions (deletes, attempt
 * resets, mass email). The agent cannot read these — this panel is the
 * out-of-band channel: the instructor reads the code here and pastes it into
 * the agent chat to approve, or denies to kill it. Codes are single-use and
 * expire after 10 minutes, so the list polls while anything is pending.
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

  const handleDeny = async (action: PendingAgentAction) => {
    try {
      await Course.denyPendingAgentAction(courseId, action.id);
      message.success('Denied — the code no longer works.');
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
      title: 'Code',
      key: 'code',
      render: (action: PendingAgentAction) => (
        <Text code copyable style={{ fontSize: 18 }}>
          {action.code}
        </Text>
      ),
    },
    {
      title: 'Expires',
      key: 'expires',
      render: (action: PendingAgentAction) => <Tag color="orange">{dayjs(action.expiresAt).fromNow()}</Tag>,
    },
    {
      title: '',
      key: 'deny',
      render: (action: PendingAgentAction) => (
        <Popconfirm
          title="Deny this action?"
          description="The code stops working immediately; the agent will report the denial."
          onConfirm={() => handleDeny(action)}
        >
          <CPButton danger icon={<StopOutlined />}>
            Deny
          </CPButton>
        </Popconfirm>
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
        attempts, email every student), it is refused until you approve it here. Read the code and paste it into the
        agent chat to approve — or deny it. Codes work once and expire after 10 minutes.
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
