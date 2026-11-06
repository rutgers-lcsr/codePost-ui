// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import '@testing-library/jest-dom/vitest';

import GraderNav from '../GraderNav';
import { usePermissionsStore, type Capabilities } from '../../../stores/usePermissionsStore';

function renderNav(caps: Capabilities) {
  usePermissionsStore.getState().setCapabilities('course:5', caps);
  return render(
    <MemoryRouter>
      <GraderNav
        collapsed={false}
        isSectionLeader={false}
        regradesAllowed={false}
        activateQueue={false}
        baseURL="/grader/c/p"
        courseId={5}
      />
    </MemoryRouter>,
  );
}

describe('GraderNav rubric entry', () => {
  beforeEach(() => usePermissionsStore.getState().reset());
  afterEach(cleanup);

  it('is shown for edit_rubric', () => {
    renderNav({ edit_rubric: true });
    expect(screen.getByText('Rubrics')).toBeInTheDocument();
  });

  it('is shown for edit_unapplied_rubric_comments alone', () => {
    renderNav({ edit_rubric: false, edit_unapplied_rubric_comments: true });
    expect(screen.getByText('Rubrics')).toBeInTheDocument();
  });

  it('is hidden for a grader with neither', () => {
    renderNav({ edit_rubric: false, edit_unapplied_rubric_comments: false });
    expect(screen.queryByText('Rubrics')).toBeNull();
  });
});
