// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Table, Tabs, Tag, Button, Card, Typography, Input, Select, Space, DatePicker, Image } from 'antd';
import { ReloadOutlined, SearchOutlined, ClearOutlined, AuditOutlined, BarChartOutlined } from '@ant-design/icons';
import type { SystemActivityResponse } from '../../api-client';
import { systemApi } from '../../api-client/clients';
import AdminPageHeader from './AdminPageHeader';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

// Audit categories — login, auth, and admin access events
const AUDIT_CATEGORIES = [
  'Become User',
  'Generate One-Time Token',
  'One-Time Token Generated',
  'Admin New Request Approved',
  'Admin New Request Denied',
  'Admin Change Organization Request',
  'Admin Already Exists',
  'Admin New Request Error',
  'New Org Admin Request',
  'Existing Org Admin Request',
  'CIP Activation',
  'Codepost Registration Error',
];

// Activity categories — system-level operational events
const ACTIVITY_CATEGORIES = [
  'Core App Ready',
  'Course Created',
  'Organization Created',
  'Assignment Created',
  'Email Subscription',
  'Email Sent',
  'Email Failed',
  'Late Submission Error',
  'UI Error',
  'Bug Report',
  'Display Issue',
  'Performance',
  'Data Issue',
  'Other',
  'User Happiness',
  'User Dump',
  'Webhook Error',
  'Webhook Connection Error',
  'API Error',
];

type EventTabType = 'activity' | 'audit';

// Categories that contain diagnostic error detail (browser context, console logs, etc.)
const DIAGNOSTIC_CATEGORIES = new Set([
  'UI Error',
  'Bug Report',
  'Display Issue',
  'Performance',
  'Data Issue',
  'Other',
]);

// Row tinting for event categories
const ERROR_CATEGORIES = new Set([
  'UI Error',
  'API Error',
  'Webhook Error',
  'Webhook Connection Error',
  'Email Failed',
  'Late Submission Error',
  'Codepost Registration Error',
  'Admin New Request Error',
]);
const AUDIT_HIGHLIGHT = new Set(['Become User', 'Generate One-Time Token', 'One-Time Token Generated']);

const getRowClassName = (record: Record<string, any>) => {
  if (ERROR_CATEGORIES.has(record.category)) return 'admin-row-error';
  if (AUDIT_HIGHLIGHT.has(record.category)) return 'admin-row-audit';
  return '';
};

