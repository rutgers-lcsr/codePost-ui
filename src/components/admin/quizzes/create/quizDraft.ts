// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  QuizAssignmentTriggerEnum,
  QuizCloseEventEnum,
  QuizPassingScoreUnitEnum,
  QuizScoringPolicyEnum,
} from '../../../../api-client';
import type { CreateRequest as QuizzesCreateRequest } from '../../../../api-client/apis/QuizzesApi';
import type { QuizSettings } from '../QuizSettingsCard';
import type { QuizWarningInput } from '../quizSettingsWarnings';

export type OffsetUnit = 'minutes' | 'hours' | 'days';
export type WizardStepKey = 'basics' | 'availability' | 'attempts' | 'results' | 'security' | 'ai' | 'review';

/** The in-progress wizard state: the full settings shape plus the close-offset presentation
 *  state (steps unmount on navigation, so "2 hours" must survive as entered, not as 120). */
export interface QuizCreateDraft extends QuizSettings {
  closeOffsetValue: number;
  closeOffsetUnit: OffsetUnit;
}

// The tables below mirror QuizSettingsCard's file-local ones — keep in sync (that file
// stays standalone by design; the wizard presents the same rules its own way).
export const UNIT_FACTOR: Record<OffsetUnit, number> = { minutes: 1, hours: 60, days: 1440 };

export const TRIGGER_HELP: Record<string, string> = {
  [QuizAssignmentTriggerEnum.During]: 'Opens while the assignment is accepting submissions.',
  [QuizAssignmentTriggerEnum.AfterAssignment]: "Opens once the assignment's deadline passes.",
  [QuizAssignmentTriggerEnum.AfterSubmission]: 'Opens for each student once they submit the assignment.',
  [QuizAssignmentTriggerEnum.AfterFeedback]: 'Opens once grades/feedback are released for the whole assignment.',
  [QuizAssignmentTriggerEnum.AfterStudentFeedback]:
    "Opens for each student once their own feedback is available — under live feedback mode this unlocks per student as each submission is graded (self-paced).",
};

// The card inlines these in its Select options; the wizard also needs them on Review.
export const TRIGGER_LABELS: Record<string, string> = {
  [QuizAssignmentTriggerEnum.During]: 'During the assignment',
  [QuizAssignmentTriggerEnum.AfterAssignment]: 'After the assignment closes',
  [QuizAssignmentTriggerEnum.AfterSubmission]: 'After the student submits',
  [QuizAssignmentTriggerEnum.AfterFeedback]: 'After feedback is released',
  [QuizAssignmentTriggerEnum.AfterStudentFeedback]: "After each student's feedback (self-paced)",
};

// Close events that take a "+ N minutes/hours/days" offset.
export const OFFSET_CLOSE_EVENTS = new Set<string>([
  QuizCloseEventEnum.AssignmentDue,
  QuizCloseEventEnum.Submission,
  QuizCloseEventEnum.FeedbackReleased,
]);

export const CLOSE_LABELS: Record<string, string> = {
  [QuizCloseEventEnum.None]: 'No automatic close',
  [QuizCloseEventEnum.AssignmentDue]: "At the assignment's deadline",
  [QuizCloseEventEnum.Submission]: 'After the student submits',
  [QuizCloseEventEnum.FeedbackReleased]: 'When feedback is released',
  [QuizCloseEventEnum.FixedDate]: 'At a fixed date & time',
};

