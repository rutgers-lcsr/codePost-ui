// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api-client/clients', () => ({
  coursesApi: {
    list: vi.fn(),
    retrieve: vi.fn(),
    create: vi.fn(),
    partialUpdate: vi.fn(),
    rosterRetrieve: vi.fn(),
    rosterPartialUpdate: vi.fn(),
    addToRosterPartialUpdate: vi.fn(),
    removeFromRosterPartialUpdate: vi.fn(),
    courseSettingsRetrieve: vi.fn(),
  },
  apiClientConfig: { basePath: 'https://api.example.com' },
}));

vi.mock('../../utils/auth', () => ({
  getAuthToken: vi.fn(() => 'test-token'),
}));

import { Course } from '../course';
import { coursesApi } from '../../api-client/clients';

describe('Course service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('calls coursesApi.list and returns courses', async () => {
      const mockCourses = [{ id: 1, name: 'CS101' }];
      vi.mocked(coursesApi.list).mockResolvedValue(mockCourses as any);

      const result = await Course.list();

      expect(coursesApi.list).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCourses);
    });
  });

  describe('read', () => {
    it('calls retrieve with correct id', async () => {
      const mockCourse = { id: 42, name: 'CS201' };
      vi.mocked(coursesApi.retrieve).mockResolvedValue(mockCourse as any);

      const result = await Course.read(42);

      expect(coursesApi.retrieve).toHaveBeenCalledWith({ id: 42 });
      expect(result).toEqual(mockCourse);
    });
  });

  describe('create', () => {
    it('calls create with course payload', async () => {
      const payload = { name: 'CS301', period: 'Spring 2026', organization: 1 };
      const mockResult = { id: 100, ...payload };
      vi.mocked(coursesApi.create).mockResolvedValue(mockResult as any);

      const result = await Course.create(payload as any);

      expect(coursesApi.create).toHaveBeenCalledWith({ course: payload });
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('calls partialUpdate with id and payload', async () => {
      const payload = { name: 'Updated Course' };
      vi.mocked(coursesApi.partialUpdate).mockResolvedValue({ id: 1, ...payload } as any);

      await Course.update(1, payload);

      expect(coursesApi.partialUpdate).toHaveBeenCalledWith({ id: 1, patchedCourse: payload });
    });
  });

  describe('readRoster', () => {
    it('calls rosterRetrieve with course id', async () => {
      const mockRoster = { courseAdmins: [], students: [], graders: [] };
      vi.mocked(coursesApi.rosterRetrieve).mockResolvedValue(mockRoster as any);

      const result = await Course.readRoster(5);

      expect(coursesApi.rosterRetrieve).toHaveBeenCalledWith({ id: 5 });
      expect(result).toEqual(mockRoster);
    });
  });

  describe('updateRoster', () => {
    it('calls rosterPartialUpdate with correct args', async () => {
      const payload = { name: 'updated' };
      vi.mocked(coursesApi.rosterPartialUpdate).mockResolvedValue({} as any);

      await Course.updateRoster(3, payload);

      expect(coursesApi.rosterPartialUpdate).toHaveBeenCalledWith({ id: 3, patchedCourse: payload });
    });
  });

  describe('addToRoster', () => {
    it('calls addToRosterPartialUpdate with correct args', async () => {
      const payload = { name: 'add' };
      vi.mocked(coursesApi.addToRosterPartialUpdate).mockResolvedValue({} as any);

      await Course.addToRoster(7, payload);

      expect(coursesApi.addToRosterPartialUpdate).toHaveBeenCalledWith({ id: 7, patchedCourse: payload });
    });
  });

  describe('removeFromRoster', () => {
    it('calls removeFromRosterPartialUpdate with correct args', async () => {
      const payload = { name: 'remove' };
      vi.mocked(coursesApi.removeFromRosterPartialUpdate).mockResolvedValue({} as any);

      await Course.removeFromRoster(9, payload);

      expect(coursesApi.removeFromRosterPartialUpdate).toHaveBeenCalledWith({ id: 9, patchedCourse: payload });
    });
  });

  describe('readSettings', () => {
    it('calls courseSettingsRetrieve with course id', async () => {
      const mockSettings = { allowGradersToEditRubric: true };
      vi.mocked(coursesApi.courseSettingsRetrieve).mockResolvedValue(mockSettings as any);

      const result = await Course.readSettings(11);

      expect(coursesApi.courseSettingsRetrieve).toHaveBeenCalledWith({ id: 11 });
      expect(result).toEqual(mockSettings);
    });
  });

  describe('API Key methods (apiFetch)', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    it('listAPIKeys fetches with GET and auth header', async () => {
      const keys = [{ id: 1, name: 'key1' }];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(keys),
      } as Response);

      const result = await Course.listAPIKeys(42);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/courses/42/apiKeys/', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }));
      expect(result).toEqual(keys);
    });

    it('createAPIKey sends POST with name', async () => {
      const created = { id: 2, name: 'new-key', key: 'raw-key-value' };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(created),
      } as Response);

      const result = await Course.createAPIKey(42, 'new-key');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/courses/42/apiKeys/', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'new-key' }),
      }));
      expect(result).toEqual(created);
    });

    it('updateAPIKey sends PATCH', async () => {
      const updated = { id: 3, name: 'renamed', isActive: false };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updated),
      } as Response);

      const result = await Course.updateAPIKey(10, 3, { name: 'renamed', isActive: false });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/courses/10/apiKeys/3/', expect.objectContaining({
        method: 'PATCH',
      }));
      expect(result).toEqual(updated);
    });

    it('deleteAPIKey sends DELETE and returns undefined for 204', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('no body')),
      } as Response);

      const result = await Course.deleteAPIKey(10, 3);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/courses/10/apiKeys/3/', expect.objectContaining({
        method: 'DELETE',
      }));
      expect(result).toBeUndefined();
    });

    it('throws with detail from error response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ detail: 'Not authorized' }),
      } as Response);

      await expect(Course.listAPIKeys(1)).rejects.toThrow('Not authorized');
    });

    it('throws with error field when detail is absent', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid params' }),
      } as Response);

      await expect(Course.createAPIKey(1, '')).rejects.toThrow('Invalid params');
    });

    it('throws with statusText when body has no detail or error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      } as Response);

      await expect(Course.listAPIKeys(1)).rejects.toThrow('Internal Server Error');
    });

    it('throws with statusText when error body cannot be parsed', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: () => Promise.reject(new Error('not json')),
      } as Response);

      await expect(Course.listAPIKeys(1)).rejects.toThrow('Bad Gateway');
    });
  });
});
