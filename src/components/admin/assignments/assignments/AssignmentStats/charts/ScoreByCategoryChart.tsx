// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
  ReferenceLine,
} from 'recharts';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsScoreByCategory } from '../../../../../../api-client';

interface ScoreByCategoryChartProps {
  data: AssignmentAnalyticsScoreByCategory[];
}

const ScoreByCategoryChart: React.FC<ScoreByCategoryChartProps> = ({ data }) => {
  const chartData = data.map((row) => ({
    ...row,
    label: row.categoryName.length > 18 ? row.categoryName.slice(0, 16) + '…' : row.categoryName,
  }));

  return (
    <div role="img" aria-label={`Score breakdown across ${data.length} rubric categories`}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} />
          <YAxis tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} />
          <Tooltip
            formatter={(value, name) => [value, String(name)]}
            labelFormatter={(label) => {
              const match = data.find(
                (d) =>
                  d.categoryName === label ||
                  (d.categoryName.length > 18 ? d.categoryName.slice(0, 16) + '…' : d.categoryName) === label,
              );
              return match
                ? `${match.categoryName}${match.pointLimit != null ? ` (limit: ${match.pointLimit})` : ''}`
                : String(label);
            }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.neutralBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Legend />
          <ReferenceLine y={0} stroke={colors.neutralBorder} />
          <Bar dataKey="meanDeduction" name="Mean Deduction" fill={colors.brandAccent} radius={[4, 4, 0, 0]} />
          <Bar dataKey="medianDeduction" name="Median Deduction" fill={colors.brandPrimary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreByCategoryChart;