// Which close events make sense for each open trigger (a fixed date is always allowed).
export const CLOSE_OPTIONS_BY_TRIGGER: Record<string, QuizCloseEventEnum[]> = {
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
export const DEFAULT_CLOSE_BY_TRIGGER: Record<string, QuizCloseEventEnum> = {
  [QuizAssignmentTriggerEnum.During]: QuizCloseEventEnum.None,
  [QuizAssignmentTriggerEnum.AfterAssignment]: QuizCloseEventEnum.None,
  [QuizAssignmentTriggerEnum.AfterSubmission]: QuizCloseEventEnum.Submission,
  [QuizAssignmentTriggerEnum.AfterFeedback]: QuizCloseEventEnum.None,
};

// A close whose anchor is the same moment the quiz opens — needs a positive offset or it
// would close instantly.
export const isDegenerateClose = (trigger: string, event: string): boolean =>
  (trigger === QuizAssignmentTriggerEnum.AfterSubmission && event === QuizCloseEventEnum.Submission) ||
  (trigger === QuizAssignmentTriggerEnum.AfterFeedback && event === QuizCloseEventEnum.FeedbackReleased) ||
  (trigger === QuizAssignmentTriggerEnum.AfterAssignment && event === QuizCloseEventEnum.AssignmentDue);

export const closeOptionsFor = (trigger: string): QuizCloseEventEnum[] =>
  CLOSE_OPTIONS_BY_TRIGGER[trigger] ?? [QuizCloseEventEnum.None, QuizCloseEventEnum.FixedDate];

/** Server defaults — a Skip & create from step 1 must equal today's title-only create. */
export const DEFAULT_DRAFT: QuizCreateDraft = {
  title: '',
  description: '',
  assignment: null,
  assignmentTrigger: QuizAssignmentTriggerEnum.During,
  availableFrom: null,
  availableUntil: null,
  closeEvent: QuizCloseEventEnum.None,
  closeOffsetMinutes: 0,
  closeOffsetValue: 0,
  closeOffsetUnit: 'minutes',
  endAttemptsAtClose: false,
  timeLimitMinutes: null,
  attemptsAllowed: 1,
  shuffleQuestions: false,
  oneQuestionAtATime: false,
  allowBacktracking: true,
  showCorrectAnswers: true,
  sealResultsUntilClose: false,
  showResponses: true,
  allowSubmissionReview: true,
  scoringPolicy: QuizScoringPolicyEnum.Highest,
  passingScore: null,
  passingScoreUnit: QuizPassingScoreUnitEnum.Percent,
  isPublished: false,
  gradersCanReviewGenerated: false,
  gradersCanGenerate: false,
  autoPublishGenerated: false,
  manualGeneration: true,
  generationDate: null,
  requireSebBrowser: false,
  sebConfigKey: '',
};

export const SEB_KEY_RE = /^[0-9a-fA-F]{64}$/;

export const offsetMinutes = (draft: QuizCreateDraft): number =>
  draft.closeOffsetValue * UNIT_FACTOR[draft.closeOffsetUnit];

/** Whether the draft has no close the settings can determine up front (mirrors the
 *  unexported neverCloses in quizSettingsWarnings.ts). */
export const neverClosesDraft = (draft: QuizCreateDraft): boolean => {
  if (draft.assignment == null) return draft.availableUntil == null;
  if (draft.closeEvent === QuizCloseEventEnum.None) return true;
  if (draft.closeEvent === QuizCloseEventEnum.FixedDate) return draft.availableUntil == null;
  return false;
};

/** The draft as quizSettingsWarnings input (for the Review step's live warnings). */
export const toWarningInput = (draft: QuizCreateDraft, isPublished: boolean): QuizWarningInput => ({
  assignment: draft.assignment,
  availableUntil: draft.availableUntil,
  closeEvent: draft.closeEvent,
  attemptsAllowed: draft.attemptsAllowed,
  sealResultsUntilClose: draft.sealResultsUntilClose,
  showCorrectAnswers: draft.showCorrectAnswers,
  showResponses: draft.showResponses,
  allowSubmissionReview: draft.allowSubmissionReview,
  isPublished,
  manualGeneration: draft.manualGeneration,
  generationDate: draft.generationDate,
  requireSebBrowser: draft.requireSebBrowser,
  sebConfigKey: draft.sebConfigKey || null,
});

export interface CreateBlocker {
  step: WizardStepKey;
  message: string;
}

/** Pre-create checks mirroring the serializer's hard rejections (core/serializers/quiz.py) —
 *  run on every create path, Skip & create included, so a 400 never eats the user's input. */
export const createBlockers = (draft: QuizCreateDraft): CreateBlocker[] => {
  const blockers: CreateBlocker[] = [];
  if (!draft.title.trim()) {
    blockers.push({ step: 'basics', message: 'A quiz needs a title.' });
  }
  if (draft.assignment != null && isDegenerateClose(draft.assignmentTrigger, draft.closeEvent) && offsetMinutes(draft) === 0) {
    blockers.push({
      step: 'availability',
      message: 'This close event happens the moment the quiz opens — add a positive close offset.',
    });
  }
  if (draft.sealResultsUntilClose && neverClosesDraft(draft)) {
    blockers.push({
      step: 'results',
      message:
        'Results are set to release after the quiz closes, but no close is configured — set a ' +
        'close time in Availability, or release results as soon as students submit.',
    });
  }
  if (draft.requireSebBrowser && draft.sebConfigKey.trim() && !SEB_KEY_RE.test(draft.sebConfigKey.trim())) {
    blockers.push({
      step: 'security',
      message: 'The SEB Config Key must be exactly 64 hex characters (or leave it empty).',
    });
  }
  return blockers;
};

/** The full POST /quizzes/ body. One request carries every setting; only the access code
 *  (server-managed) and AI sections (need a quiz id) live outside the wizard. */
export const buildCreatePayload = (
  draft: QuizCreateDraft,
  courseId: number,
  isPublished: boolean,
): QuizzesCreateRequest['quiz'] => ({
  course: courseId,
  title: draft.title.trim(),
  description: draft.description,
  assignment: draft.assignment,
  assignmentTrigger: draft.assignmentTrigger,
  availableFrom: draft.availableFrom,
  availableUntil: draft.availableUntil,
  closeEvent: draft.closeEvent,
  closeOffsetMinutes: offsetMinutes(draft),
  endAttemptsAtClose: draft.endAttemptsAtClose,
  timeLimitMinutes: draft.timeLimitMinutes,
  attemptsAllowed: draft.attemptsAllowed,
  shuffleQuestions: draft.shuffleQuestions,
  oneQuestionAtATime: draft.oneQuestionAtATime,
  allowBacktracking: draft.allowBacktracking,
  showCorrectAnswers: draft.showCorrectAnswers,
  sealResultsUntilClose: draft.sealResultsUntilClose,
  showResponses: draft.showResponses,
  allowSubmissionReview: draft.allowSubmissionReview,
  scoringPolicy: draft.scoringPolicy,
  passingScore: draft.passingScore,
  passingScoreUnit: draft.passingScoreUnit,
  isPublished,
  gradersCanReviewGenerated: draft.gradersCanReviewGenerated,
  gradersCanGenerate: draft.gradersCanGenerate,
  autoPublishGenerated: draft.autoPublishGenerated,
  manualGeneration: draft.manualGeneration,
  generationDate: draft.generationDate,
  requireSebBrowser: draft.requireSebBrowser,
  // The serializer validates any sent key — never send '' (it would 400).
  sebConfigKey: draft.sebConfigKey.trim() || null,
});
