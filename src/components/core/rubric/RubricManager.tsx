/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

/* antd imports */
import { message, notification, Badge as AntBadge } from 'antd';
import { osControlKey } from '../operatingSystem';

/* other library imports */
import { arrayMoveImmutable as arrayMove } from 'array-move';
import _ from 'lodash';

import { assignmentsApi, rubricCategoriesApi, rubricCommentsApi, commentsApi } from '../../../api-client/clients';
import { RubricCategory, RubricComment } from '../../../api-client';
import { RubricFullData, RubricCommentInstanceList } from '../../../types/rubric';
import { SubmissionInfoType } from '../../../types/models';

import { DIRECTION, IRubricCategoryToRubricCommentsMap, Assignment } from '../../../types/common';
import { useRubricStore, RESOLUTION, IFeedbackScore } from '../../../stores/useRubricStore';

/**********************************************************************************************************************/

// Re-export for backwards compatibility
export { RESOLUTION };

export interface IRubricManagerParams {
  props: IRubricManagerProps;
  state: IRubricManagerState;
  helpers: IRubricManagerHelpers;
}

export interface IRubricManagerHelpers {
  loadAssignmentRubric: (
    assignment: Assignment,
    shouldLoadInstances: boolean,
    shouldLoadFeedback: boolean,
  ) => Promise<void>;
  loadFeedbackScores: (rubricComments: RubricComment[]) => Promise<void>;
  loadInstanceLists: (rubricComments: RubricComment[]) => Promise<Record<number, number[]>>;
  resetRubric: () => void;
  setNewRubric: (categories: RubricCategory[], comments: IRubricCategoryToRubricCommentsMap) => void;
  replaceRubric: (categories: RubricCategory[], comments: IRubricCategoryToRubricCommentsMap) => void;
  onCategoryEdit: (category: RubricCategory) => void;
  onCategoryUndo: (category: RubricCategory) => void;
  onCommentEdit: (comment: RubricComment) => void;
  onCommentUndo: (comment: RubricComment) => void;
  saveRubric: (
    categories: RubricCategory[],
    comments: IRubricCategoryToRubricCommentsMap,
    unsavedComments: RubricComment[],
    deletedComments: RubricComment[],
    unsavedCategories: RubricCategory[],
    deletedCategories: RubricCategory[],
    resolved: Record<number, RESOLUTION>,
    demoMode?: boolean,
  ) => Promise<{ rubricCategories: RubricCategory[]; rubricComments: IRubricCategoryToRubricCommentsMap }>;
  deleteLinkedComments: (rubricComment: RubricComment) => Promise<unknown[]>;
  unlinkLinkedComments: (rubricComment: RubricComment) => Promise<unknown[]>;
  buildLinkedList: (
    deletedComments: RubricComment[],
    editedComments: RubricComment[],
    resolved: Record<number, RESOLUTION>,
    instanceLists: Record<number, number[]>,
  ) => { edited: RubricComment[]; deleted: RubricComment[] };
  onSave: (fnc?: (rubric: any) => void, demoMode?: boolean) => Promise<void>;
  buildCommentMap: (categories: RubricCategory[], comments: RubricComment[]) => IRubricCategoryToRubricCommentsMap;
  moveCategory: (category: RubricCategory, direction: DIRECTION) => void;
  updateRubricCategory: (category: RubricCategory, hasError?: boolean) => void;
  deleteRubricCategory: (category: RubricCategory) => void;
  addRubricCategory: (name?: string) => void;
  updateRubricComment: (comment: RubricComment) => void;
  deleteRubricComment: (comment: RubricComment) => void;
  addRubricComment: (category: RubricCategory) => void;
  onLinkedAlertCancel: () => void;
  onLinkedCommentsResolve: (comment: RubricComment, resolution: RESOLUTION, fnc?: (rubric: any) => void) => void;
  onLinkedConfirmCancel: () => void;
  onLinkedConfirmAccept: (fnc?: (rubric: any) => void) => void;
  onBack: () => void;
  onUnload: (event: BeforeUnloadEvent) => void;
  toggleLock: () => void;
  changesMade: () => boolean;
  activateCommentExplorer: (comment: RubricComment) => void;
  clearCommentExplorer: () => void;
  onCommentDragEnd: (result: {
    destination?: { droppableId: string; index: number } | null;
    source: { index: number };
  }) => void;
}

