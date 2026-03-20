// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('antd', () => ({
  message: { error: vi.fn(), loading: vi.fn(), destroy: vi.fn(), success: vi.fn() },
}));

vi.mock('../../../../core/slack', () => ({
  sendSlack: vi.fn(),
}));

import { message } from 'antd';
import { sendSlack } from '../../../../core/slack';
import { awaitTestResult } from '../autograderPollingUtils';

describe('autograderPollingUtils', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls callback on SUCCESS with result', async () => {
    fetchSpy.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ status: 'SUCCESS', result: { output: 'pass' } }),
    });

    const callback = vi.fn();
    awaitTestResult('task-1', callback);

    // Advance past first interval tick (2000ms)
    await vi.advanceTimersByTimeAsync(2000);

    expect(callback).toHaveBeenCalledWith({ output: 'pass' });
  });

  it('keeps polling when SUCCESS but result is null', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ status: 'SUCCESS', result: null }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ status: 'SUCCESS', result: { done: true } }),
      });

    const callback = vi.fn();
    awaitTestResult('task-2', callback);

    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledWith({ done: true });
  });

  it('shows error and calls sendSlack on FAILURE', async () => {
    fetchSpy.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ status: 'FAILURE', result: { error: 'timeout' } }),
    });

    const callback = vi.fn();
    awaitTestResult('task-fail', callback);

    await vi.advanceTimersByTimeAsync(2000);

    expect(callback).not.toHaveBeenCalled();
    expect(sendSlack).toHaveBeenCalled();
    expect(message.error).toHaveBeenCalled();
  });

  it('shows error on non-200 response', async () => {
    fetchSpy.mockResolvedValue({
      status: 500,
      json: () => Promise.resolve({}),
    });

    const callback = vi.fn();
    awaitTestResult('task-err', callback);

    await vi.advanceTimersByTimeAsync(2000);

    expect(sendSlack).toHaveBeenCalled();
    expect(message.error).toHaveBeenCalled();
  });

  it('calls progressCallback when result available and status not SUCCESS/FAILURE', async () => {
    fetchSpy.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ status: 'RUNNING', result: { progress: 50 } }),
    });

    const callback = vi.fn();
    const progressCallback = vi.fn();
    awaitTestResult('task-progress', callback, progressCallback);

    await vi.advanceTimersByTimeAsync(2000);

    expect(progressCallback).toHaveBeenCalledWith({ progress: 50 });
    expect(callback).not.toHaveBeenCalled();
  });

  it('does nothing on pending status without result', async () => {
    fetchSpy.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ status: 'PENDING', result: null }),
    });

    const callback = vi.fn();
    awaitTestResult('task-pending', callback);

    await vi.advanceTimersByTimeAsync(2000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('shows error and clears interval after MAX_TRIES_RUN without progress callback', async () => {
    fetchSpy.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ status: 'PENDING', result: null }),
    });

    const callback = vi.fn();
    awaitTestResult('task-timeout', callback);

    // Advance past 150 ticks (150 * 2000ms = 300000ms)
    for (let i = 0; i < 150; i++) {
      await vi.advanceTimersByTimeAsync(2000);
    }

    expect(message.error).toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });
});
