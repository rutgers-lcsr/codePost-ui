// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import cloneDeep from 'lodash/cloneDeep';

import { RubricCategory, RubricComment } from '../api-client';
import { IRubricCategoryToRubricCommentsMap } from '../types/common';

/**
 * Resolution options for linked comments when deleting rubric comments
 */
export enum RESOLUTION {
  DELETE,
  UNLINK,
}

export interface IFeedbackScore {
  negative: number;
  positive: number;
}

interface RubricStoreState {
  // Status
  loadComplete: boolean;
  changeLock: boolean;
  isSaving: boolean;
  errorObjects: number[];

  // Rubric data
  rubricCategories: RubricCategory[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  savedRubricCategories: RubricCategory[];
  savedRubricComments: IRubricCategoryToRubricCommentsMap;

  // Edit tracking
  unsavedComments: RubricComment[];
  deletedComments: RubricComment[];
  unsavedCategories: RubricCategory[];
  deletedCategories: RubricCategory[];
  hasMoved: boolean;

  // UI state
  activeComment?: RubricComment;
  linkedComments: RubricComment[];
  resolutions: Record<number, RESOLUTION>;
  confirmedPropagation: boolean;
  showConfirmDialog: boolean;

  // Misc
  newObjectCounter: number;
  feedbackScores?: Record<number, IFeedbackScore>;
  instanceLists: Record<number, number[]>;
}

interface RubricStoreActions {
  // Initialization
  initialize: (categories: RubricCategory[], comments: IRubricCategoryToRubricCommentsMap) => void;
  setLoadComplete: (complete: boolean) => void;
  setIsSaving: (saving: boolean) => void;

  // Category actions
  addCategory: (category: RubricCategory) => number;
  updateCategory: (category: RubricCategory, hasError?: boolean) => void;
  deleteCategory: (category: RubricCategory) => void;
  moveCategory: (categoryId: number, newIndex: number) => void;
  onCategoryEdit: (category: RubricCategory) => void;
  onCategoryUndo: (category: RubricCategory) => void;

  // Comment actions
  addComment: (categoryId: number, comment: RubricComment) => number;
  updateComment: (comment: RubricComment) => void;
  deleteComment: (comment: RubricComment) => void;
  reorderComments: (categoryId: number, comments: RubricComment[]) => void;
  onCommentEdit: (comment: RubricComment) => void;
  onCommentUndo: (comment: RubricComment) => void;

  // Save/Reset
  resetRubric: () => void;
  afterSave: (categories: RubricCategory[], comments: IRubricCategoryToRubricCommentsMap) => void;

  // UI state
  setActiveComment: (comment?: RubricComment) => void;
  setLinkedComments: (comments: RubricComment[]) => void;
  setResolution: (commentId: number, resolution: RESOLUTION) => void;
  setConfirmedPropagation: (confirmed: boolean) => void;
  setShowConfirmDialog: (show: boolean) => void;
  toggleLock: () => void;

  // Data
  setFeedbackScores: (scores: Record<number, IFeedbackScore>) => void;
  setInstanceLists: (lists: Record<number, number[]>) => void;

  // Getters
  changesMade: () => boolean;
  getCategory: (id: number) => RubricCategory | undefined;
  getComment: (id: number, categoryId: number) => RubricComment | undefined;
  buildCommentMap: (categories: RubricCategory[], comments: RubricComment[]) => IRubricCategoryToRubricCommentsMap;
}

type RubricStore = RubricStoreState & RubricStoreActions;

const initialState: RubricStoreState = {
  loadComplete: false,
  changeLock: true,
  isSaving: false,
  errorObjects: [],
  rubricCategories: [],
  rubricComments: {},
  savedRubricCategories: [],
  savedRubricComments: {},
  unsavedComments: [],
  deletedComments: [],
  unsavedCategories: [],
  deletedCategories: [],
  hasMoved: false,
  activeComment: undefined,
  linkedComments: [],
  resolutions: {},
  confirmedPropagation: false,
  showConfirmDialog: false,
  newObjectCounter: -1,
  feedbackScores: undefined,
  instanceLists: {},
};

export const useRubricStore = create<RubricStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Initialization
      initialize: (categories, comments) => {
        set(
          {
            rubricCategories: cloneDeep(categories),
            rubricComments: cloneDeep(comments),
            savedRubricCategories: cloneDeep(categories),
            savedRubricComments: cloneDeep(comments),
            loadComplete: true,
            unsavedComments: [],
            deletedComments: [],
            unsavedCategories: [],
            deletedCategories: [],
            hasMoved: false,
          },
          false,
          'initialize',
        );
      },

