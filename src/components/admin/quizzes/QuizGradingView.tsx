// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Staff grading for a quiz: lists submitted attempts (with a needs-grading filter) and lets
// quiz graders / course admins score essay & code responses, leave feedback, and reopen a
// saved grade. A Results tab shows each student's official score (per scoringPolicy) with a
// CSV export. Auto-graded answers are shown read-only for context. Access is enforced
// server-side (Course.quizGraders role or course admin) — a 403 here means the viewer lacks
// the role. Embedded as the quiz page's Grading tab and inline in the grader console;
// `active` gates the queries so an inactive tab doesn't fetch.
import * as React from 'react';
import {
  Alert, Collapse, Empty, Flex, Input, InputNumber, Popconfirm, Progress, Select, Space, Spin, Switch,
  Table, Tabs, Tag, Typography, message,
} from 'antd';
import { DownloadOutlined, LeftOutlined, RightOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizAttemptsApi } from '../../../api-client/clients';
import { Quiz, QuizResultRow, StaffQuizAttempt, StaffQuizResponse, StudentQuizResponse, QuestionTypeEnum } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { useApiAction } from '../../../hooks/useApiAction';
import { useQuizAttempts, useQuizResults, useStaffSections } from './queries';
import { isManuallyGraded } from './choiceUtils';
import { GradingStatusTag, PassedTag } from './quizTags';
import { bySortKey, formatScore } from '../../core/questionMeta';
import { CodePostDate } from '../../utils/CodepostDate';
import QuestionAnswerer from '../../student/quizzes/QuestionAnswerer';

const { Text } = Typography;

interface IProps {
  quiz: Quiz;
  /** Whether this view is the visible tab/screen — gates all data fetching. */
  active: boolean;
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
          aria-label="Points awarded"
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
        aria-label="Feedback for the student"
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

interface CodeExecutionResult {
  status?: 'running' | 'success' | 'error';
  stdout?: string;
  stderr?: string;
  error?: string | null;
  images?: string[];
  executionTime?: number;
}

/** "Run code" control for a code response: dispatches a sandbox run, polls until it lands,
 *  and shows stdout/stderr/plots. Staff-only (the endpoint is gated server-side). */
const RunCodeControls: React.FC<{
  attemptId: number;
  response: StaffQuizResponse;
  onUpdate: (updated: StaffQuizAttempt) => void;
}> = ({ attemptId, response, onUpdate }) => {
  const exec = (response.codeExecution as CodeExecutionResult | null) ?? null;
  const running = exec?.status === 'running';
  const { acting, run } = useApiAction();
  // Poll the attempt while a run is in flight, capped so a stuck run doesn't poll forever.
  const pollRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (!running) return;
    let elapsed = 0;
    const tick = async () => {
      elapsed += 2000;
      try {
        const updated = await quizAttemptsApi.retrieve({ id: attemptId });
        const fresh = updated.responses.find((r) => r.id === response.id);
        onUpdate(updated);
        if ((fresh?.codeExecution as CodeExecutionResult | null)?.status === 'running' && elapsed < 90000) {
          pollRef.current = setTimeout(tick, 2000);
        }
      } catch {
        // Stop polling on error; the last-known state stays shown.
      }
    };
    pollRef.current = setTimeout(tick, 2000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // Re-arm only when a new run starts (requestedAt changes), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, exec?.executionTime, attemptId, response.id]);

  const trigger = () =>
    run(async () => {
      const updated = await quizAttemptsApi.runCodeCreate({
        id: attemptId,
        runQuizResponseCodeRequest: { response: response.id },
      });
      onUpdate(updated);
    }, 'Running the code…', 'Failed to run the code.');

  return (
    <Flex vertical gap={8} style={{ marginTop: -4, marginBottom: 16, marginLeft: 8, paddingLeft: 12, borderLeft: '3px solid #6b46c1' }}>
      <Space>
        <CPButton
          cpType="default"
          small
          icon={<PlayCircleOutlined />}
          loading={acting || running}
          onClick={trigger}
          data-testid="run-code"
        >
          {running ? 'Running…' : exec ? 'Run again' : 'Run code'}
        </CPButton>
        {exec?.status === 'success' && <Tag color="green">Ran cleanly</Tag>}
        {exec?.status === 'error' && <Tag color="red">Error</Tag>}
        {exec?.executionTime != null && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {exec.executionTime.toFixed(2)}s
          </Text>
        )}
      </Space>
      {exec && exec.status !== 'running' && (
        <div style={{ fontSize: 12 }}>
          {exec.error && (
            <Typography.Paragraph type="danger" style={{ fontSize: 12, marginBottom: 8 }}>
              {exec.error}
            </Typography.Paragraph>
          )}
          {exec.stdout && (
            <>
              <Text strong style={{ fontSize: 12 }}>
                stdout
              </Text>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, margin: '4px 0 8px' }}>{exec.stdout}</pre>
            </>
          )}
          {exec.stderr && (
            <>
              <Text strong style={{ fontSize: 12 }}>
                stderr
              </Text>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, margin: '4px 0 8px' }}>{exec.stderr}</pre>
            </>
          )}
          {(exec.images ?? []).map((img, idx) => (
            <img
              key={idx}
              src={`data:image/png;base64,${img}`}
              alt={`Plot ${idx + 1}`}
              style={{ maxWidth: '100%', marginTop: 8 }}
            />
          ))}
        </div>
      )}
    </Flex>
  );
};

