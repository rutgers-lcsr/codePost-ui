// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Flex, Result, Tag, Typography } from 'antd';
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
    // Mirrors the server's official_score: submitted, fully graded attempts only.
    const policy = quizMeta?.scoringPolicy ?? 'highest';
    if (policy === 'average') return null;
    const graded = pastAttempts.filter((a) => a.score != null && !a.needsManualGrading);
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

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }} data-testid="quiz-results">
      <CPButton cpType="link" onClick={onExit}>
        <LeftOutlined /> Back to course
      </CPButton>
      <ResultsSummary attempt={attempt} title={quizTitle} />
      {pastAttempts.length > 1 && (
        <Flex gap={8} wrap align="center" justify="center" style={{ marginBottom: 12 }} data-testid="attempt-history">
          <Text type="secondary">Attempts:</Text>
          {pastAttempts.map((a) => (
            <Tag.CheckableTag key={a.id} checked={a.id === attempt.id} onChange={() => onSelectAttempt(a)}>
              #{a.attemptNumber}
              {a.score != null ? ` · ${Number(a.score)}/${Number(a.maxScore)}` : ''}
              {countingAttemptId === a.id ? ' · counts' : ''}
            </Tag.CheckableTag>
          ))}
          {quizMeta?.scoringPolicy === 'average' && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Final score is the average of all attempts.
            </Text>
          )}
        </Flex>
      )}
      {/* The student's own answers (and any grader feedback) always show; correct-answer
          markers inside follow the quiz's reveal policy. */}
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
    </div>
  );
};

const ResultsSummary: React.FC<{ attempt: StudentQuizAttempt; title?: string }> = ({ attempt, title }) => {
  const score = attempt.score ?? 0;
  const max = attempt.maxScore ?? 0;
  const pct = max > 0 ? Math.round((Number(score) / Number(max)) * 100) : null;
  const statusTitle = attempt.needsManualGrading
    ? 'Submitted — some answers await grading'
    : `You scored ${score} / ${max}${pct !== null ? ` (${pct}%)` : ''}`;
  const resultStatus = attempt.needsManualGrading ? 'info' : attempt.passed === false ? 'warning' : 'success';

  return (
    <Result
      status={resultStatus}
      title={title ?? 'Quiz submitted'}
      subTitle={<span data-testid="quiz-score">{statusTitle}</span>}
      extra={
        attempt.passed === true ? (
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
