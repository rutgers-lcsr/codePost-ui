// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Card,
  Col,
  Descriptions,
  Popover,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
  WarningOutlined,
} from '@ant-design/icons';

import type { AssignmentDeadline } from '../../api-client';
import { dashboardApi } from '../../api-client/clients';
import AdminPageHeader from './AdminPageHeader';

const { Text, Title } = Typography;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Normalise an ISO date string to YYYY-MM-DD in local time. */
const toLocalDateKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Format for display: "Mar 3 at 11:59 PM" */
const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  assignment: AssignmentDeadline;
  type: 'due' | 'late' | 'regrade';
  date: string; // ISO string
  dateKey: string; // YYYY-MM-DD
}

type DayEvents = Map<string, CalendarEvent[]>;

// ─── Risk colours ──────────────────────────────────────────────────────────────

type RiskLevel = 'safe' | 'low' | 'medium' | 'high';

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: '#f6ffed', // green tint
  low: '#fffbe6', // yellow tint
  medium: '#fff1f0', // red tint
  high: '#ff4d4f30', // strong red
};

const RISK_BADGE: Record<RiskLevel, 'success' | 'warning' | 'error' | 'default'> = {
  safe: 'success',
  low: 'warning',
  medium: 'error',
  high: 'error',
};

const riskLevel = (events: CalendarEvent[]): RiskLevel => {
  if (events.length === 0) return 'safe';
  const dueCount = events.filter((e) => e.type === 'due').length;
  const totalStudents = events.reduce((sum, e) => sum + e.assignment.studentCount, 0);
  if (dueCount >= 3 || totalStudents > 500) return 'high';
  if (dueCount >= 2 || totalStudents > 200) return 'medium';
  if (dueCount >= 1) return 'low';
  return 'safe';
};

const riskLabel = (level: RiskLevel): string => {
  switch (level) {
    case 'safe':
      return 'Safe to deploy';
    case 'low':
      return 'Low risk';
    case 'medium':
      return 'Medium risk';
    case 'high':
      return 'High risk — avoid deploys';
  }
};

// ─── Component ─────────────────────────────────────────────────────────────────

