// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
