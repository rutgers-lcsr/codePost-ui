// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Col, Row, Statistic } from 'antd';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsTimeToGrade } from '../../../../../../api-client';

interface TimeToGradeChartProps {
  data: AssignmentAnalyticsTimeToGrade;
}

const formatHours = (hours: number | null | undefined): string => {
  if (hours == null) return '--';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
};

const TimeToGradeChart: React.FC<TimeToGradeChartProps> = ({ data }) => {
  const { overall, byGrader } = data;

  const chartData = byGrader.map((row) => ({
    ...row,
    label: row.grader.length > 20 ? row.grader.slice(0, 18) + '…' : row.grader,
    displayHours: row.meanHours ?? 0,
  }));

  return (
    <div role="img" aria-label="Time to grade analysis">
      {overall && (
        <Row gutter={16} style={{ marginBottom: 16, textAlign: 'center' }}>
          <Col span={6}>
            <Statistic title="Mean" value={formatHours(overall.meanHours)} styles={{ content: { fontSize: 18 } }} />
          </Col>
          <Col span={6}>
            <Statistic title="Median" value={formatHours(overall.medianHours)} styles={{ content: { fontSize: 18 } }} />
          </Col>
          <Col span={6}>
            <Statistic title="Fastest" value={formatHours(overall.minHours)} styles={{ content: { fontSize: 18 } }} />
          </Col>
          <Col span={6}>
            <Statistic title="Slowest" value={formatHours(overall.maxHours)} styles={{ content: { fontSize: 18 } }} />
          </Col>
        </Row>
      )}
      {byGrader.length > 0 && (
        <ResponsiveContainer width="100%" height={Math.max(250, byGrader.length * 40)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              stroke={colors.neutralSecondaryText}
              tickFormatter={(v) => formatHours(v)}
              label={{ value: 'Hours', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11 }}
              stroke={colors.neutralSecondaryText}
              width={150}
            />
            <Tooltip
              formatter={(value) => [formatHours(Number(value)), 'Mean Turnaround']}
              labelFormatter={(label) => {
                const match = byGrader.find(
                  (d) =>
                    d.grader === label || (d.grader.length > 20 ? d.grader.slice(0, 18) + '…' : d.grader) === label,
                );
                return match ? `${match.grader} (${match.count} submissions)` : String(label);
              }}
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${colors.neutralBorder}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Bar dataKey="displayHours" name="Mean Turnaround" fill={colors.brandAccent} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TimeToGradeChart;