      setLoadComplete: (complete) => set({ loadComplete: complete }, false, 'setLoadComplete'),
      setIsSaving: (saving) => set({ isSaving: saving }, false, 'setIsSaving'),

      // Category actions
      addCategory: (category) => {
        const counter = get().newObjectCounter;
        const newCategory = { ...category, id: counter };
        set(
          (state) => ({
            rubricCategories: [...state.rubricCategories, newCategory],
            rubricComments: { ...state.rubricComments, [counter]: [] },
            unsavedCategories: [...state.unsavedCategories, newCategory],
            newObjectCounter: counter - 1,
          }),
          false,
          'addCategory',
        );
        return counter;
      },

      updateCategory: (category, hasError) => {
        set(
          (state) => {
            const index = state.rubricCategories.findIndex((c) => c.id === category.id);
            if (index === -1) return state;

            const newCategories = [...state.rubricCategories];
            newCategories[index] = category;

            let newErrorObjects = state.errorObjects;
            if (hasError !== undefined) {
              if (hasError) {
                newErrorObjects = [...state.errorObjects, category.id];
              } else {
                newErrorObjects = state.errorObjects.filter((id) => id !== category.id);
              }
            }

            return {
              rubricCategories: newCategories,
              errorObjects: newErrorObjects,
            };
          },
          false,
          'updateCategory',
        );
      },

      deleteCategory: (category) => {
        set(
          (state) => {
            const newCategories = state.rubricCategories.filter((c) => c.id !== category.id);
            const updates: Partial<RubricStoreState> = {
              rubricCategories: newCategories,
              errorObjects: state.errorObjects.filter((id) => id !== category.id),
              unsavedCategories: state.unsavedCategories.filter((c) => c.id !== category.id),
              unsavedComments: state.unsavedComments.filter(
                (c) => !state.rubricComments[category.id]?.some((rc) => rc.id === c.id),
              ),
            };

            if (category.id > 0) {
              updates.deletedCategories = [...state.deletedCategories, category];
            }

            return updates;
          },
          false,
          'deleteCategory',
        );
      },

