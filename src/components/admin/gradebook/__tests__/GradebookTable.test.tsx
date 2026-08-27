// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { GradebookResponse } from '../../../../api-client';
import { DEFAULT_PAGE_SIZE } from '../../../utils/LocalSettings';
import { createLocalStorageMock, installLocalStorageMock, restoreLocalStorage } from '../../../../test-utils';
import { GradebookTable } from '../Gradebook';

/** 60 students, one assignment column — enough rows to spill onto a second page. */
const makeData = (): GradebookResponse =>
  ({
    assignments: [{ id: 1, name: 'HW1', points: 100 }],
    quizzes: [],
    rows: Array.from({ length: 60 }, (_, i) => {
      const n = String(i).padStart(2, '0');
      return {
        student: `student${n}@x.edu`,
        section: i % 2 === 0 ? 'P01' : 'P02',
        assignmentCells: [{ assignment: 1, grade: i, hasSubmission: true, isFinalized: true }],
        quizCells: [],
        totalEarned: i,
        totalPossible: 100,
        percent: i,
      };
    }),
  }) as unknown as GradebookResponse;

const bodyRows = (container: HTMLElement) =>
  [...container.querySelectorAll('.ant-table-tbody > tr.ant-table-row')];

describe('GradebookTable', () => {
  // The page size is a persisted global preference, so these need a storage mock that
  // actually retains what it is given — the default stub in setupTests does not.
  const { mock } = createLocalStorageMock();

  beforeEach(() => {
    installLocalStorageMock(mock);
    mock.clear();
  });

  afterEach(() => restoreLocalStorage());

  it('paginates at the default page size and page 2 shows the next students', () => {
    const { container } = render(<GradebookTable data={makeData()} />);
    expect(bodyRows(container)).toHaveLength(DEFAULT_PAGE_SIZE);
    expect(screen.getByText('60 students')).toBeTruthy();

    fireEvent.click(screen.getByTitle('2'));
    const rows = bodyRows(container);
    expect(rows).toHaveLength(DEFAULT_PAGE_SIZE);
    expect(rows[0].textContent).toContain(`student${String(DEFAULT_PAGE_SIZE).padStart(2, '0')}@x.edu`);
  });

  it('the size changer actually resizes the page', () => {
    const { container } = render(<GradebookTable data={makeData()} />);
    expect(bodyRows(container)).toHaveLength(DEFAULT_PAGE_SIZE);

    fireEvent.mouseDown(container.querySelector('.ant-pagination-options-size-changer .ant-select-content')!);
    fireEvent.click(screen.getByTitle('25 / page'));

    expect(bodyRows(container)).toHaveLength(25);
  });

  it('search filters rows by student email', () => {
    vi.useFakeTimers();
    const { container } = render(<GradebookTable data={makeData()} />);
    fireEvent.change(screen.getByPlaceholderText('Search students…'), {
      target: { value: 'student59' },
    });
    // The search is debounced 250ms so typing doesn't re-filter per keystroke.
    act(() => vi.advanceTimersByTime(300));
    vi.useRealTimers();
    const rows = bodyRows(container);
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('student59@x.edu');
  });
});
