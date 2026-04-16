// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useCallback, useMemo, useState } from 'react';
import { Breadcrumb, Button, DatePicker, Select, Table, Tag, Empty, Skeleton } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import type { Course } from '../../../api-client';
import type { CourseAuditEvent } from '../../../services/courseAuditLog';
import { CourseAuditLogService, type AuditLogQueryParams } from '../../../services/courseAuditLog';
import type { Assignment } from '../../../types/common';
import CPAdminDetail from '../other/CPAdminDetail';

const { RangePicker } = DatePicker;

interface IProps {
  currentCourse: Course;
  assignments: Assignment[];
  students: string[];
}

const EVENT_TYPE_OPTIONS = [
  { value: 'submission_attempt', label: 'Submission Attempt' },
  { value: 'submission_failed', label: 'Submission Failed' },
  { value: 'file_view', label: 'File View' },
  { value: 'feedback_view', label: 'Feedback View' },
  { value: 'regrade_request', label: 'Regrade Request' },
  { value: 'regrade_deleted', label: 'Regrade Deleted' },
  { value: 'autograder_triggered', label: 'Autograder Triggered' },
  { value: 'autograder_completed', label: 'Autograder Completed' },
  { value: 'autograder_failed', label: 'Autograder Failed' },
  { value: 'late_day_used', label: 'Late Day Used' },
  { value: 'comment_feedback', label: 'Comment Feedback' },
];

const EVENT_TYPE_COLORS: Record<string, string> = {
  submission_attempt: 'blue',
  submission_failed: 'red',
  file_view: 'cyan',
  feedback_view: 'green',
  regrade_request: 'orange',
  regrade_deleted: 'volcano',
  autograder_triggered: 'geekblue',
  autograder_completed: 'lime',
  autograder_failed: 'magenta',
  late_day_used: 'gold',
  comment_feedback: 'purple',
};

const PAGE_SIZE = 25;

const ActivityLog: React.FC<IProps> = ({ currentCourse, assignments, students }) => {
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [studentFilter, setStudentFilter] = useState<string | undefined>();
  const [assignmentFilter, setAssignmentFilter] = useState<number | undefined>();
  const [eventTypeFilter, setEventTypeFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Build a student email → user ID map from events (for filter)
  // We use email-based filtering via the student list from props
  const studentOptions = useMemo(() => students.map((email) => ({ value: email, label: email })), [students]);

  const assignmentOptions = useMemo(() => assignments.map((a) => ({ value: a.id, label: a.name })), [assignments]);

  const queryParams = useMemo((): AuditLogQueryParams => {
    const params: AuditLogQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (studentFilter) params.student = studentFilter;
    if (assignmentFilter) params.assignment = assignmentFilter;
    if (eventTypeFilter) params.eventType = eventTypeFilter;
    if (dateRange?.[0]) params.dateFrom = dateRange[0].startOf('day').toISOString();
    if (dateRange?.[1]) params.dateTo = dateRange[1].endOf('day').toISOString();
    return params;
  }, [page, studentFilter, assignmentFilter, eventTypeFilter, dateRange]);

  const { data, isPending: loading } = useQuery({
    queryKey: ['auditLog', currentCourse.id, queryParams] as const,
    queryFn: () => CourseAuditLogService.list(currentCourse.id, queryParams),
    placeholderData: keepPreviousData,
  });

  const events = data?.results ?? [];
  const total = data?.count ?? 0;

  // Reset to page 1 when filters change
  const resetPage = useCallback(() => setPage(1), []);

  const handleStudentFilter = useCallback((v: string | undefined) => { setStudentFilter(v); resetPage(); }, [resetPage]);
  const handleAssignmentFilter = useCallback((v: number | undefined) => { setAssignmentFilter(v); resetPage(); }, [resetPage]);
  const handleEventTypeFilter = useCallback((v: string | undefined) => { setEventTypeFilter(v); resetPage(); }, [resetPage]);
  const handleDateRange = useCallback((dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => { setDateRange(dates); resetPage(); }, [resetPage]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { ...queryParams };
      // Remove pagination for export
      delete params.page;
      delete params.pageSize;
      await CourseAuditLogService.exportCsv(currentCourse.id, params);
    } catch (err) {
      console.error('Failed to export audit log:', err);
    } finally {
      setExporting(false);
    }
  };

  const columns: ColumnsType<CourseAuditEvent> = [
    {
      title: 'Timestamp',
      dataIndex: 'created',
      key: 'created',
      width: 180,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '—'),
      sorter: (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      key: 'eventType',
      width: 180,
      render: (val: string) => {
        const color = EVENT_TYPE_COLORS[val] || 'default';
        const label = EVENT_TYPE_OPTIONS.find((o) => o.value === val)?.label || val;
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Student',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 220,
      render: (val: string | null) => val || '—',
    },
    {
      title: 'Assignment',
      dataIndex: 'assignmentName',
      key: 'assignmentName',
      width: 200,
      render: (val: string | null) => val || '—',
    },
    {
      title: 'Submission',
      dataIndex: 'submission',
      key: 'submission',
      width: 100,
      render: (val: number | null) => (val ? `#${val}` : '—'),
    },
    {
      title: 'Details',
      dataIndex: 'meta',
      key: 'meta',
      render: (val: Record<string, unknown> | null) => {
        if (!val) return '—';
        // Show a compact summary of meta fields
        const entries = Object.entries(val);
        if (entries.length === 0) return '—';
        return (
          <span style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)', fontFamily: 'monospace' }}>
            {entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ')}
          </span>
        );
      },
    },
  ];

  const breadcrumbs = (
    <Breadcrumb items={[{ title: currentCourse.name }, { title: currentCourse.period }, { title: 'Activity Log' }]} />
  );

  const filters = (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 20,
        alignItems: 'center',
        padding: '14px 16px',
        background: '#fafbfc',
        borderRadius: 8,
        border: '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      {' '}
      <Select
        allowClear
        showSearch
        placeholder="Filter by student"
        style={{ width: 220 }}
        options={studentOptions}
        value={studentFilter}
        onChange={handleStudentFilter}
        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
      />
      <Select
        allowClear
        placeholder="Filter by assignment"
        style={{ width: 200 }}
        options={assignmentOptions}
        value={assignmentFilter}
        onChange={handleAssignmentFilter}
      />
      <Select
        allowClear
        placeholder="Filter by event type"
        style={{ width: 200 }}
        options={EVENT_TYPE_OPTIONS}
        value={eventTypeFilter}
        onChange={handleEventTypeFilter}
      />
      <RangePicker value={dateRange} onChange={(dates) => handleDateRange(dates)} style={{ width: 280 }} />
    </div>
  );

  return (
    <CPAdminDetail
      goBack={null}
      breadcrumbs={breadcrumbs}
      title="Activity Log"
      actions={[
        <Button key="export" icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
          Export CSV
        </Button>,
      ]}
      content={
        <>
          {filters}
          {loading && events.length === 0 ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : events.length === 0 && !loading ? (
            <Empty description="No audit events recorded yet. Events will appear here as students interact with the course." />
          ) : (
            <Table
              columns={columns}
              dataSource={events}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{
                current: page,
                pageSize: PAGE_SIZE,
                total,
                onChange: (p) => setPage(p),
                showSizeChanger: false,
                showTotal: (t) => `${t} events`,
              }}
              style={{ marginTop: 8 }}
              scroll={{ x: 1100 }}
            />
          )}
        </>
      }
    />
  );
};

export default ActivityLog;
