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

import { quizGeneratedSectionsApi, quizzesApi, quizSuggestionJobsApi } from '../../../api-client/clients';
import { QuizGeneratedSection } from '../../../api-client';
import { ResponseError } from '../../../api-client/runtime';
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

const renderModal = (overrides: Partial<QuizGeneratedSection> = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <GeneratedSectionModal
        open
        courseId={3}
        quizId={9}
        attached
        manualGeneration={false}
        section={{ ...section, ...overrides } as QuizGeneratedSection}
        nextSortKey={1}
        onClose={vi.fn()}
      />
    </QueryClientProvider>,
  );
};

// What the server's promptVariables endpoint reports: which tokens draw on the submission.
const variables = [
  {
    token: '{submission_files}',
    name: 'submission_files',
    argument: null,
    label: 'Submission files',
    description: '',
    kind: 'static',
    requiresSubmission: true,
  },
  {
    token: '{assignment_name}',
    name: 'assignment_name',
    argument: null,
    label: 'Assignment name',
    description: '',
    kind: 'static',
    requiresSubmission: false,
  },
];

// The prompt editor (TemplateTextArea) re-measures its autoSize textarea and highlight
// overlay on each render, which makes these form-heavy tests slow enough to blow the 5s
// default under a fully loaded parallel run.
// findBy*/waitFor keep their own 1s default regardless of the test timeout above — give the
// async queries the same headroom, or a slow render fails the query before the test times out.
const WAIT = { timeout: 10_000 };

describe('GeneratedSectionModal — Test prompt', { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(quizzesApi.promptVariablesList).mockResolvedValue([] as any);
    vi.mocked(quizzesApi.promptTemplatesList).mockResolvedValue([] as any);
    vi.mocked(quizzesApi.backfillPreviewRetrieve).mockResolvedValue({
      wouldGenerate: 0,
      missing: 0,
      needsSubmission: true,
    } as any);
  });

  it('posts the current form values and renders the example questions in the side pane', async () => {
    vi.mocked(quizzesApi.previewGeneratedSectionCreate).mockResolvedValue({ id: 42 } as any);
    // Terminal on the first poll — pollSuggestionJob returns without timer games.
    vi.mocked(quizSuggestionJobsApi.retrieve).mockResolvedValue(completedJob as any);
    renderModal();

    fireEvent.click(screen.getByTestId('section-test-button'));

    await waitFor(
      () =>
        expect(quizzesApi.previewGeneratedSectionCreate).toHaveBeenCalledWith({
          id: 9,
          previewGeneratedSectionRequest: {
            systemPrompt: 'Ask about {submission_files}.',
            numQuestions: 2,
            questionTypes: [],
            seed: 'random',
          },
        }),
      WAIT,
    );
    expect(await screen.findByText('What does your helper return?', undefined, WAIT)).toBeInTheDocument();
    expect(screen.getByText(/stu@example\.edu/)).toBeInTheDocument();
  });

  it('shows the job error when the generation run fails', async () => {
    vi.mocked(quizzesApi.previewGeneratedSectionCreate).mockResolvedValue({ id: 42 } as any);
    vi.mocked(quizSuggestionJobsApi.retrieve).mockResolvedValue({
      id: 42,
      status: 'failed',
      errorMessage: 'No student has submitted yet — upload demo files instead.',
    } as any);
    renderModal();

    fireEvent.click(screen.getByTestId('section-test-button'));

    expect(
      await screen.findByText('No student has submitted yet — upload demo files instead.', undefined, WAIT),
    ).toBeInTheDocument();
  });

  it('maps a 400 systemPrompt error into the prompt field', async () => {
    vi.mocked(quizzesApi.previewGeneratedSectionCreate).mockRejectedValue(
      Object.assign(new Error('bad request'), {
        body: { systemPrompt: ['Unknown variable {zap}.'] },
      }),
    );
    renderModal();

    fireEvent.click(screen.getByTestId('section-test-button'));

    expect(await screen.findByText('Unknown variable {zap}.', undefined, WAIT)).toBeInTheDocument();
    expect(quizSuggestionJobsApi.retrieve).not.toHaveBeenCalled();
  });

  it('maps a generated-client 400 (body on the Response, not the error) into the prompt field', async () => {
    vi.mocked(quizzesApi.previewGeneratedSectionCreate).mockRejectedValue(
      new ResponseError(new Response(JSON.stringify({ systemPrompt: ['Unknown variable {zap}.'] }), { status: 400 })),
    );
    renderModal();

    fireEvent.click(screen.getByTestId('section-test-button'));

    expect(await screen.findByText('Unknown variable {zap}.', undefined, WAIT)).toBeInTheDocument();
    expect(quizSuggestionJobsApi.retrieve).not.toHaveBeenCalled();
  });
});

describe('GeneratedSectionModal — fallback prompt', { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(quizzesApi.promptVariablesList).mockResolvedValue(variables as any);
    vi.mocked(quizzesApi.promptTemplatesList).mockResolvedValue([] as any);
    vi.mocked(quizzesApi.backfillPreviewRetrieve).mockResolvedValue({
      wouldGenerate: 0,
      missing: 0,
      needsSubmission: true,
      missingWithoutSubmission: 0,
      missingWithoutSubmissionStudents: [],
      fallbackCovers: false,
    } as any);
  });

  it('offers the fallback field only when the prompt draws on the submission', async () => {
    renderModal();
    expect(await screen.findByTestId('section-fallback-prompt', undefined, WAIT)).toBeInTheDocument();
  });

  it('hides the fallback field for a submission-free prompt', async () => {
    renderModal({ systemPrompt: 'Ask about {assignment_name}.' });
    // Wait for the variables query to settle, then confirm the field never appeared.
    await waitFor(() => expect(quizzesApi.promptVariablesList).toHaveBeenCalled(), WAIT);
    await waitFor(() => expect(screen.getByTestId('section-prompt')).toBeInTheDocument(), WAIT);
    expect(screen.queryByTestId('section-fallback-prompt')).not.toBeInTheDocument();
  });

  it('saves the fallback prompt with the section', async () => {
    vi.mocked(quizGeneratedSectionsApi.partialUpdate).mockResolvedValue({} as any);
    renderModal({ fallbackPrompt: 'Ask about {assignment_name}.' });
    await screen.findByTestId('section-fallback-prompt', undefined, WAIT);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(
      () =>
        expect(quizGeneratedSectionsApi.partialUpdate).toHaveBeenCalledWith({
          id: 5,
          patchedQuizGeneratedSection: expect.objectContaining({
            systemPrompt: 'Ask about {submission_files}.',
            fallbackPrompt: 'Ask about {assignment_name}.',
          }),
        }),
      WAIT,
    );
  });

  it('maps a 400 fallbackPrompt error into the fallback field', async () => {
    vi.mocked(quizGeneratedSectionsApi.partialUpdate).mockRejectedValue(
      new ResponseError(
        new Response(JSON.stringify({ fallbackPrompt: ["The fallback prompt can't use {submission_files}."] }), {
          status: 400,
        }),
      ),
    );
    renderModal({ fallbackPrompt: 'Ask about {submission_files}.' });
    await screen.findByTestId('section-fallback-prompt', undefined, WAIT);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText("The fallback prompt can't use {submission_files}.", undefined, WAIT),
    ).toBeInTheDocument();
  });
});
