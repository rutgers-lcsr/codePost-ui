// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The grading queue: the landing for the Grade tab. Summarizes what needs grading, offers a
// one-click "Start grading" into the focused step-through grader, and lists the attempts
// (needing grading by default; all attempts when "Show graded too" is on).
import * as React from 'react';
import { Empty, Flex, Popconfirm, Space, Switch, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, RightOutlined } from '@ant-design/icons';
import CPButton from '../../../core/CPButton';
import { StaffQuizAttempt } from '../../../../api-client';
import { formatScore } from '../../../core/questionMeta';
import { GradingStatusTag } from '../quizTags';
import { QueueItem } from './gradingQueue';

const { Title, Text } = Typography;

interface IProps {
  /** Attempts to list (section-filtered; needs-grading only unless `showGraded`). */
  attempts: StaffQuizAttempt[];
  /** The flat pending-response queue (section-filtered) — drives the summary + Start. */
  queue: QueueItem[];
  sectionFilter: React.ReactNode;
  hasSection: boolean;
  showGraded: boolean;
  onToggleShowGraded: (v: boolean) => void;
  onStartGrading: () => void;
  onGradeAttempt: (attempt: StaffQuizAttempt) => void;
  /** Course-admin viewer: shows the per-attempt Delete action. */
  adminActions?: boolean;
  /** A reset/delete is in flight — disables the destructive buttons meanwhile. */
  acting?: boolean;
  onDeleteAttempt?: (attempt: StaffQuizAttempt) => void;
}

const pendingCount = (a: StaffQuizAttempt) => a.responses.filter((r) => r.needsManualGrading).length;

const GradingQueue: React.FC<IProps> = ({
  attempts,
  queue,
  sectionFilter,
  hasSection,
  showGraded,
  onToggleShowGraded,
  onStartGrading,
  onGradeAttempt,
  adminActions = false,
  acting = false,
  onDeleteAttempt,
}) => {
  const attemptsNeeding = new Set(queue.map((q) => q.attemptId)).size;

  const columns = [
    { title: 'Student', dataIndex: 'student', key: 'student' },
    { title: '#', dataIndex: 'attemptNumber', key: 'attemptNumber', width: 50 },
    {
      title: 'To grade',
      key: 'toGrade',
      width: 150,
      render: (_: unknown, a: StaffQuizAttempt) =>
        a.needsManualGrading ? (
          <Tag color="gold" data-testid="attempt-pending-count">
            {pendingCount(a)} to grade
          </Tag>
        ) : (
          <GradingStatusTag needsGrading={false} />
        ),
    },
    {
      title: 'Score',
      key: 'score',
      width: 110,
      render: (_: unknown, a: StaffQuizAttempt) => (
        <Text>{formatScore(a.score, a.maxScore)}</Text>
      ),
    },
    {
      title: '',
      key: 'open',
      width: 110,
      render: (_: unknown, a: StaffQuizAttempt) => (
        <CPButton
          cpType={a.needsManualGrading ? 'primary' : 'default'}
          small
          onClick={() => onGradeAttempt(a)}
          data-testid="grading-open-attempt"
        >
          {a.needsManualGrading ? 'Grade' : 'Review'}
        </CPButton>
      ),
    },
    ...(adminActions && onDeleteAttempt
      ? [
          {
            title: '',
            key: 'delete',
            width: 50,
            render: (_: unknown, a: StaffQuizAttempt) => (
              <Popconfirm
                title={`Delete attempt #${a.attemptNumber} for ${a.student}?`}
                description="Their answers and any grades on it are removed. They can retake if attempts remain."
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDeleteAttempt(a)}
              >
                <CPButton
                  cpType="danger"
                  small
                  icon={<DeleteOutlined />}
                  aria-label={`Delete attempt #${a.attemptNumber} for ${a.student}`}
                  disabled={acting}
                  data-testid="grading-delete-attempt"
                />
              </Popconfirm>
            ),
          },
        ]
      : []),
  ];

  const caughtUp = queue.length === 0;

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center" wrap gap={12}>
        <div>
          <Title level={5} style={{ margin: 0 }} data-testid="grading-queue-summary">
            {caughtUp
              ? 'All caught up — nothing waiting to be graded 🎉'
              : `${queue.length} response${queue.length === 1 ? '' : 's'} across ${attemptsNeeding} attempt${
                  attemptsNeeding === 1 ? '' : 's'
                } need grading`}
          </Title>
        </div>
        <Space>
          {sectionFilter}
          <Space size={6}>
            <Text type="secondary">Show graded too</Text>
            <Switch
              aria-label="Show graded attempts too"
              checked={showGraded}
              onChange={onToggleShowGraded}
              data-testid="grading-show-graded"
            />
          </Space>
          <CPButton
            cpType="primary"
            onClick={onStartGrading}
            disabled={caughtUp}
            data-testid="grading-start"
          >
            Start grading <RightOutlined />
          </CPButton>
        </Space>
      </Flex>
      {attempts.length === 0 ? (
        <Empty
          description={
            hasSection
              ? 'No matching attempts in this section.'
              : showGraded
              ? 'No submitted attempts yet.'
              : 'Nothing waiting to be graded.'
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          dataSource={attempts}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          data-testid="grading-queue-table"
        />
      )}
    </Flex>
  );
};

export default GradingQueue;
