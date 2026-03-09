// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Tests for the fetchAllPages pagination utility (internal to assignment service)
 * and smoke-tests for Assignment service API wrappers.
 *
 * Since fetchAllPages is not exported directly, we test it through the public
 * methods that use it: readSubmissions, readSubmissionHistories, readSubmissionTests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API client before importing the service
vi.mock('../../api-client/clients', () => ({
  assignmentsApi: {
    retrieve: vi.fn(),
    create: vi.fn(),
    cloneCreate: vi.fn(),
    rubricRetrieve: vi.fn(),
    commentsList: vi.fn(),
    submissionsList: vi.fn(),
    submissionHistoriesList: vi.fn(),
    submissionTestsList: vi.fn(),
    generateTestCreate: vi.fn(),
    studentTestsRetrieve: vi.fn(),
    studentUploadCreate: vi.fn(),
    studentUploadPartialUpdate: vi.fn(),
    studentUploadRetrieve: vi.fn(),
    beforeStudentUploadRetrieve: vi.fn(),
    downloadRetrieve: vi.fn(),
  },
}));

import { Assignment } from '../assignment';
import { assignmentsApi } from '../../api-client/clients';

describe('Assignment service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('read', () => {
    it('should call retrieve with the given id', async () => {
      const mockAssignment = { id: 1, name: 'HW1' };
      vi.mocked(assignmentsApi.retrieve).mockResolvedValue(mockAssignment as any);

      const result = await Assignment.read(1);

      expect(assignmentsApi.retrieve).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockAssignment);
    });
  });

  describe('readRubric', () => {
    it('should call rubricRetrieve with the assignment id', async () => {
      const mockRubric = { rubricCategories: [] };
      vi.mocked(assignmentsApi.rubricRetrieve).mockResolvedValue(mockRubric as any);

      const result = await Assignment.readRubric(42);

      expect(assignmentsApi.rubricRetrieve).toHaveBeenCalledWith({ id: 42 });
      expect(result).toEqual(mockRubric);
    });
  });

  describe('readSubmissions (fetchAllPages integration)', () => {
    it('should fetch a single page when next is null', async () => {
      vi.mocked(assignmentsApi.submissionsList).mockResolvedValueOnce({
        results: [{ id: 1 }, { id: 2 }],
        next: null,
      } as any);

      const result = await Assignment.readSubmissions(10);

      expect(assignmentsApi.submissionsList).toHaveBeenCalledTimes(1);
      expect(assignmentsApi.submissionsList).toHaveBeenCalledWith({ id: 10, page: 1, pageSize: 200 });
      expect(result).toHaveLength(2);
    });

    it('should fetch multiple pages when next is present', async () => {
      vi.mocked(assignmentsApi.submissionsList)
        .mockResolvedValueOnce({
          results: [{ id: 1 }, { id: 2 }],
          next: 'http://api/page=2',
        } as any)
        .mockResolvedValueOnce({
          results: [{ id: 3 }],
          next: null,
        } as any);

      const result = await Assignment.readSubmissions(10);

      expect(assignmentsApi.submissionsList).toHaveBeenCalledTimes(2);
      expect(assignmentsApi.submissionsList).toHaveBeenNthCalledWith(1, { id: 10, page: 1, pageSize: 200 });
      expect(assignmentsApi.submissionsList).toHaveBeenNthCalledWith(2, { id: 10, page: 2, pageSize: 200 });
      expect(result).toHaveLength(3);
    });

    it('should return empty array when first page has no results', async () => {
      vi.mocked(assignmentsApi.submissionsList).mockResolvedValueOnce({
        results: [],
        next: null,
      } as any);

      const result = await Assignment.readSubmissions(10);

      expect(result).toEqual([]);
    });

    it('should handle undefined results gracefully', async () => {
      vi.mocked(assignmentsApi.submissionsList).mockResolvedValueOnce({
        results: undefined,
        next: null,
      } as any);

      const result = await Assignment.readSubmissions(10);

      expect(result).toEqual([]);
    });
  });

  describe('readSubmissionHistories (fetchAllPages)', () => {
    it('should paginate submission histories', async () => {
      vi.mocked(assignmentsApi.submissionHistoriesList)
        .mockResolvedValueOnce({
          results: [{ id: 1, grader: 'g@test.edu' }],
          next: 'http://api/page=2',
        } as any)
        .mockResolvedValueOnce({
          results: [{ id: 2, grader: 'g2@test.edu' }],
          next: null,
        } as any);

      const result = await Assignment.readSubmissionHistories(5);

      expect(assignmentsApi.submissionHistoriesList).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('readSubmissionTests (fetchAllPages)', () => {
    it('should paginate submission tests', async () => {
      vi.mocked(assignmentsApi.submissionTestsList).mockResolvedValueOnce({
        results: [{ id: 1, passed: true }],
        next: null,
      } as any);

      const result = await Assignment.readSubmissionTests(5);

      expect(result).toHaveLength(1);
    });
  });

  describe('clone', () => {
    it('should call cloneCreate with assignment and destination course', async () => {
      vi.mocked(assignmentsApi.cloneCreate).mockResolvedValue({ id: 99, name: 'HW1-clone' } as any);

      const result = await Assignment.clone(1, 2);

      expect(assignmentsApi.cloneCreate).toHaveBeenCalledWith({
        id: 1,
        assignmentClone: { course: 2 },
      });
      expect(result.id).toBe(99);
    });
  });
});
