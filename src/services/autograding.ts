// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { dashboardApi } from '../api-client/clients';
import type { AutogradingStats } from '../api-client';

export class AutogradingStatsService {
  public static getStats = (params: { dateFrom?: string; dateTo?: string } = {}): Promise<AutogradingStats> =>
    dashboardApi.autogradingStatsRetrieve(params);
}
