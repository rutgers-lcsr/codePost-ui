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
});
