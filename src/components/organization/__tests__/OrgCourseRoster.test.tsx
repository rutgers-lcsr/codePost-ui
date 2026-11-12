// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Course, CourseRoster } from '../../../api-client';
import { ResponseError } from '../../../api-client';
import OrgCourseRoster from '../OrgCourseRoster';
import OrgCourses from '../OrgCourses';

const rosterRetrieve = vi.fn();
vi.mock('../../../api-client/clients', () => ({
  coursesApi: { rosterRetrieve: (...args: unknown[]) => rosterRetrieve(...args) },
}));

const course = { id: 42, name: 'CS 111', period: 'Fall 2026', studentCount: 2, archived: false } as Course;

const roster = {
  id: 42,
  students: ['zed@dev.edu', 'amy@dev.edu'],
  graders: ['gina@dev.edu', 'sam@dev.edu'],
  superGraders: ['sam@dev.edu'],
  rubricEditors: ['gina@dev.edu'],
  quizGraders: [],
  courseAdmins: ['prof@dev.edu'],
  inactiveStudents: [],
  inactiveGraders: [],
  inactiveCourseAdmins: [],
  notActivated: ['zed@dev.edu'],
} as unknown as CourseRoster;

function openTab(name: RegExp) {
  fireEvent.click(screen.getByRole('tab', { name }));
}

describe('OrgCourseRoster', () => {
  beforeEach(() => {
    rosterRetrieve.mockReset();
  });

  it('shows who is enrolled in the course, by role', async () => {
    rosterRetrieve.mockResolvedValue(roster);
    render(<OrgCourseRoster course={course} onClose={() => {}} />);

    expect(await screen.findByText('amy@dev.edu')).toBeInTheDocument();
    expect(rosterRetrieve).toHaveBeenCalledWith({ id: 42 });
    expect(screen.getByText(/CS 111/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /students \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /graders \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /course admins \(1\)/i })).toBeInTheDocument();
    const zedRow = screen.getByText('zed@dev.edu').closest('tr') as HTMLElement;
    expect(within(zedRow).getByText('Not activated')).toBeInTheDocument();

    openTab(/graders \(2\)/i);
    const samRow = (await screen.findByText('sam@dev.edu')).closest('tr') as HTMLElement;
    expect(within(samRow).getByText('Super grader')).toBeInTheDocument();
    const ginaRow = screen.getByText('gina@dev.edu').closest('tr') as HTMLElement;
    expect(within(ginaRow).getByText('Rubric editor')).toBeInTheDocument();

    openTab(/course admins \(1\)/i);
    expect(await screen.findByText('prof@dev.edu')).toBeInTheDocument();
  });

  it('filters the list by email', async () => {
    rosterRetrieve.mockResolvedValue(roster);
    render(<OrgCourseRoster course={course} onClose={() => {}} />);
    await screen.findByText('amy@dev.edu');

    fireEvent.change(screen.getByRole('textbox', { name: /search the roster/i }), { target: { value: 'zed' } });
    expect(screen.getByText('zed@dev.edu')).toBeInTheDocument();
    expect(screen.queryByText('amy@dev.edu')).not.toBeInTheDocument();
  });

  it("explains why when the roster can't be loaded", async () => {
    rosterRetrieve.mockRejectedValue(
      new ResponseError(
        new Response(JSON.stringify({ detail: 'You do not have permission to perform this action.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    render(<OrgCourseRoster course={course} onClose={() => {}} />);
    expect(await screen.findByText('You do not have permission to perform this action.')).toBeInTheDocument();
  });

  it('opens from the Roster button on the organization courses list', async () => {
    rosterRetrieve.mockResolvedValue(roster);
    render(<OrgCourses courses={[course]} loading={false} onRefresh={() => {}} />);
    // A text query: a role query over the antd table is slow in jsdom, and on a loaded CI runner
    // it used up the default 5 s on its own.
    fireEvent.click(screen.getByText('Roster').closest('button') as HTMLElement);
    expect(await screen.findByText('amy@dev.edu', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(rosterRetrieve).toHaveBeenCalledWith({ id: 42 });
  }, 30000);
});
