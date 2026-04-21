// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { createApiClientsMock } from '@test-utils/mocks';

vi.mock('../../../api-client/clients', () => createApiClientsMock());

vi.mock('../../../utils/submissionTests', () => ({
  getLatestSubmissionTests: vi.fn((tests: any[]) => tests),
}));

import {
  getTestsByCase,
  fetchTestsBySubmission,
  fetchEnvironment,
  type TestsBySubmission,
  type TestCasesByCategory,
} from '../testFetchUtils';
import { submissionsApi, assignmentsApi, autograderApi } from '../../../api-client/clients';

describe('testFetchUtils', () => {
  describe('getTestsByCase', () => {
    it('categorizes passed, failed, and error tests', () => {
      const casesByCategory: TestCasesByCategory = {
        1: [{ id: 10 } as any, { id: 20 } as any],
      };

      const testsBySubmission: TestsBySubmission = {
        100: [
          { testCase: 10, passed: true, isError: false } as any,
          { testCase: 10, passed: false, isError: false } as any,
          { testCase: 20, passed: false, isError: true } as any,
        ],
      };

      const [passed, failed, error] = getTestsByCase(testsBySubmission, casesByCategory);

      expect(passed[10]).toHaveLength(1);
      expect(failed[10]).toHaveLength(1);
      expect(error[20]).toHaveLength(1);
      expect(passed[20]).toHaveLength(0);
    });

    it('initializes all test cases with empty arrays', () => {
      const casesByCategory: TestCasesByCategory = {
        1: [{ id: 10 } as any],
        2: [{ id: 20 } as any, { id: 30 } as any],
      };

      const [passed, failed, error] = getTestsByCase({}, casesByCategory);

      expect(passed[10]).toEqual([]);
      expect(passed[20]).toEqual([]);
      expect(passed[30]).toEqual([]);
      expect(failed[10]).toEqual([]);
      expect(error[30]).toEqual([]);
    });

    it('handles multiple submissions', () => {
      const casesByCategory: TestCasesByCategory = {
        1: [{ id: 10 } as any],
      };

      const testsBySubmission: TestsBySubmission = {
        100: [{ testCase: 10, passed: true, isError: false } as any],
        200: [{ testCase: 10, passed: true, isError: false } as any],
      };

      const [passed] = getTestsByCase(testsBySubmission, casesByCategory);
      expect(passed[10]).toHaveLength(2);
    });
  });

  describe('fetchTestsBySubmission', () => {
    it('returns submission tests keyed by submission ID', async () => {
      vi.mocked(submissionsApi.submissionTestsList).mockResolvedValue([{ id: 1, testCase: 10, passed: true }] as any);

      const result = await fetchTestsBySubmission([{ id: 100 }, { id: 200 }] as any);

      expect(result[100]).toBeDefined();
      expect(result[200]).toBeDefined();
    });

    it('handles response with submissionTests property', async () => {
      vi.mocked(submissionsApi.submissionTestsList).mockResolvedValue({
        submissionTests: [{ id: 1 }],
      } as any);

      const result = await fetchTestsBySubmission([{ id: 100 }] as any);
      expect(result[100]).toEqual([{ id: 1 }]);
    });

    it('handles empty response', async () => {
      vi.mocked(submissionsApi.submissionTestsList).mockResolvedValue({} as any);

      const result = await fetchTestsBySubmission([{ id: 100 }] as any);
      expect(result[100]).toEqual([]);
    });

    it('handles undefined submissions', async () => {
      const result = await fetchTestsBySubmission(undefined as any);
      expect(result).toEqual({});
    });
  });

  describe('fetchEnvironment', () => {
    it('fetches environment when assignment has one', async () => {
      const assignment = { id: 1, environment: 5 } as any;
      vi.mocked(autograderApi.environmentsRetrieve).mockResolvedValue({ id: 5, docker_image: 'python' } as any);

      const result = await fetchEnvironment(assignment);

      expect(autograderApi.environmentsRetrieve).toHaveBeenCalledWith({ id: 5 });
      expect(result).toEqual({ id: 5, docker_image: 'python' });
    });

    it('fetches latest assignment when no environment', async () => {
      const assignment = { id: 1, environment: null } as any;
      vi.mocked(assignmentsApi.retrieve).mockResolvedValue({ id: 1, environment: 10 } as any);
      vi.mocked(autograderApi.environmentsRetrieve).mockResolvedValue({ id: 10 } as any);

      const result = await fetchEnvironment(assignment);

      expect(assignmentsApi.retrieve).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual({ id: 10 });
    });

    it('returns undefined when latest assignment also has no environment', async () => {
      const assignment = { id: 1, environment: null } as any;
      vi.mocked(assignmentsApi.retrieve).mockResolvedValue({ id: 1, environment: null } as any);

      const result = await fetchEnvironment(assignment);

      expect(result).toBeUndefined();
    });
  });
});
