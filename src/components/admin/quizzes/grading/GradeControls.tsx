// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Flex, Input, InputNumber, Popconfirm, Space, Typography } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../../core/CPButton';
import { quizAttemptsApi } from '../../../../api-client/clients';
import { StaffQuizAttempt, StudentQuizResponse } from '../../../../api-client';
import { useApiAction } from '../../../../hooks/useApiAction';
import { quizKeys } from '../../../../lib/queryKeys';
import { GradingStatusTag } from '../quizTags';

const { Text } = Typography;

/** What `flush()` did with the current draft. */
export type FlushOutcome = 'clean' | 'saved' | 'unsaveable' | 'failed';

export interface GradeControlsHandle {
  isDirty(): boolean;
  /** Save the draft if dirty & saveable. Never advances. */
  flush(): Promise<FlushOutcome>;
  /** The Next-button semantics: warn if dirty without points, else flush and advance. */
  saveAndAdvance(): Promise<void>;
}

interface IProps {
  attemptId: number;
  /** The quiz the attempt belongs to — used to invalidate caches after a best-effort unload save. */
  quizId: number;
  response: StudentQuizResponse;
  onGraded: (updated: StaffQuizAttempt) => void;
  /** Advance to the next pending response (or back to the queue when none is left). */
  onAdvance: () => void;
  /** Label for the primary navigation button ("Next" / "Finish"). */
  advanceLabel: string;
  /** Fill the parent's height, letting the feedback box absorb the extra room — used when
   *  the panel lives in a resizable dock. Off = the panel sizes to its content. */
  fill?: boolean;
}

/** Points + feedback editor for one manual (essay/code) response, rendered as the focused
 *  grader's pinned footer. Saving is automatic: any navigation (Next, Skip, question chips,
 *  back to queue, closing the drawer) flushes a dirty draft via the imperative handle; the
 *  primary button is just "Next"/"Finish". Cmd/Ctrl+Enter (handled by FocusedGrader's root)
 *  is the same as Next. Reopen returns a saved grade to the queue. */
