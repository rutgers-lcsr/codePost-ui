// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AutogradingStats
 *
 * SuperAdmin dashboard tab showing platform-wide autograder health:
 * cache-hit rate vs actual executions, failure counts, language usage,
 * failures per language, the most common error categories, the assignments
 * with the most failures, and a filterable list of individual failures with
 * the context (course, assignment, submission, file, image, task id, full
 * error output) needed to isolate each one.
 *
 * Stats are recorded from deployment of the AutograderExecutionEvent model
 * onward — there is no historical backfill.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { CloseCircleOutlined, DatabaseOutlined, PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Link } from 'react-router';

import { colors } from '../../theme/colors';
import { ADMIN, CODE } from '../../routes';
import { AutogradingStatsService } from '../../services/autograding';
import type { AutogradingFailuresParams } from '../../services/autograding';
import type {
  AutogradingAssignmentFailure,
  AutogradingFailure,
  AutogradingFailureList,
  AutogradingStats as AutogradingStatsModel,
  AutogradingTopError,
} from '../../api-client';
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

const TRIGGER_LABELS: Record<string, string> = {
  file_run: 'File run',
  submission_run: 'Submission run',
  test_run: 'Test run',
};

const FAILURES_PAGE_SIZE = 25;

type FailureFilters = Pick<AutogradingFailuresParams, 'category' | 'trigger' | 'language' | 'assignmentId' | 'q'>;

const CategoryTag: React.FC<{ category: string }> = ({ category }) => (
  <Tag color={ERROR_CATEGORY_TAG_COLORS[category] ?? 'default'}>{ERROR_CATEGORY_LABELS[category] ?? category}</Tag>
);

const assignmentsLink = (courseName: string | null | undefined, coursePeriod: string | null | undefined) =>
  courseName && coursePeriod ? `${ADMIN}/${courseName}/${coursePeriod}/assignments` : null;

