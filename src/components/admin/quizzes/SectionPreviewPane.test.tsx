// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

import SectionPreviewPane, { PreviewResult } from './SectionPreviewPane';

const result: PreviewResult = {
  seed: 'random',
  sampleStudent: 'stu@example.edu',
  resolvedPrompt: 'the resolved prompt text',
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
};

describe('SectionPreviewPane', () => {
  it('shows a status spinner while generating', () => {
    render(<SectionPreviewPane testing result={null} pointsPerQuestion={1} />);
    expect(screen.getByRole('status')).toHaveTextContent('Generating example questions');
  });

  it('shows an empty state before the first run', () => {
    render(<SectionPreviewPane testing={false} result={null} pointsPerQuestion={1} />);
    expect(screen.getByText('No test run yet')).toBeInTheDocument();
  });

  it('renders example questions with type, choices, points, and the seed note', () => {
    render(<SectionPreviewPane testing={false} result={result} pointsPerQuestion={3} />);
    expect(screen.getByText(/stu@example\.edu/)).toBeInTheDocument();
    expect(screen.getByText('Multiple choice')).toBeInTheDocument();
    expect(screen.getByText('What does your helper return?')).toBeInTheDocument();
    expect(screen.getByText('A list')).toBeInTheDocument();
    expect(screen.getByText('3 pts')).toBeInTheDocument();
    expect(
      screen.getByText('Request details — the resolved prompt the model saw'),
    ).toBeInTheDocument();
  });
});
