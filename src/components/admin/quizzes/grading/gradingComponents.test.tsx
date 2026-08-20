// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Render smoke + a11y coverage for the quiz grading surface, plus the save-on-navigate
// contract of the focused grader (dirty grades flush before Skip/chip/Next navigation).
// GradeControls talks to the API on flush, so the client module is mocked here.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../api-client/clients', () => ({
  quizAttemptsApi: {
    gradeResponseCreate: vi.fn(),
    reopenResponseCreate: vi.fn(),
    runCodeCreate: vi.fn(),
    retrieve: vi.fn(),
  },
}));

import { quizAttemptsApi } from '../../../../api-client/clients';
import GradingQueue from './GradingQueue';
import FocusedGrader from './FocusedGrader';
import RunCodeControls from './RunCodeControls';
import { GradeControlsHandle } from './GradeControls';
import { QuestionTypeEnum, StaffQuizAttempt, StaffQuizResponse } from '../../../../api-client';

const essay = {
  id: 101, sortKey: 0, needsManualGrading: true, isCorrect: null,
  pointsEarned: null, points: '5', answerText: 'A stack is LIFO.', selectedChoices: [],
  referenceSolution: 'LIFO vs FIFO', graderFeedback: '',
  question: { id: 5, questionType: QuestionTypeEnum.Essay, text: 'Compare a stack and a queue.', choices: [] },
} as unknown as StaffQuizResponse;

const mc = {
  id: 102, sortKey: 1, needsManualGrading: false, isCorrect: true,
  pointsEarned: '2', points: '2', answerText: '', selectedChoices: [10],
  question: {
    id: 6, questionType: QuestionTypeEnum.MultipleChoice, text: 'What is 2 + 2?',
    choices: [
      { id: 10, text: '4', isCorrect: true, sortKey: 0 },
      { id: 11, text: '5', isCorrect: false, sortKey: 1 },
    ],
  },
} as unknown as StaffQuizResponse;

const attempt = {
  id: 11, quiz: 9, student: 'ada@rutgers.edu', attemptNumber: 2, score: '2', maxScore: '7',
  needsManualGrading: true, passed: null, isOfficialOverride: false,
  responses: [essay, mc],
} as unknown as StaffQuizAttempt;

const queue = [{ attemptId: 11, responseId: 101, student: 'ada@rutgers.edu', attemptNumber: 2 }];

const renderWithClient = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

describe('GradingQueue', () => {
  it('summarizes the pending work and offers Start grading', () => {
    render(
      <GradingQueue
        attempts={[attempt]}
        queue={queue}
        sectionFilter={null}
        hasSection={false}
        showGraded={false}
        onToggleShowGraded={vi.fn()}
        onStartGrading={vi.fn()}
        onGradeAttempt={vi.fn()}
      />,
    );
    expect(screen.getByTestId('grading-queue-summary')).toHaveTextContent(/need grading/i);
    expect(screen.getByTestId('grading-start')).toBeEnabled();
    expect(screen.getByTestId('grading-open-attempt')).toHaveTextContent('Grade');
  });

  it('shows the caught-up state and disables Start when the queue is empty', () => {
    render(
      <GradingQueue
        attempts={[]}
        queue={[]}
        sectionFilter={null}
        hasSection={false}
        showGraded={false}
        onToggleShowGraded={vi.fn()}
        onStartGrading={vi.fn()}
        onGradeAttempt={vi.fn()}
      />,
    );
    expect(screen.getByTestId('grading-queue-summary')).toHaveTextContent(/all caught up/i);
    expect(screen.getByTestId('grading-start')).toBeDisabled();
  });
});