const DeployCalendar = () => {
  const [deadlines, setDeadlines] = useState<AssignmentDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar navigation state
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // Optional course filter
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Fetch deadlines
  const fetchDeadlines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.deadlinesList();
      setDeadlines(data);
    } catch (err) {
      console.error('Failed to fetch deadlines:', err);
      setError('Failed to load deadline data. Make sure you have superadmin access.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  // Build events
  const events = useMemo<CalendarEvent[]>(() => {
    const filtered = selectedCourseId ? deadlines.filter((d) => d.courseId === selectedCourseId) : deadlines;

    const result: CalendarEvent[] = [];
    for (const a of filtered) {
      if (a.uploadDueDate) {
        result.push({ assignment: a, type: 'due', date: a.uploadDueDate, dateKey: toLocalDateKey(a.uploadDueDate) });
      }
      if (a.lateUploadDeadline) {
        result.push({
          assignment: a,
          type: 'late',
          date: a.lateUploadDeadline,
          dateKey: toLocalDateKey(a.lateUploadDeadline),
        });
      }
      if (a.regradeDeadline) {
        result.push({
          assignment: a,
          type: 'regrade',
          date: a.regradeDeadline,
          dateKey: toLocalDateKey(a.regradeDeadline),
        });
      }
    }
    return result;
  }, [deadlines, selectedCourseId]);

  // Group events by date key
  const eventsByDate = useMemo<DayEvents>(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const existing = map.get(ev.dateKey) ?? [];
      existing.push(ev);
      map.set(ev.dateKey, existing);
    }
    return map;
  }, [events]);

  // Unique courses for the filter dropdown
  const courseOptions = useMemo(
    () =>
      Array.from(
        new Map(
          deadlines.map((d) => [d.courseId, { id: d.courseId, label: `${d.courseName} (${d.coursePeriod})` }]),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [deadlines],
  );

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();

    // Leading blanks for alignment
    const cells: Array<{ day: number | null; dateKey: string | null }> = [];
    for (let i = 0; i < startDow; i++) cells.push({ day: null, dateKey: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateKey: key });
    }
    return cells;
  }, [viewYear, viewMonth]);

  // Nav helpers
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };
  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // ─── Summary stats for the current month ──────────────────────────────────

  const monthlySummary = useMemo(() => {
    const monthEvents = events.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    });
    const dueCount = monthEvents.filter((e) => e.type === 'due').length;
    const lateCount = monthEvents.filter((e) => e.type === 'late').length;
    const regradeCount = monthEvents.filter((e) => e.type === 'regrade').length;

    // Find safest consecutive window (3+ days with 0 due-date events)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    let bestStart = -1;
    let bestLen = 0;
    let curStart = -1;
    let curLen = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvs = eventsByDate.get(key) ?? [];
      const hasDue = dayEvs.some((e) => e.type === 'due');
      if (!hasDue) {
        if (curStart === -1) curStart = d;
        curLen++;
      } else {
        if (curLen > bestLen) {
          bestLen = curLen;
          bestStart = curStart;
        }
        curStart = -1;
        curLen = 0;
      }
    }
    if (curLen > bestLen) {
      bestLen = curLen;
      bestStart = curStart;
    }

    return { dueCount, lateCount, regradeCount, bestStart, bestLen };
  }, [events, viewYear, viewMonth, eventsByDate]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" tip="Loading deadlines..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert title="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  const todayKey = toLocalDateKey(today.toISOString());

  return (
    <div style={{ padding: 24 }}>
      <AdminPageHeader
        title="Deploy Calendar"
        subtitle="Visualise all assignment due dates &amp; late-upload deadlines to find the safest deployment windows."
      />

      {/* Toolbar */}
      <Row gutter={16} style={{ marginBottom: '16px' }} align="middle">
        <Col>
          <Space>
            <Tooltip title="Previous month">
              <span
                role="button"
                tabIndex={0}
                onClick={prevMonth}
                onKeyDown={(e) => e.key === 'Enter' && prevMonth()}
                style={{ cursor: 'pointer', fontSize: 18 }}
                aria-label="Previous month"
              >
                <LeftOutlined />
              </span>
            </Tooltip>

            <Title level={4} style={{ margin: 0, minWidth: 180, textAlign: 'center' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Title>

            <Tooltip title="Next month">
              <span
                role="button"
                tabIndex={0}
                onClick={nextMonth}
                onKeyDown={(e) => e.key === 'Enter' && nextMonth()}
                style={{ cursor: 'pointer', fontSize: 18 }}
                aria-label="Next month"
              >
                <RightOutlined />
              </span>
            </Tooltip>

            <Tag
              color="blue"
              style={{ cursor: 'pointer', marginLeft: 8 }}
              onClick={goToToday}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && goToToday()}
            >
              Today
            </Tag>
          </Space>
        </Col>

        <Col flex="auto" />

        <Col>
          <Select
            allowClear
            placeholder="Filter by course"
            style={{ width: 320 }}
            value={selectedCourseId}
            onChange={(v) => setSelectedCourseId(v ?? null)}
            options={courseOptions.map((c) => ({ value: c.id, label: c.label }))}
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Col>
      </Row>

      {/* Month summary bar */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Space size="large">
          <Text>
            <Badge status="error" /> <strong>{monthlySummary.dueCount}</strong> due dates
          </Text>
          <Text>
            <Badge status="warning" /> <strong>{monthlySummary.lateCount}</strong> late-upload deadlines
          </Text>
          <Text>
            <Badge status="default" /> <strong>{monthlySummary.regradeCount}</strong> regrade deadlines
          </Text>
          {monthlySummary.bestLen >= 2 && (
            <Text type="success">
              <CheckCircleOutlined style={{ marginRight: 4 }} />
              Best window:{' '}
              <strong>
                {MONTH_NAMES[viewMonth]} {monthlySummary.bestStart}–
                {monthlySummary.bestStart + monthlySummary.bestLen - 1}
              </strong>{' '}
              ({monthlySummary.bestLen} days, no due dates)
            </Text>
          )}
          {monthlySummary.bestLen < 2 && monthlySummary.dueCount > 0 && (
            <Text type="danger">
              <WarningOutlined style={{ marginRight: 4 }} />
              No safe multi-day window this month
            </Text>
          )}
        </Space>
      </Card>

      {/* Calendar grid */}
      <Card bodyStyle={{ padding: 0 }}>
        {/* Day-of-week header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {DAY_NAMES.map((name) => (
            <div
              key={name}
              style={{
                padding: '8px 4px',
                textAlign: 'center',
                fontWeight: 600,
                color: '#595959',
                fontSize: 12,
              }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
        >
          {calendarDays.map((cell, idx) => {
            if (cell.day === null) {
              return (
                <div
                  key={`blank-${idx}`}
                  style={{ minHeight: 90, borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0' }}
                />
              );
            }

            const dayEvents = eventsByDate.get(cell.dateKey!) ?? [];
            const risk = riskLevel(dayEvents);
            const isToday = cell.dateKey === todayKey;

            return (
              <Popover
                key={cell.dateKey}
                placement="right"
                title={
                  <Space>
                    <CalendarOutlined />
                    <span>
                      {MONTH_NAMES[viewMonth]} {cell.day}, {viewYear}
                    </span>
                    <Badge status={RISK_BADGE[risk]} text={riskLabel(risk)} />
                  </Space>
                }
                content={
                  dayEvents.length === 0 ? (
                    <Text type="secondary">No deadlines — safe to deploy.</Text>
                  ) : (
                    <div style={{ maxWidth: 420, maxHeight: 320, overflowY: 'auto' }}>
                      {dayEvents.map((ev, i) => (
                        <Descriptions
                          key={`${ev.assignment.id}-${ev.type}-${i}`}
                          size="small"
                          column={1}
                          bordered
                          style={{ marginBottom: 8 }}
                          title={
                            <Space>
                              {ev.type === 'due' && <Tag color="red">Due</Tag>}
                              {ev.type === 'late' && <Tag color="orange">Late Upload</Tag>}
                              {ev.type === 'regrade' && <Tag color="default">Regrade</Tag>}
                              <Text strong>{ev.assignment.name}</Text>
                            </Space>
                          }
                        >
                          <Descriptions.Item label="Course">
                            {ev.assignment.courseName} ({ev.assignment.coursePeriod})
                          </Descriptions.Item>
                          <Descriptions.Item label="Time">{formatDateTime(ev.date)}</Descriptions.Item>
                          <Descriptions.Item label="Students">{ev.assignment.studentCount}</Descriptions.Item>
                          {ev.assignment.allowLateUploads && (
                            <Descriptions.Item label="Max Late Days">{ev.assignment.maxLateDays}</Descriptions.Item>
                          )}
                        </Descriptions>
                      ))}
                    </div>
                  )
                }
                trigger="click"
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`${MONTH_NAMES[viewMonth]} ${cell.day}: ${dayEvents.length} deadlines, ${riskLabel(risk)}`}
                  style={{
                    minHeight: 90,
                    padding: '4px 6px',
                    borderBottom: '1px solid #f0f0f0',
                    borderRight: '1px solid #f0f0f0',
                    background: RISK_COLORS[risk],
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    position: 'relative',
                    outline: isToday ? '2px solid #1890ff' : undefined,
                    outlineOffset: isToday ? '-2px' : undefined,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e6f7ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = RISK_COLORS[risk])}
                >
                  {/* Day number */}
                  <div
                    style={{
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? '#1890ff' : '#262626',
                      fontSize: 13,
                      marginBottom: 2,
                    }}
                  >
                    {isToday ? (
                      <Badge
                        count={cell.day}
                        style={{ backgroundColor: '#1890ff', fontSize: 11, fontWeight: 700 }}
                        overflowCount={99}
                      />
                    ) : (
                      cell.day
                    )}
                  </div>

                  {/* Event dots (max 4 shown) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dayEvents.slice(0, 4).map((ev, i) => (
                      <div
                        key={`${ev.assignment.id}-${ev.type}-${i}`}
                        style={{
                          fontSize: 10,
                          lineHeight: '14px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: ev.type === 'due' ? '#cf1322' : ev.type === 'late' ? '#d48806' : '#595959',
                        }}
                      >
                        {ev.type === 'due' && <ClockCircleOutlined style={{ marginRight: 2 }} />}
                        {ev.type === 'late' && <WarningOutlined style={{ marginRight: 2 }} />}
                        {ev.assignment.name}
                      </div>
                    ))}
                    {dayEvents.length > 4 && (
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        +{dayEvents.length - 4} more
                      </Text>
                    )}
                  </div>
                </div>
              </Popover>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <Card size="small" style={{ marginTop: 16 }}>
        <Space size="large" wrap>
          <Text strong>Legend:</Text>
          <Space>
            <div style={{ width: 16, height: 16, background: RISK_COLORS.safe, border: '1px solid #d9d9d9' }} />
            <Text>Safe (no deadlines)</Text>
          </Space>
          <Space>
            <div style={{ width: 16, height: 16, background: RISK_COLORS.low, border: '1px solid #d9d9d9' }} />
            <Text>Low risk (1 due date)</Text>
          </Space>
          <Space>
            <div style={{ width: 16, height: 16, background: RISK_COLORS.medium, border: '1px solid #d9d9d9' }} />
            <Text>Medium risk (2+ due dates or 200+ students)</Text>
          </Space>
          <Space>
            <div style={{ width: 16, height: 16, background: RISK_COLORS.high, border: '1px solid #d9d9d9' }} />
            <Text>High risk (3+ due dates or 500+ students)</Text>
          </Space>
          <Space>
            <Tag color="red">Due</Tag>
            <Text>Upload due date</Text>
          </Space>
          <Space>
            <Tag color="orange">Late</Tag>
            <Text>Late upload deadline</Text>
          </Space>
          <Space>
            <Tag color="default">Regrade</Tag>
            <Text>Regrade deadline</Text>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default DeployCalendar;
