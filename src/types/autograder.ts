import type { SubmissionTest } from '../api-client';

export interface TaskResponse {
  task: string;
}

export interface BasicTestResultType {
  passed: boolean;
  logs: string;
  isError: boolean;
  testCase: number;
  testCategory: number;
}

export interface TestEditorResultType {
  logs: string;
  results: BasicTestResultType[];
}

export interface SubmissionTestResultType {
  logs: string | null;
  submissionTests: SubmissionTest[];
  message: string;
}

export type RunAllResultType = SubmissionTest[];