const QuizGradingView: React.FC<IProps> = ({ quiz, active }) => {
  const queryClient = useQueryClient();
  const [needsGradingOnly, setNeedsGradingOnly] = React.useState(true);
  const [current, setCurrent] = React.useState<StaffQuizAttempt | null>(null);
  // Controlled so backing out of an attempt returns to the tab it was opened from
  // (e.g. a Results row's "View attempt"), not always to Attempts.
  const [innerTab, setInnerTab] = React.useState('attempts');

  // Focus management for the inline attempt-detail view swap: when a *different* attempt
  // opens (or the Next attempt loads) move focus into the detail heading; when the detail
  // closes move focus back to the list — so keyboard/SR users aren't stranded on an
  // unmounted control. Keyed on attempt id so re-saving a grade (which replaces `current`
  // with the same id) does not yank focus off the Save button.
  const detailHeadingRef = React.useRef<HTMLSpanElement>(null);
  const listFocusRef = React.useRef<HTMLDivElement>(null);
  const prevId = React.useRef<number | null>(null);
  React.useEffect(() => {
    const id = current?.id ?? null;
    if (id !== prevId.current) {
      if (id != null) detailHeadingRef.current?.focus();
      else listFocusRef.current?.focus();
    }
    prevId.current = id;
  }, [current]);

  const { data: attempts = [], isLoading, error } = useQuizAttempts(quiz.id, {
    needsGrading: needsGradingOnly,
    enabled: active,
  });

  const { data: results = [], isLoading: resultsLoading } = useQuizResults(quiz.id, active);

  // Section filter: a grader picks their section and sees only those students' attempts
  // and results. Filtered client-side from the section rosters (attempt rows carry the
  // student email); admins see every section, graders the ones they can read.
  const [sectionId, setSectionId] = React.useState<number | null>(null);
  const { data: sections = [] } = useStaffSections(quiz.course, active);
  const sectionEmails = React.useMemo(() => {
    if (sectionId == null) return null;
    const section = sections.find((s) => s.id === sectionId);
    return section ? new Set((section.students ?? []).map(String)) : null;
  }, [sectionId, sections]);
  const visibleAttempts = sectionEmails ? attempts.filter((a) => sectionEmails.has(a.student)) : attempts;
  const visibleResults = sectionEmails ? results.filter((r) => sectionEmails.has(r.student)) : results;

  const sectionFilter = sections.length > 0 ? (
    <Select
      size="small"
      aria-label="Filter by section"
      style={{ minWidth: 160 }}
      value={sectionId ?? 'all'}
      onChange={(v) => setSectionId(v === 'all' ? null : Number(v))}
      options={[
        { value: 'all' as const, label: 'All sections' },
        ...sections.map((s) => ({ value: s.id, label: s.name })),
      ]}
      popupMatchSelectWidth={false}
      data-testid="grading-section-filter"
    />
  ) : null;

  // Every submitted attempt (unfiltered) feeds the per-question item analysis. Shares the
  // needsGrading=false variant of the attempts key, so grading invalidates it too.
  const { data: allAttempts = [], isLoading: statsLoading } = useQuizAttempts(quiz.id, {
    enabled: active,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.attempts(quiz.id!) });
    queryClient.invalidateQueries({ queryKey: quizKeys.results(quiz.id!) });
  };

  const handleGraded = (updated: StaffQuizAttempt) => {
    setCurrent(updated);
    refresh();
  };

  // Pin/unpin the viewed attempt as the student's official score (overrides scoringPolicy).
  const { acting: pinning, run: runPin } = useApiAction();
  const setOfficial = (official: boolean) => {
    if (!current) return;
    void runPin(
      async () => {
        const updated = await quizAttemptsApi.setOfficialCreate({
          id: current.id,
          setOfficialAttemptRequest: { official },
        });
        setCurrent(updated);
        refresh();
      },
      official
        ? "Pinned — this attempt now counts as the student's official grade."
        : 'Unpinned — the scoring policy decides the official grade again.',
      'Failed to update the official attempt.',
    );
  };

  // Item analysis: aggregate every submitted response per question. Fixed and random-draw
  // questions share stable ids across attempts; AI-generated ones are per-student and
  // collapse into one aggregate bucket — the bucket keeps the individual questions so the
  // expanded row can show what was actually asked (and how each student did).
  const questionStats = React.useMemo(() => {
    interface ChoiceStat { id: number; text: string; isCorrect: boolean; picks: number }
    interface GeneratedItem {
      key: string; student: string; attemptNumber?: number; text: string; qtype: string;
      needsManualGrading: boolean; isCorrect?: boolean | null;
      pointsEarned?: string | number | null; points?: string | number | null;
    }
    interface Acc {
      key: string; title: string; qtype: string; n: number; pending: number;
      choices: ChoiceStat[] | null; items: GeneratedItem[] | null;
      earnedSum: number; gradedN: number; correctN: number; correctableN: number;
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
            items: key === 'generated' ? [] : null,
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
        if (s.items) {
          s.items.push({
            key: `${a.id}-${r.id}`,
            student: a.student,
            attemptNumber: a.attemptNumber,
            text: r.question?.text ?? '—',
            qtype: r.question?.questionType ?? '',
            needsManualGrading: !!r.needsManualGrading,
            isCorrect: r.isCorrect,
            pointsEarned: r.pointsEarned,
            points: r.points,
          });
        }
      }
    }
    const rows = [...byQuestion.values()].map((s) => ({
      ...s,
      items: s.items
        ? [...s.items].sort((a, b) => a.student.localeCompare(b.student) || (a.attemptNumber ?? 0) - (b.attemptNumber ?? 0))
        : null,
      avgPct: s.gradedN > 0 ? Math.round((s.earnedSum / s.gradedN) * 100) : null,
      correctPct: s.correctableN > 0 ? Math.round((s.correctN / s.correctableN) * 100) : null,
    }));
    // Worst-performing questions first; fully ungraded rows sink to the bottom.
    rows.sort((a, b) => (a.avgPct ?? 101) - (b.avgPct ?? 101));
    return rows;
  }, [allAttempts]);
  type QuestionStat = (typeof questionStats)[number];

  // Grade-and-next: walk the attempts that still need grading (within the section filter).
  const pending = visibleAttempts.filter((a) => a.needsManualGrading);
  const nextPending = current ? pending.find((a) => a.id !== current.id) : undefined;
  const pendingPosition = current ? pending.findIndex((a) => a.id === current.id) : -1;

  // Open a student's quiz from their Results row: the attempt behind their official score
  // (best for the default highest policy, latest otherwise — average has no single one).
  const openStudentAttempt = (student: string) => {
    const mine = allAttempts.filter((a) => a.student === student);
    if (mine.length === 0) return;
    const graded = mine.filter((a) => a.score != null && !a.needsManualGrading);
    const pool = graded.length > 0 ? graded : mine;
    const ratio = (a: StaffQuizAttempt) =>
      Number(a.maxScore) > 0 ? Number(a.score) / Number(a.maxScore) : 0;
    const pick =
      quiz.scoringPolicy === 'highest' || quiz.scoringPolicy == null
        ? pool.reduce((x, y) => (ratio(y) > ratio(x) ? y : x))
        : pool.reduce((x, y) => ((y.attemptNumber ?? 0) > (x.attemptNumber ?? 0) ? y : x));
    setCurrent(pick);
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
      width: 170,
      render: (_: unknown, a: StaffQuizAttempt) => (
        <Space size={4}>
          <GradingStatusTag needsGrading={!!a.needsManualGrading} />
          {a.isOfficialOverride && <Tag color="blue" style={{ margin: 0 }}>Official</Tag>}
        </Space>
      ),
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
    {
      title: '',
      key: 'open',
      width: 120,
      render: (_: unknown, r: QuizResultRow) => (
        <CPButton small onClick={() => openStudentAttempt(r.student)} data-testid="result-view-attempt">
          View attempt
        </CPButton>
      ),
    },
  ];

  const exportCsv = () => {
    const header = ['student', 'attempts', 'score', 'maxScore', 'passed', 'needsGrading', 'lastSubmittedAt'];
    const rows = visibleResults.map((r) => [
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
        {sectionFilter}
        <Text type="secondary">Needs grading only</Text>
        <Switch
          aria-label="Show only attempts needing grading"
          checked={needsGradingOnly}
          onChange={setNeedsGradingOnly}
        />
      </Flex>
      {visibleAttempts.length === 0 ? (
        <Empty
          description={
            sectionEmails
              ? 'No matching attempts in this section.'
              : needsGradingOnly
              ? 'Nothing waiting to be graded.'
              : 'No submitted attempts yet.'
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table dataSource={visibleAttempts} columns={columns} rowKey="id" size="small" pagination={false} />
      )}
    </>
  );

  const resultsTab = resultsLoading ? (
    <Flex justify="center" style={{ padding: 40 }}>
      <Spin />
    </Flex>
  ) : (
    <>
      <Flex justify="flex-end" align="center" gap={8} style={{ marginBottom: 12 }}>
        {sectionFilter}
        <CPButton cpType="default" icon={<DownloadOutlined />} onClick={exportCsv} disabled={visibleResults.length === 0} data-testid="results-export">
          Export CSV
        </CPButton>
      </Flex>
      {visibleResults.length === 0 ? (
        <Empty
          description={sectionEmails ? 'No results in this section.' : 'No submitted attempts yet.'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          dataSource={visibleResults}
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
        rowExpandable: (s: QuestionStat) => !!s.choices?.length || !!s.items?.length,
        expandedRowRender: (s: QuestionStat) =>
          s.items ? (
            // The per-student generated questions behind the aggregate bucket.
            <Table
              dataSource={s.items}
              rowKey="key"
              size="small"
              pagination={false}
              data-testid="generated-question-items"
              columns={[
                {
                  title: 'Student',
                  key: 'student',
                  width: 220,
                  render: (_: unknown, it: NonNullable<QuestionStat['items']>[number]) => (
                    <Text type="secondary">
                      {it.student} · #{it.attemptNumber}
                    </Text>
                  ),
                },
                {
                  title: 'Question',
                  key: 'text',
                  render: (_: unknown, it: NonNullable<QuestionStat['items']>[number]) => (
                    <Flex align="center" gap={6} style={{ minWidth: 0 }}>
                      <Typography.Paragraph
                        style={{ margin: 0 }}
                        ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
                      >
                        {it.text}
                      </Typography.Paragraph>
                      <Tag style={{ flexShrink: 0 }}>{it.qtype.replace(/_/g, ' ')}</Tag>
                    </Flex>
                  ),
                },
                {
                  title: 'Result',
                  key: 'result',
                  width: 160,
                  render: (_: unknown, it: NonNullable<QuestionStat['items']>[number]) =>
                    it.needsManualGrading ? (
                      <Tag color="gold">pending</Tag>
                    ) : (
                      <Space size={6}>
                        {it.pointsEarned != null && <Text>{formatScore(it.pointsEarned, it.points)}</Text>}
                        {it.isCorrect === true && <Tag color="success" style={{ margin: 0 }}>correct</Tag>}
                        {it.isCorrect === false && <Tag color="error" style={{ margin: 0 }}>incorrect</Tag>}
                      </Space>
                    ),
                },
              ]}
            />
          ) : (
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

  // Every submitted attempt by the student being viewed (newest first) — feeds the
  // attempt switcher in the detail header, from the already-fetched unfiltered list.
  const studentAttempts = current
    ? allAttempts
        .filter((a) => a.student === current.student)
        .sort((a, b) => (b.attemptNumber ?? 0) - (a.attemptNumber ?? 0))
    : [];

  if (error != null) {
    return (
      <Alert
        type="warning"
        showIcon
        message="You don't have access to grade this quiz."
        description="Course admins can grade quizzes; graders need the Quiz Grader role (Roster → Graders)."
      />
    );
  }
  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 40 }}>
        <Spin />
      </Flex>
    );
  }
  if (current) {
    return (
      // Cap the grading detail at the question column width the old 860px drawer (and the
      // student taking view) used — full-width questions read stretched.
      <div style={{ maxWidth: 812 }}>
        <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 12 }}>
          <Flex align="center" gap={8}>
            <CPButton cpType="link" small icon={<LeftOutlined />} onClick={() => setCurrent(null)}>
              All attempts
            </CPButton>
            <Text strong ref={detailHeadingRef} tabIndex={-1} style={{ outline: 'none' }}>
              {current.student}
            </Text>
            {studentAttempts.length > 1 ? (
              <Select
                size="small"
                aria-label="Attempt to view"
                value={current.id}
                onChange={(id) => {
                  const a = studentAttempts.find((x) => x.id === id);
                  if (a) setCurrent(a);
                }}
                options={studentAttempts.map((a) => ({
                  value: a.id,
                  label: `Attempt #${a.attemptNumber} · ${
                    a.score != null ? formatScore(a.score, a.maxScore) : '—'
                  }${a.needsManualGrading ? ' · needs grading' : ''}${
                    a.isOfficialOverride ? ' · official' : ''
                  }`,
                }))}
                popupMatchSelectWidth={false}
                data-testid="grading-attempt-switcher"
              />
            ) : (
              <Text strong>— attempt #{current.attemptNumber}</Text>
            )}
          </Flex>
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
        </Flex>
        <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 12 }}>
          <Space>
            <Text strong data-testid="grading-attempt-score">
              Score: {current.score ?? '—'} / {current.maxScore ?? '—'}
            </Text>
            {current.isOfficialOverride && (
              <Tag color="blue" data-testid="official-pin-tag">
                Official grade (pinned)
              </Tag>
            )}
          </Space>
          <Space>
            {current.needsManualGrading ? (
              <Tag color="gold">Awaiting manual grades</Tag>
            ) : (
              <PassedTag passed={current.passed} />
            )}
            {current.isOfficialOverride ? (
              <CPButton small loading={pinning} onClick={() => setOfficial(false)} data-testid="grading-unpin-official">
                Unpin official grade
              </CPButton>
            ) : (
              <CPButton small loading={pinning} onClick={() => setOfficial(true)} data-testid="grading-pin-official">
                Use as official grade
              </CPButton>
            )}
          </Space>
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
            {r.question.questionType === QuestionTypeEnum.Code && (
              <RunCodeControls attemptId={current.id} response={r} onUpdate={setCurrent} />
            )}
            {r.referenceSolution && (
              <Collapse
                size="small"
                style={{ marginLeft: 8, marginBottom: 16 }}
                items={[
                  {
                    key: 'answer-key',
                    label: 'Answer key (graders only)',
                    children: (
                      <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                        {r.referenceSolution}
                      </Typography.Paragraph>
                    ),
                  },
                ]}
              />
            )}
            {isManuallyGraded(r.question.questionType) && (
              <GradeControls attemptId={current.id} response={r} onGraded={handleGraded} />
            )}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div ref={listFocusRef} tabIndex={-1} style={{ outline: 'none' }}>
      <Tabs
        activeKey={innerTab}
        onChange={setInnerTab}
        items={[
          { key: 'attempts', label: 'Attempts', children: attemptsTab },
          { key: 'results', label: 'Results', children: resultsTab },
          { key: 'questions', label: 'Item analysis', children: questionsTab },
        ]}
      />
    </div>
  );
};

export default QuizGradingView;
