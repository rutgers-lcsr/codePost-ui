// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AssignmentsTable, { IManageAssignmentsProps } from '../AssignmentsTable';
import { AssignmentStateEnum, Course, User } from '../../../../api-client';
import { Assignment } from '../../../../types/common';
import { makeAssignment, mockCourse, mockUser } from '@test-utils';

vi.mock('../../../../stores/usePermissionsStore', () => ({
  useCourseCapabilities: () => ({
    create_assignment: true,
    edit_assignment: true,
    edit_rubric: true,
    view_analytics: true,
    release_grades: true,
  }),
}));

const preview = makeAssignment({ id: 11, name: 'Lab Preview', sortKey: 0 }) as unknown as Assignment;
preview.state = AssignmentStateEnum.Preview;
const published = makeAssignment({ id: 12, name: 'Lab Published', sortKey: 1 }) as unknown as Assignment;
published.state = AssignmentStateEnum.Published;

const renderTable = () => {
  const updateAssignment = vi.fn().mockResolvedValue(undefined);
  const props = {
    assignments: [preview, published],
    submissions: {},
    students: [],
    submissionsByStudent: {},
    currentCourse: { ...mockCourse, timezone: 'America/New_York' } as unknown as Course,
    viewsBySubmission: {},
    sections: [],
    courses: [],
    loadComplete: true,
    partialSubmissionsLoadComplete: true,
    fullSubmissionsLoadComplete: true,
    createAssignment: vi.fn(),
    updateAssignment,
    deleteAssignment: vi.fn(),
    uploadSubmission: vi.fn(),
    deleteSubmission: vi.fn(),
    updateSubmission: vi.fn(),
    bulkUpdateSubmissions: vi.fn(),
    refreshCourseData: vi.fn(),
    myEmail: mockUser.email,
    user: mockUser as unknown as User,
    baseURL: '/course/admin',
  } as unknown as IManageAssignmentsProps;
  render(
    <MemoryRouter>
      <AssignmentsTable {...props} />
    </MemoryRouter>,
  );
  return { updateAssignment };
};

const originalWidth = window.innerWidth;
afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
});

describe.each([
  ['wide window', 1600, (name: string) => `Configure ${name}`],
  ['compact window', 1024, (name: string) => `Actions for ${name}`],
])('AssignmentsTable next action (%s)', (_label, width, actionsButtonName) => {
  it('puts Publish under the stage chip, not among the row actions', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    renderTable();

    // Label queries: role queries over the whole antd table take tens of seconds in jsdom.
    const publish = await screen.findByLabelText('Publish for Lab Preview', {}, { timeout: 10000 });
    const stageCell = screen.getByLabelText(/^Stage: Preview/).closest('td') as HTMLElement;
    expect(stageCell).toContainElement(publish);

    const actionsCell = screen.getByLabelText(actionsButtonName('Lab Preview')).closest('td') as HTMLElement;
    expect(within(actionsCell).queryByText('Publish')).toBeNull();

    // Already published: nothing to move it to.
    expect(screen.queryByLabelText('Publish for Lab Published')).toBeNull();
  }, 30000);

  it('publishes after the confirmation', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    const { updateAssignment } = renderTable();

    await userEvent.click(await screen.findByLabelText('Publish for Lab Preview', {}, { timeout: 10000 }));
    // antd renders the title twice (a hidden one names the dialog), and a confirm opened by an earlier
    // test outlives it in jsdom, so take the newest visible title. An old dialog would call the earlier
    // test's updateAssignment, so this cannot pass by accident.
    const titles = await screen.findAllByText('Publish this assignment?', { selector: '.ant-modal-confirm-title' });
    expect(updateAssignment).not.toHaveBeenCalled();

    const dialog = titles[titles.length - 1].closest('.ant-modal-confirm') as HTMLElement;
    await userEvent.click(within(dialog).getByText('Publish', { selector: 'button span' }));
    expect(updateAssignment).toHaveBeenCalledWith({ id: preview.id, state: AssignmentStateEnum.Published });
  }, 30000);
});
