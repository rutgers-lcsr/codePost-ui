// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The focused, one-response-at-a-time grader, rendered as the full content of the full-screen
// grading drawer: a pinned header (back, student, queue progress, attempt score + official pin,
// per-question navigator), a scrollable middle with the current response, and the grade editor
// docked either below the question (pinned footer, default) or beside it (side panel) — the
// grader picks via the header toggle and the choice persists. Saving is automatic on
// navigation ("Next" in the grade panel walks the global pending queue); the navigator chips
// jump within the attempt for context.
import * as React from 'react';
import { Collapse, Flex, Segmented, Space, Tag, Typography, message, theme } from 'antd';
import { Resizable } from 're-resizable';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import CPButton from '../../../core/CPButton';
import useWindowSize from '../../../core/useWindowSize';
import { LOCAL_SETTINGS } from '../../../utils/LocalSettings';
import { StaffQuizAttempt, StaffQuizResponse, QuestionTypeEnum } from '../../../../api-client';
import { bySortKey, formatScore } from '../../../core/questionMeta';
import { isManuallyGraded } from '../choiceUtils';
import { PassedTag } from '../quizTags';
import QuestionAnswerer from '../../../student/quizzes/QuestionAnswerer';
import GradeControls, { GradeControlsHandle } from './GradeControls';
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
  /** Advance to the next pending response (or finish). Used by "Next" and "Skip". */
  onNext: () => void;
  onExit: () => void;
  onGraded: (updated: StaffQuizAttempt) => void;
  onRunUpdate: (updated: StaffQuizAttempt) => void;
  onSetOfficial: (official: boolean) => void;
  pinning: boolean;
  /** Handle to the grade editor's draft — owned by QuizGradingView so drawer close can flush too. */
  gradeRef: React.RefObject<GradeControlsHandle | null>;
}

/** Navigator chip color reflecting a response's grading state. */
const chipColor = (r: StaffQuizResponse): string | undefined => {
  if (r.needsManualGrading) return 'gold';
  if (r.isCorrect === true) return 'green';
  if (r.isCorrect === false) return 'red';
  if (r.pointsEarned != null) return 'green';
  return undefined;
};

/** Reading column matching the width of the student taking view — full-width reads stretched. */
const COLUMN: React.CSSProperties = { maxWidth: 812, margin: '0 auto' };

