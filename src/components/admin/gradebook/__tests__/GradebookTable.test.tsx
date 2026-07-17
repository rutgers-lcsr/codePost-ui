// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { GradebookResponse } from '../../../../api-client';
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
  it('paginates past 50 rows and page 2 shows the remaining students', () => {
    const { container } = render(<GradebookTable data={makeData()} />);
    expect(bodyRows(container)).toHaveLength(50);
    expect(screen.getByText('60 students')).toBeTruthy();

    fireEvent.click(screen.getByTitle('2'));
    const rows = bodyRows(container);
    expect(rows).toHaveLength(10);
    expect(rows[0].textContent).toContain('student50@x.edu');
  });

  it('search filters rows by student email', () => {
    const { container } = render(<GradebookTable data={makeData()} />);
    fireEvent.change(screen.getByPlaceholderText('Search students…'), {
      target: { value: 'student59' },
    });
    const rows = bodyRows(container);
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('student59@x.edu');
  });
});
