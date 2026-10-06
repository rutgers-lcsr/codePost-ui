// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The analytics side of quiz grading, separated from the grading flow: a per-student Results
// report (with CSV export) and per-question Item analysis. Both respect the section filter.
import * as React from 'react';
import { Collapse, Empty, Flex, Popconfirm, Progress, Space, Spin, Table, Tabs, Tag, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import CPButton from '../../../core/CPButton';
import { Quiz, QuizResultRow, StaffQuizAttempt, QuestionTypeEnum } from '../../../../api-client';
import { formatScore } from '../../../core/questionMeta';
import { GradingStatusTag, PassedTag } from '../quizTags';
import { CodePostDate } from '../../../utils/CodepostDate';
import Markdown from '../../../core/Markdown';

const { Text } = Typography;

// Fold the (student, attempt)-sorted generated items into one group per attempt so the
// item-analysis expansion reads as a list of students rather than a flat list of questions.
interface GeneratedGroup<T> {
  key: string; student: string; attemptNumber?: number; items: T[];
  pending: number; earned: number; points: number; gradedN: number;
}
const groupByAttempt = <T extends {
  student: string; attemptNumber?: number; needsManualGrading: boolean;
  pointsEarned?: string | number | null; points?: string | number | null;
}>(items: T[]): GeneratedGroup<T>[] => {
  const groups: GeneratedGroup<T>[] = [];
  for (const it of items) {
    const key = `${it.student}#${it.attemptNumber ?? 0}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, student: it.student, attemptNumber: it.attemptNumber, items: [], pending: 0, earned: 0, points: 0, gradedN: 0 };
      groups.push(g);
    }
    g.items.push(it);
    if (it.needsManualGrading) g.pending += 1;
    if (it.pointsEarned != null) {
      g.earned += Number(it.pointsEarned);
      g.points += Number(it.points ?? 0);
      g.gradedN += 1;
    }
  }
  return groups;
};

interface IProps {
  quiz: Quiz;
  /** Every submitted attempt (section-filtered) — feeds the per-question item analysis. */
  attempts: StaffQuizAttempt[];
  /** Per-student official results (section-filtered). */
  results: QuizResultRow[];
  resultsLoading: boolean;
  statsLoading: boolean;
  /** The shared section-filter control, rendered in this view's toolbar. */
  sectionFilter: React.ReactNode;
  hasSection: boolean;
  /** Open a student's official attempt in the focused grader for review. */
  onOpenAttempt: (student: string) => void;
  /** Course-admin viewer: shows the per-student Reset and the Reset-all actions. */
  adminActions?: boolean;
  /** A reset/delete is in flight — disables the destructive buttons meanwhile. */
  acting?: boolean;
  onResetStudent?: (student: string) => void;
  onResetAll?: () => void;
}

const GradingOverview: React.FC<IProps> = ({
  quiz,
  attempts,
  results,
  resultsLoading,
  statsLoading,
  sectionFilter,
  hasSection,
  onOpenAttempt,
  adminActions = false,
  acting = false,
  onResetStudent,
  onResetAll,
}) => {
  const [view, setView] = React.useState<'results' | 'items'>('results');

  // Item analysis: aggregate every submitted response per question. Fixed and random-draw
  // questions share stable ids across attempts; AI-generated ones are per-student and collapse
  // into one aggregate bucket that keeps the individual questions for the expanded row.
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
    for (const a of attempts) {
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
  }, [attempts]);
  type QuestionStat = (typeof questionStats)[number];

  const resultColumns = [
    { title: 'Student', dataIndex: 'student', key: 'student' },
    {
      title: 'Attempts',
      key: 'attemptsUsed',
      width: 150,
      render: (_: unknown, r: QuizResultRow) => (
        <Space size={6}>
          <Text>{r.attemptsUsed}</Text>
          {r.hasInProgress && (
            <Tag color="processing" style={{ margin: 0 }} data-testid="result-in-progress">
              In progress
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      width: 110,
      render: (_: unknown, r: QuizResultRow) =>
        r.score != null ? (
          <Text data-testid="result-score">{formatScore(r.score, r.maxScore)}</Text>
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
      render: (_: unknown, r: QuizResultRow) => <GradingStatusTag needsGrading={!!r.needsGrading} />,
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
      width: adminActions ? 200 : 120,
      render: (_: unknown, r: QuizResultRow) => (
        <Space size={6}>
          {/* A row may hold only an in-progress attempt — nothing submitted to open yet. */}
          <CPButton
            small
            onClick={() => onOpenAttempt(r.student)}
            disabled={!r.lastSubmittedAt}
            data-testid="result-view-attempt"
          >
            View attempt
          </CPButton>
          {adminActions && onResetStudent && (
            <Popconfirm
              title={`Reset attempts for ${r.student}?`}
              description={`Deletes all ${r.attemptsUsed} of their attempt${
                r.attemptsUsed === 1 ? '' : 's'
              }, including any in progress. They can start the quiz again from scratch.`}
              okText="Reset"
              okButtonProps={{ danger: true }}
              onConfirm={() => onResetStudent(r.student)}
            >
              <CPButton cpType="danger" small disabled={acting} data-testid="result-reset-student">
                Reset
              </CPButton>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const exportCsv = () => {
    const header = ['student', 'attempts', 'inProgress', 'score', 'maxScore', 'passed', 'needsGrading', 'lastSubmittedAt'];
    const rows = results.map((r) => [
      r.student,
      String(r.attemptsUsed),
      r.hasInProgress ? 'yes' : 'no',
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

  const results_ = resultsLoading ? (
    <Flex justify="center" style={{ padding: 40 }}>
      <Spin />
    </Flex>
  ) : results.length === 0 ? (
    <Empty
      description={hasSection ? 'No results in this section.' : 'No attempts yet.'}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  ) : (
    <Table
      dataSource={results}
      columns={resultColumns}
      rowKey="student"
      size="small"
      pagination={false}
      data-testid="results-table"
    />
  );

  const items = statsLoading ? (
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
            // One collapsible panel per student attempt (collapsed by default — the
            // bucket holds every generated question in the course) with the full
            // question text rendered as Markdown instead of a clipped raw string.
            <Collapse
              size="small"
              data-testid="generated-question-items"
              items={groupByAttempt(s.items).map((g) => (
                {
                  key: g.key,
                  label: (
                    <Flex align="center" gap={8} wrap>
                      <Text strong>{g.student}</Text>
                      <Text type="secondary">attempt #{g.attemptNumber}</Text>
                      <Text type="secondary">
                        {g.items.length} {g.items.length === 1 ? 'question' : 'questions'}
                      </Text>
                      {g.pending > 0 ? (
                        <Tag color="gold" style={{ margin: 0 }}>{g.pending} pending</Tag>
                      ) : (
                        g.gradedN > 0 && <Text>{formatScore(g.earned, g.points)}</Text>
                      )}
                    </Flex>
                  ),
                  children: (
                    <Flex vertical gap={8}>
                      {g.items.map((it, i) => (
                        <div
                          key={it.key}
                          style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: '8px 12px' }}
                        >
                          <Flex align="center" gap={6} style={{ marginBottom: 6 }}>
                            <Text strong>Q{i + 1}</Text>
                            <Tag style={{ margin: 0 }}>{it.qtype.replace(/_/g, ' ')}</Tag>
                            <span style={{ flex: 1 }} />
                            {it.needsManualGrading ? (
                              <Tag color="gold" style={{ margin: 0 }}>pending</Tag>
                            ) : (
                              <Space size={6}>
                                {it.pointsEarned != null && <Text>{formatScore(it.pointsEarned, it.points)}</Text>}
                                {it.isCorrect === true && <Tag color="success" style={{ margin: 0 }}>correct</Tag>}
                                {it.isCorrect === false && <Tag color="error" style={{ margin: 0 }}>incorrect</Tag>}
                              </Space>
                            )}
                          </Flex>
                          <Markdown>{it.text}</Markdown>
                        </div>
                      ))}
                    </Flex>
                  ),
                }
              ))}
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

  return (
    <Flex vertical gap={12}>
      <Flex justify="flex-end" align="center" wrap gap={8}>
        {sectionFilter}
        {view === 'results' && (
          <CPButton
            cpType="default"
            icon={<DownloadOutlined />}
            onClick={exportCsv}
            disabled={results.length === 0}
            data-testid="results-export"
          >
            Export CSV
          </CPButton>
        )}
        {view === 'results' && adminActions && onResetAll && (
          <CPButton
            cpType="danger"
            onClick={onResetAll}
            disabled={acting || results.length === 0}
            data-testid="results-reset-all"
          >
            Reset all attempts
          </CPButton>
        )}
      </Flex>
      <Tabs
        activeKey={view}
        onChange={(k) => setView(k as 'results' | 'items')}
        items={[
          { key: 'results', label: 'Results', children: results_ },
          { key: 'items', label: 'Item analysis', children: items },
        ]}
      />
    </Flex>
  );
};

export default GradingOverview;
