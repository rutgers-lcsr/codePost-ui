// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import React from 'react';

import { GradebookTable } from './components/admin/gradebook/Gradebook';
import { GradebookResponse } from './api-client';

// Structural axe config (contrast is exercised separately in accessibility_contrast.test.tsx).
// Mirrors accessibility.test.tsx so admin components share the same rule set.
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

const data = {
  assignments: [{ id: 1, name: 'HW1', points: 100 }],
  quizzes: [{ id: 7, title: 'Week 1' }],
  rows: [
    {
      student: 'a@x.edu',
      section: 'P01',
      assignmentCells: [{ assignment: 1, grade: 90, hasSubmission: true, isFinalized: true }],
      quizCells: [{ quiz: 7, score: 8, maxScore: 10, needsGrading: false, hasAttempts: true }],
      totalEarned: 98,
      totalPossible: 110,
      percent: 89.09,
    },
    {
      student: 'b@x.edu',
      section: null,
      assignmentCells: [{ assignment: 1, grade: null, hasSubmission: true, isFinalized: false }],
      quizCells: [{ quiz: 7, score: null, maxScore: null, needsGrading: true, hasAttempts: true }],
      totalEarned: 0,
      totalPossible: 0,
      percent: null,
    },
  ],
} as unknown as GradebookResponse;

describe('Gradebook accessibility', () => {
  it('GradebookTable grid has no structural violations', async () => {
    const { container } = render(<GradebookTable data={data} />);
    expect(await stripStylesAndRunAxe(container)).toHaveNoViolations();
  });

  it('GradebookTable empty state has no structural violations', async () => {
    const { container } = render(<GradebookTable data={{ ...data, rows: [] } as GradebookResponse} />);
    expect(await stripStylesAndRunAxe(container)).toHaveNoViolations();
  });
});
