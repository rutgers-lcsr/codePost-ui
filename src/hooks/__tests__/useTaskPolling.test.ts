// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskPolling } from '../useTaskPolling';

vi.mock('../../api-client/clients', () => ({
  autograderApi: {
    tasksRetrieve: vi.fn(),
    executeFileAsyncCreate: vi.fn(),
  },
}));

vi.mock('antd', () => ({
  message: { error: vi.fn(), loading: vi.fn(), destroy: vi.fn(), success: vi.fn() },
}));

import { autograderApi } from '../../api-client/clients';

describe('useTaskPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns result when task succeeds', async () => {
    vi.mocked(autograderApi.tasksRetrieve).mockResolvedValue({
      status: 'SUCCESS',
      result: { stdout: 'hello' },
    } as any);

    const { result } = renderHook(() => useTaskPolling());

    let taskResult: any;
    await act(async () => {
      taskResult = await result.current.pollTask('task-123');
    });

    expect(taskResult).toEqual({ stdout: 'hello' });
  });

  it('throws when task fails', async () => {
    vi.mocked(autograderApi.tasksRetrieve).mockResolvedValue({
      status: 'FAILURE',
    } as any);

    const { result } = renderHook(() => useTaskPolling());

    await expect(
      act(async () => {
        await result.current.pollTask('task-fail');
      }),
    ).rejects.toThrow('Task failed or was revoked');
  });

  it('throws when task is revoked', async () => {
    vi.mocked(autograderApi.tasksRetrieve).mockResolvedValue({
      status: 'REVOKED',
    } as any);

    const { result } = renderHook(() => useTaskPolling());

    await expect(
      act(async () => {
        await result.current.pollTask('task-revoked');
      }),
    ).rejects.toThrow('Task failed or was revoked');
  });

  it('rethrows on network error', async () => {
    vi.mocked(autograderApi.tasksRetrieve).mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useTaskPolling());

    await expect(
      act(async () => {
        await result.current.pollTask('task-err');
      }),
    ).rejects.toThrow('Network down');
  });

  it('polls until success after pending status', async () => {
    let callCount = 0;
    vi.mocked(autograderApi.tasksRetrieve).mockImplementation(async () => {
      callCount++;
      if (callCount >= 3) {
        return { status: 'SUCCESS', result: { done: true } } as any;
      }
      return { status: 'PENDING' } as any;
    });

    const { result } = renderHook(() => useTaskPolling());

    let taskResult: any;
    await act(async () => {
      const pollPromise = result.current.pollTask('task-poll');
      // Advance timers to resolve internal delays
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(1000);
      }
      taskResult = await pollPromise;
    });

    expect(taskResult).toEqual({ done: true });
    expect(callCount).toBeGreaterThanOrEqual(3);
  });
});
