// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for Submission service — specifically the pure `filesByVersion` utility.
 *
 * filesByVersion groups files by canonical path (path + name), keeping the
 * newest file in `new` and moving older versions to `old[path]`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external dependencies before importing
vi.mock('../../api-client/clients', () => ({
  submissionsApi: {
    create: vi.fn(),
    retrieve: vi.fn(),
    partialUpdate: vi.fn(),
    destroy: vi.fn(),
    historyList: vi.fn(),
    historyPartialUpdate: vi.fn(),
    testResultsRetrieve: vi.fn(),
    checkPermissionRetrieve: vi.fn(),
    submitRegradePartialUpdate: vi.fn(),
    deleteRegradePartialUpdate: vi.fn(),
    generatePartnerLinkRetrieve: vi.fn(),
    validatePartnerLinkAndReturnRetrieve: vi.fn(),
    validatePartnerLinkRetrieve: vi.fn(),
    removePartnerRetrieve: vi.fn(),
  },
  commentsApi: { retrieve: vi.fn() },
  filesApi: { retrieve: vi.fn() },
  rubricCommentsApi: { retrieve: vi.fn() },
}));

vi.mock('antd', () => ({
  message: { error: vi.fn() },
}));

import { Submission } from '../submission';
import { submissionsApi, filesApi, commentsApi, rubricCommentsApi } from '../../api-client/clients';

import { makeFile as makeFileFactory } from '../../test-utils';

/** Helper to build a minimal FileType-compatible object. */
const makeFile = (overrides: { id?: number; name?: string; path?: string; created?: string }) =>
  makeFileFactory(overrides as any);

