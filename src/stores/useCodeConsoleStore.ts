// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { CommentType } from '../utils/comments';
import { Course, RubricCategory, RubricComment } from '../api-client';
import {
  AnonymousSubmissionType,
  AssignmentType,
  AssignmentFileType,
  FileTypeAlias as FileType,
  StudentSubmissionType,
  SubmissionTestType,
  TestCaseType,
  TestCategoryType,
} from '../types/models';
import type { StudentTestCaseType } from '../types/models';
import { ICommentToRubricCommentMap, IFileToCommentsMap, IRubricCategoryToRubricCommentsMap } from '../types/common';
import { CURSOR_DOMAIN, ICodeConsoleState, PANEL_TYPE, PERMISSION_LEVEL } from '../types/CodeConsole.types';

// Extend ICodeConsoleState to include activeSiderKey since it was missing in the types file
declare module '../types/CodeConsole.types' {
  interface ICodeConsoleState {
    activeSiderKey: string | null;
    showHelpModal: boolean;
  }
}
import { LOCAL_SETTINGS } from '../components/utils/LocalSettings';

/**
 * Zustand store for CodeConsole state management.
 * Replaces the useState pattern in the 2400-line CodeConsole component.
 */

interface CodeConsoleStoreActions {
  // State setters
  setState: (partial: Partial<ICodeConsoleState>) => void;
  reset: () => void;

  // Permission
  setPermissionLevel: (level: PERMISSION_LEVEL) => void;

  // Loading
  setLoading: (loading: boolean) => void;

  // Submission data
  setSubmission: (submission: AnonymousSubmissionType | undefined) => void;
  setReadOnlySubmission: (submission: StudentSubmissionType | undefined) => void;
  setAssignment: (assignment: AssignmentType | undefined) => void;
  setCourse: (course: Course | undefined) => void;

  // Files
  setFiles: (files: FileType[]) => void;
  setSelectedFile: (file: FileType | undefined) => void;
  setAssignmentFiles: (files: AssignmentFileType[] | undefined) => void;

  // Comments
  setComments: (comments: IFileToCommentsMap) => void;
  addComment: (fileId: number, comment: CommentType) => void;
  updateComment: (commentId: number, newComment: CommentType) => void;
  removeComment: (fileId: number, commentId: number) => void;
  setActiveCommentID: (id: number | undefined) => void;

  // Comment-RubricComment mapping
  setCommentRubricComments: (mapping: ICommentToRubricCommentMap) => void;
  addCommentRubricComment: (commentId: number, rubricComment: RubricComment) => void;
  removeCommentRubricComment: (commentId: number) => RubricComment | undefined;

  // Rubric
  setRubricCategories: (categories: RubricCategory[]) => void;
  setRubricComments: (comments: IRubricCategoryToRubricCommentsMap) => void;
  setEditRubricMode: (mode: boolean) => void;

  // Tests
  setTests: (tests: SubmissionTestType[]) => void;
  setTestCases: (testCases: { [categoryID: number]: TestCaseType[] | StudentTestCaseType[] }) => void;
  setTestCategories: (categories: TestCategoryType[]) => void;

  // UI state
  setCodeZoom: (zoom: number) => void;
  setCodeVerticalOffset: (offset: number) => void;
  setPanelType: (type: PANEL_TYPE) => void;
  setShowKeyboardShortcuts: (show: boolean) => void;
  setShowCustomCommentExplorer: (show: boolean) => void;
  setShowInlineTestsModal: (show: boolean) => void;
  setShowHelpModal: (show: boolean) => void;
  setIsStudent: (isStudent: boolean) => void;
  setHideGrades: (hide: boolean) => void;
  setActiveSiderKey: (key: string | null) => void;

  // Cursor
  setCursorMode: (mode: boolean) => void;
  setShowCursor: (domain: CURSOR_DOMAIN) => void;

  // Graders/Students
  setGraders: (graders: string[]) => void;
  setStudents: (students: string[]) => void;

  // Counters
  incrementCommentCounter: () => number;
  incrementDemoCommentCounter: () => number;
  incrementCommentRefreshCounter: () => void;

  // Execution
  setExecutionResult: (fileId: number, result: { success: boolean; output_data?: unknown; error?: string }) => void;

  // AI
  setAiEnabled: (enabled: boolean) => void;

  // Rubric reload
  triggerRubricReload: () => void;

  // Old comment ID tracking
  setOldCommentID: (currentId: number, oldId: number) => void;

  // Word Wrap
  setWordWrap: (enabled: boolean) => void;

