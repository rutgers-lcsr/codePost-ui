import { submissionsApi } from '../api-client/clients';
import type {
  Submission as SubmissionModel,
  SubmissionHistory,
  SubmissionTestResultsResponse,
  SubmissionCheckPermissionResponse,
  StudentSubmission,
} from '../api-client';
import type { FileType } from '../utils/file';
import { getFileContent } from '../utils/file';
import { CommentIO, CommentType } from '../utils/comments';
import type { ICommentToRubricCommentMap, IFileToCommentsMap } from '../types/common';
import { message } from 'antd';
import { commentsApi, filesApi, rubricCommentsApi } from '../api-client/clients';

export class Submission {
  public static create = (submission: Omit<SubmissionModel, 'id'>) => submissionsApi.create({ submission });

  public static read = (id: number) => submissionsApi.retrieve({ id });

  public static update = (submission: Partial<SubmissionModel> & { id: number }) =>
    submissionsApi.partialUpdate({ id: submission.id, patchedSubmission: submission });

  public static delete = (id: number) => submissionsApi.destroy({ id });

  public static readHistory = (id: number): Promise<SubmissionHistory[]> => submissionsApi.historyList({ id });

  public static updateHistory = (id: number, payload: SubmissionHistory[]) =>
    submissionsApi.historyPartialUpdate({ id, patchedSubmissionHistory: payload });

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

  public static removePartner = (id: number) => submissionsApi.removePartnerPartialUpdate({ id });

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
}

export const getSubmissionFileContent = getFileContent;
