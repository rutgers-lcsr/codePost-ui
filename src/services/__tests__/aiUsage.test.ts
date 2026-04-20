// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api-client/clients', () => ({
  organizationsApi: {
    aiSettingsRetrieve: vi.fn(),
    aiSettingsPartialUpdate: vi.fn(),
    aiUsageRetrieve: vi.fn(),
    aiModelsRetrieve: vi.fn(),
  },
  coursesApi: {
    aiSettingsRetrieve: vi.fn(),
    aiSettingsPartialUpdate: vi.fn(),
    aiUsageRetrieve: vi.fn(),
    aiModelsRetrieve: vi.fn(),
  },
  systemApi: {
    aiUsageRetrieve: vi.fn(),
    aiModelsRetrieve: vi.fn(),
  },
  apiClientConfig: { basePath: 'https://api.example.com' },
}));

vi.mock('../../utils/auth', () => ({
  getAuthToken: vi.fn(() => 'test-token'),
}));

import { AIUsageService } from '../aiUsage';
import { organizationsApi, coursesApi, systemApi } from '../../api-client/clients';

describe('AIUsageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI Feature Registry', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    it('listAIFeatures fetches /aiFeatures/ with auth', async () => {
      const features = [{ key: 'suggest_comments', label: 'Suggest Comments' }];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(features),
      } as Response);

      const result = await AIUsageService.listAIFeatures();
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/aiFeatures/', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }));
      expect(result).toEqual(features);
    });

    it('listAIFeatures throws on non-ok response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(AIUsageService.listAIFeatures()).rejects.toThrow('Failed to fetch AI features');
    });
  });

  describe('Organization AI Settings', () => {
    it('getOrgAISettings calls organizationsApi', async () => {
      vi.mocked(organizationsApi.aiSettingsRetrieve).mockResolvedValue({ id: 1 } as never);
      const result = await AIUsageService.getOrgAISettings(1);
      expect(result).toEqual({ id: 1 });
      expect(organizationsApi.aiSettingsRetrieve).toHaveBeenCalledWith({ id: 1 });
    });

    it('updateOrgAISettings calls organizationsApi', async () => {
      vi.mocked(organizationsApi.aiSettingsPartialUpdate).mockResolvedValue({ id: 1 } as never);
      const result = await AIUsageService.updateOrgAISettings(1, { aiEnabled: true } as never);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('Course AI Settings', () => {
    it('getCourseAISettings calls coursesApi', async () => {
      vi.mocked(coursesApi.aiSettingsRetrieve).mockResolvedValue({ id: 2 } as never);
      const result = await AIUsageService.getCourseAISettings(2);
      expect(result).toEqual({ id: 2 });
    });

    it('updateCourseAISettings calls coursesApi', async () => {
      vi.mocked(coursesApi.aiSettingsPartialUpdate).mockResolvedValue({ id: 2 } as never);
      const result = await AIUsageService.updateCourseAISettings(2, { aiEnabled: false } as never);
      expect(result).toEqual({ id: 2 });
    });
  });

  describe('Usage Analytics', () => {
    it('getOrgUsage calls organizationsApi with params', async () => {
      vi.mocked(organizationsApi.aiUsageRetrieve).mockResolvedValue({ total: 100 } as never);
      const result = await AIUsageService.getOrgUsage(1, { granularity: 'daily', startDate: '2024-01-01' });
      expect(result).toEqual({ total: 100 });
      expect(organizationsApi.aiUsageRetrieve).toHaveBeenCalledWith({
        id: 1,
        granularity: 'daily',
        startDate: '2024-01-01',
        endDate: undefined,
      });
    });

    it('getOrgUsage uses default empty params', async () => {
      vi.mocked(organizationsApi.aiUsageRetrieve).mockResolvedValue({ total: 0 } as never);
      await AIUsageService.getOrgUsage(1);
      expect(organizationsApi.aiUsageRetrieve).toHaveBeenCalledWith({
        id: 1,
        granularity: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('getCourseUsage calls coursesApi', async () => {
      vi.mocked(coursesApi.aiUsageRetrieve).mockResolvedValue({ total: 50 } as never);
      const result = await AIUsageService.getCourseUsage(2, { granularity: 'monthly' });
      expect(result).toEqual({ total: 50 });
    });

    it('getPlatformUsage calls systemApi', async () => {
      vi.mocked(systemApi.aiUsageRetrieve).mockResolvedValue({ total: 999 } as never);
      const result = await AIUsageService.getPlatformUsage({ organizationId: 1 });
      expect(result).toEqual({ total: 999 });
    });
  });

  describe('AI Models', () => {
    it('getModels calls systemApi', async () => {
      vi.mocked(systemApi.aiModelsRetrieve).mockResolvedValue({ models: [] } as never);
      const result = await AIUsageService.getModels('openai');
      expect(result).toEqual({ models: [] });
    });

    it('getModels without provider', async () => {
      vi.mocked(systemApi.aiModelsRetrieve).mockResolvedValue({ models: [] } as never);
      await AIUsageService.getModels();
      expect(systemApi.aiModelsRetrieve).toHaveBeenCalledWith({ provider: undefined });
    });

    it('getOrgModels calls organizationsApi', async () => {
      vi.mocked(organizationsApi.aiModelsRetrieve).mockResolvedValue({ models: [] } as never);
      const result = await AIUsageService.getOrgModels(1);
      expect(result).toEqual({ models: [] });
    });

    it('getCourseModels calls coursesApi', async () => {
      vi.mocked(coursesApi.aiModelsRetrieve).mockResolvedValue({ models: [] } as never);
      const result = await AIUsageService.getCourseModels(2);
      expect(result).toEqual({ models: [] });
    });
  });
});
