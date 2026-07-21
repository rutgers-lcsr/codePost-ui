// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The focused, one-response-at-a-time grader. A slim header (back, student, queue progress,
// attempt score + official pin), a per-question navigator for the attempt, and the current
// response with its answer key, run-code, and grade editor. "Save & next" (in GradeControls)
// walks the global pending queue; the navigator jumps within the attempt for context.
import * as React from 'react';
import { Collapse, Flex, Space, Tag, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import CPButton from '../../../core/CPButton';
import { StaffQuizAttempt, StaffQuizResponse, QuestionTypeEnum } from '../../../../api-client';
import { bySortKey, formatScore } from '../../../core/questionMeta';
import { isManuallyGraded } from '../choiceUtils';
import { PassedTag } from '../quizTags';
import QuestionAnswerer from '../../../student/quizzes/QuestionAnswerer';
import GradeControls from './GradeControls';
import RunCodeControls from './RunCodeControls';

const { Text } = Typography;

interface IProps {
  attempt: StaffQuizAttempt;
  focusResponseId: number;
  /** 1-based position of the focused response in the global pending queue (0 when not pending). */
  queuePos: number;
  queueTotal: number;
  hasNext: boolean;
  onNavigate: (responseId: number) => void;
  /** Advance to the next pending response (or finish). Used by "Save & next" and "Skip". */
  onNext: () => void;
  onExit: () => void;
  onGraded: (updated: StaffQuizAttempt) => void;
  onRunUpdate: (updated: StaffQuizAttempt) => void;
  onSetOfficial: (official: boolean) => void;
  pinning: boolean;
}

/** Navigator chip color reflecting a response's grading state. */
const chipColor = (r: StaffQuizResponse): string | undefined => {
  if (r.needsManualGrading) return 'gold';
  if (r.isCorrect === true) return 'green';
  if (r.isCorrect === false) return 'red';
  if (r.pointsEarned != null) return 'green';
  return undefined;
};

const FocusedGrader: React.FC<IProps> = ({
  attempt,
  focusResponseId,
  queuePos,
  queueTotal,
  hasNext,
  onNavigate,
  onNext,
  onExit,
  onGraded,
  onRunUpdate,
  onSetOfficial,
  pinning,
}) => {
  const responses = [...attempt.responses].sort(bySortKey);
  const index = Math.max(0, responses.findIndex((r) => r.id === focusResponseId));
  const current = responses[index];

  const headingRef = React.useRef<HTMLDivElement>(null);
  // Move focus to the workspace heading when the focused response changes, so keyboard/SR
  // users follow the step-through rather than being stranded on an unmounted control.
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [focusResponseId, attempt.id]);

  if (!current) return null;

  return (
    // Cap the question column at the width the student taking view uses — full-width reads stretched.
    <div style={{ maxWidth: 812 }}>
      {/* Slim single header: back, who, queue progress, attempt score + pin. */}
      <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 8 }}>
        <Flex align="center" gap={8}>
          <CPButton cpType="link" small icon={<LeftOutlined />} onClick={onExit} data-testid="grading-back">
            Queue
          </CPButton>
          <Text strong ref={headingRef} tabIndex={-1} style={{ outline: 'none' }}>
            {attempt.student}
          </Text>
          <Text type="secondary">· attempt #{attempt.attemptNumber}</Text>
          {queuePos > 0 && (
            <Tag color="gold" data-testid="grading-progress">
              Response {queuePos} of {queueTotal} to grade
            </Tag>
          )}
        </Flex>
        <Space>
          {hasNext && (
            <CPButton cpType="link" small onClick={onNext} data-testid="grading-skip">
              Skip <RightOutlined />
            </CPButton>
          )}
        </Space>
      </Flex>

      {/* Attempt summary line: score, pass state, official pin. */}
      <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 12 }}>
        <Space>
          <Text strong data-testid="grading-attempt-score">
            Score: {formatScore(attempt.score, attempt.maxScore)}
          </Text>
          {attempt.needsManualGrading ? (
            <Tag color="gold">Awaiting manual grades</Tag>
          ) : (
            <PassedTag passed={attempt.passed} />
          )}
          {attempt.isOfficialOverride && (
            <Tag color="blue" data-testid="official-pin-tag">
              Official grade (pinned)
            </Tag>
          )}
        </Space>
        {attempt.isOfficialOverride ? (
          <CPButton small loading={pinning} onClick={() => onSetOfficial(false)} data-testid="grading-unpin-official">
            Unpin official grade
          </CPButton>
        ) : (
          <CPButton small loading={pinning} onClick={() => onSetOfficial(true)} data-testid="grading-pin-official">
            Use as official grade
          </CPButton>
        )}
      </Flex>

      {/* Per-question navigator: jump within the attempt for context. */}
      <Flex wrap gap={6} style={{ marginBottom: 16 }} role="group" aria-label="Questions in this attempt">
        {responses.map((r, i) => (
          <CPButton
            key={r.id}
            small
            cpType={r.id === focusResponseId ? 'primary' : 'default'}
            onClick={() => onNavigate(r.id)}
            data-testid="grading-nav-chip"
          >
            <span aria-hidden>{i + 1}</span>
            <Tag
              color={chipColor(r)}
              style={{ marginLeft: 6, marginRight: 0, padding: '0 4px', lineHeight: '16px' }}
            >
              {r.needsManualGrading ? '●' : '✓'}
            </Tag>
          </CPButton>
        ))}
      </Flex>

      {/* The focused response. */}
      <QuestionAnswerer
        response={current}
        index={index}
        value={{ answerText: current.answerText ?? '', selectedChoices: [...current.selectedChoices] }}
        disabled
        reveal
        onChange={() => undefined}
      />
      {current.question.questionType === QuestionTypeEnum.Code && (
        <RunCodeControls attemptId={attempt.id} response={current} onUpdate={onRunUpdate} />
      )}
      {current.referenceSolution && (
        <Collapse
          size="small"
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'answer-key',
              label: 'Answer key (graders only)',
              children: (
                <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                  {current.referenceSolution}
                </Typography.Paragraph>
              ),
            },
          ]}
        />
      )}
      {isManuallyGraded(current.question.questionType) && (
        <GradeControls
          attemptId={attempt.id}
          response={current}
          onGraded={onGraded}
          onAdvance={onNext}
          advanceLabel={hasNext ? 'Save & next' : 'Save & finish'}
        />
      )}
    </div>
  );
};

export default FocusedGrader;
