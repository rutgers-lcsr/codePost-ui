// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API clients
vi.mock('../../api-client/clients', () => ({
  coursesApi: {
    aiSettingsRetrieve: vi.fn(),
    aiSettingsPartialUpdate: vi.fn(),
  },
  commentsApi: {
    generateCreateRaw: vi.fn(),
  },
}));

import { getCourseAISettings, updateCourseAISettings, generateComment } from '../aiService';
import { coursesApi, commentsApi } from '../../api-client/clients';

describe('getCourseAISettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns settings on success', async () => {
    const expected = { id: 1, aiEnabled: true, aiCommentsEnabled: true };
    vi.mocked(coursesApi.aiSettingsRetrieve).mockResolvedValue(expected as never);

    const result = await getCourseAISettings(1);
    expect(result).toEqual(expected);
    expect(coursesApi.aiSettingsRetrieve).toHaveBeenCalledWith({ id: 1 });
  });

  it('returns disabled settings on 403 error', async () => {
    vi.mocked(coursesApi.aiSettingsRetrieve).mockRejectedValue({
      response: { status: 403 },
    });

    const result = await getCourseAISettings(5);
    expect(result.id).toBe(5);
    expect(result.aiEnabled).toBe(false);
    expect(result.aiCommentsEnabled).toBe(false);
  });

  it('rethrows non-403 errors', async () => {
    vi.mocked(coursesApi.aiSettingsRetrieve).mockRejectedValue(new Error('Network error'));

    await expect(getCourseAISettings(1)).rejects.toThrow('Network error');
  });

  it('rethrows error objects without response', async () => {
    vi.mocked(coursesApi.aiSettingsRetrieve).mockRejectedValue({ message: 'fail' });

    await expect(getCourseAISettings(1)).rejects.toEqual({ message: 'fail' });
  });
});

describe('updateCourseAISettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the API with correct parameters', async () => {
    const settings = { aiProvider: 'openai' };
    const expected = { id: 1, aiEnabled: true, aiCommentsEnabled: true };
    vi.mocked(coursesApi.aiSettingsPartialUpdate).mockResolvedValue(expected as never);

    const result = await updateCourseAISettings(1, settings as never);
    expect(result).toEqual(expected);
    expect(coursesApi.aiSettingsPartialUpdate).toHaveBeenCalledWith({
      id: 1,
      patchedCourseAISettings: settings,
    });
  });
});

describe('generateComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns generated text on success', async () => {
    vi.mocked(commentsApi.generateCreateRaw).mockResolvedValue({
      raw: {
        json: vi.fn().mockResolvedValue({ text: 'Generated comment text' }),
      },
    } as never);

    const result = await generateComment({
      file_id: 1,
      start_line: 5,
      end_line: 10,
    });
    expect(result).toBe('Generated comment text');
  });

  it('returns empty string when response has no text', async () => {
    vi.mocked(commentsApi.generateCreateRaw).mockResolvedValue({
      raw: {
        json: vi.fn().mockResolvedValue({}),
      },
    } as never);

    const result = await generateComment({
      file_id: 1,
      start_line: 1,
      end_line: 2,
    });
    expect(result).toBe('');
  });

  it('passes optional parameters', async () => {
    vi.mocked(commentsApi.generateCreateRaw).mockResolvedValue({
      raw: {
        json: vi.fn().mockResolvedValue({ text: 'result' }),
      },
    } as never);

    await generateComment({
      file_id: 1,
      start_line: 1,
      end_line: 5,
      rubric_comment_id: 10,
      existing_text: 'draft',
      points: -2,
    });

    expect(commentsApi.generateCreateRaw).toHaveBeenCalledWith(
      expect.objectContaining({
        comment: expect.objectContaining({
          file_id: 1,
          rubric_comment_id: 10,
          existing_text: 'draft',
          points: -2,
        }),
      }),
    );
  });
});
