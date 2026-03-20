// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Robust tests for useRubricStore Zustand store.
 *
 * Covers:
 * - Initialization from categories + comments
 * - CRUD operations on categories and comments
 * - Move/reorder categories
 * - changesMade() tracking
 * - resetRubric restores saved state
 * - afterSave clears dirty tracking
 * - Delete tracking for existing (id > 0) vs new (id < 0) items
 * - buildCommentMap utility
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useRubricStore, RESOLUTION } from '../../stores/useRubricStore';
import type { RubricCategory, RubricComment } from '../../api-client';
import type { IRubricCategoryToRubricCommentsMap } from '../../types/common';

// Helper to create mock rubric categories and comments
function createMockCategories(): RubricCategory[] {
  return [
    {
      id: 1,
      name: 'Style',
      sortKey: 0,
      assignment: 1,
      pointLimit: null,
      helpText: '',
      atMostOnce: false,
    } as RubricCategory,
    {
      id: 2,
      name: 'Correctness',
      sortKey: 1,
      assignment: 1,
      pointLimit: -10,
      helpText: '',
      atMostOnce: false,
    } as RubricCategory,
  ];
}

function createMockComments(): IRubricCategoryToRubricCommentsMap {
  return {
    1: [
      {
        id: 10,
        text: 'Bad naming',
        pointDelta: -1,
        category: 1,
        sortKey: 0,
        explanation: '',
        templateTextOn: false,
        instructionText: '',
      } as RubricComment,
      {
        id: 11,
        text: 'Good docs',
        pointDelta: 1,
        category: 1,
        sortKey: 1,
        explanation: '',
        templateTextOn: false,
        instructionText: '',
      } as RubricComment,
    ],
    2: [
      {
        id: 20,
        text: 'Wrong output',
        pointDelta: -5,
        category: 2,
        sortKey: 0,
        explanation: '',
        templateTextOn: false,
        instructionText: '',
      } as RubricComment,
    ],
  };
}

