// @ts-nocheck
// @ts-nocheck
// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Configuration, type Middleware } from './runtime';
import { getAuthToken, handleUnauthorized } from '../utils/auth';
import {
  AssignmentDataSetsApi,
  AssignmentFilesApi,
  AssignmentsApi,
  AuthApi,
  AutograderApi,
  CommentTemplatesApi,
  CommentsApi,
  CourseFilesApi,
  CoursesApi,
  DashboardApi,
  FilesApi,
  LogsApi,
  OrganizationsApi,
  OttApi,
  RegistrationApi,
  RubricCategoriesApi,
  RubricCommentsApi,
  SectionsApi,
  SubmissionFilesApi,
  SubmissionTestsApi,
  SubmissionsApi,
  SubscribeApi,
  SystemApi,
  TestCasesApi,
  TestCategoriesApi,
  TestCategoryResourcesApi,
  TmpScriptApi,
  TokenAuthApi,
  TokenRefreshApi,
  TokenVerifyApi,
  UsersApi,
  WebhooksApi,
} from './apis';

const unauthorizedMiddleware: Middleware = {
  post: async ({ response }) => {
    if (response.status === 401) {
      handleUnauthorized();
    }
    return response;
  },
  onError: async ({ response }) => {
    if (response?.status === 401) {
      handleUnauthorized();
    }
    return response;
  },
};

export const apiClientConfig = new Configuration({
  basePath: process.env.REACT_APP_API_URL,
  accessToken: () => Promise.resolve(getAuthToken()),
  middleware: [unauthorizedMiddleware],
});

export const assignmentDataSetsApi = new AssignmentDataSetsApi(apiClientConfig);
export const assignmentFilesApi = new AssignmentFilesApi(apiClientConfig);
export const assignmentsApi = new AssignmentsApi(apiClientConfig);
export const authApi = new AuthApi(apiClientConfig);
export const autograderApi = new AutograderApi(apiClientConfig);
export const commentTemplatesApi = new CommentTemplatesApi(apiClientConfig);
export const commentsApi = new CommentsApi(apiClientConfig);
export const courseFilesApi = new CourseFilesApi(apiClientConfig);
export const coursesApi = new CoursesApi(apiClientConfig);
export const dashboardApi = new DashboardApi(apiClientConfig);
export const filesApi = new FilesApi(apiClientConfig);
export const logsApi = new LogsApi(apiClientConfig);
export const organizationsApi = new OrganizationsApi(apiClientConfig);
export const ottApi = new OttApi(apiClientConfig);
export const registrationApi = new RegistrationApi(apiClientConfig);
export const rubricCategoriesApi = new RubricCategoriesApi(apiClientConfig);
export const rubricCommentsApi = new RubricCommentsApi(apiClientConfig);
export const sectionsApi = new SectionsApi(apiClientConfig);
export const submissionFilesApi = new SubmissionFilesApi(apiClientConfig);
export const submissionTestsApi = new SubmissionTestsApi(apiClientConfig);
export const submissionsApi = new SubmissionsApi(apiClientConfig);
export const subscribeApi = new SubscribeApi(apiClientConfig);
export const systemApi = new SystemApi(apiClientConfig);
export const testCasesApi = new TestCasesApi(apiClientConfig);
export const testCategoriesApi = new TestCategoriesApi(apiClientConfig);
export const testCategoryResourcesApi = new TestCategoryResourcesApi(apiClientConfig);
export const tmpScriptApi = new TmpScriptApi(apiClientConfig);
export const tokenAuthApi = new TokenAuthApi(apiClientConfig);
export const tokenRefreshApi = new TokenRefreshApi(apiClientConfig);
export const tokenVerifyApi = new TokenVerifyApi(apiClientConfig);
export const usersApi = new UsersApi(apiClientConfig);
export const webhooksApi = new WebhooksApi(apiClientConfig);
