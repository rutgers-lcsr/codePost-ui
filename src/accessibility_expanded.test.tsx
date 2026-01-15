import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Component Imports
import Settings from './components/core/settings';
import OrgDashboard from './components/organization/OrgDashboard';
import CourseSettingsPanel from './components/admin/settings/CourseSettingsPanel';
import RosterManager from './components/admin/roster/RosterManager';
import ManageAssignments from './components/admin/assignments/ManageAssignments';
import Dashboard from './components/codepost-admin/Dashboard';

// Mock Infrastructure
const mockOrganization = {
  id: 1,
  name: 'Test University',
  sso_enabled: false,
};

const mockCourse = {
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
};

const mockAssignment = {
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
};

// Mocks
vi.mock('./infrastructure/organization', () => ({
  Organization: {
    read: vi.fn(() => Promise.resolve(mockOrganization)),
    getUsers: vi.fn(() => Promise.resolve([])),
    list: vi.fn(() => Promise.resolve([mockOrganization])),
  },
}));

vi.mock('./infrastructure/course', () => ({
  Course: {
    list: vi.fn(() => Promise.resolve([mockCourse])),
    read: vi.fn(() => Promise.resolve(mockCourse)),
    update: vi.fn(),
    readRoster: vi.fn(() => Promise.resolve({ courseAdmins: [], students: [], graders: [] })),
  },
}));

vi.mock('./infrastructure/user', () => ({
  UserIO: {
    getDashboardStats: vi.fn(() => Promise.resolve({})),
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

// Mock User
const mockUser = {
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

const mockRosterProps = {
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

const mockAssignmentsProps = {
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
    values: ['wcag21aa', 'best-practice'],
  },
};

describe('Expanded Accessibility Audit', () => {
  it('should have no violations on User Settings page', async () => {
    const { container } = render(
      <MemoryRouter>
        <Settings {...mockSettingsProps} />
      </MemoryRouter>,
    );
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('should have no violations on Organization Dashboard', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/organization']}>
        <OrgDashboard {...mockOrgProps} />
      </MemoryRouter>,
    );

    await waitFor(() => expect(container.textContent).toContain('Organization Console'));

    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('should have no violations on Course Settings Panel', async () => {
    const { container } = render(
      <MemoryRouter>
        <CourseSettingsPanel {...mockCourseSettingsProps} />
      </MemoryRouter>,
    );

    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  }, 30000);

  it.skip('should have no violations on Roster Manager', async () => {
    const { container } = render(
      <MemoryRouter>
        <RosterManager {...mockRosterProps} />
      </MemoryRouter>,
    );

    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  }, 30000);

  it.skip('should have no violations on Manage Assignments', async () => {
    const { container } = render(
      <MemoryRouter>
        <ManageAssignments {...mockAssignmentsProps} />
      </MemoryRouter>,
    );

    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('should have no violations on Super Admin Dashboard', async () => {
    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => expect(container.textContent).toContain('SuperAdmin Console'), { timeout: 10000 });

    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  }, 30000);
});