/** Side-by-side needs room for the reading column plus the grade panel. */
const SIDE_DOCK_MIN_WIDTH = 900;

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
  gradeRef,
}) => {
  const { token } = theme.useToken();
  const { width } = useWindowSize();
  // Where the grade panel docks — below the question (pinned footer) or beside it. Persisted
  // per browser; narrow screens always fall back to the bottom dock.
  const [dock, setDock] = React.useState<'bottom' | 'side'>(() => LOCAL_SETTINGS.quizGradeDock.getter());
  const sideAllowed = width >= SIDE_DOCK_MIN_WIDTH;
  const effectiveDock = sideAllowed && dock === 'side' ? 'side' : 'bottom';
  // Grade panel sizes, draggable via the dock divider and persisted per browser.
  const [sideWidth, setSideWidth] = React.useState(() => LOCAL_SETTINGS.quizGradeSideWidth.getter());
  const [bottomHeight, setBottomHeight] = React.useState(() => LOCAL_SETTINGS.quizGradeBottomHeight.getter());
  const responses = [...attempt.responses].sort(bySortKey);
  const index = Math.max(0, responses.findIndex((r) => r.id === focusResponseId));
  const current = responses[index];

  const headingRef = React.useRef<HTMLDivElement>(null);
  // Move focus to the workspace heading when the focused response changes, so keyboard/SR
  // users follow the step-through rather than being stranded on an unmounted control.
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [focusResponseId, attempt.id]);

  // Cmd/Ctrl+Enter anywhere = the footer's Next button. Window-level because the grader owns
  // the whole screen while mounted (the drawer unmounts it on close via destroyOnHidden).
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (gradeRef.current) void gradeRef.current.saveAndAdvance();
        else onNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gradeRef, onNext]);

  if (!current) return null;

  // Save-on-navigate: flush a dirty draft before leaving the response; stay put if the save
  // failed (the error toast already fired). A draft with no points or out-of-range points
  // can't be persisted (gradeResponse finalizes), so it is discarded with a visible warning.
  const guardNav = async (proceed: () => void) => {
    const outcome = (await gradeRef.current?.flush()) ?? 'clean';
    if (outcome === 'failed') return;
    if (outcome === 'unsaveable') message.warning('Draft discarded — enter valid points to record a grade.');
    proceed();
  };

  // Moving the dock remounts the grade editor, so flush any draft first — same contract
  // as navigating away from the response.
  const setDockSafely = (next: 'bottom' | 'side') =>
    guardNav(() => {
      setDock(next);
      LOCAL_SETTINGS.quizGradeDock.setter(next);
    });

  const manual = isManuallyGraded(current.question.questionType);
  const renderGradePanel = (fill: boolean) =>
    manual ? (
      <GradeControls
        ref={gradeRef}
        attemptId={attempt.id}
        quizId={attempt.quiz}
        response={current}
        onGraded={onGraded}
        onAdvance={onNext}
        advanceLabel={hasNext ? 'Next' : 'Finish'}
        fill={fill}
      />
    ) : (
      <Flex align="center" justify="space-between" wrap gap={8}>
        <Tag>Auto-graded — nothing to enter</Tag>
        <CPButton cpType="primary" onClick={onNext} data-testid="grade-save">
          {hasNext ? 'Next' : 'Finish'}
        </CPButton>
      </Flex>
    );

  const questionColumn = (
    <div style={COLUMN}>
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
    </div>
  );

  return (
    <div data-testid="grading-drawer" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          flex: 'none',
          padding: '10px 16px',
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorSplit}`,
        }}
      >
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Flex align="center" gap={8} wrap>
            <CPButton
              cpType="link"
              small
              icon={<LeftOutlined />}
              onClick={() => void guardNav(onExit)}
              data-testid="grading-back"
            >
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
          </Flex>
          <Space wrap>
            {sideAllowed && (
              <Segmented
                size="small"
                aria-label="Grade panel position"
                value={effectiveDock}
                onChange={(v) => void setDockSafely(v as 'bottom' | 'side')}
                options={[
                  { label: 'Grade below', value: 'bottom' },
                  { label: 'Grade beside', value: 'side' },
                ]}
                data-testid="grade-dock-toggle"
              />
            )}
            {attempt.isOfficialOverride ? (
              <CPButton small loading={pinning} onClick={() => onSetOfficial(false)} data-testid="grading-unpin-official">
                Unpin official grade
              </CPButton>
            ) : (
              <CPButton small loading={pinning} onClick={() => onSetOfficial(true)} data-testid="grading-pin-official">
                Use as official grade
              </CPButton>
            )}
            {hasNext && (
              <CPButton cpType="link" small onClick={() => void guardNav(onNext)} data-testid="grading-skip">
                Skip <RightOutlined />
              </CPButton>
            )}
          </Space>
        </Flex>

        {/* Per-question navigator: jump within the attempt for context. */}
        <Flex wrap gap={6} style={{ marginTop: 8 }} role="group" aria-label="Questions in this attempt">
          {responses.map((r, i) => (
            <CPButton
              key={r.id}
              small
              cpType={r.id === focusResponseId ? 'primary' : 'default'}
              onClick={() => void guardNav(() => onNavigate(r.id))}
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
      </header>

      {effectiveDock === 'side' ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <section style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '16px 24px' }}>
            {questionColumn}
          </section>
          {/* Drag the left edge to resize; the width persists. */}
          <Resizable
            size={{ width: sideWidth, height: '100%' }}
            minWidth={300}
            maxWidth={Math.max(320, Math.round(width * 0.6))}
            enable={{ left: true }}
            onResizeStop={(_e, _dir, _el, delta) => {
              const next = Math.round(sideWidth + delta.width);
              setSideWidth(next);
              LOCAL_SETTINGS.quizGradeSideWidth.setter(next);
            }}
            style={{ flex: 'none' }}
          >
            <aside
              aria-label="Grade panel"
              data-testid="grade-dock-side"
              style={{
                height: '100%',
                overflowY: 'auto',
                padding: '12px 16px',
                background: token.colorBgElevated,
                borderLeft: `1px solid ${token.colorSplit}`,
              }}
            >
              {renderGradePanel(false)}
            </aside>
          </Resizable>
        </div>
      ) : (
        <>
          <section style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px' }}>
            {questionColumn}
          </section>
          {manual ? (
            // Drag the top edge to resize; the extra room goes to the feedback box.
            <Resizable
              size={{ width: '100%', height: bottomHeight }}
              minHeight={150}
              maxHeight={Math.max(180, Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.6))}
              enable={{ top: true }}
              onResizeStop={(_e, _dir, _el, delta) => {
                const next = Math.round(bottomHeight + delta.height);
                setBottomHeight(next);
                LOCAL_SETTINGS.quizGradeBottomHeight.setter(next);
              }}
              style={{ flex: 'none' }}
            >
              <footer
                style={{
                  height: '100%',
                  padding: '12px 16px',
                  background: token.colorBgElevated,
                  borderTop: `1px solid ${token.colorSplit}`,
                }}
              >
                <div style={{ ...COLUMN, height: '100%' }}>{renderGradePanel(true)}</div>
              </footer>
            </Resizable>
          ) : (
            <footer
              style={{
                flex: 'none',
                padding: '12px 16px',
                background: token.colorBgElevated,
                borderTop: `1px solid ${token.colorSplit}`,
              }}
            >
              <div style={COLUMN}>{renderGradePanel(false)}</div>
            </footer>
          )}
        </>
      )}
    </div>
  );
};

export default FocusedGrader;