  // Temporary Edits
  setIsEditMode: (mode: boolean) => void;
  setTemporaryFileContent: (fileId: number, content: string) => void;
  clearTemporaryFileContent: (fileId: number) => void;
}

type CodeConsoleStore = ICodeConsoleState & CodeConsoleStoreActions;

const getInitialState = (): ICodeConsoleState => ({
  permissionLevel: PERMISSION_LEVEL.READ,
  activeCommentID: undefined,
  assignment: undefined,
  commentRubricComments: {},
  comments: {},
  assignmentFiles: undefined,
  showKeyboardShortcuts: false,
  files: [],
  graders: [],
  students: [],
  isLoading: true,
  rubricCategories: [],
  rubricComments: {},
  submission: undefined,
  tests: [],
  testCases: {},
  testCategories: [],
  showInlineTestsModal: false,
  selectedFile: undefined,
  oldCommentIDs: {},
  codeZoom: LOCAL_SETTINGS.codeZoom.getter(),
  codeVerticalOffset: 0,
  demoCommentCounter: 0,
  isStudent: false,
  editRubricMode: false,
  commentCounter: -1,
  commentRefreshCounter: 0,
  rubricReload: undefined,
  cursorMode: LOCAL_SETTINGS.cursorMode.getter(),
  showCursor: LOCAL_SETTINGS.cursorMode.getter() ? CURSOR_DOMAIN.CODE : CURSOR_DOMAIN.CODE_HIDDEN,
  showCustomCommentExplorer: false,
  showHelpModal: false,
  panelType: PANEL_TYPE.FILE,
  activeSiderKey: 'file-menu',
  hideGrades: false,
  executionResults: {},
  aiEnabled: false,
  wordWrap: LOCAL_SETTINGS.wordWrap.getter(),
  isEditMode: false,
  temporaryFileContent: {},
});

