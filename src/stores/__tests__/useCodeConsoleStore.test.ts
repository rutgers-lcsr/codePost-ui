// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Robust tests for useCodeConsoleStore Zustand store.
 *
 * Covers:
 * - Initial state defaults
 * - reset() restores initial state
 * - Permission level setter
 * - Comment CRUD operations (add, update, remove)
 * - CommentRubricComment mapping (add, remove)
 * - File setters
 * - Counters (commentCounter, demoCommentCounter, commentRefreshCounter)
 * - Execution results
 * - Temporary file content (set, clear)
 * - Edit mode
 * - AI enabled toggle
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock LOCAL_SETTINGS before importing the store
vi.mock('../../components/utils/LocalSettings', () => ({
  LOCAL_SETTINGS: {
    codeZoom: { getter: () => 14, setter: vi.fn() },
    cursorMode: { getter: () => false, setter: vi.fn() },
    wordWrap: { getter: () => false, setter: vi.fn() },
  },
}));

import { useCodeConsoleStore } from '../../stores/useCodeConsoleStore';

describe('useCodeConsoleStore', () => {
  beforeEach(() => {
    useCodeConsoleStore.getState().reset();
  });

  describe('initial state', () => {
    it('should start with loading true', () => {
      expect(useCodeConsoleStore.getState().isLoading).toBe(true);
    });

    it('should start with empty files', () => {
      expect(useCodeConsoleStore.getState().files).toEqual([]);
    });

    it('should start with no submission', () => {
      expect(useCodeConsoleStore.getState().submission).toBeUndefined();
    });

    it('should start with commentCounter at -1', () => {
      expect(useCodeConsoleStore.getState().commentCounter).toBe(-1);
    });

    it('should start with empty executionResults', () => {
      expect(useCodeConsoleStore.getState().executionResults).toEqual({});
    });

    it('should start with aiEnabled false', () => {
      expect(useCodeConsoleStore.getState().aiEnabled).toBe(false);
    });
  });

  describe('reset', () => {
    it('should restore all state to initial values', () => {
      useCodeConsoleStore.getState().setLoading(false);
      useCodeConsoleStore.getState().setAiEnabled(true);
      useCodeConsoleStore.getState().setFiles([{ id: 1, name: 'test.py' } as any]);

      useCodeConsoleStore.getState().reset();

      expect(useCodeConsoleStore.getState().isLoading).toBe(true);
      expect(useCodeConsoleStore.getState().aiEnabled).toBe(false);
      expect(useCodeConsoleStore.getState().files).toEqual([]);
    });
  });

  describe('setters', () => {
    it('should set loading state', () => {
      useCodeConsoleStore.getState().setLoading(false);
      expect(useCodeConsoleStore.getState().isLoading).toBe(false);
    });

    it('should set permission level', () => {
      useCodeConsoleStore.getState().setPermissionLevel(2);
      expect(useCodeConsoleStore.getState().permissionLevel).toBe(2);
    });

    it('should set files', () => {
      const files = [{ id: 1, name: 'main.py' } as any, { id: 2, name: 'util.py' } as any];
      useCodeConsoleStore.getState().setFiles(files);
      expect(useCodeConsoleStore.getState().files).toHaveLength(2);
    });

    it('should set selected file', () => {
      const file = { id: 1, name: 'main.py' } as any;
      useCodeConsoleStore.getState().setSelectedFile(file);
      expect(useCodeConsoleStore.getState().selectedFile).toEqual(file);
    });

    it('should set graders and students', () => {
      useCodeConsoleStore.getState().setGraders(['g1@test.edu', 'g2@test.edu']);
      useCodeConsoleStore.getState().setStudents(['s1@test.edu']);
      expect(useCodeConsoleStore.getState().graders).toHaveLength(2);
      expect(useCodeConsoleStore.getState().students).toHaveLength(1);
    });

    it('should set isStudent', () => {
      useCodeConsoleStore.getState().setIsStudent(true);
      expect(useCodeConsoleStore.getState().isStudent).toBe(true);
    });

    it('should set hideGrades', () => {
      useCodeConsoleStore.getState().setHideGrades(true);
      expect(useCodeConsoleStore.getState().hideGrades).toBe(true);
    });
  });

  describe('comment operations', () => {
    it('should add a comment to a file', () => {
      useCodeConsoleStore.getState().setComments({});
      useCodeConsoleStore.getState().addComment(1, { id: 100, text: 'Bug here' } as any);

      expect(useCodeConsoleStore.getState().comments[1]).toHaveLength(1);
      expect(useCodeConsoleStore.getState().comments[1][0].text).toBe('Bug here');
    });

    it('should append comments to existing file entry', () => {
      useCodeConsoleStore.getState().setComments({ 1: [{ id: 100, text: 'First' } as any] });
      useCodeConsoleStore.getState().addComment(1, { id: 101, text: 'Second' } as any);

      expect(useCodeConsoleStore.getState().comments[1]).toHaveLength(2);
    });

    it('should update a comment by ID', () => {
      useCodeConsoleStore.getState().setComments({
        1: [{ id: 100, text: 'Old text' } as any],
      });

      useCodeConsoleStore.getState().updateComment(100, { id: 100, text: 'New text' } as any);

      expect(useCodeConsoleStore.getState().comments[1][0].text).toBe('New text');
    });

    it('should remove a comment by ID', () => {
      useCodeConsoleStore.getState().setComments({
        1: [{ id: 100, text: 'Keep' } as any, { id: 101, text: 'Remove' } as any],
      });

      useCodeConsoleStore.getState().removeComment(1, 101);

      expect(useCodeConsoleStore.getState().comments[1]).toHaveLength(1);
      expect(useCodeConsoleStore.getState().comments[1][0].id).toBe(100);
    });

    it('should set and clear activeCommentID', () => {
      useCodeConsoleStore.getState().setActiveCommentID(42);
      expect(useCodeConsoleStore.getState().activeCommentID).toBe(42);

      useCodeConsoleStore.getState().setActiveCommentID(undefined);
      expect(useCodeConsoleStore.getState().activeCommentID).toBeUndefined();
    });
  });

  describe('comment-rubricComment mapping', () => {
    it('should add a mapping', () => {
      const rc = { id: 10, text: 'Rubric', pointDelta: -2 } as any;
      useCodeConsoleStore.getState().addCommentRubricComment(100, rc);

      expect(useCodeConsoleStore.getState().commentRubricComments[100]).toEqual(rc);
    });

    it('should remove a mapping and return the removed value', () => {
      const rc = { id: 10, text: 'Rubric', pointDelta: -2 } as any;
      useCodeConsoleStore.getState().addCommentRubricComment(100, rc);

      const removed = useCodeConsoleStore.getState().removeCommentRubricComment(100);

      expect(removed).toEqual(rc);
      expect(useCodeConsoleStore.getState().commentRubricComments[100]).toBeUndefined();
    });

    it('should return undefined when removing non-existent mapping', () => {
      const removed = useCodeConsoleStore.getState().removeCommentRubricComment(999);
      expect(removed).toBeUndefined();
    });
  });

  describe('counters', () => {
    it('should decrement commentCounter and return current', () => {
      const first = useCodeConsoleStore.getState().incrementCommentCounter();
      expect(first).toBe(-1);
      expect(useCodeConsoleStore.getState().commentCounter).toBe(-2);

      const second = useCodeConsoleStore.getState().incrementCommentCounter();
      expect(second).toBe(-2);
      expect(useCodeConsoleStore.getState().commentCounter).toBe(-3);
    });

    it('should increment demoCommentCounter and return current', () => {
      const first = useCodeConsoleStore.getState().incrementDemoCommentCounter();
      expect(first).toBe(0);
      expect(useCodeConsoleStore.getState().demoCommentCounter).toBe(1);
    });

    it('should increment commentRefreshCounter', () => {
      expect(useCodeConsoleStore.getState().commentRefreshCounter).toBe(0);
      useCodeConsoleStore.getState().incrementCommentRefreshCounter();
      expect(useCodeConsoleStore.getState().commentRefreshCounter).toBe(1);
    });
  });

  describe('execution results', () => {
    it('should store execution result per file', () => {
      useCodeConsoleStore.getState().setExecutionResult(1, {
        success: true,
        output_data: { cells: [] },
      });

      expect(useCodeConsoleStore.getState().executionResults[1]).toEqual({
        success: true,
        output_data: { cells: [] },
      });
    });

    it('should store multiple execution results independently', () => {
      useCodeConsoleStore.getState().setExecutionResult(1, { success: true });
      useCodeConsoleStore.getState().setExecutionResult(2, { success: false, error: 'Timeout' });

      expect(useCodeConsoleStore.getState().executionResults[1].success).toBe(true);
      expect(useCodeConsoleStore.getState().executionResults[2].success).toBe(false);
    });
  });

  describe('temporary file content', () => {
    it('should set temporary content for a file', () => {
      useCodeConsoleStore.getState().setTemporaryFileContent(1, 'modified code');
      expect(useCodeConsoleStore.getState().temporaryFileContent[1]).toBe('modified code');
    });

    it('should clear temporary content for a specific file', () => {
      useCodeConsoleStore.getState().setTemporaryFileContent(1, 'edit1');
      useCodeConsoleStore.getState().setTemporaryFileContent(2, 'edit2');

      useCodeConsoleStore.getState().clearTemporaryFileContent(1);

      expect(useCodeConsoleStore.getState().temporaryFileContent[1]).toBeUndefined();
      expect(useCodeConsoleStore.getState().temporaryFileContent[2]).toBe('edit2');
    });
  });

  describe('edit mode', () => {
    it('should toggle edit mode', () => {
      expect(useCodeConsoleStore.getState().isEditMode).toBe(false);
      useCodeConsoleStore.getState().setIsEditMode(true);
      expect(useCodeConsoleStore.getState().isEditMode).toBe(true);
    });
  });

  describe('AI', () => {
    it('should set AI enabled', () => {
      useCodeConsoleStore.getState().setAiEnabled(true);
      expect(useCodeConsoleStore.getState().aiEnabled).toBe(true);
    });
  });

  describe('rubric reload', () => {
    it('should trigger rubric reload with a timestamp', () => {
      expect(useCodeConsoleStore.getState().rubricReload).toBeUndefined();
      useCodeConsoleStore.getState().triggerRubricReload();
      expect(useCodeConsoleStore.getState().rubricReload).toBeDefined();
      expect(typeof useCodeConsoleStore.getState().rubricReload).toBe('number');
    });
  });

  describe('old comment ID tracking', () => {
    it('should map current ID to old ID', () => {
      useCodeConsoleStore.getState().setOldCommentID(200, 100);
      expect(useCodeConsoleStore.getState().oldCommentIDs[200]).toBe(100);
    });
  });

  describe('additional UI setters', () => {
    it('setShowCustomCommentExplorer', () => {
      useCodeConsoleStore.getState().setShowCustomCommentExplorer(true);
      expect(useCodeConsoleStore.getState().showCustomCommentExplorer).toBe(true);
    });

    it('setShowInlineTestsModal', () => {
      useCodeConsoleStore.getState().setShowInlineTestsModal(true);
      expect(useCodeConsoleStore.getState().showInlineTestsModal).toBe(true);
    });

    it('setShowHelpModal', () => {
      useCodeConsoleStore.getState().setShowHelpModal(true);
      expect(useCodeConsoleStore.getState().showHelpModal).toBe(true);
    });

    it('setIsStudent', () => {
      useCodeConsoleStore.getState().setIsStudent(true);
      expect(useCodeConsoleStore.getState().isStudent).toBe(true);
    });

    it('setHideGrades', () => {
      useCodeConsoleStore.getState().setHideGrades(true);
      expect(useCodeConsoleStore.getState().hideGrades).toBe(true);
    });

    it('setActiveSiderKey', () => {
      useCodeConsoleStore.getState().setActiveSiderKey('rubric');
      expect(useCodeConsoleStore.getState().activeSiderKey).toBe('rubric');
    });

    it('setCursorMode', () => {
      useCodeConsoleStore.getState().setCursorMode(true);
      expect(useCodeConsoleStore.getState().cursorMode).toBe(true);
    });

    it('setShowCursor', () => {
      useCodeConsoleStore.getState().setShowCursor('files' as never);
      expect(useCodeConsoleStore.getState().showCursor).toBe('files');
    });

    it('setGraders', () => {
      useCodeConsoleStore.getState().setGraders(['alice', 'bob']);
      expect(useCodeConsoleStore.getState().graders).toEqual(['alice', 'bob']);
    });

    it('setStudents', () => {
      useCodeConsoleStore.getState().setStudents(['carol']);
      expect(useCodeConsoleStore.getState().students).toEqual(['carol']);
    });

    it('incrementDemoCommentCounter', () => {
      const before = useCodeConsoleStore.getState().demoCommentCounter;
      const result = useCodeConsoleStore.getState().incrementDemoCommentCounter();
      expect(result).toBe(before);
      expect(useCodeConsoleStore.getState().demoCommentCounter).toBe(before + 1);
    });

    it('incrementCommentRefreshCounter', () => {
      const before = useCodeConsoleStore.getState().commentRefreshCounter;
      useCodeConsoleStore.getState().incrementCommentRefreshCounter();
      expect(useCodeConsoleStore.getState().commentRefreshCounter).toBe(before + 1);
    });

    it('setWordWrap', () => {
      useCodeConsoleStore.getState().setWordWrap(true);
      expect(useCodeConsoleStore.getState().wordWrap).toBe(true);
    });
  });

  describe('setReadOnlySubmission', () => {
    it('should store read-only submission', () => {
      const sub = { id: 99, students: ['s@test.edu'] } as any;
      useCodeConsoleStore.getState().setReadOnlySubmission(sub);
      expect(useCodeConsoleStore.getState().readOnlySubmission).toEqual(sub);
    });

    it('should clear read-only submission with undefined', () => {
      useCodeConsoleStore.getState().setReadOnlySubmission({ id: 1 } as any);
      useCodeConsoleStore.getState().setReadOnlySubmission(undefined);
      expect(useCodeConsoleStore.getState().readOnlySubmission).toBeUndefined();
    });
  });

  describe('updateComment across files', () => {
    it('should find and update a comment when it exists in a different file', () => {
      useCodeConsoleStore.getState().setComments({
        1: [{ id: 100, text: 'File 1' } as any],
        2: [{ id: 200, text: 'File 2' } as any, { id: 201, text: 'Also File 2' } as any],
      });

      useCodeConsoleStore.getState().updateComment(200, { id: 200, text: 'Updated File 2' } as any);

      expect(useCodeConsoleStore.getState().comments[1][0].text).toBe('File 1');
      expect(useCodeConsoleStore.getState().comments[2][0].text).toBe('Updated File 2');
      expect(useCodeConsoleStore.getState().comments[2][1].text).toBe('Also File 2');
    });

    it('should leave all comments unchanged when comment ID is not found', () => {
      useCodeConsoleStore.getState().setComments({
        1: [{ id: 100, text: 'Original' } as any],
      });

      useCodeConsoleStore.getState().updateComment(999, { id: 999, text: 'Ghost' } as any);

      expect(useCodeConsoleStore.getState().comments[1][0].text).toBe('Original');
    });
  });

  describe('assignment files', () => {
    it('should set assignment files', () => {
      const files = [{ id: 1, name: 'template.py' }] as any;
      useCodeConsoleStore.getState().setAssignmentFiles(files);
      expect(useCodeConsoleStore.getState().assignmentFiles).toEqual(files);
    });
  });

  describe('setSubmission and setAssignment and setCourse', () => {
    it('should set submission', () => {
      const sub = { id: 1, assignment: 1 } as any;
      useCodeConsoleStore.getState().setSubmission(sub);
      expect(useCodeConsoleStore.getState().submission).toEqual(sub);
    });

    it('should set assignment', () => {
      const assgn = { id: 1, name: 'HW1' } as any;
      useCodeConsoleStore.getState().setAssignment(assgn);
      expect(useCodeConsoleStore.getState().assignment).toEqual(assgn);
    });

    it('should set course', () => {
      const course = { id: 1, name: 'CS101' } as any;
      useCodeConsoleStore.getState().setCourse(course);
      expect(useCodeConsoleStore.getState().course).toEqual(course);
    });
  });

  describe('setCommentRubricComments', () => {
    it('should replace the entire mapping', () => {
      const mapping = { 100: { id: 10, text: 'RC' } as any };
      useCodeConsoleStore.getState().setCommentRubricComments(mapping);
      expect(useCodeConsoleStore.getState().commentRubricComments).toEqual(mapping);
    });
  });

  describe('rubric setters', () => {
    it('should set rubric categories', () => {
      const cats = [{ id: 1, name: 'Style' }] as any;
      useCodeConsoleStore.getState().setRubricCategories(cats);
      expect(useCodeConsoleStore.getState().rubricCategories).toEqual(cats);
    });

    it('should set rubric comments', () => {
      const comments = [{ id: 1, text: 'Fix indentation' }] as any;
      useCodeConsoleStore.getState().setRubricComments(comments);
      expect(useCodeConsoleStore.getState().rubricComments).toEqual(comments);
    });

    it('should set edit rubric mode', () => {
      useCodeConsoleStore.getState().setEditRubricMode(true);
      expect(useCodeConsoleStore.getState().editRubricMode).toBe(true);
    });
  });

  describe('test setters', () => {
    it('should set tests', () => {
      useCodeConsoleStore.getState().setTests([{ id: 1 }] as any);
      expect(useCodeConsoleStore.getState().tests).toHaveLength(1);
    });

    it('should set test cases', () => {
      useCodeConsoleStore.getState().setTestCases([{ id: 1 }] as any);
      expect(useCodeConsoleStore.getState().testCases).toHaveLength(1);
    });

    it('should set test categories', () => {
      useCodeConsoleStore.getState().setTestCategories([{ id: 1 }] as any);
      expect(useCodeConsoleStore.getState().testCategories).toHaveLength(1);
    });
  });

  describe('UI panel setters', () => {
    it('should set panel type', () => {
      useCodeConsoleStore.getState().setPanelType('files' as any);
      expect(useCodeConsoleStore.getState().panelType).toBe('files');
    });

    it('should set code zoom', () => {
      useCodeConsoleStore.getState().setCodeZoom(18);
      expect(useCodeConsoleStore.getState().codeZoom).toBe(18);
    });

    it('should set code vertical offset', () => {
      useCodeConsoleStore.getState().setCodeVerticalOffset(50);
      expect(useCodeConsoleStore.getState().codeVerticalOffset).toBe(50);
    });

    it('should set show keyboard shortcuts', () => {
      useCodeConsoleStore.getState().setShowKeyboardShortcuts(true);
      expect(useCodeConsoleStore.getState().showKeyboardShortcuts).toBe(true);
    });
  });
});