describe('Submission.filesByVersion', () => {
  it('should return empty arrays for no files', () => {
    const result = Submission.filesByVersion([]);
    expect(result.new).toEqual([]);
    expect(result.old).toEqual({});
  });

  it('should return a single file as new with no old versions', () => {
    const file = makeFile({ id: 1, name: 'main.py' });
    const result = Submission.filesByVersion([file]);

    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(1);
    expect(Object.keys(result.old)).toHaveLength(0);
  });

  it('should keep the newest file when two versions share the same path', () => {
    const older = makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' });
    const newer = makeFile({ id: 2, name: 'main.py', created: '2024-06-01T00:00:00Z' });

    const result = Submission.filesByVersion([older, newer]);

    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(2);
    expect(result.old['/main.py']).toHaveLength(1);
    expect(result.old['/main.py'][0].id).toBe(1);
  });

  it('should handle multiple versions of the same file', () => {
    const v1 = makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' });
    const v2 = makeFile({ id: 2, name: 'main.py', created: '2024-03-01T00:00:00Z' });
    const v3 = makeFile({ id: 3, name: 'main.py', created: '2024-06-01T00:00:00Z' });

    const result = Submission.filesByVersion([v1, v2, v3]);

    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(3);
    expect(result.old['/main.py']).toHaveLength(2);
  });

  it('should treat files with different names as separate groups', () => {
    const file1 = makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' });
    const file2 = makeFile({ id: 2, name: 'util.py', created: '2024-01-01T00:00:00Z' });

    const result = Submission.filesByVersion([file1, file2]);

    expect(result.new).toHaveLength(2);
    expect(Object.keys(result.old)).toHaveLength(0);
  });

  it('should treat files with different paths as separate groups', () => {
    const file1 = makeFile({ id: 1, name: 'main.py', path: 'src/', created: '2024-01-01T00:00:00Z' });
    const file2 = makeFile({ id: 2, name: 'main.py', path: 'tests/', created: '2024-01-01T00:00:00Z' });

    const result = Submission.filesByVersion([file1, file2]);

    expect(result.new).toHaveLength(2);
    expect(Object.keys(result.old)).toHaveLength(0);
  });

  it('should strip leading/trailing slashes from path when computing canonical path', () => {
    const file1 = makeFile({ id: 1, name: 'main.py', path: '/src/', created: '2024-01-01T00:00:00Z' });
    const file2 = makeFile({ id: 2, name: 'main.py', path: 'src', created: '2024-06-01T00:00:00Z' });

    const result = Submission.filesByVersion([file1, file2]);

    // Both resolve to "src/main.py" so only one should be in new
    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(2);
  });

  it('should handle files with empty/undefined path', () => {
    const file1 = makeFile({ id: 1, name: 'readme.txt', path: '', created: '2024-01-01T00:00:00Z' });
    const file2 = makeFile({ id: 2, name: 'readme.txt', path: undefined, created: '2024-06-01T00:00:00Z' });

    const result = Submission.filesByVersion([file1, file2]);

    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(2);
  });

  it('should keep old versions sorted by insertion order (not date)', () => {
    const v1 = makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' });
    const v3 = makeFile({ id: 3, name: 'main.py', created: '2024-06-01T00:00:00Z' });
    const v2 = makeFile({ id: 2, name: 'main.py', created: '2024-03-01T00:00:00Z' });

    // Input order: v1, v3, v2
    const result = Submission.filesByVersion([v1, v3, v2]);

    expect(result.new[0].id).toBe(3);
    // Old should contain v1 and v2
    const oldIds = result.old['/main.py'].map((f: any) => f.id);
    expect(oldIds).toContain(1);
    expect(oldIds).toContain(2);
  });

  it('should handle files with same created date (uses <=, later in array wins)', () => {
    const file1 = makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' });
    const file2 = makeFile({ id: 2, name: 'main.py', created: '2024-01-01T00:00:00Z' });

    const result = Submission.filesByVersion([file1, file2]);

    // When dates are equal (<=), later file replaces earlier
    expect(result.new).toHaveLength(1);
    expect(result.new[0].id).toBe(2);
  });

  it('should handle mixed scenario: multiple files with versions', () => {
    const files = [
      makeFile({ id: 1, name: 'main.py', created: '2024-01-01T00:00:00Z' }),
      makeFile({ id: 2, name: 'util.py', created: '2024-01-01T00:00:00Z' }),
      makeFile({ id: 3, name: 'main.py', created: '2024-06-01T00:00:00Z' }),
      makeFile({ id: 4, name: 'test.py', created: '2024-02-01T00:00:00Z' }),
    ];

    const result = Submission.filesByVersion(files);

    expect(result.new).toHaveLength(3); // main.py(v3), util.py, test.py
    expect(result.old['/main.py']).toHaveLength(1);
  });
});

describe('Submission API methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create calls submissionsApi.create', async () => {
    vi.mocked(submissionsApi.create).mockResolvedValue({ id: 1 } as never);
    const result = await Submission.create({ assignment: 1, students: [] } as never);
    expect(result).toEqual({ id: 1 });
  });

  it('read calls submissionsApi.retrieve', async () => {
    vi.mocked(submissionsApi.retrieve).mockResolvedValue({ id: 5 } as never);
    const result = await Submission.read(5);
    expect(result).toEqual({ id: 5 });
  });

  it('update calls submissionsApi.partialUpdate', async () => {
    vi.mocked(submissionsApi.partialUpdate).mockResolvedValue({ id: 5 } as never);
    const result = await Submission.update({ id: 5, isFinalized: true } as never);
    expect(result).toEqual({ id: 5 });
  });

  it('delete calls submissionsApi.destroy', async () => {
    vi.mocked(submissionsApi.destroy).mockResolvedValue(undefined as never);
    await Submission.delete(5);
    expect(submissionsApi.destroy).toHaveBeenCalledWith({ id: 5 });
  });

  it('readHistory calls submissionsApi.historyList', async () => {
    vi.mocked(submissionsApi.historyList).mockResolvedValue([] as never);
    const result = await Submission.readHistory(1);
    expect(result).toEqual([]);
  });

  it('readTestResults calls submissionsApi.testResultsRetrieve', async () => {
    vi.mocked(submissionsApi.testResultsRetrieve).mockResolvedValue({ results: [] } as never);
    const result = await Submission.readTestResults(1);
    expect(result).toEqual({ results: [] });
  });

  it('checkPermission calls submissionsApi.checkPermissionRetrieve', async () => {
    vi.mocked(submissionsApi.checkPermissionRetrieve).mockResolvedValue({ canGrade: true } as never);
    const result = await Submission.checkPermission(1);
    expect(result).toEqual({ canGrade: true });
  });
});

