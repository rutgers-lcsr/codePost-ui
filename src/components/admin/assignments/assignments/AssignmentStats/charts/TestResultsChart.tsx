// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Collapse, Progress, Typography } from 'antd';
import { colors } from '../../../../../../theme/colors';
import type { AssignmentAnalyticsTestResults } from '../../../../../../api-client';

const { Text } = Typography;

interface TestResultsChartProps {
  data: AssignmentAnalyticsTestResults[];
}

interface CategoryGroup {
  name: string;
  tests: AssignmentAnalyticsTestResults[];
  passed: number;
  failed: number;
  errored: number;
  total: number;
}

const TestResultsChart: React.FC<TestResultsChartProps> = ({ data }) => {
  const categories = useMemo(() => {
    const map = new Map<string, CategoryGroup>();
    for (const row of data) {
      const key = row.testCategoryName;
      if (!map.has(key)) {
        map.set(key, { name: key, tests: [], passed: 0, failed: 0, errored: 0, total: 0 });
      }
      const cat = map.get(key)!;
      cat.tests.push(row);
      cat.passed += row.passed;
      cat.failed += row.failed;
      cat.errored += row.errored;
      cat.total += row.total;
    }
    return Array.from(map.values());
  }, [data]);

  return (
    <div role="region" aria-label={`Test results across ${categories.length} categories`}>
      <Collapse
        defaultActiveKey={categories.map((_, i) => String(i))}
        ghost
        items={categories.map((cat, i) => {
          const passRate = cat.total > 0 ? Math.round((cat.passed / cat.total) * 100) : 0;

          return {
            key: String(i),
            label: (
              <div className="display-flex align-items-center" style={{ gap: 12, width: '100%' }}>
                <Text strong style={{ minWidth: 180 }}>
                  {cat.name}
                </Text>
                <Progress
                  percent={cat.total > 0 ? Math.round(((cat.passed + cat.failed + cat.errored) / cat.total) * 100) : 0}
                  success={{ percent: passRate }}
                  size="small"
                  style={{ flex: 1, margin: 0 }}
                  format={() => `${passRate}% pass`}
                />
                <Text type="secondary" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                  {cat.tests.length} test{cat.tests.length !== 1 ? 's' : ''}
                </Text>
              </div>
            ),
            children: (
              <ResponsiveContainer width="100%" height={Math.max(120, cat.tests.length * 36)}>
                <BarChart
                  data={cat.tests.map((row) => ({
                    ...row,
                    label:
                      row.testCaseDescription.length > 35
                        ? row.testCaseDescription.slice(0, 33) + '…'
                        : row.testCaseDescription,
                  }))}
                  layout="vertical"
                  margin={{ top: 4, right: 30, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralBorder} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    stroke={colors.neutralSecondaryText}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    stroke={colors.neutralSecondaryText}
                    width={200}
                  />
                  <Tooltip
                    formatter={(value, name) => [value, String(name ?? '')]}
                    contentStyle={{
                      borderRadius: 8,
                      border: `1px solid ${colors.neutralBorder}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                  {i === 0 && <Legend />}
                  <Bar dataKey="passed" name="Passed" fill={colors.actionGreen} stackId="a" />
                  <Bar dataKey="failed" name="Failed" fill={colors.actionRed} stackId="a" />
                  <Bar dataKey="errored" name="Errored" fill={colors.actionYellow} stackId="a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ),
          };
        })}
      />
    </div>
  );
};

export default TestResultsChart;
