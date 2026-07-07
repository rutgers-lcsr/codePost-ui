// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Staff grading for a quiz: lists submitted attempts (with a needs-grading filter) and lets
// quiz graders / course admins score essay & code responses and leave feedback. Auto-graded
// answers are shown read-only for context. Access is enforced server-side (Course.quizGraders
// role or course admin) — a 403 here means the viewer lacks the role.
import * as React from 'react';
import { Alert, Drawer, Empty, Flex, Input, InputNumber, Space, Spin, Switch, Table, Tag, Typography, message } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizzesApi, quizAttemptsApi } from '../../../api-client/clients';
import { Quiz, StaffQuizAttempt, StudentQuizResponse, QuestionTypeEnum } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import QuestionAnswerer from '../../student/quizzes/QuestionAnswerer';

const { Text } = Typography;

const MANUAL_TYPES = new Set<string>([QuestionTypeEnum.Essay, QuestionTypeEnum.Code]);

interface IProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz;
}

const parseErr = (e: unknown): string | undefined => (e as { body?: { detail?: string } })?.body?.detail;

/** Points + feedback editor for one manual (essay/code) response. */
const GradeControls: React.FC<{
  attemptId: number;
  response: StudentQuizResponse;
  onGraded: (updated: StaffQuizAttempt) => void;
}> = ({ attemptId, response, onGraded }) => {
  const [points, setPoints] = React.useState<number | null>(response.pointsEarned ?? null);
  const [feedback, setFeedback] = React.useState(response.graderFeedback ?? '');
  const [saving, setSaving] = React.useState(false);

  const dirty = (points ?? null) !== (response.pointsEarned ?? null) || feedback !== (response.graderFeedback ?? '');

  const save = async () => {
    if (points == null) {
      message.warning('Enter the points earned first.');
      return;
    }
    setSaving(true);
    try {
      const updated = await quizAttemptsApi.gradeResponseCreate({
        id: attemptId,
        gradeQuizResponseRequest: { response: response.id, pointsEarned: points, graderFeedback: feedback },
      });
      message.success('Response graded.');
      onGraded(updated);
    } catch (e) {
      message.error(parseErr(e) ?? 'Failed to save the grade.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex vertical gap={8} style={{ marginTop: -4, marginBottom: 16, marginLeft: 8, paddingLeft: 12, borderLeft: '3px solid #198665' }}>
      <Space wrap>
        <Text strong>Grade:</Text>
        <InputNumber
          min={0}
          max={Number(response.points ?? 0)}
          step={0.5}
          value={points ?? undefined}
          onChange={(v) => setPoints(v ?? null)}
          data-testid="grade-points"
        />
        <Text type="secondary">/ {response.points} pts</Text>
        {response.needsManualGrading ? <Tag color="gold">Needs grading</Tag> : <Tag color="green">Graded</Tag>}
      </Space>
      <Input.TextArea
        placeholder="Feedback for the student (optional)…"
        autoSize={{ minRows: 2 }}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        data-testid="grade-feedback"
      />
      <div>
        <CPButton cpType="primary" onClick={save} loading={saving} disabled={!dirty} data-testid="grade-save">
          Save grade
        </CPButton>
      </div>
    </Flex>
  );
};

const QuizGradingDrawer: React.FC<IProps> = ({ open, onClose, quiz }) => {
  const queryClient = useQueryClient();
  const [needsGradingOnly, setNeedsGradingOnly] = React.useState(true);
  const [current, setCurrent] = React.useState<StaffQuizAttempt | null>(null);

  const { data: attempts = [], isLoading, error } = useQuery({
    queryKey: [...quizKeys.attempts(quiz.id ?? -1), needsGradingOnly],
    queryFn: (): Promise<StaffQuizAttempt[]> =>
      quizzesApi.attemptsList({ id: quiz.id!, needsGrading: needsGradingOnly || undefined }),
    enabled: open && !!quiz.id,
  });

  React.useEffect(() => {
    if (!open) setCurrent(null);
  }, [open]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: quizKeys.attempts(quiz.id!) });

  const handleGraded = (updated: StaffQuizAttempt) => {
    setCurrent(updated);
    refresh();
  };

  const columns = [
    { title: 'Student', dataIndex: 'student', key: 'student' },
    { title: '#', dataIndex: 'attemptNumber', key: 'attemptNumber', width: 50 },
    {
      title: 'Score',
      key: 'score',
      width: 110,
      render: (_: unknown, a: StaffQuizAttempt) => (
        <Text>
          {a.score ?? '—'} / {a.maxScore ?? '—'}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'state',
      width: 140,
      render: (_: unknown, a: StaffQuizAttempt) =>
        a.needsManualGrading ? <Tag color="gold">Needs grading</Tag> : <Tag color="green">Graded</Tag>,
    },
    {
      title: '',
      key: 'open',
      width: 90,
      render: (_: unknown, a: StaffQuizAttempt) => (
        <CPButton cpType="primary" small onClick={() => setCurrent(a)} data-testid="grading-open-attempt">
          Grade
        </CPButton>
      ),
    },
  ];

  const responses = current ? [...current.responses].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)) : [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={860}
      title={
        current ? (
          <Flex align="center" gap={8}>
            <CPButton cpType="link" small onClick={() => setCurrent(null)}>
              <LeftOutlined /> All attempts
            </CPButton>
            <Text strong>
              {current.student} — attempt #{current.attemptNumber}
            </Text>
          </Flex>
        ) : (
          `Grading — ${quiz.title}`
        )
      }
      extra={
        !current && (
          <Space>
            <Text type="secondary">Needs grading only</Text>
            <Switch checked={needsGradingOnly} onChange={setNeedsGradingOnly} />
          </Space>
        )
      }
    >
      {error != null ? (
        <Alert
          type="warning"
          showIcon
          message="You don't have access to grade this quiz."
          description="Course admins can grade quizzes; graders need the Quiz Grader role (Roster → Graders)."
        />
      ) : isLoading ? (
        <Flex justify="center" style={{ padding: 40 }}>
          <Spin />
        </Flex>
      ) : current ? (
        <>
          <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
            <Text strong data-testid="grading-attempt-score">
              Score: {current.score ?? '—'} / {current.maxScore ?? '—'}
            </Text>
            {current.needsManualGrading ? (
              <Tag color="gold">Awaiting manual grades</Tag>
            ) : current.passed === true ? (
              <Tag color="success">Passed</Tag>
            ) : current.passed === false ? (
              <Tag color="error">Did not pass</Tag>
            ) : null}
          </Flex>
          {responses.map((r, i) => (
            <div key={r.id}>
              <QuestionAnswerer
                response={r}
                index={i}
                value={{ answerText: r.answerText ?? '', selectedChoices: [...r.selectedChoices] }}
                disabled
                reveal
                onChange={() => undefined}
              />
              {MANUAL_TYPES.has(r.question.questionType ?? '') && (
                <GradeControls attemptId={current.id} response={r} onGraded={handleGraded} />
              )}
            </div>
          ))}
        </>
      ) : attempts.length === 0 ? (
        <Empty
          description={needsGradingOnly ? 'Nothing waiting to be graded.' : 'No submitted attempts yet.'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table dataSource={attempts} columns={columns} rowKey="id" size="small" pagination={false} />
      )}
    </Drawer>
  );
};

export default QuizGradingDrawer;