describe('Submission.loadData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty arrays/objects when submission has no files', async () => {
    const [files, comments, rubric] = await Submission.loadData({ files: undefined } as never);
    expect(files).toEqual([]);
    expect(comments).toEqual({});
    expect(rubric).toEqual({});
  });

  it('fetches files by ID when files are numbers', async () => {
    vi.mocked(filesApi.retrieve)
      .mockResolvedValueOnce({ id: 1, name: 'a.py', comments: [] } as never)
      .mockResolvedValueOnce({ id: 2, name: 'b.py', comments: [] } as never);

    const [files, comments, rubric] = await Submission.loadData({
      files: [1, 2],
    } as never);
    expect(files).toHaveLength(2);
    expect(comments).toEqual({ 1: [], 2: [] });
    expect(rubric).toEqual({});
  });

  it('uses file objects directly when files are not numbers', async () => {
    const fileObjects = [
      { id: 10, name: 'a.py', comments: [] },
      { id: 11, name: 'b.py', comments: [] },
    ];

    const [files, comments] = await Submission.loadData({
      files: fileObjects,
    } as never);
    expect(files).toHaveLength(2);
    expect((files[0] as { id: number }).id).toBe(10);
    expect(comments).toEqual({ 10: [], 11: [] });
  });

  it('loads comments and rubric comments for files', async () => {
    const fileObjects = [{ id: 10, name: 'a.py', comments: [100, 101] }];
    vi.mocked(commentsApi.retrieve)
      .mockResolvedValueOnce({ id: 100, text: 'fix this', startLine: 1, endLine: 1, rubricComment: 200 } as never)
      .mockResolvedValueOnce({ id: 101, text: 'nice', startLine: 2, endLine: 2, rubricComment: undefined } as never);
    vi.mocked(rubricCommentsApi.retrieve).mockResolvedValue({ id: 200, text: 'rubric' } as never);

    const [, comments, rubric] = await Submission.loadData({ files: fileObjects } as never);
    expect(comments[10]).toHaveLength(2);
    expect(rubric[100]).toEqual({ id: 200, text: 'rubric' });
    expect(rubric[101]).toBeUndefined();
  });

  it('returns empty arrays on error', async () => {
    vi.mocked(filesApi.retrieve).mockRejectedValue(new Error('network'));

    const [files, comments, rubric] = await Submission.loadData({
      files: [999],
    } as never);
    expect(files).toEqual([]);
    expect(comments).toEqual({});
    expect(rubric).toEqual({});
  });
});

