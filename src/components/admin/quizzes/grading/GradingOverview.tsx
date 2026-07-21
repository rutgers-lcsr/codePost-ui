// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The analytics side of quiz grading, separated from the grading flow: a per-student Results
// report (with CSV export) and per-question Item analysis. Both respect the section filter.
import * as React from 'react';
import { Empty, Flex, Progress, Space, Spin, Table, Tabs, Tag, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import CPButton from '../../../core/CPButton';
import { Quiz, QuizResultRow, StaffQuizAttempt, QuestionTypeEnum } from '../../../../api-client';
import { formatScore } from '../../../core/questionMeta';
import { GradingStatusTag, PassedTag } from '../quizTags';
import { CodePostDate } from '../../../utils/CodepostDate';

const { Text } = Typography;

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
    { title: 'Attempts', dataIndex: 'attemptsUsed', key: 'attemptsUsed', width: 90 },
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
      width: 120,
      render: (_: unknown, r: QuizResultRow) => (
        <CPButton small onClick={() => onOpenAttempt(r.student)} data-testid="result-view-attempt">
          View attempt
        </CPButton>
      ),
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

  const results_ = resultsLoading ? (
    <Flex justify="center" style={{ padding: 40 }}>
      <Spin />
    </Flex>
  ) : results.length === 0 ? (
    <Empty
      description={hasSection ? 'No results in this section.' : 'No submitted attempts yet.'}
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
