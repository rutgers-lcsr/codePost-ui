// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import React from 'react';

import ChoicesEditor from './components/admin/quizzes/ChoicesEditor';
import QuestionAnswerer, { AnswerValue } from './components/student/quizzes/QuestionAnswerer';
import QuizQuestions from './components/student/quizzes/QuizQuestions';
import QuizResults from './components/student/quizzes/QuizResults';
import StudentQuizzesSection from './components/student/quizzes/StudentQuizzesSection';
import { QuestionTypeEnum, StudentQuiz, StudentQuizAttempt, StudentQuizResponse } from './api-client';

// The student quiz components read their data through the hooks in quizzes/queries; mock
// that module (fixtures below) so the list/results views render real content without a
// query client or network stubs.
const { quizFixtures, attemptFixtures } = vi.hoisted(() => {
  const quizFixtures = [
    {
      id: 1,
      course: 7,
      title: 'Week 1 Quiz',
      assignment: null,
      questionCount: 5,
      timeLimitMinutes: 30,
      closeAt: '2026-08-01T00:00:00Z',
      attemptsAllowed: 1,
      attemptsUsed: 0,
      availability: { isOpen: true },
      hasOpenAttempt: false,
      hasSubmittedAttempt: false,
      scoringPolicy: 'highest',
    },
    {
      id: 2,
      course: 7,
      title: 'Locked Quiz',
      assignment: 42,
      questionCount: 3,
      timeLimitMinutes: null,
      closeAt: null,
      attemptsAllowed: 1,
      attemptsUsed: 0,
      availability: { isOpen: false, reason: 'no_submission_yet' },
      hasOpenAttempt: false,
      hasSubmittedAttempt: false,
      scoringPolicy: 'highest',
    },
    {
      id: 3,
      course: 7,
      title: 'Graded Quiz',
      assignment: null,
      questionCount: 4,
      timeLimitMinutes: 15,
      closeAt: null,
      attemptsAllowed: 1,
      attemptsUsed: 1,
      availability: { isOpen: false, reason: 'closed' },
      hasOpenAttempt: false,
      hasSubmittedAttempt: true,
      myScore: '4.5',
      myMaxScore: '5',
      myPassed: true,
      scoringPolicy: 'highest',
    },
  ] as unknown as StudentQuiz[];

  const attemptFixtures = [
    {
      id: 11,
      attemptNumber: 2,
      status: 'submitted',
      score: '4',
      maxScore: '5',
      needsManualGrading: false,
      passed: true,
      submittedAt: '2026-07-10T12:00:00Z',
      responses: [],
    },
    {
      id: 10,
      attemptNumber: 1,
      status: 'submitted',
      score: '3',
      maxScore: '5',
      needsManualGrading: false,
      passed: true,
      submittedAt: '2026-07-09T12:00:00Z',
      responses: [],
    },
  ] as unknown as StudentQuizAttempt[];

  return { quizFixtures, attemptFixtures };
});

vi.mock('./components/student/quizzes/queries', () => ({
  useAvailableQuizzes: () => ({ data: quizFixtures, isLoading: false }),
  useMyAttempts: () => ({ data: attemptFixtures, isLoading: false }),
  useAllAvailableQuizzes: () => [],
}));

// Structural axe config (contrast is exercised separately in accessibility_contrast.test.tsx).
// Mirrors accessibility.test.tsx so the quiz components share the same rule set.
const axeConfig = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  },
  resultTypes: ['violations'] as const,
  elementRef: false,
  rules: {
    'color-contrast': { enabled: false },
  },
};

const stripStylesAndRunAxe = async (container: HTMLElement) => {
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove());
  return axe(container, axeConfig);
};

// A minimal StudentQuizResponse for the answer controls. Code questions are intentionally
// excluded from the type matrix — the Monaco editor doesn't render meaningfully under jsdom
// (its escape-hint advisory is covered separately below).
const makeResponse = (
  questionType: QuestionTypeEnum,
  question: Partial<StudentQuizResponse['question']> = {},
  overrides: Partial<StudentQuizResponse> = {},
): StudentQuizResponse =>
  ({
    id: 1,
    answerText: '',
    selectedChoices: [],
    points: 5,
    pointsEarned: null,
    needsManualGrading: false,
    isCorrect: undefined,
    graderFeedback: null,
    question: {
      id: 10,
      questionType,
      text: 'What is 2 + 2?',
      description: null,
      choices: [
        { id: 1, text: 'Three', isCorrect: false, sortKey: 0 },
        { id: 2, text: 'Four', isCorrect: true, sortKey: 1 },
      ],
      language: null,
      generalFeedback: null,
      starterCode: null,
      ...question,
    },
    ...overrides,
  }) as unknown as StudentQuizResponse;

const emptyAnswer: AnswerValue = { answerText: '', selectedChoices: [] };

