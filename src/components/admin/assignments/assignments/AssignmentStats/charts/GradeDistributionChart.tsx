// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsGradeDistribution } from '../../../../../../api-client';

interface GradeDistributionChartProps {
  data: AssignmentAnalyticsGradeDistribution[];
}

const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({ data }) => {
  const chartData = data.map((bucket) => ({
    ...bucket,
    label: bucket.bucketMin === bucket.bucketMax ? `${bucket.bucketMin}` : `${bucket.bucketMin}–${bucket.bucketMax}`,
  }));

  return (
    <div role="img" aria-label={`Grade distribution across ${data.length} buckets`}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradeBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.brandAccent} stopOpacity={1} />
              <stop offset="100%" stopColor={colors.brandAccent} stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} />
          <YAxis tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} allowDecimals={false} />
          <Tooltip
            formatter={(value) => [value, 'Students']}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.neutralBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            cursor={{ fill: colors.neutralBackground }}
          />
          <Bar dataKey="count" name="Students" fill="url(#gradeBarGradient)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GradeDistributionChart;
