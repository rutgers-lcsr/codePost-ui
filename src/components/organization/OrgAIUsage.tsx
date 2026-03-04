// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * OrgAIUsage Component
 *
 * Organization-level AI usage analytics page.
 * Shows usage charts and per-course breakdown for org staff.
 */

import React from 'react';
import AIUsageDashboard from '../core/AIUsageDashboard';
import { AIUsageService } from '../../services/aiUsage';

interface OrgAIUsageProps {
  orgId: number;
}

const OrgAIUsage: React.FC<OrgAIUsageProps> = ({ orgId }) => {
  const fetchUsage = React.useCallback(
    (params: { granularity: 'hourly' | 'daily' | 'monthly'; startDate?: string; endDate?: string }) =>
      AIUsageService.getOrgUsage(orgId, params),
    [orgId],
  );

  return (
    <AIUsageDashboard
      fetchUsage={fetchUsage}
      breakdownLabel="Course"
      title="AI Usage Analytics"
      description="Track AI API usage across all courses in this organization."
    />
  );
};

export default OrgAIUsage;
