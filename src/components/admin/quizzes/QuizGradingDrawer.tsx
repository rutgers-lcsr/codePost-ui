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
  Alert, Drawer, Empty, Flex, Input, InputNumber, Popconfirm, Progress, Space, Spin, Switch, Table,
  Tabs, Tag, Typography, message,
} from 'antd';
import { DownloadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizAttemptsApi } from '../../../api-client/clients';
import { Quiz, QuizResultRow, StaffQuizAttempt, StudentQuizResponse, QuestionTypeEnum } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { useApiAction } from '../../../hooks/useApiAction';
import { useQuizAttempts, useQuizResults } from './queries';
import { isManuallyGraded } from './choiceUtils';
import { GradingStatusTag, PassedTag } from './quizTags';
import { bySortKey, formatScore } from '../../core/questionMeta';
import { CodePostDate } from '../../utils/CodepostDate';
import QuestionAnswerer from '../../student/quizzes/QuestionAnswerer';

const { Text } = Typography;

interface IProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz;
}

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
  const { acting: saving, run } = useApiAction();

  // Re-sync when the server state changes underneath us (save, reopen, attempt switch).
  React.useEffect(() => {
    setPoints(response.pointsEarned != null ? Number(response.pointsEarned) : null);
    setFeedback(response.graderFeedback ?? '');
  }, [response.id, response.pointsEarned, response.graderFeedback]);

  const dirty =
    (points ?? null) !== (response.pointsEarned != null ? Number(response.pointsEarned) : null) ||
    feedback !== (response.graderFeedback ?? '');

  const save = () => {
    if (points == null) {
      message.warning('Enter the points earned first.');
      return;
    }
    void run(async () => {
      const updated = await quizAttemptsApi.gradeResponseCreate({
        id: attemptId,
        gradeQuizResponseRequest: { response: response.id, pointsEarned: points, graderFeedback: feedback },
      });
      onGraded(updated);
    }, 'Response graded.', 'Failed to save the grade.');
  };

  const reopen = () =>
    run(async () => {
      const updated = await quizAttemptsApi.reopenResponseCreate({
        id: attemptId,
        reopenQuizResponseRequest: { response: response.id },
      });
      onGraded(updated);
    }, 'Grade reopened — the response is back in the grading queue.', 'Failed to reopen the grade.');

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
        <GradingStatusTag needsGrading={!!response.needsManualGrading} />
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

  const { data: attempts = [], isLoading, error } = useQuizAttempts(quiz.id, {
    needsGrading: needsGradingOnly,
    enabled: open,
  });

  const { data: results = [], isLoading: resultsLoading } = useQuizResults(quiz.id, open);

  // Every submitted attempt (unfiltered) feeds the per-question item analysis. Shares the
  // needsGrading=false variant of the attempts key, so grading invalidates it too.
  const { data: allAttempts = [], isLoading: statsLoading } = useQuizAttempts(quiz.id, {
    enabled: open,
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

  // Item analysis: aggregate every submitted response per question. Fixed and random-draw
  // questions share stable ids across attempts; AI-generated ones are per-student and
  // collapse into one aggregate bucket.
  const questionStats = React.useMemo(() => {
    interface ChoiceStat { id: number; text: string; isCorrect: boolean; picks: number }
    interface Acc {
      key: string; title: string; qtype: string; n: number; pending: number;
      choices: ChoiceStat[] | null; earnedSum: number; gradedN: number;
      correctN: number; correctableN: number;
    }
    const byQuestion = new Map<string, Acc>();
    const selectableTypes = new Set<string>([
      QuestionTypeEnum.MultipleChoice, QuestionTypeEnum.MultipleAnswers, QuestionTypeEnum.TrueFalse,
    ]);
    for (const a of allAttempts) {
      for (const r of a.responses) {
        const qid = r.question?.id;
        const key = qid != null ? String(qid) : 'generated';
        let s = byQuestion.get(key);
        if (!s) {
          const qtype = r.question?.questionType ?? '';
          s = {
            key,
            title: key === 'generated' ? 'AI-generated questions (per-student)' : (r.question?.text ?? '—'),
            qtype: key === 'generated' ? 'mixed' : qtype,
            n: 0,
            pending: 0,
            choices: key !== 'generated' && selectableTypes.has(qtype)
              ? (r.question?.choices ?? []).map((c) => ({
                  id: c.id!, text: c.text ?? '', isCorrect: !!c.isCorrect, picks: 0,
                }))
              : null,
            earnedSum: 0, gradedN: 0, correctN: 0, correctableN: 0,
          };
          byQuestion.set(key, s);
        }
        s.n += 1;
        if (r.needsManualGrading) s.pending += 1;
        if (r.pointsEarned != null && Number(r.points) > 0) {
          s.earnedSum += Number(r.pointsEarned) / Number(r.points);
          s.gradedN += 1;
        }
        if (r.isCorrect != null) {
          s.correctableN += 1;
          if (r.isCorrect) s.correctN += 1;
        }
        if (s.choices) {
          for (const cid of r.selectedChoices ?? []) {
            const c = s.choices.find((x) => x.id === cid);
            if (c) c.picks += 1;
          }
        }
      }
    }
    const rows = [...byQuestion.values()].map((s) => ({
      ...s,
      avgPct: s.gradedN > 0 ? Math.round((s.earnedSum / s.gradedN) * 100) : null,
      correctPct: s.correctableN > 0 ? Math.round((s.correctN / s.correctableN) * 100) : null,
    }));
    // Worst-performing questions first; fully ungraded rows sink to the bottom.
    rows.sort((a, b) => (a.avgPct ?? 101) - (b.avgPct ?? 101));
    return rows;
  }, [allAttempts]);
  type QuestionStat = (typeof questionStats)[number];

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
        <GradingStatusTag needsGrading={!!a.needsManualGrading} />,
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
            {formatScore(r.score, r.maxScore)}
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
        r.passed != null ? <PassedTag passed={r.passed} /> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      key: 'needsGrading',
      width: 130,
      render: (_: unknown, r: QuizResultRow) =>
        <GradingStatusTag needsGrading={!!r.needsGrading} />,
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

  const questionsTab = statsLoading ? (
    <Flex justify="center" style={{ padding: 40 }}>
      <Spin />
    </Flex>
  ) : questionStats.length === 0 ? (
    <Empty description="No submitted attempts yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
  ) : (
    <Table
      dataSource={questionStats}
      rowKey="key"
      size="small"
      pagination={false}
      data-testid="question-stats-table"
      columns={[
        {
          title: 'Question',
          key: 'title',
          render: (_: unknown, s: QuestionStat) => (
            <Flex align="center" gap={6} style={{ minWidth: 0 }}>
              <Text ellipsis style={{ maxWidth: 380 }}>
                {s.title}
              </Text>
              <Tag style={{ flexShrink: 0 }}>{s.qtype.replace(/_/g, ' ')}</Tag>
            </Flex>
          ),
        },
        {
          title: 'Responses',
          key: 'n',
          width: 120,
          render: (_: unknown, s: QuestionStat) => (
            <Space size={4}>
              <Text>{s.n}</Text>
              {s.pending > 0 && <Tag color="gold">{s.pending} pending</Tag>}
            </Space>
          ),
        },
        {
          title: 'Avg score',
          key: 'avg',
          width: 170,
          render: (_: unknown, s: QuestionStat) =>
            s.avgPct != null ? (
              <Flex align="center" gap={8}>
                <Progress percent={s.avgPct} showInfo={false} size="small" style={{ width: 90 }} />
                <Text data-testid="question-avg">{s.avgPct}%</Text>
              </Flex>
            ) : (
              <Text type="secondary">—</Text>
            ),
        },
        {
          title: 'Fully correct',
          key: 'correct',
          width: 110,
          render: (_: unknown, s: QuestionStat) =>
            s.correctPct != null ? `${s.correctPct}%` : <Text type="secondary">—</Text>,
        },
      ]}
      expandable={{
        rowExpandable: (s: QuestionStat) => !!s.choices?.length,
        expandedRowRender: (s: QuestionStat) => (
          <Flex vertical gap={6} style={{ padding: '4px 8px' }}>
            {(s.choices ?? []).map((c) => (
              <Flex key={c.id} align="center" gap={8}>
                <Text ellipsis style={{ width: 320 }}>
                  {c.text}
                </Text>
                {c.isCorrect && (
                  <Tag color="success" style={{ margin: 0 }}>
                    correct
                  </Tag>
                )}
                <Progress
                  percent={s.n > 0 ? Math.round((c.picks / s.n) * 100) : 0}
                  showInfo={false}
                  size="small"
                  style={{ width: 120 }}
                />
                <Text type="secondary">
                  {c.picks} {c.picks === 1 ? 'pick' : 'picks'}
                </Text>
              </Flex>
            ))}
          </Flex>
        ),
      }}
    />
  );

  const responses = current ? [...current.responses].sort(bySortKey) : [];

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
            ) : (
              <PassedTag passed={current.passed} />
            )}
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
              {isManuallyGraded(r.question.questionType) && (
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
            { key: 'questions', label: 'Questions', children: questionsTab },
          ]}
        />
      )}
    </Drawer>
  );
};

export default QuizGradingDrawer;
