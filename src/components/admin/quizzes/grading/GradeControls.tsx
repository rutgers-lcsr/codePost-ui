// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, Flex, Input, InputNumber, Popconfirm, Space, Typography, message } from 'antd';
import CPButton from '../../../core/CPButton';
import { quizAttemptsApi } from '../../../../api-client/clients';
import { StaffQuizAttempt, StudentQuizResponse } from '../../../../api-client';
import { useApiAction } from '../../../../hooks/useApiAction';
import { GradingStatusTag } from '../quizTags';

const { Text } = Typography;

/** Points + feedback editor for one manual (essay/code) response. In the focused grader the
 *  primary button saves and advances to the next pending response (`onAdvance`); Cmd/Ctrl+Enter
 *  is the same shortcut. Reopen returns a saved grade to the queue. */
const GradeControls: React.FC<{
  attemptId: number;
  response: StudentQuizResponse;
  onGraded: (updated: StaffQuizAttempt) => void;
  /** Advance to the next pending response after a successful save (focused-grader flow). */
  onAdvance?: () => void;
  /** Label for the primary save button when advancing (e.g. "Save & next" / "Save & finish"). */
  advanceLabel?: string;
}> = ({ attemptId, response, onGraded, onAdvance, advanceLabel = 'Save & next' }) => {
  const [points, setPoints] = React.useState<number | null>(
    response.pointsEarned != null ? Number(response.pointsEarned) : null,
  );
  const [feedback, setFeedback] = React.useState(response.graderFeedback ?? '');
  const { acting: saving, run } = useApiAction();

  // Re-sync when the server state changes underneath us (save, reopen, attempt switch).
  React.useEffect(() => {
    setPoints(response.pointsEarned != null ? Number(response.pointsEarned) : null);
    setFeedback(response.graderFeedback ?? '');
  }, [response.id, response.pointsEarned, response.graderFeedback]);

  const dirty =
    (points ?? null) !== (response.pointsEarned != null ? Number(response.pointsEarned) : null) ||
    feedback !== (response.graderFeedback ?? '');

  const save = async (advance: boolean) => {
    if (points == null) {
      message.warning('Enter the points earned first.');
      return;
    }
    const ok = await run(async () => {
      const updated = await quizAttemptsApi.gradeResponseCreate({
        id: attemptId,
        gradeQuizResponseRequest: { response: response.id, pointsEarned: points, graderFeedback: feedback },
      });
      onGraded(updated);
    }, 'Response graded.', 'Failed to save the grade.');
    if (ok && advance) onAdvance?.();
  };

  const reopen = () =>
    run(async () => {
      const updated = await quizAttemptsApi.reopenResponseCreate({
        id: attemptId,
        reopenQuizResponseRequest: { response: response.id },
      });
      onGraded(updated);
    }, 'Grade reopened — the response is back in the grading queue.', 'Failed to reopen the grade.');

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void save(!!onAdvance);
    }
  };

  return (
    <Card size="small" title="Grade" style={{ marginBottom: 16 }} onKeyDown={onKeyDown}>
      <Flex vertical gap={8}>
        <Space wrap>
          <Text strong>Points:</Text>
          <InputNumber
            min={0}
            max={Number(response.points ?? 0)}
            step={0.5}
            aria-label="Points awarded"
            value={points ?? undefined}
            onChange={(v) => setPoints(v ?? null)}
            data-testid="grade-points"
          />
          <Text type="secondary">/ {response.points} pts</Text>
          <GradingStatusTag needsGrading={!!response.needsManualGrading} />
          {!response.needsManualGrading && (
            <Popconfirm
              title="Reopen this grade?"
              description="The points are removed and the response returns to the grading queue. The feedback text is kept as a draft."
              okText="Reopen"
              onConfirm={reopen}
            >
              <CPButton cpType="link" small loading={saving} data-testid="grade-reopen">
                Reopen
              </CPButton>
            </Popconfirm>
          )}
        </Space>
        <Input.TextArea
          aria-label="Feedback for the student"
          placeholder="Feedback for the student (optional)…"
          autoSize={{ minRows: 2 }}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          data-testid="grade-feedback"
        />
        <Space>
          {onAdvance ? (
            <CPButton
              cpType="primary"
              onClick={() => save(true)}
              loading={saving}
              disabled={points == null}
              data-testid="grade-save"
            >
              {advanceLabel}
            </CPButton>
          ) : (
            <CPButton
              cpType="primary"
              onClick={() => save(false)}
              loading={saving}
              disabled={!dirty}
              data-testid="grade-save"
            >
              Save grade
            </CPButton>
          )}
          {onAdvance && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              ⌘/Ctrl + Enter
            </Text>
          )}
        </Space>
      </Flex>
    </Card>
  );
};

export default GradeControls;
