// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../../utils/auth', () => ({
  getAuthToken: vi.fn().mockReturnValue('test-token'),
}));

import { executeFile } from '../execution';

describe('executeFile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends POST to autograder execute/file endpoint', async () => {
    const mockResult = {
      success: true,
      stdout: 'hello',
      stderr: '',
      error: null,
      execution_time: 0.5,
      timestamp: '2025-01-01T00:00:00Z',
    };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResult),
    } as unknown as Response);

    const result = await executeFile({ file_id: 42, timeout: 30 });
    expect(result.success).toBe(true);
    expect(result.stdout).toBe('hello');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/autograder/execute/file/'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('Internal Server Error'),
    } as unknown as Response);

    await expect(executeFile({ file_id: 42 })).rejects.toThrow('Execution API error: 500');
  });

  it('includes optional fields in request body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, execution_time: 0, timestamp: '' }),
    } as unknown as Response);

    await executeFile({
      file_id: 1,
      timeout: 10,
      force_execute: true,
      test_code: 'assert True',
    });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.file_id).toBe(1);
    expect(body.timeout).toBe(10);
    expect(body.force_execute).toBe(true);
    expect(body.test_code).toBe('assert True');
  });
});
