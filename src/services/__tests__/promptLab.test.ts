// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApiClientsMock } from '@test-utils/mocks';

vi.mock('../../api-client/clients', () =>
  createApiClientsMock({
    apiClientConfig: { basePath: 'https://api.example.com' },
  }),
);

vi.mock('../../utils/auth', () => ({
  getAuthToken: vi.fn(() => 'test-token'),
}));

import { PromptLabService } from '../promptLab';

function mockFetchOk(body: unknown, status = 200) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe('PromptLabService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  // ── Prompt Types ──

  it('listPromptTypes fetches /promptTypes/', async () => {
    const types = [{ type: 'rubric_description' }];
    mockFetchOk(types);
    const result = await PromptLabService.listPromptTypes();
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptTypes/',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
    expect(result).toEqual(types);
  });

  // ── Variants ──

  it('listVariants with no params', async () => {
    mockFetchOk({ results: [{ id: 1 }] });
    const result = await PromptLabService.listVariants();
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/promptVariants/', expect.any(Object));
    expect(result).toEqual([{ id: 1 }]);
  });

  it('listVariants with only promptType', async () => {
    mockFetchOk({ results: [] });
    await PromptLabService.listVariants({ promptType: 'rubric' });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('promptType=rubric'), expect.any(Object));
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).not.toContain('status=');
  });

  it('listVariants with only status', async () => {
    mockFetchOk({ results: [] });
    await PromptLabService.listVariants({ status: 'draft' });
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('status=draft');
    expect(url).not.toContain('promptType=');
  });

  it('listVariants with filters', async () => {
    mockFetchOk({ results: [] });
    await PromptLabService.listVariants({ promptType: 'rubric', status: 'active' });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('promptType=rubric'), expect.any(Object));
  });

  it('getVariant fetches by id', async () => {
    const variant = { id: 5, name: 'v1' };
    mockFetchOk(variant);
    const result = await PromptLabService.getVariant(5);
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/promptVariants/5/', expect.any(Object));
    expect(result).toEqual(variant);
  });

  it('createVariant sends POST', async () => {
    const data = { name: 'new', promptType: 'rubric' };
    mockFetchOk({ id: 10, ...data });
    await PromptLabService.createVariant(data);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptVariants/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(data),
      }),
    );
  });

  it('updateVariant sends PATCH', async () => {
    mockFetchOk({ id: 5, name: 'updated' });
    await PromptLabService.updateVariant(5, { name: 'updated' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptVariants/5/',
      expect.objectContaining({
        method: 'PATCH',
      }),
    );
  });

  it('deleteVariant sends DELETE and handles 204', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 204, json: () => Promise.reject() } as Response);
    const result = await PromptLabService.deleteVariant(5);
    expect(result).toBeUndefined();
  });

  it('activateVariant sends POST to activate endpoint', async () => {
    mockFetchOk({ id: 5, status: 'active' });
    await PromptLabService.activateVariant(5);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptVariants/5/activate/',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('cloneVariant sends POST to clone endpoint', async () => {
    mockFetchOk({ id: 6 });
    await PromptLabService.cloneVariant(5);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptVariants/5/clone/',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('autoImprove sends POST with promptType', async () => {
    mockFetchOk({ id: 7 });
    await PromptLabService.autoImprove('rubric');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('auto-improve/?promptType=rubric'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('getVariantStats fetches stats endpoint', async () => {
    const stats = { totalSamples: 100 };
    mockFetchOk(stats);
    const result = await PromptLabService.getVariantStats(5);
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/promptVariants/5/stats/', expect.any(Object));
    expect(result).toEqual(stats);
  });

  // ── Experiments ──

  it('listExperiments with no params', async () => {
    mockFetchOk({ results: [] });
    await PromptLabService.listExperiments();
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/promptExperiments/', expect.any(Object));
  });

  it('listExperiments with only promptType', async () => {
    mockFetchOk({ results: [] });
    await PromptLabService.listExperiments({ promptType: 'rubric' });
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('promptType=rubric');
    expect(url).not.toContain('status=');
  });

  it('listExperiments with only status', async () => {
    mockFetchOk({ results: [] });
    await PromptLabService.listExperiments({ status: 'paused' });
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('status=paused');
    expect(url).not.toContain('promptType=');
  });

  it('listExperiments with filters', async () => {
    mockFetchOk({ results: [] });
    await PromptLabService.listExperiments({ promptType: 'rubric', status: 'running' });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('promptType=rubric'), expect.any(Object));
  });

  it('getExperiment fetches by id', async () => {
    mockFetchOk({ id: 1 });
    await PromptLabService.getExperiment(1);
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/promptExperiments/1/', expect.any(Object));
  });

  it('createExperiment sends POST', async () => {
    const data = { name: 'exp1', promptType: 'rubric', variantA: 1, variantB: 2 };
    mockFetchOk({ id: 1, ...data });
    await PromptLabService.createExperiment(data);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptExperiments/',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('resumeExperiment sends POST', async () => {
    mockFetchOk({ id: 1 });
    await PromptLabService.resumeExperiment(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptExperiments/1/resume/',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('pauseExperiment sends POST', async () => {
    mockFetchOk({ id: 1 });
    await PromptLabService.pauseExperiment(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptExperiments/1/pause/',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('completeExperiment without promoteWinner', async () => {
    mockFetchOk({ id: 1 });
    await PromptLabService.completeExperiment(1);
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/promptExperiments/1/complete/', expect.any(Object));
  });

  it('completeExperiment with promoteWinner', async () => {
    mockFetchOk({ id: 1 });
    await PromptLabService.completeExperiment(1, true);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptExperiments/1/complete/?promoteWinner=true',
      expect.any(Object),
    );
  });

  it('getExperimentResults with defaults', async () => {
    mockFetchOk({ variantAStats: {}, variantBStats: {} });
    await PromptLabService.getExperimentResults(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('pool=all'), expect.any(Object));
  });

  it('getExperimentResults with only minAssignments', async () => {
    mockFetchOk({ variantAStats: {}, variantBStats: {} });
    await PromptLabService.getExperimentResults(1, 'default', 5);
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('minAssignments=5');
    expect(url).not.toContain('minSamplesPerVariant');
  });

  it('getExperimentResults with all params', async () => {
    mockFetchOk({ variantAStats: {}, variantBStats: {} });
    await PromptLabService.getExperimentResults(1, 'custom', 5, 10);
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('pool=custom');
    expect(url).toContain('minAssignments=5');
    expect(url).toContain('minSamplesPerVariant=10');
  });

  // ── Feedback ──

  it('submitFeedback sends POST', async () => {
    mockFetchOk({});
    await PromptLabService.submitFeedback({ submissionId: 1, rating: 'positive' } as any);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptFeedback/',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  // ── Settings ──

  it('getSettings fetches settings endpoint', async () => {
    mockFetchOk({ aiProvider: 'openai' });
    const result = await PromptLabService.getSettings();
    expect(result).toEqual({ aiProvider: 'openai' });
  });

  it('updateSettings sends PUT', async () => {
    mockFetchOk({ aiProvider: 'anthropic' });
    await PromptLabService.updateSettings({ aiProvider: 'anthropic' } as any);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/promptVariants/settings/update/',
      expect.objectContaining({
        method: 'PUT',
      }),
    );
  });

  // ── Error handling ──

  it('throws with detail from error response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: () => Promise.resolve({ detail: 'Not authorized' }),
    } as Response);

    await expect(PromptLabService.listPromptTypes()).rejects.toThrow('Not authorized');
  });

  it('throws with statusText when body has no detail', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({}),
    } as Response);

    await expect(PromptLabService.listPromptTypes()).rejects.toThrow('Bad Request');
  });

  it('throws with statusText when body parse fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('not json')),
    } as Response);

    await expect(PromptLabService.listPromptTypes()).rejects.toThrow('Internal Server Error');
  });
});
