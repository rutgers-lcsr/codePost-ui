// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
const { act } = React;

// Component Imports
import Settings from './components/core/settings';
import OrgDashboard from './components/organization/OrgDashboard';
import CourseSettingsPanel from './components/admin/settings/CourseSettingsPanel';
import RosterManager from './components/admin/roster/RosterManager';
import ManageAssignments from './components/admin/assignments/ManageAssignments';
import Dashboard from './components/codepost-admin/Dashboard';

// Mock data
const mockOrganization = {
  id: 1,
  name: 'Test University',
  sso_enabled: false,
};

const mockCourse: any = {
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
  inviteCodeEnabled: false,
  emailWhitelist: '',
  enableStudentFeedbackNotifications: false,
  expiration_date: null,
  studentsCanSeeGraders: false,
  studentCount: 0,
  isRubricEditor: false,
  webhooks: [],
};

const mockAssignment: any = {
  id: 1,
  course: 1,
  name: 'Homework 1',
  points: 100,
  isReleased: false,
  feedbackReleased: false,
  hideGrades: false,
  commentFeedback: false,
  allowStudentUpload: true,
  allowStudentUploadWithPartners: false,
  uploadDueDate: null,
  isVisible: true,
  lateDeductions: [],
  rubricCategories: [],
  sortKey: 1,
  maxLateDays: null,
  liveFeedbackMode: false,
  description: '',
  files: [],
  isFinalized: false,
  maxStudentTestRuns: null,
  nudgeMode: false,
  dataSets: [],
  testCategories: [],
  environment: null,
};

const mockUser: any = {
  email: 'test@university.edu',
  id: 123,
  token: 'abc',
  organization: 1,
  canCreateCourses: true,
  canModifyRosters: true,
  api_token: 'api-token-123',
  studentCourses: [],
  graderCourses: [],
  superGraderCourses: [],
  courseadminCourses: [mockCourse],
  leaderSections: [],
  student_sections: [],
  showProductTips: true,
  codePostAdmin: false,
  hasCredentials: true,
  isOrgStaff: true,
  password: '',
  studentSections: [],
};

// Mocks
vi.mock('./api-client/clients', () => ({
  organizationsApi: {
    retrieve: vi.fn(() => Promise.resolve(mockOrganization)),
    list: vi.fn(() => Promise.resolve([mockOrganization])),
    usersRetrieve: vi.fn(() => Promise.resolve([])),
  },
  coursesApi: {
    list: vi.fn(() => Promise.resolve([mockCourse])),
    retrieve: vi.fn(() => Promise.resolve(mockCourse)),
    aiSettingsRetrieve: vi.fn(() => Promise.resolve({ id: 1, aiEnabled: false })),
    aiSettingsPartialUpdate: vi.fn(() => Promise.resolve({ id: 1, aiEnabled: false })),
    rosterRetrieve: vi.fn(() =>
      Promise.resolve({
        id: 1,
        organization: 1,
        name: mockCourse.name,
        period: mockCourse.period,
        courseAdmins: [],
        students: [],
        graders: [],
      }),
    ),
    rosterPartialUpdate: vi.fn(() => Promise.resolve({})),
  },
  usersApi: {
    requestAPITokenCreate: vi.fn(() => Promise.resolve({ ...mockUser, apiToken: 'token' })),
    mePartialUpdate: vi.fn(() => Promise.resolve(mockUser)),
    list: vi.fn(() => Promise.resolve([])),
  },
  registrationApi: {
    emailPasswordResetCreate: vi.fn(() => Promise.resolve({ success: true })),
  },
  systemApi: {
    healthRetrieve: vi.fn(() => Promise.resolve({ database: 'Connected', celery: 'Running' })),
  },
}));

vi.mock('./services/user', () => ({
  UserIO: {
    getDashboardStats: vi.fn(() =>
      Promise.resolve({
        totalOrganizations: 0,
        totalCourses: 0,
        activeCourses: 0,
        archivedCourses: 0,
        totalCourseAdmins: 0,
        totalCodePostAdmins: 0,
        totalGraders: 0,
        totalStudents: 0,
        totalUniqueUsers: 0,
        totalSections: 0,
        totalAssignments: 0,
        avgCoursesPerOrg: 0,
        avgStudentsPerCourse: 0,
        totalInactiveUsers: 0,
      }),
    ),
    list: vi.fn(() => Promise.resolve([])),
  },
}));

