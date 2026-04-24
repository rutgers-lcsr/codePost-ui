// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import * as React from 'react';
import { message } from 'antd';
import flatten from 'lodash/flatten';
import { Comment as ApiComment, PatchedComment, RubricComment } from '../../../api-client';
import { commentsApi } from '../../../api-client/clients';
import type { CommentType } from '../../../types/models';
import { CURSOR_DOMAIN } from '../../../types/CodeConsole.types';
import type { FileType, FileWithId } from '../../../utils/file';
import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import {
  addCommentToState,
  addToCommentRubricCommentsState,
  linkRubricComment,
  removeCommentFromState,
  removeFromCommentRubricCommentsState,
  unlinkRubricComment,
  updateCommentsState,
} from '../codeConsoleUtils';

interface UseCommentActionsOptions {
  /** Whether the console is running in demo mode (no backend persistence) */
  inDemoMode: boolean;
  /** Callback to recalculate and store the submission grade after comment changes */
  recalculateGrade: () => void;
  /** Callback to auto-assign grader when first comment is placed */
  autoAssignGrader: () => void;
}

/**
 * Encapsulates all comment CRUD operations, rubric linking, and active-comment management.
 *
 * Reads comment-related state from `useCodeConsoleStore` and returns stable action callbacks
 * that can be passed directly to child components (`GradeComments`, `StudentComments`, etc.).
 */
