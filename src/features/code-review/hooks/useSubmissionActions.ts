// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import * as React from 'react';
import { message } from 'antd';
import queryString from 'query-string';
import type {
  AnonymousSubmissionType,
  CommentType,
  StudentSubmissionType,
  TestCaseType,
} from '../../../types/models';
import type { FileWithId } from '../../../utils/file';
import type { ICodeConsoleState } from '../../../types/CodeConsole.types';
import type { RubricCategory, RubricComment } from '../../../api-client';
import type { ICommentToRubricCommentMap, IRubricCategoryToRubricCommentsMap } from '../../../types/common';
import { Submission as SubmissionService } from '../../../services/submission';
import { getDaysLate } from '../../../components/utils/LateDays';
import { calculateGrade, pointsInFile } from '../codeConsoleUtils';
import { getStoreSnapshot, useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';

interface UseSubmissionActionsOptions {
  userEmail: string;
  inDemoMode: boolean;
  deleteComment: (comment: CommentType) => Promise<void>;
  addComment: (comment: CommentType, file: FileWithId) => void;
  saveComment: (comment: CommentType) => Promise<void>;
}

/**
 * Encapsulates submission-level actions: grading, finalization, late-day credits,
 * claiming, rubric updates, and grade calculations.
 *
 * Reads from `useCodeConsoleStore` via `getState()` so all functions always see
 * the latest store values without subscribing to re-renders.
 */
export function useSubmissionActions({
  userEmail,
  inDemoMode,
  deleteComment,
  addComment,
  saveComment,
}: UseSubmissionActionsOptions) {
  // Backwards-compatible setState that updates Zustand store
  const setState = React.useCallback((updater: React.SetStateAction<ICodeConsoleState>) => {
    const stateObj = getStoreSnapshot();
    const newState = typeof updater === 'function' ? updater(stateObj) : updater;
    useCodeConsoleStore.getState().setState(newState);
  }, []);

  const calculateGradeFromState = React.useCallback((): number | undefined => {
    const s = useCodeConsoleStore.getState();
    if (!(s.submission || s.readOnlySubmission) || !s.assignment) {
      return undefined;
    }

    return calculateGrade(
      s.assignment,
      s.comments,
      s.commentRubricComments,
      s.rubricCategories,
      s.files as FileWithId[],
      s.tests,
      Object.values(s.testCases).flat() as TestCaseType[],
    );
  }, []);

  const getPointsInFile = React.useCallback((file: FileWithId): number[] => {
    const s = useCodeConsoleStore.getState();
    const fileComments = s.comments[file.id] || [];
    return pointsInFile(file, fileComments, s.commentRubricComments);
  }, []);

  const updateSubmissionGrade = React.useCallback(() => {
    const s = useCodeConsoleStore.getState();
    if (s.submission) {
      const grade = calculateGradeFromState();
      if (grade) {
        const updatedSubmission = { ...s.submission, grade };
        useCodeConsoleStore.getState().setState({ submission: updatedSubmission });
      }
    }
  }, [calculateGradeFromState]);

  const addLateDayCreditComment = React.useCallback(
    async (lateDayCreditsUsed: number) => {
      const s = useCodeConsoleStore.getState();

      if (s.course === undefined || s.course.lateDayCreditsAllowable === null) {
        return false;
      }

      if (s.assignment === undefined || !s.assignment.allowStudentUpload) {
        return false;
      }

      if (s.submission === undefined) {
        return false;
      }

      const files = s.files as FileWithId[];
      if (files.length === 0) {
        return false;
      }

      const firstFile = files[0];

      const daysLate = getDaysLate(s.assignment, s.submission);
      const daysLateAfterCredit = daysLate - lateDayCreditsUsed;

      const text = `
\`\`\`
Days Late:                 ${daysLate}
Late Credits Used:         ${lateDayCreditsUsed}
Days Late (After Credit):  ${daysLateAfterCredit}
\`\`\`
`;

      const lateDayCreditComment: CommentType = {
        startLine: 1,
        endLine: 1,
        startChar: 0,
        endChar: 1,
        id: s.commentCounter,
        file: firstFile.id,
        pointDelta: 0.0,
        text,
        rubricComment: null,
        author: userEmail,
        feedback: 0,
        tags: ['late'],
        color: '',
      };

      const submissionPayload = {
        id: s.submission!.id,
        lateDayCreditsUsed,
      };

      try {
        await SubmissionService.update(submissionPayload);

        let promises: Promise<void>[] = [];
        // Clear previous LateDay comments
        for (const fileID of Object.keys(s.comments)) {
          promises = [
            ...promises,
            ...s.comments[+fileID].map(async (comment: CommentType) => {
              if (comment.tags !== undefined && comment.tags.includes('late')) {
                await deleteComment(comment);
              }
            }),
          ];
        }

        await Promise.all(promises);

        addComment(lateDayCreditComment, firstFile);
        saveComment(lateDayCreditComment);
        useCodeConsoleStore.getState().setState({ activeCommentID: undefined });
        return true;
      } catch {
        return false;
      }
    },
    [userEmail, deleteComment, addComment, saveComment],
  );

  const toggleFinalized = React.useCallback(async () => {
    const s = useCodeConsoleStore.getState();
    if (!s.submission) {
      return;
    }

    if (inDemoMode || s.noSave) {
      setState((oldState: ICodeConsoleState) => {
        const newIsFinalized = !oldState.submission!.isFinalized;

        if (newIsFinalized) {
          message.success('Succcessfully finalized submission');
        } else {
          message.success('Succcessfully unfinalized submission');
        }

        return {
          ...oldState,
          submission: {
            ...oldState.submission!,
            isFinalized: newIsFinalized,
            grade: calculateGradeFromState()!,
          },
        };
      });
      return;
    }

    let payload: { id: number; isFinalized: boolean; grader?: string } = {
      id: s.submission.id,
      isFinalized: !s.submission.isFinalized,
    };

    // if trying to finalize with only one grader available, set the grader
    if (s.graders.length === 1 && !s.submission.isFinalized) {
      payload = { ...payload, grader: s.graders[0] };
    }

    try {
      const updatedSubmission: StudentSubmissionType | AnonymousSubmissionType =
        await SubmissionService.update(payload);

      if (updatedSubmission.isFinalized) {
        message.success('Successfully finalized submission');
      } else {
        message.success('Successfully unfinalized submission');
      }

      useCodeConsoleStore.getState().setState({
        submission: { ...updatedSubmission, files: updatedSubmission.files || [] },
      });
    } catch (error) {
      message.error(`Error updating submission: ${JSON.stringify(error)}`);
    }
  }, [inDemoMode, setState, calculateGradeFromState]);

  const updateGrader = React.useCallback(
    (sub: AnonymousSubmissionType, graderUsername: string | undefined) => {
      const payload = {
        id: sub.id,
        isFinalized: false,
        grader: graderUsername,
      };

      return SubmissionService.update(payload).then((submission) => {
        useCodeConsoleStore.getState().setState({
          submission: { ...submission, files: submission.files || [] },
        });
        return { ...submission, files: submission.files || [] };
      });
    },
    [],
  );

  const fetchSubmission = React.useCallback(
    async (assignment: { id?: number }): Promise<AnonymousSubmissionType | undefined> => {
      try {
        if (!assignment.id) return undefined;
        const res = await fetch(`${process.env.REACT_APP_API_URL}/assignments/${assignment.id}/drawUnassigned/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (res.status === 204) {
          return undefined;
        }
        if (!res.ok) {
          throw new Error(`Failed to draw unassigned submission (${res.status})`);
        }
        return (await res.json()) as AnonymousSubmissionType;
      } catch (error) {
        const responseStatus =
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
        if (responseStatus === 204) {
          return undefined;
        }
        console.error('Error in fetchSubmission:', error);
        return undefined;
      }
    },
    [],
  );

  const claimSubmission = React.useCallback(async () => {
    const s = useCodeConsoleStore.getState();
    if (s.assignment) {
      const submissionResult: AnonymousSubmissionType | AnonymousSubmissionType[] | undefined =
        await fetchSubmission(s.assignment);
      const normalizedSubmission = Array.isArray(submissionResult) ? submissionResult[0] : submissionResult;

      if (normalizedSubmission !== undefined && normalizedSubmission.id !== undefined) {
        const isSameAssignment = normalizedSubmission.assignment === s.assignment.id;

        const queryParams = isSameAssignment
          ? queryString.stringify({
              tab: s.activeSiderKey,
              file: (s.selectedFile as FileWithId | undefined)?.name,
            })
          : '';

        const url = queryParams
          ? `/code/${normalizedSubmission.id}?${queryParams}`
          : `/code/${normalizedSubmission.id}`;

        window.open(url, '_self');
        message.success('Successfully claimed another submission. Start reviewing!');
      } else {
        message.success('The ungraded queue is empty, so there are no more submissions to claim.');
      }
    }
  }, [fetchSubmission]);

  const setRubric = React.useCallback(
    (rubric: { rubricCategories: RubricCategory[]; rubricComments: IRubricCategoryToRubricCommentsMap }) => {
      const s = useCodeConsoleStore.getState();
      const newCommentRubricComments: ICommentToRubricCommentMap = {};

      for (const commentID of Object.keys(s.commentRubricComments)) {
        const oldRubricComment = s.commentRubricComments[+commentID];

        const newRubricComment = rubric.rubricComments[oldRubricComment.category].find(
          (rubricComment: RubricComment) => {
            return rubricComment.id === oldRubricComment.id;
          },
        );

        if (newRubricComment) {
          newCommentRubricComments[+commentID] = newRubricComment;
        }
      }

      useCodeConsoleStore.getState().setState({
        rubricCategories: rubric.rubricCategories,
        rubricComments: rubric.rubricComments,
        commentRubricComments: newCommentRubricComments,
      });
    },
    [],
  );

  const submitStudentQuestion = React.useCallback(
    async (submission: StudentSubmissionType, text: string, isRegrade: boolean) => {
      const newSubmission = await SubmissionService.updateQuestion(submission.id, {
        questionText: text,
        questionIsRegrade: isRegrade,
      });
      useCodeConsoleStore.getState().setState({ readOnlySubmission: newSubmission });
      return newSubmission;
    },
    [],
  );

  const deleteStudentQuestion = React.useCallback(async (submission: StudentSubmissionType) => {
    const newSubmission = await SubmissionService.deleteQuestion(submission.id, {});
    useCodeConsoleStore.getState().setState({ readOnlySubmission: newSubmission });
    return newSubmission;
  }, []);

  const updateRegrade = React.useCallback(
    async (sub: AnonymousSubmissionType, fields: Partial<AnonymousSubmissionType>) => {
      const payload = { id: sub.id, ...fields };
      const updated = await SubmissionService.update(payload);
      useCodeConsoleStore.getState().setState({ submission: { ...updated, files: updated.files || [] } });
      return { ...updated, files: updated.files || [] } as AnonymousSubmissionType;
    },
    [],
  );

  const turnOnReload = React.useCallback(() => {
    useCodeConsoleStore.getState().setState({ rubricReload: 15000 });
  }, []);

  const turnOffReload = React.useCallback(() => {
    useCodeConsoleStore.getState().setState({ rubricReload: undefined });
  }, []);

  return {
    addLateDayCreditComment,
    calculateGradeFromState,
    getPointsInFile,
    updateSubmissionGrade,
    toggleFinalized,
    updateGrader,
    claimSubmission,
    setRubric,
    submitStudentQuestion,
    deleteStudentQuestion,
    updateRegrade,
    turnOnReload,
    turnOffReload,
  };
}
