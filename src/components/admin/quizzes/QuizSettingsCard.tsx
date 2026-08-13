// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, DatePicker, Divider, Flex, Input, InputNumber, Modal, Select, Space, Switch, Typography, message } from 'antd';
import { CopyOutlined, DeleteOutlined, KeyOutlined, RedoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizzesApi } from '../../../api-client/clients';
import {
  Quiz,
  QuizAssignmentTriggerEnum,
  QuizPassingScoreUnitEnum,
  QuizCloseEventEnum,
  QuizScoringPolicyEnum,
} from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { quizSettingsWarnings } from './quizSettingsWarnings';
import { quizKeys } from '../../../lib/queryKeys';
import MarkdownField from './MarkdownField';
import PanelCard from './PanelCard';

const { Text } = Typography;

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

/** A titled settings section, so the page scans as setup steps. */
const Section: React.FC<{ title: string; hint?: string; first?: boolean; testId?: string; children: React.ReactNode }> = ({
  title,
  hint,
  first,
  testId,
  children,
}) => (
  <div data-testid={testId}>
    {!first && <Divider style={{ margin: '4px 0 12px' }} />}
    <Text strong style={{ display: 'block', marginBottom: hint ? 2 : 12 }}>
      {title}
    </Text>
    {hint && (
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        {hint}
      </Text>
    )}
    {children}
  </div>
);

const TRIGGER_DEFAULT = QuizAssignmentTriggerEnum.During;
const CLOSE_DEFAULT = QuizCloseEventEnum.None;
const UNIT_DEFAULT = QuizPassingScoreUnitEnum.Percent;

/** The saved quiz normalized to the shape the settings form edits (defaults applied). */
const settingsOf = (q: Quiz) => ({
  title: q.title,
  description: q.description ?? '',
  assignment: q.assignment ?? null,
  assignmentTrigger: q.assignmentTrigger || TRIGGER_DEFAULT,
  availableFrom: q.availableFrom ?? null,
  availableUntil: q.availableUntil ?? null,
  closeEvent: q.closeEvent || CLOSE_DEFAULT,
  closeOffsetMinutes: q.closeOffsetMinutes ?? 0,
  endAttemptsAtClose: q.endAttemptsAtClose ?? false,
  timeLimitMinutes: q.timeLimitMinutes ?? null,
  attemptsAllowed: q.attemptsAllowed ?? 1,
  shuffleQuestions: q.shuffleQuestions ?? false,
  oneQuestionAtATime: q.oneQuestionAtATime ?? false,
  allowBacktracking: q.allowBacktracking ?? true,
  showCorrectAnswers: q.showCorrectAnswers ?? true,
  sealResultsUntilClose: q.sealResultsUntilClose ?? false,
  showResponses: q.showResponses ?? true,
  allowSubmissionReview: q.allowSubmissionReview ?? true,
  scoringPolicy: q.scoringPolicy || QuizScoringPolicyEnum.Highest,
  passingScore: q.passingScore ?? null,
  passingScoreUnit: q.passingScoreUnit || UNIT_DEFAULT,
  isPublished: q.isPublished ?? false,
  gradersCanReviewGenerated: q.gradersCanReviewGenerated ?? false,
  autoPublishGenerated: q.autoPublishGenerated ?? false,
  manualGeneration: q.manualGeneration ?? true,
  generationDate: q.generationDate ?? null,
  requireSebBrowser: q.requireSebBrowser ?? false,
  sebConfigKey: q.sebConfigKey ?? '',
});

export type QuizSettings = ReturnType<typeof settingsOf>;
/** Unsaved edits, sparse: only the fields the instructor has touched. */
export type QuizSettingsDraft = Partial<QuizSettings>;

interface IProps {
  courseId: number;
  /** The saved quiz (the builder's `current`: live detail when loaded, else the prop). */
  quiz: Quiz;
  assignmentOptions: Array<{ value: number | undefined; label: string }>;
  /** Show the AI-generated-questions toggles (the quiz has generated sections). */
  hasGeneratedSections: boolean;
  /** Draft state lives in the builder (it also gates the Add menu's AI item). */
  draft: QuizSettingsDraft;
  onDraftChange: (patch: QuizSettingsDraft) => void;
}

