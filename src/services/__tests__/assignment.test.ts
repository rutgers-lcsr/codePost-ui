// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { Assignment, AssignmentStudent } from '../assignment';
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

  describe('create', () => {
    it('should call create with assignment data', async () => {
      const input = { name: 'New HW', course: 1, points: 100, period: 'Fall' } as any;
      vi.mocked(assignmentsApi.create).mockResolvedValue({ id: 10, ...input } as any);

      const result = await Assignment.create(input);

      expect(assignmentsApi.create).toHaveBeenCalledWith({ assignment: input });
      expect(result.id).toBe(10);
    });
  });

  describe('generateTest', () => {
    it('should map snake_case payload to camelCase API params', async () => {
      vi.mocked(assignmentsApi.generateTestCreate).mockResolvedValue({ testCode: 'pass' } as any);

      const result = await Assignment.generateTest(5, {
        target_filename: 'main.py',
        context_file_id: 42,
        context_file_name: 'helper.py',
        language: 'python',
        rubric_text: 'Check style',
      });

      expect(assignmentsApi.generateTestCreate).toHaveBeenCalledWith({
        id: 5,
        assignmentGenerateTest: {
          targetFilename: 'main.py',
          contextFileId: 42,
          contextFileName: 'helper.py',
          language: 'python',
          rubricText: 'Check style',
        },
      });
      expect(result).toEqual({ testCode: 'pass' });
    });
  });

  describe('readComments', () => {
    it('should call commentsList with the assignment id', async () => {
      vi.mocked(assignmentsApi.commentsList).mockResolvedValue([{ id: 1, text: 'fix' }] as any);

      const result = await Assignment.readComments(7);

      expect(assignmentsApi.commentsList).toHaveBeenCalledWith({ id: 7 });
      expect(result).toHaveLength(1);
    });
  });
});

// ---------------------------------------------------------------------------
// AssignmentStudent
// ---------------------------------------------------------------------------
describe('AssignmentStudent service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('read delegates to retrieve', async () => {
    vi.mocked(assignmentsApi.retrieve).mockResolvedValue({ id: 1 } as any);
    const result = await AssignmentStudent.read(1);
    expect(assignmentsApi.retrieve).toHaveBeenCalledWith({ id: 1 });
    expect(result.id).toBe(1);
  });

  it('readStudentTests delegates to studentTestsRetrieve', async () => {
    vi.mocked(assignmentsApi.studentTestsRetrieve).mockResolvedValue({ tests: [] } as any);
    const result = await AssignmentStudent.readStudentTests(5);
    expect(assignmentsApi.studentTestsRetrieve).toHaveBeenCalledWith({ id: 5 });
    expect(result).toEqual({ tests: [] });
  });

  it('createStudentUpload delegates to studentUploadCreate', async () => {
    vi.mocked(assignmentsApi.studentUploadCreate).mockResolvedValue({ id: 1 } as any);
    const payload = { files: [] } as any;
    await AssignmentStudent.createStudentUpload(3, payload);
    expect(assignmentsApi.studentUploadCreate).toHaveBeenCalledWith({ id: 3, assignment: payload });
  });

  it('updateStudentUpload delegates to studentUploadPartialUpdate', async () => {
    vi.mocked(assignmentsApi.studentUploadPartialUpdate).mockResolvedValue({ id: 1 } as any);
    const payload = { files: [] } as any;
    await AssignmentStudent.updateStudentUpload(3, payload);
    expect(assignmentsApi.studentUploadPartialUpdate).toHaveBeenCalledWith({ id: 3, patchedAssignment: payload });
  });

  it('readStudentUpload delegates to studentUploadRetrieve', async () => {
    vi.mocked(assignmentsApi.studentUploadRetrieve).mockResolvedValue({ id: 1 } as any);
    await AssignmentStudent.readStudentUpload(3);
    expect(assignmentsApi.studentUploadRetrieve).toHaveBeenCalledWith({ id: 3 });
  });

  it('beforeStudentUpload delegates to beforeStudentUploadRetrieve', async () => {
    vi.mocked(assignmentsApi.beforeStudentUploadRetrieve).mockResolvedValue({} as any);
    await AssignmentStudent.beforeStudentUpload(3);
    expect(assignmentsApi.beforeStudentUploadRetrieve).toHaveBeenCalledWith({ id: 3 });
  });

  it('downloadAssignmentZip delegates to downloadRetrieve', async () => {
    vi.mocked(assignmentsApi.downloadRetrieve).mockResolvedValue({ url: 'https://s3/zip' } as any);
    const result = await AssignmentStudent.downloadAssignmentZip(3);
    expect(assignmentsApi.downloadRetrieve).toHaveBeenCalledWith({ id: 3 });
    expect(result).toEqual({ url: 'https://s3/zip' });
  });
});
