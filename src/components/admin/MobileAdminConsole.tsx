// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowLeftOutlined,
  BellOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  RiseOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  WarningFilled,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Collapse,
  DatePicker,
  Empty,
  Flex,
  Input,
  message,
  Progress,
  Segmented,
  Spin,
  Statistic,
  Switch,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { Course, CourseAuditEvent, User } from '../../api-client';
import { assignmentsApi } from '../../api-client/clients';
import { Assignment } from '../../types/common';
import { assignmentKeys } from '../../lib/queryKeys';
import { useAdminDashboardData } from './useAdminDashboardData';
import { useAssignmentsQuery } from './hooks/useAssignmentsQuery';
import { CourseAuditLogService } from '../../services/courseAuditLog';
import { renderRoleSwitcher } from '../core/MobileRoleSwitcher';
import { clickableProps } from '../core/clickable';
import styles from './MobileAdminConsole.module.scss';

const { Title, Text } = Typography;

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface MobileAdminConsoleProps {
  courses: Course[];
  userEmail: string;
  user: User;
  onLogout: () => void;
}

type NavTab = 'home' | 'activity' | 'settings';

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDueDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'No due date';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getGradingProgress(a: Assignment): number {
  const total =
    (a.submissions_finalized_count ?? 0) + (a.submissions_inprogress_count ?? 0) + (a.submissions_unclaimed_count ?? 0);
  if (total === 0) return 0;
  return Math.round(((a.submissions_finalized_count ?? 0) / total) * 100);
}

function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffMin < 1) return `Just now · ${timeStr}`;
  if (diffMin < 60) return `${diffMin}m ago · ${timeStr}`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago · ${timeStr}`;
  const d = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${d} · ${timeStr}`;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* CourseDetail                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

