// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../api-client/clients', () => ({ quizAttemptsApi: { create: vi.fn() } }));

import { quizAttemptsApi } from '../../../api-client/clients';
import { ResponseError, StudentQuiz } from '../../../api-client';
import AccessCodeModal from './AccessCodeModal';

const quiz = { id: 7, course: 3, title: 'Midterm' } as unknown as StudentQuiz;

// A 403 the way the start endpoint returns it for a closed, code-gated quiz.
const forbidden = (body: unknown) =>
  new ResponseError({ status: 403, json: async () => body } as unknown as Response);

const renderModal = () => {
  const onClose = vi.fn();
  const onStarted = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AccessCodeModal quiz={quiz} open onClose={onClose} onStarted={onStarted} />
    </QueryClientProvider>,
  );
  return { onClose, onStarted };
};

const typeCode = (value: string) =>
  fireEvent.change(screen.getByLabelText('Access code'), { target: { value } });
const clickStart = () => fireEvent.click(screen.getByRole('button', { name: 'Start quiz' }));

describe('AccessCodeModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts the attempt with the entered code, then hands off to the quiz', async () => {
    vi.mocked(quizAttemptsApi.create).mockResolvedValue({ id: 1, status: 'in_progress' } as any);
    const { onClose, onStarted } = renderModal();

    typeCode('  ABC123  '); // trimmed before sending
    clickStart();

    await waitFor(() => expect(onStarted).toHaveBeenCalled());
    expect(quizAttemptsApi.create).toHaveBeenCalledWith({
      startQuizAttemptRequest: { quiz: 7, accessCode: 'ABC123' },
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an error and does not hand off when the code is rejected', async () => {
    vi.mocked(quizAttemptsApi.create).mockRejectedValue(forbidden({ accessCodeRequired: true }));
    const { onStarted } = renderModal();

    typeCode('nope');
    clickStart();

    await waitFor(() => expect(screen.getByTestId('quiz-access-code-error')).toBeInTheDocument());
    expect(screen.getByTestId('quiz-access-code-error')).toHaveTextContent(/isn't valid/i);
    expect(onStarted).not.toHaveBeenCalled();
  });

  it('surfaces a non-code refusal (e.g. no attempts left) verbatim', async () => {
    vi.mocked(quizAttemptsApi.create).mockRejectedValue(forbidden({ detail: 'No attempts remaining.' }));
    const { onStarted } = renderModal();

    typeCode('ABC123');
    clickStart();

    await waitFor(() =>
      expect(screen.getByTestId('quiz-access-code-error')).toHaveTextContent('No attempts remaining.'),
    );
    expect(onStarted).not.toHaveBeenCalled();
  });

  it('validates a blank code without calling the API', async () => {
    const { onStarted } = renderModal();

    clickStart();

    await waitFor(() => expect(screen.getByTestId('quiz-access-code-error')).toBeInTheDocument());
    expect(quizAttemptsApi.create).not.toHaveBeenCalled();
    expect(onStarted).not.toHaveBeenCalled();
  });
});
