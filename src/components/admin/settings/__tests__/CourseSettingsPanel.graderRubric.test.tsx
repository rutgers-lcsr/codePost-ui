// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createApiClientsMock } from '@test-utils/mocks';
import { mockCourse } from '../../../../test-utils';
import { usePermissionsStore } from '../../../../stores/usePermissionsStore';
import CourseSettingsPanel from '../CourseSettingsPanel';

vi.mock('../../../../api-client/clients', () => createApiClientsMock());

const TOGGLE = 'Allow Graders to Edit Rubric';

const renderPanel = (allowGradersToEditRubric: boolean) => {
  const course = { ...mockCourse, allowGradersToEditRubric };
  const updateSettings = vi.fn(async (c: typeof course) => c);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <CourseSettingsPanel currentCourse={course as never} updateSettings={updateSettings as never} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return updateSettings;
};

describe('CourseSettingsPanel: Allow Graders to Edit Rubric', () => {
  beforeEach(() => {
    usePermissionsStore.getState().setCapabilities(`course:${mockCourse.id}`, { edit_course_settings: true });
  });

  it('shows the course setting with its current value', async () => {
    renderPanel(true);
    const toggle = await screen.findByRole('switch', { name: TOGGLE });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  }, 30000);

  it('saves the setting when an instructor turns it on', async () => {
    const updateSettings = renderPanel(false);
    const toggle = await screen.findByRole('switch', { name: TOGGLE });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    await waitFor(() => expect(updateSettings).toHaveBeenCalled());
    expect(updateSettings.mock.calls[0][0]).toMatchObject({ allowGradersToEditRubric: true });
  }, 30000);
});