const CourseDetail: React.FC<{ course: Course; onBack: () => void }> = ({ course, onBack }) => {
  const queryClient = useQueryClient();
  const { data: assignments = [], isLoading } = useAssignmentsQuery(course);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [savingField, setSavingField] = useState<string | null>(null);

  const handleUpdateAssignment = useCallback(
    async (assignmentId: number, patch: Record<string, unknown>) => {
      const fieldKey = Object.keys(patch).join(',');
      setSavingField(`${assignmentId}-${fieldKey}`);
      try {
        await assignmentsApi.partialUpdate({ id: assignmentId, patchedAssignment: patch });
        queryClient.invalidateQueries({ queryKey: assignmentKeys.list(course.id) });
      } catch {
        message.error('Could not save changes. Check your connection and try again.');
      } finally {
        setSavingField(null);
      }
    },
    [course.id, queryClient],
  );

  const filteredAssignments = useMemo(() => {
    let list = assignments;
    if (assignmentFilter === 'published') list = list.filter((a) => a.isReleased);
    else if (assignmentFilter === 'draft') list = list.filter((a) => !a.isReleased);
    if (assignmentSearch) {
      const q = assignmentSearch.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    return list;
  }, [assignments, assignmentFilter, assignmentSearch]);

  const gradedCount = assignments.filter((a) => getGradingProgress(a) === 100).length;
  const totalSubmissions = assignments.reduce(
    (sum, a) => sum + (a.submissions_finalized_count ?? 0) + (a.submissions_inprogress_count ?? 0),
    0,
  );
  const totalUnclaimed = assignments.reduce((sum, a) => sum + (a.submissions_unclaimed_count ?? 0), 0);

  const isSaving = (id: number, field: string) => savingField === `${id}-${field}`;

  return (
    <div className={styles.scrollContent}>
      {/* Header */}
      <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Back">
          <ArrowLeftOutlined />
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Title level={4} style={{ margin: 0 }} ellipsis>
            {course.name}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {course.period}
          </Text>
        </div>
        {course.archived && <Tag>Archived</Tag>}
      </Flex>

      {/* Attention banner */}
      {totalUnclaimed > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card
            size="small"
            style={{ marginBottom: 12, background: '#fffbe6', borderColor: '#ffe58f' }}
            styles={{ body: { padding: '8px 12px' } }}
          >
            <Flex align="center" gap={8}>
              <WarningFilled style={{ color: '#faad14', fontSize: 16 }} />
              <Text style={{ fontSize: 13 }}>
                <Text strong>{totalUnclaimed}</Text> unclaimed submission{totalUnclaimed === 1 ? '' : 's'} need graders
                assigned
              </Text>
            </Flex>
          </Card>
        </motion.div>
      )}

      {/* Quick stats */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Flex justify="space-around">
          <Statistic
            title="Students"
            value={course.studentCount ?? 0}
            styles={{ content: { fontSize: 16 } }}
            prefix={<TeamOutlined style={{ marginRight: 2 }} />}
          />
          <Statistic title="Assignments" value={assignments.length} styles={{ content: { fontSize: 16 } }} />
          <Statistic
            title="Graded"
            value={gradedCount}
            suffix={`/${assignments.length}`}
            styles={{
              content: {
                fontSize: 16,
                color: gradedCount === assignments.length && assignments.length > 0 ? '#52c41a' : undefined,
              },
            }}
          />
          <Statistic title="Submissions" value={totalSubmissions} styles={{ content: { fontSize: 16 } }} />
        </Flex>
      </Card>

      {/* Assignment filter + search */}
      <Segmented
        block
        value={assignmentFilter}
        onChange={(val) => setAssignmentFilter(val as 'all' | 'published' | 'draft')}
        options={[
          { label: `All (${assignments.length})`, value: 'all' },
          { label: 'Published', value: 'published' },
          { label: 'Drafts', value: 'draft' },
        ]}
        style={{ marginBottom: 8 }}
      />
      {assignments.length > 4 && (
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search assignments…"
          value={assignmentSearch}
          onChange={(e) => setAssignmentSearch(e.target.value)}
          allowClear
          size="small"
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Assignment list */}
      {isLoading ? (
        <Flex vertical align="center" gap={8} style={{ padding: 40 }}>
          <Spin />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Loading assignments…
          </Text>
        </Flex>
      ) : filteredAssignments.length > 0 ? (
        <Flex vertical gap={10}>
          <AnimatePresence>
            {filteredAssignments.map((a, idx) => {
              const progress = getGradingProgress(a);
              const unclaimed = a.submissions_unclaimed_count ?? 0;
              const hasMean = a.mean !== null && a.mean !== undefined;
              const hasMedian = a.median !== null && a.median !== undefined;

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, delay: idx * 0.025 }}
                >
                  <Collapse
                    size="small"
                    items={[
                      {
                        key: a.id,
                        label: (
                          <div>
                            <Flex justify="space-between" align="center" gap={8}>
                              <Text strong style={{ fontSize: 14 }}>
                                {a.name}
                              </Text>
                              <Tag color={a.isReleased ? 'success' : 'default'}>
                                {a.isReleased ? 'Published' : 'Draft'}
                              </Tag>
                            </Flex>
                            <Flex gap={12} wrap style={{ marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <CalendarOutlined /> {formatDueDate(a.uploadDueDate)}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <EditOutlined /> {a.points} pts
                              </Text>
                              {hasMean && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  <RiseOutlined /> Mean {Number(a.mean).toFixed(1)}
                                </Text>
                              )}
                              {unclaimed > 0 && (
                                <Text type="warning" style={{ fontSize: 12 }}>
                                  <WarningOutlined /> {unclaimed} unclaimed
                                </Text>
                              )}
                            </Flex>
                          </div>
                        ),
                        children: (
                          <Flex vertical gap={16}>
                            {/* Grade stats */}
                            {(hasMean || hasMedian) && (
                              <div>
                                <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                                  <RiseOutlined /> Grade Statistics
                                </Text>
                                <Flex gap={24}>
                                  {hasMean && (
                                    <div>
                                      <Text type="secondary" style={{ fontSize: 11 }}>
                                        Mean
                                      </Text>
                                      <br />
                                      <Text strong>
                                        {Number(a.mean).toFixed(1)} / {a.points}
                                      </Text>
                                    </div>
                                  )}
                                  {hasMedian && (
                                    <div>
                                      <Text type="secondary" style={{ fontSize: 11 }}>
                                        Median
                                      </Text>
                                      <br />
                                      <Text strong>
                                        {Number(a.median).toFixed(1)} / {a.points}
                                      </Text>
                                    </div>
                                  )}
                                </Flex>
                              </div>
                            )}

                            {/* Visibility */}
                            <div>
                              <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                                <EyeOutlined /> Visibility
                              </Text>
                              <Flex vertical gap={8}>
                                <Flex justify="space-between" align="center">
                                  <Text style={{ fontSize: 13 }}>Published</Text>
                                  <Switch
                                    size="small"
                                    checked={!!a.isReleased}
                                    loading={isSaving(a.id, 'isReleased,isVisible')}
                                    onChange={(checked) =>
                                      handleUpdateAssignment(a.id, { isReleased: checked, isVisible: checked })
                                    }
                                  />
                                </Flex>
                                <Flex justify="space-between" align="center">
                                  <Text style={{ fontSize: 13 }}>Visible to students</Text>
                                  <Switch
                                    size="small"
                                    checked={!!a.isVisible}
                                    loading={isSaving(a.id, 'isVisible')}
                                    onChange={(checked) => handleUpdateAssignment(a.id, { isVisible: checked })}
                                  />
                                </Flex>
                              </Flex>
                            </div>

                            {/* Grades & Feedback */}
                            <div>
                              <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                                <TrophyOutlined /> Grades & Feedback
                              </Text>
                              <Flex vertical gap={8}>
                                <Flex justify="space-between" align="center">
                                  <Text style={{ fontSize: 13 }}>Release grades</Text>
                                  <Switch
                                    size="small"
                                    checked={!!a.feedbackReleased}
                                    loading={isSaving(a.id, 'feedbackReleased')}
                                    onChange={(checked) => handleUpdateAssignment(a.id, { feedbackReleased: checked })}
                                  />
                                </Flex>
                                <Flex justify="space-between" align="center">
                                  <Text style={{ fontSize: 13 }}>Hide grades from students</Text>
                                  <Switch
                                    size="small"
                                    checked={!!a.hideGrades}
                                    loading={isSaving(a.id, 'hideGrades')}
                                    onChange={(checked) => handleUpdateAssignment(a.id, { hideGrades: checked })}
                                  />
                                </Flex>
                                <Flex justify="space-between" align="center">
                                  <Text style={{ fontSize: 13 }}>Live feedback mode</Text>
                                  <Switch
                                    size="small"
                                    checked={!!a.liveFeedbackMode}
                                    loading={isSaving(a.id, 'liveFeedbackMode')}
                                    onChange={(checked) => handleUpdateAssignment(a.id, { liveFeedbackMode: checked })}
                                  />
                                </Flex>
                              </Flex>
                            </div>

                            {/* Due Date */}
                            <div>
                              <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                                <ClockCircleOutlined /> Due Date
                              </Text>
                              <DatePicker
                                showTime
                                size="small"
                                style={{ width: '100%' }}
                                value={a.uploadDueDate ? dayjs(a.uploadDueDate) : null}
                                onChange={(date) => {
                                  handleUpdateAssignment(a.id, { uploadDueDate: date ? date.toISOString() : null });
                                }}
                                placeholder="Set due date"
                              />
                            </div>

                            {/* Submissions */}
                            <div>
                              <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                                <InboxOutlined /> Submissions
                              </Text>
                              <Flex vertical gap={8}>
                                <Flex justify="space-between" align="center">
                                  <Text style={{ fontSize: 13 }}>Allow student uploads</Text>
                                  <Switch
                                    size="small"
                                    checked={!!a.allowStudentUpload}
                                    loading={isSaving(a.id, 'allowStudentUpload')}
                                    onChange={(checked) =>
                                      handleUpdateAssignment(a.id, { allowStudentUpload: checked })
                                    }
                                  />
                                </Flex>
                                <Flex justify="space-between" align="center">
                                  <Text style={{ fontSize: 13 }}>Allow late uploads</Text>
                                  <Switch
                                    size="small"
                                    checked={!!a.allowLateUploads}
                                    loading={isSaving(a.id, 'allowLateUploads')}
                                    onChange={(checked) => handleUpdateAssignment(a.id, { allowLateUploads: checked })}
                                  />
                                </Flex>
                                <Flex justify="space-between" align="center">
                                  <Text style={{ fontSize: 13 }}>Allow regrade requests</Text>
                                  <Switch
                                    size="small"
                                    checked={!!a.allowRegradeRequests}
                                    loading={isSaving(a.id, 'allowRegradeRequests')}
                                    onChange={(checked) =>
                                      handleUpdateAssignment(a.id, { allowRegradeRequests: checked })
                                    }
                                  />
                                </Flex>
                              </Flex>
                            </div>
                          </Flex>
                        ),
                      },
                    ]}
                  />

                  {/* Grading progress bar below collapse */}
                  <Card size="small" style={{ marginTop: 3 }} styles={{ body: { padding: '6px 12px' } }}>
                    <Flex justify="space-between" style={{ marginBottom: 2 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Grading progress
                      </Text>
                      <Flex align="center" gap={4}>
                        {progress === 100 && <CheckCircleFilled style={{ color: '#52c41a', fontSize: 11 }} />}
                        <Text strong style={{ fontSize: 11 }}>
                          {progress}%
                        </Text>
                      </Flex>
                    </Flex>
                    <Progress
                      percent={progress}
                      showInfo={false}
                      size="small"
                      status={progress === 100 ? 'success' : 'active'}
                    />
                    <Flex gap={12} style={{ marginTop: 3 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {a.submissions_finalized_count ?? 0} finalized
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {a.submissions_inprogress_count ?? 0} in progress
                      </Text>
                    </Flex>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </Flex>
      ) : (
        <Empty
          description={
            assignmentSearch
              ? 'No assignments match your search'
              : assignmentFilter === 'all'
                ? 'No assignments yet'
                : `No ${assignmentFilter} assignments`
          }
        />
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* ActivityFeed                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/** "All courses" only polls this many courses to limit mobile requests */
const MAX_FEED_COURSES = 5;

const ActivityFeed: React.FC<{ courses: Course[] }> = ({ courses }) => {
  const [events, setEvents] = useState<(CourseAuditEvent & { courseName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [activitySearch, setActivitySearch] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);

  const activeCourses = useMemo(() => courses.filter((c) => !c.archived), [courses]);

  const uniqueEventTypes = useMemo(() => {
    const types = new Set<string>();
    for (const e of events) if (e.eventType) types.add(e.eventType);
    return [...types].sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (selectedEventType) filtered = filtered.filter((e) => e.eventType === selectedEventType);
    if (activitySearch) {
      const q = activitySearch.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          formatEventType(e.eventType).toLowerCase().includes(q) ||
          e.userEmail?.toLowerCase().includes(q) ||
          e.assignmentName?.toLowerCase().includes(q) ||
          e.courseName?.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [events, activitySearch, selectedEventType]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchEvents = async () => {
      const targets = selectedCourseId
        ? activeCourses.filter((c) => c.id === selectedCourseId)
        : activeCourses.slice(0, MAX_FEED_COURSES);

      const perCourse = await Promise.all(
        targets.map(async (course) => {
          try {
            const result = await CourseAuditLogService.list(course.id, { pageSize: 10 });
            return (result.results ?? []).map((e) => ({ ...e, courseName: course.name }));
          } catch {
            return [];
          }
        }),
      );
      const allEvents = perCourse.flat();

      if (!cancelled) {
        allEvents.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        setEvents(allEvents.slice(0, 40));
        setLoading(false);
      }
    };

    fetchEvents();
    return () => {
      cancelled = true;
    };
  }, [activeCourses, selectedCourseId]);

  return (
    <div className={styles.scrollContent}>
      <Title level={4} style={{ marginBottom: 4 }}>
        Activity
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Recent events across your courses
        {selectedCourseId === null && activeCourses.length > MAX_FEED_COURSES
          ? ` (showing the first ${MAX_FEED_COURSES} — pick a course below to see the rest)`
          : ''}
      </Text>

      {/* Course filter */}
      {activeCourses.length > 1 && (
        <Flex wrap gap={6} style={{ marginBottom: 12 }}>
          <Tag
            color={selectedCourseId === null ? 'blue' : undefined}
            style={{ cursor: 'pointer' }}
            {...clickableProps(() => setSelectedCourseId(null))}
          >
            All courses
          </Tag>
          {activeCourses.map((c) => (
            <Tag
              key={c.id}
              color={selectedCourseId === c.id ? 'blue' : undefined}
              style={{ cursor: 'pointer' }}
              {...clickableProps(() => setSelectedCourseId(selectedCourseId === c.id ? null : c.id))}
            >
              {c.name}
            </Tag>
          ))}
        </Flex>
      )}

      <Input
        prefix={<SearchOutlined />}
        placeholder="Search activity…"
        value={activitySearch}
        onChange={(e) => setActivitySearch(e.target.value)}
        allowClear
        size="middle"
        style={{ marginBottom: uniqueEventTypes.length > 1 ? 10 : 16 }}
      />

      {uniqueEventTypes.length > 1 && (
        <Flex wrap gap={6} style={{ marginBottom: 16 }}>
          <Tag
            color={selectedEventType === null ? 'purple' : undefined}
            style={{ cursor: 'pointer' }}
            {...clickableProps(() => setSelectedEventType(null))}
          >
            All events
          </Tag>
          {uniqueEventTypes.map((type) => (
            <Tag
              key={type}
              color={selectedEventType === type ? 'purple' : undefined}
              style={{ cursor: 'pointer' }}
              {...clickableProps(() => setSelectedEventType(selectedEventType === type ? null : type))}
            >
              {formatEventType(type)}
            </Tag>
          ))}
        </Flex>
      )}

      {loading ? (
        <Flex vertical align="center" gap={8} style={{ padding: 48 }}>
          <Spin />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Loading activity…
          </Text>
        </Flex>
      ) : filteredEvents.length > 0 ? (
        <Timeline
          items={filteredEvents.map((event) => ({
            children: (
              <div>
                <Flex justify="space-between" align="center">
                  <Text strong style={{ fontSize: 13 }}>
                    {formatEventType(event.eventType)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {timeAgo(event.created)}
                  </Text>
                </Flex>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {event.userEmail}
                  {event.assignmentName && ` · ${event.assignmentName}`}
                </Text>
                {event.courseName && (
                  <>
                    <br />
                    <Tag style={{ marginTop: 4, fontSize: 11 }}>{event.courseName}</Tag>
                  </>
                )}
              </div>
            ),
          }))}
        />
      ) : (
        <Empty
          image={<BellOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />}
          description={
            <div>
              <Text strong>{activitySearch ? 'No matching events' : 'No recent activity'}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {activitySearch ? 'Try a different search term.' : 'Events appear here as users interact with courses.'}
              </Text>
            </div>
          }
        />
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Main Component                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const MobileAdminConsole: React.FC<MobileAdminConsoleProps> = ({ courses, userEmail, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const { stats, activeCourses, archivedCourses } = useAdminDashboardData(courses);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;

  // Only greet by name when the email local part looks like a name (netIDs like "mk1800" read oddly)
  const localPart = userEmail.split('@')[0].split('.')[0];
  const displayName = /^[a-z]+$/i.test(localPart) ? localPart.charAt(0).toUpperCase() + localPart.slice(1) : null;

  const uniquePeriods = useMemo(() => {
    const periods = new Set<string>();
    for (const c of courses) if (c.period) periods.add(c.period);
    return [...periods].sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const filteredActive = useMemo(() => {
    return activeCourses.filter((c) => {
      if (selectedPeriod && c.period !== selectedPeriod) return false;
      if (!searchText) return true;
      const q = searchText.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.period.toLowerCase().includes(q);
    });
  }, [activeCourses, searchText, selectedPeriod]);

  const filteredArchived = useMemo(() => {
    return archivedCourses.filter((c) => {
      if (selectedPeriod && c.period !== selectedPeriod) return false;
      if (!searchText) return true;
      const q = searchText.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.period.toLowerCase().includes(q);
    });
  }, [archivedCourses, searchText, selectedPeriod]);

  /* ── Home tab ────────────────────────────────────────────────────────── */

  const renderHome = () => {
    if (courses.length === 0) {
      return (
        <div className={styles.scrollContent}>
          <Empty
            image={<InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
            description={
              <div>
                <Text strong>No courses yet</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Create your first course from a desktop browser to get started.
                </Text>
              </div>
            }
          />
        </div>
      );
    }

    if (selectedCourse) {
      return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourseId(null)} />;
    }

    return (
      <div className={styles.scrollContent}>
        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <Tag color="purple" style={{ marginBottom: 8 }}>
            Admin
          </Tag>
          <Title level={3} style={{ margin: 0 }}>
            {getGreeting()}
            {displayName ? `, ${displayName}` : ''}
          </Title>
          <Text type="secondary">
            {stats.activeCourses} active course{stats.activeCourses === 1 ? '' : 's'} · {stats.totalStudents} students
          </Text>
        </div>

        {/* Summary stats */}
        <Card size="small" style={{ marginBottom: 20 }}>
          <Flex justify="space-around">
            <Statistic
              title="Active"
              value={stats.activeCourses}
              styles={{ content: { fontSize: 20, color: '#722ed1' } }}
            />
            <Statistic title="Students" value={stats.totalStudents} styles={{ content: { fontSize: 20 } }} />
            <Statistic title="Assignments" value={stats.totalAssignments} styles={{ content: { fontSize: 20 } }} />
            <Statistic title="Archived" value={stats.archivedCourses} styles={{ content: { fontSize: 20 } }} />
          </Flex>
        </Card>

        {/* Search + period filter */}
        {(courses.length > 3 || uniquePeriods.length > 1) && (
          <div style={{ marginBottom: 16 }}>
            {courses.length > 3 && (
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search courses…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                size="middle"
                style={{ marginBottom: uniquePeriods.length > 1 ? 10 : 0 }}
              />
            )}
            {uniquePeriods.length > 1 && (
              <Flex wrap gap={6}>
                {uniquePeriods.map((period) => (
                  <Tag
                    key={period}
                    color={selectedPeriod === period ? 'purple' : undefined}
                    style={{ cursor: 'pointer' }}
                    {...clickableProps(() => setSelectedPeriod(selectedPeriod === period ? null : period))}
                  >
                    {period}
                  </Tag>
                ))}
              </Flex>
            )}
          </div>
        )}

        {/* Active courses */}
        {filteredActive.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
              <BookOutlined style={{ color: '#722ed1' }} />
              <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Courses
              </Text>
              <Badge count={filteredActive.length} size="small" color="purple" />
            </Flex>

            <Flex vertical gap={10}>
              <AnimatePresence>
                {filteredActive.map((course, idx) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, delay: idx * 0.03 }}
                  >
                    <Card
                      size="small"
                      hoverable
                      {...clickableProps(() => setSelectedCourseId(course.id))}
                      className={styles.courseCard}
                    >
                      <Flex justify="space-between" align="flex-start" gap={8}>
                        <Text strong style={{ flex: 1, minWidth: 0 }}>
                          {course.name}
                        </Text>
                        <Tag style={{ flexShrink: 0 }}>{course.period}</Tag>
                      </Flex>
                      <Flex gap={16} style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <TeamOutlined /> {course.studentCount ?? 0} students
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <BookOutlined /> {course.assignments?.length ?? 0} assignments
                        </Text>
                      </Flex>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Flex>
          </div>
        )}

        {/* Archived courses */}
        {filteredArchived.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <Card
              size="small"
              style={{ cursor: 'pointer' }}
              aria-expanded={showArchived}
              {...clickableProps(() => setShowArchived((v) => !v))}
            >
              <Flex justify="space-between" align="center">
                <Flex align="center" gap={8}>
                  <FolderOutlined />
                  <Text type="secondary">Archived ({filteredArchived.length})</Text>
                </Flex>
                <Text
                  type="secondary"
                  style={{ transform: showArchived ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  ›
                </Text>
              </Flex>
            </Card>

            <AnimatePresence>
              {showArchived && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: 'hidden' }}
                >
                  <Flex vertical gap={8} style={{ marginTop: 8 }}>
                    {filteredArchived.map((course) => (
                      <Card
                        key={course.id}
                        size="small"
                        hoverable
                        {...clickableProps(() => setSelectedCourseId(course.id))}
                      >
                        <Flex justify="space-between" align="center">
                          <Text type="secondary">{course.name}</Text>
                          <Tag>Archived</Tag>
                        </Flex>
                        <Flex gap={16} style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <TeamOutlined /> {course.studentCount ?? 0}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {course.period}
                          </Text>
                        </Flex>
                      </Card>
                    ))}
                  </Flex>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {searchText && filteredActive.length === 0 && filteredArchived.length === 0 && (
          <Empty image={<SearchOutlined style={{ fontSize: 36, color: '#d9d9d9' }} />} description="No courses found" />
        )}
      </div>
    );
  };

  /* ── Settings tab ────────────────────────────────────────────────────── */

  const renderSettings = () => (
    <div className={styles.scrollContent}>
      <Title level={4} style={{ marginBottom: 16 }}>
        Settings
      </Title>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Flex gap={12} align="center">
          <Avatar size={44} style={{ background: '#722ed1', flexShrink: 0 }}>
            {(displayName ?? userEmail).charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong>{displayName ?? localPart}</Text>
            <br />
            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {userEmail}
            </Text>
            <br />
            <Tag color="purple" style={{ marginTop: 4 }}>
              Course Administrator
            </Tag>
          </div>
        </Flex>
      </Card>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Flex vertical gap={8}>
          <Flex justify="space-between">
            <Text type="secondary">Email</Text>
            <Text>{userEmail}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text type="secondary">Active Courses</Text>
            <Text>{stats.activeCourses}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text type="secondary">Total Students</Text>
            <Text>{stats.totalStudents}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text type="secondary">Total Assignments</Text>
            <Text>{stats.totalAssignments}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text type="secondary">Archived Courses</Text>
            <Text>{stats.archivedCourses}</Text>
          </Flex>
        </Flex>
      </Card>

      {renderRoleSwitcher(user, 'admin')}

      <Button danger block icon={<LogoutOutlined />} onClick={onLogout} style={{ marginBottom: 16 }}>
        Log Out
      </Button>

      <Text type="secondary" style={{ fontSize: 12 }}>
        For full account management — password changes, notification preferences, rubric editing, and bulk roster
        changes — use the desktop version.
      </Text>
    </div>
  );

  /* ── Shell ─────────────────────────────────────────────────────────────── */

  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.mobileShell}>
        <main className={styles.main}>
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.18 }}
                className={styles.tabPanel}
              >
                {renderHome()}
              </motion.div>
            )}
            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className={styles.tabPanel}
              >
                <ActivityFeed courses={courses} />
              </motion.div>
            )}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className={styles.tabPanel}
              >
                {renderSettings()}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <nav className={styles.bottomNav} aria-label="Main navigation">
          <button
            type="button"
            className={styles.navItem}
            data-active={activeTab === 'home' ? 'true' : 'false'}
            aria-current={activeTab === 'home' ? 'page' : undefined}
            onClick={() => {
              setActiveTab('home');
              setSelectedCourseId(null);
            }}
            aria-label="Home"
          >
            <HomeOutlined className={styles.navIcon} />
            <span className={styles.navLabel}>Home</span>
          </button>
          <button
            type="button"
            className={styles.navItem}
            data-active={activeTab === 'activity' ? 'true' : 'false'}
            aria-current={activeTab === 'activity' ? 'page' : undefined}
            onClick={() => setActiveTab('activity')}
            aria-label="Activity"
          >
            <BellOutlined className={styles.navIcon} />
            <span className={styles.navLabel}>Activity</span>
          </button>
          <button
            type="button"
            className={styles.navItem}
            data-active={activeTab === 'settings' ? 'true' : 'false'}
            aria-current={activeTab === 'settings' ? 'page' : undefined}
            onClick={() => setActiveTab('settings')}
            aria-label="Settings"
          >
            <SettingOutlined className={styles.navIcon} />
            <span className={styles.navLabel}>Settings</span>
          </button>
        </nav>
      </div>
    </MotionConfig>
  );
};

export default MobileAdminConsole;
