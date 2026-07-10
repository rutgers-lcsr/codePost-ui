// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Dropdown,
  Empty,
  Flex,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  CheckSquareOutlined,
  EyeOutlined,
  PlusOutlined,
  RetweetOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizzesApi, quizQuestionsApi, quizQuestionGroupsApi, quizGeneratedSectionsApi } from '../../../api-client/clients';
import {
  Course,
  Quiz,
  QuizGeneratedSection,
  QuizQuestion,
  QuizQuestionGroup,
  QuizAssignmentTriggerEnum,
  QuizShowAnswersEnum,
  QuizPassingScoreUnitEnum,
  QuizCloseEventEnum,
} from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { useAssignmentsQuery } from '../hooks/useAssignmentsQuery';
import {
  useAIQuizGenerationEnabled, useCourseQuestions, useGeneratedSets, useQuizMembership,
  useQuizDetail, useQuestionBanks,
} from './queries';
import { typeMeta } from './questionMeta';
import AddQuestionsModal from './AddQuestionsModal';
import GroupEditorModal from './GroupEditorModal';
import GeneratedSectionModal from './GeneratedSectionModal';
import GeneratedReviewDrawer from './GeneratedReviewDrawer';
import MarkdownField from './MarkdownField';
import QuizPreviewDrawer, { PreviewItem } from './QuizPreviewDrawer';
import QuizGradingDrawer from './QuizGradingDrawer';

const { Text } = Typography;

interface IProps {
  course: Course;
  quiz: Quiz;
}

// A unified row in the quiz-contents table: a fixed question, a random draw, or a
// per-student personalized (AI-generated) section.
type ContentRow =
  | { key: string; kind: 'question'; qq: QuizQuestion; position: number }
  | { key: string; kind: 'group'; group: QuizQuestionGroup }
  | { key: string; kind: 'aiSection'; section: QuizGeneratedSection };