describe('Submission additional API methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateHistory calls historyPartialUpdate', async () => {
    vi.mocked(submissionsApi.historyPartialUpdate).mockResolvedValue({} as never);
    await Submission.updateHistory(1, { isFinalized: true } as never);
    expect(submissionsApi.historyPartialUpdate).toHaveBeenCalledWith({
      id: 1,
      patchedSubmission: { isFinalized: true },
    });
  });

  it('updateQuestion calls submitRegradePartialUpdate', async () => {
    vi.mocked(submissionsApi.submitRegradePartialUpdate).mockResolvedValue({} as never);
    await Submission.updateQuestion(1, { grader: 'x' } as never);
    expect(submissionsApi.submitRegradePartialUpdate).toHaveBeenCalled();
  });

  it('deleteQuestion calls deleteRegradePartialUpdate', async () => {
    vi.mocked(submissionsApi.deleteRegradePartialUpdate).mockResolvedValue({} as never);
    await Submission.deleteQuestion(1, {} as never);
    expect(submissionsApi.deleteRegradePartialUpdate).toHaveBeenCalled();
  });

  it('readPartnerLink calls generatePartnerLinkRetrieve', async () => {
    vi.mocked(submissionsApi.generatePartnerLinkRetrieve).mockResolvedValue({ token: 'abc' } as never);
    const result = await Submission.readPartnerLink(1);
    expect(result).toEqual({ token: 'abc' });
  });

  it('validatePartnerLinkAndReturn calls API', async () => {
    vi.mocked(submissionsApi.validatePartnerLinkAndReturnRetrieve).mockResolvedValue({ id: 1 } as never);
    const result = await Submission.validatePartnerLinkAndReturn(1, 'token');
    expect(result).toEqual({ id: 1 });
  });

  it('validatePartnerLink calls API', async () => {
    vi.mocked(submissionsApi.validatePartnerLinkRetrieve).mockResolvedValue({} as never);
    await Submission.validatePartnerLink(1, 'token');
    expect(submissionsApi.validatePartnerLinkRetrieve).toHaveBeenCalledWith({ id: 1, token: 'token' });
  });

  it('removePartner calls API', async () => {
    vi.mocked(submissionsApi.removePartnerRetrieve).mockResolvedValue({} as never);
    await Submission.removePartner(1);
    expect(submissionsApi.removePartnerRetrieve).toHaveBeenCalledWith({ id: 1 });
  });

  describe('loadData', () => {
    it('returns empty arrays when submission has no files', async () => {
      const [files, comments, rubricComments] = await Submission.loadData({ files: undefined } as any);
      expect(files).toEqual([]);
      expect(comments).toEqual({});
      expect(rubricComments).toEqual({});
    });

    it('fetches files by ID when files are numbers', async () => {
      const fakeFile = { id: 1, name: 'a.py', comments: [] };
      vi.mocked(filesApi.retrieve).mockResolvedValue(fakeFile as any);

      const [files] = await Submission.loadData({ files: [1] } as any);
      expect(filesApi.retrieve).toHaveBeenCalledWith({ id: 1 });
      expect(files).toHaveLength(1);
    });

    it('uses files directly when files are objects', async () => {
      const fakeFile = { id: 1, name: 'a.py', comments: [] };
      const [files] = await Submission.loadData({ files: [fakeFile] } as any);
      expect(filesApi.retrieve).not.toHaveBeenCalled();
      expect(files).toHaveLength(1);
    });

    it('loads comments for each file', async () => {
      const fakeComment = { id: 10, text: 'fix this', rubricComment: null };
      vi.mocked(commentsApi.retrieve).mockResolvedValue(fakeComment as any);
      const fakeFile = { id: 1, name: 'a.py', comments: [10] };

      const [, comments] = await Submission.loadData({ files: [fakeFile] } as any);
      expect(commentsApi.retrieve).toHaveBeenCalledWith({ id: 10 });
      expect(comments[1]).toHaveLength(1);
    });

    it('loads rubric comments when comment has rubricComment', async () => {
      const fakeComment = { id: 10, text: 'fix', rubricComment: 20, startLine: 1, endLine: 1 };
      const fakeRubric = { id: 20, text: 'style' };
      vi.mocked(commentsApi.retrieve).mockResolvedValue(fakeComment as any);
      vi.mocked(rubricCommentsApi.retrieve).mockResolvedValue(fakeRubric as any);
      const fakeFile = { id: 1, name: 'a.py', comments: [10] };

      const [, , rubricComments] = await Submission.loadData({ files: [fakeFile] } as any);
      expect(rubricCommentsApi.retrieve).toHaveBeenCalledWith({ id: 20 });
      expect(rubricComments[10]).toEqual(fakeRubric);
    });

    it('returns empty arrays on error', async () => {
      vi.mocked(filesApi.retrieve).mockRejectedValue(new Error('fail'));
      const [files, comments, rubricComments] = await Submission.loadData({ files: [1] } as any);
      expect(files).toEqual([]);
      expect(comments).toEqual({});
      expect(rubricComments).toEqual({});
    });
  });
});
