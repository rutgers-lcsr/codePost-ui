// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AIUsageChart Component
 *
 * Reusable chart component for displaying AI API usage data.
 * Supports bar charts for token usage and cost over time,
 * with breakdown tables by dimension (course, assignment, org).
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { colors } from '../../theme/colors';
import type { AIUsageBucket } from '../../api-client';

interface AIUsageChartProps {
  timeSeries: AIUsageBucket[];
  granularity: 'hourly' | 'daily' | 'monthly';
  chartType?: 'tokens' | 'cost';
}

const formatDate = (dateStr: string, granularity: 'hourly' | 'daily' | 'monthly'): string => {
  const date = new Date(dateStr);
  if (granularity === 'hourly') {
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
  }
  if (granularity === 'daily') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

const formatCost = (cost: string | number): string => {
  const num = typeof cost === 'string' ? parseFloat(cost) : cost;
  if (num >= 1) return `$${num.toFixed(2)}`;
  if (num >= 0.01) return `$${num.toFixed(3)}`;
  return `$${num.toFixed(4)}`;
};

const AIUsageChart: React.FC<AIUsageChartProps> = ({ timeSeries, granularity, chartType = 'tokens' }) => {
  const data = timeSeries.map((bucket) => ({
    ...bucket,
    period: formatDate(bucket.period as unknown as string, granularity),
    estimatedCostNum: parseFloat(bucket.estimatedCost as unknown as string),
  }));

  if (data.length === 0) {
    return (
      <div
        style={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.neutralSecondaryText,
          border: `1px dashed ${colors.neutralBorder}`,
          borderRadius: 8,
        }}
      >
        No usage data for this time period
      </div>
    );
  }

  if (chartType === 'cost') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} />
          <YAxis tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} tickFormatter={(v) => formatCost(v)} />
          <Tooltip
            formatter={(value: number | undefined) => [formatCost(value ?? 0), 'Cost']}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.neutralBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="estimatedCostNum"
            stroke={colors.brandAccent}
            fill={`${colors.brandAccent}33`}
            name="Estimated Cost"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} />
        <YAxis tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} tickFormatter={formatNumber} />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => [formatNumber(value ?? 0), name ?? '']}
          contentStyle={{
            borderRadius: 8,
            border: `1px solid ${colors.neutralBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
        <Legend />
        <Bar dataKey="inputTokens" name="Input Tokens" fill={colors.actionBlue} radius={[4, 4, 0, 0]} stackId="a" />
        <Bar dataKey="outputTokens" name="Output Tokens" fill={colors.actionGreen} radius={[4, 4, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export { AIUsageChart, formatNumber, formatCost };
export type { AIUsageChartProps };
