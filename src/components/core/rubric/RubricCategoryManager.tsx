// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable react-refresh/only-export-components */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { InputRef } from 'antd';
import cloneDeep from 'lodash/cloneDeep';

import withWindowWatcher, { IWithWindowWatcherProps } from '../withWindowWatcher';

import { RubricCategory, RubricComment } from '../../../api-client';

import { DIRECTION } from '../../../types/common';
import { STATUS, statusChange } from '../../admin/assignments/rubric/RubricUtils';

import { IFeedbackScore } from '../../../stores/useRubricStore';
import { useRubricCommentStore } from '../../../stores/useRubricCommentStore';

export interface IRubricCategoryManagerParams {
  propz: IRubricCategoryManagerProps;
  statez: IRubricCategoryManagerState;
  helperz: IRubricCategoryManagerHelpers;
}

export interface IRubricCategoryManagerState {
  /* local rubric category data */
  name: string;
  pointLimit: number | null;
  helpText: string;
  atMostOnce: boolean;
  status: STATUS;

  /* local rubric comment data - NOW FROM ZUSTAND STORE */
  rubricComments: Record<number, RubricComment>;
  rubricCommentStatus: Record<number, STATUS>;

  /* validation status */
  hasError: boolean;
  errorMessage: string;
  hasCommentError: boolean;
  commentErrorMessage: string;
}

export interface IRubricCategoryManagerProps extends IWithWindowWatcherProps {
  // data
  rubricCategory: RubricCategory;
  rubricComments: RubricComment[];
  index: number;
  numCategories: number;
  instanceLists: Record<number, number[]>;

  // saved data
  savedRubricCategory?: RubricCategory;
  savedRubricComments?: RubricComment[];

  // RubricCategory functions
  updateCategory: (rCategory: RubricCategory, hasError?: boolean) => void;
  deleteCategory: (rCategory: RubricCategory) => void;
  moveCategory: (rCategory: RubricCategory, direction: DIRECTION) => void;

  // RubricComment functions
  addComment: (rCategory: RubricCategory) => void;
  deleteComment: (rComment: RubricComment) => void;
  updateComment: (rComment: RubricComment) => void;
  activateCommentExplorer: (rComment: RubricComment) => void;

  // misc
  onEdit: (obj: RubricCategory) => void;
  onUndo: (obj: RubricCategory) => void;
  onCommentEdit: (obj: RubricComment) => void;
  onCommentUndo: (obj: RubricComment) => void;
  onCommentDragEnd: (...args: unknown[]) => void;
  otherCategories: RubricCategory[];
  feedbackScores?: Record<number, IFeedbackScore>;
  commentFeedbackOn: boolean;
  showPointLimits: boolean;
  showHelpText: boolean;
  showExplanations: boolean;
  showInstructions: boolean;
  showAtMostOnce: boolean;

  children: (params: IRubricCategoryManagerParams) => React.ReactNode;
}

export interface IRubricCategoryManagerHelpers {
  buildLocalRubricCommentsStructure: (comments: RubricComment[]) => Record<number, RubricComment>;
  initializeRubricCommentStatus: (comments: RubricComment[]) => Record<number, STATUS>;
  updateCategoryStatus: () => void;
  setValue: (label: 'pointLimit' | 'atMostOnce' | 'name' | 'helpText', value: unknown) => void;
  validateCategory: (
    name: string,
    helpText: string,
    pointLimit: number | null,
  ) => {
    valid: boolean;
    message: string;
  };
  saveCategory: () => void;
  changeName: (event: React.ChangeEvent<HTMLInputElement> | string) => void;
  changeHelpText: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  addComment: () => void;
  deleteComment: (rubricComment: RubricComment) => void;
  validateComments: (comment: RubricComment) => { valid: boolean; message: string };
  saveComment: (rubricCommentID: number, overrideComment?: RubricComment) => void;
  updateCommentStatus: (rubricComment: RubricComment) => void;
  updateRubricComment: (rubricCommentID: number, key: string, event: unknown) => void;
  nameInput: React.RefObject<InputRef | null>;
}

