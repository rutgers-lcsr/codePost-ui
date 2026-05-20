// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOutlined, FolderOutlined, InboxOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Flex, Input, Statistic, Tag, Typography } from 'antd';
import { motion } from 'motion/react';

import { Course } from '../../api-client';
import { encodedCourseLink } from '../core/CourseMenu';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';
import styles from './GraderDashboard.module.scss';

const { Title, Text } = Typography;

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface GraderDashboardProps {
  courses: Course[];
  userEmail: string;
  defaultPanel: (course: Course) => string;
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
/* Component                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const VISIBLE_PERIOD_COUNT = 4;

const GraderDashboard: React.FC<GraderDashboardProps> = ({ courses, userEmail, defaultPanel }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  useEffect(() => {
    LOCAL_SETTINGS.defaultCourse.setter(0);
  }, []);

  const firstName = userEmail.split('@')[0].split('.')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

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

  const visiblePeriods = showAllPeriods ? sortedPeriods : sortedPeriods.slice(0, VISIBLE_PERIOD_COUNT);
  const hiddenPeriodCount = sortedPeriods.length - VISIBLE_PERIOD_COUNT;

  /* ── Organize courses ────────────────────────────────────────────────── */

  const { activeCourses, archivedCourses, totalAssignments } = useMemo(() => {
    const sortCourses = (a: Course, b: Course) => {
      const nameCompare = a.name.localeCompare(b.name);
      return nameCompare !== 0 ? nameCompare : a.period.localeCompare(b.period);
    };

    const active = courses.filter((c) => !c.archived).sort(sortCourses);
    const archived = courses.filter((c) => c.archived).sort(sortCourses);

    let totalAssignments = 0;
    for (const course of active) {
      totalAssignments += course.assignments?.length ?? 0;
    }

    return { activeCourses: active, archivedCourses: archived, totalAssignments };
  }, [courses]);

  /* ── Filter courses by search + period ───────────────────────────────── */

  const filteredActive = useMemo(() => {
    return activeCourses.filter((c) => {
      if (selectedPeriod && c.period !== selectedPeriod) return false;
      if (!searchText) return true;
      const search = searchText.toLowerCase();
      return c.name.toLowerCase().includes(search) || c.period.toLowerCase().includes(search);
    });
  }, [activeCourses, searchText, selectedPeriod]);

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
      <div className={styles.dashboard}>
        <Empty
          image={<InboxOutlined style={{ fontSize: 48, color: '#bbb' }} />}
          description={
            <div>
              <Text strong style={{ fontSize: 16 }}>
                No courses yet
              </Text>
              <br />
              <Text type="secondary">You haven't been added as a grader to any courses yet.</Text>
            </div>
          }
          style={{ padding: '80px 0' }}
        />
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className={styles.dashboard}>
      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <Title level={2} style={{ margin: 0, fontSize: 28 }}>
          {getGreeting()}, {displayName}
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          {activeCourses.length} active course{activeCourses.length === 1 ? '' : 's'}
          {archivedCourses.length > 0 && `, ${archivedCourses.length} archived`}
        </Text>
      </div>

      {/* ── Summary stats ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card style={{ marginBottom: 32, padding: '8px 0' }}>
          <Flex justify="space-around" wrap="wrap" gap={24}>
            <Statistic title="Active courses" value={activeCourses.length} valueStyle={{ color: '#198665' }} />
            <Statistic title="Assignments" value={totalAssignments} valueStyle={{ color: '#1677ff' }} />
            <Statistic title="Archived" value={archivedCourses.length} />
          </Flex>
        </Card>
      </motion.div>

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
            <Title level={5} style={{ margin: 0 }}>
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
                <Link to={encodedCourseLink('grader', course, defaultPanel(course))} style={{ textDecoration: 'none' }}>
                  <Card size="small" hoverable>
                    <Flex justify="space-between" align="flex-start">
                      <Text strong style={{ fontSize: 15 }}>
                        {course.name}
                      </Text>
                      <Tag>{course.period}</Tag>
                    </Flex>
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                      <BookOutlined /> {course.assignments?.length ?? 0} assignment
                      {(course.assignments?.length ?? 0) === 1 ? '' : 's'}
                    </Text>
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
            <Title level={5} style={{ margin: 0 }}>
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
                <Link to={encodedCourseLink('grader', course, defaultPanel(course))} style={{ textDecoration: 'none' }}>
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
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                      <BookOutlined /> {course.assignments?.length ?? 0} assignment
                      {(course.assignments?.length ?? 0) === 1 ? '' : 's'}
                    </Text>
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
    </div>
  );
};

export default GraderDashboard;
