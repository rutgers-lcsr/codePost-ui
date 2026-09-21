// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { message } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../api-client/clients', () => ({
  quizAttemptsApi: { create: vi.fn(), saveAnswerPartialUpdate: vi.fn(), myAttemptsList: vi.fn() },
}));

import { quizAttemptsApi } from '../../../api-client/clients';
import { ResponseError } from '../../../api-client';
import QuizTakingView from './QuizTakingView';

const attempt = {
  id: 1,
  quiz: 7,
  title: 'Midterm',
  description: '',
  attemptNumber: 1,
  status: 'in_progress',
  deadline: null,
  isOfficialOverride: false,
  oneQuestionAtATime: false,
  allowBacktracking: true,
  showResponses: false,
  allowSubmissionReview: true,
  requireSebBrowser: false,
  serverNow: new Date().toISOString(),
  responses: [
    {
      id: 10,
      sortKey: 0,
      answerText: '',
      selectedChoices: [],
      question: {
        id: 100,
        questionType: 'short_answer',
        text: 'Q1',
        description: null,
        starterCode: null,
        language: null,
      },
    },
  ],
};

const unavailable = () => new ResponseError({ status: 503 } as Response);

const renderView = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <QuizTakingView quizId={7} courseId={3} onExit={vi.fn()} />
    </QueryClientProvider>,
  );
  // Let the start call resolve.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
};

describe('QuizTakingView answer saving', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(quizAttemptsApi.create).mockResolvedValue(attempt as any);
    vi.mocked(quizAttemptsApi.saveAnswerPartialUpdate).mockReset();
    vi.spyOn(message, 'error').mockImplementation((() => undefined) as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('retries a save with backoff through an outage instead of erroring', async () => {
    vi.mocked(quizAttemptsApi.saveAnswerPartialUpdate)
      .mockRejectedValueOnce(unavailable())
      .mockResolvedValueOnce({} as any);
    await renderView();

    fireEvent.change(screen.getByTestId('quiz-answer-text'), { target: { value: 'hello' } });

    // Debounced save fires at 600ms and hits the outage.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(quizAttemptsApi.saveAnswerPartialUpdate).toHaveBeenCalledTimes(1);
    expect(message.error).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');

    // Retry after the 2s backoff succeeds.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(quizAttemptsApi.saveAnswerPartialUpdate).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');

    // No third attempt once saved.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    expect(quizAttemptsApi.saveAnswerPartialUpdate).toHaveBeenCalledTimes(2);
    expect(message.error).not.toHaveBeenCalled();
  });
});
