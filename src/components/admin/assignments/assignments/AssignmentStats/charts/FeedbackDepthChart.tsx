// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Col, Row, Statistic } from 'antd';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsFeedbackDepth } from '../../../../../../api-client';

interface FeedbackDepthChartProps {
  data: AssignmentAnalyticsFeedbackDepth;
}

const FeedbackDepthChart: React.FC<FeedbackDepthChartProps> = ({ data }) => {
  const { overall, byGrader } = data;

  const chartData = byGrader.map((row) => ({
    ...row,
    label: row.grader.length > 20 ? row.grader.slice(0, 18) + '…' : row.grader,
  }));

  return (
    <div role="img" aria-label="Feedback depth analysis">
      {overall && (
        <Row gutter={16} style={{ marginBottom: 16, textAlign: 'center' }}>
          <Col span={8}>
            <Statistic
              title="Mean Comments / Submission"
              value={overall.meanCommentsPerSubmission}
              precision={1}
              styles={{ content: { fontSize: 18 } }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Median Comments / Submission"
              value={overall.medianCommentsPerSubmission}
              precision={1}
              styles={{ content: { fontSize: 18 } }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Submissions with Comments"
              value={overall.totalSubmissionsWithComments}
              styles={{ content: { fontSize: 18 } }}
            />
          </Col>
        </Row>
      )}
      {byGrader.length > 0 && (
        <ResponsiveContainer width="100%" height={Math.max(300, byGrader.length * 40)}>
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
              labelFormatter={(label) => {
                const match = byGrader.find(
                  (d) =>
                    d.grader === label || (d.grader.length > 20 ? d.grader.slice(0, 18) + '…' : d.grader) === label,
                );
                return match
                  ? `${match.grader} (${match.submissionsGraded} subs, avg ${match.meanComments}/sub)`
                  : String(label);
              }}
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${colors.neutralBorder}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            <Bar
              dataKey="rubricComments"
              name="Rubric Comments"
              fill={colors.brandAccent}
              stackId="a"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="freeformComments"
              name="Freeform Comments"
              fill={colors.brandPrimary}
              stackId="a"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default FeedbackDepthChart;
