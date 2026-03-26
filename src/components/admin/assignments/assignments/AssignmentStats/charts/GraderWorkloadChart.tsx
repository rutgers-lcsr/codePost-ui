// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsGraderWorkload } from '../../../../../../api-client';

interface GraderWorkloadChartProps {
  data: AssignmentAnalyticsGraderWorkload[];
}

const GraderWorkloadChart: React.FC<GraderWorkloadChartProps> = ({ data }) => {
  const chartData = data.map((row) => ({
    ...row,
    // Truncate long emails for display
    label: row.grader.length > 20 ? row.grader.slice(0, 18) + '…' : row.grader,
  }));

  return (
    <div role="img" aria-label={`Grader workload for ${data.length} graders`}>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11 }}
            stroke={colors.neutralSecondaryText}
            width={150}
          />
          <Tooltip
            formatter={(value, name) => [value, String(name ?? '')]}
            labelFormatter={(label) => {
              const labelStr = String(label);
              const match = data.find(
                (d) =>
                  d.grader === labelStr || (d.grader.length > 20 ? d.grader.slice(0, 18) + '…' : d.grader) === labelStr,
              );
              return match?.grader ?? labelStr;
            }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.neutralBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Legend />
          <Bar dataKey="finalized" name="Finalized" fill={colors.actionGreen} stackId="a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="unfinalized" name="Unfinalized" fill={colors.actionYellow} stackId="a" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraderWorkloadChart;
