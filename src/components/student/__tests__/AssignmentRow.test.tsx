// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import AssignmentRow from '../AssignmentRow';
import { SubmissionStatus } from '../submissionStatus';

const baseProps = {
  assignmentName: 'HW1',
  status: SubmissionStatus.NO_SUBMISSION,
};

describe('AssignmentRow description', () => {
  it('expands via click to show the rendered Markdown description', () => {
    render(<AssignmentRow {...baseProps} explanation={'Read **chapter 3** first.'} />);

    const row = screen.getByRole('button', { expanded: false });
    fireEvent.click(row);

    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('assignment-description')).toBeInTheDocument();
    expect(screen.getByText('chapter 3')).toBeInTheDocument(); // bold rendered as element text
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('expands via keyboard (Enter and Space) with aria-expanded toggling', () => {
    render(<AssignmentRow {...baseProps} explanation={'Keyboard test'} />);

    const row = screen.getByRole('button', { expanded: false });
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(row).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(row, { key: ' ' });
    expect(row).toHaveAttribute('aria-expanded', 'false');
  });

  it('stats-only rows still expand and show class stats', () => {
    render(<AssignmentRow {...baseProps} showStats meanGrade={80} medianGrade={85} maxPoints={100} />);

    const row = screen.getByRole('button', { expanded: false });
    fireEvent.click(row);
    expect(screen.getByText('Class Stats')).toBeInTheDocument();
    expect(screen.queryByTestId('assignment-description')).not.toBeInTheDocument();
  });

  it('shows description and stats together, description first', () => {
    render(
      <AssignmentRow
        {...baseProps}
        explanation={'Both blocks'}
        showStats
        meanGrade={80}
        medianGrade={85}
        maxPoints={100}
      />,
    );
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const description = screen.getByTestId('assignment-description');
    const stats = screen.getByText('Class Stats');
    expect(description).toBeInTheDocument();
    // description precedes stats in the DOM
    expect(description.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('rows with neither stats nor description stay inert (no button role, no expansion)', () => {
    render(<AssignmentRow {...baseProps} />);
    expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
  });

  it('whitespace-only explanation does not create an expandable row', () => {
    render(<AssignmentRow {...baseProps} explanation={'   '} />);
    expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
  });
});