const RubricCategoryManager: React.FC<IRubricCategoryManagerProps> = (props) => {
  const { rubricCategory, rubricComments, savedRubricCategory, savedRubricComments } = props;

  // Zustand store for rubric comments - synchronous access!
  const store = useRubricCommentStore();
  const storeComments = useRubricCommentStore((s) => s.comments);
  const storeStatuses = useRubricCommentStore((s) => s.statuses);

  const buildLocalRubricCommentsStructure = useCallback((comments: RubricComment[]) => {
    const toRet: Record<number, RubricComment> = {};
    for (const rubricComment of comments) {
      toRet[rubricComment.id] = cloneDeep(rubricComment);
    }
    return toRet;
  }, []);

  const initializeRubricCommentStatus = useCallback((comments: RubricComment[]) => {
    const toRet: Record<number, STATUS> = {};
    for (const rubricComment of comments) {
      toRet[rubricComment.id] = STATUS.NONE;
    }
    return toRet;
  }, []);

  // Initialize store on mount
  useEffect(() => {
    store.initializeComments(rubricComments);
    // Cleanup on unmount
    return () => {
      // Don't reset on unmount - other components might be using the store
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Component state - now WITHOUT rubricComments and rubricCommentStatus
  const [categoryState, setCategoryState] = useState(() => ({
    name: rubricCategory.name,
    pointLimit: rubricCategory.pointLimit ?? null,
    helpText: rubricCategory.helpText ? rubricCategory.helpText : '',
    atMostOnce: rubricCategory.atMostOnce ?? false,
    status: typeof savedRubricCategory === 'undefined' ? STATUS.UNSAVED : STATUS.NONE,
    hasError: false,
    errorMessage: '',
    hasCommentError: false,
    commentErrorMessage: '',
  }));

  // Derive full state from categoryState + store
  const state: IRubricCategoryManagerState = useMemo(
    () => ({
      ...categoryState,
      rubricComments: storeComments,
      rubricCommentStatus: storeStatuses,
    }),
    [categoryState, storeComments, storeStatuses],
  );

  const nameInput = useRef<InputRef>(null);

  useEffect(() => {
    if (rubricCategory.id < 0) {
      const timer = window.setTimeout(() => {
        const node = nameInput.current;
        if (node && typeof node.focus === 'function') {
          try {
            node.focus();
          } catch {
            return;
          }
        }
      }, 100);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [rubricCategory.id]);

  const validateCategory = useCallback((name: string, helpText: string, pointLimit: number | null) => {
    if (name.length === 0) {
      return { valid: false, message: 'Category name cannot be blank.' };
    }

    if (name.length < 4) {
      return { valid: false, message: 'Category name must be at least 4 characters' };
    }

    if (name.length > 72) {
      return { valid: false, message: 'Category name cannot exceed 72 characters' };
    }

    if (helpText.length > 500) {
      return { valid: false, message: 'Helptext cannot exceed 500 characters' };
    }

    if (pointLimit !== null && !Number.isInteger(pointLimit)) {
      return { valid: false, message: 'pointLimit must be a valid integer.' };
    }

    return { valid: true, message: '' };
  }, []);

  const validateComments = useCallback((_newComment: RubricComment) => {
    return { valid: true, message: '' };
  }, []);

  const updateCategoryStatus = useCallback(() => {
    if (!savedRubricCategory) {
      return;
    }

    const { name, pointLimit, helpText, atMostOnce, status } = categoryState;

    const newStatus = statusChange(
      [
        savedRubricCategory.name,
        savedRubricCategory.pointLimit,
        savedRubricCategory.helpText,
        savedRubricCategory.atMostOnce,
      ],
      [name, pointLimit, helpText, atMostOnce],
      status,
    );

    if (newStatus !== status) {
      if (newStatus === STATUS.UNSAVED) {
        setCategoryState((prev) => ({ ...prev, status: STATUS.UNSAVED }));
        props.onEdit(props.rubricCategory);
      } else if (newStatus === STATUS.NONE) {
        setCategoryState((prev) => ({ ...prev, status: STATUS.NONE }));
        props.onUndo(props.rubricCategory);
      }
    }
  }, [savedRubricCategory, categoryState, props]);

  const updateCommentStatus = useCallback(
    (rubricComment: RubricComment) => {
      if (!savedRubricComments) {
        return;
      }

      const savedComment = savedRubricComments.find((el) => el.id === rubricComment.id);
      const hasChanged =
        savedComment &&
        (savedComment.text !== rubricComment.text ||
          savedComment.pointDelta !== rubricComment.pointDelta ||
          savedComment.explanation !== rubricComment.explanation ||
          savedComment.instructionText !== rubricComment.instructionText ||
          savedComment.templateTextOn !== rubricComment.templateTextOn);

      const currentStatus = storeStatuses[rubricComment.id] ?? STATUS.NONE;

      if (rubricComment.id < 0) {
        if (currentStatus !== STATUS.UNSAVED) {
          store.setStatus(rubricComment.id, STATUS.UNSAVED);
          props.onCommentEdit(rubricComment);
        }
      } else if (hasChanged && currentStatus !== STATUS.UNSAVED) {
        store.setStatus(rubricComment.id, STATUS.UNSAVED);
        props.onCommentEdit(rubricComment);
      } else if (!hasChanged && currentStatus !== STATUS.NONE && rubricComment.id > 0) {
        store.setStatus(rubricComment.id, STATUS.NONE);
        props.onCommentUndo(rubricComment);
      }
    },
    [savedRubricComments, props, store, storeStatuses],
  );

  const setValue = useCallback((label: 'pointLimit' | 'atMostOnce' | 'name' | 'helpText', value: unknown) => {
    setCategoryState((prev) => ({ ...prev, [label]: value }));
  }, []);

  const saveCategory = useCallback(() => {
    const { name, pointLimit, helpText, atMostOnce, hasError } = categoryState;

    const { valid, message } = validateCategory(name, helpText, pointLimit);
    const hasCurrentError = hasError || categoryState.hasCommentError;

    if (hasCurrentError && valid) {
      props.updateCategory(props.rubricCategory, false);
    } else if (!hasCurrentError && !valid) {
      props.updateCategory(props.rubricCategory, true);
    }

    setCategoryState((prev) => ({
      ...prev,
      hasError: !valid,
      errorMessage: message,
    }));

    props.updateCategory({
      ...props.rubricCategory,
      name,
      pointLimit,
      helpText,
      atMostOnce,
    });
  }, [categoryState, props, validateCategory]);

  const changeName = useCallback((event: React.ChangeEvent<HTMLInputElement> | string) => {
    const name = typeof event === 'string' ? event : event.target.value;
    setCategoryState((prev) => ({ ...prev, name }));
  }, []);

  const changeHelpText = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCategoryState((prev) => ({ ...prev, helpText: event.target.value }));
  }, []);

  const addComment = useCallback(() => {
    props.addComment(props.rubricCategory);
  }, [props]);

  const deleteComment = useCallback(
    (rubricComment: RubricComment) => {
      props.deleteComment(rubricComment);
    },
    [props],
  );

  const saveComment = useCallback<IRubricCategoryManagerHelpers['saveComment']>(
    (rubricCommentID, overrideComment) => {
      // Use store's synchronous getComment
      const localComment = overrideComment ?? store.getComment(rubricCommentID, rubricComments);
      if (!localComment) {
        return;
      }

      const match = props.rubricComments.find((el) => el.id === localComment.id);
      if (!match) {
        return;
      }

      let workingComment: RubricComment = localComment;
      let pointDelta = parseFloat(workingComment.pointDelta.toFixed(1));
      const text = workingComment.text;

      if (Number.isNaN(workingComment.pointDelta) || workingComment.pointDelta === null) {
        workingComment = { ...workingComment, pointDelta: 0 };
        pointDelta = 0;
      }

      const { valid, message } = validateComments(workingComment);
      updateCommentStatus(workingComment);
      props.updateComment({ ...workingComment });

      if (
        text !== match.text ||
        pointDelta !== match.pointDelta ||
        workingComment.explanation !== match.explanation ||
        workingComment.instructionText !== match.instructionText ||
        workingComment.templateTextOn !== match.templateTextOn
      ) {
        const hasCurrentError = categoryState.hasError || categoryState.hasCommentError;
        if (hasCurrentError && !categoryState.hasError && valid) {
          props.updateCategory(props.rubricCategory, false);
        } else if (!hasCurrentError && !valid) {
          props.updateCategory(props.rubricCategory, true);
        }
      }

      setCategoryState((prev) => {
        if (prev.hasCommentError === !valid && prev.commentErrorMessage === message) {
          return prev;
        }
        return {
          ...prev,
          hasCommentError: !valid,
          commentErrorMessage: message,
        };
      });

      updateCommentStatus(workingComment);
    },
    [props, updateCommentStatus, validateComments, categoryState, store, rubricComments],
  );

  // Refs for callbacks used in updateRubricComment
  const updateCommentStatusRef = useRef(updateCommentStatus);
  const saveCommentRef = useRef(saveComment);

  const updateRubricComment = useCallback<IRubricCategoryManagerHelpers['updateRubricComment']>(
    (rubricCommentID, key, event) => {
      // Calculate next value
      let nextValue: unknown = event;

      // Get current comment from store (synchronous!)
      const currentComment = store.getComment(rubricCommentID, rubricComments);
      if (!currentComment) {
        return;
      }

      if (event === null || typeof event === 'undefined') {
        nextValue = key === 'pointDelta' ? currentComment.pointDelta : '';
      } else if (typeof event === 'object') {
        const maybeTarget = event as { target?: { value?: unknown } };
        if (maybeTarget.target && 'value' in maybeTarget.target) {
          nextValue = maybeTarget.target.value;
        }
      } else if (typeof event === 'boolean' || typeof event === 'string') {
        if (key === 'pointDelta') {
          nextValue = currentComment.pointDelta;
        }
        // For string values like 'explanation' or 'instructionText', nextValue is already set to event
      }

      if (key === 'pointDelta') {
        const numericValue = typeof nextValue === 'number' ? nextValue : Number(nextValue);
        nextValue = Number.isNaN(numericValue) ? currentComment.pointDelta : numericValue;
      }

      // Update store synchronously - this returns the updated comment!
      const updatedComment = store.updateComment(rubricCommentID, key, nextValue, rubricComments);

      if (!updatedComment) {
        return;
      }

      // Save immediately with the synchronously-updated comment
      if (key === 'text') {
        updateCommentStatusRef.current?.(updatedComment);
        saveCommentRef.current?.(rubricCommentID, updatedComment);
      } else {
        saveCommentRef.current?.(rubricCommentID, updatedComment);
      }
    },
    [store, rubricComments],
  );

  useEffect(() => {
    updateCommentStatusRef.current = updateCommentStatus;
  }, [updateCommentStatus]);

  useEffect(() => {
    saveCommentRef.current = saveComment;
  }, [saveComment]);

  useEffect(() => {
    if (savedRubricCategory) {
      updateCategoryStatus();
    }
  }, [
    savedRubricCategory,
    categoryState.name,
    categoryState.pointLimit,
    categoryState.helpText,
    categoryState.atMostOnce,
    updateCategoryStatus,
  ]);

  const autoSaveRef = useRef({ pointLimit: categoryState.pointLimit, atMostOnce: categoryState.atMostOnce });
  useEffect(() => {
    const prevValues = autoSaveRef.current;
    if (prevValues.pointLimit !== categoryState.pointLimit || prevValues.atMostOnce !== categoryState.atMostOnce) {
      autoSaveRef.current = { pointLimit: categoryState.pointLimit, atMostOnce: categoryState.atMostOnce };
      saveCategory();
    }
  }, [saveCategory, categoryState.atMostOnce, categoryState.pointLimit]);

  const prevRubricCategoryRef = useRef<RubricCategory | null>(null);
  useEffect(() => {
    const prevRubricCategory = prevRubricCategoryRef.current;
    if (prevRubricCategory && prevRubricCategory !== rubricCategory) {
      setCategoryState((prev) => ({
        ...prev,
        name: rubricCategory.name,
        pointLimit: rubricCategory.pointLimit ?? null,
        helpText: rubricCategory.helpText ? rubricCategory.helpText : '',
        atMostOnce: rubricCategory.atMostOnce ?? false,
      }));
    }
    prevRubricCategoryRef.current = rubricCategory;
  }, [rubricCategory]);

  // Sync store from props when rubricComments change
  const prevRubricCommentsRef = useRef<RubricComment[] | null>(null);
  useEffect(() => {
    const prevRubricComments = prevRubricCommentsRef.current;
    if (prevRubricComments && prevRubricComments !== rubricComments) {
      store.syncFromProps(rubricComments);
    }
    prevRubricCommentsRef.current = rubricComments;
  }, [rubricComments, store]);

  // Update comment statuses when savedRubricComments change
  const prevSavedRubricCommentsRef = useRef<RubricComment[] | undefined>(savedRubricComments);
  useEffect(() => {
    if (savedRubricComments && savedRubricComments !== prevSavedRubricCommentsRef.current) {
      Object.values(storeComments).forEach((comment) => {
        updateCommentStatus(comment);
      });
    }
    prevSavedRubricCommentsRef.current = savedRubricComments;
  }, [savedRubricComments, updateCommentStatus, storeComments]);

  const helpers: IRubricCategoryManagerHelpers = useMemo(
    () => ({
      buildLocalRubricCommentsStructure,
      initializeRubricCommentStatus,
      updateCategoryStatus,
      setValue,
      validateCategory,
      saveCategory,
      changeName,
      changeHelpText,
      addComment,
      deleteComment,
      validateComments,
      saveComment,
      updateCommentStatus,
      updateRubricComment,
      nameInput,
    }),
    [
      addComment,
      changeHelpText,
      changeName,
      deleteComment,
      nameInput,
      saveCategory,
      saveComment,
      setValue,
      updateCategoryStatus,
      updateCommentStatus,
      updateRubricComment,
      validateCategory,
      validateComments,
      buildLocalRubricCommentsStructure,
      initializeRubricCommentStatus,
    ],
  );

  const params: IRubricCategoryManagerParams = useMemo(
    () => ({
      propz: props,
      statez: state,
      helperz: helpers,
    }),
    [helpers, props, state],
  );

  return <>{props.children(params)}</>;
};

export default withWindowWatcher(RubricCategoryManager);
