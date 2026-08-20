// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AutogradingStats
 *
 * SuperAdmin dashboard tab showing platform-wide autograder health:
 * cache-hit rate vs actual executions, failure counts, language usage,
 * failures per language, and the most common error categories.
 *
 * Stats are recorded from deployment of the AutograderExecutionEvent model
 * onward — there is no historical backfill.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Card, Col, DatePicker, Progress, Row, Space, Spin, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import {
  CloseCircleOutlined,
  DatabaseOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import { colors } from '../../theme/colors';
import { AutogradingStatsService } from '../../services/autograding';
import type { AutogradingStats as AutogradingStatsModel, AutogradingTopError } from '../../api-client';
import LanguageUsageChart from './charts/LanguageUsageChart';
import FailuresPerLanguageChart from './charts/FailuresPerLanguageChart';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const ERROR_CATEGORY_LABELS: Record<string, string> = {
  timeout: 'Timeout',
  missing_dependency: 'Missing Dependency',
  compile_error: 'Compile Error',
  runtime_error: 'Runtime Error',
  marker_extraction: 'Marker Extraction',
  infra: 'Infrastructure',
  unknown: 'Unknown',
};

const ERROR_CATEGORY_TAG_COLORS: Record<string, string> = {
  timeout: 'orange',
  missing_dependency: 'purple',
  compile_error: 'geekblue',
  runtime_error: 'red',
  marker_extraction: 'magenta',
  infra: 'volcano',
  unknown: 'default',
};

const AutogradingStats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AutogradingStatsModel | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(30, 'day'), dayjs()]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await AutogradingStatsService.getStats({
        dateFrom: dateRange[0].toISOString(),
        dateTo: dateRange[1].toISOString(),
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load autograding stats');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const errorColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={ERROR_CATEGORY_TAG_COLORS[category] ?? 'default'}>
          {ERROR_CATEGORY_LABELS[category] ?? category}
        </Tag>
      ),
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      align: 'right' as const,
      sorter: (a: AutogradingTopError, b: AutogradingTopError) => a.count - b.count,
    },
    {
      title: 'Most Recent Sample',
      dataIndex: 'sampleMessage',
      key: 'sampleMessage',
      render: (message: string) =>
        message ? (
          <Tooltip title={message}>
            <Text code ellipsis style={{ maxWidth: 480, display: 'inline-block', verticalAlign: 'middle' }}>
              {message}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  if (error) {
    return <Alert type="error" message="Failed to load autograding stats" description={error} showIcon />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <RangePicker
        value={dateRange}
        allowClear={false}
        onChange={(range) => {
          if (range && range[0] && range[1]) {
            setDateRange([range[0], range[1]]);
          }
        }}
      />

      <Spin spinning={loading}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Requests"
                  value={data?.totalRequests ?? 0}
                  prefix={<ThunderboltOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card>
                <Statistic
                  title="Cache Hit Rate"
                  value={Math.round((data?.cacheHitRate ?? 0) * 100)}
                  suffix="%"
                  prefix={<DatabaseOutlined />}
                />
                <Progress
                  percent={Math.round((data?.cacheHitRate ?? 0) * 100)}
                  showInfo={false}
                  size="small"
                  strokeColor={colors.actionBlue}
                />
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card>
                <Statistic
                  title="Actual Executions"
                  value={data?.actualExecutions ?? 0}
                  prefix={<PlayCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card>
                <Statistic
                  title="Failed Executions"
                  value={data?.failedExecutions ?? 0}
                  valueStyle={data?.failedExecutions ? { color: colors.actionRed } : undefined}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {data && data.totalRequests === 0 ? (
            <Alert
              type="info"
              showIcon
              message="No autograding activity in this date range"
              description="Execution stats are collected from the time this feature was deployed onward — there is no historical backfill."
            />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Language Usage" size="small">
                    <LanguageUsageChart data={data?.languageUsage ?? []} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Failures per Language" size="small">
                    {data && data.failuresPerLanguage.length > 0 ? (
                      <FailuresPerLanguageChart data={data.failuresPerLanguage} />
                    ) : (
                      <Text type="secondary">No failed executions in this date range.</Text>
                    )}
                  </Card>
                </Col>
              </Row>

              <Card title="Most Common Errors" size="small">
                {data && data.topErrors.length > 0 ? (
                  <Table
                    columns={errorColumns}
                    dataSource={data.topErrors.map((row, index) => ({ ...row, key: index }))}
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Text type="secondary">No errors recorded in this date range.</Text>
                )}
              </Card>
            </>
          )}
        </Space>
      </Spin>
    </Space>
  );
};

export default AutogradingStats;
