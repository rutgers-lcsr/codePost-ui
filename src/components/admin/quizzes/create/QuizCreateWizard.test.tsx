// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { message } from 'antd';

vi.mock('../../../../api-client/clients', () => ({
  quizzesApi: { create: vi.fn() },
}));

// The real MarkdownField pulls in TipTap and course-scoped image uploads — a plain
// textarea keeps the value/onChange contract the wizard relies on.
vi.mock('../MarkdownField', () => ({
  default: ({ value, onChange, ariaLabel }: any) => (
    <textarea aria-label={ariaLabel} value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} />
  ),
}));

vi.mock('../../hooks/useAssignmentsQuery', () => ({
  useAssignmentsQuery: () => ({
    data: [
      { id: 1, name: 'HW 1', feedbackStatus: 'released' },
      { id: 2, name: 'HW 2', feedbackStatus: 'per_student' },
    ],
  }),
}));

import { quizzesApi } from '../../../../api-client/clients';
import { Course } from '../../../../api-client';
import QuizCreateWizard from './QuizCreateWizard';

const course = { id: 3, assignments: [1, 2] } as unknown as Course;
const createMock = quizzesApi.create as Mock;

const renderWizard = () => {
  const onCreated = vi.fn();
  render(<QuizCreateWizard open course={course} onCancel={vi.fn()} onCreated={onCreated} />);
  return { onCreated };
};

const typeTitle = (title: string) =>
  fireEvent.change(screen.getByLabelText('Quiz title'), { target: { value: title } });

const clickNext = () => fireEvent.click(screen.getByTestId('quiz-wizard-next'));

const selectOption = (label: string, optionText: string) => {
  fireEvent.mouseDown(screen.getByLabelText(label));
  fireEvent.click(screen.getByText(optionText));
};

beforeEach(() => {
  vi.clearAllMocks();
  message.destroy();
  createMock.mockResolvedValue({ id: 42, title: 'Pop Quiz' });
});

describe('QuizCreateWizard', () => {
  it('Skip & create from step 1 creates a draft with server defaults (the old modal path)', async () => {
    const { onCreated } = renderWizard();
    typeTitle('Pop Quiz');
    fireEvent.click(screen.getByTestId('quiz-wizard-skip'));
    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    const { quiz } = createMock.mock.calls[0][0];
    expect(quiz.course).toBe(3);
    expect(quiz.title).toBe('Pop Quiz');
    expect(quiz.isPublished).toBe(false);
    expect(quiz.attemptsAllowed).toBe(1);
    expect(quiz.sebConfigKey).toBeNull();
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ id: 42, title: 'Pop Quiz' }));
  });

  it('Skip & create without a title is blocked', async () => {
    renderWizard();
    fireEvent.click(screen.getByTestId('quiz-wizard-skip'));
    expect(await screen.findByText('A quiz needs a title.')).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('sealing results with no close blocks create and returns to the Results step', async () => {
    renderWizard();
    typeTitle('Pop Quiz');
    clickNext(); // availability
    clickNext(); // attempts
    clickNext(); // results
    selectOption('When results are released', 'After the quiz closes');
    clickNext(); // security
    fireEvent.click(screen.getByTestId('quiz-wizard-skip'));
    await screen.findByTestId('quiz-wizard-step-results');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('hides whole-class feedback triggers for per-student-feedback assignments', async () => {
    renderWizard();
    typeTitle('Pop Quiz');
    clickNext(); // availability
    selectOption('Attached assignment', 'HW 2');
    fireEvent.mouseDown(screen.getByLabelText('Quiz opens'));
    expect(await screen.findByText('After the assignment closes')).toBeInTheDocument();
    expect(screen.queryByText('After feedback is released')).not.toBeInTheDocument();
  });

  it('surfaces server field errors from the create call', async () => {
    createMock.mockRejectedValueOnce({ body: { sebConfigKey: ['Config Key must be 64 hex characters.'] } });
    renderWizard();
    typeTitle('Pop Quiz');
    fireEvent.click(screen.getByTestId('quiz-wizard-skip'));
    expect(await screen.findByText('Config Key must be 64 hex characters.')).toBeInTheDocument();
  });

  it('shows per-step help and keeps the panel open across steps', async () => {
    renderWizard();
    expect(screen.queryByTestId('quiz-wizard-help')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('quiz-wizard-help-toggle'));
    // Basics help mentions the Skip & create shortcut…
    expect(screen.getByTestId('quiz-wizard-help')).toHaveTextContent('Only the title is required');
    typeTitle('Pop Quiz');
    clickNext(); // availability — panel stays open with that step's content
    expect(screen.getByTestId('quiz-wizard-help')).toHaveTextContent('per-student AI-generated questions');
    fireEvent.click(screen.getByTestId('quiz-wizard-help-toggle'));
    expect(screen.queryByTestId('quiz-wizard-help')).not.toBeInTheDocument();
  });

  it('Create & publish on the Review step sends isPublished: true', async () => {
    const { onCreated } = renderWizard();
    typeTitle('Pop Quiz');
    for (let i = 0; i < 6; i += 1) clickNext(); // walk to Review
    await screen.findByTestId('quiz-wizard-step-review');
    fireEvent.click(screen.getByTestId('quiz-wizard-create-publish'));
    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0].quiz.isPublished).toBe(true);
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
  });
});