// Mock window.matchMedia (if not already in setupTests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Props
const mockSettingsProps = {
  user: mockUser,
  handleLogout: vi.fn(),
  replaceUser: vi.fn(),
};

const mockOrgProps = {
  user: mockUser,
  handleLogout: vi.fn(),
  baseURL: '/organization',
};

const mockCourseSettingsProps = {
  currentCourse: mockCourse,
  updateSettings: vi.fn(),
};

const mockRosterProps: any = {
  notActivated: [],
  sections: [],
  students: ['student1@university.edu'],
  graders: ['grader1@university.edu'],
  admins: [],
  superGraders: [],
  rubricEditors: [],
  loadComplete: true,
  sectionsLoadComplete: true,
  currentCourse: mockCourse,
  updateRoster: vi.fn(),
  sectionsByStudent: {},
  updateSection: vi.fn(),
  createSection: vi.fn(),
  updateStudentSection: vi.fn(),
  myEmail: 'test@university.edu',
  deleteSection: vi.fn(),
};

const mockAssignmentsProps: any = {
  loadComplete: true,
  partialSubmissionsLoadComplete: true,
  fullSubmissionsLoadComplete: true,
  submissionsByUserLoadComplete: true,
  submissions: { 1: [] },
  currentCourse: mockCourse,
  assignments: [mockAssignment],
  updateAssignment: vi.fn(),
  createAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  submissionsByStudent: {},
  students: ['student1@university.edu'],
  uploadSubmission: vi.fn(),
  deleteSubmission: vi.fn(),
  updateSubmission: vi.fn(),
  viewsBySubmission: {},
  refreshCourseData: vi.fn(),
  myEmail: 'test@university.edu',
  user: mockUser,
  shallowUpdateAssignment: vi.fn(),
  bulkUpdateSubmissions: vi.fn(),
  sections: [],
  courses: [mockCourse],
  baseURL: '/admin/assignments',
};

const mockDashboardProps = {
  // Dashboard doesn't take props, it fetches everything
};

// Axe config
const axeConfig = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  },
};

const renderWithRouter = async (ui: React.ReactElement, routerProps?: React.ComponentProps<typeof MemoryRouter>) => {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(<MemoryRouter {...routerProps}>{ui}</MemoryRouter>);
  });
  await act(async () => {
    await Promise.resolve();
  });
  return result!;
};

const runAxe = async (container: HTMLElement) => {
  await act(async () => {
    await Promise.resolve();
  });
  return axe(container, axeConfig);
};

describe.sequential('Expanded Accessibility Audit', () => {
  it('should have no violations on User Settings page', async () => {
    const { container } = await renderWithRouter(<Settings {...mockSettingsProps} />);
    const results = await runAxe(container);
    if (results.violations.length > 0) {
      console.log('Axe violations on User Settings:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no violations on Organization Dashboard', async () => {
    const { container } = await renderWithRouter(<OrgDashboard {...mockOrgProps} />, {
      initialEntries: ['/organization'],
    });

    await waitFor(() => expect(container.textContent).toContain('Organization Console'));

    const results = await runAxe(container);
    if (results.violations.length > 0) {
      console.log('Axe violations on Organization Dashboard:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no violations on Course Settings Panel', async () => {
    const { container } = await renderWithRouter(<CourseSettingsPanel {...mockCourseSettingsProps} />);

    const results = await runAxe(container);
    if (results.violations.length > 0) {
      console.log('Axe violations on Course Settings Panel:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it.skip('should have no violations on Roster Manager', async () => {
    const { container } = await renderWithRouter(<RosterManager {...mockRosterProps} />);

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it.skip('should have no violations on Manage Assignments', async () => {
    const { container } = await renderWithRouter(<ManageAssignments {...mockAssignmentsProps} />);

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no violations on Super Admin Dashboard', async () => {
    const { container } = await renderWithRouter(<Dashboard />);

    await waitFor(() => expect(container.textContent).toContain('SuperAdmin Console'), { timeout: 10000 });

    const results = await runAxe(container);
    if (results.violations.length > 0) {
      console.log('Axe violations on Super Admin Dashboard:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toHaveLength(0);
  }, 30000);
});
