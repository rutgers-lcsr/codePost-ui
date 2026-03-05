// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { organizationsApi, coursesApi, systemApi } from '../api-client/clients';
import type {
  AIUsageSummary,
  AIProviderModelsList,
  OrganizationAISettings,
  PatchedOrganizationAISettingsUpdate,
  CourseAISettings,
  PatchedCourseAISettings,
} from '../api-client';

type Granularity = 'hourly' | 'daily' | 'monthly';

interface UsageQueryParams {
  granularity?: Granularity;
  startDate?: string;
  endDate?: string;
}

export class AIUsageService {
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
      granularity: params.granularity as any,
      startDate: params.startDate,
      endDate: params.endDate,
    });

  public static getCourseUsage = (courseId: number, params: UsageQueryParams = {}): Promise<AIUsageSummary> =>
    coursesApi.aiUsageRetrieve({
      id: courseId,
      granularity: params.granularity as any,
      startDate: params.startDate,
      endDate: params.endDate,
    });

  public static getPlatformUsage = (
    params: UsageQueryParams & { organizationId?: number } = {},
  ): Promise<AIUsageSummary> =>
    systemApi.aiUsageRetrieve({
      granularity: params.granularity as any,
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

  // --- AI Models ---

  /** Get the curated model list for all providers (or a specific one). */
  public static getModels = (provider?: string): Promise<AIProviderModelsList> =>
    systemApi.aiModelsRetrieve({ provider: provider as any });

  /** Get models for the org's configured provider, including live-queried models. */
  public static getOrgModels = (orgId: number): Promise<AIProviderModelsList> =>
    organizationsApi.aiModelsRetrieve({ id: orgId });

  /** Get models for the course's effective provider, including live-queried models. */
  public static getCourseModels = (courseId: number): Promise<AIProviderModelsList> =>
    coursesApi.aiModelsRetrieve({ id: courseId });
}
