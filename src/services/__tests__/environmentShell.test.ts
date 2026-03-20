// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock auth module
vi.mock('../../utils/auth', () => ({
  getAuthToken: vi.fn(),
}));

import { getAuthToken } from '../../utils/auth';
import { startShellSession, execShellCommand, stopShellSession } from '../environmentShell';

const mockGetAuthToken = vi.mocked(getAuthToken);

describe('environmentShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('startShellSession', () => {
    it('sends POST to correct URL with bearer token for JWT', async () => {
      mockGetAuthToken.mockReturnValue('eyJ.payload.sig');
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            containerId: 'abc123',
            image: 'python:3.10',
            expiresAt: '2025-01-01T00:00:00Z',
            workingDir: '/home',
            mounts: [],
          }),
        ),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await startShellSession(42, { timeoutSeconds: 30 });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/autograder/environments/42/shell/start/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ timeoutSeconds: 30 }),
        }),
      );
      expect(result.containerId).toBe('abc123');
    });

    it('uses Token auth for non-JWT tokens', async () => {
      mockGetAuthToken.mockReturnValue('abc123plaintoken');
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ containerId: 'x' })),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await startShellSession(1, {});
      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = (callArgs[1] as RequestInit).headers as Record<string, string>;
      expect(headers.Authorization).toBe('Token abc123plaintoken');
    });

    it('omits Authorization header when no token', async () => {
      mockGetAuthToken.mockReturnValue(null as unknown as string);
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ containerId: 'x' })),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await startShellSession(1, {});
      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = (callArgs[1] as RequestInit).headers as Record<string, string>;
      expect(headers.Authorization).toBeUndefined();
    });

    it('throws on non-ok response', async () => {
      mockGetAuthToken.mockReturnValue('eyJ.payload.sig');
      const mockResponse = {
        ok: false,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Something went wrong' })),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await expect(startShellSession(1, {})).rejects.toThrow('Something went wrong');
    });

    it('throws statusText when no error field in response', async () => {
      mockGetAuthToken.mockReturnValue('eyJ.payload.sig');
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
        text: vi.fn().mockResolvedValue(''),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await expect(startShellSession(1, {})).rejects.toThrow('Not Found');
    });
  });

  describe('execShellCommand', () => {
    it('sends correct payload', async () => {
      mockGetAuthToken.mockReturnValue('eyJ.payload.sig');
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ exitCode: 0, stdout: 'hello', stderr: '' })),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await execShellCommand(42, {
        containerId: 'abc',
        command: 'echo hello',
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('hello');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/autograder/environments/42/shell/exec/'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('stopShellSession', () => {
    it('sends stop request', async () => {
      mockGetAuthToken.mockReturnValue('eyJ.payload.sig');
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ success: true })),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await stopShellSession(42, { containerId: 'abc' });
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/autograder/environments/42/shell/stop/'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('requestJson error handling', () => {
    it('uses detail field from error response', async () => {
      mockGetAuthToken.mockReturnValue('eyJ.payload.sig');
      const mockResponse = {
        ok: false,
        statusText: 'Forbidden',
        text: vi.fn().mockResolvedValue(JSON.stringify({ detail: 'Permission denied' })),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await expect(startShellSession(1, {})).rejects.toThrow('Permission denied');
    });

    it('falls back to Request failed when no error or detail', async () => {
      mockGetAuthToken.mockReturnValue('eyJ.payload.sig');
      const mockResponse = {
        ok: false,
        statusText: '',
        text: vi.fn().mockResolvedValue(JSON.stringify({})),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await expect(startShellSession(1, {})).rejects.toThrow('Request failed');
    });
  });
});
