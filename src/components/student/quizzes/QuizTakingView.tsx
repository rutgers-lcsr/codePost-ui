// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Flex, Popconfirm, Progress, Result, Spin, Tag, Typography, message } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizAttemptsApi } from '../../../api-client/clients';
import { StudentQuizAttempt } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { studentKeys } from '../../../lib/queryKeys';
import { bySortKey } from '../../core/questionMeta';
import { AnswerValue, initialAnswer } from './QuestionAnswerer';
import QuizQuestions from './QuizQuestions';
import QuizResults from './QuizResults';

const { Title, Text } = Typography;

interface IProps {
  quizId: number;
  courseId: number;
  quizTitle?: string;
  /** Review a past submitted attempt instead of starting/resuming one. */
  reviewOnly?: boolean;
  onExit: () => void;
}

const formatRemaining = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const saveAnswer = (attemptId: number, responseId: number, val: AnswerValue) =>
  quizAttemptsApi.saveAnswerPartialUpdate({
    id: attemptId,
    patchedSaveQuizAnswerRequest: {
      response: responseId,
      answerText: val.answerText,
      selectedChoices: val.selectedChoices,
    },
  });

const QuizTakingView: React.FC<IProps> = ({ quizId, courseId, quizTitle, reviewOnly = false, onExit }) => {
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = React.useState<StudentQuizAttempt | null>(null);
  const [answers, setAnswers] = React.useState<Record<number, AnswerValue>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [savingCount, setSavingCount] = React.useState(0);
  const [nowMs, setNowMs] = React.useState(Date.now());

  const startedRef = React.useRef(false);
  const timers = React.useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  // Local edits not yet confirmed saved, keyed by response id. The submit flush sends ONLY
  // these: re-saving an already-persisted earlier answer would trip the server's
  // no-backtracking guard (sortKey < furthestIndex ⇒ 400) and wrongly abort the submit.
  const unsavedRef = React.useRef<Record<number, AnswerValue>>({});
  // Server-clock anchor: the server's time at load + how long ago (locally measured) we got it.
  const anchorRef = React.useRef<{ serverMs: number; localMs: number } | null>(null);

  const submitted = attempt?.status === 'submitted';

  const applyAttempt = React.useCallback((a: StudentQuizAttempt) => {
    setAttempt(a);
    if (a.serverNow) {
      anchorRef.current = { serverMs: new Date(a.serverNow).getTime(), localMs: Date.now() };
    }
    const next: Record<number, AnswerValue> = {};
    for (const r of a.responses) {
      next[r.id] = initialAnswer(r);
    }
    setAnswers(next);
  }, []);

  // Loads the student's submitted attempts (newest first); applies the latest when asked.
  // Fetched through the query cache so QuizResults' useMyAttempts reuses it without a refetch.
  const loadSubmitted = React.useCallback(
    async (applyLatest: boolean): Promise<boolean> => {
      const mine = await queryClient.fetchQuery({
        queryKey: studentKeys.quizAttempts(quizId),
        queryFn: () => quizAttemptsApi.myAttemptsList({ quiz: quizId }),
      });
      const past = mine
        .filter((a) => a.status === 'submitted')
        .sort((a, b) => (b.attemptNumber ?? 0) - (a.attemptNumber ?? 0));
      if (applyLatest && past.length > 0) {
        applyAttempt(past[0]);
      }
      return past.length > 0;
    },
    [quizId, applyAttempt, queryClient],
  );

  // Start (or resume) the attempt once on mount — or, in review mode, load past attempts.
  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        if (reviewOnly) {
          if (!(await loadSubmitted(true))) {
            setError('You have no submitted attempts to review yet.');
          }
          return;
        }
        const a = await quizAttemptsApi.create({ startQuizAttemptRequest: { quiz: quizId } });
        applyAttempt(a);
      } catch (e) {
        // Can't start (e.g. no attempts remaining) — fall back to reviewing the latest submitted attempt.
        try {
          if (await loadSubmitted(true)) {
            return;
          }
        } catch {
          /* fall through to the error below */
        }
        setError(apiErrorMessage(e) ?? 'This quiz could not be started.');
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId, reviewOnly, applyAttempt, loadSubmitted]);

  // Tick the clock while taking.
  React.useEffect(() => {
    if (submitted) return undefined;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  // Warn on tab close with unsaved edits.
  React.useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!submitted && Object.keys(unsavedRef.current).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [submitted]);

  const scheduleSave = (responseId: number, val: AnswerValue) => {
    if (!attempt) return;
    if (timers.current[responseId]) clearTimeout(timers.current[responseId]);
    timers.current[responseId] = setTimeout(async () => {
      setSavingCount((c) => c + 1);
      try {
        await saveAnswer(attempt.id, responseId, val);
        // Saved — unless the student typed again while this request was in flight.
        if (unsavedRef.current[responseId] === val) delete unsavedRef.current[responseId];
      } catch (e) {
        message.error(apiErrorMessage(e) ?? 'Failed to save your answer.');
      } finally {
        setSavingCount((c) => c - 1);
      }
    }, 600);
  };

  const handleChange = (responseId: number, val: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [responseId]: val }));
    unsavedRef.current[responseId] = val;
    scheduleSave(responseId, val);
  };

  const handleSubmit = React.useCallback(async () => {
    if (!attempt || submitting || attempt.status === 'submitted') return;
    setSubmitting(true);
    Object.values(timers.current).forEach(clearTimeout);
    try {
      // Flush answers with unsaved local edits, then finalize. A failed save must abort the
      // submit — grading reads the server-side answers, so submitting anyway would silently
      // drop whatever didn't save. Only unsaved edits are flushed: re-sending an already
      // persisted earlier answer would trip the server's no-backtracking guard and wrongly
      // abort the submit (edits to earlier questions can't exist unless backtracking is on).
      const unsaved = Object.entries(unsavedRef.current);
      await Promise.all(unsaved.map(([responseId, val]) => saveAnswer(attempt.id, Number(responseId), val)));
      unsavedRef.current = {};
      const done = await quizAttemptsApi.submitCreate({ id: attempt.id });
      applyAttempt(done);
      queryClient.invalidateQueries({ queryKey: studentKeys.availableQuizzes(courseId) });
      // Refreshes the attempt-history strip (QuizResults subscribes via useMyAttempts).
      queryClient.invalidateQueries({ queryKey: studentKeys.quizAttempts(quizId) });
    } catch (e) {
      message.error(apiErrorMessage(e) ?? 'Failed to submit your quiz.');
    } finally {
      setSubmitting(false);
    }
  }, [attempt, submitting, applyAttempt, queryClient, courseId, quizId]);

  // Auto-submit when the timer runs out. The countdown is anchored to the server clock
  // (serverNow at load + locally-measured elapsed) so a skewed device clock can't grant or
  // steal time; the server's saveAnswer grace lets the final flush land after 0:00.
  const deadlineMs = attempt?.deadline ? new Date(attempt.deadline).getTime() : null;
  const anchor = anchorRef.current;
  const estServerNowMs = anchor ? anchor.serverMs + (nowMs - anchor.localMs) : nowMs;
  const remainingMs = deadlineMs !== null ? Math.max(0, deadlineMs - estServerNowMs) : null;
  // One-shot per attempt: the effect re-runs whenever handleSubmit's identity changes
  // (e.g. `submitting` flips as the auto-submit starts), which would fire the warning
  // again while the attempt is still in_progress. If the auto-submit fails, the student
  // still sees the error and can submit manually (the server also auto-submits expired
  // attempts on resume).
  const autoSubmittedRef = React.useRef(false);
  React.useEffect(() => {
    autoSubmittedRef.current = false;
  }, [attempt?.id]);
  React.useEffect(() => {
    if (remainingMs === 0 && attempt?.status === 'in_progress' && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      message.warning('Time is up — submitting your quiz.');
      handleSubmit();
    }
  }, [remainingMs, attempt, handleSubmit]);

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 320 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (error || !attempt) {
    return (
      <Result
        status="warning"
        title="This quiz isn't available"
        subTitle={error ?? 'Please return to your course and try again.'}
        extra={
          <CPButton cpType="primary" onClick={onExit}>
            Back to course
          </CPButton>
        }
      />
    );
  }

  if (submitted) {
    return (
      <QuizResults
        quizId={quizId}
        courseId={courseId}
        attempt={attempt}
        quizTitle={quizTitle}
        onExit={onExit}
        onSelectAttempt={applyAttempt}
      />
    );
  }

  const responses = [...attempt.responses].sort(bySortKey);
  const answeredCount = responses.filter(
    (r) => (answers[r.id]?.answerText ?? '').trim() !== '' || (answers[r.id]?.selectedChoices.length ?? 0) > 0,
  ).length;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }} data-testid="quiz-taking">
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {quizTitle ?? 'Quiz'}
          </Title>
          <Text type="secondary">Attempt #{attempt.attemptNumber}</Text>
        </div>
        <Flex align="center" gap={12}>
          {savingCount > 0 ? (
            <Text type="secondary">Saving…</Text>
          ) : (
            <Text type="secondary">Saved</Text>
          )}
          {remainingMs !== null && (
            <Tag
              color={remainingMs < 60000 ? 'red' : 'blue'}
              icon={<ClockCircleOutlined />}
              style={{ fontSize: 14 }}
              data-testid="quiz-timer"
            >
              {formatRemaining(remainingMs)}
            </Tag>
          )}
        </Flex>
      </Flex>

      <Progress
        percent={Math.round((answeredCount / Math.max(responses.length, 1)) * 100)}
        format={() => `${answeredCount}/${responses.length}`}
        style={{ marginBottom: 16 }}
      />

      <QuizQuestions
        responses={responses}
        value={(i) => answers[responses[i].id] ?? initialAnswer(responses[i])}
        onChange={(i, v) => handleChange(responses[i].id, v)}
        reveal={false}
        disabled={submitting}
        oneAtATime={!!attempt.oneQuestionAtATime}
        allowBack={!!attempt.allowBacktracking}
        submitSlot={
          <Popconfirm
            title="Submit this quiz?"
            description={
              answeredCount < responses.length
                ? `You've answered ${answeredCount} of ${responses.length}. You can't change answers after submitting.`
                : "You can't change answers after submitting."
            }
            okText="Submit"
            onConfirm={handleSubmit}
          >
            <CPButton cpType="primary" loading={submitting} data-testid="quiz-submit">
              Submit quiz
            </CPButton>
          </Popconfirm>
        }
      />
    </div>
  );
};

export default QuizTakingView;
