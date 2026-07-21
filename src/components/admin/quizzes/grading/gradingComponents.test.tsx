// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Render smoke + a11y coverage for the redesigned quiz grading surface. These components are
// presentational (props-driven), so they render with fixtures alone — no query client needed.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import '@testing-library/jest-dom/vitest';
import React from 'react';

import GradingQueue from './GradingQueue';
import FocusedGrader from './FocusedGrader';
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
  id: 11, student: 'ada@rutgers.edu', attemptNumber: 2, score: '2', maxScore: '7',
  needsManualGrading: true, passed: null, isOfficialOverride: false,
  responses: [essay, mc],
} as unknown as StaffQuizAttempt;

const queue = [{ attemptId: 11, responseId: 101, student: 'ada@rutgers.edu', attemptNumber: 2 }];

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
  const props = {
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
  };

  it('renders the attempt header, a per-question navigator, and the grade editor', () => {
    render(<FocusedGrader {...props} />);
    expect(screen.getByTestId('grading-attempt-score')).toHaveTextContent('2 / 7');
    expect(screen.getByTestId('grading-back')).toBeInTheDocument();
    // One nav chip per response in the attempt.
    expect(screen.getAllByTestId('grading-nav-chip')).toHaveLength(2);
    // The focused essay is manual → the grade editor renders, labelled to save-and-finish.
    expect(screen.getByTestId('grade-points')).toBeInTheDocument();
    expect(screen.getByTestId('grade-save')).toHaveTextContent('Save & finish');
  });

  it('has no obvious accessibility violations', async () => {
    const { container } = render(<FocusedGrader {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
