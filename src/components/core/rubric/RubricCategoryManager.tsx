import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { InputRef } from 'antd';
import _ from 'lodash';

import withWindowWatcher, { IWithWindowWatcherProps } from '../withWindowWatcher';

import { RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import { DIRECTION } from '../../../types/common';
import { STATUS, statusChange } from '../../admin/assignments/rubric/RubricUtils';

import { IFeedbackScore } from './RubricManager';

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

  /* local rubric comment data */
  rubricComments: Record<number, RubricCommentType>;
  rubricCommentStatus: Record<number, STATUS>;

  /* validation status */
  hasError: boolean;
  errorMessage: string;
  hasCommentError: boolean;
  commentErrorMessage: string;
}

export interface IRubricCategoryManagerProps extends IWithWindowWatcherProps {
  // data
  rubricCategory: RubricCategoryType;
  rubricComments: RubricCommentType[];
  index: number;
  numCategories: number;
  instanceLists: Record<number, number[]>;

  // saved data
  savedRubricCategory?: RubricCategoryType;
  savedRubricComments?: RubricCommentType[];

  // RubricCategory functions
  updateCategory: (rCategory: RubricCategoryType, hasError?: boolean) => void;
  deleteCategory: (rCategory: RubricCategoryType) => void;
  moveCategory: (rCategory: RubricCategoryType, direction: DIRECTION) => void;

  // RubricComment functions
  addComment: (rCategory: RubricCategoryType) => void;
  deleteComment: (rComment: RubricCommentType) => void;
  updateComment: (rComment: RubricCommentType) => void;
  activateCommentExplorer: (rComment: RubricCommentType) => void;

  // misc
  onEdit: (obj: RubricCategoryType) => void;
  onUndo: (obj: RubricCategoryType) => void;
  onCommentEdit: (obj: RubricCommentType) => void;
  onCommentUndo: (obj: RubricCommentType) => void;
  onCommentDragEnd: (...args: unknown[]) => void;
  otherCategories: RubricCategoryType[];
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
  buildLocalRubricCommentsStructure: (comments: RubricCommentType[]) => Record<number, RubricCommentType>;
  initializeRubricCommentStatus: (comments: RubricCommentType[]) => Record<number, STATUS>;
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
  deleteComment: (rubricComment: RubricCommentType) => void;
  validateComments: (comment: RubricCommentType) => { valid: boolean; message: string };
  saveComment: (rubricCommentID: number, overrideComment?: RubricCommentType) => void;
  updateCommentStatus: (rubricComment: RubricCommentType) => void;
  updateRubricComment: (rubricCommentID: number, key: string, event: unknown) => void;
  nameInput: React.RefObject<InputRef>;
}

