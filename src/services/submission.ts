// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { submissionsApi } from '../api-client/clients';
import type {
  Submission as SubmissionModel,
  SubmissionHistory,
  SubmissionTestResultsResponse,
  SubmissionCheckPermissionResponse,
  StudentSubmission,
  SubmissionConsoleData,
} from '../api-client';
import type { FileType } from '../utils/file';
import { getFileContent } from '../utils/file';
import { CommentIO, CommentType } from '../utils/comments';
import type { ICommentToRubricCommentMap, IFileToCommentsMap } from '../types/common';
import type { RubricComment } from '../api-client';
import { message } from 'antd';
import { commentsApi, filesApi, rubricCommentsApi } from '../api-client/clients';

export class Submission {
  public static create = (submission: Omit<SubmissionModel, 'id'>) => submissionsApi.create({ submission });

  public static read = (id: number) => submissionsApi.retrieve({ id });

  public static update = (submission: Partial<SubmissionModel> & { id: number }) =>
    submissionsApi.partialUpdate({ id: submission.id, patchedSubmission: submission });

  public static delete = (id: number) => submissionsApi.destroy({ id });

  public static readHistory = (id: number): Promise<SubmissionHistory[]> => submissionsApi.historyList({ id });

  public static updateHistory = (id: number, payload: Partial<SubmissionModel>) =>
    submissionsApi.historyPartialUpdate({ id, patchedSubmission: payload });

  public static readTestResults = (id: number): Promise<SubmissionTestResultsResponse> =>
    submissionsApi.testResultsRetrieve({ id });

  public static checkPermission = (id: number): Promise<SubmissionCheckPermissionResponse> =>
    submissionsApi.checkPermissionRetrieve({ id });

  public static updateQuestion = (id: number, payload: Partial<SubmissionModel>) =>
    submissionsApi.submitRegradePartialUpdate({ id, patchedSubmission: payload });

  public static deleteQuestion = (id: number, payload: Partial<SubmissionModel>) =>
    submissionsApi.deleteRegradePartialUpdate({ id, patchedSubmission: payload });

  public static readPartnerLink = (id: number) => submissionsApi.generatePartnerLinkRetrieve({ id });

  public static validatePartnerLinkAndReturn = (id: number, token: string): Promise<StudentSubmission> =>
    submissionsApi.validatePartnerLinkAndReturnRetrieve({ id, token });

  public static validatePartnerLink = (id: number, token: string) =>
    submissionsApi.validatePartnerLinkRetrieve({ id, token });

  public static removePartner = (id: number) => submissionsApi.removePartnerRetrieve({ id });

  public static filesByVersion = (files: FileType[]) => {
    const olderFiles: { [pathName: string]: FileType[] } = {};
    const latestFiles: { [pathName: string]: FileType } = {};
    files.forEach((file) => {
      const path = `${file.path ? String(file.path).replace(/^\/+|\/+$/g, '') : ''}/${file.name}`;
      if (!latestFiles[path]) latestFiles[path] = file;
      else {
        const latestCreated = Date.parse((latestFiles[path] as { created?: string }).created ?? '');
        const fileCreated = Date.parse((file as { created?: string }).created ?? '');
        if (latestCreated <= fileCreated) {
          const oldLatest = latestFiles[path];
          if (olderFiles[path]) {
            olderFiles[path].push(oldLatest);
          } else {
            olderFiles[path] = [oldLatest];
          }
          latestFiles[path] = file;
        } else {
          if (olderFiles[path]) {
            olderFiles[path].push(file);
          } else {
            olderFiles[path] = [file];
          }
        }
      }
    });

    const latestFilesArr: FileType[] = [];
    Object.keys(latestFiles).forEach((path) => {
      latestFilesArr.push(latestFiles[path]);
    });

    return { new: latestFilesArr, old: olderFiles };
  };

  public static loadData = async (
    submission: SubmissionModel | StudentSubmission,
  ): Promise<[FileType[], IFileToCommentsMap, ICommentToRubricCommentMap]> => {
    if (!submission.files) {
      return [[], {}, {}];
    }

    try {
      const filesField = submission.files as unknown[];
      const files: FileType[] =
        typeof filesField[0] === 'number'
          ? await Promise.all((filesField as number[]).map((id) => filesApi.retrieve({ id })))
          : (filesField as FileType[]);

      const comments: IFileToCommentsMap = {};
      await Promise.all(
        files.map(async (file: FileType) => {
          const commentIds = (file as { comments?: number[] }).comments ?? [];
          const loaded = await Promise.all(commentIds.map((id) => commentsApi.retrieve({ id })));
          comments[(file as { id?: number }).id ?? 0] = loaded.sort(CommentIO.compare) as CommentType[];
        }),
      );

      const commentRubricComments: ICommentToRubricCommentMap = {};
      await Promise.all(
        Object.values(comments)
          .flat()
          .map(async (comment: CommentType) => {
            if (comment.rubricComment) {
              commentRubricComments[comment.id] = await rubricCommentsApi.retrieve({ id: comment.rubricComment });
            }
          }),
      );
      return [files, comments, commentRubricComments];
    } catch {
      message.error('Something went wrong loading the submission. Please try again or contact team@codepost.io');
      return [[], {}, {}];
    }
  };

  /**
   * Bulk-load all submission data in a single API call using the console-data endpoint.
   * Returns the same tuple shape as loadData but with ~1 roundtrip instead of ~110.
   */
  public static loadConsoleData = async (
    submissionId: number,
  ): Promise<[SubmissionConsoleData, FileType[], IFileToCommentsMap, ICommentToRubricCommentMap]> => {
    const data = await submissionsApi.consoleDataRetrieve({ id: submissionId });

    const files: FileType[] = data.files as unknown as FileType[];

    const comments: IFileToCommentsMap = {};
    const commentRubricComments: ICommentToRubricCommentMap = {};

    for (const file of data.files) {
      const fileComments = (file.comments ?? []) as unknown as CommentType[];
      // Extract nested rubricComment objects before sorting, since the frontend
      // expects rubricComment on Comment to be an ID (number), not a nested object.
      for (const comment of fileComments) {
        if (comment.rubricComment && typeof comment.rubricComment === 'object') {
          const rc = comment.rubricComment as unknown as RubricComment;
          commentRubricComments[comment.id] = rc;
          // Replace nested object with its ID so the rest of the frontend
          // can treat rubricComment as a number (matching the standard CommentType shape).
          (comment as unknown as Record<string, unknown>).rubricComment = rc.id;
        }
      }
      comments[file.id] = fileComments.sort(CommentIO.compare);
    }

    return [data, files, comments, commentRubricComments];
  };
}

export const getSubmissionFileContent = getFileContent;