describe('FocusedGrader', () => {
  const gradeResponseCreate = vi.mocked(quizAttemptsApi.gradeResponseCreate);

  const makeProps = () => ({
    attempt,
    focusResponseId: 101,
    queuePos: 1,
    queueTotal: 1,
    hasNext: false,
    onNavigate: vi.fn(),
    onNext: vi.fn(),
    onExit: vi.fn(),
    onGraded: vi.fn(),
    onRunUpdate: vi.fn(),
    onSetOfficial: vi.fn(),
    pinning: false,
    gradeRef: React.createRef<GradeControlsHandle | null>(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear(); // the grade-dock preference persists — keep tests independent
    gradeResponseCreate.mockResolvedValue(attempt);
  });

  it('renders the attempt header, a per-question navigator, and the grade editor', () => {
    renderWithClient(<FocusedGrader {...makeProps()} />);
    expect(screen.getByTestId('grading-attempt-score')).toHaveTextContent('2 / 7');
    expect(screen.getByTestId('grading-back')).toBeInTheDocument();
    // One nav chip per response in the attempt.
    expect(screen.getAllByTestId('grading-nav-chip')).toHaveLength(2);
    // The focused essay is manual → the grade editor renders; the primary button is pure
    // navigation now ("Finish" on the last queue item) and never disabled.
    expect(screen.getByTestId('grade-points')).toBeInTheDocument();
    expect(screen.getByTestId('grade-save')).toHaveTextContent('Finish');
    expect(screen.getByTestId('grade-save')).toBeEnabled();
  });

  it('saves a dirty grade before navigating via a question chip', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithClient(<FocusedGrader {...props} />);
    await user.type(screen.getByLabelText('Points awarded'), '4');
    await user.click(screen.getAllByTestId('grading-nav-chip')[1]);
    await waitFor(() => expect(props.onNavigate).toHaveBeenCalledWith(102));
    expect(gradeResponseCreate).toHaveBeenCalledTimes(1);
    expect(gradeResponseCreate.mock.calls[0][0]).toMatchObject({
      id: 11,
      gradeQuizResponseRequest: { response: 101, pointsEarned: 4 },
    });
    expect(props.onGraded).toHaveBeenCalled();
  });

  it('stays put when the flush save fails', async () => {
    const user = userEvent.setup();
    gradeResponseCreate.mockRejectedValue(new Error('boom'));
    const props = makeProps();
    renderWithClient(<FocusedGrader {...props} />);
    await user.type(screen.getByLabelText('Points awarded'), '4');
    await user.click(screen.getAllByTestId('grading-nav-chip')[1]);
    await waitFor(() => expect(gradeResponseCreate).toHaveBeenCalled());
    expect(props.onNavigate).not.toHaveBeenCalled();
  });

  it('discards a feedback-only draft on Skip without calling the API', async () => {
    const user = userEvent.setup();
    const props = { ...makeProps(), hasNext: true };
    renderWithClient(<FocusedGrader {...props} />);
    await user.type(screen.getByLabelText('Feedback for the student'), 'nice work');
    await user.click(screen.getByTestId('grading-skip'));
    await waitFor(() => expect(props.onNext).toHaveBeenCalled());
    expect(gradeResponseCreate).not.toHaveBeenCalled();
  });

  it('blocks Next with an inline error while feedback is dirty but points are empty', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithClient(<FocusedGrader {...props} />);
    await user.type(screen.getByLabelText('Feedback for the student'), 'nice work');
    await user.click(screen.getByTestId('grade-save'));
    expect(screen.getByTestId('grade-points-error')).toHaveTextContent(/enter the points/i);
    expect(props.onNext).not.toHaveBeenCalled();
    expect(gradeResponseCreate).not.toHaveBeenCalled();
    // Entering points clears the error.
    await user.type(screen.getByLabelText('Points awarded'), '4');
    expect(screen.queryByTestId('grade-points-error')).not.toBeInTheDocument();
  });

  it('shows an inline error for out-of-range points and blocks Next', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithClient(<FocusedGrader {...props} />);
    await user.type(screen.getByLabelText('Points awarded'), '9'); // essay is out of 5
    expect(screen.getByTestId('grade-points-error')).toHaveTextContent('Points must be between 0 and 5.');
    await user.click(screen.getByTestId('grade-save'));
    expect(props.onNext).not.toHaveBeenCalled();
    expect(gradeResponseCreate).not.toHaveBeenCalled();
  });

  it('advances on a clean Next without calling the API', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithClient(<FocusedGrader {...props} />);
    await user.click(screen.getByTestId('grade-save'));
    await waitFor(() => expect(props.onNext).toHaveBeenCalled());
    expect(gradeResponseCreate).not.toHaveBeenCalled();
  });

  it('moves the grade panel between the bottom dock and the side dock', async () => {
    const user = userEvent.setup();
    renderWithClient(<FocusedGrader {...makeProps()} />);
    // Default: pinned footer, no side panel.
    expect(screen.queryByTestId('grade-dock-side')).not.toBeInTheDocument();
    await user.click(screen.getByText('Grade beside'));
    const side = await screen.findByTestId('grade-dock-side');
    expect(side).toContainElement(screen.getByTestId('grade-points'));
    await user.click(screen.getByText('Grade below'));
    expect(screen.queryByTestId('grade-dock-side')).not.toBeInTheDocument();
    expect(screen.getByTestId('grade-points')).toBeInTheDocument();
  });

  it('flushes a dirty grade before moving the dock', async () => {
    const user = userEvent.setup();
    // The dock move remounts GradeControls, so the flush must land (and the parent's
    // attempt update propagate, like QuizGradingView's onGraded does) before the move —
    // a stateful harness mirrors that contract; static props would fake a still-dirty draft.
    const graded = {
      ...attempt,
      responses: [{ ...essay, pointsEarned: '4', graderFeedback: '', needsManualGrading: false }, mc],
    } as unknown as StaffQuizAttempt;
    gradeResponseCreate.mockResolvedValue(graded);
    const props = makeProps();
    const Harness = () => {
      const [att, setAtt] = React.useState(props.attempt);
      return <FocusedGrader {...props} attempt={att} onGraded={setAtt} />;
    };
    renderWithClient(<Harness />);
    await user.type(screen.getByLabelText('Points awarded'), '4');
    await user.click(screen.getByText('Grade beside'));
    await screen.findByTestId('grade-dock-side');
    expect(gradeResponseCreate).toHaveBeenCalledTimes(1);
  });

  it('has no obvious accessibility violations', async () => {
    const { container } = renderWithClient(<FocusedGrader {...makeProps()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('RunCodeControls', () => {
  const codeResponse = {
    id: 103, sortKey: 2, needsManualGrading: true, isCorrect: null,
    pointsEarned: null, points: '5', answerText: 'print(1)', selectedChoices: [],
    codeExecution: null,
    question: { id: 7, questionType: QuestionTypeEnum.Code, text: 'Write code.', choices: [], language: 'python' },
  } as unknown as StaffQuizResponse;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces a failed dispatch in the terminal instead of failing silently', async () => {
    const user = userEvent.setup();
    vi.mocked(quizAttemptsApi.runCodeCreate).mockRejectedValue(new Error('network down'));
    render(<RunCodeControls attemptId={11} response={codeResponse} onUpdate={vi.fn()} />);
    expect(screen.queryByTestId('run-code-error')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('run-code'));
    const err = await screen.findByTestId('run-code-error');
    expect(err).toHaveTextContent(/could not start the run/i);
    // The button must recover so the grader can retry.
    expect(screen.getByTestId('run-code')).toBeEnabled();
  });
});