export interface IRubricManagerProps {
  assignment: Assignment;
  submissions: SubmissionInfoType[];
  shouldLoadFeedback: boolean;
  shouldLoadInstanceLists: boolean;
  onCancel: () => void;
  reloadInterval?: number;
  setRubric?: (rubric: {
    rubricCategories: RubricCategory[];
    rubricComments: IRubricCategoryToRubricCommentsMap;
  }) => void;
  rubricCategories?: RubricCategory[];
  rubricComments?: IRubricCategoryToRubricCommentsMap;
  children: (params: IRubricManagerParams) => React.ReactNode;
  defaultRubric?: IRubric;
}

export interface IRubric {
  categories: RubricCategory[];
  comments: RubricComment[];
}

export interface IRubricManagerState {
  loadComplete: boolean;
  changeLock: boolean;
  isSaving: boolean;
  errorObjects: number[];
  unsavedComments: RubricComment[];
  deletedComments: RubricComment[];
  unsavedCategories: RubricCategory[];
  deletedCategories: RubricCategory[];
  hasMoved: boolean;
  activeComment?: RubricComment;
  linkedComments: RubricComment[];
  resolutions: Record<number, RESOLUTION>;
  confirmedPropagation: boolean;
  showConfirmDialog: boolean;
  rubricCategories: RubricCategory[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  savedRubricCategories: RubricCategory[];
  savedRubricComments: IRubricCategoryToRubricCommentsMap;
  newObjectCounter: number;
  feedbackScores?: Record<number, IFeedbackScore>;
  instanceLists: Record<number, number[]>;
}

/**********************************************************************************************************************/

const RubricManager: React.FC<IRubricManagerProps> = (props) => {
  const store = useRubricStore();

  // Interval ref for reloading
  const intervalRef = useRef<number | undefined>(undefined);

  // Build comment map utility
  const buildCommentMap = useCallback(
    (categories: RubricCategory[], comments: RubricComment[]): IRubricCategoryToRubricCommentsMap => {
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
    [],
  );

  // Load feedback scores
  const loadFeedbackScores = useCallback(
    async (rubricComments: RubricComment[]) => {
      const newMap: Record<number, IFeedbackScore> = {};
      for (const rComment of rubricComments) {
        if (rComment.id > 0) {
          const score = (await rubricCommentsApi.feedbackScoreRetrieve({
            id: rComment.id,
          })) as unknown as IFeedbackScore;
          newMap[rComment.id] = {
            negative: score.negative,
            positive: score.positive,
          };
        }
      }
      store.setFeedbackScores(newMap);
    },
    [store],
  );

  // Load instance lists
  const loadInstanceLists = useCallback(
    async (rubricComments: RubricComment[]): Promise<Record<number, number[]>> => {
      const newMap: Record<number, number[]> = {};
      for (const rComment of rubricComments) {
        if (rComment.id > 0) {
          const list = (await rubricCommentsApi.retrieve({
            id: rComment.id,
          })) as unknown as RubricCommentInstanceList;
          newMap[rComment.id] = list.comments;
        } else {
          newMap[rComment.id] = [];
        }
      }
      store.setInstanceLists(newMap);
      return newMap;
    },
    [store],
  );

  // Load assignment rubric
  const loadAssignmentRubric = useCallback(
    async (assignment: Assignment, shouldLoadInstances: boolean, shouldLoadFeedback: boolean) => {
      try {
        const rubricRequest = await assignmentsApi.rubricRetrieve({ id: assignment.id });
        const rubric = rubricRequest as unknown as RubricFullData;
        const commentMap = buildCommentMap(rubric.rubricCategories, rubric.rubricComments);

        const categoriesChanged = !_.isEqual(store.savedRubricCategories, rubric.rubricCategories);
        const commentsChanged = !_.isEqual(store.savedRubricComments, commentMap);
        const shouldUpdateState = !store.loadComplete || categoriesChanged || commentsChanged;

        // Notify about new comments
        const oldComments = Object.values(store.rubricComments).flat();
        if (oldComments.length > 0) {
          for (const newComment of rubric.rubricComments) {
            const found = oldComments.find((el) => el.id === newComment.id);
            if (!found) {
              const category = rubric.rubricCategories.find((el) => el.id === newComment.category);
              notification.open({
                message: `New rubric comment in ${category ? category.name : ''}`,
                description: newComment.text,
              });
            }
          }
        }

        if (shouldUpdateState && props.setRubric) {
          props.setRubric({
            rubricCategories: rubric.rubricCategories,
            rubricComments: commentMap,
          });
        }

        if (shouldUpdateState) {
          store.initialize(rubric.rubricCategories, commentMap);

          if (shouldLoadFeedback) {
            loadFeedbackScores(rubric.rubricComments);
          }
          if (shouldLoadInstances) {
            loadInstanceLists(rubric.rubricComments);
          }
        }
      } catch (error) {
        console.error('Failed to load rubric:', error);
      }
    },
    [buildCommentMap, loadFeedbackScores, loadInstanceLists, props, store],
  );

  // Delete linked comments
  const deleteLinkedComments = useCallback(
    async (rubricComment: RubricComment) => {
      let comments: number[] = [];
      if (store.instanceLists[rubricComment.id]) {
        comments = store.instanceLists[rubricComment.id];
      } else {
        comments = (
          (await rubricCommentsApi.retrieve({
            id: rubricComment.id,
          })) as unknown as RubricCommentInstanceList
        ).comments;
      }

      const promises = comments.map((commentID) => commentsApi.destroy({ id: commentID }));
      return Promise.all(promises);
    },
    [store.instanceLists],
  );

  // Unlink linked comments
  const unlinkLinkedComments = useCallback(
    async (rubricComment: RubricComment) => {
      let comments: number[] = [];
      if (store.instanceLists[rubricComment.id]) {
        comments = store.instanceLists[rubricComment.id];
      } else {
        comments = (
          (await rubricCommentsApi.retrieve({
            id: rubricComment.id,
          })) as unknown as RubricCommentInstanceList
        ).comments;
      }

      const promises = comments.map((commentID) => {
        return commentsApi.partialUpdate({
          id: commentID,
          patchedComment: {
            // text: rubricComment.text,  // Wait, legacy commentIO.update accepted payload. commentsApi.partialUpdate expects PatchedComment
            // pointDelta: rubricComment.pointDelta, // Comment does not have pointDelta usually? Let's check model.
            // rubricComment: null,
            rubricComment: null,
          },
        });
      });
      return Promise.all(promises);
    },
    [store.instanceLists],
  );

  // Build linked list
  const buildLinkedList = useCallback(
    (
      deletedComments: RubricComment[],
      editedComments: RubricComment[],
      resolved: Record<number, RESOLUTION>,
      instanceLists: Record<number, number[]>,
    ) => {
      const deleted: RubricComment[] = [];
      const edited: RubricComment[] = [];

      for (const comment of deletedComments) {
        if (!Object.keys(resolved).includes(comment.id.toString())) {
          if (instanceLists[comment.id]?.length > 0) {
            deleted.push(comment);
          }
        }
      }

      for (const comment of editedComments) {
        if (!Object.keys(resolved).includes(comment.id.toString())) {
          if (instanceLists[comment.id]?.length > 0) {
            edited.push(comment);
          }
        }
      }

      return { edited, deleted };
    },
    [],
  );

  // Save rubric
  const saveRubric = useCallback(
    async (
      categories: RubricCategory[],
      comments: IRubricCategoryToRubricCommentsMap,
      unsavedComments: RubricComment[],
      deletedComments: RubricComment[],
      unsavedCategories: RubricCategory[],
      deletedCategories: RubricCategory[],
      resolved: Record<number, RESOLUTION>,
      demoMode?: boolean,
    ) => {
      // Create/update promises
      const promises = demoMode
        ? []
        : categories.map((category) => {
            if (category.id < 0) {
              const { id, ...payload } = category;
              return rubricCategoriesApi.create({ rubricCategory: payload as any }).then((newCategory) => {
                const commentList = comments[category.id];
                const innerPromises = commentList.map((comment) => {
                  const { id: cId, ...cPayload } = comment;
                  cPayload.category = newCategory.id;
                  return rubricCommentsApi.create({ rubricComment: cPayload as any });
                });
                return Promise.all(innerPromises);
              });
            } else {
              const categoryNeedsSaving = unsavedCategories.some((el) => el.id === category.id);
              let categoryPromise: Promise<unknown> = Promise.resolve();

              if (categoryNeedsSaving) {
                const { rubricComments: _unused, id, ...payload } = category;
                void _unused;
                categoryPromise = rubricCategoriesApi.partialUpdate({
                  id: category.id,
                  patchedRubricCategory: payload,
                });
              }

              const commentList = comments[category.id];
              // Ensure commentList exists
              if (!commentList) return categoryPromise;

              const commentPromises = commentList.map((comment) => {
                if (comment.id < 0) {
                  const { id: cId, ...cPayload } = comment;
                  return rubricCommentsApi.create({ rubricComment: cPayload as any });
                } else {
                  const commentNeedsSaving = unsavedComments.some((el) => el.id === comment.id);
                  if (commentNeedsSaving) {
                    const { category: _unused, id, ...payload } = comment;
                    void _unused;
                    return rubricCommentsApi.partialUpdate({
                      id: comment.id,
                      patchedRubricComment: payload,
                    });
                  }
                  return Promise.resolve();
                }
              });

              return Promise.all([...commentPromises, categoryPromise]);
            }
          });

      // Delete comments
      const deleteCommentPromises: Promise<any>[] = demoMode
        ? []
        : deletedComments.map((rubricComment) => {
            if (Object.keys(resolved).includes(rubricComment.id.toString())) {
              switch (resolved[rubricComment.id]) {
                case RESOLUTION.DELETE:
                  return deleteLinkedComments(rubricComment).then(() =>
                    rubricCommentsApi.destroy({ id: rubricComment.id }),
                  );
                case RESOLUTION.UNLINK:
                  return unlinkLinkedComments(rubricComment).then(() =>
                    rubricCommentsApi.destroy({ id: rubricComment.id }),
                  );
                default:
                  return Promise.resolve();
              }
            }
            return rubricCommentsApi.destroy({ id: rubricComment.id });
          });

      await Promise.all(deleteCommentPromises);

      // Delete categories
      const deleteCategoryPromises = demoMode
        ? []
        : deletedCategories.map((cat) => rubricCategoriesApi.destroy({ id: cat.id }));
      await Promise.all([...promises, ...deleteCategoryPromises]);

      // Retrieve updated rubric
      if (demoMode) {
        return { rubricCategories: categories, rubricComments: comments };
      }

      const newRubricRequest = await assignmentsApi.rubricRetrieve({ id: props.assignment.id });
      const newRubric = newRubricRequest as unknown as RubricFullData;
      const commentMap = buildCommentMap(newRubric.rubricCategories, newRubric.rubricComments);

      if (props.shouldLoadInstanceLists) {
        loadInstanceLists(newRubric.rubricComments);
      }
      if (props.shouldLoadFeedback) {
        loadFeedbackScores(newRubric.rubricComments);
      }

      return { rubricCategories: newRubric.rubricCategories, rubricComments: commentMap };
    },
    [buildCommentMap, deleteLinkedComments, loadFeedbackScores, loadInstanceLists, props, unlinkLinkedComments],
  );

  // On save - use getState() for fresh reads to avoid stale closures
  const onSave = useCallback(
    async (fnc?: (rubric: any) => void, demoMode?: boolean) => {
      const currentState = useRubricStore.getState();

      if (currentState.errorObjects.length > 0) {
        message.error('Fix all errors before saving.');
        return;
      }

      currentState.setIsSaving(true);

      const newLists = await loadInstanceLists(Object.values(currentState.rubricComments).flat());

      // Re-read state after async operation
      const stateAfterLoad = useRubricStore.getState();
      const conflicts = buildLinkedList(
        stateAfterLoad.deletedComments,
        stateAfterLoad.unsavedComments,
        stateAfterLoad.resolutions,
        newLists,
      );

      if (conflicts.deleted.length > 0) {
        stateAfterLoad.setLinkedComments(conflicts.deleted);
        stateAfterLoad.setIsSaving(false);
        return;
      }

      if (conflicts.edited.length > 0 && !stateAfterLoad.confirmedPropagation) {
        stateAfterLoad.setShowConfirmDialog(true);
        stateAfterLoad.setIsSaving(false);
        return;
      }

      const savedRubric = await saveRubric(
        stateAfterLoad.rubricCategories,
        stateAfterLoad.rubricComments,
        stateAfterLoad.unsavedComments,
        stateAfterLoad.deletedComments,
        stateAfterLoad.unsavedCategories,
        stateAfterLoad.deletedCategories,
        stateAfterLoad.resolutions,
        demoMode,
      );

      message.success('Rubric saved!');
      useRubricStore.getState().afterSave(savedRubric.rubricCategories, savedRubric.rubricComments);

      if (fnc) {
        fnc(savedRubric);
      }
    },
    [buildLinkedList, loadInstanceLists, saveRubric],
  );

  // Move category
  const moveCategory = useCallback(
    (category: RubricCategory, direction: DIRECTION) => {
      const index = store.rubricCategories.findIndex((x) => x.id === category.id);
      if (index === -1) return;

      let targetIndex = index;
      switch (direction) {
        case DIRECTION.Up:
          targetIndex = index === 0 ? 0 : index - 1;
          break;
        case DIRECTION.Down:
          targetIndex = index === store.rubricCategories.length - 1 ? index : index + 1;
          break;
      }

      if (targetIndex !== index) {
        store.moveCategory(category.id, targetIndex);
      }
    },
    [store],
  );

  // Add rubric category
  const addRubricCategory = useCallback(
    (name?: string) => {
      const payload = {
        id: -1, // Will be replaced by store
        name: name ?? '',
        pointLimit: null,
        assignment: props.assignment.id,
        rubricComments: [],
        sortKey: store.rubricCategories.length,
        helpText: '',
        atMostOnce: false,
      };
      store.addCategory(payload);
    },
    [props.assignment.id, store],
  );

  // Add rubric comment
  const addRubricComment = useCallback(
    (category: RubricCategory) => {
      const payload = {
        id: -1, // Will be replaced by store
        text: '',
        pointDelta: 0,
        category: category.id,
        // comments: [], // Generated RubricComment does not have comments field?
        sortKey: store.rubricComments[category.id]?.length ?? 0,
        explanation: '',
        instructionText: '',
        templateTextOn: false,
      } as unknown as RubricComment;
      store.addComment(category.id, payload);
    },
    [store],
  );

  // Set new rubric
  const setNewRubric = useCallback(
    (categories: RubricCategory[], comments: IRubricCategoryToRubricCommentsMap) => {
      store.initialize(categories, comments);
      onSave(undefined);
    },
    [onSave, store],
  );

  // Replace rubric
  const replaceRubric = useCallback(
    (categories: RubricCategory[], comments: IRubricCategoryToRubricCommentsMap) => {
      // Mark all saved items for deletion
      store.initialize(categories, comments);
      onSave(undefined);
    },
    [onSave, store],
  );

  // Linked comments resolution
  const onLinkedCommentsResolve = useCallback(
    (comment: RubricComment, resolution: RESOLUTION, fnc?: (rubric: any) => void) => {
      store.setResolution(comment.id, resolution);

      // If user has finished resolving all linked comments, trigger save
      const remainingLinked = store.linkedComments.filter((c) => c.id !== comment.id);
      if (remainingLinked.length === 0) {
        store.setLinkedComments([]);
        onSave(fnc);
      }
    },
    [onSave, store],
  );

  const onLinkedConfirmAccept = useCallback(
    (fnc?: (rubric: any) => void) => {
      store.setShowConfirmDialog(false);
      store.setConfirmedPropagation(true);
      onSave(fnc);
    },
    [onSave, store],
  );

  // On back
  const onBack = useCallback(() => {
    if (store.changesMade() && !store.changeLock) {
      const wantsToLeave = confirm(
        'You will lose your unsaved changes if you leave this page without saving. Are you sure you want to leave?',
      );
      if (wantsToLeave) {
        props.onCancel();
      }
    } else {
      props.onCancel();
    }
  }, [props, store]);

  // On unload
  const onUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (store.changesMade()) {
        event.returnValue = 'You have unsaved changes.';
      }
    },
    [store],
  );

