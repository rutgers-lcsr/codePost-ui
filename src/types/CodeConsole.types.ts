// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Type definitions for CodeConsole component
 * Extracted for reusability in Jupyter notebook integrations and other contexts
 */

import { Course, RubricCategory, RubricComment } from '../api-client';
import {
  AssignmentFileType,
  AssignmentType,
  AnonymousSubmissionType,
  CommentType,
  FileTypeAlias as FileType,
  StudentSubmissionType,
  SubmissionTestType,
  TestCaseType,
  TestCategoryType,
  UserType,
} from './models';
import type { StudentTestCaseType } from './models';
import {
  ICommentToRubricCommentMap,
  IFileToCommentsMap,
  IRubricCategoryToRubricCommentsMap,
  PERMISSION_LEVEL,
} from './common';

export { PERMISSION_LEVEL };

/**
 * Panel display types in CodeConsole
 */
export enum PANEL_TYPE {
  TESTS,
  FILE,
}

/**
 * Cursor navigation domains for keyboard shortcuts
 */
export enum CURSOR_DOMAIN {
  CODE,
  CODE_HIDDEN,
  COMMENTS,
  COMMENTS_HIDDEN,
  RUBRIC,
}

/**
 * Route parameters for CodeConsole component
 */
export type CodeConsoleRouteParams = {
  submissionId?: string;
};

/**
 * State interface for CodeConsole component
 * Contains all UI state, submission data, comments, rubric, and tests
 */
export interface ICodeConsoleState {
  /* ========================================
   * UI Control State
   * ======================================== */
  /** Current user's permission level for this submission */
  permissionLevel: PERMISSION_LEVEL;

  /** Whether the component is loading initial data */
  isLoading: boolean;

  /** Currently selected file for display */
  selectedFile: FileType | undefined;

  /** Zoom level for code display */
  codeZoom: number;

  /** Vertical scroll offset for code display */
  codeVerticalOffset: number;

  /** Whether viewing as student (even if grader) */
  isStudent: boolean;

  /** Whether keyboard shortcuts modal is visible */
  showKeyboardShortcuts: boolean;

  /** Whether custom comment explorer is visible */
  showCustomCommentExplorer: boolean;

  /* ========================================
   * Submission Data (for all permission levels)
   * ======================================== */
  /** Read-only submission data (for students and readers) */
  readOnlySubmission?: StudentSubmissionType;

  /** Assignment information */
  assignment?: AssignmentType;

  /** Course information */
  course?: Course;

  /** Files in the submission */
  files: FileType[];

  /** Comments organized by file */
  comments: IFileToCommentsMap;

  /** File templates for the assignment */
  assignmentFiles?: AssignmentFileType[];

  /** Test results for the submission */
  tests: SubmissionTestType[];

  /** Test categories for the assignment */
  testCategories: TestCategoryType[];

  /** Test cases organized by category (TestCasesByCategory | StudentTestCasesByCategory) */
  testCases: { [categoryID: number]: TestCaseType[] | StudentTestCaseType[] };

  /** Whether inline tests modal is visible */
  showInlineTestsModal: boolean;

  /* ========================================
   * Grader Data (WRITE permission and above)
   * ======================================== */
  /** Full submission data for graders */
  submission?: AnonymousSubmissionType;

  /** Rubric categories for the assignment */
  rubricCategories: RubricCategory[];

  /** Rubric comments organized by category */
  rubricComments: IRubricCategoryToRubricCommentsMap;

  /** Mapping of comments to their applied rubric items */
  commentRubricComments: ICommentToRubricCommentMap;

  /** ID of the currently active/focused comment */
  activeCommentID?: number;

  /** Mapping of current comment IDs to old IDs (for updates) */
  oldCommentIDs: { [currentID: number]: number };

  /* ========================================
   * Admin Data (ADMIN permission)
   * ======================================== */
  /** List of grader usernames */
  graders: string[];

  /** List of student usernames */
  students: string[];

  /* ========================================
   * Demo Mode Data
   * ======================================== */
  /** Counter for generating demo comment IDs */
  demoCommentCounter: number;

  /* ========================================
   * Editing State
   * ======================================== */
  /** Whether rubric editing mode is active */
  editRubricMode: boolean;

  /** Counter for generating new comment IDs */
  commentCounter: number;

  /** Counter to trigger comment refresh */
  commentRefreshCounter: number;

  /* ========================================
   * Panel Type
   * ======================================== */
  /** Current panel being displayed (files or tests) */
  panelType: PANEL_TYPE;

  /* ========================================
   * Reload Triggers
   * ======================================== */
  /** Timestamp to trigger rubric reload */
  rubricReload?: number;

  /* ========================================
   * Cursor Navigation
   * ======================================== */
  /** Whether cursor navigation mode is active */
  cursorMode: boolean;

