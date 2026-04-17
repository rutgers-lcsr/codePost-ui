// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Col, Row, Statistic } from 'antd';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsLateSubmissions } from '../../../../../../api-client';

interface LateSubmissionsChartProps {
  data: AssignmentAnalyticsLateSubmissions;
}

const LateSubmissionsChart: React.FC<LateSubmissionsChartProps> = ({ data }) => {
  const total = data.onTime + data.late;
  const onTimePct = total > 0 ? Math.round((data.onTime / total) * 100) : 0;

  const pieData = [
    { name: 'On Time', value: data.onTime },
    { name: 'Late', value: data.late },
  ];

  const pieColors = [colors.actionGreen, colors.actionRed];

  const dayChartData = data.lateByDay.map((row) => ({
    ...row,
    label: `Day ${row.day}`,
  }));

  return (
    <div role="img" aria-label="Late submission analysis">
      <Row gutter={16} style={{ marginBottom: 16, textAlign: 'center' }}>
        <Col span={8}>
          <Statistic title="On Time" value={data.onTime} valueStyle={{ color: colors.actionGreen, fontSize: 18 }} />
        </Col>
        <Col span={8}>
          <Statistic title="Late" value={data.late} valueStyle={{ color: colors.actionRed, fontSize: 18 }} />
        </Col>
        <Col span={8}>
          <Statistic title="On-Time Rate" value={`${onTimePct}%`} valueStyle={{ fontSize: 18 }} />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={10}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${colors.neutralBorder}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Col>
        <Col xs={24} sm={14}>
          {dayChartData.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dayChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} />
                <YAxis tick={{ fontSize: 12 }} stroke={colors.neutralSecondaryText} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [value, 'Submissions']}
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${colors.neutralBorder}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  cursor={{ fill: colors.neutralBackground }}
                />
                <Bar dataKey="count" name="Late Submissions" fill={colors.actionRed} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default LateSubmissionsChart;