describe('useRubricStore', () => {
  beforeEach(() => {
    // Reset to initial state between tests
    useRubricStore.getState().resetRubric();
    useRubricStore.setState({
      rubricCategories: [],
      rubricComments: {},
      savedRubricCategories: [],
      savedRubricComments: {},
      unsavedComments: [],
      deletedComments: [],
      unsavedCategories: [],
      deletedCategories: [],
      hasMoved: false,
      newObjectCounter: -1,
      loadComplete: false,
    });
  });

  describe('initialize', () => {
    it('should set categories and comments', () => {
      const categories = createMockCategories();
      const comments = createMockComments();

      useRubricStore.getState().initialize(categories, comments);

      const state = useRubricStore.getState();
      expect(state.rubricCategories).toHaveLength(2);
      expect(state.rubricComments[1]).toHaveLength(2);
      expect(state.rubricComments[2]).toHaveLength(1);
      expect(state.loadComplete).toBe(true);
    });

    it('should deep clone saved state from initial state', () => {
      const categories = createMockCategories();
      const comments = createMockComments();

      useRubricStore.getState().initialize(categories, comments);

      const state = useRubricStore.getState();
      // Mutating the active categories should not affect saved
      state.rubricCategories[0].name = 'MUTATED';
      expect(state.savedRubricCategories[0].name).toBe('Style');
    });

    it('should clear unsaved/deleted tracking on initialize', () => {
      useRubricStore.setState({
        unsavedCategories: [createMockCategories()[0]],
        deletedComments: [createMockComments()[1][0]],
      });
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());

      const state = useRubricStore.getState();
      expect(state.unsavedCategories).toHaveLength(0);
      expect(state.deletedComments).toHaveLength(0);
    });
  });

  describe('addCategory', () => {
    it('should add a new category with a negative ID', () => {
      useRubricStore.getState().initialize([], {});

      const newCat = { name: 'New Cat', sortKey: 0, assignment: 1 } as RubricCategory;
      const newId = useRubricStore.getState().addCategory(newCat);

      expect(newId).toBe(-1);
      const state = useRubricStore.getState();
      expect(state.rubricCategories).toHaveLength(1);
      expect(state.rubricCategories[0].id).toBe(-1);
      expect(state.unsavedCategories).toHaveLength(1);
    });

    it('should decrement the counter for each new category', () => {
      useRubricStore.getState().initialize([], {});

      useRubricStore.getState().addCategory({ name: 'Cat 1' } as RubricCategory);
      useRubricStore.getState().addCategory({ name: 'Cat 2' } as RubricCategory);

      const state = useRubricStore.getState();
      expect(state.rubricCategories[0].id).toBe(-1);
      expect(state.rubricCategories[1].id).toBe(-2);
      expect(state.newObjectCounter).toBe(-3);
    });

    it('should create an empty comment array for the new category', () => {
      useRubricStore.getState().initialize([], {});
      const newId = useRubricStore.getState().addCategory({ name: 'Cat' } as RubricCategory);

      expect(useRubricStore.getState().rubricComments[newId]).toEqual([]);
    });
  });

  describe('deleteCategory', () => {
    it('should remove the category from the list', () => {
      const categories = createMockCategories();
      useRubricStore.getState().initialize(categories, createMockComments());

      useRubricStore.getState().deleteCategory(useRubricStore.getState().rubricCategories[0]);

      expect(useRubricStore.getState().rubricCategories).toHaveLength(1);
      expect(useRubricStore.getState().rubricCategories[0].name).toBe('Correctness');
    });

    it('should track existing categories (id > 0) in deletedCategories', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const cat = useRubricStore.getState().rubricCategories[0];

      useRubricStore.getState().deleteCategory(cat);

      expect(useRubricStore.getState().deletedCategories).toHaveLength(1);
      expect(useRubricStore.getState().deletedCategories[0].id).toBe(1);
    });

    it('should NOT track new categories (id < 0) in deletedCategories', () => {
      useRubricStore.getState().initialize([], {});
      useRubricStore.getState().addCategory({ name: 'Temp' } as RubricCategory);
      const newCat = useRubricStore.getState().rubricCategories[0];

      useRubricStore.getState().deleteCategory(newCat);

      expect(useRubricStore.getState().deletedCategories).toHaveLength(0);
    });
  });

  describe('moveCategory', () => {
    it('should reorder categories', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());

      useRubricStore.getState().moveCategory(2, 0);

      const state = useRubricStore.getState();
      expect(state.rubricCategories[0].name).toBe('Correctness');
      expect(state.rubricCategories[1].name).toBe('Style');
      expect(state.hasMoved).toBe(true);
    });

    it('should mark moved categories as unsaved', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());

      useRubricStore.getState().moveCategory(2, 0);

      expect(useRubricStore.getState().unsavedCategories.length).toBeGreaterThan(0);
    });
  });

  describe('addComment', () => {
    it('should add a comment with a negative ID', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());

      const newCommentId = useRubricStore.getState().addComment(1, {
        text: 'New comment',
        pointDelta: -2,
        category: 1,
        sortKey: 2,
      } as RubricComment);

      expect(newCommentId).toBeLessThan(0);
      expect(useRubricStore.getState().rubricComments[1]).toHaveLength(3);
      expect(useRubricStore.getState().unsavedComments).toHaveLength(1);
    });
  });

  describe('deleteComment', () => {
    it('should remove comment from category and track in deletedComments', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const comment = useRubricStore.getState().rubricComments[1][0];

      useRubricStore.getState().deleteComment(comment);

      expect(useRubricStore.getState().rubricComments[1]).toHaveLength(1);
      expect(useRubricStore.getState().deletedComments).toHaveLength(1);
    });
  });

  describe('changesMade', () => {
    it('should return false when no changes', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      expect(useRubricStore.getState().changesMade()).toBe(false);
    });

    it('should return true after adding a category', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      useRubricStore.getState().addCategory({ name: 'New' } as RubricCategory);
      expect(useRubricStore.getState().changesMade()).toBe(true);
    });

    it('should return true after deleting a comment', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      useRubricStore.getState().deleteComment(useRubricStore.getState().rubricComments[1][0]);
      expect(useRubricStore.getState().changesMade()).toBe(true);
    });

    it('should return true after moving a category', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      useRubricStore.getState().moveCategory(2, 0);
      expect(useRubricStore.getState().changesMade()).toBe(true);
    });
  });

  describe('resetRubric', () => {
    it('should restore saved state and clear all dirty tracking', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      useRubricStore.getState().addCategory({ name: 'Junk' } as RubricCategory);
      useRubricStore.getState().deleteComment(useRubricStore.getState().rubricComments[1][0]);

      useRubricStore.getState().resetRubric();

      const state = useRubricStore.getState();
      expect(state.rubricCategories).toHaveLength(2);
      expect(state.rubricComments[1]).toHaveLength(2);
      expect(state.unsavedCategories).toHaveLength(0);
      expect(state.deletedComments).toHaveLength(0);
      expect(state.changesMade()).toBe(false);
    });
  });

  describe('afterSave', () => {
    it('should update saved state and clear all tracking', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      useRubricStore.getState().addCategory({ name: 'Saved' } as RubricCategory);

      const currentCategories = useRubricStore.getState().rubricCategories;
      const currentComments = useRubricStore.getState().rubricComments;
      useRubricStore.getState().afterSave(currentCategories, currentComments);

      const state = useRubricStore.getState();
      expect(state.isSaving).toBe(false);
      expect(state.unsavedCategories).toHaveLength(0);
      expect(state.unsavedComments).toHaveLength(0);
      expect(state.changesMade()).toBe(false);
      // The saved state should now include the new category
      expect(state.savedRubricCategories).toHaveLength(3);
    });
  });

  describe('getCategory and getComment', () => {
    it('should return correct category by ID', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const cat = useRubricStore.getState().getCategory(2);
      expect(cat?.name).toBe('Correctness');
    });

    it('should return undefined for unknown category ID', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      expect(useRubricStore.getState().getCategory(999)).toBeUndefined();
    });

    it('should return correct comment by ID and category', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const comment = useRubricStore.getState().getComment(10, 1);
      expect(comment?.text).toBe('Bad naming');
    });
  });

  describe('buildCommentMap', () => {
    it('should build a map from categories and flat comment list', () => {
      const categories = createMockCategories();
      const comments: RubricComment[] = [
        { id: 10, text: 'A', category: 1 } as RubricComment,
        { id: 20, text: 'B', category: 2 } as RubricComment,
        { id: 11, text: 'C', category: 1 } as RubricComment,
      ];

      const map = useRubricStore.getState().buildCommentMap(categories, comments);

      expect(map[1]).toHaveLength(2);
      expect(map[2]).toHaveLength(1);
    });
  });

  describe('resolution and propagation', () => {
    it('should set resolution for a comment', () => {
      useRubricStore.getState().setResolution(10, RESOLUTION.DELETE);
      expect(useRubricStore.getState().resolutions[10]).toBe(RESOLUTION.DELETE);
    });

    it('should set resolution to UNLINK', () => {
      useRubricStore.getState().setResolution(10, RESOLUTION.UNLINK);
      expect(useRubricStore.getState().resolutions[10]).toBe(RESOLUTION.UNLINK);
    });

    it('should toggle propagation confirmation', () => {
      useRubricStore.getState().setConfirmedPropagation(true);
      expect(useRubricStore.getState().confirmedPropagation).toBe(true);
    });
  });

  describe('toggleLock', () => {
    it('should toggle the changeLock', () => {
      expect(useRubricStore.getState().changeLock).toBe(true);
      useRubricStore.getState().toggleLock();
      expect(useRubricStore.getState().changeLock).toBe(false);
      useRubricStore.getState().toggleLock();
      expect(useRubricStore.getState().changeLock).toBe(true);
    });
  });

  describe('updateCategory', () => {
    it('should update an existing category', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const updated = { ...useRubricStore.getState().rubricCategories[0], name: 'Renamed' };
      useRubricStore.getState().updateCategory(updated);
      expect(useRubricStore.getState().rubricCategories[0].name).toBe('Renamed');
    });

    it('should not change state when category id is not found', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const before = useRubricStore.getState().rubricCategories;
      useRubricStore.getState().updateCategory({ id: 999, name: 'Ghost' } as RubricCategory);
      expect(useRubricStore.getState().rubricCategories).toBe(before);
    });

    it('should track error objects when hasError is true', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const cat = useRubricStore.getState().rubricCategories[0];
      useRubricStore.getState().updateCategory(cat, true);
      expect(useRubricStore.getState().errorObjects).toContain(cat.id);
    });

    it('should remove from error objects when hasError is false', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const cat = useRubricStore.getState().rubricCategories[0];
      useRubricStore.getState().updateCategory(cat, true);
      useRubricStore.getState().updateCategory(cat, false);
      expect(useRubricStore.getState().errorObjects).not.toContain(cat.id);
    });
  });

  describe('onCategoryEdit / onCategoryUndo', () => {
    it('should track edited category in unsavedCategories', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const cat = useRubricStore.getState().rubricCategories[0];
      useRubricStore.getState().onCategoryEdit(cat);
      expect(useRubricStore.getState().unsavedCategories).toHaveLength(1);
    });

    it('should not duplicate if category already tracked', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const cat = useRubricStore.getState().rubricCategories[0];
      useRubricStore.getState().onCategoryEdit(cat);
      useRubricStore.getState().onCategoryEdit(cat);
      expect(useRubricStore.getState().unsavedCategories).toHaveLength(1);
    });

    it('should remove category from unsavedCategories on undo', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const cat = useRubricStore.getState().rubricCategories[0];
      useRubricStore.getState().onCategoryEdit(cat);
      useRubricStore.getState().onCategoryUndo(cat);
      expect(useRubricStore.getState().unsavedCategories).toHaveLength(0);
    });
  });

  describe('updateComment', () => {
    it('should update a comment in place', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const comment = useRubricStore.getState().rubricComments[1][0];
      useRubricStore.getState().updateComment({ ...comment, text: 'Updated text' });
      expect(useRubricStore.getState().rubricComments[1][0].text).toBe('Updated text');
    });

    it('should not change state for unknown category', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const before = useRubricStore.getState().rubricComments;
      useRubricStore.getState().updateComment({ id: 10, category: 999, text: 'x' } as RubricComment);
      expect(useRubricStore.getState().rubricComments).toBe(before);
    });
  });

  describe('reorderComments', () => {
    it('should reorder comments and mark changed ones as unsaved', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const comments = [...useRubricStore.getState().rubricComments[1]];
      const reversed = [comments[1], comments[0]];
      useRubricStore.getState().reorderComments(1, reversed);
      expect(useRubricStore.getState().rubricComments[1][0].id).toBe(comments[1].id);
      expect(useRubricStore.getState().hasMoved).toBe(true);
    });
  });

  describe('onCommentEdit / onCommentUndo', () => {
    it('should track edited comment', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const comment = useRubricStore.getState().rubricComments[1][0];
      useRubricStore.getState().onCommentEdit(comment);
      expect(useRubricStore.getState().unsavedComments).toHaveLength(1);
    });

    it('should not duplicate edits', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const comment = useRubricStore.getState().rubricComments[1][0];
      useRubricStore.getState().onCommentEdit(comment);
      useRubricStore.getState().onCommentEdit(comment);
      expect(useRubricStore.getState().unsavedComments).toHaveLength(1);
    });

    it('should remove from unsavedComments on undo', () => {
      useRubricStore.getState().initialize(createMockCategories(), createMockComments());
      const comment = useRubricStore.getState().rubricComments[1][0];
      useRubricStore.getState().onCommentEdit(comment);
      useRubricStore.getState().onCommentUndo(comment);
      expect(useRubricStore.getState().unsavedComments).toHaveLength(0);
    });
  });

  describe('UI state setters', () => {
    it('setActiveComment sets and clears', () => {
      const comment = { id: 10, text: 'x' } as RubricComment;
      useRubricStore.getState().setActiveComment(comment);
      expect(useRubricStore.getState().activeComment).toBe(comment);
      useRubricStore.getState().setActiveComment(undefined);
      expect(useRubricStore.getState().activeComment).toBeUndefined();
    });

    it('setLinkedComments updates list', () => {
      const comments = [{ id: 10 } as RubricComment];
      useRubricStore.getState().setLinkedComments(comments);
      expect(useRubricStore.getState().linkedComments).toEqual(comments);
    });

    it('setShowConfirmDialog toggles dialog', () => {
      useRubricStore.getState().setShowConfirmDialog(true);
      expect(useRubricStore.getState().showConfirmDialog).toBe(true);
    });

    it('setFeedbackScores updates scores', () => {
      useRubricStore.getState().setFeedbackScores({ 1: { negative: 2, positive: 5 } });
      expect(useRubricStore.getState().feedbackScores?.[1]).toEqual({ negative: 2, positive: 5 });
    });

    it('setInstanceLists updates lists', () => {
      useRubricStore.getState().setInstanceLists({ 10: [1, 2, 3] });
      expect(useRubricStore.getState().instanceLists[10]).toEqual([1, 2, 3]);
    });
  });
});