  /** Current cursor domain (comments, files, rubric) */
  showCursor: CURSOR_DOMAIN;

  /** Whether to suppress saving (for demo mode) */
  noSave?: boolean;

  /* ========================================
   * Display Options
   * ======================================== */
  /** Whether to hide grade information */
  hideGrades: boolean;

  /* ========================================
   * Execution State
   * ======================================== */
  /**
   * Execution results cached per file ID
   *
   * This map stores execution results for each file, allowing users to switch between
   * files without losing execution state. Each file maintains its own independent result.
   *
   * Key: File ID
   * Value: Execution result containing success status, output data, and any errors
   */
  executionResults: {
    [fileId: number]: {
      success: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output_data?: any;
      error?: string;
    };
  };

  /* ========================================
   * AI Features
   * ======================================== */
  /** Whether AI comment generation is enabled for this course */
  aiEnabled: boolean;

  /* ========================================
   * Temporary Edit State
   * ======================================== */
  /** Whether word wrap is enabled in the code panel */
  wordWrap: boolean;

  /** Whether the user is temporarily editing a file */
  isEditMode: boolean;

  /**
   * Temporary content for files being edited
   * Key: File ID
   * Value: Content string
   */
  temporaryFileContent: { [fileId: number]: string };
}

/**
 * Props interface for CodeConsole component
 */
export interface ICodeConsoleProps {
  /** Currently logged-in user */
  user: UserType;

  /** Function to handle user logout */
  handleLogout: () => void;

  /** Whether the component is in demo mode */
  inDemoMode: boolean;
}

/**
 * API response types for CodeConsole data fetching
 */
export interface ISubmissionResponse {
  submission: AnonymousSubmissionType | StudentSubmissionType;
  assignment: AssignmentType;
  course: Course;
  files: FileType[];
  comments: IFileToCommentsMap;
  tests: SubmissionTestType[];
  testCategories: TestCategoryType[];
  rubricCategories?: RubricCategory[];
  rubricComments?: IRubricCategoryToRubricCommentsMap;
}

/**
 * Configuration for live feedback polling
 */
export interface ILiveFeedbackConfig {
  /** Interval for checking new files (ms) */
  filesReloadInterval: number;

  /** Interval for reloading comments (ms) */
  commentsReloadInterval: number;

  /** Whether live feedback is enabled */
  enabled: boolean;
}

/**
 * Keyboard shortcut configuration
 */
export interface IKeyboardShortcut {
  /** Key combination (e.g., 'ctrl+s', 'cmd+k') */
  key: string;

  /** Description of what the shortcut does */
  description: string;

  /** Callback function when shortcut is triggered */
  handler: (e: KeyboardEvent) => void;

  /** Whether the shortcut is currently enabled */
  enabled?: boolean;
}

/**
 * Comment CRUD operations
 */
export interface ICommentOperations {
  add: (comment: CommentType, file: FileType) => void;
  update: (commentID: number, newComment: CommentType, newRubricComment?: RubricComment) => void;
  save: (comment: CommentType) => Promise<void>;
  delete: (comment: CommentType) => Promise<void>;
  updateFeedback: (fileID: number, commentID: number, feedbackNum: number) => void;
}

/**
 * Rubric operations
 */
export interface IRubricOperations {
  applyRubricComment: (rubricComment: RubricComment) => void;
  removeRubricComment: (comment: CommentType, rubricComment: RubricComment) => void;
  toggleEditMode: () => void;
  updateRubric: (rubric: {
    rubricCategories: RubricCategory[];
    rubricComments: IRubricCategoryToRubricCommentsMap;
  }) => void;
}

/**
 * File operations
 */
export interface IFileOperations {
  changeSelectedFile: (fileID: number) => void;
  checkForNewFiles: () => Promise<void>;
  setNewFilesWarning: () => void;
}

/**
 * Grade operations
 */
export interface IGradeOperations {
  calculateGrade: () => number | undefined;
  updateSubmissionGrade: () => void;
  toggleFinalized: () => Promise<void>;
}

/**
 * UI operations
 */
export interface IUIOperations {
  setZoom: (newZoom: number) => void;
  setVerticalOffset: (oldToNew: (oldValue: number) => number) => void;
  toggleKeyboardShortcuts: () => void;

  toggleCustomCommentExplorer: () => void;
  showInlineTestsModal: () => void;
  hideInlineTestsModal: () => void;
}

/**
 * Cursor navigation operations
 */
export interface ICursorOperations {
  toggleCursorMode: (cursorMode: boolean) => void;
  updateCursorDomain: (domain: CURSOR_DOMAIN) => void;
  handleCursor: (e: KeyboardEvent) => Promise<void>;
  changeActiveComment: (id: number | undefined) => void;
  focusActiveComment: () => void;
  blurActiveComment: () => void;
}
