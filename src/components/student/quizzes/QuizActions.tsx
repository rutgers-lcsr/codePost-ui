// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Tag } from 'antd';
import { EyeOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import { StudentQuiz } from '../../../api-client';
import { canEnterAccessCode, canReview, quizAction, quizActionLabel } from './quizStatus';
import AccessCodeModal from './AccessCodeModal';

interface IProps {
  quiz: StudentQuiz;
  onTake: () => void;
  /** Review past submitted attempts; omitting hides the review entry points. */
  onReview?: () => void;
  /** e2e testid namespace: renders `<prefix>-review` / `<prefix>-locked` / `<prefix>-action`.
   *  Existing consumers use `student-quiz` (Quizzes-page card) and `attached-quiz` (assignment row). */
  testIdPrefix: string;
  /** Small icon buttons and a locked tooltip for the dense assignment-row layout. */
  compact?: boolean;
}

/** The student-facing action cluster for a quiz: an always-reachable Review link for past
 *  results, then either a locked tag or the primary start/resume/review button. Clicks don't
 *  bubble — the assignment row behind these buttons toggles its stats panel on click. */
const QuizActions: React.FC<IProps> = ({ quiz, onTake, onReview, testIdPrefix, compact }) => {
  const action = quizAction(quiz);
  const [codeModalOpen, setCodeModalOpen] = React.useState(false);
  const handle = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };
  const onPrimary = handle(action === 'review' && onReview ? onReview : onTake);

  return (
    <>
      {/* Past results stay reachable even when the primary action starts a new attempt. */}
      {onReview && canReview(quiz) && action !== 'review' && (
        compact ? (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={handle(onReview)}
            data-testid={`${testIdPrefix}-review`}
          >
            Review
          </Button>
        ) : (
          <CPButton cpType="link" icon={<EyeOutlined />} onClick={handle(onReview)} data-testid={`${testIdPrefix}-review`}>
            Review
          </CPButton>
        )
      )}
      {action === 'locked' ? (
        // A closed quiz the instructor gated with a late-access code stays actionable: offer
        // "Enter access code", which opens a modal to collect + validate the code before the
        // student enters the quiz.
        canEnterAccessCode(quiz) ? (
          compact ? (
            <Button
              type="primary"
              size="small"
              icon={<UnlockOutlined />}
              onClick={handle(() => setCodeModalOpen(true))}
              data-testid={`${testIdPrefix}-access-code`}
            >
              Enter access code
            </Button>
          ) : (
            <CPButton
              cpType="primary"
              icon={<UnlockOutlined />}
              onClick={handle(() => setCodeModalOpen(true))}
              data-testid={`${testIdPrefix}-access-code`}
            >
              Enter access code
            </CPButton>
          )
        ) : // The Tag's own text IS the lock reason (quizActionLabel → "Opens after you
        // submit", "Closed", …). No Tooltip: it duplicated less-specific text and was
        // unreachable by keyboard (WCAG 2.1.1 / 1.4.13).
        compact ? (
          <Tag icon={<LockOutlined aria-hidden />} style={{ margin: 0 }} data-testid={`${testIdPrefix}-locked`}>
            {quizActionLabel(quiz)}
          </Tag>
        ) : (
          <Tag data-testid={`${testIdPrefix}-locked`}>{quizActionLabel(quiz)}</Tag>
        )
      ) : compact ? (
        <Button
          type={action === 'review' ? 'default' : 'primary'}
          size="small"
          icon={action === 'review' ? <EyeOutlined /> : undefined}
          onClick={onPrimary}
          data-testid={`${testIdPrefix}-action`}
        >
          {quizActionLabel(quiz)}
        </Button>
      ) : (
        <CPButton
          cpType={action === 'review' ? 'secondary' : 'primary'}
          onClick={onPrimary}
          data-testid={`${testIdPrefix}-action`}
        >
          {quizActionLabel(quiz)}
        </CPButton>
      )}
      {canEnterAccessCode(quiz) && (
        <AccessCodeModal
          quiz={quiz}
          open={codeModalOpen}
          onClose={() => setCodeModalOpen(false)}
          onStarted={onTake}
        />
      )}
    </>
  );
};

export default QuizActions;
