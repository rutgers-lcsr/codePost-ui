// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsGradingTimeline } from '../../../../../../api-client';

interface GradingTimelineChartProps {
  data: AssignmentAnalyticsGradingTimeline[];
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const GradingTimelineChart: React.FC<GradingTimelineChartProps> = ({ data }) => {
  const chartData = data.map((row) => ({
    ...row,
    label: formatDate(row.period),
  }));

  return (
    <div role="img" aria-label="Grading timeline showing daily finalized submissions">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.brandPrimary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={colors.brandPrimary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} />
          <YAxis tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} allowDecimals={false} />
          <Tooltip
            formatter={(value) => [value, 'Finalized']}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.neutralBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={colors.brandPrimary}
            strokeWidth={2}
            fill="url(#timelineGradient)"
            name="Submissions Finalized"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GradingTimelineChart;