const GradeControls = React.forwardRef<GradeControlsHandle, IProps>(
  ({ attemptId, quizId, response, onGraded, onAdvance, advanceLabel, fill = false }, ref) => {
    const queryClient = useQueryClient();
    const [points, setPoints] = React.useState<number | null>(
      response.pointsEarned != null ? Number(response.pointsEarned) : null,
    );
    const [feedback, setFeedback] = React.useState(response.graderFeedback ?? '');
    // Set when Next is attempted without points — cleared as soon as any points are entered.
    const [missing, setMissing] = React.useState(false);
    const { acting: saving, run } = useApiAction();

    // Re-sync when the server state changes underneath us (save, reopen, attempt switch).
    React.useEffect(() => {
      setPoints(response.pointsEarned != null ? Number(response.pointsEarned) : null);
      setFeedback(response.graderFeedback ?? '');
      setMissing(false);
    }, [response.id, response.pointsEarned, response.graderFeedback]);

    const dirty =
      (points ?? null) !== (response.pointsEarned != null ? Number(response.pointsEarned) : null) ||
      feedback !== (response.graderFeedback ?? '');

    // Out-of-range points never save: the input shows an inline error instead of the old
    // silent clamping (both antd's clamp-on-blur and the server's clamp hid the mistake).
    const maxPts = Number(response.points ?? 0);
    const invalid = points != null && (points < 0 || points > maxPts);
    const pointsError = invalid
      ? `Points must be between 0 and ${maxPts}.`
      : missing && points == null
        ? 'Enter the points earned before moving on.'
        : null;

    const doSave = () => {
      const sent = { points: points!, feedback };
      return run(async () => {
        const updated = await quizAttemptsApi.gradeResponseCreate({
          id: attemptId,
          gradeQuizResponseRequest: { response: response.id, pointsEarned: sent.points, graderFeedback: sent.feedback },
        });
        onGraded(updated);
        // Mark the snapshot clean right away (unless the draft changed mid-flight): if the
        // parent unmounts this editor in the same commit as onGraded's update (e.g. moving
        // the dock), the unmount handler must not re-save the already-saved draft.
        if (latest.current.points === sent.points && latest.current.feedback === sent.feedback) {
          latest.current = { ...latest.current, dirty: false };
        }
      }, 'Response graded.', 'Failed to save the grade.');
    };

    const flush = async (): Promise<FlushOutcome> => {
      if (!dirty) return 'clean';
      if (points == null || invalid) return 'unsaveable';
      return (await doSave()) ? 'saved' : 'failed';
    };

    const saveAndAdvance = async () => {
      if (dirty && (points == null || invalid)) {
        // Stay put and let the inline error under the points input do the talking.
        setMissing(points == null);
        return;
      }
      const outcome = await flush();
      if (outcome !== 'failed') onAdvance();
    };

    React.useImperativeHandle(ref, () => ({ isDirty: () => dirty, flush, saveAndAdvance }));

    // Latest draft, always consistent with the response rendered alongside it — read by the
    // unload/unmount handlers below, which must not capture stale closures.
    const latest = React.useRef({ dirty, invalid, points, feedback, attemptId, quizId, responseId: response.id });
    latest.current = { dirty, invalid, points, feedback, attemptId, quizId, responseId: response.id };

    const keepaliveSave = () => {
      const d = latest.current;
      if (!d.dirty || d.points == null || d.invalid) return null;
      return quizAttemptsApi
        .gradeResponseCreate(
          {
            id: d.attemptId,
            gradeQuizResponseRequest: { response: d.responseId, pointsEarned: d.points, graderFeedback: d.feedback },
          },
          { keepalive: true },
        )
        .catch(() => undefined);
    };

    // Warn on tab close with an unsaved draft, and best-effort save it when possible.
    React.useEffect(() => {
      const onUnload = (e: BeforeUnloadEvent) => {
        if (!latest.current.dirty) return;
        e.preventDefault();
        e.returnValue = '';
        void keepaliveSave();
      };
      window.addEventListener('beforeunload', onUnload);
      return () => window.removeEventListener('beforeunload', onUnload);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Best-effort save when the whole grading view unmounts while dirty (e.g. the grader
    // console's "All quizzes" back link). In-app navigation flushes before this can fire;
    // the empty dep list means the cleanup only runs on true unmount, where `latest` is
    // still consistent with the rendered response.
    React.useEffect(
      () => () => {
        const saved = keepaliveSave();
        if (saved) {
          void saved.then(() => {
            queryClient.invalidateQueries({ queryKey: quizKeys.attempts(latest.current.quizId) });
            queryClient.invalidateQueries({ queryKey: quizKeys.results(latest.current.quizId) });
          });
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    const reopen = () =>
      run(async () => {
        const updated = await quizAttemptsApi.reopenResponseCreate({
          id: attemptId,
          reopenQuizResponseRequest: { response: response.id },
        });
        onGraded(updated);
      }, 'Grade reopened — the response is back in the grading queue.', 'Failed to reopen the grade.');

    return (
      <Flex vertical gap={8} style={fill ? { height: '100%' } : undefined}>
        <Space wrap>
          <Text strong>Points:</Text>
          {/* No min/max clamp: an out-of-range value stays visible and shows the inline
              error below instead of being silently corrected on blur. */}
          <InputNumber
            step={0.5}
            aria-label="Points awarded"
            aria-invalid={pointsError != null}
            aria-describedby={pointsError ? 'grade-points-error' : undefined}
            status={pointsError ? 'error' : undefined}
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
        {pointsError && (
          <Text type="danger" id="grade-points-error" role="alert" data-testid="grade-points-error">
            {pointsError}
          </Text>
        )}
        <Input.TextArea
          aria-label="Feedback for the student"
          placeholder="Feedback for the student (optional)…"
          autoSize={fill ? false : { minRows: 2, maxRows: 5 }}
          style={fill ? { flex: 1, minHeight: 0, resize: 'none' } : undefined}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          data-testid="grade-feedback"
        />
        <Space>
          <CPButton cpType="primary" onClick={() => void saveAndAdvance()} loading={saving} data-testid="grade-save">
            {advanceLabel}
          </CPButton>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ⌘/Ctrl + Enter{dirty ? ' · unsaved changes save on Next' : ''}
          </Text>
        </Space>
      </Flex>
    );
  },
);
GradeControls.displayName = 'GradeControls';

export default GradeControls;