// Per-row points override: commits on blur / Enter (not every keystroke) and
// disables while the PATCH is in flight. Needs its own component because a
// Table column `render` can't hold per-row hook state.
const PointsOverrideInput: React.FC<{
  base: number;
  value: number | null;
  onCommit: (v: number | null) => Promise<void>;
}> = ({ base, value, onCommit }) => {
  const [local, setLocal] = React.useState<number | null>(value ?? base);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLocal(value ?? base);
  }, [value, base]);

  const commit = async () => {
    const next = local == null ? null : Number(local);
    if ((next ?? null) === (value ?? null)) return;
    setSaving(true);
    try {
      await onCommit(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tooltip title={`Default: ${base}. Override for this quiz.`}>
      <InputNumber
        size="small"
        min={0}
        style={{ width: 72 }}
        value={local}
        disabled={saving}
        onChange={(v) => setLocal(v == null ? null : Number(v))}
        onBlur={commit}
        onPressEnter={commit}
      />
    </Tooltip>
  );
};

type OffsetUnit = 'minutes' | 'hours' | 'days';
const UNIT_FACTOR: Record<OffsetUnit, number> = { minutes: 1, hours: 60, days: 1440 };
// Show a stored minute count in the largest whole unit that divides it.
const splitOffset = (min: number): { value: number; unit: OffsetUnit } => {
  if (min > 0 && min % 1440 === 0) return { value: min / 1440, unit: 'days' };
  if (min > 0 && min % 60 === 0) return { value: min / 60, unit: 'hours' };
  return { value: min, unit: 'minutes' };
};

const TRIGGER_HELP: Record<string, string> = {
  [QuizAssignmentTriggerEnum.During]: 'Opens while the assignment is accepting submissions.',
  [QuizAssignmentTriggerEnum.AfterAssignment]: "Opens once the assignment's deadline passes.",
  [QuizAssignmentTriggerEnum.AfterSubmission]: 'Opens for each student once they submit the assignment.',
  [QuizAssignmentTriggerEnum.AfterFeedback]: 'Opens once grades/feedback are released for the whole assignment.',
  [QuizAssignmentTriggerEnum.AfterStudentFeedback]:
    "Opens for each student once their own feedback is available — under live feedback mode this unlocks per student as each submission is graded (self-paced).",
};

// Close events that take a "+ N minutes/hours/days" offset.
const OFFSET_CLOSE_EVENTS = new Set<string>([
  QuizCloseEventEnum.AssignmentDue,
  QuizCloseEventEnum.Submission,
  QuizCloseEventEnum.FeedbackReleased,
]);

const CLOSE_LABELS: Record<string, string> = {
  [QuizCloseEventEnum.None]: 'No automatic close',
  [QuizCloseEventEnum.AssignmentDue]: "At the assignment's deadline",
  [QuizCloseEventEnum.Submission]: 'After the student submits',
  [QuizCloseEventEnum.FeedbackReleased]: 'When feedback is released',
  [QuizCloseEventEnum.FixedDate]: 'At a fixed date & time',
};

// Which close events make sense for each open trigger (a fixed date is always allowed).
const CLOSE_OPTIONS_BY_TRIGGER: Record<string, QuizCloseEventEnum[]> = {
  [QuizAssignmentTriggerEnum.During]: [
    QuizCloseEventEnum.None, QuizCloseEventEnum.AssignmentDue, QuizCloseEventEnum.FixedDate,
  ],
  [QuizAssignmentTriggerEnum.AfterAssignment]: [
    QuizCloseEventEnum.None, QuizCloseEventEnum.AssignmentDue, QuizCloseEventEnum.FixedDate,
  ],
  [QuizAssignmentTriggerEnum.AfterSubmission]: [
    QuizCloseEventEnum.None, QuizCloseEventEnum.Submission, QuizCloseEventEnum.FixedDate,
  ],
  [QuizAssignmentTriggerEnum.AfterFeedback]: [
    QuizCloseEventEnum.None, QuizCloseEventEnum.FeedbackReleased, QuizCloseEventEnum.FixedDate,
  ],
};

// The close event pre-selected when switching to a trigger (submission-based is the natural
// default when a quiz opens on submission).
const DEFAULT_CLOSE_BY_TRIGGER: Record<string, QuizCloseEventEnum> = {
  [QuizAssignmentTriggerEnum.During]: QuizCloseEventEnum.None,
  [QuizAssignmentTriggerEnum.AfterAssignment]: QuizCloseEventEnum.None,
  [QuizAssignmentTriggerEnum.AfterSubmission]: QuizCloseEventEnum.Submission,
  [QuizAssignmentTriggerEnum.AfterFeedback]: QuizCloseEventEnum.None,
};

// A close whose anchor is the same moment the quiz opens — needs a positive offset or it
// would close instantly.
const isDegenerateClose = (trigger: string, event: string): boolean =>
  (trigger === QuizAssignmentTriggerEnum.AfterSubmission && event === QuizCloseEventEnum.Submission) ||
  (trigger === QuizAssignmentTriggerEnum.AfterFeedback && event === QuizCloseEventEnum.FeedbackReleased) ||
  (trigger === QuizAssignmentTriggerEnum.AfterAssignment && event === QuizCloseEventEnum.AssignmentDue);

const closeOptionsFor = (trigger: string): QuizCloseEventEnum[] =>
  CLOSE_OPTIONS_BY_TRIGGER[trigger] ?? [QuizCloseEventEnum.None, QuizCloseEventEnum.FixedDate];

const QuizBuilder: React.FC<IProps> = ({ course, quiz }) => {
  const queryClient = useQueryClient();
  const { data: liveQuiz } = useQuizDetail(quiz.id);
  const { data: membership = [], isLoading } = useQuizMembership(quiz.id);
  const { data: questions = [] } = useCourseQuestions(course.id);
  const { data: banks = [] } = useQuestionBanks(course.id);
  const { data: assignments = [] } = useAssignmentsQuery(course);

  const current = liveQuiz ?? quiz;
  const groups = React.useMemo(() => current.questionGroups ?? [], [current.questionGroups]);
  const sections = React.useMemo(() => current.generatedSections ?? [], [current.generatedSections]);

  const [addOpen, setAddOpen] = React.useState(false);
  const [groupOpen, setGroupOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [gradingOpen, setGradingOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<QuizQuestionGroup | null>(null);
  const [sectionOpen, setSectionOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<QuizGeneratedSection | null>(null);

  // --- Quiz settings (title / description / attached assignment) ---
  const [title, setTitle] = React.useState(current.title);
  const [description, setDescription] = React.useState(current.description ?? '');
  const [assignmentId, setAssignmentId] = React.useState<number | undefined>(current.assignment ?? undefined);
  const [savingSettings, setSavingSettings] = React.useState(false);
  // --- Availability + standard options ---
  const TRIGGER_DEFAULT = QuizAssignmentTriggerEnum.During;
  const SHOW_DEFAULT = QuizShowAnswersEnum.AfterSubmit;
  const [assignmentTrigger, setAssignmentTrigger] = React.useState(current.assignmentTrigger || TRIGGER_DEFAULT);
  const [availableFrom, setAvailableFrom] = React.useState<string | null>(current.availableFrom ?? null);
  const [availableUntil, setAvailableUntil] = React.useState<string | null>(current.availableUntil ?? null);
  // Attached-quiz close controls.
  const CLOSE_DEFAULT = QuizCloseEventEnum.None;
  const [closeEvent, setCloseEvent] = React.useState(current.closeEvent || CLOSE_DEFAULT);
  const [offsetValue, setOffsetValue] = React.useState<number>(splitOffset(current.closeOffsetMinutes ?? 0).value);
  const [offsetUnit, setOffsetUnit] = React.useState<OffsetUnit>(splitOffset(current.closeOffsetMinutes ?? 0).unit);
  const [endAttemptsAtClose, setEndAttemptsAtClose] = React.useState<boolean>(current.endAttemptsAtClose ?? false);
  const closeOffsetMinutes = offsetValue * UNIT_FACTOR[offsetUnit];

  // A degenerate close (anchor == open moment) needs a positive offset, so seed one.
  const ensureCloseOffset = (trigger: string, event: string) => {
    if (isDegenerateClose(trigger, event) && closeOffsetMinutes === 0) {
      setOffsetValue(1);
      setOffsetUnit('days');
    }
  };
  const handleTriggerChange = (t: QuizAssignmentTriggerEnum) => {
    setAssignmentTrigger(t);
    const allowed = closeOptionsFor(t);
    const next = allowed.includes(closeEvent) ? closeEvent : DEFAULT_CLOSE_BY_TRIGGER[t] ?? QuizCloseEventEnum.None;
    setCloseEvent(next);
    ensureCloseOffset(t, next);
  };
  const handleCloseEventChange = (e: QuizCloseEventEnum) => {
    setCloseEvent(e);
    ensureCloseOffset(assignmentTrigger, e);
  };
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState<number | null>(current.timeLimitMinutes ?? null);
  const [attemptsAllowed, setAttemptsAllowed] = React.useState<number>(current.attemptsAllowed ?? 1);
  const [shuffleQuestions, setShuffleQuestions] = React.useState<boolean>(current.shuffleQuestions ?? false);
  const [oneQuestionAtATime, setOneQuestionAtATime] = React.useState<boolean>(current.oneQuestionAtATime ?? false);
  const [allowBacktracking, setAllowBacktracking] = React.useState<boolean>(current.allowBacktracking ?? true);
  const [showCorrectAnswers, setShowCorrectAnswers] = React.useState(current.showCorrectAnswers || SHOW_DEFAULT);
  const [passingScore, setPassingScore] = React.useState<number | null>(current.passingScore ?? null);
  const UNIT_DEFAULT = QuizPassingScoreUnitEnum.Percent;
  const [passingScoreUnit, setPassingScoreUnit] = React.useState(current.passingScoreUnit || UNIT_DEFAULT);
  const [isPublished, setIsPublished] = React.useState<boolean>(current.isPublished ?? false);
  // Per-student generated questions.
  const [gradersCanReviewGenerated, setGradersCanReviewGenerated] =
    React.useState<boolean>(current.gradersCanReviewGenerated ?? false);
  const [autoPublishGenerated, setAutoPublishGenerated] =
    React.useState<boolean>(current.autoPublishGenerated ?? false);

  // Reset all settings state when switching quizzes. (Keyed on id so an unrelated
  // detail refetch doesn't clobber in-progress edits.)
  React.useEffect(() => {
    setTitle(current.title);
    setDescription(current.description ?? '');
    setAssignmentId(current.assignment ?? undefined);
    setAssignmentTrigger(current.assignmentTrigger || TRIGGER_DEFAULT);
    setAvailableFrom(current.availableFrom ?? null);
    setAvailableUntil(current.availableUntil ?? null);
    setCloseEvent(current.closeEvent || CLOSE_DEFAULT);
    setOffsetValue(splitOffset(current.closeOffsetMinutes ?? 0).value);
    setOffsetUnit(splitOffset(current.closeOffsetMinutes ?? 0).unit);
    setEndAttemptsAtClose(current.endAttemptsAtClose ?? false);
    setTimeLimitMinutes(current.timeLimitMinutes ?? null);
    setAttemptsAllowed(current.attemptsAllowed ?? 1);
    setShuffleQuestions(current.shuffleQuestions ?? false);
    setOneQuestionAtATime(current.oneQuestionAtATime ?? false);
    setAllowBacktracking(current.allowBacktracking ?? true);
    setShowCorrectAnswers(current.showCorrectAnswers || SHOW_DEFAULT);
    setPassingScore(current.passingScore ?? null);
    setPassingScoreUnit(current.passingScoreUnit || UNIT_DEFAULT);
    setIsPublished(current.isPublished ?? false);
    setGradersCanReviewGenerated(current.gradersCanReviewGenerated ?? false);
    setAutoPublishGenerated(current.autoPublishGenerated ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id]);

  const settingsDirty =
    title !== current.title ||
    (description ?? '') !== (current.description ?? '') ||
    (assignmentId ?? null) !== (current.assignment ?? null) ||
    assignmentTrigger !== (current.assignmentTrigger || TRIGGER_DEFAULT) ||
    (availableFrom ?? null) !== (current.availableFrom ?? null) ||
    (availableUntil ?? null) !== (current.availableUntil ?? null) ||
    closeEvent !== (current.closeEvent || CLOSE_DEFAULT) ||
    closeOffsetMinutes !== (current.closeOffsetMinutes ?? 0) ||
    endAttemptsAtClose !== (current.endAttemptsAtClose ?? false) ||
    (timeLimitMinutes ?? null) !== (current.timeLimitMinutes ?? null) ||
    attemptsAllowed !== (current.attemptsAllowed ?? 1) ||
    shuffleQuestions !== (current.shuffleQuestions ?? false) ||
    oneQuestionAtATime !== (current.oneQuestionAtATime ?? false) ||
    allowBacktracking !== (current.allowBacktracking ?? true) ||
    showCorrectAnswers !== (current.showCorrectAnswers || SHOW_DEFAULT) ||
    (passingScore ?? null) !== (current.passingScore ?? null) ||
    passingScoreUnit !== (current.passingScoreUnit || UNIT_DEFAULT) ||
    isPublished !== (current.isPublished ?? false) ||
    gradersCanReviewGenerated !== (current.gradersCanReviewGenerated ?? false) ||
    autoPublishGenerated !== (current.autoPublishGenerated ?? false);

  const handleSaveSettings = async (overrides?: { isPublished?: boolean }) => {
    if (!title.trim()) {
      message.warning('A quiz needs a title.');
      return;
    }
    setSavingSettings(true);
    try {
      await quizzesApi.partialUpdate({
        id: quiz.id!,
        patchedQuiz: {
          title: title.trim(),
          description,
          assignment: assignmentId ?? null,
          assignmentTrigger,
          availableFrom,
          availableUntil,
          closeEvent,
          closeOffsetMinutes,
          endAttemptsAtClose,
          timeLimitMinutes,
          attemptsAllowed,
          shuffleQuestions,
          oneQuestionAtATime,
          allowBacktracking,
          showCorrectAnswers,
          passingScore,
          passingScoreUnit,
          isPublished: overrides?.isPublished ?? isPublished,
          gradersCanReviewGenerated,
          autoPublishGenerated,
        },
      });
      message.success('Quiz settings saved.');
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(quiz.id!) });
      queryClient.invalidateQueries({ queryKey: quizKeys.list(course.id!) });
    } catch (err) {
      const e = err as { body?: { title?: string[]; detail?: string } };
      message.error(e?.body?.title?.[0] ?? e?.body?.detail ?? 'Failed to save quiz settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Publishing makes the quiz visible to students, so nudge the author to save any
  // pending edits first (otherwise students would see a stale version).
  const handlePublishToggle = (checked: boolean) => {
    if (checked && settingsDirty) {
      Modal.confirm({
        title: 'Save changes and publish?',
        content: 'This quiz has unsaved changes. Save them now so students see the latest version.',
        okText: 'Save & publish',
        cancelText: 'Not now',
        onOk: async () => {
          setIsPublished(true);
          await handleSaveSettings({ isPublished: true });
        },
      });
    }
    setIsPublished(checked);
  };

  // --- Question membership ---
  const questionsById = React.useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const bankNameById = React.useMemo(() => new Map(banks.map((b) => [b.id, b.name])), [banks]);
  const orderedQuestions = React.useMemo(
    () => [...membership].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)),
    [membership],
  );
  const orderedGroups = React.useMemo(() => [...groups].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)), [groups]);

  const invalidateMembership = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.membership(quiz.id!) });
    queryClient.invalidateQueries({ queryKey: quizKeys.list(course.id!) });
  };
  const invalidateGroups = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.detail(quiz.id!) });
    queryClient.invalidateQueries({ queryKey: quizKeys.list(course.id!) });
  };

  const handleMove = async (position: number, dir: -1 | 1) => {
    const target = position + dir;
    if (target < 0 || target >= orderedQuestions.length) return;
    const a = orderedQuestions[position];
    const b = orderedQuestions[target];
    try {
      await Promise.all([
        quizQuestionsApi.partialUpdate({ id: a.id!, patchedQuizQuestion: { sortKey: b.sortKey ?? target } }),
        quizQuestionsApi.partialUpdate({ id: b.id!, patchedQuizQuestion: { sortKey: a.sortKey ?? position } }),
      ]);
      invalidateMembership();
    } catch {
      message.error('Failed to reorder.');
    }
  };

  const handleRemoveQuestion = (qq: QuizQuestion) => {
    Modal.confirm({
      title: 'Remove this question from the quiz?',
      content: 'The question stays in its bank — only its membership in this quiz is removed.',
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await quizQuestionsApi.destroy({ id: qq.id! });
          message.success('Removed from quiz.');
          invalidateMembership();
        } catch {
          message.error('Failed to remove question.');
        }
      },
    });
  };

  const handlePointsOverride = async (qq: QuizQuestion, value: number | null) => {
    try {
      await quizQuestionsApi.partialUpdate({ id: qq.id!, patchedQuizQuestion: { pointsOverride: value } });
      invalidateMembership();
    } catch {
      message.error('Failed to update points.');
    }
  };

  // --- Random draws ---
  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupOpen(true);
  };
  const openEditGroup = (g: QuizQuestionGroup) => {
    setEditingGroup(g);
    setGroupOpen(true);
  };
  const handleDeleteGroup = (g: QuizQuestionGroup) => {
    Modal.confirm({
      title: 'Remove this random draw?',
      content: 'The bank and its questions are unaffected — only this draw is removed from the quiz.',
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await quizQuestionGroupsApi.destroy({ id: g.id! });
          message.success('Random draw removed.');
          invalidateGroups();
        } catch {
          message.error('Failed to remove the random draw.');
        }
      },
    });
  };

  // --- Personalized (per-student generated) sections ---
  const orderedSections = React.useMemo(
    () => [...sections].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)),
    [sections],
  );
  // Review badge (only fetched once sections exist; graders without the review flag get
  // a 403, which simply hides the count).
  const { data: generatedSets = [] } = useGeneratedSets(orderedSections.length > 0 ? quiz.id : undefined);
  const readyCount = generatedSets.filter((s) => s.status === 'ready').length;
  // Needs-grading badge; shares the grading drawer's query key so grading refreshes it.
  // Quiz graders / admins only — a 403 for plain staff simply hides the count.
  const { data: pendingAttempts = [] } = useQuery({
    queryKey: [...quizKeys.attempts(quiz.id ?? -1), true],
    queryFn: () => quizzesApi.attemptsList({ id: quiz.id!, needsGrading: true }),
    enabled: !!quiz.id,
    retry: false,
  });
  const needsGradingCount = pendingAttempts.length;
  // The authoring surface only shows when the course's AI feature is on; existing
  // sections stay manageable (with a warning) so they can be cleaned up after a
  // course turns it off.
  const { data: aiQuizEnabled = false } = useAIQuizGenerationEnabled(course.id);

  const openCreateSection = () => {
    setEditingSection(null);
    setSectionOpen(true);
  };
  const openEditSection = (s: QuizGeneratedSection) => {
    setEditingSection(s);
    setSectionOpen(true);
  };
  const handleDeleteSection = (s: QuizGeneratedSection) => {
    Modal.confirm({
      title: 'Remove this AI-generated section?',
      content: "Every student's generated questions for this section are deleted too. "
        + 'Attempts already taken are unaffected.',
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await quizGeneratedSectionsApi.destroy({ id: s.id! });
          message.success('AI-generated section removed.');
          invalidateGroups();
        } catch {
          message.error('Failed to remove the section.');
        }
      },
    });
  };

  // --- Unified quiz-contents rows: questions, then random draws, then personalized ---
  const rows: ContentRow[] = [
    ...orderedQuestions.map((qq, i) => ({ key: `q-${qq.id}`, kind: 'question' as const, qq, position: i })),
    ...orderedGroups.map((g) => ({ key: `g-${g.id}`, kind: 'group' as const, group: g })),
    ...orderedSections.map((s) => ({ key: `s-${s.id}`, kind: 'aiSection' as const, section: s })),
  ];

  const columns = [
    {
      title: '#',
      key: 'order',
      width: 48,
      render: (_: unknown, row: ContentRow) => {
        if (row.kind === 'question') return row.position + 1;
        if (row.kind === 'aiSection') return <RobotOutlined style={{ color: '#722ed1' }} />;
        return <RetweetOutlined style={{ color: '#198665' }} />;
      },
    },
    {
      title: 'Type',
      key: 'type',
      width: 140,
      render: (_: unknown, row: ContentRow) => {
        if (row.kind === 'group') return <Tag color="green">Random draw</Tag>;
        if (row.kind === 'aiSection') return <Tag color="purple">AI generated</Tag>;
        const meta = typeMeta(questionsById.get(row.qq.question)?.questionType);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Content',
      key: 'content',
      render: (_: unknown, row: ContentRow) => {
        if (row.kind === 'group') {
          const g = row.group;
          return (
            <Text>
              {g.name ? `${g.name} — ` : ''}
              Draw <b>{g.pickCount ?? 1}</b> random from <b>{bankNameById.get(g.bank) ?? `bank #${g.bank}`}</b>
            </Text>
          );
        }
        if (row.kind === 'aiSection') {
          const s = row.section;
          return (
            <Text>
              {s.name ? `${s.name} — ` : ''}
              Generate <b>{s.numQuestions ?? 3}</b> per student from their submission
            </Text>
          );
        }
        const q = questionsById.get(row.qq.question);
        const text = q?.text ?? `Question #${row.qq.question}`;
        return <Text>{text.length > 90 ? `${text.slice(0, 90)}…` : text}</Text>;
      },
    },
    {
      title: 'Points',
      key: 'points',
      width: 110,
      render: (_: unknown, row: ContentRow) => {
        if (row.kind === 'group') {
          const g = row.group;
          return (
            <Text type="secondary">
              {g.pickCount ?? 1} × {g.pointsPerQuestion ?? 1}
            </Text>
          );
        }
        if (row.kind === 'aiSection') {
          const s = row.section;
          return (
            <Text type="secondary">
              {s.numQuestions ?? 3} × {s.pointsPerQuestion ?? 1}
            </Text>
          );
        }
        const base = questionsById.get(row.qq.question)?.points;
        return (
          <PointsOverrideInput
            base={base ?? 1}
            value={row.qq.pointsOverride ?? null}
            onCommit={(v) => handlePointsOverride(row.qq, v)}
          />
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, row: ContentRow) => {
        if (row.kind === 'group') {
          return (
            <Space.Compact size="small">
              <Button
                size="small"
                aria-label="Edit random draw"
                title="Edit random draw"
                icon={<EditOutlined />}
                onClick={() => openEditGroup(row.group)}
              />
              <Button
                size="small"
                danger
                aria-label="Remove random draw"
                title="Remove random draw"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteGroup(row.group)}
              />
            </Space.Compact>
          );
        }
        if (row.kind === 'aiSection') {
          return (
            <Space.Compact size="small">
              <Button
                size="small"
                aria-label="Edit AI-generated section"
                title="Edit AI-generated section"
                icon={<EditOutlined />}
                onClick={() => openEditSection(row.section)}
              />
              <Button
                size="small"
                danger
                aria-label="Remove AI-generated section"
                title="Remove AI-generated section"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteSection(row.section)}
              />
            </Space.Compact>
          );
        }
        return (
          <Space.Compact size="small">
            <Button
              size="small"
              aria-label="Move up"
              title="Move up"
              icon={<ArrowUpOutlined />}
              disabled={row.position === 0}
              onClick={() => handleMove(row.position, -1)}
            />
            <Button
              size="small"
              aria-label="Move down"
              title="Move down"
              icon={<ArrowDownOutlined />}
              disabled={row.position === orderedQuestions.length - 1}
              onClick={() => handleMove(row.position, 1)}
            />
            <Button
              size="small"
              danger
              aria-label="Remove from quiz"
              title="Remove from quiz"
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveQuestion(row.qq)}
            />
          </Space.Compact>
        );
      },
    },
  ];

  const assignmentOptions = assignments.map((a) => ({ value: a.id, label: a.name }));
  const totalItems = orderedQuestions.length + orderedGroups.length + orderedSections.length;

  // Fixed questions, plus a simulated sample for each random draw. Memoized so the
  // random selection stays stable while the instructor interacts with the preview.
  const previewItems: PreviewItem[] = React.useMemo(() => {
    const fixed: PreviewItem[] = orderedQuestions
      .map((qq) => {
        const q = questionsById.get(qq.question);
        return q ? { question: q, points: Number(qq.pointsOverride ?? q.points ?? 1) } : null;
      })
      .filter((x): x is PreviewItem => x !== null);

    const drawn: PreviewItem[] = orderedGroups.flatMap((g) => {
      const pool = questions.filter((q) => q.bank === g.bank);
      const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, g.pickCount ?? 1);
      return picked.map((q) => ({ question: q, points: Number(g.pointsPerQuestion ?? 1) }));
    });

    return [...fixed, ...drawn];
  }, [orderedQuestions, orderedGroups, questionsById, questions]);

  return (
    <>
      {/* Quiz settings */}
      <Card
        title={
          <Typography.Title level={2} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Quiz Settings
          </Typography.Title>
        }
        extra={
          <Space size="middle">
            <Space size={6}>
              <Switch checked={isPublished} onChange={handlePublishToggle} />
              <Text type={isPublished ? undefined : 'secondary'}>{isPublished ? 'Published' : 'Draft'}</Text>
            </Space>
            <CPButton
              cpType="primary"
              onClick={() => handleSaveSettings()}
              disabled={!settingsDirty}
              loading={savingSettings}
            >
              Save
            </CPButton>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Flex vertical gap={12}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Title
            </Text>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={128} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Attached assignment
            </Text>
            <Select
              allowClear
              placeholder="Not attached - Attach to an assignment to control availability"
              style={{ minWidth: 280 }}
              value={assignmentId}
              onChange={(v) => setAssignmentId(v)}
              options={assignmentOptions}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Availability
            </Text>
            {assignmentId ? (
              <Flex vertical gap={12}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Opens
                  </Text>
                  <Select
                    style={{ minWidth: 280 }}
                    value={assignmentTrigger}
                    onChange={handleTriggerChange}
                    options={[
                      { value: QuizAssignmentTriggerEnum.During, label: 'During the assignment' },
                      { value: QuizAssignmentTriggerEnum.AfterAssignment, label: 'After the assignment closes' },
                      { value: QuizAssignmentTriggerEnum.AfterSubmission, label: 'After the student submits' },
                      { value: QuizAssignmentTriggerEnum.AfterFeedback, label: 'After feedback is released' },
                      {
                        value: QuizAssignmentTriggerEnum.AfterStudentFeedback,
                        label: "After each student's feedback (self-paced)",
                      },
                    ]}
                  />
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                    {TRIGGER_HELP[assignmentTrigger]}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Closes
                  </Text>
                  <Flex gap={8} wrap align="center">
                    <Select
                      style={{ minWidth: 260 }}
                      value={closeEvent}
                      onChange={handleCloseEventChange}
                      options={closeOptionsFor(assignmentTrigger).map((v) => ({ value: v, label: CLOSE_LABELS[v] }))}
                    />
                    {OFFSET_CLOSE_EVENTS.has(closeEvent) && (
                      <>
                        <Text type="secondary">+</Text>
                        <InputNumber
                          min={0}
                          style={{ width: 80 }}
                          value={offsetValue}
                          onChange={(v) => setOffsetValue(v ?? 0)}
                        />
                        <Select
                          style={{ width: 110 }}
                          value={offsetUnit}
                          onChange={(v) => setOffsetUnit(v as OffsetUnit)}
                          options={[
                            { value: 'minutes', label: 'minutes' },
                            { value: 'hours', label: 'hours' },
                            { value: 'days', label: 'days' },
                          ]}
                        />
                      </>
                    )}
                    {closeEvent === QuizCloseEventEnum.FixedDate && (
                      <DatePicker
                        showTime
                        placeholder="Closes at"
                        value={availableUntil ? dayjs(availableUntil) : null}
                        onChange={(d) => setAvailableUntil(d ? d.toISOString() : null)}
                      />
                    )}
                  </Flex>
                  {closeEvent === QuizCloseEventEnum.Submission && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                      Each student&apos;s window starts when they submit the assignment.
                    </Text>
                  )}
                  {closeEvent !== QuizCloseEventEnum.None && (
                    <Space style={{ marginTop: 8 }}>
                      <Switch size="small" checked={endAttemptsAtClose} onChange={setEndAttemptsAtClose} />
                      <Text type="secondary">
                        End in-progress attempts at the close time (students see the time remaining)
                      </Text>
                    </Space>
                  )}
                </div>
              </Flex>
            ) : (
              <div>
                <Flex gap={8} wrap>
                  <DatePicker
                    showTime
                    placeholder="Opens at"
                    value={availableFrom ? dayjs(availableFrom) : null}
                    onChange={(d) => {
                      const iso = d ? d.toISOString() : null;
                      setAvailableFrom(iso);
                      // Keep the window valid: drop a close that's no longer after the new open.
                      if (iso && availableUntil && !dayjs(availableUntil).isAfter(dayjs(iso))) {
                        setAvailableUntil(null);
                      }
                    }}
                  />
                  <DatePicker
                    showTime
                    placeholder="Closes at"
                    // Can't close before it opens.
                    minDate={availableFrom ? dayjs(availableFrom) : undefined}
                    value={availableUntil ? dayjs(availableUntil) : null}
                    onChange={(d) => setAvailableUntil(d ? d.toISOString() : null)}
                  />
                </Flex>
                {availableUntil && (
                  <Space style={{ marginTop: 8 }}>
                    <Switch size="small" checked={endAttemptsAtClose} onChange={setEndAttemptsAtClose} />
                    <Text type="secondary">
                      End in-progress attempts at the close time (students see the time remaining)
                    </Text>
                  </Space>
                )}
              </div>
            )}
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Description (Markdown)
            </Text>
            <MarkdownField
              value={description}
              onChange={setDescription}
              courseId={course.id!}
              minRows={3}
              placeholder="What this quiz covers — supports Markdown and images…"
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Appears on the quiz page when the student is taking the quiz. Can be used to provide instructions or
              context for the quiz.
            </Text>
          </div>

          <Flex gap={16} wrap align="end">
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Time limit (min)
              </Text>
              <InputNumber
                min={1}
                placeholder="Untimed"
                style={{ width: 130 }}
                value={timeLimitMinutes ?? undefined}
                onChange={(v) => setTimeLimitMinutes(v ?? null)}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Attempts (0 = ∞)
              </Text>
              <InputNumber
                min={0}
                style={{ width: 110 }}
                value={attemptsAllowed}
                onChange={(v) => setAttemptsAllowed(v ?? 1)}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Show correct answers
              </Text>
              <Select
                style={{ width: 180 }}
                value={showCorrectAnswers}
                onChange={setShowCorrectAnswers}
                options={[
                  { value: QuizShowAnswersEnum.Never, label: 'Never' },
                  { value: QuizShowAnswersEnum.AfterSubmit, label: 'After submitting' },
                  { value: QuizShowAnswersEnum.AfterClose, label: 'After the quiz closes' },
                ]}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Passing score
              </Text>
              <Space.Compact>
                <InputNumber
                  min={0}
                  max={passingScoreUnit === QuizPassingScoreUnitEnum.Percent ? 100 : undefined}
                  placeholder="None"
                  style={{ width: 110 }}
                  value={passingScore ?? undefined}
                  onChange={(v) => setPassingScore(v ?? null)}
                />
                <Select
                  style={{ width: 100 }}
                  value={passingScoreUnit}
                  onChange={(u) => {
                    setPassingScoreUnit(u);
                    // Avoid a guaranteed 400: percent can't exceed 100.
                    if (u === QuizPassingScoreUnitEnum.Percent && passingScore != null && passingScore > 100) {
                      setPassingScore(100);
                    }
                  }}
                  options={[
                    { value: QuizPassingScoreUnitEnum.Percent, label: '%' },
                    { value: QuizPassingScoreUnitEnum.Points, label: 'points' },
                  ]}
                />
              </Space.Compact>
            </div>
          </Flex>

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              Question delivery
            </Text>
            <Flex vertical gap={10}>
              <Space>
                <Switch checked={shuffleQuestions} onChange={setShuffleQuestions} />
                <Text>Shuffle question order</Text>
              </Space>
              <Space>
                <Switch checked={oneQuestionAtATime} onChange={setOneQuestionAtATime} />
                <Text>One question at a time</Text>
              </Space>
              {oneQuestionAtATime && (
                <Space style={{ marginLeft: 36 }}>
                  <Switch size="small" checked={allowBacktracking} onChange={setAllowBacktracking} />
                  <Text type="secondary">Let students go back to previous questions</Text>
                </Space>
              )}
            </Flex>
          </div>
          {orderedSections.length > 0 && (
            <div>
              <Text strong>AI-generated questions</Text>
              <Flex vertical gap={10} style={{ marginTop: 8 }}>
                <Space>
                  <Switch checked={autoPublishGenerated} onChange={setAutoPublishGenerated} />
                  <Text>Publish generated questions automatically (skip review)</Text>
                </Space>
                <Space>
                  <Switch checked={gradersCanReviewGenerated} onChange={setGradersCanReviewGenerated} />
                  <Text>Graders may review and publish generated questions</Text>
                </Space>
                {closeEvent === QuizCloseEventEnum.Submission && !autoPublishGenerated && (
                  <Text type="warning" style={{ fontSize: 13 }}>
                    This quiz closes relative to each student's submission, but their questions
                    only open once reviewed — a slow review can eat into (or consume) their
                    window. Review promptly, extend the close offset, or enable auto-publish.
                  </Text>
                )}
              </Flex>
            </div>
          )}
        </Flex>
      </Card>

      {/* Quiz contents: fixed questions + random draws, unified */}
      <Card
        title={
          <Flex align="center" gap={8}>
            <Typography.Title level={2} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Questions
            </Typography.Title>
            {orderedQuestions.length > 0 && (
              <Tag color="blue">{orderedQuestions.length} fixed</Tag>
            )}
            {orderedGroups.length > 0 && (
              <Tag color="green">
                {orderedGroups.length} random {orderedGroups.length === 1 ? 'draw' : 'draws'}
              </Tag>
            )}
            {orderedSections.length > 0 && (
              <Tag color="purple">
                {orderedSections.length} AI generated
              </Tag>
            )}
          </Flex>
        }
        extra={
          <Space>
            <Tooltip title={previewItems.length === 0 ? 'Add questions to preview' : 'Preview as a student'}>
              <CPButton
                cpType="link"
                icon={<EyeOutlined />}
                onClick={() => setPreviewOpen(true)}
                disabled={previewItems.length === 0}
              >
                Preview
              </CPButton>
            </Tooltip>
            <Tooltip title="Review submitted attempts and grade essay/code responses">
              <CPButton cpType="link" icon={<CheckSquareOutlined />} onClick={() => setGradingOpen(true)}>
                Grading{needsGradingCount > 0 ? ` (${needsGradingCount})` : ''}
              </CPButton>
            </Tooltip>
            {orderedSections.length > 0 && (
              <Tooltip title="Review each student's generated questions before their quiz opens">
                <CPButton cpType="link" icon={<RobotOutlined />} onClick={() => setReviewOpen(true)}>
                  Review Generated{readyCount > 0 ? ` (${readyCount})` : ''}
                </CPButton>
              </Tooltip>
            )}
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'questions', icon: <PlusOutlined />, label: 'Questions from a bank…' },
                  { key: 'group', icon: <RetweetOutlined />, label: 'Random draw…' },
                  ...(aiQuizEnabled
                    ? [{
                        key: 'ai',
                        icon: <RobotOutlined />,
                        label: assignmentId == null
                          ? 'AI-generated questions (attach an assignment first)'
                          : 'AI-generated questions…',
                        disabled: assignmentId == null,
                      }]
                    : []),
                ],
                onClick: ({ key }) => {
                  if (key === 'questions') setAddOpen(true);
                  else if (key === 'group') openCreateGroup();
                  else if (key === 'ai') openCreateSection();
                },
              }}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Add <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>
          </Space>
        }
        styles={{ body: { padding: totalItems === 0 ? undefined : 0 } }}
      >
        {orderedSections.length > 0 && !aiQuizEnabled && (
          <Alert
            type="warning"
            showIcon
            style={{ margin: 12 }}
            title="AI quiz question generation is disabled for this course"
            description="This quiz has AI-generated sections, but new submissions won't generate
              questions while the feature is off — students without an approved set can't open the
              quiz. Re-enable the 'AI-Generated Quiz Questions' feature in the course's AI settings,
              or remove the sections."
          />
        )}
        {isLoading ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : totalItems === 0 ? (
          <Empty
            description="Nothing in this quiz yet — add questions or a random draw from a bank"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 24 }}
          />
        ) : (
          <Table dataSource={rows} columns={columns} rowKey="key" size="small" pagination={false} />
        )}
      </Card>

      <AddQuestionsModal
        open={addOpen}
        courseId={course.id!}
        quizId={quiz.id!}
        existingQuestionIds={orderedQuestions.map((m) => m.question)}
        nextSortKey={orderedQuestions.length ? Math.max(...orderedQuestions.map((m) => m.sortKey ?? 0)) + 1 : 0}
        onClose={() => setAddOpen(false)}
      />

      <GroupEditorModal
        open={groupOpen}
        courseId={course.id!}
        quizId={quiz.id!}
        group={editingGroup}
        nextSortKey={orderedGroups.length ? Math.max(...orderedGroups.map((g) => g.sortKey ?? 0)) + 1 : 0}
        onClose={() => setGroupOpen(false)}
      />

      <QuizPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        quiz={current}
        items={previewItems}
        hasGroups={orderedGroups.length > 0}
      />

      <QuizGradingDrawer open={gradingOpen} onClose={() => setGradingOpen(false)} quiz={current} />

      <GeneratedSectionModal
        open={sectionOpen}
        courseId={course.id!}
        quizId={quiz.id!}
        section={editingSection}
        nextSortKey={orderedSections.length ? Math.max(...orderedSections.map((s) => s.sortKey ?? 0)) + 1 : 0}
        onClose={() => setSectionOpen(false)}
      />

      <GeneratedReviewDrawer
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        quiz={current}
        courseId={course.id!}
      />
    </>
  );
};

export default QuizBuilder;
