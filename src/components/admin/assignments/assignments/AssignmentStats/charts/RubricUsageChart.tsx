// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsRubricUsage } from '../../../../../../api-client';

interface RubricUsageChartProps {
  data: AssignmentAnalyticsRubricUsage[];
}

const CATEGORY_COLORS = [
  colors.brandAccent,
  colors.brandPrimary,
  colors.actionYellow,
  colors.actionRed,
  colors.actionBlueFade,
  colors.green4,
  colors.green8,
];

const RubricUsageChart: React.FC<RubricUsageChartProps> = ({ data }) => {
  // Build a color map for categories
  const categories = [...new Set(data.map((d) => d.categoryName))];
  const colorMap: Record<string, string> = {};
  categories.forEach((cat, i) => {
    colorMap[cat] = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
  });

  const chartData = data.map((row) => ({
    ...row,
    label:
      (row.text.length > 35 ? row.text.slice(0, 33) + '…' : row.text) +
      ` (${row.pointDelta > 0 ? '+' : ''}${row.pointDelta})`,
  }));

  return (
    <div role="img" aria-label={`Top ${data.length} most-applied rubric comments`}>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 10 }}
            stroke={colors.neutralSecondaryText}
            width={260}
          />
          <Tooltip
            formatter={(value) => [value, 'Times Applied']}
            labelFormatter={(label) => {
              const labelStr = String(label);
              const match = chartData.find((d) => d.label === labelStr);
              return match ? `${match.text} (${match.categoryName})` : labelStr;
            }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.neutralBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxWidth: 400,
            }}
          />
          <Bar dataKey="count" name="Times Applied" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorMap[entry.categoryName] ?? colors.brandAccent} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RubricUsageChart;
