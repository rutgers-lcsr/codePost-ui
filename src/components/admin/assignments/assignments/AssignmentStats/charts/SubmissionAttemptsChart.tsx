// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Col, Row, Statistic } from 'antd';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsSubmissionAttempts } from '../../../../../../api-client';

interface SubmissionAttemptsChartProps {
  data: AssignmentAnalyticsSubmissionAttempts;
}

const SubmissionAttemptsChart: React.FC<SubmissionAttemptsChartProps> = ({ data }) => {
  const chartData = data.attemptDistribution.map((row) => ({
    ...row,
    label: row.attempts === 1 ? '1 attempt' : `${row.attempts} attempts`,
  }));

  return (
    <div role="img" aria-label="Submission attempt distribution">
      <Row gutter={16} style={{ marginBottom: 16, textAlign: 'center' }}>
        <Col span={8}>
          <Statistic title="Total Students" value={data.totalStudents} valueStyle={{ fontSize: 18 }} />
        </Col>
        <Col span={8}>
          <Statistic
            title="Multiple Attempts"
            value={data.studentsWithMultipleAttempts}
            valueStyle={{ fontSize: 18 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Avg Grade Improvement"
            value={data.avgGradeImprovement != null ? data.avgGradeImprovement : '--'}
            precision={1}
            prefix={data.avgGradeImprovement != null && data.avgGradeImprovement > 0 ? '+' : ''}
            valueStyle={{
              fontSize: 18,
              color:
                data.avgGradeImprovement != null && data.avgGradeImprovement > 0
                  ? colors.actionGreen
                  : data.avgGradeImprovement != null && data.avgGradeImprovement < 0
                    ? colors.actionRed
                    : undefined,
            }}
          />
        </Col>
      </Row>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="attemptBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.brandPrimary} stopOpacity={1} />
              <stop offset="100%" stopColor={colors.brandPrimary} stopOpacity={0.7} />
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
          <Bar dataKey="studentCount" name="Students" fill="url(#attemptBarGradient)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubmissionAttemptsChart;
