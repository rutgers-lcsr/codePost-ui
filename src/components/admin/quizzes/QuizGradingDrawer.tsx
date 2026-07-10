// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Staff grading for a quiz: lists submitted attempts (with a needs-grading filter) and lets
// quiz graders / course admins score essay & code responses, leave feedback, and reopen a
// saved grade. A Results tab shows each student's official score (per scoringPolicy) with a
// CSV export. Auto-graded answers are shown read-only for context. Access is enforced
// server-side (Course.quizGraders role or course admin) — a 403 here means the viewer lacks
// the role.
import * as React from 'react';
import {
  Alert, Drawer, Empty, Flex, Input, InputNumber, Popconfirm, Space, Spin, Switch, Table, Tabs,
  Tag, Typography, message,
} from 'antd';
import { DownloadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizzesApi, quizAttemptsApi } from '../../../api-client/clients';
import { Quiz, QuizResultRow, StaffQuizAttempt, StudentQuizResponse, QuestionTypeEnum } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { CodePostDate } from '../../utils/CodepostDate';
import QuestionAnswerer from '../../student/quizzes/QuestionAnswerer';

const { Text } = Typography;

const MANUAL_TYPES = new Set<string>([QuestionTypeEnum.Essay, QuestionTypeEnum.Code]);

interface IProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz;
}

const parseErr = (e: unknown): string | undefined => (e as { body?: { detail?: string } })?.body?.detail;

