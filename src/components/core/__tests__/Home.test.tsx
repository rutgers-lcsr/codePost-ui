// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { mockUser } from '@test-utils';
import Home from '../Home';

const platformCaps: Record<string, boolean> = {};
vi.mock('../../../stores/usePermissionsStore', () => ({
  usePlatformCapabilities: () => platformCaps,
}));
vi.mock('../layouts/PeripheralPageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const NOT_ENROLLED = /you're not enrolled in any course yet/i;

function renderHome(roles: { isStudent?: boolean; isGrader?: boolean; isAdmin?: boolean } = {}) {
  return render(
    <MemoryRouter>
      <Home
        isStudent={roles.isStudent ?? false}
        isGrader={roles.isGrader ?? false}
        isAdmin={roles.isAdmin ?? false}
        user={mockUser}
        handleLogout={() => {}}
      />
    </MemoryRouter>,
  );
}

describe('Home', () => {
  it('tells a user with no course and no other role that they are not enrolled yet', () => {
    renderHome();
    expect(screen.getByText(NOT_ENROLLED)).toBeInTheDocument();
    expect(screen.getByText(/use your course's invite link or ask your instructor/i)).toBeInTheDocument();
    expect(screen.queryByText('Select a role to continue')).not.toBeInTheDocument();
    expect(screen.queryByText('Your Roles')).not.toBeInTheDocument();
  });

  it('shows the role cards, not the notice, once the user has a course role', () => {
    renderHome({ isStudent: true });
    expect(screen.getByRole('link', { name: 'Open Student' })).toBeInTheDocument();
    expect(screen.getByText('Select a role to continue')).toBeInTheDocument();
    expect(screen.queryByText(NOT_ENROLLED)).not.toBeInTheDocument();
  });

  it('keeps the organization card for org staff without courses', () => {
    platformCaps.manage_organization = true;
    try {
      renderHome();
      expect(screen.getByRole('link', { name: 'Open Organization' })).toBeInTheDocument();
      expect(screen.queryByText(NOT_ENROLLED)).not.toBeInTheDocument();
    } finally {
      delete platformCaps.manage_organization;
    }
  });
});