      moveCategory: (categoryId, newIndex) => {
        set(
          (state) => {
            const oldIndex = state.rubricCategories.findIndex((c) => c.id === categoryId);
            if (oldIndex === -1 || oldIndex === newIndex) return state;

            const reordered = [...state.rubricCategories];
            const [moved] = reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, moved);

            // Update sortKeys
            const toAdd: RubricCategory[] = [];
            reordered.forEach((cat, i) => {
              if (cat.sortKey !== i) {
                cat.sortKey = i;
                toAdd.push(cat);
              }
            });

            if (toAdd.length === 0) return state;

            return {
              rubricCategories: reordered,
              unsavedCategories: [...state.unsavedCategories, ...toAdd],
              hasMoved: true,
            };
          },
          false,
          'moveCategory',
        );
      },

      onCategoryEdit: (category) => {
        set(
          (state) => ({
            unsavedCategories: state.unsavedCategories.some((c) => c.id === category.id)
              ? state.unsavedCategories
              : [...state.unsavedCategories, category],
          }),
          false,
          'onCategoryEdit',
        );
      },

      onCategoryUndo: (category) => {
        set(
          (state) => ({
            unsavedCategories: state.unsavedCategories.filter((c) => c.id !== category.id),
          }),
          false,
          'onCategoryUndo',
        );
      },

      // Comment actions
      addComment: (categoryId, comment) => {
        const counter = get().newObjectCounter;
        const newComment = { ...comment, id: counter };
        set(
          (state) => ({
            rubricComments: {
              ...state.rubricComments,
              [categoryId]: [...(state.rubricComments[categoryId] || []), newComment],
            },
            unsavedComments: [...state.unsavedComments, newComment],
            newObjectCounter: counter - 1,
          }),
          false,
          'addComment',
        );
        return counter;
      },

      updateComment: (comment) => {
        set(
          (state) => {
            const categoryComments = state.rubricComments[comment.category];
            if (!categoryComments) return state;

            const index = categoryComments.findIndex((c) => c.id === comment.id);
            if (index === -1) return state;

            const newComments = [...categoryComments];
            newComments[index] = comment;

            return {
              rubricComments: {
                ...state.rubricComments,
                [comment.category]: newComments,
              },
            };
          },
          false,
          'updateComment',
        );
      },

      deleteComment: (comment) => {
        set(
          (state) => {
            const categoryComments = state.rubricComments[comment.category];
            if (!categoryComments) return state;

            const newComments = categoryComments.filter((c) => c.id !== comment.id);
            const updates: Partial<RubricStoreState> = {
              rubricComments: {
                ...state.rubricComments,
                [comment.category]: newComments,
              },
              unsavedComments: state.unsavedComments.filter((c) => c.id !== comment.id),
            };

            if (comment.id > 0) {
              updates.deletedComments = [...state.deletedComments, comment];
            }

            return updates;
          },
          false,
          'deleteComment',
        );
      },

      reorderComments: (categoryId, comments) => {
        set(
          (state) => {
            const toAdd: RubricComment[] = [];
            comments.forEach((comm, i) => {
              if (comm.sortKey !== i) {
                comm.sortKey = i;
                if (!state.unsavedComments.some((c) => c.id === comm.id)) {
                  toAdd.push(comm);
                }
              }
            });

            return {
              rubricComments: {
                ...state.rubricComments,
                [categoryId]: comments,
              },
              unsavedComments: [...state.unsavedComments, ...toAdd],
              hasMoved: true,
            };
          },
          false,
          'reorderComments',
        );
      },

      onCommentEdit: (comment) => {
        set(
          (state) => ({
            unsavedComments: state.unsavedComments.some((c) => c.id === comment.id)
              ? state.unsavedComments
              : [...state.unsavedComments, comment],
          }),
          false,
          'onCommentEdit',
        );
      },

      onCommentUndo: (comment) => {
        set(
          (state) => ({
            unsavedComments: state.unsavedComments.filter((c) => c.id !== comment.id),
          }),
          false,
          'onCommentUndo',
        );
      },

      // Save/Reset
      resetRubric: () => {
        set(
          (state) => ({
            rubricCategories: cloneDeep(state.savedRubricCategories),
            rubricComments: cloneDeep(state.savedRubricComments),
            deletedCategories: [],
            deletedComments: [],
            unsavedCategories: [],
            unsavedComments: [],
            hasMoved: false,
            confirmedPropagation: false,
          }),
          false,
          'resetRubric',
        );
      },

      afterSave: (categories, comments) => {
        set(
          {
            rubricCategories: categories,
            rubricComments: comments,
            savedRubricCategories: cloneDeep(categories),
            savedRubricComments: cloneDeep(comments),
            unsavedComments: [],
            deletedComments: [],
            unsavedCategories: [],
            deletedCategories: [],
            hasMoved: false,
            confirmedPropagation: false,
            isSaving: false,
          },
          false,
          'afterSave',
        );
      },

      // UI state
      setActiveComment: (comment) => set({ activeComment: comment }, false, 'setActiveComment'),
      setLinkedComments: (comments) => set({ linkedComments: comments }, false, 'setLinkedComments'),
      setResolution: (commentId, resolution) => {
        set(
          (state) => ({
            resolutions: { ...state.resolutions, [commentId]: resolution },
          }),
          false,
          'setResolution',
        );
      },
      setConfirmedPropagation: (confirmed) =>
        set({ confirmedPropagation: confirmed }, false, 'setConfirmedPropagation'),
      setShowConfirmDialog: (show) => set({ showConfirmDialog: show }, false, 'setShowConfirmDialog'),
      toggleLock: () => set((state) => ({ changeLock: !state.changeLock }), false, 'toggleLock'),

      // Data
      setFeedbackScores: (scores) => set({ feedbackScores: scores }, false, 'setFeedbackScores'),
      setInstanceLists: (lists) => set({ instanceLists: lists }, false, 'setInstanceLists'),

      // Getters
      changesMade: () => {
        const state = get();
        return (
          state.unsavedCategories.length > 0 ||
          state.unsavedComments.length > 0 ||
          state.deletedComments.length > 0 ||
          state.deletedCategories.length > 0 ||
          state.hasMoved
        );
      },

      getCategory: (id) => get().rubricCategories.find((c) => c.id === id),

      getComment: (id, categoryId) => {
        const comments = get().rubricComments[categoryId];
        return comments?.find((c) => c.id === id);
      },

      buildCommentMap: (categories, comments) => {
        const map: IRubricCategoryToRubricCommentsMap = {};
        categories.forEach((cat) => {
          map[cat.id] = [];
        });
        comments.forEach((comment) => {
          if (map[comment.category]) {
            map[comment.category].push(comment);
          }
        });
        return map;
      },
    }),
    { name: 'rubric-store' },
  ),
);
