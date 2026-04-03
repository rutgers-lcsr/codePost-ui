// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { organizationsApi, coursesApi, systemApi, apiClientConfig } from '../api-client/clients';
import type {
  AIUsageSummary,
  AIProviderModelsList,
  OrganizationAISettings,
  PatchedOrganizationAISettingsUpdate,
  CourseAISettings,
  PatchedCourseAISettings,
} from '../api-client';
import { AiUsageRetrieveGranularityEnum as OrgGranularityEnum } from '../api-client/apis/OrganizationsApi';
import { AiUsageRetrieveGranularityEnum as CourseGranularityEnum } from '../api-client/apis/CoursesApi';
import {
  AiUsageRetrieveGranularityEnum as SystemGranularityEnum,
  AiModelsRetrieveProviderEnum,
} from '../api-client/apis/SystemApi';
import { getAuthToken } from '../utils/auth';

type Granularity = 'hourly' | 'daily' | 'monthly';

/** A registered AI feature from the /aiFeatures/ endpoint. */
export interface AIFeatureEntry {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  requires: string[];
}

/** Per-feature enabled/disabled overrides. Keys are feature keys, values are booleans. */
export type AIFeatureConfig = Record<string, boolean>;

/** Resolved per-feature status (read-only, computed by server). */
export type AIFeatureStatus = Record<string, boolean>;

interface UsageQueryParams {
  granularity?: Granularity;
  startDate?: string;
  endDate?: string;
}

export class AIUsageService {
  // --- AI Feature Registry ---

  /** Fetch the list of registered AI features from /aiFeatures/. */
  public static listAIFeatures = async (): Promise<AIFeatureEntry[]> => {
    const basePath = apiClientConfig.basePath ?? '';
    const token = getAuthToken();
    const response = await fetch(`${basePath}/aiFeatures/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch AI features');
    return response.json();
  };

  // --- Organization AI Settings ---

  public static getOrgAISettings = (orgId: number): Promise<OrganizationAISettings> =>
    organizationsApi.aiSettingsRetrieve({ id: orgId });

  public static updateOrgAISettings = (
    orgId: number,
    payload: PatchedOrganizationAISettingsUpdate,
  ): Promise<OrganizationAISettings> =>
    organizationsApi.aiSettingsPartialUpdate({
      id: orgId,
      patchedOrganizationAISettingsUpdate: payload,
    });

  // --- Course AI Settings ---

  public static getCourseAISettings = (courseId: number): Promise<CourseAISettings> =>
    coursesApi.aiSettingsRetrieve({ id: courseId });

  public static updateCourseAISettings = (
    courseId: number,
    payload: Partial<PatchedCourseAISettings>,
  ): Promise<CourseAISettings> =>
    coursesApi.aiSettingsPartialUpdate({
      id: courseId,
      patchedCourseAISettings: payload,
    });

  // --- Usage Analytics ---

  public static getOrgUsage = (orgId: number, params: UsageQueryParams = {}): Promise<AIUsageSummary> =>
    organizationsApi.aiUsageRetrieve({
      id: orgId,
      granularity: params.granularity as OrgGranularityEnum | undefined,
      startDate: params.startDate,
      endDate: params.endDate,
    });

  public static getCourseUsage = (courseId: number, params: UsageQueryParams = {}): Promise<AIUsageSummary> =>
    coursesApi.aiUsageRetrieve({
      id: courseId,
      granularity: params.granularity as CourseGranularityEnum | undefined,
      startDate: params.startDate,
      endDate: params.endDate,
    });

  public static getPlatformUsage = (
    params: UsageQueryParams & { organizationId?: number } = {},
  ): Promise<AIUsageSummary> =>
    systemApi.aiUsageRetrieve({
      granularity: params.granularity as SystemGranularityEnum | undefined,
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

  // --- AI Models ---

  /** Get the curated model list for all providers (or a specific one). */
  public static getModels = (provider?: string): Promise<AIProviderModelsList> =>
    systemApi.aiModelsRetrieve({ provider: provider as AiModelsRetrieveProviderEnum | undefined });

  /** Get models for the org's configured provider, including live-queried models. */
  public static getOrgModels = (orgId: number): Promise<AIProviderModelsList> =>
    organizationsApi.aiModelsRetrieve({ id: orgId });

  /** Get models for the course's effective provider, including live-queried models. */
  public static getCourseModels = (courseId: number): Promise<AIProviderModelsList> =>
    coursesApi.aiModelsRetrieve({ id: courseId });
}