/** The Quiz Settings card: title/description/attachment, availability + close rules,
 *  attempt/delivery options, and the publish toggle. Edits accumulate in a sparse draft
 *  over the saved quiz; Save PATCHes the full settings payload. */
const QuizSettingsCard: React.FC<IProps> = ({
  courseId,
  quiz,
  assignmentOptions,
  hasGeneratedSections,
  draft,
  onDraftChange,
}) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  // Late-access code is server-managed (read-only on the quiz), so its own actions handle it —
  // independent of the settings draft/Save flow.
  const [rotatingCode, setRotatingCode] = React.useState(false);
  const [clearingCode, setClearingCode] = React.useState(false);

  // The close offset is presentation state (90 min stays "90 minutes", not "1.5 hours"),
  // re-derived only when switching quizzes. Its minute total feeds the draft comparison.
  const [offsetValue, setOffsetValue] = React.useState<number>(splitOffset(quiz.closeOffsetMinutes ?? 0).value);
  const [offsetUnit, setOffsetUnit] = React.useState<OffsetUnit>(splitOffset(quiz.closeOffsetMinutes ?? 0).unit);
  React.useEffect(() => {
    setOffsetValue(splitOffset(quiz.closeOffsetMinutes ?? 0).value);
    setOffsetUnit(splitOffset(quiz.closeOffsetMinutes ?? 0).unit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.id]);

  const saved = settingsOf(quiz);
  const settings: QuizSettings = { ...saved, ...draft, closeOffsetMinutes: offsetValue * UNIT_FACTOR[offsetUnit] };
  const dirty = (Object.keys(settings) as Array<keyof QuizSettings>).some((k) => settings[k] !== saved[k]);

  // Live configuration warnings/tips (e.g. results held until a close that never happens).
  const warnings = quizSettingsWarnings(settings);

  const patch = onDraftChange;

  // A degenerate close (anchor == open moment) needs a positive offset, so seed one.
  const ensureCloseOffset = (trigger: string, event: string) => {
    if (isDegenerateClose(trigger, event) && settings.closeOffsetMinutes === 0) {
      setOffsetValue(1);
      setOffsetUnit('days');
    }
  };
  const handleTriggerChange = (t: QuizAssignmentTriggerEnum) => {
    const allowed = closeOptionsFor(t);
    const next = allowed.includes(settings.closeEvent)
      ? settings.closeEvent
      : DEFAULT_CLOSE_BY_TRIGGER[t] ?? QuizCloseEventEnum.None;
    patch({ assignmentTrigger: t, closeEvent: next });
    ensureCloseOffset(t, next);
  };
  const handleCloseEventChange = (e: QuizCloseEventEnum) => {
    patch({ closeEvent: e });
    ensureCloseOffset(settings.assignmentTrigger, e);
  };

  const handleSave = async (overrides?: { isPublished?: boolean }) => {
    if (!settings.title.trim()) {
      message.warning('A quiz needs a title.');
      return;
    }
    setSaving(true);
    try {
      await quizzesApi.partialUpdate({
        id: quiz.id!,
        patchedQuiz: {
          title: settings.title.trim(),
          description: settings.description,
          assignment: settings.assignment,
          assignmentTrigger: settings.assignmentTrigger,
          availableFrom: settings.availableFrom,
          availableUntil: settings.availableUntil,
          closeEvent: settings.closeEvent,
          closeOffsetMinutes: settings.closeOffsetMinutes,
          endAttemptsAtClose: settings.endAttemptsAtClose,
          timeLimitMinutes: settings.timeLimitMinutes,
          attemptsAllowed: settings.attemptsAllowed,
          shuffleQuestions: settings.shuffleQuestions,
          oneQuestionAtATime: settings.oneQuestionAtATime,
          allowBacktracking: settings.allowBacktracking,
          showCorrectAnswers: settings.showCorrectAnswers,
          sealResultsUntilClose: settings.sealResultsUntilClose,
          showResponses: settings.showResponses,
          allowSubmissionReview: settings.allowSubmissionReview,
          scoringPolicy: settings.scoringPolicy,
          passingScore: settings.passingScore,
          passingScoreUnit: settings.passingScoreUnit,
          isPublished: overrides?.isPublished ?? settings.isPublished,
          gradersCanReviewGenerated: settings.gradersCanReviewGenerated,
          autoPublishGenerated: settings.autoPublishGenerated,
          manualGeneration: settings.manualGeneration,
          generationDate: settings.generationDate,
          requireSebBrowser: settings.requireSebBrowser,
          sebConfigKey: settings.sebConfigKey.trim() || null,
        },
      });
      message.success('Quiz settings saved.');
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(quiz.id!) });
      queryClient.invalidateQueries({ queryKey: quizKeys.list(courseId) });
    } catch (err) {
      message.error(apiErrorMessage(err, 'title') ?? 'Failed to save quiz settings.');
    } finally {
      setSaving(false);
    }
  };

  const invalidateQuiz = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.detail(quiz.id!) });
    queryClient.invalidateQueries({ queryKey: quizKeys.list(courseId) });
  };

  const rotateAccessCode = async () => {
    setRotatingCode(true);
    try {
      await quizzesApi.generateAccessCodePartialUpdate({ id: quiz.id! });
      message.success('Access code generated.');
      invalidateQuiz();
    } catch (err) {
      message.error(apiErrorMessage(err) ?? 'Could not update the access code.');
    } finally {
      setRotatingCode(false);
    }
  };

  // Generating a new code invalidates the old one, so confirm when replacing an existing code.
  const handleGenerateCode = () => {
    if (quiz.accessCode) {
      Modal.confirm({
        title: 'Generate a new access code?',
        content: 'The current code stops working immediately. Students you already shared it with will need the new one.',
        okText: 'Generate new code',
        cancelText: 'Cancel',
        onOk: rotateAccessCode,
      });
    } else {
      rotateAccessCode();
    }
  };

  const handleClearCode = async () => {
    setClearingCode(true);
    try {
      await quizzesApi.generateAccessCodePartialUpdate({
        id: quiz.id!,
        patchedGenerateQuizAccessCodeRequest: { clear: true },
      });
      message.success('Access code removed.');
      invalidateQuiz();
    } catch (err) {
      message.error(apiErrorMessage(err) ?? 'Could not remove the access code.');
    } finally {
      setClearingCode(false);
    }
  };

  const copyAccessCode = async () => {
    if (!quiz.accessCode) return;
    await navigator.clipboard.writeText(quiz.accessCode);
    message.success('Access code copied.');
  };

  // Publishing makes the quiz visible to students, so nudge the author to save any
  // pending edits first (otherwise students would see a stale version).
  const handlePublishToggle = (checked: boolean) => {
    if (checked && dirty) {
      Modal.confirm({
        title: 'Save changes and publish?',
        content: 'This quiz has unsaved changes. Save them now so students see the latest version.',
        okText: 'Save & publish',
        cancelText: 'Not now',
        onOk: async () => {
          patch({ isPublished: true });
          await handleSave({ isPublished: true });
        },
      });
      // Wait for the confirm — don't publish the draft immediately (else "Not now" still flips it).
      return;
    }
    patch({ isPublished: checked });
  };

  return (
    <PanelCard
      title={
        <Typography.Title level={2} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Quiz Settings
        </Typography.Title>
      }
      extra={
        <Space size="middle">
          <Space size={6}>
            <Switch aria-label="Publish quiz" checked={settings.isPublished} onChange={handlePublishToggle} />
            <Text type={settings.isPublished ? undefined : 'secondary'}>
              {settings.isPublished ? 'Published' : 'Draft'}
            </Text>
          </Space>
          <CPButton cpType="primary" onClick={() => handleSave()} disabled={!dirty} loading={saving}>
            Save
          </CPButton>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Flex vertical gap={12}>
        {warnings.length > 0 && (
          <Flex vertical gap={8} data-testid="quiz-settings-warnings">
            {warnings.map((w) => (
              <Alert key={w.key} type={w.level} showIcon message={w.text} data-testid={`quiz-warning-${w.key}`} />
            ))}
          </Flex>
        )}
        <Section first title="Basics">
          <Flex vertical gap={12}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Title
              </Text>
              <Input
                aria-label="Quiz title"
                value={settings.title}
                onChange={(e) => patch({ title: e.target.value })}
                maxLength={128}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Description (Markdown)
              </Text>
              <MarkdownField
                value={settings.description}
                onChange={(v) => patch({ description: v })}
                courseId={courseId}
                minRows={3}
                ariaLabel="Quiz description"
                placeholder="What this quiz covers — supports Markdown and images…"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Appears on the quiz page when the student is taking the quiz. Can be used to provide instructions or
                context for the quiz.
              </Text>
            </div>
          </Flex>
        </Section>
        <Section
          title="Availability"
          hint="When students can start the quiz. Attach an assignment to open and close the quiz around that assignment's deadline, submissions, or feedback."
        >
          <Flex vertical gap={12}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Attached assignment
              </Text>
              <Select
                allowClear
                aria-label="Attached assignment"
                placeholder="Not attached - Attach to an assignment to control availability"
                style={{ minWidth: 280 }}
                value={settings.assignment ?? undefined}
                onChange={(v) => patch({ assignment: v ?? null })}
                options={assignmentOptions}
              />
            </div>
            {settings.assignment != null ? (
              <Flex vertical gap={12}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Opens
                  </Text>
                  <Select
                    aria-label="Quiz opens"
                    style={{ minWidth: 280 }}
                    value={settings.assignmentTrigger}
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
                    {TRIGGER_HELP[settings.assignmentTrigger]}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Closes
                  </Text>
                  <Flex gap={8} wrap align="center">
                    <Select
                      aria-label="Quiz closes"
                      style={{ minWidth: 260 }}
                      value={settings.closeEvent}
                      onChange={handleCloseEventChange}
                      options={closeOptionsFor(settings.assignmentTrigger).map((v) => ({
                        value: v,
                        label: CLOSE_LABELS[v],
                      }))}
                    />
                    {OFFSET_CLOSE_EVENTS.has(settings.closeEvent) && (
                      <>
                        <Text type="secondary">+</Text>
                        <InputNumber
                          min={0}
                          aria-label="Close offset amount"
                          style={{ width: 80 }}
                          value={offsetValue}
                          onChange={(v) => setOffsetValue(v ?? 0)}
                        />
                        <Select
                          aria-label="Close offset unit"
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
                    {settings.closeEvent === QuizCloseEventEnum.FixedDate && (
                      <DatePicker
                        showTime
                        aria-label="Closes at"
                        placeholder="Closes at"
                        value={settings.availableUntil ? dayjs(settings.availableUntil) : null}
                        onChange={(d) => patch({ availableUntil: d ? d.toISOString() : null })}
                      />
                    )}
                  </Flex>
                  {settings.closeEvent === QuizCloseEventEnum.Submission && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                      Each student&apos;s window starts when they submit the assignment.
                    </Text>
                  )}
                  {settings.closeEvent !== QuizCloseEventEnum.None && (
                    <Space style={{ marginTop: 8 }}>
                      <Switch
                        size="small"
                        aria-label="End in-progress attempts at the close time"
                        checked={settings.endAttemptsAtClose}
                        onChange={(v) => patch({ endAttemptsAtClose: v })}
                      />
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
                    aria-label="Opens at"
                    placeholder="Opens at"
                    value={settings.availableFrom ? dayjs(settings.availableFrom) : null}
                    onChange={(d) => {
                      const iso = d ? d.toISOString() : null;
                      // Keep the window valid: drop a close that's no longer after the new open.
                      if (iso && settings.availableUntil && !dayjs(settings.availableUntil).isAfter(dayjs(iso))) {
                        patch({ availableFrom: iso, availableUntil: null });
                      } else {
                        patch({ availableFrom: iso });
                      }
                    }}
                  />
                  <DatePicker
                    showTime
                    aria-label="Closes at"
                    placeholder="Closes at"
                    // Can't close before it opens.
                    minDate={settings.availableFrom ? dayjs(settings.availableFrom) : undefined}
                    value={settings.availableUntil ? dayjs(settings.availableUntil) : null}
                    onChange={(d) => patch({ availableUntil: d ? d.toISOString() : null })}
                  />
                </Flex>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                  Leave both empty to keep the quiz available whenever it&apos;s published.
                </Text>
                {settings.availableUntil && (
                  <Space style={{ marginTop: 8 }}>
                    <Switch
                      size="small"
                      checked={settings.endAttemptsAtClose}
                      onChange={(v) => patch({ endAttemptsAtClose: v })}
                    />
                    <Text type="secondary">
                      End in-progress attempts at the close time (students see the time remaining)
                    </Text>
                  </Space>
                )}
              </div>
            )}
          </Flex>
        </Section>

        <Section
          title="Late access code"
          hint="Optional. Share this code with students who missed the deadline — entering it lets them start the quiz after it closes, with the normal time limit. Nothing else about availability changes, and the code is never shown to students."
        >
          {quiz.accessCode ? (
            <Flex gap={8} wrap align="center">
              <Input
                readOnly
                aria-label="Quiz access code"
                value={quiz.accessCode}
                style={{ width: 150, fontFamily: 'monospace', letterSpacing: 2, fontWeight: 600 }}
                data-testid="quiz-access-code"
              />
              <CPButton cpType="secondary" icon={<CopyOutlined />} onClick={copyAccessCode} disabled={rotatingCode || clearingCode}>
                Copy
              </CPButton>
              <CPButton
                cpType="secondary"
                icon={<RedoOutlined />}
                onClick={handleGenerateCode}
                loading={rotatingCode}
                disabled={clearingCode}
              >
                New code
              </CPButton>
              <CPButton
                cpType="danger"
                icon={<DeleteOutlined />}
                onClick={handleClearCode}
                loading={clearingCode}
                disabled={rotatingCode}
                data-testid="quiz-remove-access-code"
              >
                Remove
              </CPButton>
            </Flex>
          ) : (
            <CPButton
              cpType="secondary"
              icon={<KeyOutlined />}
              onClick={handleGenerateCode}
              loading={rotatingCode}
              data-testid="quiz-generate-access-code"
            >
              Generate access code
            </CPButton>
          )}
        </Section>

        <Section
          title="Exam security"
          testId="quiz-exam-security"
          hint="Require students to take this quiz in Safe Exam Browser, a free locked-down browser (Windows, macOS, iPad). Students get a “Launch in Safe Exam Browser” button that opens the quiz in SEB directly — no setup needed. The server rejects any quiz request that doesn't carry a valid SEB signature; per-student exemptions (e.g. Linux/ChromeOS users) are set on the roster."
        >
          <Flex vertical gap={10}>
            <Space>
              <Switch
                aria-label="Require Safe Exam Browser"
                checked={settings.requireSebBrowser}
                onChange={(v) => patch({ requireSebBrowser: v })}
                data-testid="quiz-require-seb"
              />
              <Text>Require Safe Exam Browser</Text>
            </Space>
            {settings.requireSebBrowser && (
              <div style={{ marginLeft: 36 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Optional: Config Key of your own SEB configuration (64 hex characters, shown in the
                  SEB Config Tool) — only needed if you distribute a custom .seb file instead of the
                  built-in launch
                </Text>
                <Input
                  aria-label="SEB Config Key"
                  placeholder="e.g. 81aad4ab9dfd447cc479e6a4a7c9a544…"
                  style={{ width: 420, maxWidth: '100%', fontFamily: 'monospace' }}
                  maxLength={64}
                  value={settings.sebConfigKey}
                  onChange={(e) => patch({ sebConfigKey: e.target.value })}
                  data-testid="quiz-seb-config-key"
                />
              </div>
            )}
          </Flex>
        </Section>

        <Section title="Attempts & grading">
          <Flex gap={16} wrap align="start">
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Time limit (min)
              </Text>
              <InputNumber
                min={1}
                aria-label="Time limit in minutes"
                placeholder="Untimed"
                style={{ width: 130 }}
                value={settings.timeLimitMinutes ?? undefined}
                onChange={(v) => patch({ timeLimitMinutes: v ?? null })}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Attempts allowed
              </Text>
              <InputNumber
                min={0}
                aria-label="Attempts allowed (0 for unlimited)"
                style={{ width: 110 }}
                value={settings.attemptsAllowed}
                onChange={(v) => patch({ attemptsAllowed: v ?? 1 })}
              />
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                0 = unlimited
              </Text>
            </div>
            {settings.attemptsAllowed !== 1 && (
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Score to keep
                </Text>
                <Select
                  aria-label="Score to keep across attempts"
                  style={{ width: 180 }}
                  value={settings.scoringPolicy}
                  onChange={(v) => patch({ scoringPolicy: v })}
                  options={[
                    { value: QuizScoringPolicyEnum.Highest, label: 'Highest attempt' },
                    { value: QuizScoringPolicyEnum.Latest, label: 'Latest attempt' },
                    { value: QuizScoringPolicyEnum.Average, label: 'Average of attempts' },
                  ]}
                />
              </div>
            )}
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Passing score
              </Text>
              <Space.Compact>
                <InputNumber
                  min={0}
                  max={settings.passingScoreUnit === QuizPassingScoreUnitEnum.Percent ? 100 : undefined}
                  aria-label="Passing score"
                  placeholder="None"
                  style={{ width: 110 }}
                  value={settings.passingScore ?? undefined}
                  onChange={(v) => patch({ passingScore: v ?? null })}
                />
                <Select
                  aria-label="Passing score unit"
                  style={{ width: 100 }}
                  value={settings.passingScoreUnit}
                  onChange={(u) => {
                    // Avoid a guaranteed 400: percent can't exceed 100.
                    if (
                      u === QuizPassingScoreUnitEnum.Percent &&
                      settings.passingScore != null &&
                      settings.passingScore > 100
                    ) {
                      patch({ passingScoreUnit: u, passingScore: 100 });
                    } else {
                      patch({ passingScoreUnit: u });
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
        </Section>

        <Section title="After submission" hint="What students see about their results once they turn in an attempt.">
          {/* Score-release timing is independent of reopening — it also gates the card score. */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              When results are released
            </Text>
            <Select
              aria-label="When results are released"
              style={{ width: 220 }}
              value={settings.sealResultsUntilClose ? 'after_close' : 'immediately'}
              onChange={(v) => patch({ sealResultsUntilClose: v === 'after_close' })}
              options={[
                { value: 'immediately', label: 'As soon as they submit' },
                { value: 'after_close', label: 'After the quiz closes' },
              ]}
            />
            {settings.sealResultsUntilClose && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, maxWidth: 320 }}>
                Scores, points, and the answer key stay hidden — on the quiz card and on review —
                until the quiz closes for the student.
              </Text>
            )}
          </div>

          <Space style={{ marginBottom: 12 }}>
            <Switch
              aria-label="Let students reopen submitted attempts"
              checked={settings.allowSubmissionReview}
              onChange={(v) => patch({ allowSubmissionReview: v })}
            />
            <Text>Let students reopen submitted attempts</Text>
          </Space>
          {!settings.allowSubmissionReview && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12, maxWidth: 400 }}>
              Students get a submission confirmation only — they can't reopen a submitted attempt.
              Their score still appears on the quiz card once results are released.
            </Text>
          )}
          <Flex gap={16} wrap align="start">
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Results students see
              </Text>
              <Select
                aria-label="Results students see after submitting"
                style={{ width: 200 }}
                disabled={!settings.allowSubmissionReview}
                value={settings.showResponses ? 'full' : 'scores'}
                onChange={(v) => patch({ showResponses: v === 'full' })}
                options={[
                  { value: 'full', label: 'Scores + their answers' },
                  { value: 'scores', label: 'Scores only' },
                ]}
              />
              {settings.allowSubmissionReview && !settings.showResponses && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, maxWidth: 200 }}>
                  On review, students see their score but not the questions or their answers.
                </Text>
              )}
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Show correct answers
              </Text>
              <Space>
                <Switch
                  aria-label="Show the correct-answer key on review"
                  disabled={!settings.allowSubmissionReview || !settings.showResponses}
                  checked={settings.showCorrectAnswers}
                  onChange={(v) => patch({ showCorrectAnswers: v })}
                />
                <Text type={!settings.allowSubmissionReview || !settings.showResponses ? 'secondary' : undefined}>
                  Reveal the answer key on review
                </Text>
              </Space>
              {(!settings.allowSubmissionReview || !settings.showResponses) && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, maxWidth: 220 }}>
                  {!settings.allowSubmissionReview
                    ? 'Available when students can reopen submissions.'
                    : 'Available when students see their answers (not “Scores only”).'}
                </Text>
              )}
            </div>
          </Flex>
        </Section>

        <Section title="Question delivery">
          <Flex vertical gap={10}>
            <Space>
              <Switch
                aria-label="Shuffle question order"
                checked={settings.shuffleQuestions}
                onChange={(v) => patch({ shuffleQuestions: v })}
              />
              <Text>Shuffle question order</Text>
            </Space>
            <Space>
              <Switch
                aria-label="One question at a time"
                checked={settings.oneQuestionAtATime}
                onChange={(v) => patch({ oneQuestionAtATime: v })}
              />
              <Text>One question at a time</Text>
            </Space>
            {settings.oneQuestionAtATime && (
              <Space style={{ marginLeft: 36 }}>
                <Switch
                  size="small"
                  aria-label="Let students go back to previous questions"
                  checked={settings.allowBacktracking}
                  onChange={(v) => patch({ allowBacktracking: v })}
                />
                <Text type="secondary">Let students go back to previous questions</Text>
              </Space>
            )}
          </Flex>
        </Section>
        {hasGeneratedSections && (
          <Section title="AI-generated questions">
            <Flex vertical gap={10}>
              <Space>
                <Switch
                  aria-label="Publish generated questions automatically"
                  checked={settings.autoPublishGenerated}
                  onChange={(v) => patch({ autoPublishGenerated: v })}
                />
                <Text>Publish generated questions automatically (skip review)</Text>
              </Space>
              <Space>
                <Switch
                  aria-label="Graders may review and publish generated questions"
                  checked={settings.gradersCanReviewGenerated}
                  onChange={(v) => patch({ gradersCanReviewGenerated: v })}
                />
                <Text>Graders may review and publish generated questions</Text>
              </Space>
              <Space>
                <Switch
                  aria-label="Generate question sets manually"
                  checked={settings.manualGeneration}
                  // The backend rejects a generation time without manual mode, so turning
                  // the toggle off must clear the date in the same save.
                  onChange={(v) =>
                    patch(v ? { manualGeneration: true } : { manualGeneration: false, generationDate: null })
                  }
                />
                <Text>Generate question sets manually (turn off automatic generation)</Text>
              </Space>
              {settings.manualGeneration && (
                <div style={{ marginLeft: 36 }}>
                  <DatePicker
                    showTime
                    aria-label="Scheduled generation time"
                    placeholder="Generate missing at… (optional)"
                    value={settings.generationDate ? dayjs(settings.generationDate) : null}
                    onChange={(d) => patch({ generationDate: d ? d.toISOString() : null })}
                  />
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, maxWidth: 440 }}>
                    Optional one-time run: at this time, question sets are generated for students
                    who have a submission but no set yet. Students who submit afterwards show up
                    under Generate missing in the Review tab. Moving the time later re-runs it for
                    newly missing students.
                  </Text>
                  {quiz.scheduledGenerationRanAt && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                      Last scheduled run: {dayjs(quiz.scheduledGenerationRanAt).format('MMM D, YYYY h:mm A')}
                    </Text>
                  )}
                </div>
              )}
              {settings.closeEvent === QuizCloseEventEnum.Submission && !settings.autoPublishGenerated && (
                // Explicit dark amber (#8a5a00 ≈ 5.9:1 on white) — antd's default warning
                // color (~#faad14) fails WCAG AA for normal text.
                <Text style={{ color: '#8a5a00', fontSize: 13 }}>
                  This quiz closes relative to each student's submission, but their questions
                  only open once reviewed — a slow review can eat into (or consume) their
                  window. Review promptly, extend the close offset, or enable auto-publish.
                </Text>
              )}
            </Flex>
          </Section>
        )}
      </Flex>
    </PanelCard>
  );
};

export default QuizSettingsCard;
