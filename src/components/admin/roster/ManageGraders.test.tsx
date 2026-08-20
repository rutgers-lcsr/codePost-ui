// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../stores/usePermissionsStore', () => ({
  useCourseCapabilities: () => ({ manage_roster: true }),
}));
vi.mock('./other/RosterUtils', () => ({ sendEmailToUser: vi.fn() }));
vi.mock('./other/RosterFileUpload', () => ({ default: () => null }));
vi.mock('./other/DownloadRoster', () => ({ default: () => null }));
vi.mock('../other/SendEmailModal', () => ({ default: () => null }));

import ManageGraders from './ManageGraders';

const renderGraders = (gradersCanGradeQuizzes: boolean | undefined) => {
  const props: any = {
    students: [],
    graders: ['ta1@x.edu', 'ta2@x.edu'],
    admins: [],
    superGraders: [],
    rubricEditors: [],
    quizGraders: ['ta1@x.edu'],
    sections: [],
    sectionsByStudent: {},
    notActivated: [],
    loadComplete: true,
    currentCourse: { id: 1, name: 'c', period: 's', gradersCanGradeQuizzes } as any,
    myEmail: 'admin@x.edu',
    updateRoster: vi.fn(),
    updateSection: vi.fn(),
    createSection: vi.fn(),
  };
  return render(
    <MemoryRouter initialEntries={['/course/1/roster/graders']}>
      <ManageGraders {...props} />
    </MemoryRouter>,
  );
};

describe('ManageGraders — Quiz Grader column gating', () => {
  it('hides the column and shows the settings hint while the course default is on', () => {
    renderGraders(true);
    expect(screen.queryByText('Quiz Grader')).not.toBeInTheDocument();
    expect(screen.getByText(/All graders in this course can grade quizzes/)).toBeInTheDocument();
  });

  it('treats a missing flag as on (default)', () => {
    renderGraders(undefined);
    expect(screen.queryByText('Quiz Grader')).not.toBeInTheDocument();
  });

  it('shows the role column (and no hint) when the course restricts quiz grading', () => {
    renderGraders(false);
    expect(screen.getByText('Quiz Grader')).toBeInTheDocument();
    expect(screen.queryByText(/All graders in this course can grade quizzes/)).not.toBeInTheDocument();
  });
});
