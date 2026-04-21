// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApiClientsMock } from '@test-utils/mocks';

vi.mock('antd', () => ({
  message: {
    loading: vi.fn(),
    destroy: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../services/assignment', () => ({
  Assignment: { read: vi.fn() },
}));

vi.mock('../../../services/course', () => ({
  Course: { addToRoster: vi.fn() },
}));

vi.mock('../../../services/submission', () => ({
  Submission: { create: vi.fn(), read: vi.fn() },
}));

vi.mock('../../../api-client/clients', () => createApiClientsMock());

vi.mock('../../../utils/file', () => ({
  getFileContent: vi.fn(),
}));

vi.mock('../FakeSubmissionData', () => ({
  FAKE_FILES: { 'hello.py': 'print("hello")', 'main.java': 'class Main {}' },
}));

import { message } from 'antd';
import { Assignment } from '../../../services/assignment';
import { Course } from '../../../services/course';
import { Submission } from '../../../services/submission';
import { submissionFilesApi, filesApi } from '../../../api-client/clients';
import { getFileContent } from '../../../utils/file';
import { createFakeSubmission } from '../FakeSubmissionUtils';

describe('createFakeSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Assignment.read).mockResolvedValue({ course: 10 } as any);
    vi.mocked(Course.addToRoster).mockResolvedValue(undefined as any);
    vi.mocked(Submission.create).mockResolvedValue({ id: 99 } as any);
    vi.mocked(submissionFilesApi.create).mockResolvedValue({} as any);
  });

  it('creates a fake submission with default files', async () => {
    await createFakeSubmission(1);

    expect(Assignment.read).toHaveBeenCalledWith(1);
    expect(Course.addToRoster).toHaveBeenCalled();
    expect(Submission.create).toHaveBeenCalled();
    expect(submissionFilesApi.create).toHaveBeenCalledTimes(2); // 2 FAKE_FILES
    expect(message.success).toHaveBeenCalledWith('Fake Submission Created!');
  });

  it('shows loading message', async () => {
    await createFakeSubmission(1);
    expect(message.loading).toHaveBeenCalledWith('Creating fake submission...', 0);
  });

  it('shows cloning message when sourceSubmissionId provided', async () => {
    vi.mocked(Submission.read).mockResolvedValue({ files: [] } as any);
    await createFakeSubmission(1, 42);
    expect(message.loading).toHaveBeenCalledWith('Cloning submission...', 0);
  });

  it('clones files from source submission (file objects)', async () => {
    const sourceFiles = [
      { name: 'test.py', extension: 'py', path: '/src', data: 'content1' },
      { name: 'main.js', extension: 'js', path: null, code: 'content2' },
    ];
    vi.mocked(Submission.read).mockResolvedValue({ files: sourceFiles } as any);
    vi.mocked(getFileContent).mockReturnValue(null as any);

    await createFakeSubmission(1, 42);

    expect(Submission.read).toHaveBeenCalledWith(42);
    expect(submissionFilesApi.create).toHaveBeenCalledTimes(2);
    expect(message.success).toHaveBeenCalledWith('Submission Cloned!');
  });

  it('clones files from source submission (file IDs)', async () => {
    vi.mocked(Submission.read).mockResolvedValue({ files: [100, 200] } as any);
    vi.mocked(filesApi.retrieve).mockResolvedValue({ name: 'fetched.py', extension: 'py', data: 'code' } as any);
    vi.mocked(getFileContent).mockReturnValue('code');

    await createFakeSubmission(1, 42);

    expect(filesApi.retrieve).toHaveBeenCalledTimes(2);
    expect(submissionFilesApi.create).toHaveBeenCalledTimes(2);
  });

  it('uses getFileContent helper for file data', async () => {
    vi.mocked(Submission.read).mockResolvedValue({
      files: [{ name: 'f.txt', extension: 'txt' }],
    } as any);
    vi.mocked(getFileContent).mockReturnValue('helper-content');

    await createFakeSubmission(1, 42);

    expect(getFileContent).toHaveBeenCalled();
    expect(submissionFilesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionFile: expect.objectContaining({ data: 'helper-content' }),
      }),
    );
  });

  it('handles roster add failure', async () => {
    vi.mocked(Course.addToRoster).mockRejectedValue(new Error('roster fail'));

    await createFakeSubmission(1);

    expect(message.error).toHaveBeenCalledWith('Failed to add fake student to roster.');
    expect(Submission.create).not.toHaveBeenCalled();
  });

  it('handles submission create failure', async () => {
    vi.mocked(Submission.create).mockRejectedValue(new Error('create fail'));

    await createFakeSubmission(1);

    expect(message.error).toHaveBeenCalledWith('Failed to create submission. See console.');
  });

  it('handles source submission read failure in clone mode', async () => {
    vi.mocked(Submission.read).mockRejectedValue(new Error('read fail'));

    await createFakeSubmission(1, 42);

    expect(message.error).toHaveBeenCalledWith('Failed to read source files.');
  });

  it('handles individual file clone failure gracefully', async () => {
    vi.mocked(Submission.read).mockResolvedValue({
      files: [{ name: 'f.txt', extension: 'txt' }],
    } as any);
    vi.mocked(getFileContent).mockReturnValue(null as any);
    vi.mocked(submissionFilesApi.create).mockRejectedValue(new Error('file fail'));

    // Should not throw, just log the error
    await createFakeSubmission(1, 42);

    expect(message.success).toHaveBeenCalledWith('Submission Cloned!');
  });

  it('falls back to .data/.code when getFileContent returns null', async () => {
    vi.mocked(Submission.read).mockResolvedValue({
      files: [{ name: 'f.txt', extension: 'txt', data: 'fallback-data' }],
    } as any);
    vi.mocked(getFileContent).mockReturnValue(null as any);

    await createFakeSubmission(1, 42);

    expect(submissionFilesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionFile: expect.objectContaining({ data: 'fallback-data' }),
      }),
    );
  });

  it('handles empty files in source submission', async () => {
    vi.mocked(Submission.read).mockResolvedValue({ files: [] } as any);

    await createFakeSubmission(1, 42);

    expect(submissionFilesApi.create).not.toHaveBeenCalled();
    expect(message.success).toHaveBeenCalledWith('Submission Cloned!');
  });

  it('creates correct file data for default mode', async () => {
    await createFakeSubmission(5);

    const calls = vi.mocked(submissionFilesApi.create).mock.calls;
    // Check that files have correct structure
    for (const call of calls) {
      const sf = (call[0] as any).submissionFile;
      expect(sf.submission).toBe(99);
      expect(sf.name).toBeTruthy();
      expect(sf.extension).toBeTruthy();
    }
  });
});
