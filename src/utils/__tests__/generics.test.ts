// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('antd', () => ({
  message: { error: vi.fn() },
}));

vi.mock('../auth', () => ({
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  getDecodedTokenPayload: vi.fn(),
  redirectToLogin: vi.fn(),
}));

vi.mock('../logger', () => ({
  Logger: { error: vi.fn() },
}));

// Import mocked modules
import { message } from 'antd';
import { getAuthToken, getDecodedTokenPayload, redirectToLogin } from '../auth';
import { getHeaders, loadIDList, handleErrorResponse, decodeToPromise } from '../generics';

describe('getHeaders', () => {
  it('returns Content-Type and Authorization headers', () => {
    vi.mocked(getAuthToken).mockReturnValue('my-token');
    const headers = getHeaders();
    expect(headers).toEqual({
      Authorization: 'Bearer my-token',
      'Content-Type': 'application/json',
    });
  });
});

describe('loadIDList', () => {
  it('loads all objects by their IDs', async () => {
    const mockKlass = {
      read: vi.fn().mockImplementation((id: number) => Promise.resolve({ id, name: `item-${id}` })),
    };

    const result = await loadIDList([1, 2, 3], mockKlass);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 1, name: 'item-1' });
    expect(result[2]).toEqual({ id: 3, name: 'item-3' });
  });

  it('filters out failed requests', async () => {
    const mockKlass = {
      read: vi.fn().mockImplementation((id: number) => {
        if (id === 2) return Promise.reject(new Error('not found'));
        return Promise.resolve({ id });
      }),
    };

    const result = await loadIDList([1, 2, 3], mockKlass);
    expect(result).toHaveLength(2);
    expect(result.map((r: { id: number }) => r.id)).toEqual([1, 3]);
  });

  it('returns empty array for empty input', async () => {
    const mockKlass = { read: vi.fn() };
    const result = await loadIDList([], mockKlass);
    expect(result).toEqual([]);
  });

  it('passes urlArgs to read method', async () => {
    const mockKlass = {
      read: vi.fn().mockResolvedValue({ id: 1 }),
    };

    await loadIDList([1], mockKlass, { extra: 'param' });
    expect(mockKlass.read).toHaveBeenCalledWith(1, { extra: 'param' });
  });

  it('handles all requests failing', async () => {
    const mockKlass = {
      read: vi.fn().mockRejectedValue(new Error('fail')),
    };

    const result = await loadIDList([1, 2, 3], mockKlass);
    expect(result).toEqual([]);
  });
});

describe('handleErrorResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeResponse(status: number, body: unknown): Response {
    return {
      status,
      statusText: 'Error',
      json: vi.fn().mockResolvedValue(body),
    } as unknown as Response;
  }

  it('handles string error response', async () => {
    const res = makeResponse(400, 'Something went wrong');
    await expect(handleErrorResponse(res)).rejects.toBe('Something went wrong');
    expect(message.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('handles array error response', async () => {
    const res = makeResponse(400, ['Error 1', 'Error 2']);
    await expect(handleErrorResponse(res)).rejects.toEqual(['Error 1', 'Error 2']);
    expect(message.error).toHaveBeenCalledWith('Error 1 Error 2');
  });

  it('handles object with detail field', async () => {
    const res = makeResponse(403, { detail: 'Permission denied' });
    await expect(handleErrorResponse(res)).rejects.toEqual({ detail: 'Permission denied' });
    expect(message.error).toHaveBeenCalledWith('Permission denied');
  });

  it('handles object with field errors', async () => {
    const res = makeResponse(400, { name: ['Required'], email: ['Invalid format'] });
    await expect(handleErrorResponse(res)).rejects.toEqual({ name: ['Required'], email: ['Invalid format'] });
    expect(message.error).toHaveBeenCalledWith('name: Required; email: Invalid format');
  });

  it('handles non-array field values', async () => {
    const res = makeResponse(400, { name: 'Required' });
    await expect(handleErrorResponse(res)).rejects.toEqual({ name: 'Required' });
    expect(message.error).toHaveBeenCalledWith('name: Required');
  });

  it('handles non-standard response data with JSON.stringify', async () => {
    const res = makeResponse(400, 42);
    await expect(handleErrorResponse(res)).rejects.toBe(42);
    expect(message.error).toHaveBeenCalledWith('42');
  });

  describe('401 handling', () => {
    it('redirects to login when token is expired', async () => {
      vi.mocked(getDecodedTokenPayload).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      });

      const res = makeResponse(401, { detail: 'Not authenticated' });
      await expect(handleErrorResponse(res)).rejects.toBeDefined();
      expect(redirectToLogin).toHaveBeenCalled();
    });

    it('does not redirect when token is still valid', async () => {
      vi.mocked(getDecodedTokenPayload).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600, // expires in 1 hour
      });

      const res = makeResponse(401, { detail: 'Forbidden' });
      await expect(handleErrorResponse(res)).rejects.toBeDefined();
      expect(redirectToLogin).not.toHaveBeenCalled();
      // Shows authorization error message
      expect(message.error).toHaveBeenCalledWith('You are not authorized to access this resource.');
    });

    it('redirects to login when token payload is null', async () => {
      vi.mocked(getDecodedTokenPayload).mockReturnValue(null);

      const res = makeResponse(401, { detail: 'Auth error' });
      await expect(handleErrorResponse(res)).rejects.toBeDefined();
      expect(redirectToLogin).toHaveBeenCalled();
    });

    it('redirects to login when token exp is not a number', async () => {
      vi.mocked(getDecodedTokenPayload).mockReturnValue({
        exp: 'invalid',
      });

      const res = makeResponse(401, { detail: 'Auth error' });
      await expect(handleErrorResponse(res)).rejects.toBeDefined();
      expect(redirectToLogin).toHaveBeenCalled();
    });

    it('redirects to login when getDecodedTokenPayload throws', async () => {
      vi.mocked(getDecodedTokenPayload).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const res = makeResponse(401, { detail: 'Auth error' });
      await expect(handleErrorResponse(res)).rejects.toBeDefined();
      expect(redirectToLogin).toHaveBeenCalled();
    });
  });
});

describe('decodeToPromise', () => {
  it('resolves with decoded value when input is valid', async () => {
    const NumberType = await import('io-ts').then((m) => m.number);
    const result = await decodeToPromise(NumberType, 42);
    expect(result).toBe(42);
  });

  it('rejects with error when input is invalid', async () => {
    const NumberType = await import('io-ts').then((m) => m.number);
    await expect(decodeToPromise(NumberType, 'not-a-number')).rejects.toThrow();
  });

  it('resolves with decoded object for complex types', async () => {
    const iot = await import('io-ts');
    const UserType = iot.type({ id: iot.number, name: iot.string });
    const result = await decodeToPromise(UserType, { id: 1, name: 'Alice' });
    expect(result).toEqual({ id: 1, name: 'Alice' });
  });

  it('rejects when object is missing required fields', async () => {
    const iot = await import('io-ts');
    const UserType = iot.type({ id: iot.number, name: iot.string });
    await expect(decodeToPromise(UserType, { id: 1 })).rejects.toThrow();
  });
});
