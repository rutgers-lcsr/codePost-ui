// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Table, Tag, Button, Card, Typography, Input, Select, Space, DatePicker } from 'antd';
import { ReloadOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { SystemActivityResponse } from '../../api-client';
import { systemApi } from '../../api-client/clients';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

// All known event categories from core/logging.py
const EVENT_CATEGORIES = [
  'Core App Ready',
  'Course Created',
  'Organization Created',
  'Assignment Created',
  'Email Subscription',
  'Email Sent',
  'Email Failed',
  'Late Submission Error',
  'Become User',
  'UI Error',
  'User Happiness',
  'User Dump',
  'Admin Change Organization Request',
  'Codepost Registration Error',
  'Admin Already Exists',
  'Admin New Request Error',
  'Admin New Request Denied',
  'Admin New Request Approved',
  'Generate One-Time Token',
  'CIP Activation',
  'Webhook Error',
  'Webhook Connection Error',
  'API Error',
  'One-Time Token Generated',
];

const ActivityFeed: React.FC = () => {
  type EventLogType = SystemActivityResponse['results'][number];
  const [logs, setLogs] = useState<EventLogType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Filter state
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogs = useCallback(
    async (
      pageNum: number,
      pSize: number,
      search?: string,
      category?: string,
      dates?: [Dayjs | null, Dayjs | null] | null,
    ) => {
      setLoading(true);
      try {
        const params: Parameters<typeof systemApi.activityRetrieve>[0] = {
          page: pageNum,
          pageSize: pSize,
        };
        if (search && search.trim()) params.search = search.trim();
        if (category) params.category = category;
        if (dates?.[0]) params.startDate = dates[0].startOf('day').toISOString();
        if (dates?.[1]) params.endDate = dates[1].endOf('day').toISOString();

        const data = await systemApi.activityRetrieve(params);
        setLogs(data.results);
        setTotal(data.total);
        setPage(data.page);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchLogs(1, pageSize);
  }, []);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchLogs(1, pageSize, value, categoryFilter, dateRange);
      setPage(1);
    }, 400);
  };

  const handleCategoryChange = (value: string | undefined) => {
    setCategoryFilter(value);
    fetchLogs(1, pageSize, searchText, value, dateRange);
    setPage(1);
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    fetchLogs(1, pageSize, searchText, categoryFilter, dates);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchText('');
    setCategoryFilter(undefined);
    setDateRange(null);
    fetchLogs(1, pageSize);
    setPage(1);
  };

  const hasActiveFilters = searchText || categoryFilter || dateRange;

  const columns = [
    {
      title: 'Time',
      dataIndex: 'created',
      key: 'created',
      render: (text: string) => dayjs(text).format('MM/DD HH:mm:ss'),
      width: 150,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag>{cat}</Tag>,
      width: 150,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Typography.Paragraph ellipsis={{ rows: 2, expandable: false, symbol: 'more' }} style={{ margin: 0 }}>
          {text}
        </Typography.Paragraph>
      ),
    },
  ];

  const expandedRowRender = (record: EventLogType) => {
    let prettyMeta = record.meta;
    try {
      prettyMeta = JSON.stringify(JSON.parse(record.meta), null, 2);
    } catch (e) {
      // content is not JSON
    }

    return (
      <div
        style={{
          padding: '10px',
          background: '#fafafa',
          borderRadius: '4px',
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        <p>
          <strong>Full Description:</strong>
        </p>
        <div style={{ whiteSpace: 'pre-wrap', marginBottom: '10px', wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
          {record.description}
        </div>

        {record.user && (
          <p>
            <strong>User:</strong> {record.user}
          </p>
        )}
        {record.courseID && (
          <p>
            <strong>Course ID:</strong> {record.courseID}
          </p>
        )}

        {prettyMeta && prettyMeta !== '{}' && prettyMeta !== '' && (
          <>
            <p>
              <strong>Meta Data:</strong>
            </p>
            <pre
              style={{
                fontSize: '12px',
                background: '#eee',
                padding: '8px',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
              {prettyMeta}
            </pre>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Card
        title="System Activity Feed"
        bodyStyle={{ padding: 0 }}
        extra={
          <Space>
            {hasActiveFilters && (
              <Button icon={<ClearOutlined />} onClick={handleClearFilters} size="small">
                Clear Filters
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchLogs(1, pageSize, searchText, categoryFilter, dateRange)}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Space wrap size="middle" style={{ width: '100%' }}>
            <Input
              placeholder="Search description, user, or meta..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              allowClear
              style={{ width: 300 }}
            />
            <Select
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={handleCategoryChange}
              allowClear
              style={{ width: 240 }}
              options={EVENT_CATEGORIES.map((c) => ({ label: c, value: c }))}
              showSearch
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
            <RangePicker
              value={dateRange as [Dayjs, Dayjs] | null}
              onChange={(dates) => handleDateRangeChange(dates as [Dayjs | null, Dayjs | null] | null)}
              allowClear
              format="MM/DD/YYYY"
              placeholder={['Start date', 'End date']}
            />
          </Space>
        </div>
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total: total,
            pageSize: pageSize,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps || 20);
              fetchLogs(p, ps || 20, searchText, categoryFilter, dateRange);
            },
            showSizeChanger: true,
          }}
          size="middle"
          expandable={{
            expandedRowRender: expandedRowRender,
            rowExpandable: (_) => true,
          }}
          tableLayout="fixed"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default ActivityFeed;
