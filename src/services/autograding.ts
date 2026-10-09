// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { dashboardApi } from '../api-client/clients';
import type { AutogradingStats, AutogradingFailureList } from '../api-client';

export interface AutogradingFailuresParams {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  trigger?: string;
  language?: string;
  courseId?: number;
  assignmentId?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}

export class AutogradingStatsService {
  public static getStats = (params: { dateFrom?: string; dateTo?: string } = {}): Promise<AutogradingStats> =>
    dashboardApi.autogradingStatsRetrieve(params);

  public static getFailures = (params: AutogradingFailuresParams = {}): Promise<AutogradingFailureList> =>
    dashboardApi.autogradingFailuresRetrieve(params);
}
