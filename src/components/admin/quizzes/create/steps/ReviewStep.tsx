// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Descriptions, Flex, Typography } from 'antd';
import dayjs from 'dayjs';
import { QuizCloseEventEnum, QuizPassingScoreUnitEnum, QuizScoringPolicyEnum } from '../../../../../api-client';
import { Assignment } from '../../../../../types/common';
import { quizSettingsWarnings } from '../../quizSettingsWarnings';
import { CLOSE_LABELS, OFFSET_CLOSE_EVENTS, TRIGGER_LABELS, toWarningInput } from '../quizDraft';
import { StepProps } from './types';

const { Text } = Typography;

interface IProps extends StepProps {
  assignments: Assignment[];
}

const fmtDate = (iso: string) => dayjs(iso).format('MMM D, YYYY h:mm A');

const SCORING_LABELS: Record<string, string> = {
  [QuizScoringPolicyEnum.Highest]: 'highest attempt counts',
  [QuizScoringPolicyEnum.Latest]: 'latest attempt counts',
  [QuizScoringPolicyEnum.Average]: 'attempts are averaged',
};

/** Everything the wizard will create, in plain language, plus the live configuration
 *  warnings — the last look before Create as draft / Create & publish. */
const ReviewStep: React.FC<IProps> = ({ draft, assignments }) => {
  // Warnings are computed against the draft state; publish choice is made by the footer
  // buttons, so review as a draft (the draft-not-published tip doubles as the publish nudge).
  const warnings = quizSettingsWarnings(toWarningInput(draft, false));

  const attachedName = assignments.find((a) => a.id === draft.assignment)?.name;

  const opens =
    draft.assignment != null
      ? TRIGGER_LABELS[draft.assignmentTrigger]
      : draft.availableFrom
        ? fmtDate(draft.availableFrom)
        : 'As soon as it’s published';

  let closes: string;
  if (draft.assignment != null) {
    closes = CLOSE_LABELS[draft.closeEvent];
    if (OFFSET_CLOSE_EVENTS.has(draft.closeEvent) && draft.closeOffsetValue > 0) {
      closes += ` + ${draft.closeOffsetValue} ${draft.closeOffsetUnit}`;
    }
    if (draft.closeEvent === QuizCloseEventEnum.FixedDate) {
      closes = draft.availableUntil ? fmtDate(draft.availableUntil) : 'At a fixed date (not set)';
    }
  } else {
    closes = draft.availableUntil ? fmtDate(draft.availableUntil) : 'No automatic close';
  }
  if (draft.closeEvent !== QuizCloseEventEnum.None || (draft.assignment == null && draft.availableUntil)) {
    if (draft.endAttemptsAtClose) closes += ' — in-progress attempts end at close';
  }

  const attempts =
    draft.attemptsAllowed === 0
      ? `Unlimited — ${SCORING_LABELS[draft.scoringPolicy]}`
      : draft.attemptsAllowed === 1
        ? '1'
        : `${draft.attemptsAllowed} — ${SCORING_LABELS[draft.scoringPolicy]}`;

  const results = [
    draft.sealResultsUntilClose ? 'Released after the quiz closes' : 'Released as soon as they submit',
    draft.allowSubmissionReview
      ? draft.showResponses
        ? `students review scores + their answers${draft.showCorrectAnswers ? ' + the answer key' : ''}`
        : 'students review scores only'
      : 'no reopening submitted attempts',
  ].join('; ');

  const seb = draft.requireSebBrowser
    ? draft.sebConfigKey.trim()
      ? 'Required, with a custom Config Key'
      : 'Required (built-in launch)'
    : 'Not required';

  const delivery = [
    draft.shuffleQuestions ? 'Shuffled order' : 'Authored order',
    draft.oneQuestionAtATime
      ? `one question at a time${draft.allowBacktracking ? ', backtracking allowed' : ', no going back'}`
      : 'all questions at once',
  ].join('; ');

  const aiNonDefault =
    draft.autoPublishGenerated || draft.gradersCanReviewGenerated || !draft.manualGeneration || draft.generationDate;
  const ai = [
    draft.autoPublishGenerated ? 'auto-publish generated questions' : null,
    draft.gradersCanReviewGenerated
      ? `graders review${draft.gradersCanGenerate ? ' and generate' : ''}`
      : null,
    draft.manualGeneration
      ? draft.generationDate
        ? `manual, scheduled run ${fmtDate(draft.generationDate)}`
        : null
      : 'automatic generation',
  ]
    .filter(Boolean)
    .join('; ');

  return (
    <Flex vertical gap={12} data-testid="quiz-wizard-step-review">
      {warnings.length > 0 && (
        <Flex vertical gap={8} data-testid="quiz-wizard-warnings">
          {warnings.map((w) => (
            <Alert key={w.key} type={w.level} showIcon message={w.text} />
          ))}
        </Flex>
      )}
      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="Title">{draft.title.trim() || <Text type="danger">Missing</Text>}</Descriptions.Item>
        <Descriptions.Item label="Assignment">{attachedName ?? 'Not attached'}</Descriptions.Item>
        <Descriptions.Item label="Opens">{opens}</Descriptions.Item>
        <Descriptions.Item label="Closes">{closes}</Descriptions.Item>
        <Descriptions.Item label="Time limit">
          {draft.timeLimitMinutes != null ? `${draft.timeLimitMinutes} min` : 'Untimed'}
        </Descriptions.Item>
        <Descriptions.Item label="Attempts">{attempts}</Descriptions.Item>
        <Descriptions.Item label="Passing score">
          {draft.passingScore != null
            ? `${draft.passingScore}${draft.passingScoreUnit === QuizPassingScoreUnitEnum.Percent ? '%' : ' points'}`
            : 'None'}
        </Descriptions.Item>
        <Descriptions.Item label="Results">{results}</Descriptions.Item>
        <Descriptions.Item label="Safe Exam Browser">{seb}</Descriptions.Item>
        <Descriptions.Item label="Delivery">{delivery}</Descriptions.Item>
        {aiNonDefault && <Descriptions.Item label="AI generation">{ai}</Descriptions.Item>}
      </Descriptions>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Everything here can be changed later in the builder&apos;s Quiz Settings. Next: add questions from
        your question banks.
      </Text>
    </Flex>
  );
};

export default ReviewStep;
