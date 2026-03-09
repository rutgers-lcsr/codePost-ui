// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Robust tests for useRubricCommentStore Zustand store.
 *
 * Covers:
 * - initializeComments: bulk init from array
 * - updateComment: field-level updates, auto-creates from propsComments
 * - setStatus / getComment
 * - syncFromProps: preserves unsaved edits, updates non-unsaved comments
 * - reset
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useRubricCommentStore } from '../../stores/useRubricCommentStore';
import type { RubricComment } from '../../api-client';

const STATUS_NONE = 0;
const STATUS_UNSAVED = 1;

function createComments(): RubricComment[] {
  return [
    { id: 1, text: 'Missing semicolon', pointDelta: -1, category: 1, sortKey: 0, explanation: '' } as RubricComment,
    { id: 2, text: 'Good variable names', pointDelta: 1, category: 1, sortKey: 1, explanation: '' } as RubricComment,
    { id: 3, text: 'Infinite loop', pointDelta: -5, category: 2, sortKey: 0, explanation: '' } as RubricComment,
  ];
}

describe('useRubricCommentStore', () => {
  beforeEach(() => {
    useRubricCommentStore.getState().reset();
  });

  describe('initializeComments', () => {
    it('should populate comments and statuses from array', () => {
      useRubricCommentStore.getState().initializeComments(createComments());

      const state = useRubricCommentStore.getState();
      expect(Object.keys(state.comments)).toHaveLength(3);
      expect(state.comments[1].text).toBe('Missing semicolon');
      expect(state.statuses[1]).toBe(STATUS_NONE);
      expect(state.statuses[2]).toBe(STATUS_NONE);
    });

    it('should deep clone comments', () => {
      const comments = createComments();
      useRubricCommentStore.getState().initializeComments(comments);

      comments[0].text = 'MUTATED';
      expect(useRubricCommentStore.getState().comments[1].text).toBe('Missing semicolon');
    });
  });

  describe('updateComment', () => {
    it('should update a single field on an existing comment', () => {
      useRubricCommentStore.getState().initializeComments(createComments());

      const updated = useRubricCommentStore.getState().updateComment(1, 'text', 'Updated text');

      expect(updated).toBeDefined();
      expect(updated!.text).toBe('Updated text');
      expect(useRubricCommentStore.getState().comments[1].text).toBe('Updated text');
    });

    it('should preserve other fields when updating one field', () => {
      useRubricCommentStore.getState().initializeComments(createComments());

      useRubricCommentStore.getState().updateComment(1, 'text', 'New text');

      expect(useRubricCommentStore.getState().comments[1].pointDelta).toBe(-1);
    });

    it('should return undefined for unknown comment without propsComments', () => {
      useRubricCommentStore.getState().initializeComments(createComments());

      const result = useRubricCommentStore.getState().updateComment(999, 'text', 'val');
      expect(result).toBeUndefined();
    });

    it('should auto-create from propsComments if not in store', () => {
      const props = createComments();
      // Do NOT initialize — store is empty
      const result = useRubricCommentStore.getState().updateComment(1, 'text', 'From props', props);

      expect(result).toBeDefined();
      expect(result!.text).toBe('From props');
      expect(useRubricCommentStore.getState().comments[1]).toBeDefined();
    });
  });

  describe('setStatus', () => {
    it('should set the status for a comment', () => {
      useRubricCommentStore.getState().initializeComments(createComments());
      useRubricCommentStore.getState().setStatus(1, STATUS_UNSAVED);

      expect(useRubricCommentStore.getState().statuses[1]).toBe(STATUS_UNSAVED);
    });
  });

  describe('getComment', () => {
    it('should return stored comment', () => {
      useRubricCommentStore.getState().initializeComments(createComments());

      const comment = useRubricCommentStore.getState().getComment(2);
      expect(comment?.text).toBe('Good variable names');
    });

    it('should fall back to propsComments if not stored', () => {
      const props = createComments();
      const comment = useRubricCommentStore.getState().getComment(3, props);

      expect(comment?.text).toBe('Infinite loop');
    });

    it('should return undefined when not found anywhere', () => {
      expect(useRubricCommentStore.getState().getComment(999)).toBeUndefined();
    });
  });

  describe('syncFromProps', () => {
    it('should update non-unsaved comments from props', () => {
      useRubricCommentStore.getState().initializeComments(createComments());

      const updatedProps = createComments();
      updatedProps[0].text = 'Server-updated text';
      useRubricCommentStore.getState().syncFromProps(updatedProps);

      expect(useRubricCommentStore.getState().comments[1].text).toBe('Server-updated text');
    });

    it('should preserve unsaved comments and NOT overwrite from props', () => {
      useRubricCommentStore.getState().initializeComments(createComments());
      useRubricCommentStore.getState().updateComment(1, 'text', 'User edit');
      useRubricCommentStore.getState().setStatus(1, STATUS_UNSAVED);

      const updatedProps = createComments();
      updatedProps[0].text = 'Server update should be ignored';
      useRubricCommentStore.getState().syncFromProps(updatedProps);

      expect(useRubricCommentStore.getState().comments[1].text).toBe('User edit');
    });

    it('should add new comments that appeared in props', () => {
      useRubricCommentStore.getState().initializeComments(createComments().slice(0, 2));

      const allProps = createComments();
      useRubricCommentStore.getState().syncFromProps(allProps);

      expect(useRubricCommentStore.getState().statuses[3]).toBe(STATUS_NONE);
    });
  });

  describe('reset', () => {
    it('should clear all comments and statuses', () => {
      useRubricCommentStore.getState().initializeComments(createComments());
      useRubricCommentStore.getState().reset();

      const state = useRubricCommentStore.getState();
      expect(Object.keys(state.comments)).toHaveLength(0);
      expect(Object.keys(state.statuses)).toHaveLength(0);
    });
  });
});
