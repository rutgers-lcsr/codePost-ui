// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { assignmentsApi } from '../api-client/clients';
import type {
  Assignment as AssignmentModel,
  AssignmentAnalyticsResponse,
  AssignmentGenerateTestResponse,
  AssignmentStudentUploadGetResponse,
  AssignmentDownloadResponse,
  AssignmentStudentTestsResponse,
  AssignmentRubricResponse,
  Comment,
  StudentSubmission,
  Submission,
  SubmissionHistory,
  SubmissionWithTests,
} from '../api-client';

const fetchAllPages = async <T>(fetchPage: (page: number) => Promise<{ results?: T[]; next?: string | null }>) => {
  const allResults: T[] = [];
  let page = 1;
  while (true) {
    const response = await fetchPage(page);
    const results = response.results ?? [];
    allResults.push(...results);
    if (!response.next) break;
    page += 1;
  }
  return allResults;
};

export class Assignment {
  public static read = (id: number): Promise<AssignmentModel> => assignmentsApi.retrieve({ id });

  public static create = (
    assignment: Omit<
      AssignmentModel,
      | 'id'
      | 'rubricCategories'
      | 'environment'
      | 'files'
      | 'fileTemplates'
      | 'maxStudentTestRuns'
      | 'nudgeMode'
      | 'dataSets'
      | 'testCategories'
    >,
  ) => assignmentsApi.create({ assignment });

  public static clone = (assignmentId: number, destinationCourseId: number): Promise<AssignmentModel> =>
    assignmentsApi.cloneCreate({ id: assignmentId, assignmentClone: { course: destinationCourseId } });

  public static generateTest = (
    assignmentId: number,
    payload: {
      target_filename: string;
      context_file_id?: number;
      context_file_name?: string;
      language?: string;
      rubric_text?: string;
    },
  ): Promise<AssignmentGenerateTestResponse> =>
    assignmentsApi.generateTestCreate({
      id: assignmentId,
      assignmentGenerateTest: {
        targetFilename: payload.target_filename,
        contextFileId: payload.context_file_id,
        contextFileName: payload.context_file_name,
        language: payload.language,
        rubricText: payload.rubric_text,
      },
    });

  public static readRubric = (assignmentId: number): Promise<AssignmentRubricResponse> =>
    assignmentsApi.rubricRetrieve({ id: assignmentId });

  public static readAnalytics = (assignmentId: number, buckets?: number): Promise<AssignmentAnalyticsResponse> =>
    assignmentsApi.analyticsRetrieve({ id: assignmentId, buckets });

  public static readComments = (assignmentId: number): Promise<Comment[]> =>
    assignmentsApi.commentsList({ id: assignmentId });

  public static readSubmissions = async (assignmentId: number): Promise<Submission[]> => {
    return fetchAllPages<Submission>((page) =>
      assignmentsApi.submissionsList({ id: assignmentId, page, pageSize: 200 }),
    );
  };

  public static readSubmissionHistories = async (assignmentId: number): Promise<SubmissionHistory[]> => {
    return fetchAllPages<SubmissionHistory>((page) =>
      assignmentsApi.submissionHistoriesList({ id: assignmentId, page, pageSize: 200 }),
    );
  };

  public static readSubmissionTests = async (assignmentId: number): Promise<SubmissionWithTests[]> => {
    return fetchAllPages<SubmissionWithTests>((page) =>
      assignmentsApi.submissionTestsList({ id: assignmentId, page, pageSize: 200 }),
    );
  };
}

export class AssignmentStudent {
  public static read = (id: number): Promise<AssignmentModel> => assignmentsApi.retrieve({ id });

  public static readStudentTests = (id: number): Promise<AssignmentStudentTestsResponse> =>
    assignmentsApi.studentTestsRetrieve({ id });

  public static createStudentUpload = (
    id: number,
    payload: AssignmentStudentUploadGetResponse,
  ): Promise<StudentSubmission> =>
    assignmentsApi.studentUploadCreate({ id, assignment: payload as unknown as AssignmentModel });

  public static updateStudentUpload = (
    id: number,
    payload: AssignmentStudentUploadGetResponse,
  ): Promise<StudentSubmission> =>
    assignmentsApi.studentUploadPartialUpdate({ id, patchedAssignment: payload as unknown as AssignmentModel });

  public static readStudentUpload = (id: number): Promise<AssignmentStudentUploadGetResponse> =>
    assignmentsApi.studentUploadRetrieve({ id });

  public static beforeStudentUpload = (id: number) => assignmentsApi.beforeStudentUploadRetrieve({ id });

  public static downloadAssignmentZip = (id: number): Promise<AssignmentDownloadResponse> =>
    assignmentsApi.downloadRetrieve({ id });
}
