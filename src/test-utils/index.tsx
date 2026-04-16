// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

/**
 * Shared test utilities for the codePost UI test suite.
 *
 * Provides:
 * - Typed mock factories for common domain objects (User, Course, Assignment, etc.)
 * - Custom `renderWithProviders()` wrapper that includes MemoryRouter and common context
 * - Reusable helper functions
 *
 * Usage:
 *   import { createMockUser, createMockCourse, renderWithProviders } from '@test-utils';
 *
 *   const user = createMockUser({ email: 'custom@test.edu' });
 *   const course = createMockCourse({ name: 'CS201', archived: true });
 *   const { getByText } = renderWithProviders(<MyComponent user={user} />);
 */

import React, { type ReactElement } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ─── Mock Factories ──────────────────────────────────────────────────────────

/**
 * Creates a mock User object with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 */
export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    email: 'student@university.edu',
    id: 123,
    token: 'test-token',
    organization: 1,
    canCreateCourses: false,
    canModifyRosters: false,
    api_token: null,
    studentCourses: [],
    graderCourses: [],
    superGraderCourses: [],
    courseadminCourses: [],
    leaderSections: [],
    student_sections: [],
    showProductTips: true,
    codePostAdmin: false,
    hasCredentials: true,
    isOrgStaff: false,
    ...overrides,
  };
}

/**
 * Creates a mock Course object with sensible defaults.
 */
export function createMockCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'CS101',
    period: 'Fall 2023',
    assignments: [],
    sections: [],
    sendReleasedSubmissionsToBack: false,
    showStudentsStatistics: false,
    timezone: 'US/Eastern',
    emailNewUsers: false,
    anonymousGradingDefault: false,
    allowGradersToEditRubric: false,
    minComments: 0,
    noUnfinalize: false,
    lateDayCreditsAllowable: null,
    archived: false,
    activateQueue: true,
    inviteCode: '',
    emailWhitelist: '',
    inviteCodeEnabled: false,
    enableStudentFeedbackNotifications: false,
    expiration_date: null,
    studentsCanSeeGraders: false,
    studentCount: 0,
    isRubricEditor: false,
    ...overrides,
  };
}

/**
 * Creates a mock Assignment object with sensible defaults.
 */
export function createMockAssignment(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Loops',
    points: 20,
    isReleased: false,
    course: 1,
    sortKey: 0,
    rubricCategories: [],
    fileTemplates: [],
    sections: [],
    mean: null,
    median: null,
    ...overrides,
  };
}

/**
 * Creates a mock Submission object with sensible defaults.
 */
export function createMockSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    assignment: 1,
    students: ['student@university.edu'],
    grader: null,
    isFinalized: false,
    grade: null,
    files: [],
    dateEdited: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock Organization object with sensible defaults.
 */
export function createMockOrganization(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'University',
    shortname: 'university',
    ...overrides,
  };
}

// ─── Render Helpers ──────────────────────────────────────────────────────────

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial route entries for MemoryRouter (default: ['/']) */
  initialEntries?: string[];
}

/**
 * Renders a component wrapped in MemoryRouter and any other providers
 * needed for testing. Extends RTL's `render()` return value.
 *
 * Usage:
 *   const { getByText } = renderWithProviders(<MyComponent />, {
 *     initialEntries: ['/courses/1'],
 *   });
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ['/'], ...renderOptions }: RenderWithProvidersOptions = {},
): RenderResult {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// ─── Fetch Mock Helpers ──────────────────────────────────────────────────────

/**
 * Creates a mock fetch response with the given data and status.
 * Useful for overriding the global fetch mock on a per-test basis.
 *
 * Usage:
 *   vi.spyOn(global, 'fetch').mockResolvedValueOnce(
 *     createMockResponse({ id: 1, name: 'Test' })
 *   );
 */
export function createMockResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
    clone: function () {
      return this;
    },
  } as Response;
}

/**
 * Creates a mock fetch response that simulates an error.
 *
 * Usage:
 *   vi.spyOn(global, 'fetch').mockResolvedValueOnce(
 *     createMockErrorResponse(403, { detail: 'Forbidden' })
 *   );
 */
export function createMockErrorResponse(status: number, data: unknown = {}): Response {
  return createMockResponse(data, status);
}
