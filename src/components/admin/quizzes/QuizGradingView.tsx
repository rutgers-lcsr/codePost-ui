// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Staff grading for a quiz, organized into two areas: **Grade** — a needs-grading queue that
// opens a full-screen drawer with the focused, one-response-at-a-time step-through grader
// ("Next" walks the whole pending queue; dirty grades save automatically on any navigation) —
// and **Overview** — the per-student Results report (CSV export) and per-question Item
// analysis. Access is enforced server-side (Course.quizGraders role or course admin); a 403
// here means the viewer lacks the role. Embedded as the quiz page's Grading tab and inline in
// the grader console; `active` gates the queries.
import * as React from 'react';
import { Alert, Drawer, Flex, Select, Spin, Tabs, Typography, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { quizAttemptsApi } from '../../../api-client/clients';
import { Quiz, StaffQuizAttempt } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { useApiAction } from '../../../hooks/useApiAction';
import { useQuizAttempts, useQuizResults, useStaffSections } from './queries';
import { bySortKey } from '../../core/questionMeta';
import { buildGradingQueue, nextInQueue, queuePosition } from './grading/gradingQueue';
import GradingQueue from './grading/GradingQueue';
import FocusedGrader from './grading/FocusedGrader';
import { GradeControlsHandle } from './grading/GradeControls';
import GradingOverview from './grading/GradingOverview';

const { Text } = Typography;

interface IProps {
  quiz: Quiz;
  /** Whether this view is the visible tab/screen — gates all data fetching. */
  active: boolean;
}

/** The response to open first when grading an attempt: the first pending one, else the first. */
const firstToGrade = (a: StaffQuizAttempt): number | undefined => {
  const sorted = [...a.responses].sort(bySortKey);
  return (sorted.find((r) => r.needsManualGrading) ?? sorted[0])?.id;
};

const QuizGradingView: React.FC<IProps> = ({ quiz, active }) => {
  const queryClient = useQueryClient();
  const [topTab, setTopTab] = React.useState('grade');
  const [showGraded, setShowGraded] = React.useState(false);
  // The attempt currently open in the focused grader (a local copy so grade/run/pin updates
  // reflect immediately), and which of its responses is focused. null ⇒ the queue landing.
  const [current, setCurrent] = React.useState<StaffQuizAttempt | null>(null);
  const [focusId, setFocusId] = React.useState<number | null>(null);

  // One unfiltered fetch of every submitted attempt drives the queue, the focused grader pool,
  // and item analysis; the needs-grading subset is derived from the attempt-level flag.
  const { data: allAttempts = [], isLoading, error } = useQuizAttempts(quiz.id, { enabled: active });
  const { data: results = [], isLoading: resultsLoading } = useQuizResults(quiz.id, active);

  // Section filter: a grader picks their section and sees only those students' attempts and
  // results. Filtered client-side from the section rosters (attempt rows carry the student
  // email). The choice persists per course (localStorage), so a grader stays on their section
  // across quiz switches and page reloads until they change it themselves.
  const sectionStorageKey = `quizGradingSection.${quiz.course}`;
  const [sectionId, setSectionId] = React.useState<number | null>(() => {
    const stored = Number(localStorage.getItem(sectionStorageKey));
    return localStorage.getItem(sectionStorageKey) != null && !Number.isNaN(stored) ? stored : null;
  });
  const pickSection = (id: number | null) => {
    setSectionId(id);
    if (id == null) localStorage.removeItem(sectionStorageKey);
    else localStorage.setItem(sectionStorageKey, String(id));
  };
  const { data: sections = [], isFetched: sectionsFetched } = useStaffSections(quiz.course, active);
  // A persisted section that no longer exists (deleted, grader unassigned) falls back to All.
  React.useEffect(() => {
    if (sectionsFetched && sectionId != null && !sections.some((s) => s.id === sectionId)) pickSection(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsFetched, sections, sectionId]);
  const sectionEmails = React.useMemo(() => {
    if (sectionId == null) return null;
    const section = sections.find((s) => s.id === sectionId);
    // Until the rosters load, filter to nothing rather than briefly leaking every section
    // into the queue (a fast "Start grading" click must never pull another section's student).
    return section ? new Set((section.students ?? []).map(String)) : new Set<string>();
  }, [sectionId, sections]);
  const visibleAttempts = sectionEmails ? allAttempts.filter((a) => sectionEmails.has(a.student)) : allAttempts;
  const visibleResults = sectionEmails ? results.filter((r) => sectionEmails.has(r.student)) : results;

  const queue = React.useMemo(() => buildGradingQueue(visibleAttempts), [visibleAttempts]);
  const queueListAttempts = showGraded ? visibleAttempts : visibleAttempts.filter((a) => a.needsManualGrading);

  const sectionFilter = sections.length > 0 ? (
    <Select
      size="small"
      aria-label="Filter by section"
      style={{ minWidth: 160 }}
      value={sectionId ?? 'all'}
      onChange={(v) => pickSection(v === 'all' ? null : Number(v))}
      options={[
        { value: 'all' as const, label: 'All sections' },
        ...sections.map((s) => ({ value: s.id, label: s.name })),
      ]}
      popupMatchSelectWidth={false}
      data-testid="grading-section-filter"
    />
  ) : null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.attempts(quiz.id!) });
    queryClient.invalidateQueries({ queryKey: quizKeys.results(quiz.id!) });
  };

  const handleGraded = (updated: StaffQuizAttempt) => {
    setCurrent(updated);
    refresh();
  };

  const openAttempt = (attempt: StaffQuizAttempt) => {
    setCurrent(attempt);
    setFocusId(firstToGrade(attempt) ?? null);
  };
  const startGrading = () => {
    const first = queue[0];
    if (!first) return;
    const attempt = visibleAttempts.find((a) => a.id === first.attemptId);
    if (attempt) {
      setCurrent(attempt);
      setFocusId(first.responseId);
    }
  };
  const exitGrading = () => {
    setCurrent(null);
    setFocusId(null);
  };
  // The grade editor's draft handle, owned here so closing the drawer (Esc, mask, back) can
  // flush too. Null while the focused response is auto-graded (no editor mounted).
  const gradeRef = React.useRef<GradeControlsHandle | null>(null);
  // Save-on-navigate for the exit paths (mirrors guardNav in FocusedGrader): flush a dirty
  // draft, stay open if the save failed, warn when a feedback-only draft is discarded.
  const guardedExit = async () => {
    const outcome = (await gradeRef.current?.flush()) ?? 'clean';
    if (outcome === 'failed') return;
    if (outcome === 'unsaveable') message.warning('Draft discarded — enter valid points to record a grade.');
    exitGrading();
  };
  // Advance to the next pending response (across attempts), or stay on a graded last item.
  // Runs in the click-handler closure, so `queue` is the pre-save snapshot — exactly what
  // nextInQueue() needs (the just-graded response must still be present to find its successor).
  const goNext = () => {
    const nx = focusId != null ? nextInQueue(queue, focusId) : queue[0];
    if (!nx) {
      message.success(
        sectionEmails != null
          ? 'All caught up in your section — nothing else there needs grading.'
          : 'All caught up — nothing else needs grading.',
      );
      return;
    }
    const attempt = visibleAttempts.find((a) => a.id === nx.attemptId);
    if (attempt) {
      setCurrent(attempt);
      setFocusId(nx.responseId);
    }
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

  // Open a student's attempt from a Results row: the attempt behind their official score
  // (best for the default highest policy, latest otherwise — average has no single one).
  const openStudentAttempt = (student: string) => {
    const mine = visibleAttempts.filter((a) => a.student === student);
    if (mine.length === 0) return;
    const graded = mine.filter((a) => a.score != null && !a.needsManualGrading);
    const pool = graded.length > 0 ? graded : mine;
    const ratio = (a: StaffQuizAttempt) => (Number(a.maxScore) > 0 ? Number(a.score) / Number(a.maxScore) : 0);
    const pick =
      quiz.scoringPolicy === 'highest' || quiz.scoringPolicy == null
        ? pool.reduce((x, y) => (ratio(y) > ratio(x) ? y : x))
        : pool.reduce((x, y) => ((y.attemptNumber ?? 0) > (x.attemptNumber ?? 0) ? y : x));
    setTopTab('grade');
    openAttempt(pick);
  };

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

  const gradeContent = (
    <GradingQueue
      attempts={queueListAttempts}
      queue={queue}
      sectionFilter={sectionFilter}
      hasSection={sectionEmails != null}
      showGraded={showGraded}
      onToggleShowGraded={setShowGraded}
      onStartGrading={startGrading}
      onGradeAttempt={openAttempt}
    />
  );

  return (
    <>
    <Tabs
      activeKey={topTab}
      onChange={setTopTab}
      items={[
        {
          key: 'grade',
          label: (
            <span>
              Grade{queue.length > 0 && <Text type="secondary"> ({queue.length})</Text>}
            </span>
          ),
          children: gradeContent,
        },
        {
          key: 'overview',
          label: 'Overview',
          children: (
            <GradingOverview
              quiz={quiz}
              attempts={visibleAttempts}
              results={visibleResults}
              resultsLoading={resultsLoading}
              statsLoading={isLoading}
              sectionFilter={sectionFilter}
              hasSection={sectionEmails != null}
              onOpenAttempt={openStudentAttempt}
            />
          ),
        },
      ]}
    />
    {/* The focused grader takes over the whole screen; it portals to document.body so it
        escapes the constrained admin/grader layouts identically from both consoles. While it
        is open, `current` is a local snapshot — background refetches from refresh() only
        re-derive the queue counts and never yank the open attempt. The Overview tab is
        unreachable while open (the drawer covers the Tabs), so no flush hook is needed there. */}
    <Drawer
      open={current != null}
      width="100%"
      placement="right"
      closable={false}
      maskClosable={false}
      keyboard
      destroyOnHidden
      onClose={() => void guardedExit()}
      styles={{ body: { padding: 0, height: '100%', overflow: 'hidden' } }}
    >
      {current && (
        <FocusedGrader
          attempt={current}
          focusResponseId={focusId ?? current.responses[0]?.id ?? 0}
          queuePos={focusId != null ? queuePosition(queue, focusId) : 0}
          queueTotal={queue.length}
          hasNext={focusId != null && !!nextInQueue(queue, focusId)}
          onNavigate={setFocusId}
          onNext={goNext}
          onExit={exitGrading}
          onGraded={handleGraded}
          onRunUpdate={setCurrent}
          onSetOfficial={setOfficial}
          pinning={pinning}
          gradeRef={gradeRef}
        />
      )}
    </Drawer>
    </>
  );
};

export default QuizGradingView;
