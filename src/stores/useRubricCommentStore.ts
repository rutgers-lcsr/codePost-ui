// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

import { RubricComment } from '../api-client';
import { STATUS } from '../components/admin/assignments/rubric/RubricUtils';

/**
 * Zustand store for rubric comment state management.
 * Replaces the fragile useState + stateRef pattern in RubricCategoryManager.
 *
 * Key benefits:
 * - Synchronous access via get() - no stale closure issues
 * - DevTools support for debugging
 * - Clean separation of state and actions
 */

interface RubricCommentStoreState {
  // State
  comments: Record<number, RubricComment>;
  statuses: Record<number, STATUS>;

  // Actions
  /**
   * Update a comment field. Returns the updated comment synchronously.
   */
  updateComment: (
    id: number,
    field: string,
    value: unknown,
    propsComments?: RubricComment[],
  ) => RubricComment | undefined;

  /**
   * Set the status for a comment
   */
  setStatus: (id: number, status: STATUS) => void;

  /**
   * Get a comment by ID, checking both store and fallback props
   */
  getComment: (id: number, propsComments?: RubricComment[]) => RubricComment | undefined;

  /**
   * Initialize the store with comments from props
   */
  initializeComments: (comments: RubricComment[]) => void;

  /**
   * Sync comments from props (for prop changes)
   */
  syncFromProps: (comments: RubricComment[]) => void;

  /**
   * Reset the store
   */
  reset: () => void;
}

export const useRubricCommentStore = create<RubricCommentStoreState>()(
  devtools(
    (set, get) => ({
      comments: {},
      statuses: {},

      updateComment: (id, field, value, propsComments) => {
        // Get current comment from store or props
        let current = get().comments[id];
        if (!current && propsComments) {
          const propComment = propsComments.find((c) => c.id === id);
          if (propComment) {
            current = cloneDeep(propComment);
          }
        }
        if (!current) return undefined;

        // Create updated comment
        const updated: RubricComment = {
          ...current,
          [field]: value,
        };

        // Update store synchronously
        set(
          (state) => ({
            comments: { ...state.comments, [id]: updated },
          }),
          false,
          'updateComment',
        );

        return updated;
      },

      setStatus: (id, status) => {
        set(
          (state) => ({
            statuses: { ...state.statuses, [id]: status },
          }),
          false,
          'setStatus',
        );
      },

      getComment: (id, propsComments) => {
        const stored = get().comments[id];
        if (stored) return stored;

        if (propsComments) {
          return propsComments.find((c) => c.id === id);
        }
        return undefined;
      },

      initializeComments: (comments) => {
        const map: Record<number, RubricComment> = {};
        const statuses: Record<number, STATUS> = {};

        comments.forEach((c) => {
          map[c.id] = cloneDeep(c);
          statuses[c.id] = STATUS.NONE;
        });

        set({ comments: map, statuses }, false, 'initialize');
      },

      syncFromProps: (comments) => {
        const currentComments = get().comments;
        const currentStatuses = get().statuses;
        const newComments = { ...currentComments };
        const newStatuses = { ...currentStatuses };

        comments.forEach((comment) => {
          // Only sync if not marked as UNSAVED (user is actively editing)
          if (currentStatuses[comment.id] !== STATUS.UNSAVED) {
            // Check if comment has actually changed
            if (!isEqual(currentComments[comment.id], comment)) {
              newComments[comment.id] = cloneDeep(comment);
            }
          }
          // Initialize status if not present
          if (newStatuses[comment.id] === undefined) {
            newStatuses[comment.id] = STATUS.NONE;
          }
        });

        set({ comments: newComments, statuses: newStatuses }, false, 'syncFromProps');
      },

      reset: () => {
        set({ comments: {}, statuses: {} }, false, 'reset');
      },
    }),
    { name: 'rubric-comments' },
  ),
);

// Selector hooks for common access patterns
export const useRubricComment = (id: number) => useRubricCommentStore((state) => state.comments[id]);

export const useRubricCommentStatus = (id: number) => useRubricCommentStore((state) => state.statuses[id]);