/** Points + feedback editor for one manual (essay/code) response, with reopen for saved grades. */
const GradeControls: React.FC<{
  attemptId: number;
  response: StudentQuizResponse;
  onGraded: (updated: StaffQuizAttempt) => void;
}> = ({ attemptId, response, onGraded }) => {
  const [points, setPoints] = React.useState<number | null>(
    response.pointsEarned != null ? Number(response.pointsEarned) : null,
  );
  const [feedback, setFeedback] = React.useState(response.graderFeedback ?? '');
  const [saving, setSaving] = React.useState(false);

  // Re-sync when the server state changes underneath us (save, reopen, attempt switch).
  React.useEffect(() => {
    setPoints(response.pointsEarned != null ? Number(response.pointsEarned) : null);
    setFeedback(response.graderFeedback ?? '');
  }, [response.id, response.pointsEarned, response.graderFeedback]);

  const dirty =
    (points ?? null) !== (response.pointsEarned != null ? Number(response.pointsEarned) : null) ||
    feedback !== (response.graderFeedback ?? '');

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

  const reopen = async () => {
    setSaving(true);
    try {
      const updated = await quizAttemptsApi.reopenResponseCreate({
        id: attemptId,
        reopenQuizResponseRequest: { response: response.id },
      });
      message.success('Grade reopened — the response is back in the grading queue.');
      onGraded(updated);
    } catch (e) {
      message.error(parseErr(e) ?? 'Failed to reopen the grade.');
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
        {!response.needsManualGrading && (
          <Popconfirm
            title="Reopen this grade?"
            description="The points are removed and the response returns to the grading queue. The feedback text is kept as a draft."
            okText="Reopen"
            onConfirm={reopen}
          >
            <CPButton cpType="link" small loading={saving} data-testid="grade-reopen">
              Reopen
            </CPButton>
          </Popconfirm>
        )}
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

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: quizKeys.results(quiz.id ?? -1),
    queryFn: (): Promise<QuizResultRow[]> => quizzesApi.resultsList({ id: quiz.id! }),
    enabled: open && !!quiz.id,
  });

  React.useEffect(() => {
    if (!open) setCurrent(null);
  }, [open]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.attempts(quiz.id!) });
    queryClient.invalidateQueries({ queryKey: quizKeys.results(quiz.id!) });
  };

  const handleGraded = (updated: StaffQuizAttempt) => {
    setCurrent(updated);
    refresh();
  };

  // Grade-and-next: walk the attempts that still need grading.
  const pending = attempts.filter((a) => a.needsManualGrading);
  const nextPending = current ? pending.find((a) => a.id !== current.id) : undefined;
  const pendingPosition = current ? pending.findIndex((a) => a.id === current.id) : -1;

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

  const resultColumns = [
    { title: 'Student', dataIndex: 'student', key: 'student' },
    { title: 'Attempts', dataIndex: 'attemptsUsed', key: 'attemptsUsed', width: 90 },
    {
      title: 'Score',
      key: 'score',
      width: 110,
      render: (_: unknown, r: QuizResultRow) =>
        r.score != null ? (
          <Text data-testid="result-score">
            {Number(r.score)} / {Number(r.maxScore)}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Passed',
      key: 'passed',
      width: 110,
      render: (_: unknown, r: QuizResultRow) =>
        r.passed === true ? (
          <Tag color="success">Passed</Tag>
        ) : r.passed === false ? (
          <Tag color="error">Not passed</Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Status',
      key: 'needsGrading',
      width: 130,
      render: (_: unknown, r: QuizResultRow) =>
        r.needsGrading ? <Tag color="gold">Needs grading</Tag> : <Tag color="green">Graded</Tag>,
    },
    {
      title: 'Last submitted',
      key: 'lastSubmittedAt',
      render: (_: unknown, r: QuizResultRow) =>
        r.lastSubmittedAt ? <CodePostDate datetime={String(r.lastSubmittedAt)} /> : null,
    },
  ];

  const exportCsv = () => {
    const header = ['student', 'attempts', 'score', 'maxScore', 'passed', 'needsGrading', 'lastSubmittedAt'];
    const rows = results.map((r) => [
      r.student,
      String(r.attemptsUsed),
      r.score != null ? String(Number(r.score)) : '',
      r.maxScore != null ? String(Number(r.maxScore)) : '',
      r.passed == null ? '' : r.passed ? 'yes' : 'no',
      r.needsGrading ? 'yes' : 'no',
      r.lastSubmittedAt ? String(r.lastSubmittedAt) : '',
    ]);
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `${(quiz.title ?? 'quiz').replace(/\s+/g, '_')}-results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const attemptsTab = (
    <>
      <Flex justify="flex-end" align="center" gap={8} style={{ marginBottom: 12 }}>
        <Text type="secondary">Needs grading only</Text>
        <Switch checked={needsGradingOnly} onChange={setNeedsGradingOnly} />
      </Flex>
      {attempts.length === 0 ? (
        <Empty
          description={needsGradingOnly ? 'Nothing waiting to be graded.' : 'No submitted attempts yet.'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table dataSource={attempts} columns={columns} rowKey="id" size="small" pagination={false} />
      )}
    </>
  );

  const resultsTab = resultsLoading ? (
    <Flex justify="center" style={{ padding: 40 }}>
      <Spin />
    </Flex>
  ) : (
    <>
      <Flex justify="flex-end" style={{ marginBottom: 12 }}>
        <CPButton cpType="default" icon={<DownloadOutlined />} onClick={exportCsv} disabled={results.length === 0} data-testid="results-export">
          Export CSV
        </CPButton>
      </Flex>
      {results.length === 0 ? (
        <Empty description="No submitted attempts yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table
          dataSource={results}
          columns={resultColumns}
          rowKey="student"
          size="small"
          pagination={false}
          data-testid="results-table"
        />
      )}
    </>
  );

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
        current && (
          <Space>
            {pendingPosition >= 0 && (
              <Text type="secondary">
                {pendingPosition + 1} of {pending.length} needing grading
              </Text>
            )}
            {nextPending && (
              <CPButton cpType="default" small onClick={() => setCurrent(nextPending)} data-testid="grading-next">
                Next needing grading <RightOutlined />
              </CPButton>
            )}
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
      ) : (
        <Tabs
          defaultActiveKey="attempts"
          items={[
            { key: 'attempts', label: 'Attempts', children: attemptsTab },
            { key: 'results', label: 'Results', children: resultsTab },
          ]}
        />
      )}
    </Drawer>
  );
};

export default QuizGradingDrawer;
