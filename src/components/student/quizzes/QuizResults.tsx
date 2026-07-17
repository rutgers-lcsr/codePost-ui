// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Button, Card, Result, Table, Tag, Typography } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import { StudentQuizAttempt } from '../../../api-client';
import { bySortKey } from '../../core/questionMeta';
import QuestionAnswerer, { initialAnswer } from './QuestionAnswerer';
import { useAvailableQuizzes, useMyAttempts } from './queries';

const { Text } = Typography;

interface IProps {
  quizId: number;
  courseId: number;
  /** The submitted attempt being viewed. */
  attempt: StudentQuizAttempt;
  quizTitle?: string;
  onExit: () => void;
  /** Switch the view to another submitted attempt (from the history strip). */
  onSelectAttempt: (a: StudentQuizAttempt) => void;
}

/** The post-submit / review screen: score summary, attempt-history strip, and the student's
 *  answers (with grader feedback and, per the quiz's reveal policy, correctness markers). */
const QuizResults: React.FC<IProps> = ({ quizId, courseId, attempt, quizTitle, onExit, onSelectAttempt }) => {
  // The student's submitted attempts (newest first) — the review history strip. Subscribed
  // via react-query, so the post-submit invalidation in QuizTakingView refreshes it.
  const { data: myAttempts } = useMyAttempts(quizId);
  const pastAttempts = React.useMemo(
    () =>
      (myAttempts ?? [])
        .filter((a) => a.status === 'submitted')
        .sort((a, b) => (b.attemptNumber ?? 0) - (a.attemptNumber ?? 0)),
    [myAttempts],
  );

  // Quiz metadata (scoring policy) for the history strip — served from the course's cached
  // availableQuizzes list, which the student almost always arrived through.
  const { data: courseQuizzes } = useAvailableQuizzes(courseId);
  const quizMeta = courseQuizzes?.find((q) => q.id === quizId);
  const countingAttemptId = React.useMemo(() => {
    // Mirrors the server's official_score: submitted, fully graded attempts only, with a
    // staff-pinned attempt overriding the scoring policy outright.
    const graded = pastAttempts.filter((a) => a.score != null && !a.needsManualGrading);
    const pinned = graded.find((a) => a.isOfficialOverride);
    if (pinned) return pinned.id;
    const policy = quizMeta?.scoringPolicy ?? 'highest';
    if (policy === 'average') return null;
    if (graded.length === 0) return null;
    if (policy === 'latest') {
      return graded.reduce((x, y) => ((y.attemptNumber ?? 0) > (x.attemptNumber ?? 0) ? y : x)).id;
    }
    const ratio = (a: StudentQuizAttempt) =>
      Number(a.maxScore) > 0 ? Number(a.score) / Number(a.maxScore) : 0;
    return graded.reduce((x, y) => (ratio(y) > ratio(x) ? y : x)).id;
  }, [pastAttempts, quizMeta?.scoringPolicy]);

  const responses = [...attempt.responses].sort(bySortKey);
  const answersRevealed = responses.some((r) => r.isCorrect !== undefined);

  // Move focus to the results heading when the page appears (after submit, or on a review
  // deep-link) so keyboard/SR users aren't left on the now-unmounted Submit control.
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 24 }} data-testid="quiz-results">
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        {quizTitle ? `${quizTitle} — results` : 'Quiz results'}
      </h1>
      <CPButton cpType="link" icon={<LeftOutlined />} onClick={onExit}>
        Back to course
      </CPButton>
      <ResultsSummary attempt={attempt} title={quizTitle} />
      {pastAttempts.length >= 1 && (
        <Card size="small" title="Your attempts" style={{ marginBottom: 12 }} data-testid="attempt-history">
          <Table<StudentQuizAttempt>
            size="small"
            pagination={false}
            rowKey={(a) => a.id}
            dataSource={pastAttempts}
            rowClassName={(a) => (a.id === attempt.id ? 'ant-table-row-selected' : '')}
            onRow={(a) => ({
              onClick: () => onSelectAttempt(a),
              style: { cursor: 'pointer' },
              'data-testid': 'attempt-history-row',
            })}
            columns={[
              {
                title: 'Attempt',
                dataIndex: 'attemptNumber',
                // Focusable control gives keyboard/SR users a path to open a past attempt;
                // the row-wide onClick above stays as a mouse convenience.
                render: (n: number, a) => (
                  <Button
                    type="text"
                    size="small"
                    onClick={() => onSelectAttempt(a)}
                    aria-current={a.id === attempt.id ? 'true' : undefined}
                    style={{ padding: 0, height: 'auto', fontWeight: a.id === attempt.id ? 600 : 400 }}
                  >
                    #{n}
                  </Button>
                ),
              },
              {
                title: 'Submitted',
                dataIndex: 'submittedAt',
                render: (d: string | null) =>
                  d
                    ? new Date(d).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : '—',
              },
              {
                title: 'Score',
                dataIndex: 'score',
                render: (s: string | null, a) => (s != null ? `${Number(s)} / ${Number(a.maxScore)}` : '—'),
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, a) => (
                  <>
                    {a.needsManualGrading ? (
                      <Tag color="gold">Pending grading</Tag>
                    ) : a.passed === true ? (
                      <Tag color="success">Passed</Tag>
                    ) : a.passed === false ? (
                      <Tag color="error">Did not pass</Tag>
                    ) : null}
                    {countingAttemptId === a.id && <Tag>Counts toward grade</Tag>}
                  </>
                ),
              },
            ]}
          />
          {quizMeta?.scoringPolicy === 'average' && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Final score is the average of all attempts.
            </Text>
          )}
        </Card>
      )}
      {/* The question review (the student's answers, grader feedback, and — per the reveal
          policy — correctness markers). Scores-only quizzes never send it back after submit. */}
      {attempt.showResponses === false ? (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          data-testid="quiz-review-hidden"
          message="Answer review isn't available for this quiz — your instructor shares scores only."
        />
      ) : (
        <div style={{ marginTop: 16 }}>
          {responses.map((r, i) => (
            <QuestionAnswerer
              key={r.id}
              response={r}
              index={i}
              value={initialAnswer(r)}
              disabled
              reveal={answersRevealed}
              onChange={() => undefined}
            />
          ))}
        </div>
      )}
    </main>
  );
};