describe('Quiz answer controls — accessibility', () => {
  const answerableTypes: [string, QuestionTypeEnum][] = [
    ['multiple choice', QuestionTypeEnum.MultipleChoice],
    ['multiple answers', QuestionTypeEnum.MultipleAnswers],
    ['true/false', QuestionTypeEnum.TrueFalse],
    ['essay', QuestionTypeEnum.Essay],
    ['short answer', QuestionTypeEnum.ShortAnswer],
    ['numerical', QuestionTypeEnum.Numerical],
  ];

  it.each(answerableTypes)('QuestionAnswerer (%s) has no structural a11y violations', async (_label, type) => {
    const { container } = render(
      <QuestionAnswerer
        response={makeResponse(type)}
        index={0}
        value={emptyAnswer}
        disabled={false}
        reveal={false}
        onChange={() => undefined}
      />,
    );
    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('QuestionAnswerer in review/reveal mode has no violations (correct-answer markers labelled)', async () => {
    const { container } = render(
      <QuestionAnswerer
        response={makeResponse(QuestionTypeEnum.MultipleChoice)}
        index={0}
        value={{ answerText: '', selectedChoices: [2] }}
        disabled
        reveal
        onChange={() => undefined}
      />,
    );
    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('code questions show the Monaco keyboard-trap escape hint (WCAG 2.1.2 advisory)', () => {
    render(
      <QuestionAnswerer
        response={makeResponse(QuestionTypeEnum.Code, { language: 'python-3', starterCode: 'x = 1' })}
        index={0}
        value={{ answerText: 'x = 1', selectedChoices: [] }}
        disabled={false}
        reveal={false}
        onChange={() => undefined}
      />,
    );
    // Monaco itself can't load under jsdom; the visible advisory is the testable surface.
    expect(screen.getByText(/Tab inserts a tab character/)).toBeTruthy();
    expect(screen.getByText(/Ctrl\+(Shift\+)?M/)).toBeTruthy();
  });
});

describe('ChoicesEditor — accessibility', () => {
  const choiceTypes: [string, QuestionTypeEnum][] = [
    ['multiple choice (radio)', QuestionTypeEnum.MultipleChoice],
    ['multiple answers (checkbox)', QuestionTypeEnum.MultipleAnswers],
    ['short answer (accepted answers)', QuestionTypeEnum.ShortAnswer],
  ];

  it.each(choiceTypes)('ChoicesEditor (%s) has no structural a11y violations', async (_label, type) => {
    const { container } = render(
      <ChoicesEditor
        questionType={type}
        value={[
          { text: 'Alpha', isCorrect: true },
          { text: 'Beta', isCorrect: false },
          { text: 'Gamma', isCorrect: false },
        ]}
        onChange={() => undefined}
      />,
    );
    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  });
});

describe('QuizQuestions — accessibility', () => {
  const responses = [
    makeResponse(QuestionTypeEnum.MultipleChoice, { id: 10 }, { id: 1 }),
    makeResponse(QuestionTypeEnum.Essay, { id: 11, text: 'Explain your answer.' }, { id: 2 }),
    makeResponse(QuestionTypeEnum.ShortAnswer, { id: 12, text: 'Name the algorithm.' }, { id: 3 }),
  ];
  const props = {
    responses,
    value: () => emptyAnswer,
    onChange: () => undefined,
    reveal: false,
    disabled: false,
    allowBack: true,
    submitSlot: <button type="button">Submit quiz</button>,
  };

  it('one-page mode has no structural a11y violations', async () => {
    const { container } = render(<QuizQuestions {...props} oneAtATime={false} />);
    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('one-at-a-time mode has no structural a11y violations', async () => {
    const { container } = render(<QuizQuestions {...props} oneAtATime />);
    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  });
});

describe('QuizResults — accessibility', () => {
  it('results view (score summary + attempt history) has no structural a11y violations', async () => {
    const attempt = {
      ...attemptFixtures[0],
      responses: [
        makeResponse(
          QuestionTypeEnum.MultipleChoice,
          { id: 10 },
          { id: 1, pointsEarned: '5', isCorrect: true, graderFeedback: 'Nice work.' },
        ),
      ],
    } as unknown as StudentQuizAttempt;

    const { container } = render(
      <QuizResults
        quizId={1}
        courseId={7}
        attempt={attempt}
        quizTitle="Week 1 Quiz"
        onExit={() => undefined}
        onSelectAttempt={() => undefined}
      />,
    );
    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  });
});

describe('StudentQuizzesSection — accessibility', () => {
  it('quiz cards (open, locked, graded) have no structural a11y violations', async () => {
    const { container } = render(
      <StudentQuizzesSection
        courseId={7}
        onTake={() => undefined}
        onReview={() => undefined}
        assignmentNamesById={{ 42: 'Homework 3' }}
      />,
    );
    // Sanity: all three fixture states rendered.
    expect(screen.getByText('Week 1 Quiz')).toBeTruthy();
    expect(screen.getByText('Opens after you submit')).toBeTruthy();
    expect(screen.getByText('Review results')).toBeTruthy();

    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  });
});
