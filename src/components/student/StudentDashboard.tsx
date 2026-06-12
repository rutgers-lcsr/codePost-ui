// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarOutlined,
  CheckCircleFilled,
  EyeOutlined,
  FireOutlined,
  InboxOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Empty, Flex, Progress, Spin, Statistic, Tag, Typography } from 'antd';
import { AnimatePresence, motion } from 'motion/react';

import { Course } from '../../api-client';
import { Assignment } from '../../types/common';
import { SubmissionStatus } from './submissionStatus';
import { encodedCourseLink } from '../core/CourseMenu';
import { useStudentData, getSubmissionStatusFor } from './useStudentData';
import styles from './StudentDashboard.module.scss';

const { Title, Text } = Typography;

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface StudentDashboardProps {
  courses: Course[];
  userEmail: string;
  studentSections: number[];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function getRelativeDueDate(dueDate: string): { text: string; urgent: boolean } {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, urgent: true };
  if (diffDays === 0) return { text: 'Due today', urgent: true };
  if (diffDays === 1) return { text: 'Due tomorrow', urgent: true };
  if (diffDays <= 3) return { text: `Due in ${diffDays} days`, urgent: true };
  if (diffDays <= 7) return { text: `Due in ${diffDays} days`, urgent: false };
  return { text: '', urgent: false };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Component                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const StudentDashboard: React.FC<StudentDashboardProps> = ({ courses, userEmail, studentSections }) => {
  const {
    submissions,
    viewsBySubmission,
    isLoadingAssignments,
    isLoadingSubmissions,
    getGroupedSections,
    getProgress,
  } = useStudentData(courses, userEmail, studentSections);

  const isLoading = isLoadingAssignments || isLoadingSubmissions;

  /* ── Period filter ───────────────────────────────────────────────────── */

  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showAllPeriods, setShowAllPeriods] = useState(false);

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

  const displayCourses = useMemo(
    () => (selectedPeriod ? courses.filter((c) => c.period === selectedPeriod) : courses),
    [courses, selectedPeriod],
  );

  /* ── Aggregate cross-course data ─────────────────────────────────────── */

  const { dueThisWeek, pendingFeedback, totalDueToday, totalPendingFeedback, totalCompleted, totalAssignments } =
    useMemo(() => {
      const dueThisWeek: Array<{ assignment: Assignment; course: Course }> = [];
      const pendingFeedback: Array<{ assignment: Assignment; course: Course }> = [];
      let totalDueToday = 0;
      let totalPendingFeedback = 0;
      let totalCompleted = 0;
      let totalAssignments = 0;

      for (const course of displayCourses) {
        const sections = getGroupedSections(course.id);
        if (!sections) continue;

        totalAssignments += sections.all.filter(
          (a) =>
            getSubmissionStatusFor(a, submissions[a.id]?.[0], viewsBySubmission) !== SubmissionStatus.NOT_PUBLISHED,
        ).length;
        totalCompleted += sections.completed.length;
        totalDueToday += sections.dueToday.length;

        for (const a of [...sections.overdue, ...sections.dueToday, ...sections.dueSoon]) {
          dueThisWeek.push({ assignment: a, course });
        }

        for (const a of sections.all) {
          const sub = submissions[a.id]?.[0];
          const status = getSubmissionStatusFor(a, sub, viewsBySubmission);
          if (status === SubmissionStatus.PENDING) {
            pendingFeedback.push({ assignment: a, course });
            totalPendingFeedback++;
          }
        }
      }

      dueThisWeek.sort((a, b) => {
        const dateA = a.assignment.uploadDueDate ? new Date(a.assignment.uploadDueDate).getTime() : Infinity;
        const dateB = b.assignment.uploadDueDate ? new Date(b.assignment.uploadDueDate).getTime() : Infinity;
        return dateA - dateB;
      });

      return { dueThisWeek, pendingFeedback, totalDueToday, totalPendingFeedback, totalCompleted, totalAssignments };
    }, [displayCourses, getGroupedSections, submissions, viewsBySubmission]);

  /* ── Next-due per course ─────────────────────────────────────────────── */

  const courseNextDue = useMemo(() => {
    const map: Record<number, { name: string; dueText: string } | null> = {};
    for (const course of displayCourses) {
      const sections = getGroupedSections(course.id);
      if (!sections) {
        map[course.id] = null;
        continue;
      }
      const next = [...sections.overdue, ...sections.dueToday, ...sections.dueSoon, ...sections.upcoming][0];
      if (next?.uploadDueDate) {
        const rel = getRelativeDueDate(next.uploadDueDate);
        map[course.id] = { name: next.name, dueText: rel.text || 'Upcoming' };
      } else if (next) {
        map[course.id] = { name: next.name, dueText: 'Upcoming' };
      } else {
        map[course.id] = null;
      }
    }
    return map;
  }, [displayCourses, getGroupedSections]);

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
              <Text type="secondary">
                You haven't been enrolled in any courses yet. Check back later or contact your instructor.
              </Text>
            </div>
          }
          style={{ padding: '80px 0' }}
        />
      </div>
    );
  }

  const firstName = userEmail.split('@')[0].split('.')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className={styles.dashboard}>
      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: 36 }}>
        <Title level={2} style={{ margin: 0, fontSize: 28 }}>
          {getGreeting()}, {displayName}
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          {isLoading
            ? 'Loading your assignments…'
            : `${courses.filter((c) => !c.archived).length} active course${courses.filter((c) => !c.archived).length === 1 ? '' : 's'}`}
        </Text>
      </header>

      {/* ── Summary stats ───────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card style={{ marginBottom: 32, padding: '8px 0' }}>
            <Flex justify="space-evenly" wrap="wrap" gap={24} style={{ maxWidth: 600, margin: '0 auto' }}>
              <Statistic
                title="Due today"
                value={totalDueToday}
                valueStyle={{ color: totalDueToday > 0 ? '#ff4d4f' : undefined }}
              />
              <Statistic
                title="New feedback"
                value={totalPendingFeedback}
                valueStyle={{ color: totalPendingFeedback > 0 ? '#1677ff' : undefined }}
                suffix={totalPendingFeedback > 0 ? <Badge status="processing" /> : undefined}
              />
              <Statistic title="Completed" value={totalCompleted} valueStyle={{ color: '#198665' }} />
              <Statistic
                title="Overall"
                value={totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0}
                suffix="%"
              />
            </Flex>
          </Card>
        </motion.div>
      )}

      {/* ── Period filter ───────────────────────────────────────────────── */}
      {!isLoading && sortedPeriods.length > 1 && (
        <Flex gap={6} align="center" wrap="wrap" style={{ marginBottom: 24 }}>
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

      {/* ── Loading state ───────────────────────────────────────────────── */}
      {isLoading && (
        <Flex justify="center" style={{ padding: 64 }}>
          <Spin tip="Loading your assignments…" size="large" />
        </Flex>
      )}

      {/* ── Due this week ───────────────────────────────────────────────── */}
      {!isLoading && dueThisWeek.length > 0 && (
        <motion.section
          aria-label={`Due this week — ${dueThisWeek.length} assignments`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
          style={{ marginBottom: 24 }}
        >
          <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
            <FireOutlined style={{ color: '#ff4d4f' }} />
            <Title level={5} style={{ margin: 0 }}>
              Due This Week
            </Title>
            <Badge count={dueThisWeek.length} size="small" />
          </Flex>

          <Flex vertical gap={8}>
            <AnimatePresence>
              {dueThisWeek.map(({ assignment, course }) => {
                const sub = submissions[assignment.id]?.[0];
                const status = getSubmissionStatusFor(assignment, sub, viewsBySubmission);
                const dueRel = assignment.uploadDueDate
                  ? getRelativeDueDate(assignment.uploadDueDate)
                  : { text: '', urgent: false };
                const link = encodedCourseLink('student', course);

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Link to={link} style={{ textDecoration: 'none' }}>
                      <Card size="small" hoverable>
                        <Flex justify="space-between" align="center">
                          <div>
                            <Text strong>{assignment.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {course.name}
                            </Text>
                          </div>
                          <Flex align="center" gap={8}>
                            {dueRel.text && (
                              <Tag color={dueRel.urgent ? 'error' : 'default'}>
                                <CalendarOutlined /> {dueRel.text}
                              </Tag>
                            )}
                            {status === SubmissionStatus.NO_SUBMISSION && assignment.allowStudentUpload ? (
                              <Tag color="blue">
                                <UploadOutlined /> Upload
                              </Tag>
                            ) : status === SubmissionStatus.NOT_REVIEWED ? (
                              <Tag color="processing">
                                <EyeOutlined /> View
                              </Tag>
                            ) : (
                              <Tag color="default">Open</Tag>
                            )}
                          </Flex>
                        </Flex>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Flex>
        </motion.section>
      )}

      {/* ── Pending feedback ────────────────────────────────────────────── */}
      {!isLoading && pendingFeedback.length > 0 && (
        <motion.section
          aria-label={`New feedback — ${pendingFeedback.length} assignments`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          style={{ marginBottom: 24 }}
        >
          <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
            <EyeOutlined style={{ color: '#1677ff' }} />
            <Title level={5} style={{ margin: 0 }}>
              New Feedback
            </Title>
            <Badge count={pendingFeedback.length} size="small" color="blue" />
          </Flex>

          <Flex vertical gap={8}>
            <AnimatePresence>
              {pendingFeedback.map(({ assignment, course }) => {
                const link = encodedCourseLink('student', course);
                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Link to={link} style={{ textDecoration: 'none' }}>
                      <Card size="small" hoverable>
                        <Flex justify="space-between" align="center">
                          <div>
                            <Text strong>{assignment.name}</Text>
                            <Badge status="processing" style={{ marginLeft: 6 }} />
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {course.name}
                            </Text>
                          </div>
                          <Tag color="warning">
                            <EyeOutlined /> View Feedback
                          </Tag>
                        </Flex>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Flex>
        </motion.section>
      )}

      {/* ── Course cards ────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          <Title level={5} style={{ marginBottom: 12 }}>
            Your Courses
          </Title>
          <div className={styles.courseGrid}>
            {displayCourses
              .filter((c) => !c.archived)
              .map((course) => {
                const progress = getProgress(course.id);
                const next = courseNextDue[course.id];
                const link = encodedCourseLink('student', course);

                return (
                  <Link key={course.id} to={link} style={{ textDecoration: 'none' }}>
                    <Card size="small" hoverable>
                      <Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 15 }}>
                          {course.name}
                        </Text>
                        <Tag>{course.period}</Tag>
                      </Flex>

                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {progress.total} assignment{progress.total === 1 ? '' : 's'}
                      </Text>

                      {/* Progress */}
                      {progress.total > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <Flex justify="space-between" style={{ marginBottom: 2 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {Math.round(progress.percent)}% complete
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {progress.completed}/{progress.total}
                            </Text>
                          </Flex>
                          <Progress
                            percent={progress.percent}
                            showInfo={false}
                            size="small"
                            status={progress.percent === 100 ? 'success' : 'active'}
                          />
                        </div>
                      )}

                      {/* Next due */}
                      {next && (
                        <Flex gap={6} align="center" style={{ marginTop: 8 }}>
                          <CalendarOutlined style={{ fontSize: 11, color: '#999' }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {next.name}
                          </Text>
                          <Tag color="default" style={{ fontSize: 11 }}>
                            {next.dueText}
                          </Tag>
                        </Flex>
                      )}

                      {/* Fully completed badge */}
                      {progress.total > 0 && progress.percent === 100 && (
                        <Tag color="success" icon={<CheckCircleFilled />} style={{ marginTop: 8 }}>
                          All done!
                        </Tag>
                      )}
                    </Card>
                  </Link>
                );
              })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentDashboard;
