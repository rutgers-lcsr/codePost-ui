// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Representative components covering auth, marketing, and app pages.
// Color tokens come from the shared theme, so a subset gives good coverage.
import IndexManager from './components/pre-auth/IndexManager';
import CreateSignup from './components/pre-auth/CreateSignup';
import ForgotPasswordForm from './components/pre-auth/ForgotPasswordForm';
import Landing from './components/landing/LandingABTest';
import AboutUs from './components/pre-auth/AboutUs';
import Student from './components/student/Student';

import { mockCourse, mockUser as mockUserBase } from './test-utils';

const mockUser = {
  ...mockUserBase,
  canCreateCourses: false,
  canModifyRosters: false,
  courseadminCourses: [],
  isOrgStaff: false,
};

const mockStudentProps = {
  initialCourses: [mockCourse],
  currentCourse: mockCourse,
  user: mockUser,
  handleLogout: vi.fn(),
  windowwidth: 1200,
  baseURL: '/student',
  addAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  addCourse: vi.fn(),
  superGraderCourses: [] as never[],
  sectionsLed: [] as never[],
};

// Run ONLY the color-contrast rule with styles intact.
// Separated from structural accessibility tests because jsdom's CSS parsing
// adds ~10s overhead per worker when getComputedStyle is invoked.
const contrastConfig = {
  runOnly: {
    type: 'rule' as const,
    values: ['color-contrast'],
  },
  resultTypes: ['violations'] as const,
  elementRef: false,
};

describe.sequential('Color Contrast Accessibility', () => {
  // Warm up jsdom's CSS parser so the one-time cost is excluded from test timings.
  beforeAll(() => {
    const el = document.createElement('div');
    el.textContent = 'warmup';
    document.body.appendChild(el);
    window.getComputedStyle(el);
    el.remove();
  });

  it('should have no contrast violations on Login page', async () => {
    const { container } = render(
      <MemoryRouter>
        <IndexManager handleLogin={vi.fn()} error="" isLoggedIn={false} handleLogout={vi.fn()} />
      </MemoryRouter>,
    );
    const results = await axe(container, contrastConfig);
    if (results.violations.length > 0) {
      console.log('Contrast violations on Login:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no contrast violations on CreateSignup page', async () => {
    const { container } = render(
      <MemoryRouter>
        <CreateSignup isLoggedIn={false} />
      </MemoryRouter>,
    );
    const results = await axe(container, contrastConfig);
    if (results.violations.length > 0) {
      console.log('Contrast violations on CreateSignup:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no contrast violations on ForgotPassword page', async () => {
    const { container } = render(
      <MemoryRouter>
        <ForgotPasswordForm isLoggedIn={false} />
      </MemoryRouter>,
    );
    const results = await axe(container, contrastConfig);
    if (results.violations.length > 0) {
      console.log('Contrast violations on ForgotPassword:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no contrast violations on Landing page', async () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    const results = await axe(container, contrastConfig);
    if (results.violations.length > 0) {
      console.log('Contrast violations on Landing:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toHaveLength(0);
  }, 60000);

  it('should have no contrast violations on AboutUs page', async () => {
    const { container } = render(
      <MemoryRouter>
        <AboutUs isLoggedIn={false} />
      </MemoryRouter>,
    );
    const results = await axe(container, contrastConfig);
    if (results.violations.length > 0) {
      console.log('Contrast violations on AboutUs:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no contrast violations on Student Console', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Student {...mockStudentProps} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const results = await axe(container, contrastConfig);
    if (results.violations.length > 0) {
      console.log('Contrast violations on Student:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toHaveLength(0);
  }, 30000);
});
