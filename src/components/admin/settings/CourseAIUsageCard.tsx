// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * CourseAIUsageCard Component
 *
 * Displays AI usage analytics for a specific course.
 * Shows usage charts with per-assignment breakdown.
 */

import React from 'react';
import { Card, Space } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import AIUsageDashboard from '../../core/AIUsageDashboard';
import { AIUsageService } from '../../../services/aiUsage';

interface CourseAIUsageCardProps {
  courseId: number;
}

const CourseAIUsageCard: React.FC<CourseAIUsageCardProps> = ({ courseId }) => {
  const fetchUsage = React.useCallback(
    (params: { granularity: 'hourly' | 'daily' | 'monthly'; startDate?: string; endDate?: string }) =>
      AIUsageService.getCourseUsage(courseId, params),
    [courseId],
  );

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined />
          <span>AI Usage Analytics</span>
        </Space>
      }
      style={{ marginBottom: 24, maxWidth: 1100 }}
    >
      <AIUsageDashboard
        fetchUsage={fetchUsage}
        breakdownLabel="Assignment"
        title="Course AI Usage"
        description="Track AI API usage across assignments in this course."
      />
    </Card>
  );
};

export default CourseAIUsageCard;