const AutogradingStats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AutogradingStatsModel | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(30, 'day'), dayjs()]);
  const [filters, setFilters] = useState<FailureFilters>({});
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [failures, setFailures] = useState<AutogradingFailureList | null>(null);
  const [failuresLoading, setFailuresLoading] = useState(false);
  const [failuresError, setFailuresError] = useState<string | null>(null);

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

  const loadFailures = useCallback(async () => {
    setFailuresLoading(true);
    setFailuresError(null);
    try {
      const result = await AutogradingStatsService.getFailures({
        dateFrom: dateRange[0].toISOString(),
        dateTo: dateRange[1].toISOString(),
        ...filters,
        page,
        pageSize: FAILURES_PAGE_SIZE,
      });
      setFailures(result);
    } catch (err) {
      setFailuresError(err instanceof Error ? err.message : 'Failed to load autograding failures');
    } finally {
      setFailuresLoading(false);
    }
  }, [dateRange, filters, page]);

  useEffect(() => {
    loadFailures();
  }, [loadFailures]);

  const applyFilters = (patch: FailureFilters) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const clearFilters = () => {
    setPage(1);
    setSearchText('');
    setFilters({});
  };

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

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
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, row: AutogradingTopError) => (
        <Button type="link" size="small" onClick={() => applyFilters({ category: row.category })}>
          Show failures
        </Button>
      ),
    },
  ];

  const assignmentColumns = [
    {
      title: 'Course',
      key: 'course',
      render: (_: unknown, row: AutogradingAssignmentFailure) =>
        row.courseName ? (
          <Text>
            {row.courseName} <Text type="secondary">{row.coursePeriod}</Text>
          </Text>
        ) : (
          <Text type="secondary">deleted</Text>
        ),
    },
    {
      title: 'Assignment',
      key: 'assignment',
      render: (_: unknown, row: AutogradingAssignmentFailure) => {
        const link = assignmentsLink(row.courseName, row.coursePeriod);
        return link ? <Link to={link}>{row.assignmentName}</Link> : row.assignmentName;
      },
    },
    {
      title: 'Failures',
      dataIndex: 'failures',
      key: 'failures',
      align: 'right' as const,
    },
    {
      title: 'Top Category',
      dataIndex: 'topCategory',
      key: 'topCategory',
      render: (category: string) => <CategoryTag category={category} />,
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, row: AutogradingAssignmentFailure) => (
        <Button type="link" size="small" onClick={() => applyFilters({ assignmentId: row.assignmentId })}>
          Show failures
        </Button>
      ),
    },
  ];

  const failureColumns = [
    {
      title: 'When',
      dataIndex: 'created',
      key: 'created',
      width: 130,
      render: (value: string) => (
        <Tooltip title={dayjs(value).format('YYYY-MM-DD HH:mm:ss')}>{dayjs(value).format('MM/DD HH:mm:ss')}</Tooltip>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <CategoryTag category={category} />,
    },
    {
      title: 'Trigger',
      dataIndex: 'trigger',
      key: 'trigger',
      render: (trigger: string) => TRIGGER_LABELS[trigger] ?? trigger,
    },
    {
      title: 'Course / Assignment',
      key: 'assignment',
      render: (_: unknown, row: AutogradingFailure) => {
        if (!row.courseName) {
          return <Text type="secondary">—</Text>;
        }
        const link = assignmentsLink(row.courseName, row.coursePeriod);
        return (
          <Space direction="vertical" size={0}>
            <Text>
              {row.courseName} <Text type="secondary">{row.coursePeriod}</Text>
            </Text>
            {row.assignmentName &&
              (link ? <Link to={link}>{row.assignmentName}</Link> : <Text>{row.assignmentName}</Text>)}
          </Space>
        );
      },
    },
    {
      title: 'Submission',
      dataIndex: 'submissionId',
      key: 'submissionId',
      render: (submissionId: number | null) =>
        submissionId ? (
          <Link to={`${CODE}/${submissionId}`} target="_blank" rel="noopener noreferrer">
            #{submissionId}
          </Link>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'File',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (fileName: string) => (fileName ? <Text code>{fileName}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Error',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (message: string) =>
        message ? (
          <Tooltip title={message}>
            <Text code ellipsis style={{ maxWidth: 360, display: 'inline-block', verticalAlign: 'middle' }}>
              {message}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  const renderFailureDetail = (row: AutogradingFailure) => (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Descriptions size="small" column={{ xs: 1, md: 3 }} bordered>
        <Descriptions.Item label="Event">#{row.id}</Descriptions.Item>
        <Descriptions.Item label="Language">{row.language || 'unknown'}</Descriptions.Item>
        <Descriptions.Item label="Execution time">
          {row.executionTime != null ? `${row.executionTime.toFixed(2)} s` : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Triggered by">{row.triggeredBy ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Image">{row.imageName ? <Text code>{row.imageName}</Text> : '—'}</Descriptions.Item>
        <Descriptions.Item label="Task id">
          {row.taskId ? (
            <Text code copyable>
              {row.taskId}
            </Text>
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Course id">{row.courseId ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Assignment id">{row.assignmentId ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="File id">{row.fileId ?? '—'}</Descriptions.Item>
      </Descriptions>
      <pre
        style={{
          margin: 0,
          maxHeight: 320,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: 12,
        }}
      >
        {row.errorDetail || row.errorMessage || 'No error output was captured.'}
      </pre>
    </Space>
  );

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
                <Statistic title="Total Requests" value={data?.totalRequests ?? 0} prefix={<ThunderboltOutlined />} />
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

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
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
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Failures by Assignment" size="small">
                    {data && data.failuresByAssignment.length > 0 ? (
                      <Table
                        columns={assignmentColumns}
                        dataSource={data.failuresByAssignment.map((row) => ({ ...row, key: row.assignmentId }))}
                        pagination={false}
                        size="small"
                      />
                    ) : (
                      <Text type="secondary">No failures attributed to an assignment in this date range.</Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Space>
      </Spin>

      <Card title="Recent Failures" size="small">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Select
              allowClear
              placeholder="Category"
              style={{ width: 180 }}
              value={filters.category}
              onChange={(value) => applyFilters({ category: value })}
              options={Object.entries(ERROR_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <Select
              allowClear
              placeholder="Trigger"
              style={{ width: 160 }}
              value={filters.trigger}
              onChange={(value) => applyFilters({ trigger: value })}
              options={Object.entries(TRIGGER_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <Select
              allowClear
              placeholder="Language"
              style={{ width: 160 }}
              value={filters.language}
              onChange={(value) => applyFilters({ language: value })}
              options={(data?.languageUsage ?? []).map((row) => ({ value: row.language, label: row.language }))}
            />
            <Input.Search
              allowClear
              placeholder="Search error text"
              style={{ width: 260 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(value) => applyFilters({ q: value || undefined })}
            />
            {filters.assignmentId !== undefined && (
              <Tag closable onClose={() => applyFilters({ assignmentId: undefined })}>
                Assignment #{filters.assignmentId}
              </Tag>
            )}
            {hasFilters && (
              <Button size="small" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </Space>

          {failuresError ? (
            <Alert type="error" message="Failed to load autograding failures" description={failuresError} showIcon />
          ) : (
            <Table
              columns={failureColumns}
              dataSource={(failures?.results ?? []).map((row) => ({ ...row, key: row.id }))}
              loading={failuresLoading}
              size="small"
              expandable={{ expandedRowRender: renderFailureDetail }}
              pagination={{
                current: page,
                pageSize: FAILURES_PAGE_SIZE,
                total: failures?.count ?? 0,
                showSizeChanger: false,
                showTotal: (total) => `${total} failure${total === 1 ? '' : 's'}`,
                onChange: (next) => setPage(next),
              }}
              locale={{ emptyText: 'No failed executions match these filters.' }}
            />
          )}
        </Space>
      </Card>
    </Space>
  );
};

export default AutogradingStats;
