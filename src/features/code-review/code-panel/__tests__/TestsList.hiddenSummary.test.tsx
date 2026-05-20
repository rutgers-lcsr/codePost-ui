// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import { useCodeConsoleStore } from '../../../../stores/useCodeConsoleStore';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';
import TestsList from '../TestsList';

// TestsList fetches results via submissionsApi.testResultsRetrieve. We avoid the network
// by passing demoMode + initialResults; the component skips fetching when demoMode is true
// and renders directly from initialResults.

const themeCtx = {
  consoleTheme: consoleThemes.light,
  setConsoleTheme: vi.fn(),
  toggleConsoleTheme: vi.fn(),
};

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <ConsoleThemeContext.Provider value={themeCtx}>{children}</ConsoleThemeContext.Provider>
    </MemoryRouter>
  );
}

const visibleCategory = { id: 100, name: 'Loops', assignment: 1 } as any;

const visibleTestCase = {
  id: 1,
  testCategory: 100,
  description: 'Visible test description',
  pointsPass: 2,
  pointsFail: 0,
  hidden: false,
} as any;

const visibleResult = {
  id: 10,
  submission: 1,
  testCase: 1,
  logs: 'visible logs',
  passed: true,
  testCategory: 100,
  created: '2026-05-19T00:00:00Z',
  modified: '2026-05-19T00:00:00Z',
  isError: false,
  score: 2,
  maxScore: 2,
  results: null,
  hiddenSummary: null,
} as any;

const syntheticHiddenSummaryRow = {
  // Negative sentinel id (mirrors the server-side `-cat_id`)
  id: -100,
  submission: 1,
  testCase: null,
  testCategory: 100,
  logs: '',
  passed: false,
  created: null,
  modified: null,
  isError: false,
  score: 3,
  maxScore: 5,
  results: null,
  hiddenSummary: {
    label: 'Hidden tests',
    passedCount: 1,
    totalCount: 2,
    pointsEarned: 3,
    pointsTotal: 5,
  },
} as any;

const seedStore = ({ isStudent }: { isStudent: boolean }) => {
  useCodeConsoleStore.setState({
    isStudent,
    assignment: { id: 1, testsAffectGrade: true } as any,
    setTests: vi.fn() as any,
  } as any);
};

afterEach(() => {
  cleanup();
});

describe('TestsList hidden-test summary rendering', () => {
  it('renders the consolidated "Hidden tests" row inline within its category for students', () => {
    seedStore({ isStudent: true });

    const result = render(
      <Providers>
        <TestsList
          submissionId={1}
          tests={[visibleTestCase]}
          testCategories={[visibleCategory]}
          demoMode
          initialResults={[visibleResult, syntheticHiddenSummaryRow]}
        />
      </Providers>,
    );

    const summary = result.getByTestId('hidden-tests-summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('Hidden tests');
    expect(summary).toHaveTextContent('1 of 2 hidden tests passed');
    expect(summary).toHaveTextContent('3 / 5 pts');

    // Real hidden-test names/logs must never reach the DOM through any channel.
    expect(result.container.textContent ?? '').not.toContain('hidden pass logs');
    expect(result.container.textContent ?? '').not.toContain('Internal explanation');

    // The synthetic row must appear inside the visible test's category panel, not as
    // an orphan / "Other Tests" row.
    expect(result.queryByText('Other Tests')).toBeNull();
  });

  it('expands the synthetic row into its underlying counts in the top-of-panel badges', () => {
    seedStore({ isStudent: true });

    const result = render(
      <Providers>
        <TestsList
          submissionId={1}
          tests={[visibleTestCase]}
          testCategories={[visibleCategory]}
          demoMode
          initialResults={[visibleResult, syntheticHiddenSummaryRow]}
        />
      </Providers>,
    );

    // 1 visible passed + 1 hidden passed = 2 Passed; 1 hidden failed = 1 Failed.
    // The Antd Badge renders the count as the string "2 Passed" / "1 Failed".
    expect(result.getByText(/2 Passed/i)).toBeInTheDocument();
    expect(result.getByText(/1 Failed/i)).toBeInTheDocument();
  });
});
