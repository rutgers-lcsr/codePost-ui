// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, DatePicker, Flex, Input, InputNumber, Modal, Select, Space, Switch, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizzesApi } from '../../../api-client/clients';
import {
  Quiz,
  QuizAssignmentTriggerEnum,
  QuizShowAnswersEnum,
  QuizPassingScoreUnitEnum,
  QuizCloseEventEnum,
} from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { quizKeys } from '../../../lib/queryKeys';
import MarkdownField from './MarkdownField';

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

const TRIGGER_DEFAULT = QuizAssignmentTriggerEnum.During;
const SHOW_DEFAULT = QuizShowAnswersEnum.AfterSubmit;
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
  showCorrectAnswers: q.showCorrectAnswers || SHOW_DEFAULT,
  passingScore: q.passingScore ?? null,
  passingScoreUnit: q.passingScoreUnit || UNIT_DEFAULT,
  isPublished: q.isPublished ?? false,
  gradersCanReviewGenerated: q.gradersCanReviewGenerated ?? false,
  autoPublishGenerated: q.autoPublishGenerated ?? false,
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
          passingScore: settings.passingScore,
          passingScoreUnit: settings.passingScoreUnit,
          isPublished: overrides?.isPublished ?? settings.isPublished,
          gradersCanReviewGenerated: settings.gradersCanReviewGenerated,
          autoPublishGenerated: settings.autoPublishGenerated,
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
    }
    patch({ isPublished: checked });
  };

  return (
    <Card
      title={
        <Typography.Title level={2} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Quiz Settings
        </Typography.Title>
      }
      extra={
        <Space size="middle">
          <Space size={6}>
            <Switch checked={settings.isPublished} onChange={handlePublishToggle} />
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
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Title
          </Text>
          <Input value={settings.title} onChange={(e) => patch({ title: e.target.value })} maxLength={128} />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Attached assignment
          </Text>
          <Select
            allowClear
            placeholder="Not attached - Attach to an assignment to control availability"
            style={{ minWidth: 280 }}
            value={settings.assignment ?? undefined}
            onChange={(v) => patch({ assignment: v ?? null })}
            options={assignmentOptions}
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Availability
          </Text>
          {settings.assignment != null ? (
            <Flex vertical gap={12}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Opens
                </Text>
                <Select
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
                  {settings.closeEvent === QuizCloseEventEnum.FixedDate && (
                    <DatePicker
                      showTime
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
                  placeholder="Closes at"
                  // Can't close before it opens.
                  minDate={settings.availableFrom ? dayjs(settings.availableFrom) : undefined}
                  value={settings.availableUntil ? dayjs(settings.availableUntil) : null}
                  onChange={(d) => patch({ availableUntil: d ? d.toISOString() : null })}
                />
              </Flex>
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
              value={settings.timeLimitMinutes ?? undefined}
              onChange={(v) => patch({ timeLimitMinutes: v ?? null })}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Attempts (0 = ∞)
            </Text>
            <InputNumber
              min={0}
              style={{ width: 110 }}
              value={settings.attemptsAllowed}
              onChange={(v) => patch({ attemptsAllowed: v ?? 1 })}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Show correct answers
            </Text>
            <Select
              style={{ width: 180 }}
              value={settings.showCorrectAnswers}
              onChange={(v) => patch({ showCorrectAnswers: v })}
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
                max={settings.passingScoreUnit === QuizPassingScoreUnitEnum.Percent ? 100 : undefined}
                placeholder="None"
                style={{ width: 110 }}
                value={settings.passingScore ?? undefined}
                onChange={(v) => patch({ passingScore: v ?? null })}
              />
              <Select
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

        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            Question delivery
          </Text>
          <Flex vertical gap={10}>
            <Space>
              <Switch checked={settings.shuffleQuestions} onChange={(v) => patch({ shuffleQuestions: v })} />
              <Text>Shuffle question order</Text>
            </Space>
            <Space>
              <Switch checked={settings.oneQuestionAtATime} onChange={(v) => patch({ oneQuestionAtATime: v })} />
              <Text>One question at a time</Text>
            </Space>
            {settings.oneQuestionAtATime && (
              <Space style={{ marginLeft: 36 }}>
                <Switch
                  size="small"
                  checked={settings.allowBacktracking}
                  onChange={(v) => patch({ allowBacktracking: v })}
                />
                <Text type="secondary">Let students go back to previous questions</Text>
              </Space>
            )}
          </Flex>
        </div>
        {hasGeneratedSections && (
          <div>
            <Text strong>AI-generated questions</Text>
            <Flex vertical gap={10} style={{ marginTop: 8 }}>
              <Space>
                <Switch
                  checked={settings.autoPublishGenerated}
                  onChange={(v) => patch({ autoPublishGenerated: v })}
                />
                <Text>Publish generated questions automatically (skip review)</Text>
              </Space>
              <Space>
                <Switch
                  checked={settings.gradersCanReviewGenerated}
                  onChange={(v) => patch({ gradersCanReviewGenerated: v })}
                />
                <Text>Graders may review and publish generated questions</Text>
              </Space>
              {settings.closeEvent === QuizCloseEventEnum.Submission && !settings.autoPublishGenerated && (
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
  );
};

export default QuizSettingsCard;
