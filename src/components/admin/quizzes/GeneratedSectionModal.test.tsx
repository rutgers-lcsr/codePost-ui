// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../api-client/clients', () => ({
  // queries.ts destructures these at import time — present but unused here.
  assignmentsApi: {},
  coursesApi: {},
  generatedQuestionSetsApi: {},
  questionBanksApi: {},
  questionsApi: {},
  sectionsApi: {},
  suggestedQuizQuestionsApi: {},
  quizGeneratedSectionsApi: { create: vi.fn(), partialUpdate: vi.fn() },
  quizzesApi: {
    previewGeneratedSectionCreate: vi.fn(),
    promptVariablesList: vi.fn(),
    promptTemplatesList: vi.fn(),
    backfillPreviewRetrieve: vi.fn(),
  },
  quizSuggestionJobsApi: { retrieve: vi.fn() },
}));

import { quizzesApi, quizSuggestionJobsApi } from '../../../api-client/clients';
import { QuizGeneratedSection } from '../../../api-client';
import GeneratedSectionModal from './GeneratedSectionModal';

const section = {
  id: 5,
  quiz: 9,
  name: 'About your code',
  systemPrompt: 'Ask about {submission_files}.',
  numQuestions: 2,
  pointsPerQuestion: 3,
  questionTypes: [],
} as unknown as QuizGeneratedSection;

const completedJob = {
  id: 42,
  status: 'completed',
  errorMessage: '',
  resultData: {
    seed: 'random',
    sampleStudent: 'stu@example.edu',
    resolvedPrompt: 'resolved prompt',
    questions: [
      {
        questionType: 'multiple_choice',
        text: 'What does your helper return?',
        description: '',
        choicesData: [
          { text: 'A list', isCorrect: true, feedback: '' },
          { text: 'None', isCorrect: false, feedback: '' },
        ],
        language: null,
        starterCode: null,
        referenceSolution: "Correct: 'A list'.",
      },
    ],
  },
};

const renderModal = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <GeneratedSectionModal
        open
        courseId={3}
        quizId={9}
        attached
        manualGeneration={false}
        section={section}
        nextSortKey={1}
        onClose={vi.fn()}
      />
    </QueryClientProvider>,
  );
};

// The prompt editor (TemplateTextArea) re-measures its autoSize textarea and highlight
// overlay on each render, which makes these form-heavy tests slow enough to blow the 5s
// default under a fully loaded parallel run.
describe('GeneratedSectionModal — Test prompt', { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(quizzesApi.promptVariablesList).mockResolvedValue([] as any);
    vi.mocked(quizzesApi.promptTemplatesList).mockResolvedValue([] as any);
    vi.mocked(quizzesApi.backfillPreviewRetrieve).mockResolvedValue(
      { wouldGenerate: 0, missing: 0, needsSubmission: true } as any,
    );
  });

  it('posts the current form values and renders the example questions in the side pane', async () => {
    vi.mocked(quizzesApi.previewGeneratedSectionCreate).mockResolvedValue({ id: 42 } as any);
    // Terminal on the first poll — pollSuggestionJob returns without timer games.
    vi.mocked(quizSuggestionJobsApi.retrieve).mockResolvedValue(completedJob as any);
    renderModal();

    fireEvent.click(screen.getByTestId('section-test-button'));

    await waitFor(() => expect(quizzesApi.previewGeneratedSectionCreate).toHaveBeenCalledWith({
      id: 9,
      previewGeneratedSectionRequest: {
        systemPrompt: 'Ask about {submission_files}.',
        numQuestions: 2,
        questionTypes: [],
        seed: 'random',
      },
    }));
    expect(await screen.findByText('What does your helper return?')).toBeInTheDocument();
    expect(screen.getByText(/stu@example\.edu/)).toBeInTheDocument();
  });

  it('shows the job error when the generation run fails', async () => {
    vi.mocked(quizzesApi.previewGeneratedSectionCreate).mockResolvedValue({ id: 42 } as any);
    vi.mocked(quizSuggestionJobsApi.retrieve).mockResolvedValue(
      { id: 42, status: 'failed', errorMessage: 'No student has submitted yet — upload demo files instead.' } as any,
    );
    renderModal();

    fireEvent.click(screen.getByTestId('section-test-button'));

    expect(await screen.findByText('No student has submitted yet — upload demo files instead.'))
      .toBeInTheDocument();
  });

  it('maps a 400 systemPrompt error into the prompt field', async () => {
    vi.mocked(quizzesApi.previewGeneratedSectionCreate).mockRejectedValue(
      Object.assign(new Error('bad request'), {
        body: { systemPrompt: ['Unknown variable {zap}.'] },
      }),
    );
    renderModal();

    fireEvent.click(screen.getByTestId('section-test-button'));

    expect(await screen.findByText('Unknown variable {zap}.')).toBeInTheDocument();
    expect(quizSuggestionJobsApi.retrieve).not.toHaveBeenCalled();
  });
});
