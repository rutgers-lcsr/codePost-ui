// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileExecutionAsync } from '../useFileExecutionAsync';

vi.mock('../../api-client/clients', () => ({
  autograderApi: {
    executeFileAsyncCreate: vi.fn(),
    tasksRetrieve: vi.fn(),
  },
}));

vi.mock('antd', () => ({
  message: { error: vi.fn(), loading: vi.fn(), destroy: vi.fn(), success: vi.fn() },
}));

vi.mock('../../utils/auth', () => ({
  getAuthToken: vi.fn(),
}));

import { autograderApi } from '../../api-client/clients';
import { getAuthToken } from '../../utils/auth';

describe('useFileExecutionAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial state', () => {
    vi.mocked(getAuthToken).mockReturnValue('token');
    const { result } = renderHook(() => useFileExecutionAsync());
    expect(result.current.isExecuting).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('throws when not authenticated', async () => {
    vi.mocked(getAuthToken).mockReturnValue(null);
    const { result } = renderHook(() => useFileExecutionAsync());

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.execute(1);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('You must be logged in to run files.');
    expect(result.current.error).toBe('You must be logged in to run files.');
    expect(result.current.isExecuting).toBe(false);
  });

  it('executes and returns normalized result', async () => {
    vi.mocked(getAuthToken).mockReturnValue('token');
    vi.mocked(autograderApi.executeFileAsyncCreate).mockResolvedValue({ taskId: 'abc' } as any);
    vi.mocked(autograderApi.tasksRetrieve).mockResolvedValue({
      status: 'SUCCESS',
      result: { success: true, stdout: 'ok', execution_time: 1.5 },
    } as any);

    const { result } = renderHook(() => useFileExecutionAsync());

    let execResult: any;
    await act(async () => {
      execResult = await result.current.execute(42);
    });

    expect(execResult.success).toBe(true);
    expect(execResult.stdout).toBe('ok');
    expect(result.current.isExecuting).toBe(false);
    expect(result.current.result).not.toBeNull();
  });

  it('handles snake_case task_id from response', async () => {
    vi.mocked(getAuthToken).mockReturnValue('token');
    vi.mocked(autograderApi.executeFileAsyncCreate).mockResolvedValue({ task_id: 'xyz' } as any);
    vi.mocked(autograderApi.tasksRetrieve).mockResolvedValue({
      status: 'SUCCESS',
      result: { success: true, execution_time: 0 },
    } as any);

    const { result } = renderHook(() => useFileExecutionAsync());

    await act(async () => {
      await result.current.execute(1);
    });

    expect(autograderApi.tasksRetrieve).toHaveBeenCalledWith({ id: 'xyz' });
  });

  it('throws when no task ID returned', async () => {
    vi.mocked(getAuthToken).mockReturnValue('token');
    vi.mocked(autograderApi.executeFileAsyncCreate).mockResolvedValue({} as any);

    const { result } = renderHook(() => useFileExecutionAsync());

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.execute(1);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toContain('No task ID returned');
  });

  it('handles Error in catch block', async () => {
    vi.mocked(getAuthToken).mockReturnValue('token');
    vi.mocked(autograderApi.executeFileAsyncCreate).mockRejectedValue(new Error('connection lost'));

    const { result } = renderHook(() => useFileExecutionAsync());

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.execute(1);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('connection lost');
    expect(result.current.error).toBe('connection lost');
    expect(result.current.isExecuting).toBe(false);
  });

  it('handles ResponseError with JSON body', async () => {
    vi.mocked(getAuthToken).mockReturnValue('token');

    const { ResponseError } = await import('../../api-client/runtime');
    const mockResponse = new Response(JSON.stringify({ detail: 'forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
    const err = new ResponseError(mockResponse, 'Forbidden');
    vi.mocked(autograderApi.executeFileAsyncCreate).mockRejectedValue(err);

    const { result } = renderHook(() => useFileExecutionAsync());

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.execute(1);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('forbidden');
    expect(result.current.error).toBe('forbidden');
  });

  it('handles ResponseError with text body', async () => {
    vi.mocked(getAuthToken).mockReturnValue('token');

    const { ResponseError } = await import('../../api-client/runtime');
    const mockResponse = new Response('Server error', {
      status: 500,
      headers: { 'content-type': 'text/plain' },
    });
    const err = new ResponseError(mockResponse, 'Server Error');
    vi.mocked(autograderApi.executeFileAsyncCreate).mockRejectedValue(err);

    const { result } = renderHook(() => useFileExecutionAsync());

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.execute(1);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('Server error');
    expect(result.current.error).toBe('Server error');
  });

  it('passes execution options correctly', async () => {
    vi.mocked(getAuthToken).mockReturnValue('token');
    vi.mocked(autograderApi.executeFileAsyncCreate).mockResolvedValue({ taskId: 'abc' } as any);
    vi.mocked(autograderApi.tasksRetrieve).mockResolvedValue({
      status: 'SUCCESS',
      result: { success: true, execution_time: 0 },
    } as any);

    const { result } = renderHook(() => useFileExecutionAsync());

    await act(async () => {
      await result.current.execute(10, {
        timeout: 120,
        forceExecute: true,
        codeOverride: 'print("hi")',
      });
    });

    expect(autograderApi.executeFileAsyncCreate).toHaveBeenCalledWith({
      asyncExecutionRequest: {
        fileId: 10,
        timeout: 120,
        forceExecute: true,
        testCode: undefined,
        codeOverride: 'print("hi")',
      },
    });
  });
});
