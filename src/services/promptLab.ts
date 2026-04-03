// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { apiClientConfig } from '../api-client/clients';
import { getAuthToken } from '../utils/auth';

/**
 * Service layer for the Prompt Lab feature — A/B testing, prompt variants,
 * experiments, and feedback.
 *
 * Uses raw fetch against the prompt-management endpoints because the TS
 * client has not been regenerated yet.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PromptType = string;

export type VariantStatus = 'draft' | 'active' | 'candidate' | 'retired';

export type ExperimentStatus = 'running' | 'paused' | 'completed';

export interface PromptVariant {
  id: number;
  promptType: PromptType;
  name: string;
  text: string;
  status: VariantStatus;
  version: number;
  parent: number | null;
  createdBy: number | null;
  metadata: Record<string, unknown>;
  created: string;
  modified: string;
}

export interface PromptVariantSummary {
  id: number;
  promptType: PromptType;
  name: string;
  status: VariantStatus;
  version: number;
}

export interface PromptExperiment {
  id: number;
  name: string;
  promptType: PromptType;
  variantA: number;
  variantB: number;
  variantADetail: PromptVariantSummary;
  variantBDetail: PromptVariantSummary;
  status: ExperimentStatus;
  sampleRate: number;
  startedBy: number | null;
  completedAt: string | null;
  created: string;
  modified: string;
}

export interface VariantBehavioralStats {
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
  acceptanceRate: number | null;
  rejectionRate: number | null;
  editRate: number | null;
  avgTimeToDecideSeconds: number | null;
  distinctAssignments: number;
}

export interface VariantBehavioralStatsWithBatch extends VariantBehavioralStats {
  batchAcceptanceRate: number | null;
}

export interface VariantStats {
  variantId: number;
  variantName: string;
  promptType: PromptType;
  status: VariantStatus;
  behavioral: VariantBehavioralStatsWithBatch;
  explicitFeedback: {
    total: number;
    thumbsUp: number;
    thumbsDown: number;
  };
}

export interface BehavioralMetrics {
  variantA: VariantBehavioralStats;
  variantB: VariantBehavioralStats;
  variantAConfident: boolean;
  variantBConfident: boolean;
  batchAcceptanceRateA: number | null;
  batchAcceptanceRateB: number | null;
  minAssignmentsThreshold: number;
  minSamplesThreshold: number;
}

export interface ExperimentResults {
  experimentId: number;
  promptType: PromptType;
  totalFeedback: number;
  variantAWins: number;
  variantBWins: number;
  ties: number;
  defaultPoolCount: number;
  customPoolCount: number;
  thumbsUp: number;
  thumbsDown: number;
  behavioral: BehavioralMetrics;
}

export interface PromptFeedbackPayload {
  promptType: PromptType;
  variantUsed: number | null;
  chosenVariant?: number | null;
  experiment?: number | null;
  rating: 1 | -1;
  feedbackText?: string;
  aiOutputA?: string;
  aiOutputB?: string;
  isCustomContext?: boolean;
  contextHash?: string;
  usageRecord?: number | null;
}

export interface ABTestResponse {
  isAbTest: true;
  experimentId: number;
  variantAId: number;
  variantBId: number;
  isCustomContext: boolean;
  resultA: unknown;
  resultB: unknown;
}

export interface PromptTypeEntry {
  key: string;
  label: string;
  description: string;
}

export interface PromptLabSettingsData {
  autoImproveEnabled: boolean;
  scheduleEnabled: boolean;
  scheduleIntervalHours: number;
  thresholdEnabled: boolean;
  feedbackThreshold: number;
  minFeedback: number;
  aiProvider: string;
  aiModel: string;
  aiApiKeySet: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function basePath(): string {
  return apiClientConfig.basePath ?? '';
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${basePath()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.detail ?? res.statusText), { status: res.status, body });
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Prompt Variants ──────────────────────────────────────────────────────────

export class PromptLabService {
  // --- Prompt Types ---

  static listPromptTypes(): Promise<PromptTypeEntry[]> {
    return apiFetch('/promptTypes/');
  }

  // --- Variants ---

  static listVariants(params?: { promptType?: PromptType; status?: VariantStatus }): Promise<PromptVariant[]> {
    const qs = new URLSearchParams();
    if (params?.promptType) qs.set('promptType', params.promptType);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return apiFetch<{ results: PromptVariant[] }>(`/promptVariants/${q ? `?${q}` : ''}`).then((r) => r.results);
  }

  static getVariant(id: number): Promise<PromptVariant> {
    return apiFetch(`/promptVariants/${id}/`);
  }

  static createVariant(data: Partial<PromptVariant>): Promise<PromptVariant> {
    return apiFetch('/promptVariants/', { method: 'POST', body: JSON.stringify(data) });
  }

  static updateVariant(id: number, data: Partial<PromptVariant>): Promise<PromptVariant> {
    return apiFetch(`/promptVariants/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  static deleteVariant(id: number): Promise<void> {
    return apiFetch(`/promptVariants/${id}/`, { method: 'DELETE' });
  }

  static activateVariant(id: number): Promise<PromptVariant> {
    return apiFetch(`/promptVariants/${id}/activate/`, { method: 'POST' });
  }

  static cloneVariant(id: number): Promise<PromptVariant> {
    return apiFetch(`/promptVariants/${id}/clone/`, { method: 'POST' });
  }

  static autoImprove(promptType: PromptType): Promise<PromptVariant> {
    return apiFetch(`/promptVariants/auto-improve/?promptType=${encodeURIComponent(promptType)}`, { method: 'POST' });
  }

  static getVariantStats(id: number): Promise<VariantStats> {
    return apiFetch(`/promptVariants/${id}/stats/`);
  }

  // --- Experiments ---

  static listExperiments(params?: { promptType?: PromptType; status?: ExperimentStatus }): Promise<PromptExperiment[]> {
    const qs = new URLSearchParams();
    if (params?.promptType) qs.set('promptType', params.promptType);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return apiFetch<{ results: PromptExperiment[] }>(`/promptExperiments/${q ? `?${q}` : ''}`).then((r) => r.results);
  }

  static getExperiment(id: number): Promise<PromptExperiment> {
    return apiFetch(`/promptExperiments/${id}/`);
  }

  static createExperiment(data: {
    name: string;
    promptType: PromptType;
    variantA: number;
    variantB: number;
    sampleRate?: number;
  }): Promise<PromptExperiment> {
    return apiFetch('/promptExperiments/', { method: 'POST', body: JSON.stringify(data) });
  }

  static resumeExperiment(id: number): Promise<PromptExperiment> {
    return apiFetch(`/promptExperiments/${id}/resume/`, { method: 'POST' });
  }

  static pauseExperiment(id: number): Promise<PromptExperiment> {
    return apiFetch(`/promptExperiments/${id}/pause/`, { method: 'POST' });
  }

  static completeExperiment(id: number, promoteWinner = false): Promise<PromptExperiment> {
    const qs = promoteWinner ? '?promoteWinner=true' : '';
    return apiFetch(`/promptExperiments/${id}/complete/${qs}`, { method: 'POST' });
  }

  static getExperimentResults(
    id: number,
    pool: 'default' | 'custom' | 'all' = 'all',
    minAssignments?: number,
    minSamplesPerVariant?: number,
  ): Promise<ExperimentResults> {
    const qs = new URLSearchParams({ pool });
    if (minAssignments != null) qs.set('minAssignments', String(minAssignments));
    if (minSamplesPerVariant != null) qs.set('minSamplesPerVariant', String(minSamplesPerVariant));
    return apiFetch(`/promptExperiments/${id}/results/?${qs.toString()}`);
  }

  // --- Feedback ---

  static submitFeedback(payload: PromptFeedbackPayload): Promise<unknown> {
    return apiFetch('/promptFeedback/', { method: 'POST', body: JSON.stringify(payload) });
  }

  // --- Settings ---

  static getSettings(): Promise<PromptLabSettingsData> {
    return apiFetch('/promptVariants/settings/');
  }

  static updateSettings(data: Partial<PromptLabSettingsData>): Promise<PromptLabSettingsData> {
    return apiFetch('/promptVariants/settings/update/', { method: 'PUT', body: JSON.stringify(data) });
  }
}