  // Comment drag end
  const onCommentDragEnd = useCallback(
    (result: { destination?: { droppableId: string; index: number } | null; source: { index: number } }) => {
      if (!result.destination) return;
      if (result.source.index === result.destination.index) return;

      const categoryID = +result.destination.droppableId;
      const reorderedComments = arrayMove(
        store.rubricComments[categoryID],
        result.source.index,
        result.destination.index,
      );

      store.reorderComments(categoryID, reorderedComments);
    },
    [store],
  );

  // Initialize on mount
  useEffect(() => {
    window.addEventListener('beforeunload', onUnload);

    if (props.defaultRubric) {
      const commentMap = buildCommentMap(props.defaultRubric.categories, props.defaultRubric.comments);
      store.initialize(props.defaultRubric.categories, commentMap);
    } else {
      loadAssignmentRubric(props.assignment, props.shouldLoadInstanceLists, props.shouldLoadFeedback);
    }

    if (props.reloadInterval !== undefined && !props.defaultRubric) {
      intervalRef.current = window.setInterval(() => {
        loadAssignmentRubric(props.assignment, props.shouldLoadInstanceLists, props.shouldLoadFeedback);
      }, props.reloadInterval);
    }

    return () => {
      window.removeEventListener('beforeunload', onUnload);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle assignment change
  useEffect(() => {
    if (props.defaultRubric) {
      const commentMap = buildCommentMap(props.defaultRubric.categories, props.defaultRubric.comments);
      store.initialize(props.defaultRubric.categories, commentMap);
      return;
    }

    store.setLoadComplete(false);
    loadAssignmentRubric(props.assignment, props.shouldLoadInstanceLists, props.shouldLoadFeedback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.assignment.id]);

  // Handle reload interval change
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (props.reloadInterval !== undefined && !props.defaultRubric) {
      intervalRef.current = window.setInterval(() => {
        loadAssignmentRubric(props.assignment, props.shouldLoadInstanceLists, props.shouldLoadFeedback);
      }, props.reloadInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    loadAssignmentRubric,
    props.assignment,
    props.reloadInterval,
    props.shouldLoadFeedback,
    props.shouldLoadInstanceLists,
  ]);

  // Memoized helpers
  const helpers: IRubricManagerHelpers = useMemo(
    () => ({
      loadAssignmentRubric,
      loadFeedbackScores,
      loadInstanceLists,
      resetRubric: store.resetRubric,
      setNewRubric,
      replaceRubric,
      onCategoryEdit: store.onCategoryEdit,
      onCategoryUndo: store.onCategoryUndo,
      onCommentEdit: store.onCommentEdit,
      onCommentUndo: store.onCommentUndo,
      saveRubric,
      deleteLinkedComments,
      unlinkLinkedComments,
      buildLinkedList,
      onSave,
      buildCommentMap,
      moveCategory,
      updateRubricCategory: store.updateCategory,
      deleteRubricCategory: store.deleteCategory,
      addRubricCategory,
      updateRubricComment: store.updateComment,
      deleteRubricComment: store.deleteComment,
      addRubricComment,
      onLinkedAlertCancel: () => store.setLinkedComments([]),
      onLinkedCommentsResolve,
      onLinkedConfirmCancel: () => store.setShowConfirmDialog(false),
      onLinkedConfirmAccept,
      onBack,
      onUnload,
      toggleLock: store.toggleLock,
      changesMade: store.changesMade,
      activateCommentExplorer: store.setActiveComment,
      clearCommentExplorer: () => store.setActiveComment(undefined),
      onCommentDragEnd,
    }),
    [
      loadAssignmentRubric,
      loadFeedbackScores,
      loadInstanceLists,
      store,
      setNewRubric,
      replaceRubric,
      saveRubric,
      deleteLinkedComments,
      unlinkLinkedComments,
      buildLinkedList,
      onSave,
      buildCommentMap,
      moveCategory,
      addRubricCategory,
      addRubricComment,
      onLinkedCommentsResolve,
      onLinkedConfirmAccept,
      onBack,
      onUnload,
      onCommentDragEnd,
    ],
  );

  // Derive state from store
  const state: IRubricManagerState = useMemo(
    () => ({
      loadComplete: store.loadComplete,
      changeLock: store.changeLock,
      isSaving: store.isSaving,
      errorObjects: store.errorObjects,
      unsavedComments: store.unsavedComments,
      deletedComments: store.deletedComments,
      unsavedCategories: store.unsavedCategories,
      deletedCategories: store.deletedCategories,
      hasMoved: store.hasMoved,
      activeComment: store.activeComment,
      linkedComments: store.linkedComments,
      resolutions: store.resolutions,
      confirmedPropagation: store.confirmedPropagation,
      showConfirmDialog: store.showConfirmDialog,
      rubricCategories: store.rubricCategories,
      rubricComments: store.rubricComments,
      savedRubricCategories: store.savedRubricCategories,
      savedRubricComments: store.savedRubricComments,
      newObjectCounter: store.newObjectCounter,
      feedbackScores: store.feedbackScores,
      instanceLists: store.instanceLists,
    }),
    [store],
  );

  const params: IRubricManagerParams = useMemo(
    () => ({
      props,
      state,
      helpers,
    }),
    [helpers, props, state],
  );

  return <>{props.children(params)}</>;
};

export const RubricTooltip: React.FC<{ itemsApplied?: number }> = ({ itemsApplied }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>Rubric</span>
      {itemsApplied !== undefined && itemsApplied > 0 && (
        <AntBadge
          count={itemsApplied}
          style={{
            backgroundColor: '#fff',
            color: 'rgba(0,0,0,0.85)',
            boxShadow: '0 0 0 1px #d9d9d9 inset',
          }}
        />
      )}
      <span style={{ opacity: 0.7 }}>({osControlKey()} + Shift + G)</span>
    </div>
  );
};

export default React.memo(RubricManager);