const ActivityFeed: React.FC = () => {
  type EventLogType = SystemActivityResponse['results'][number];
  const [logs, setLogs] = useState<EventLogType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<EventTabType>('activity');

  // Filter state
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoriesForTab = activeTab === 'audit' ? AUDIT_CATEGORIES : ACTIVITY_CATEGORIES;

  const fetchLogs = useCallback(
    async (
      pageNum: number,
      pSize: number,
      search?: string,
      category?: string,
      dates?: [Dayjs | null, Dayjs | null] | null,
      tabType?: EventTabType,
    ) => {
      setLoading(true);
      try {
        const params: Parameters<typeof systemApi.activityRetrieve>[0] = {
          page: pageNum,
          pageSize: pSize,
          type: tabType,
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
    fetchLogs(1, pageSize, undefined, undefined, undefined, activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (key: string) => {
    const tab = key as EventTabType;
    setActiveTab(tab);
    setSearchText('');
    setCategoryFilter(undefined);
    setDateRange(null);
    setPage(1);
    fetchLogs(1, pageSize, undefined, undefined, undefined, tab);
  };

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchLogs(1, pageSize, value, categoryFilter, dateRange, activeTab);
      setPage(1);
    }, 400);
  };

  const handleCategoryChange = (value: string | undefined) => {
    setCategoryFilter(value);
    fetchLogs(1, pageSize, searchText, value, dateRange, activeTab);
    setPage(1);
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    fetchLogs(1, pageSize, searchText, categoryFilter, dates, activeTab);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchText('');
    setCategoryFilter(undefined);
    setDateRange(null);
    fetchLogs(1, pageSize, undefined, undefined, undefined, activeTab);
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
    let parsedMeta: Record<string, unknown> | null = null;
    try {
      parsedMeta = JSON.parse(record.meta);
    } catch {
      // not JSON — fall through to raw display
    }

    const isUIError = DIAGNOSTIC_CATEGORIES.has(record.category);
    const screenshot = parsedMeta && typeof parsedMeta.screenshot === 'string' ? parsedMeta.screenshot : null;

    // Parse nested errorDetail JSON (stored as a JSON string inside meta)
    let errorDetail: Record<string, unknown> | null = null;
    if (isUIError && parsedMeta && typeof parsedMeta.errorDetail === 'string') {
      try {
        errorDetail = JSON.parse(parsedMeta.errorDetail as string);
      } catch {
        // leave as null
      }
    }

    // Build meta for raw display, omitting large fields already shown above
    const metaForRaw = parsedMeta
      ? (() => {
          const { screenshot: _s, errorDetail: _ed, message: _m, ...rest } = parsedMeta as Record<string, unknown>;
          return Object.keys(rest).length > 0 ? JSON.stringify(rest, null, 2) : null;
        })()
      : record.meta;

    const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <p style={{ fontWeight: 700, marginBottom: 4, marginTop: 12 }}>{children}</p>
    );

    const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <pre
        style={{
          fontSize: '12px',
          background: '#eee',
          padding: '8px',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
          maxHeight: '300px',
          overflow: 'auto',
          margin: '4px 0 8px',
        }}
      >
        {children}
      </pre>
    );

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
        {/* ── Basic row info ──────────────────────────────────── */}
        <SectionLabel>Description</SectionLabel>
        <div style={{ whiteSpace: 'pre-wrap', marginBottom: '8px' }}>{record.description}</div>

        {record.user && (
          <p style={{ margin: '2px 0' }}>
            <strong>User:</strong> {record.user}
          </p>
        )}
        {record.courseID && (
          <p style={{ margin: '2px 0' }}>
            <strong>Course ID:</strong> {record.courseID}
          </p>
        )}

        {/* ── Screenshot ──────────────────────────────────────── */}
        {screenshot && (
          <>
            <SectionLabel>Screenshot</SectionLabel>
            <Image
              src={screenshot}
              alt="Page screenshot at time of error"
              style={{
                maxWidth: '800px',
                width: '100%',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '8px',
                display: 'block',
              }}
            />
          </>
        )}

        {/* ── Structured UI Error detail ───────────────────────── */}
        {isUIError && errorDetail && (
          <>
            {typeof errorDetail.stack === 'string' && (
              <>
                <SectionLabel>Stack Trace</SectionLabel>
                <CodeBlock>{errorDetail.stack as string}</CodeBlock>
              </>
            )}

            {typeof errorDetail.componentStack === 'string' && (
              <>
                <SectionLabel>React Component Stack</SectionLabel>
                <CodeBlock>{errorDetail.componentStack as string}</CodeBlock>
              </>
            )}

            {Array.isArray(errorDetail.recentConsoleLogs) && errorDetail.recentConsoleLogs.length > 0 && (
              <>
                <SectionLabel>Recent Console Errors / Warnings</SectionLabel>
                <CodeBlock>
                  {(errorDetail.recentConsoleLogs as Array<{ level: string; message: string; at: string }>)
                    .map((l) => `[${l.at}] [${l.level.toUpperCase()}] ${l.message}`)
                    .join('\n')}
                </CodeBlock>
              </>
            )}

            {/* Browser/env summary table */}
            {(() => {
              const browserFields: Array<[string, unknown]> = [
                ['URL', parsedMeta?.url ?? record.meta],
                ['Timestamp', errorDetail.timestamp],
                ['User Agent', errorDetail.userAgent],
                ['Platform', errorDetail.platform],
                ['Language', errorDetail.language],
                ['Viewport', errorDetail.viewport],
                [
                  'Screen',
                  typeof errorDetail.screen === 'object' ? JSON.stringify(errorDetail.screen) : errorDetail.screen,
                ],
                ['Hardware Threads', errorDetail.hardwareConcurrency],
                ['Online', String(errorDetail.onLine)],
                ['Cookies Enabled', String(errorDetail.cookiesEnabled)],
                ['Time On Page', errorDetail.timeOnPageSeconds != null ? `${errorDetail.timeOnPageSeconds}s` : null],
                ['Referrer', errorDetail.referrer],
                ['Boundary Type', errorDetail.boundaryType],
                ['Submission ID', errorDetail.submissionId],
                ['File ID', errorDetail.fileId],
                ['File Name', errorDetail.fileName],
              ].filter(([, v]) => v != null && v !== 'null' && v !== '') as Array<[string, unknown]>;

              const mem = errorDetail.memory as Record<string, unknown> | undefined;
              const conn = errorDetail.connection as Record<string, unknown> | undefined;
              const timing = errorDetail.timing as Record<string, unknown> | undefined;

              return (
                <>
                  <SectionLabel>Browser Context</SectionLabel>
                  <table
                    style={{
                      width: '100%',
                      fontSize: '12px',
                      borderCollapse: 'collapse',
                      marginBottom: '8px',
                    }}
                  >
                    <tbody>
                      {browserFields.map(([label, value]) => (
                        <tr key={label} style={{ borderBottom: '1px solid #e8e8e8' }}>
                          <td
                            style={{ padding: '3px 8px 3px 0', fontWeight: 600, whiteSpace: 'nowrap', width: '180px' }}
                          >
                            {label}
                          </td>
                          <td style={{ padding: '3px 0', wordBreak: 'break-all' }}>{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {mem && Object.keys(mem).length > 0 && (
                    <>
                      <SectionLabel>Memory (Chrome)</SectionLabel>
                      <CodeBlock>{JSON.stringify(mem, null, 2)}</CodeBlock>
                    </>
                  )}

                  {conn && Object.keys(conn).length > 0 && (
                    <>
                      <SectionLabel>Network Connection</SectionLabel>
                      <CodeBlock>{JSON.stringify(conn, null, 2)}</CodeBlock>
                    </>
                  )}

                  {timing && Object.keys(timing).length > 0 && (
                    <>
                      <SectionLabel>Page Timing</SectionLabel>
                      <CodeBlock>{JSON.stringify(timing, null, 2)}</CodeBlock>
                    </>
                  )}

                  {(() => {
                    const raw = errorDetail.localStorageKeys;
                    if (raw == null) return null;
                    // Normalise: old format was string[] (keys only), new format is Record<string,string>
                    const entries: [string, string][] = Array.isArray(raw)
                      ? (raw as string[]).map((k) => [k, ''])
                      : Object.entries(raw as Record<string, string>);
                    return (
                      <>
                        <SectionLabel>LocalStorage</SectionLabel>
                        {entries.length === 0 ? (
                          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>(empty)</div>
                        ) : (
                          <table
                            style={{ fontSize: '11px', marginBottom: '8px', borderCollapse: 'collapse', width: '100%' }}
                          >
                            <tbody>
                              {entries.map(([k, v]) => (
                                <tr key={k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                  <td
                                    style={{
                                      padding: '2px 8px 2px 0',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      color: '#444',
                                      verticalAlign: 'top',
                                      width: '1%',
                                    }}
                                  >
                                    {k}
                                  </td>
                                  <td style={{ padding: '2px 0', color: '#666', wordBreak: 'break-all' }}>
                                    {v || <em style={{ color: '#bbb' }}>empty</em>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </>
                    );
                  })()}

                  {Array.isArray(errorDetail.failedResources) && errorDetail.failedResources.length > 0 && (
                    <>
                      <SectionLabel>Potentially Failed Resources</SectionLabel>
                      <CodeBlock>{(errorDetail.failedResources as string[]).join('\n')}</CodeBlock>
                    </>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* ── Raw meta fallback (non-UI-Error events or unparseable) ── */}
        {(!isUIError || !errorDetail) && metaForRaw && metaForRaw !== '{}' && metaForRaw !== '' && (
          <>
            <SectionLabel>Meta Data</SectionLabel>
            <CodeBlock>{metaForRaw}</CodeBlock>
          </>
        )}
      </div>
    );
  };

  const renderLogTable = () => (
    <>
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
            options={categoriesForTab.map((c) => ({ label: c, value: c }))}
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
        rowClassName={getRowClassName}
        pagination={{
          current: page,
          total: total,
          pageSize: pageSize,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps || 20);
            fetchLogs(p, ps || 20, searchText, categoryFilter, dateRange, activeTab);
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
    </>
  );

  return (
    <div style={{ padding: 24 }}>
      <AdminPageHeader
        title="Activity & Audit Logs"
        subtitle="System-level events, errors, and authentication audit trail."
        actions={
          <Space>
            {hasActiveFilters && (
              <Button icon={<ClearOutlined />} onClick={handleClearFilters} size="small">
                Clear Filters
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchLogs(1, pageSize, searchText, categoryFilter, dateRange, activeTab)}
            >
              Refresh
            </Button>
          </Space>
        }
      />
      <Card bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          style={{ padding: '0 16px' }}
          items={[
            {
              key: 'activity',
              label: (
                <span>
                  <BarChartOutlined /> Activity Logs
                </span>
              ),
              children: renderLogTable(),
            },
            {
              key: 'audit',
              label: (
                <span>
                  <AuditOutlined /> Audit Logs
                </span>
              ),
              children: renderLogTable(),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ActivityFeed;
