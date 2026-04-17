// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import {
  ComposedChart,
  Bar,
  ErrorBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsGraderConsistency } from '../../../../../../api-client';

interface GraderConsistencyChartProps {
  data: AssignmentAnalyticsGraderConsistency[];
  assignmentPoints: number;
}

const GraderConsistencyChart: React.FC<GraderConsistencyChartProps> = ({ data, assignmentPoints }) => {
  // Calculate overall mean across all graders
  const totalGraded = data.reduce((sum, d) => sum + d.count, 0);
  const weightedSum = data.reduce((sum, d) => sum + (d.meanGrade ?? 0) * d.count, 0);
  const overallMean = totalGraded > 0 ? weightedSum / totalGraded : 0;

  const chartData = data.map((row) => ({
    ...row,
    label: row.grader.length > 20 ? row.grader.slice(0, 18) + '…' : row.grader,
    errorBarValue: row.stddevGrade ?? 0,
  }));

  return (
    <div role="img" aria-label={`Grader consistency comparison for ${data.length} graders`}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke={colors.neutralSecondaryText} />
          <YAxis tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} domain={[0, assignmentPoints]} />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'Mean Grade') return [Number(value).toFixed(1), name];
              return [value, String(name)];
            }}
            labelFormatter={(label) => {
              const match = data.find(
                (d) => d.grader === label || (d.grader.length > 20 ? d.grader.slice(0, 18) + '…' : d.grader) === label,
              );
              return match ? `${match.grader} (${match.count} submissions)` : String(label);
            }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.neutralBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <ReferenceLine
            y={overallMean}
            stroke={colors.actionRed}
            strokeDasharray="5 5"
            label={{ value: `Avg: ${overallMean.toFixed(1)}`, position: 'right', fontSize: 11 }}
          />
          <Bar dataKey="meanGrade" name="Mean Grade" fill={colors.brandAccent} radius={[4, 4, 0, 0]} barSize={40}>
            <ErrorBar dataKey="errorBarValue" width={4} strokeWidth={2} stroke={colors.neutralSecondaryText} />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraderConsistencyChart;
