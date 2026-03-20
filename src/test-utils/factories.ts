// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Centralized mock data factories for tests.
 *
 * Each factory returns a minimal valid object with sensible defaults.
 * Pass overrides to customize specific fields for your test case.
 */
import type {
  AssignmentType,
  CommentType,
  CourseType,
  SubmissionTestType,
  SubmissionType,
  TestCaseType,
  UserType,
} from '../types/models';
import type { RubricCategory, RubricComment } from '../api-client';
import type { FileWithId } from '../utils/file';

// ---------------------------------------------------------------------------
// Domain object factories
// ---------------------------------------------------------------------------

export function makeComment(overrides: Partial<CommentType> = {}): CommentType {
  return {
    id: 1,
    file: 10,
    text: 'test comment',
    startLine: 1,
    endLine: 1,
    startChar: 0,
    endChar: 0,
    pointDelta: 0,
    rubricComment: null,
    ...overrides,
  } as CommentType;
}

export function makeFile(overrides: Partial<FileWithId> = {}): FileWithId {
  return {
    id: 10,
    name: 'main.py',
    extension: 'py',
    path: '',
    data: 'print("hello")',
    comments: [],
    created: '2025-01-01T00:00:00Z',
    ...overrides,
  } as FileWithId;
}

export function makeRubricComment(overrides: Partial<RubricComment> = {}): RubricComment {
  return {
    id: 100,
    category: 1,
    text: 'rubric text',
    pointDelta: -5,
    ...overrides,
  } as RubricComment;
}

export function makeRubricCategory(overrides: Partial<RubricCategory> = {}): RubricCategory {
  return {
    id: 1,
    assignment: 1,
    name: 'Style',
    pointLimit: null,
    rubricComments: [],
    ...overrides,
  } as RubricCategory;
}

export function makeTestCase(overrides: Partial<TestCaseType> = {}): TestCaseType {
  return {
    id: 1,
    testCategory: 1,
    description: 'test',
    pointsPass: 10,
    pointsFail: 0,
    ...overrides,
  } as TestCaseType;
}

export function makeSubmissionTest(overrides: Partial<SubmissionTestType> = {}): SubmissionTestType {
  return {
    id: 1,
    submission: 1,
    testCase: 1,
    passed: true,
    logs: '',
    testCategory: 1,
    created: '2025-01-01T00:00:00Z',
    modified: '2025-01-01T00:00:00Z',
    ...overrides,
  } as SubmissionTestType;
}

export function makeAssignment(overrides: Partial<AssignmentType> = {}): AssignmentType {
  return {
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
    ...overrides,
  } as AssignmentType;
}

export function makeSubmission(overrides: Partial<SubmissionType> = {}): SubmissionType {
  return {
    id: 1,
    assignment: 1,
    students: ['test@university.edu'],
    grader: null,
    isFinalized: false,
    dateUploaded: '2025-01-01T00:00:00Z',
    dateEdited: '2025-01-01T00:00:00Z',
    files: [],
    ...overrides,
  } as SubmissionType;
}

// ---------------------------------------------------------------------------
// Common mock data — matches shapes used in setupTests.ts fetch mock
// ---------------------------------------------------------------------------

export const mockOrganization = {
  id: 1,
  name: 'Test University',
  sso_enabled: false,
} as const;

export const mockCourse: CourseType = {
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
  expirationDate: null,
  studentsCanSeeGraders: false,
  studentCount: 0,
  isRubricEditor: false,
  webhooks: [],
};

export const mockUser: UserType = {
  email: 'test@university.edu',
  token: 'abc',
  id: 123,
  organization: 1,
  password: '',
  canCreateCourses: true,
  canModifyRosters: true,
  apiToken: null,
  studentCourses: [],
  graderCourses: [],
  superGraderCourses: [],
  courseadminCourses: [mockCourse],
  leaderSections: [],
  studentSections: [],
  showProductTips: true,
  codePostAdmin: false,
  hasCredentials: true,
  isOrgStaff: true,
};
