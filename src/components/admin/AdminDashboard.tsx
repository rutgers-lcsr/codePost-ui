// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  BookOutlined,
  CheckCircleOutlined,
  FolderOutlined,
  InboxOutlined,
  SearchOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Button, Card, Empty, Flex, Input, Tag, Typography } from 'antd';
import { motion } from 'motion/react';

import { Course } from '../../api-client';
import { encodedCourseLink } from '../core/CourseMenu';
import { useAdminDashboardData } from './useAdminDashboardData';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { fetchCourseAssignments, useAssignmentsQuery } from './hooks/useAssignmentsQuery';
import { assignmentKeys } from '../../lib/queryKeys';
import { usePrefetchCourse } from '../../hooks/usePrefetchCourse';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';
import styles from './AdminDashboard.module.scss';

const { Title, Text } = Typography;

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface AdminDashboardProps {
  courses: Course[];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ────────────────────────────────────────────────────────────────────────── */
/* CourseAttention                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/** One line per active course answering "how is grading going?" — submissions waiting in the queue
 *  submissions are the one thing only an admin can resolve. One aggregate request per
 *  course, shared with the course's own pages through the query cache. */
const CourseAttention: React.FC<{ course: Course }> = ({ course }) => {
  const { data: assignments, isPending } = useAssignmentsQuery(course);
  const unclaimed = (assignments ?? []).reduce((sum, a) => sum + (a.submissions_unclaimed_count ?? 0), 0);
  const lineStyle: React.CSSProperties = { fontSize: 12, display: 'block', height: 20, marginTop: 8 };

  if (isPending) return <div style={lineStyle} aria-hidden />;
  if (!assignments?.length) {
    return (
      <Text type="secondary" style={lineStyle}>
        No assignments yet
      </Text>
    );
  }
  if (unclaimed > 0) {
    return (
      <Text strong style={lineStyle}>
        {/* orange-7: 3.9:1, fine for an icon; the words carry the message in default text. */}
        <ClockCircleOutlined /> {unclaimed} submission{unclaimed === 1 ? '' : 's'} in the grading queue
      </Text>
    );
  }
  return (
    <Text type="secondary" style={lineStyle}>
      <CheckCircleOutlined /> Grading queue is empty
    </Text>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Component                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const AdminDashboard: React.FC<AdminDashboardProps> = ({ courses }) => {
  const { stats, activeCourses, archivedCourses } = useAdminDashboardData(courses);
  const prefetchCourse = usePrefetchCourse();
  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  useEffect(() => {
    LOCAL_SETTINGS.defaultCourse.setter(0);
  }, []);

  /* ── Unique periods, sorted newest-first ────────────────────────────── */

  const sortedPeriods = useMemo(() => {
    const periods = new Set<string>();
    for (const c of courses) {
      if (c.period) periods.add(c.period);
    }
    const seasonRank: Record<string, number> = { fall: 3, summer: 2, spring: 1, winter: 0 };
    return [...periods].sort((a, b) => {
      const yearOf = (s: string) => parseInt(s.match(/\b(20\d{2}|19\d{2})\b/)?.[1] ?? '0');
      const seasonOf = (s: string) => {
        const lower = s.toLowerCase();
        for (const [key, rank] of Object.entries(seasonRank)) {
          if (lower.includes(key)) return rank;
        }
        return -1;
      };
      const yearDiff = yearOf(b) - yearOf(a);
      return yearDiff !== 0 ? yearDiff : seasonOf(b) - seasonOf(a);
    });
  }, [courses]);

  const VISIBLE_PERIOD_COUNT = 4;
  const visiblePeriods = showAllPeriods ? sortedPeriods : sortedPeriods.slice(0, VISIBLE_PERIOD_COUNT);
  const hiddenPeriodCount = sortedPeriods.length - VISIBLE_PERIOD_COUNT;

  /* ── Filter courses by search + period ───────────────────────────────── */

  /* Attention first: a course with unclaimed submissions sorts above the rest. Same cached query the
     card's own attention line (and the course's pages) use, so this costs no extra requests. */
  const queryClient = useQueryClient();
  const unclaimedByCourse = useQueries({
    queries: activeCourses.map((course) => ({
      queryKey: assignmentKeys.list(course.id),
      queryFn: () => fetchCourseAssignments(queryClient, course.id),
    })),
    combine: (results) =>
      Object.fromEntries(
        results.map((r, i) => [
          activeCourses[i].id,
          (r.data ?? []).reduce((sum, a) => sum + (a.submissions_unclaimed_count ?? 0), 0),
        ]),
      ) as Record<number, number>,
  });

  const filteredActive = useMemo(() => {
    return activeCourses
      .filter((c) => {
        if (selectedPeriod && c.period !== selectedPeriod) return false;
        if (!searchText) return true;
        const search = searchText.toLowerCase();
        return c.name.toLowerCase().includes(search) || c.period.toLowerCase().includes(search);
      })
      .sort((a, b) => (unclaimedByCourse[b.id] ?? 0) - (unclaimedByCourse[a.id] ?? 0));
  }, [activeCourses, searchText, selectedPeriod, unclaimedByCourse]);

  const filteredArchived = useMemo(() => {
    return archivedCourses.filter((c) => {
      if (selectedPeriod && c.period !== selectedPeriod) return false;
      if (!searchText) return true;
      const search = searchText.toLowerCase();
      return c.name.toLowerCase().includes(search) || c.period.toLowerCase().includes(search);
    });
  }, [archivedCourses, searchText, selectedPeriod]);

  /* ── Empty state ─────────────────────────────────────────────────────── */

  if (courses.length === 0) {
    return (
      <main className={styles.dashboard}>
        <Empty
          image={<InboxOutlined style={{ fontSize: 48, color: '#bbb' }} />}
          description={
            <div>
              <Text strong style={{ fontSize: 16 }}>
                No courses yet
              </Text>
              <br />
              <Text type="secondary">Create your first course to get started.</Text>
            </div>
          }
          style={{ padding: '80px 0' }}
        />
      </main>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    // The same landmarks as the course pages: a main region with one h1 and h2 sections.
    <main className={styles.dashboard}>
      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        {/* No name: the API only knows the email, and a title-cased login is not a name. */}
        <Title level={1} style={{ margin: 0, fontSize: 28 }}>
          {getGreeting()}
        </Title>
        {/* The counts live here once, in a sentence, instead of a row of number tiles. */}
        <Text type="secondary" style={{ fontSize: 15 }}>
          {stats.activeCourses} active course{stats.activeCourses === 1 ? '' : 's'} ·{' '}
          {stats.totalStudents.toLocaleString()} student{stats.totalStudents === 1 ? '' : 's'} ·{' '}
          {stats.totalAssignments.toLocaleString()} assignment{stats.totalAssignments === 1 ? '' : 's'}
          {stats.archivedCourses > 0 && ` · ${stats.archivedCourses} archived`}
        </Text>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      {(courses.length > 5 || sortedPeriods.length > 1) && (
        <Flex vertical gap={10} style={{ marginBottom: 20 }}>
          {courses.length > 5 && (
            <Input
              placeholder="Search courses..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              aria-label="Search courses"
              style={{ maxWidth: 280 }}
            />
          )}
          {sortedPeriods.length > 1 && (
            <Flex gap={6} align="center" wrap="wrap">
              <Tag.CheckableTag checked={selectedPeriod === null} onChange={() => setSelectedPeriod(null)}>
                All
              </Tag.CheckableTag>
              {visiblePeriods.map((period) => (
                <Tag.CheckableTag
                  key={period}
                  checked={selectedPeriod === period}
                  onChange={() => setSelectedPeriod(selectedPeriod === period ? null : period)}
                >
                  {period}
                </Tag.CheckableTag>
              ))}
              {!showAllPeriods && hiddenPeriodCount > 0 && (
                <Button type="link" size="small" onClick={() => setShowAllPeriods(true)}>
                  +{hiddenPeriodCount} older
                </Button>
              )}
            </Flex>
          )}
        </Flex>
      )}

      {/* ── Active courses ──────────────────────────────────────────────── */}
      {filteredActive.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
        >
          <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
            <Title level={2} style={{ margin: 0, fontSize: 16 }}>
              Your Courses
            </Title>
            <Tag>{filteredActive.length}</Tag>
          </Flex>
          <div className={styles.courseGrid}>
            {filteredActive.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08 + i * 0.04, ease: [0.4, 0, 0.2, 1] }}
              >
                <Link
                  to={encodedCourseLink('admin', course, 'assignments/overview')}
                  style={{ textDecoration: 'none' }}
                  onMouseEnter={() => prefetchCourse(course)}
                >
                  <Card size="small" hoverable>
                    <Flex justify="space-between" align="flex-start">
                      <Text strong style={{ fontSize: 15 }}>
                        {course.name}
                      </Text>
                      <Tag>{course.period}</Tag>
                    </Flex>
                    <Flex gap={16} style={{ marginTop: 10 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <BookOutlined /> {course.assignments?.length ?? 0} assignment
                        {(course.assignments?.length ?? 0) === 1 ? '' : 's'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <TeamOutlined /> {course.studentCount ?? 0} student{(course.studentCount ?? 0) === 1 ? '' : 's'}
                      </Text>
                    </Flex>
                    <CourseAttention course={course} />
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Archived courses ────────────────────────────────────────────── */}
      {filteredArchived.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          style={{ marginTop: 24 }}
        >
          <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
            <FolderOutlined style={{ color: '#999' }} />
            <Title level={2} style={{ margin: 0, fontSize: 16 }}>
              Archived
            </Title>
            <Tag>{filteredArchived.length}</Tag>
          </Flex>
          <div className={styles.courseGrid}>
            {filteredArchived.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.18 + i * 0.04, ease: [0.4, 0, 0.2, 1] }}
              >
                <Link
                  to={encodedCourseLink('admin', course, 'assignments/overview')}
                  style={{ textDecoration: 'none' }}
                  onMouseEnter={() => prefetchCourse(course)}
                >
                  <Card size="small" hoverable style={{ opacity: 0.75 }}>
                    <Flex justify="space-between" align="flex-start">
                      <Text strong style={{ fontSize: 15 }}>
                        {course.name}
                      </Text>
                      <Flex gap={4}>
                        <Tag color="default">Archived</Tag>
                        <Tag>{course.period}</Tag>
                      </Flex>
                    </Flex>
                    <Flex gap={16} style={{ marginTop: 10 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <BookOutlined /> {course.assignments?.length ?? 0} assignment
                        {(course.assignments?.length ?? 0) === 1 ? '' : 's'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <TeamOutlined /> {course.studentCount ?? 0} student{(course.studentCount ?? 0) === 1 ? '' : 's'}
                      </Text>
                    </Flex>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── No search results ───────────────────────────────────────────── */}
      {searchText && filteredActive.length === 0 && filteredArchived.length === 0 && (
        <Empty
          image={<SearchOutlined style={{ fontSize: 36, color: '#bbb' }} />}
          description={
            <div>
              <Text strong>No courses found</Text>
              <br />
              <Text type="secondary">Try a different search term.</Text>
            </div>
          }
          style={{ padding: '48px 0' }}
        />
      )}
    </main>
  );
};

export default AdminDashboard;