export function useCommentActions({ inDemoMode, recalculateGrade, autoAssignGrader }: UseCommentActionsOptions) {
  // --- Zustand selectors (comment-related state) ---
  const comments = useCodeConsoleStore((s) => s.comments);
  const commentRubricComments = useCodeConsoleStore((s) => s.commentRubricComments);
  const activeCommentID = useCodeConsoleStore((s) => s.activeCommentID);
  const rubricCategories = useCodeConsoleStore((s) => s.rubricCategories);
  const rubricComments = useCodeConsoleStore((s) => s.rubricComments);

  // ─── changeActiveComment ──────────────────────────────────────────────
  const changeActiveComment = React.useCallback((id: number | undefined): void => {
    const store = useCodeConsoleStore.getState();
    if (id === undefined) {
      const newCursor =
        store.showCursor === CURSOR_DOMAIN.CODE_HIDDEN
          ? CURSOR_DOMAIN.CODE
          : store.showCursor === CURSOR_DOMAIN.COMMENTS_HIDDEN
            ? CURSOR_DOMAIN.COMMENTS
            : CURSOR_DOMAIN.CODE;
      store.setState({ activeCommentID: id, showCursor: newCursor });
    } else {
      const newCursor =
        store.showCursor === CURSOR_DOMAIN.CODE
          ? CURSOR_DOMAIN.CODE_HIDDEN
          : store.showCursor === CURSOR_DOMAIN.COMMENTS
            ? CURSOR_DOMAIN.COMMENTS_HIDDEN
            : CURSOR_DOMAIN.CODE_HIDDEN;
      store.setState({ activeCommentID: id, showCursor: newCursor });
    }
  }, []);

  // ─── Internal: updateComment (not exposed) ────────────────────────────
  const updateComment = React.useCallback(
    (commentID: number, newComment: CommentType, newRubricComment?: RubricComment) => {
      const store = useCodeConsoleStore.getState();
      const nextComments = updateCommentsState(store.comments, commentID, newComment);

      // Migrate rubric-comment association when ID changes (negative → positive after save)
      let migrated = store.commentRubricComments;
      if (commentID !== newComment.id && migrated[commentID] !== undefined) {
        const { [commentID]: existing, ...rest } = migrated;
        migrated = { ...rest, [newComment.id]: existing };
      }

      const nextCommentRubricComments = addToCommentRubricCommentsState(migrated, newComment.id, newRubricComment);
      store.setState({ comments: nextComments, commentRubricComments: nextCommentRubricComments });
    },
    [],
  );

  // ─── addComment ───────────────────────────────────────────────────────
  const addComment = React.useCallback(
    (comment: CommentType, file: FileType) => {
      const store = useCodeConsoleStore.getState();
      const fileWithId = file as FileWithId;

      autoAssignGrader();

      const nextComments = addCommentToState(store.comments, comment, fileWithId);
      store.setState({
        comments: nextComments,
        activeCommentID: comment.id,
        commentCounter: store.commentCounter - 1,
      });
    },
    [autoAssignGrader],
  );

  // ─── saveComment ──────────────────────────────────────────────────────
  const saveComment = React.useCallback(
    async (comment: CommentType) => {
      const store = useCodeConsoleStore.getState();
      let savedComment: CommentType = comment;
      let nextOldCommentIDs = store.oldCommentIDs;

      if (!inDemoMode && !store.noSave) {
        if (comment.id < 0) {
          // Create new comment on backend
          savedComment = await commentsApi.create({ comment: comment as unknown as ApiComment });
          nextOldCommentIDs = { ...nextOldCommentIDs, [savedComment.id]: comment.id };

          // Race-condition guard: check if the user deleted the comment while the POST was in flight
          const latestComments = useCodeConsoleStore.getState().comments;
          if (!flatten(Object.values(latestComments)).find((el: CommentType) => el.id === comment.id)) {
            // Comment was deleted while save was in progress — clean up the backend copy
            if (savedComment.id > 0) {
              await commentsApi.destroy({ id: savedComment.id }).then(() => recalculateGrade());
            }
            return;
          }
        } else {
          savedComment = await commentsApi.partialUpdate({
            id: comment.id,
            patchedComment: { ...comment } as PatchedComment,
          });
        }
      } else {
        // Demo / noSave mode: simulate saving with a local positive ID
        if (comment.id < 0) {
          const demoCounter = useCodeConsoleStore.getState().demoCommentCounter;
          savedComment = { ...comment, id: demoCounter + 1 };
          nextOldCommentIDs = { ...nextOldCommentIDs, [savedComment.id]: comment.id };
          useCodeConsoleStore.getState().setState({ demoCommentCounter: demoCounter + 1 });
        }
      }

      useCodeConsoleStore.getState().setState({ oldCommentIDs: nextOldCommentIDs });
      updateComment(comment.id, savedComment);
    },
    [inDemoMode, recalculateGrade, updateComment],
  );

  // Stable ref so callers that shouldn't re-render on `saveComment` identity changes can opt in
  const saveCommentRef = React.useRef(saveComment);
  saveCommentRef.current = saveComment;

  // ─── deleteComment ────────────────────────────────────────────────────
  const deleteComment = React.useCallback(
    async (comment: CommentType) => {
      const store = useCodeConsoleStore.getState();

      // Delete from backend if it's a saved comment (positive ID)
      if (comment.id > 0 && !inDemoMode && !store.noSave) {
        await commentsApi.destroy({ id: comment.id }).then(() => recalculateGrade());
      }

      // If this comment has a negative ID but was previously saved, also delete the backend copy
      if (comment.id < 0 && !inDemoMode && !store.noSave) {
        const savedCommentId = Object.keys(store.oldCommentIDs).find(
          (positiveId) => store.oldCommentIDs[+positiveId] === comment.id,
        );
        if (savedCommentId) {
          await commentsApi.destroy({ id: +savedCommentId }).then(() => recalculateGrade());
        }
      }

      const nextComments = removeCommentFromState(store.comments, comment);
      const [, nextCommentRubricComments] = removeFromCommentRubricCommentsState(
        store.commentRubricComments,
        comment.id,
      );

      store.setState({ comments: nextComments, commentRubricComments: nextCommentRubricComments });
      changeActiveComment(undefined);
    },
    [inDemoMode, recalculateGrade, changeActiveComment],
  );

  // ─── updateFeedback ───────────────────────────────────────────────────
  const updateFeedback = React.useCallback((fileID: number, commentID: number, feedbackNum: number) => {
    commentsApi
      .feedbackPartialUpdate({
        id: commentID,
        patchedComment: { feedback: feedbackNum } as PatchedComment,
      })
      .then((newComment) => {
        const store = useCodeConsoleStore.getState();
        const newMap = { ...store.comments };
        newMap[fileID] = newMap[fileID].map((el) => (el.id === commentID ? newComment : el));
        store.setState({ comments: newMap });
      })
      .catch((error) => {
        console.error('Failed to update comment feedback:', error);
        message.error('Failed to update feedback. Please try again.');
      });
  }, []);

  // ─── removeRubricComment ──────────────────────────────────────────────
  const removeRubricComment = React.useCallback((comment: CommentType, rubricComment: RubricComment) => {
    const store = useCodeConsoleStore.getState();
    const nextComments = unlinkRubricComment(store.comments, comment, rubricComment);
    const [, nextCommentRubricComments] = removeFromCommentRubricCommentsState(store.commentRubricComments, comment.id);
    store.setState({ comments: nextComments, commentRubricComments: nextCommentRubricComments });
  }, []);

  // ─── onRubricCommentClick ─────────────────────────────────────────────
  const onRubricCommentClick = React.useCallback((rubricComment: RubricComment): void => {
    const store = useCodeConsoleStore.getState();

    if (!store.activeCommentID) {
      message.warning(
        `You must open a comment before applying a rubric comment. Click an existing comment,
				or highlight some code to create a new one.`,
        5,
      );
      return;
    }

    // Enforce "at most once" per category
    const category = store.rubricCategories.find((el) => el.id === rubricComment.category);
    if (category?.atMostOnce) {
      const siblings = (store.rubricComments[rubricComment.category] || []).map((el) => el.id);
      const hasApplied = Object.values(store.comments)
        .flat()
        .some((el) => siblings.indexOf(el.rubricComment) > -1 && el.id !== store.activeCommentID);
      if (hasApplied) {
        message.warning("You can't apply more than one rubric comment from this rubric category.");
        return;
      }
    }

    const nextComments = linkRubricComment(store.comments, rubricComment, store.activeCommentID);
    if (nextComments === undefined) return;

    // If cursor was in the rubric panel, refocus the comment text area
    if (store.showCursor === CURSOR_DOMAIN.RUBRIC) {
      const commentTextArea = document.getElementById('comment-text-area');
      commentTextArea?.focus();
    }

    const nextCommentRubricComments = addToCommentRubricCommentsState(
      store.commentRubricComments,
      store.activeCommentID,
      rubricComment,
    );

    store.setState({
      comments: nextComments,
      commentRubricComments: nextCommentRubricComments,
      showCursor: CURSOR_DOMAIN.CODE_HIDDEN,
    });
  }, []);

  return {
    // State (for reading in render)
    comments,
    commentRubricComments,
    activeCommentID,
    rubricCategories,
    rubricComments,

    // Actions
    addComment,
    saveComment,
    saveCommentRef,
    deleteComment,
    updateFeedback,
    removeRubricComment,
    onRubricCommentClick,
    changeActiveComment,
  };
}
