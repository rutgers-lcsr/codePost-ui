// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AIUsageDashboard Component
 *
 * Full-featured AI usage analytics dashboard with:
 * - Summary stat cards (total tokens, cost, requests)
 * - Time-series chart (tokens or cost view)
 * - Granularity selector (hourly/daily/monthly)
 * - Date range picker
 * - Breakdown table by dimension
 *
 * Used in:
 * - Organization > AI Usage tab
 * - Course Settings > AI Usage section
 * - Platform Admin > AI Usage tab
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, Flex, Statistic, Table, Typography, Segmented, DatePicker, Spin, Alert, Space } from 'antd';
import {
  BarChartOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  LineChartOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { colors } from '../../theme/colors';
import { AIUsageChart, formatNumber, formatCost } from '../core/AIUsageChart';
import type { AIUsageSummary } from '../../api-client';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

type Granularity = 'hourly' | 'daily' | 'monthly';
type ChartView = 'tokens' | 'cost';

interface AIUsageDashboardProps {
  /** Function to fetch usage data. Receives query params, returns usage summary. */
  fetchUsage: (params: { granularity: Granularity; startDate?: string; endDate?: string }) => Promise<AIUsageSummary>;
  /** Label for the breakdown column (e.g., "Course", "Assignment", "Organization") */
  breakdownLabel: string;
  /** Title displayed at the top of the dashboard */
  title?: string;
  /** Optional description */
  description?: string;
}

const AIUsageDashboard: React.FC<AIUsageDashboardProps> = ({
  fetchUsage,
  breakdownLabel,
  title = 'AI Usage Analytics',
  description,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AIUsageSummary | null>(null);
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [chartView, setChartView] = useState<ChartView>('tokens');
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUsage({
        granularity,
        startDate: dateRange[0],
        endDate: dateRange[1],
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [fetchUsage, granularity, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const breakdownColumns = [
    {
      title: breakdownLabel,
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Requests',
      dataIndex: 'requestCount',
      key: 'requestCount',
      align: 'right' as const,
      render: (v: number) => formatNumber(v),
      sorter: (a: any, b: any) => a.requestCount - b.requestCount,
    },
    {
      title: 'Input Tokens',
      dataIndex: 'inputTokens',
      key: 'inputTokens',
      align: 'right' as const,
      render: (v: number) => formatNumber(v),
      sorter: (a: any, b: any) => a.inputTokens - b.inputTokens,
    },
    {
      title: 'Output Tokens',
      dataIndex: 'outputTokens',
      key: 'outputTokens',
      align: 'right' as const,
      render: (v: number) => formatNumber(v),
      sorter: (a: any, b: any) => a.outputTokens - b.outputTokens,
    },
    {
      title: 'Total Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      align: 'right' as const,
      render: (v: number) => formatNumber(v),
      sorter: (a: any, b: any) => a.totalTokens - b.totalTokens,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Est. Cost',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      align: 'right' as const,
      render: (v: string) => formatCost(v),
      sorter: (a: any, b: any) => parseFloat(a.estimatedCost) - parseFloat(b.estimatedCost),
    },
  ];

  const modelBreakdownColumns = [
    {
      title: 'Model',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Requests',
      dataIndex: 'requestCount',
      key: 'requestCount',
      align: 'right' as const,
      render: (v: number) => formatNumber(v),
      sorter: (a: any, b: any) => a.requestCount - b.requestCount,
    },
    {
      title: 'Input Tokens',
      dataIndex: 'inputTokens',
      key: 'inputTokens',
      align: 'right' as const,
      render: (v: number) => formatNumber(v),
      sorter: (a: any, b: any) => a.inputTokens - b.inputTokens,
    },
    {
      title: 'Output Tokens',
      dataIndex: 'outputTokens',
      key: 'outputTokens',
      align: 'right' as const,
      render: (v: number) => formatNumber(v),
      sorter: (a: any, b: any) => a.outputTokens - b.outputTokens,
    },
    {
      title: 'Total Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      align: 'right' as const,
      render: (v: number) => formatNumber(v),
      sorter: (a: any, b: any) => a.totalTokens - b.totalTokens,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Est. Cost',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      align: 'right' as const,
      render: (v: string) => formatCost(v),
      sorter: (a: any, b: any) => parseFloat(a.estimatedCost) - parseFloat(b.estimatedCost),
    },
  ];

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: colors.neutralTitle }}>
            {title}
          </Title>
          {description && (
            <Text type="secondary" style={{ fontSize: 14 }}>
              {description}
            </Text>
          )}
        </div>
      </Flex>

      {/* Controls */}
      <Flex gap={16} wrap="wrap" style={{ marginBottom: 24 }}>
        <Space>
          <Text type="secondary">Granularity:</Text>
          <Segmented
            value={granularity}
            onChange={(v) => setGranularity(v as Granularity)}
            options={[
              { label: 'Hourly', value: 'hourly' },
              { label: 'Daily', value: 'daily' },
              { label: 'Monthly', value: 'monthly' },
            ]}
          />
        </Space>
        <Space>
          <Text type="secondary">Date Range:</Text>
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
              } else {
                setDateRange([undefined, undefined]);
              }
            }}
          />
        </Space>
      </Flex>

      {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      {loading ? (
        <Flex justify="center" align="center" style={{ height: 400 }}>
          <Spin size="large" />
        </Flex>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <Flex gap={16} wrap="wrap" style={{ marginBottom: 24 }}>
            <Card
              size="small"
              style={{
                flex: '1 1 200px',
                borderLeft: `4px solid ${colors.actionBlue}`,
              }}
            >
              <Statistic
                title="Total Requests"
                value={data.requestCount}
                prefix={<ApiOutlined style={{ color: colors.actionBlue }} />}
                formatter={(v) => formatNumber(v as number)}
              />
            </Card>
            <Card
              size="small"
              style={{
                flex: '1 1 200px',
                borderLeft: `4px solid ${colors.brandAccent}`,
              }}
            >
              <Statistic
                title="Total Tokens"
                value={data.totalTokens}
                prefix={<ThunderboltOutlined style={{ color: colors.brandAccent }} />}
                formatter={(v) => formatNumber(v as number)}
              />
            </Card>
            <Card
              size="small"
              style={{
                flex: '1 1 200px',
                borderLeft: `4px solid ${colors.actionGreen}`,
              }}
            >
              <Statistic
                title="Estimated Cost"
                value={data.estimatedCost as unknown as string}
                prefix={<DollarOutlined style={{ color: colors.actionGreen }} />}
                formatter={(v) => formatCost(v as string)}
              />
            </Card>
          </Flex>

          {/* Chart */}
          <Card
            title={
              <Flex justify="space-between" align="center">
                <Space>
                  <BarChartOutlined />
                  <span>Usage Over Time</span>
                </Space>
                <Segmented
                  size="small"
                  value={chartView}
                  onChange={(v) => setChartView(v as ChartView)}
                  options={[
                    { label: 'Tokens', value: 'tokens', icon: <BarChartOutlined /> },
                    { label: 'Cost', value: 'cost', icon: <LineChartOutlined /> },
                  ]}
                />
              </Flex>
            }
            style={{ marginBottom: 24 }}
          >
            <AIUsageChart timeSeries={data.timeSeries} granularity={granularity} chartType={chartView} />
          </Card>

          {/* Breakdown Table */}
          {data.breakdown && data.breakdown.length > 0 && (
            <Card
              title={
                <Space>
                  <BarChartOutlined />
                  <span>Usage by {breakdownLabel}</span>
                </Space>
              }
            >
              <Table
                dataSource={data.breakdown.map((item, idx) => ({ ...item, key: item.id ?? idx }))}
                columns={breakdownColumns}
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
              />
            </Card>
          )}

          {/* Model Breakdown Table */}
          {data.modelBreakdown && data.modelBreakdown.length > 0 && (
            <Card
              title={
                <Space>
                  <RobotOutlined />
                  <span>Usage by Model</span>
                </Space>
              }
              style={{ marginTop: 24 }}
            >
              <Table
                dataSource={data.modelBreakdown.map((item, idx) => ({ ...item, key: item.name ?? idx }))}
                columns={modelBreakdownColumns}
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
              />
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
};

export default AIUsageDashboard;
