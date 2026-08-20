// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { colors } from '../../../theme/colors';
import type { AutogradingLanguageUsage } from '../../../api-client';

interface LanguageUsageChartProps {
  data: AutogradingLanguageUsage[];
}

const LanguageUsageChart: React.FC<LanguageUsageChartProps> = ({ data }) => {
  return (
    <div role="region" aria-label={`Autograder usage across ${data.length} languages`}>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 4 }}>
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
            formatter={(value) => [value, 'Requests']}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.neutralBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Bar dataKey="count" name="Requests" fill={colors.actionBlue} radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LanguageUsageChart;
