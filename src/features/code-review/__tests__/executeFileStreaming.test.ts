// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeFileWithStreaming, executeFile } from '../execution/executeFileStreaming';
import { createLocalStorageMock, installLocalStorageMock, restoreLocalStorage } from '../../../test-utils';

/**
 * Helper to create a ReadableStream from SSE text chunks.
 */
function createSSEStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

function mockFetchResponse(opts: {
  ok?: boolean;
  status?: number;
  body?: ReadableStream<Uint8Array> | null;
  text?: string;
  json?: unknown;
}) {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    body: opts.body ?? null,
    text: async () => opts.text ?? '',
    json: async () => opts.json ?? {},
  } as unknown as Response;
}

describe('executeFileWithStreaming', () => {
  const { mock } = createLocalStorageMock();

  beforeEach(() => {
    installLocalStorageMock(mock);
    vi.stubGlobal('fetch', vi.fn());
    process.env.REACT_APP_API_URL = 'http://localhost:8000';
  });

  afterEach(() => {
    localStorage.clear();
    restoreLocalStorage();
    vi.restoreAllMocks();
    delete process.env.REACT_APP_API_URL;
  });

  it('calls onError when no token is present', async () => {
    const onError = vi.fn();

    await executeFileWithStreaming(1, {}, { onError });

    expect(onError).toHaveBeenCalledWith('No authentication token found');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls onError on HTTP error response', async () => {
    localStorage.setItem('token', 'test-token');
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: false, status: 500, text: 'Internal Server Error' }));
    const onError = vi.fn();

    await executeFileWithStreaming(1, {}, { onError });

    expect(onError).toHaveBeenCalledWith('HTTP error 500: Internal Server Error');
  });

  it('calls onError when response body is not readable', async () => {
    localStorage.setItem('token', 'test-token');
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: true, body: null }));
    const onError = vi.fn();

    await executeFileWithStreaming(1, {}, { onError });

    expect(onError).toHaveBeenCalledWith('Response body is not readable');
  });

  it('processes progress events from SSE stream', async () => {
    localStorage.setItem('token', 'test-token');
    const stream = createSSEStream([
      'event:progress\ndata:{"status":"running","message":"Step 1"}\n\n',
      'event:complete\ndata:{"success":true,"execution_time":1.5}\n\n',
    ]);
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: true, body: stream }));

    const onProgress = vi.fn();
    const onComplete = vi.fn();

    await executeFileWithStreaming(1, {}, { onProgress, onComplete });

    expect(onProgress).toHaveBeenCalledWith({ status: 'running', message: 'Step 1' });
    expect(onComplete).toHaveBeenCalledWith({ success: true, execution_time: 1.5 });
  });

  it('handles error events from SSE stream', async () => {
    localStorage.setItem('token', 'test-token');
    const stream = createSSEStream(['event:error\ndata:{"error":"Timeout exceeded"}\n\n']);
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: true, body: stream }));

    const onError = vi.fn();

    await executeFileWithStreaming(1, {}, { onError });

    expect(onError).toHaveBeenCalledWith('Timeout exceeded');
  });

  it('uses "Unknown error" when error event has no error field', async () => {
    localStorage.setItem('token', 'test-token');
    const stream = createSSEStream(['event:error\ndata:{}\n\n']);
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: true, body: stream }));

    const onError = vi.fn();

    await executeFileWithStreaming(1, {}, { onError });

    expect(onError).toHaveBeenCalledWith('Unknown error');
  });

  it('calls onError when stream ends without complete event', async () => {
    localStorage.setItem('token', 'test-token');
    const stream = createSSEStream(['event:progress\ndata:{"status":"running","message":"..."}\n\n']);
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: true, body: stream }));

    const onError = vi.fn();

    await executeFileWithStreaming(1, {}, { onError });

    expect(onError).toHaveBeenCalledWith('Connection closed unexpectedly');
  });

  it('skips empty data lines', async () => {
    localStorage.setItem('token', 'test-token');
    const stream = createSSEStream([
      'event:progress\ndata:\n\nevent:complete\ndata:{"success":true,"execution_time":0}\n\n',
    ]);
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: true, body: stream }));

    const onProgress = vi.fn();
    const onComplete = vi.fn();

    await executeFileWithStreaming(1, {}, { onProgress, onComplete });

    // Empty data line is skipped, progress is not called
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('handles JSON parse errors gracefully', async () => {
    localStorage.setItem('token', 'test-token');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stream = createSSEStream([
      'event:progress\ndata:NOT-JSON\n\nevent:complete\ndata:{"success":true,"execution_time":0}\n\n',
    ]);
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: true, body: stream }));

    const onComplete = vi.fn();

    await executeFileWithStreaming(1, {}, { onComplete });

    expect(consoleError).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('catches network errors from fetch', async () => {
    localStorage.setItem('token', 'test-token');
    vi.mocked(fetch).mockRejectedValue(new Error('Network failure'));
    const onError = vi.fn();

    await executeFileWithStreaming(1, {}, { onError });

    expect(onError).toHaveBeenCalledWith('Network failure');
  });

  it('catches non-Error throws from fetch', async () => {
    localStorage.setItem('token', 'test-token');
    vi.mocked(fetch).mockRejectedValue('string error');
    const onError = vi.fn();

    await executeFileWithStreaming(1, {}, { onError });

    expect(onError).toHaveBeenCalledWith('Unknown error');
  });

  it('sends correct request body with options', async () => {
    localStorage.setItem('token', 'test-token');
    const stream = createSSEStream(['event:complete\ndata:{"success":true,"execution_time":0}\n\n']);
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: true, body: stream }));

    await executeFileWithStreaming(42, { timeout: 120, force_execute: true, codeOverride: 'print("hi")' }, {});

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/autograder/execute/file/streaming/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          file_id: 42,
          timeout: 120,
          force_execute: true,
          code_override: 'print("hi")',
        }),
      }),
    );
  });

  it('uses default timeout and force_execute when not provided', async () => {
    localStorage.setItem('token', 'test-token');
    const stream = createSSEStream(['event:complete\ndata:{"success":true,"execution_time":0}\n\n']);
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: true, body: stream }));

    await executeFileWithStreaming(1, {}, {});

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          file_id: 1,
          timeout: 60,
          force_execute: false,
          code_override: undefined,
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// executeFile (legacy fallback)
// ---------------------------------------------------------------------------
describe('executeFile', () => {
  const { mock } = createLocalStorageMock();

  beforeEach(() => {
    installLocalStorageMock(mock);
    vi.stubGlobal('fetch', vi.fn());
    process.env.REACT_APP_API_URL = 'http://localhost:8000';
  });

  afterEach(() => {
    localStorage.clear();
    restoreLocalStorage();
    vi.restoreAllMocks();
    delete process.env.REACT_APP_API_URL;
  });

  it('throws when no token is present', async () => {
    await expect(executeFile(1)).rejects.toThrow('No authentication token found');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns parsed JSON on success', async () => {
    localStorage.setItem('token', 'test-token');
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ ok: true, json: { success: true, execution_time: 2.0, stdout: 'hello' } }),
    );

    const result = await executeFile(1);

    expect(result.success).toBe(true);
    expect(result.execution_time).toBe(2.0);
  });

  it('throws on HTTP error', async () => {
    localStorage.setItem('token', 'test-token');
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: false, status: 403, text: 'Forbidden' }));

    await expect(executeFile(1)).rejects.toThrow('HTTP error 403: Forbidden');
  });

  it('sends correct request body', async () => {
    localStorage.setItem('token', 'test-token');
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ ok: true, json: { success: true, execution_time: 0 } }));

    await executeFile(5, { timeout: 90, force_execute: true });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/autograder/execute/file/',
      expect.objectContaining({
        body: JSON.stringify({
          file_id: 5,
          timeout: 90,
          force_execute: true,
        }),
      }),
    );
  });
});