export const useCodeConsoleStore = create<CodeConsoleStore>()(
  devtools(
    (set, get) => ({
      ...getInitialState(),

      // Generic state setter
      setState: (partial) => set(partial, false, 'setState'),
      reset: () => set(getInitialState(), false, 'reset'),

      // Permission
      setPermissionLevel: (level) => set({ permissionLevel: level }, false, 'setPermissionLevel'),

      // Loading
      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),

      // Submission
      setSubmission: (submission) => set({ submission }, false, 'setSubmission'),
      setReadOnlySubmission: (submission) => set({ readOnlySubmission: submission }, false, 'setReadOnlySubmission'),
      setAssignment: (assignment) => set({ assignment }, false, 'setAssignment'),
      setCourse: (course) => set({ course }, false, 'setCourse'),

      // Files
      setFiles: (files) => set({ files }, false, 'setFiles'),
      setSelectedFile: (file) => set({ selectedFile: file }, false, 'setSelectedFile'),
      setAssignmentFiles: (files) => set({ assignmentFiles: files }, false, 'setAssignmentFiles'),

      // Comments
      setComments: (comments) => set({ comments }, false, 'setComments'),
      addComment: (fileId, comment) => {
        set(
          (state) => {
            const fileComments = state.comments[fileId] || [];
            return {
              comments: {
                ...state.comments,
                [fileId]: [...fileComments, comment],
              },
            };
          },
          false,
          'addComment',
        );
      },
      updateComment: (commentId, newComment) => {
        set(
          (state) => {
            const newComments = { ...state.comments };
            for (const fileId of Object.keys(newComments)) {
              const fid = Number(fileId);
              const idx = newComments[fid].findIndex((c) => c.id === commentId);
              if (idx !== -1) {
                newComments[fid] = [...newComments[fid]];
                newComments[fid][idx] = newComment;
                break;
              }
            }
            return { comments: newComments };
          },
          false,
          'updateComment',
        );
      },
      removeComment: (fileId, commentId) => {
        set(
          (state) => ({
            comments: {
              ...state.comments,
              [fileId]: state.comments[fileId]?.filter((c) => c.id !== commentId) || [],
            },
          }),
          false,
          'removeComment',
        );
      },
      setActiveCommentID: (id) => set({ activeCommentID: id }, false, 'setActiveCommentID'),

      // Comment-RubricComment mapping
      setCommentRubricComments: (mapping) => set({ commentRubricComments: mapping }, false, 'setCommentRubricComments'),
      addCommentRubricComment: (commentId, rubricComment) => {
        set(
          (state) => ({
            commentRubricComments: {
              ...state.commentRubricComments,
              [commentId]: rubricComment,
            },
          }),
          false,
          'addCommentRubricComment',
        );
      },
      removeCommentRubricComment: (commentId) => {
        const current = get().commentRubricComments[commentId];
        set(
          (state) => {
            const updated = { ...state.commentRubricComments };
            delete updated[commentId];
            return { commentRubricComments: updated };
          },
          false,
          'removeCommentRubricComment',
        );
        return current;
      },

      // Rubric
      setRubricCategories: (categories) => set({ rubricCategories: categories }, false, 'setRubricCategories'),
      setRubricComments: (comments) => set({ rubricComments: comments }, false, 'setRubricComments'),
      setEditRubricMode: (mode) => set({ editRubricMode: mode }, false, 'setEditRubricMode'),

      // Tests
      setTests: (tests) => set({ tests }, false, 'setTests'),
      setTestCases: (testCases) => set({ testCases }, false, 'setTestCases'),
      setTestCategories: (categories) => set({ testCategories: categories }, false, 'setTestCategories'),

      // UI state
      setCodeZoom: (zoom) => set({ codeZoom: zoom }, false, 'setCodeZoom'),
      setCodeVerticalOffset: (offset) => set({ codeVerticalOffset: offset }, false, 'setCodeVerticalOffset'),
      setPanelType: (type) => set({ panelType: type }, false, 'setPanelType'),
      setShowKeyboardShortcuts: (show) => set({ showKeyboardShortcuts: show }, false, 'setShowKeyboardShortcuts'),
      setShowCustomCommentExplorer: (show) =>
        set({ showCustomCommentExplorer: show }, false, 'setShowCustomCommentExplorer'),
      setShowInlineTestsModal: (show) => set({ showInlineTestsModal: show }, false, 'setShowInlineTestsModal'),
      setShowHelpModal: (show) => set({ showHelpModal: show }, false, 'setShowHelpModal'),
      setIsStudent: (isStudent) => set({ isStudent }, false, 'setIsStudent'),
      setHideGrades: (hide) => set({ hideGrades: hide }, false, 'setHideGrades'),
      setActiveSiderKey: (key) => set({ activeSiderKey: key }, false, 'setActiveSiderKey'),

      // Cursor
      setCursorMode: (mode) => set({ cursorMode: mode }, false, 'setCursorMode'),
      setShowCursor: (domain) => set({ showCursor: domain }, false, 'setShowCursor'),

      // Graders/Students
      setGraders: (graders) => set({ graders }, false, 'setGraders'),
      setStudents: (students) => set({ students }, false, 'setStudents'),

      // Counters
      incrementCommentCounter: () => {
        const current = get().commentCounter;
        set({ commentCounter: current - 1 }, false, 'incrementCommentCounter');
        return current;
      },
      incrementDemoCommentCounter: () => {
        const current = get().demoCommentCounter;
        set({ demoCommentCounter: current + 1 }, false, 'incrementDemoCommentCounter');
        return current;
      },
      incrementCommentRefreshCounter: () => {
        set(
          (state) => ({ commentRefreshCounter: state.commentRefreshCounter + 1 }),
          false,
          'incrementCommentRefreshCounter',
        );
      },

      // Execution
      setExecutionResult: (fileId, result) => {
        set(
          (state) => ({
            executionResults: {
              ...state.executionResults,
              [fileId]: result,
            },
          }),
          false,
          'setExecutionResult',
        );
      },

      // AI
      setAiEnabled: (enabled) => set({ aiEnabled: enabled }, false, 'setAiEnabled'),

      // Rubric reload
      triggerRubricReload: () => set({ rubricReload: Date.now() }, false, 'triggerRubricReload'),

      // Old comment ID tracking
      setOldCommentID: (currentId, oldId) => {
        set(
          (state) => ({
            oldCommentIDs: {
              ...state.oldCommentIDs,
              [currentId]: oldId,
            },
          }),
          false,
          'setOldCommentID',
        );
      },

      // Word Wrap
      setWordWrap: (enabled) => {
        LOCAL_SETTINGS.wordWrap.setter(enabled);
        set({ wordWrap: enabled }, false, 'setWordWrap');
      },

      // Temporary Edits
      setIsEditMode: (mode) => set({ isEditMode: mode }, false, 'setIsEditMode'),
      setTemporaryFileContent: (fileId, content) => {
        set(
          (state) => ({
            temporaryFileContent: {
              ...state.temporaryFileContent,
              [fileId]: content,
            },
          }),
          false,
          'setTemporaryFileContent',
        );
      },
      clearTemporaryFileContent: (fileId) => {
        set(
          (state) => {
            const newContent = { ...state.temporaryFileContent };
            delete newContent[fileId];
            return { temporaryFileContent: newContent };
          },
          false,
          'clearTemporaryFileContent',
        );
      },
    }),
    { name: 'code-console' },
  ),
);
