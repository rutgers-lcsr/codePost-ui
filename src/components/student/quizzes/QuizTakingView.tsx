// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Flex, Input, Modal, Popconfirm, Progress, Result, Spin, Tag, Typography, message } from 'antd';
import { ClockCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import Markdown from '../../core/Markdown';
import { quizAttemptsApi } from '../../../api-client/clients';
import { StudentQuizAttempt } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { studentKeys } from '../../../lib/queryKeys';
import { parseAccessCode403 } from './accessCode';
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
  /** Notified when the view lands on a submitted attempt (submit, expired resume, or the
   *  review fallback) so the /take URL can be rewritten to /review before any refresh. */
  onSubmitted?: () => void;
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

const QuizTakingView: React.FC<IProps> = ({ quizId, courseId, quizTitle, reviewOnly = false, onSubmitted, onExit }) => {
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = React.useState<StudentQuizAttempt | null>(null);
  const [answers, setAnswers] = React.useState<Record<number, AnswerValue>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [savingCount, setSavingCount] = React.useState(0);
  const [nowMs, setNowMs] = React.useState(Date.now());
  // Screen-reader time-warning text (the visible countdown is a silent role="timer").
  const [timeAnnounce, setTimeAnnounce] = React.useState('');
  // Late-access-code flow: a closed quiz the instructor gated with a code. The start call 403s
  // with { accessCodeRequired: true } until the right code is supplied.
  const [codeRequired, setCodeRequired] = React.useState(false);
  const [accessCode, setAccessCode] = React.useState('');
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [startingWithCode, setStartingWithCode] = React.useState(false);
  // Safe Exam Browser flow: the quiz requires SEB and this request lacked a valid SEB
  // signature. Before an attempt exists this renders a full gate screen; mid-attempt
  // (e.g. the requirement was switched on, or the SEB session broke) it's a blocking modal.
  const [lockdownBlocked, setLockdownBlocked] = React.useState(false);
  const [retryingLockdown, setRetryingLockdown] = React.useState(false);

  const startedRef = React.useRef(false);
  const timers = React.useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  // Local edits not yet confirmed saved, keyed by response id. The submit flush sends ONLY
  // these: re-saving an already-persisted earlier answer would trip the server's
  // no-backtracking guard (sortKey < furthestIndex ⇒ 400) and wrongly abort the submit.
  const unsavedRef = React.useRef<Record<number, AnswerValue>>({});
  // Server-clock anchor: the server's time at load + how long ago (locally measured) we got it.
  const anchorRef = React.useRef<{ serverMs: number; localMs: number } | null>(null);
  // Remaining-time thresholds already announced to screen readers this attempt.
  const announcedThresholds = React.useRef<Set<number>>(new Set());

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

  // Start (or resume) the attempt, optionally with a late-access code. Clears the code prompt
  // and refreshes the card on success.
  const startAttempt = React.useCallback(
    async (code?: string) => {
      const trimmed = code?.trim();
      const a = await quizAttemptsApi.create({
        startQuizAttemptRequest: trimmed ? { quiz: quizId, accessCode: trimmed } : { quiz: quizId },
      });
      applyAttempt(a);
      setCodeRequired(false);
      setCodeError(null);
      // The attempt now exists — refresh the card so it shows Resume, not the code button.
      queryClient.invalidateQueries({ queryKey: studentKeys.availableQuizzes(courseId) });
      // Resuming an expired attempt auto-submits it server-side — land on /review.
      if (a.status === 'submitted') onSubmitted?.();
    },
    [quizId, applyAttempt, queryClient, courseId, onSubmitted],
  );

  // Submit the entered late-access code and start the attempt with it.
  const handleCodeSubmit = React.useCallback(async () => {
    const code = accessCode.trim();
    if (!code) {
      setCodeError('Enter the access code your instructor gave you.');
      return;
    }
    setStartingWithCode(true);
    setCodeError(null);
    try {
      await startAttempt(code);
    } catch (e) {
      const body = await parseAccessCode403(e);
      if (body?.accessCodeRequired) {
        setCodeError("That access code isn't valid. Check with your instructor and try again.");
      } else {
        // A different refusal (e.g. no attempts remaining) — surface the server's reason.
        setCodeError(body?.detail ?? apiErrorMessage(e) ?? 'This quiz could not be started.');
      }
    } finally {
      setStartingWithCode(false);
    }
  }, [accessCode, startAttempt]);

  // One-click SEB launch from the gate screen: the server generates a .seb config whose
  // startURL carries a one-time login token, and the seb(s):// URL hands it to the
  // installed SEB, which opens a fresh session and lands back on this quiz.
  const [launchingSeb, setLaunchingSeb] = React.useState(false);
  const [sebConfigUrl, setSebConfigUrl] = React.useState<string | null>(null);
  const launchSeb = React.useCallback(async () => {
    setLaunchingSeb(true);
    try {
      const resp = await quizAttemptsApi.sebLaunchCreate({ sebLaunchRequest: { quiz: quizId } });
      setSebConfigUrl(resp.configUrl);
      // Hand off to SEB; this normal-browser tab stays parked on the gate screen.
      window.location.href = resp.sebUrl;
    } catch (e) {
      message.error(apiErrorMessage(e) ?? 'Could not prepare the Safe Exam Browser launch.');
    } finally {
      setLaunchingSeb(false);
    }
  }, [quizId]);

  // Retry starting after the SEB gate: succeeds once the page is open inside Safe Exam
  // Browser (create resumes an in-progress attempt, so this is safe at any point).
  const retryLockdown = React.useCallback(async () => {
    setRetryingLockdown(true);
    try {
      await startAttempt();
      setLockdownBlocked(false);
    } catch (e) {
      const body = await parseAccessCode403(e);
      if (body?.lockdownRequired) {
        message.warning("Still blocked — make sure you're viewing this page inside Safe Exam Browser.");
      } else {
        // A different refusal (e.g. the quiz closed meanwhile) — surface it as the page error.
        setLockdownBlocked(false);
        setError(body?.detail ?? apiErrorMessage(e) ?? 'This quiz could not be started.');
      }
    } finally {
      setRetryingLockdown(false);
    }
  }, [startAttempt]);

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
        await startAttempt();
      } catch (e) {
        // A closed quiz gated by a late-access code asks for the code instead of erroring.
        const body = await parseAccessCode403(e);
        if (body?.lockdownRequired) {
          setLockdownBlocked(true);
          return;
        }
        if (body?.accessCodeRequired) {
          setCodeRequired(true);
          return;
        }
        // Can't start (e.g. no attempts remaining) — fall back to reviewing the latest submitted attempt.
        try {
          if (await loadSubmitted(true)) {
            onSubmitted?.();
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
  }, [reviewOnly, startAttempt, loadSubmitted, onSubmitted]);

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
        const body = await parseAccessCode403(e);
        if (body?.lockdownRequired) {
          setLockdownBlocked(true);
        } else {
          message.error(apiErrorMessage(e) ?? 'Failed to save your answer.');
        }
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
    const attemptId = attempt.id;
    Object.values(timers.current).forEach(clearTimeout);

    // Finalize against the server-persisted answers. Kept separate so a failed pre-flush can
    // fall back to it rather than trapping the student in a retry loop.
    const finalize = async () => {
      setSubmitting(true);
      try {
        const done = await quizAttemptsApi.submitCreate({ id: attemptId });
        applyAttempt(done);
        onSubmitted?.();
        queryClient.invalidateQueries({ queryKey: studentKeys.availableQuizzes(courseId) });
        // Refreshes the attempt-history strip (QuizResults subscribes via useMyAttempts).
        queryClient.invalidateQueries({ queryKey: studentKeys.quizAttempts(quizId) });
      } catch (e) {
        const body = await parseAccessCode403(e);
        if (body?.lockdownRequired) {
          setLockdownBlocked(true);
        } else {
          message.error(apiErrorMessage(e) ?? 'Failed to submit your quiz.');
        }
      } finally {
        setSubmitting(false);
      }
    };

    setSubmitting(true);
    try {
      // Flush answers with unsaved local edits first. Only unsaved edits are flushed: re-sending
      // an already-persisted earlier answer would trip the server's no-backtracking guard.
      const unsaved = Object.entries(unsavedRef.current);
      await Promise.all(unsaved.map(([responseId, val]) => saveAnswer(attemptId, Number(responseId), val)));
      unsavedRef.current = {};
    } catch {
      // A save failed — don't trap the student. Let them submit with the answers the server
      // already has (unsaved edits to the current question may be lost).
      setSubmitting(false);
      Modal.confirm({
        title: 'Some answers could not be saved',
        content: 'Submit with your last saved answers? Unsaved edits to the current question may be lost.',
        okText: 'Submit anyway',
        cancelText: 'Keep editing',
        onOk: finalize,
      });
      return;
    }
    await finalize();
  }, [attempt, submitting, applyAttempt, queryClient, courseId, quizId, onSubmitted]);

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
    announcedThresholds.current = new Set();
    setTimeAnnounce('');
  }, [attempt?.id]);
  React.useEffect(() => {
    if (remainingMs !== 0 || attempt?.status !== 'in_progress' || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    (async () => {
      // Re-sync before force-submitting: the deadline may have moved since load (the
      // instructor extended the time limit or close, or granted an accommodation), and
      // submitting on the stale countdown would steal the added time.
      try {
        const fresh = await quizAttemptsApi.retrieve({ id: attempt.id });
        if (fresh.status === 'submitted') {
          // Already finalized server-side — show the results.
          applyAttempt(fresh);
          onSubmitted?.();
          return;
        }
        if ((fresh.deadline ?? null) !== (attempt.deadline ?? null)) {
          // Adopt the new deadline (or its removal) and keep going.
          if (fresh.serverNow) {
            anchorRef.current = { serverMs: new Date(fresh.serverNow).getTime(), localMs: Date.now() };
          }
          setAttempt((prev) => (prev ? { ...prev, deadline: fresh.deadline } : prev));
          autoSubmittedRef.current = false;
          return;
        }
      } catch {
        /* can't re-check — submit on the local countdown */
      }
      message.warning('Time is up — submitting your quiz.');
      setTimeAnnounce('Time is up. Submitting your quiz.');
      handleSubmit();
    })();
  }, [remainingMs, attempt, handleSubmit, applyAttempt, onSubmitted]);

  // Announce remaining-time milestones to screen readers — the visible countdown is a
  // role="timer", which AT keep silent by design, so a per-tick live region would be noise.
  React.useEffect(() => {
    if (remainingMs === null || submitted) return;
    for (const at of [300000, 60000, 30000]) {
      if (remainingMs <= at && !announcedThresholds.current.has(at)) {
        announcedThresholds.current.add(at);
        setTimeAnnounce(
          at >= 60000 ? `${at / 60000} minute${at === 60000 ? '' : 's'} remaining.` : `${at / 1000} seconds remaining.`,
        );
      }
    }
  }, [remainingMs, submitted]);

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 320 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  // A SEB-required quiz opened outside Safe Exam Browser: explain instead of erroring out.
  if (!attempt && lockdownBlocked) {
    return (
      <Result
        icon={<LockOutlined />}
        title="Safe Exam Browser required"
        subTitle="Your instructor requires this quiz to be taken in Safe Exam Browser. With SEB installed, Launch opens the quiz in it directly; this tab stays here."
        extra={
          <Flex vertical gap={12} align="center">
            <Flex gap={8} wrap justify="center">
              <CPButton
                cpType="primary"
                loading={launchingSeb}
                onClick={launchSeb}
                data-testid="quiz-seb-launch"
              >
                Launch in Safe Exam Browser
              </CPButton>
              <CPButton
                cpType="secondary"
                loading={retryingLockdown}
                onClick={retryLockdown}
                data-testid="quiz-seb-retry"
              >
                I'm in Safe Exam Browser — try again
              </CPButton>
              <CPButton
                cpType="secondary"
                onClick={() => window.open('https://safeexambrowser.org/download_en.html', '_blank', 'noopener')}
              >
                Download Safe Exam Browser
              </CPButton>
              <CPButton cpType="secondary" onClick={onExit}>
                Back to course
              </CPButton>
            </Flex>
            {sebConfigUrl && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                SEB didn't open? <a href={sebConfigUrl}>Download the exam configuration</a> and open the
                file with Safe Exam Browser.
              </Text>
            )}
          </Flex>
        }
      />
    );
  }

  // A closed quiz gated by a late-access code: prompt for the code instead of erroring out.
  if (!attempt && codeRequired) {
    return (
      <Result
        icon={<LockOutlined />}
        title="This quiz has closed"
        subTitle="Enter the access code your instructor gave you to start the quiz."
        extra={
          <Flex vertical gap={12} align="center" style={{ maxWidth: 320, margin: '0 auto' }}>
            <Input
              aria-label="Access code"
              placeholder="Access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onPressEnter={handleCodeSubmit}
              disabled={startingWithCode}
              data-testid="quiz-access-code-input"
            />
            {codeError && (
              <Alert
                type="error"
                showIcon
                message={codeError}
                style={{ width: '100%' }}
                data-testid="quiz-access-code-error"
              />
            )}
            <Flex gap={8}>
              <CPButton
                cpType="primary"
                loading={startingWithCode}
                onClick={handleCodeSubmit}
                data-testid="quiz-access-code-submit"
              >
                Start quiz
              </CPButton>
              <CPButton cpType="secondary" onClick={onExit}>
                Back to course
              </CPButton>
            </Flex>
          </Flex>
        }
      />
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

  // Review disabled: the student can't reopen the submission, so land on a confirmation
  // rather than the results/review screen (the server also blocks reopening it).
  if (submitted && attempt.allowSubmissionReview === false) {
    return (
      <Result
        status="success"
        title="Your responses were submitted"
        subTitle="This quiz doesn't allow reviewing past submissions."
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
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 24 }} data-testid="quiz-taking">
      {/* Assertive SR region for time-remaining warnings and the time-up notice. */}
      <Text className="sr-only" aria-live="assertive">
        {timeAnnounce}
      </Text>
      {/* Mid-attempt SEB block: the requirement was switched on, or the SEB session broke.
          Saved answers are safe server-side; the next save/submit retries after closing. */}
      <Modal
        open={lockdownBlocked}
        title="Safe Exam Browser required"
        onOk={() => setLockdownBlocked(false)}
        onCancel={() => setLockdownBlocked(false)}
        okText="Continue"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        Your last action was blocked because this quiz must be taken in Safe Exam Browser. Your
        saved answers are kept — return to Safe Exam Browser (or ask your instructor for help) and
        continue from there.
      </Modal>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <div>
          {/* h1: the quiz route renders as its own full page, outside the app shell. */}
          <Title level={1} style={{ margin: 0, fontSize: 24 }}>
            {attempt.title ?? quizTitle ?? 'Quiz'}
          </Title>
          <Text type="secondary">Attempt #{attempt.attemptNumber}</Text>
        </div>
        <Flex align="center" gap={12}>
          <Text type="secondary" role="status" aria-live="polite">
            {savingCount > 0 ? 'Saving…' : 'Saved'}
          </Text>
          {remainingMs !== null && (
            <Tag
              color={remainingMs < 60000 ? 'red' : 'blue'}
              icon={<ClockCircleOutlined />}
              style={{ fontSize: 14 }}
              data-testid="quiz-timer"
              role="timer"
              aria-label={`Time remaining: ${formatRemaining(remainingMs)}`}
            >
              {formatRemaining(remainingMs)}
            </Tag>
          )}
        </Flex>
      </Flex>

      {attempt.description && (
        <div style={{ marginBottom: 16 }}>
          <Markdown>{attempt.description}</Markdown>
        </div>
      )}

      <Progress
        percent={Math.round((answeredCount / Math.max(responses.length, 1)) * 100)}
        format={() => `${answeredCount}/${responses.length}`}
        // Name + real count for AT — the bare progressbar otherwise announces only "60".
        aria-label={`Questions answered: ${answeredCount} of ${responses.length}`}
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
    </main>
  );
};

export default QuizTakingView;