const RubricCategoryManager: React.FC<IRubricCategoryManagerProps> = (props) => {
  const { rubricCategory, rubricComments, savedRubricCategory, savedRubricComments } = props;

  const buildLocalRubricCommentsStructure = useCallback((comments: RubricCommentType[]) => {
    const toRet: Record<number, RubricCommentType> = {};
    for (const rubricComment of comments) {
      toRet[rubricComment.id] = _.cloneDeep(rubricComment);
    }
    return toRet;
  }, []);

  const initializeRubricCommentStatus = useCallback((comments: RubricCommentType[]) => {
    const toRet: Record<number, STATUS> = {};
    for (const rubricComment of comments) {
      toRet[rubricComment.id] = STATUS.NONE;
    }
    return toRet;
  }, []);

  const [state, setState] = useState<IRubricCategoryManagerState>(() => ({
    name: rubricCategory.name,
    pointLimit: rubricCategory.pointLimit,
    helpText: rubricCategory.helpText ? rubricCategory.helpText : '',
    atMostOnce: rubricCategory.atMostOnce,
    status: typeof savedRubricCategory === 'undefined' ? STATUS.UNSAVED : STATUS.NONE,
    rubricComments: buildLocalRubricCommentsStructure(rubricComments),
    rubricCommentStatus: initializeRubricCommentStatus(rubricComments),
    hasError: false,
    errorMessage: '',
    hasCommentError: false,
    commentErrorMessage: '',
  }));

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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

  const validateComments = useCallback((_newComment: RubricCommentType) => {
    return { valid: true, message: '' };
  }, []);

  const updateCategoryStatus = useCallback(() => {
    if (!savedRubricCategory) {
      return;
    }

    const snapshot = stateRef.current;
    if (!snapshot) {
      return;
    }

    const { name, pointLimit, helpText, atMostOnce, status } = snapshot;
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

    if (newStatus === status) {
      return;
    }

    setState((prev) => {
      const nextState = {
        ...prev,
        status: newStatus,
      };
      stateRef.current = nextState;
      return nextState;
    });

    if (newStatus === STATUS.UNSAVED) {
      props.onEdit(rubricCategory);
    } else if (newStatus === STATUS.NONE) {
      props.onUndo(rubricCategory);
    }
  }, [props, rubricCategory, savedRubricCategory]);

  const updateCategoryStatusRef = useRef<() => void>(updateCategoryStatus);

  useEffect(() => {
    updateCategoryStatusRef.current = updateCategoryStatus;
  }, [updateCategoryStatus]);

  const setValue = useCallback((label: string, value: any) => {
    let didUpdate = false;

    setState((prev) => {
      switch (label) {
        case 'pointLimit': {
          let newVal: number | null;
          if (value === '' || value === null || Number.isNaN(Number(value))) {
            newVal = null;
          } else {
            newVal = Number(value);
          }
          if (prev.pointLimit === newVal) {
            return prev;
          }
          const nextState = {
            ...prev,
            pointLimit: newVal,
          };
          stateRef.current = nextState;
          didUpdate = true;
          return nextState;
        }
        case 'atMostOnce': {
          const newVal = Boolean(value);
          if (prev.atMostOnce === newVal) {
            return prev;
          }
          const nextState = {
            ...prev,
            atMostOnce: newVal,
          };
          stateRef.current = nextState;
          didUpdate = true;
          return nextState;
        }
        case 'name': {
          if (prev.name === value) {
            return prev;
          }
          const nextState = {
            ...prev,
            name: value,
          };
          stateRef.current = nextState;
          didUpdate = true;
          return nextState;
        }
        case 'helpText': {
          if (prev.helpText === value) {
            return prev;
          }
          const nextState = {
            ...prev,
            helpText: value,
          };
          stateRef.current = nextState;
          didUpdate = true;
          return nextState;
        }
        default:
          return prev;
      }
    });

    if (didUpdate) {
      updateCategoryStatusRef.current?.();
    }
  }, []);

  const saveCategory = useCallback(() => {
    const currentState = stateRef.current;
    const { name, pointLimit, helpText, atMostOnce, hasCommentError, hasError } = currentState;

    const hasChanges =
      rubricCategory.id < 0 ||
      name !== rubricCategory.name ||
      pointLimit !== rubricCategory.pointLimit ||
      helpText !== (rubricCategory.helpText ? rubricCategory.helpText : '') ||
      atMostOnce !== rubricCategory.atMostOnce;

    if (hasChanges) {
      const { valid, message } = validateCategory(name, helpText, pointLimit);
      const payload: RubricCategoryType = {
        ...rubricCategory,
        name,
        pointLimit,
        helpText,
        atMostOnce,
      };

      props.updateCategory(payload, !valid || hasCommentError);

      setState((prev) => ({
        ...prev,
        hasError: !valid,
        errorMessage: message,
      }));
    } else if (hasError) {
      setState((prev) => ({
        ...prev,
        hasError: false,
        errorMessage: '',
      }));
    }
  }, [props, rubricCategory, validateCategory]);

  const changeName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | string) => {
      if (typeof event === 'string') {
        setValue('name', event);
      } else {
        setValue('name', event.target.value);
      }
    },
    [setValue],
  );

  const changeHelpText = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue('helpText', event.target.value);
    },
    [setValue],
  );

  const addComment = useCallback(() => {
    props.addComment(rubricCategory);
  }, [props, rubricCategory]);

  const deleteComment = useCallback(
    (rubricComment: RubricCommentType) => {
      props.deleteComment(rubricComment);
    },
    [props],
  );

  const updateCommentStatusRef = useRef<IRubricCategoryManagerHelpers['updateCommentStatus']>();
  const saveCommentRef = useRef<IRubricCategoryManagerHelpers['saveComment']>();

  const updateCommentStatus = useCallback<IRubricCategoryManagerHelpers['updateCommentStatus']>(
    (rubricComment) => {
      if (!savedRubricComments) {
        return;
      }

      const savedRubricComment = savedRubricComments.find((el) => el.id === rubricComment.id);
      if (!savedRubricComment) {
        return;
      }

      const snapshot = stateRef.current;
      if (!snapshot) {
        return;
      }

      const currentStatus = snapshot.rubricCommentStatus[rubricComment.id] ?? STATUS.NONE;
      const localRubricComment = snapshot.rubricComments[rubricComment.id] ?? rubricComment;

      const newStatus = statusChange(
        [
          savedRubricComment.text,
          savedRubricComment.pointDelta,
          savedRubricComment.explanation,
          savedRubricComment.instructionText,
          savedRubricComment.templateTextOn,
        ],
        [
          localRubricComment.text,
          localRubricComment.pointDelta,
          localRubricComment.explanation,
          localRubricComment.instructionText,
          localRubricComment.templateTextOn,
        ],
        currentStatus,
      );

      if (newStatus === currentStatus) {
        return;
      }

      setState((prev) => {
        const nextState: IRubricCategoryManagerState = {
          ...prev,
          rubricCommentStatus: {
            ...prev.rubricCommentStatus,
            [rubricComment.id]: newStatus,
          },
        };
        stateRef.current = nextState;
        return nextState;
      });

      if (newStatus === STATUS.UNSAVED) {
        props.onCommentEdit(rubricComment);
      } else if (newStatus === STATUS.NONE) {
        props.onCommentUndo(rubricComment);
      }
    },
    [props, savedRubricComments],
  );

  const saveComment = useCallback<IRubricCategoryManagerHelpers['saveComment']>(
    (rubricCommentID, overrideComment) => {
      const currentState = stateRef.current;
      const localComment = overrideComment ?? currentState.rubricComments[rubricCommentID];
      if (!localComment) {
        return;
      }

      const match = props.rubricComments.find((el) => el.id === localComment.id);
      if (!match) {
        return;
      }

      let workingComment: RubricCommentType = localComment;
      let pointDelta = parseFloat(workingComment.pointDelta.toFixed(1));
      const text = workingComment.text;

      if (Number.isNaN(workingComment.pointDelta) || workingComment.pointDelta === null) {
        workingComment = { ...workingComment, pointDelta: 0 };
        pointDelta = 0;
      }

      const { valid, message } = validateComments(workingComment);
      props.updateComment({ ...workingComment });

      if (
        text !== match.text ||
        pointDelta !== match.pointDelta ||
        workingComment.explanation !== match.explanation ||
        workingComment.instructionText !== match.instructionText ||
        workingComment.templateTextOn !== match.templateTextOn
      ) {
        const hasCurrentError = currentState.hasError || currentState.hasCommentError;
        if (hasCurrentError && !currentState.hasError && valid) {
          props.updateCategory(props.rubricCategory, false);
        } else if (!hasCurrentError && !valid) {
          props.updateCategory(props.rubricCategory, true);
        }
      }

      setState((prev) => {
        if (prev.hasCommentError === !valid && prev.commentErrorMessage === message) {
          return prev;
        }
        const nextState: IRubricCategoryManagerState = {
          ...prev,
          hasCommentError: !valid,
          commentErrorMessage: message,
        };
        stateRef.current = nextState;
        return nextState;
      });

      updateCommentStatus(workingComment);
    },
    [props, updateCommentStatus, validateComments],
  );

  const updateRubricComment = useCallback<IRubricCategoryManagerHelpers['updateRubricComment']>(
    (rubricCommentID, key, event) => {
      let updatedComment: RubricCommentType | undefined;

      setState((prev) => {
        const currentComment = prev.rubricComments[rubricCommentID];
        if (!currentComment) {
          updatedComment = undefined;
          return prev;
        }

        let nextValue: unknown = event;

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
        }

        if (key === 'pointDelta') {
          const numericValue = typeof nextValue === 'number' ? nextValue : Number(nextValue);
          nextValue = Number.isNaN(numericValue) ? currentComment.pointDelta : numericValue;
        }

        updatedComment = {
          ...currentComment,
          [key]: nextValue,
        } as RubricCommentType;

        const updatedComments = {
          ...prev.rubricComments,
          [rubricCommentID]: updatedComment!,
        };

        const nextState: IRubricCategoryManagerState = {
          ...prev,
          rubricComments: updatedComments,
        };

        stateRef.current = nextState;
        return nextState;
      });

      if (updatedComment) {
        if (key === 'text') {
          updateCommentStatusRef.current?.(updatedComment);
        } else {
          saveCommentRef.current?.(rubricCommentID, updatedComment);
        }
      }
    },
    [],
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
  }, [savedRubricCategory, state.name, state.pointLimit, state.helpText, state.atMostOnce, updateCategoryStatus]);

  const autoSaveRef = useRef({ pointLimit: state.pointLimit, atMostOnce: state.atMostOnce });
  useEffect(() => {
    const prevValues = autoSaveRef.current;
    if (prevValues.pointLimit !== state.pointLimit || prevValues.atMostOnce !== state.atMostOnce) {
      autoSaveRef.current = { pointLimit: state.pointLimit, atMostOnce: state.atMostOnce };
      saveCategory();
    }
  }, [saveCategory, state.atMostOnce, state.pointLimit]);

  const prevRubricCategoryRef = useRef<RubricCategoryType | null>(null);
  useEffect(() => {
    const prevRubricCategory = prevRubricCategoryRef.current;
    if (prevRubricCategory && prevRubricCategory !== rubricCategory) {
      setState((prev) => ({
        ...prev,
        name: rubricCategory.name,
        pointLimit: rubricCategory.pointLimit,
        helpText: rubricCategory.helpText ? rubricCategory.helpText : '',
        atMostOnce: rubricCategory.atMostOnce,
      }));
    }
    prevRubricCategoryRef.current = rubricCategory;
  }, [rubricCategory]);

  const prevRubricCommentsRef = useRef<RubricCommentType[] | null>(null);
  useEffect(() => {
    const prevRubricComments = prevRubricCommentsRef.current;
    if (prevRubricComments && prevRubricComments !== rubricComments) {
      setState((prev) => {
        const newMap = { ...prev.rubricComments };
        for (const comment of rubricComments) {
          const match = prevRubricComments.find((el) => el.id === comment.id);
          if (match) {
            if (!_.isEqual(match, comment)) {
              newMap[comment.id] = _.cloneDeep(comment);
            }
          } else {
            newMap[comment.id] = _.cloneDeep(comment);
          }
        }

        return {
          ...prev,
          rubricComments: newMap,
          rubricCommentStatus: initializeRubricCommentStatus(rubricComments),
        };
      });
    }
    prevRubricCommentsRef.current = rubricComments;
  }, [initializeRubricCommentStatus, rubricComments]);

  const prevSavedRubricCommentsRef = useRef<RubricCommentType[] | undefined>(savedRubricComments);
  useEffect(() => {
    if (savedRubricComments && savedRubricComments !== prevSavedRubricCommentsRef.current) {
      const snapshot = stateRef.current;
      Object.values(snapshot.rubricComments).forEach((comment) => {
        updateCommentStatusRef.current?.(comment);
      });
    }
    prevSavedRubricCommentsRef.current = savedRubricComments;
  }, [savedRubricComments, updateCommentStatus]);

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