const ResultsSummary: React.FC<{ attempt: StudentQuizAttempt; title?: string }> = ({ attempt, title }) => {
  // The server omits score fields on a submitted attempt only while results are sealed
  // (answers show after close, and the quiz hasn't closed yet) — pending manual grading
  // is signaled separately via needsManualGrading.
  const sealed = attempt.score == null && !attempt.needsManualGrading;
  const score = attempt.score ?? 0;
  const max = attempt.maxScore ?? 0;
  const pct = max > 0 ? Math.round((Number(score) / Number(max)) * 100) : null;
  const statusTitle = sealed
    ? 'Submitted — results will be available after the quiz closes'
    : attempt.needsManualGrading
    ? 'Submitted — some answers await grading'
    : `You scored ${score} / ${max}${pct !== null ? ` (${pct}%)` : ''}`;
  const resultStatus = sealed || attempt.needsManualGrading ? 'info' : attempt.passed === false ? 'warning' : 'success';

  return (
    <Result
      status={resultStatus}
      title={title ?? 'Quiz submitted'}
      subTitle={<span data-testid="quiz-score">{statusTitle}</span>}
      extra={
        sealed ? (
          <Alert
            type="info"
            showIcon
            data-testid="quiz-result-status"
            message="Your answers were recorded. Scores and correct answers stay hidden until the quiz closes."
          />
        ) : attempt.passed === true ? (
          <Tag color="success" data-testid="quiz-result-status">
            Passed
          </Tag>
        ) : attempt.passed === false ? (
          <Tag color="error" data-testid="quiz-result-status">
            Did not pass
          </Tag>
        ) : attempt.needsManualGrading ? (
          <Alert
            type="info"
            showIcon
            data-testid="quiz-result-status"
            message="Your final score will be available once grading is complete."
          />
        ) : null
      }
    />
  );
};

export default QuizResults;
