// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors } from '../../../theme/colors';
import type { AutogradingLanguageFailure } from '../../../api-client';

interface FailuresPerLanguageChartProps {
  data: AutogradingLanguageFailure[];
}

const FailuresPerLanguageChart: React.FC<FailuresPerLanguageChartProps> = ({ data }) => {
  const rows = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        succeeded: row.executions - row.failures,
      })),
    [data],
  );

  return (
    <div role="region" aria-label={`Autograder failures across ${data.length} languages`}>
      <ResponsiveContainer width="100%" height={Math.max(140, rows.length * 40)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke={colors.neutralSecondaryText} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="language"
            tick={{ fontSize: 12 }}
            stroke={colors.neutralSecondaryText}
            width={120}
          />
          <Tooltip
            formatter={(value, name, entry) => {
              if (name === 'Failed') {
                const rate = (entry?.payload as (typeof rows)[number] | undefined)?.failureRate;
                return [`${value}${rate != null ? ` (${Math.round(rate * 100)}% of runs)` : ''}`, name];
              }
              return [value, String(name ?? '')];
            }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.neutralBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Legend />
          <Bar dataKey="failures" name="Failed" fill={colors.actionRed} stackId="a" />
          <Bar dataKey="succeeded" name="Succeeded" fill={colors.actionBlue} stackId="a" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FailuresPerLanguageChart;
