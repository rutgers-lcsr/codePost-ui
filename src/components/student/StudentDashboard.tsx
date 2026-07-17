// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarOutlined,
  CheckCircleFilled,
  ExclamationCircleOutlined,
  EyeOutlined,
  FireOutlined,
  FormOutlined,
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
import { useAllAvailableQuizzes } from './quizzes/queries';
import { quizAction, quizActionLabel } from './quizzes/quizStatus';
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

/** Max rows shown per needs-attention rail section before "Show all". */
const RAIL_CAP = 5;

/* ────────────────────────────────────────────────────────────────────────── */
/* Component                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const StudentDashboard: React.FC<StudentDashboardProps> = ({ courses, userEmail, studentSections }) => {
  const {
    submissions,
    viewsBySubmission,
    isLoadingAssignments,
    isLoadingSubmissions,
    isCourseLoading,
    getGroupedSections,
    getProgress,
  } = useStudentData(courses, userEmail, studentSections);

  // Aggregate widgets (summary stats, "Due This Week", "New Feedback") need every course settled;
  // the course grid below renders immediately and fills each card in as its course resolves.
  const isLoading = isLoadingAssignments || isLoadingSubmissions;

  /* ── Period filter ───────────────────────────────────────────────────── */

  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  /* ── Needs-attention rail: capped lists with per-section expanders ───── */

  const [expandedRail, setExpandedRail] = useState<Record<string, boolean>>({});
  const capRail = <T,>(key: string, items: T[]): T[] => (expandedRail[key] ? items : items.slice(0, RAIL_CAP));
  const railToggle = (key: string, total: number) =>
    total > RAIL_CAP ? (
      <Button
        type="link"
        size="small"
        style={{ paddingInline: 0, marginTop: 4 }}
        onClick={() => setExpandedRail((e) => ({ ...e, [key]: !e[key] }))}
      >
        {expandedRail[key] ? 'Show less' : `Show all ${total}`}
      </Button>
    ) : null;

  /** Compact rail row for an assignment with a deadline (shared by Overdue and Due Soon). */
  const dueRow = ({ assignment, course }: { assignment: Assignment; course: Course }) => {
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
            <Flex justify="space-between" align="center" gap={8}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong ellipsis style={{ display: 'block' }}>
                  {assignment.name}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {course.name}
                </Text>
              </div>
              {dueRel.text ? (
                <Tag color={dueRel.urgent ? 'error' : 'default'} style={{ marginInlineEnd: 0 }}>
                  <CalendarOutlined /> {dueRel.text}
                </Tag>
              ) : status === SubmissionStatus.NO_SUBMISSION && assignment.allowStudentUpload ? (
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                  <UploadOutlined /> Upload
                </Tag>
              ) : status === SubmissionStatus.NOT_REVIEWED ? (
                <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                  <EyeOutlined /> View
                </Tag>
              ) : (
                <Tag color="default" style={{ marginInlineEnd: 0 }}>
                  Open
                </Tag>
              )}
            </Flex>
          </Card>
        </Link>
      </motion.div>
    );
  };

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

  // Quizzes across the shown courses that the student can start or resume now.
  const quizzesToTake = useAllAvailableQuizzes(displayCourses).filter(({ quiz }) => {
    const action = quizAction(quiz);
    return action === 'start' || action === 'resume';
  });

  /* ── Aggregate cross-course data ─────────────────────────────────────── */

  const { overdue, dueSoon, pendingFeedback, totalDueToday, totalPendingFeedback, totalCompleted, totalAssignments } =
    useMemo(() => {
      const overdue: Array<{ assignment: Assignment; course: Course }> = [];
      const dueSoon: Array<{ assignment: Assignment; course: Course }> = [];
      const pendingFeedback: Array<{ assignment: Assignment; course: Course }> = [];
      let totalDueToday = 0;
      let totalPendingFeedback = 0;
      let totalCompleted = 0;
      let totalAssignments = 0;
      const now = Date.now();

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
          const due = a.uploadDueDate ? new Date(a.uploadDueDate).getTime() : Infinity;
          (due < now ? overdue : dueSoon).push({ assignment: a, course });
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

      const dueTime = (x: { assignment: Assignment }) =>
        x.assignment.uploadDueDate ? new Date(x.assignment.uploadDueDate).getTime() : Infinity;
      // Most recently due first — stale long-overdue items sink to the bottom.
      overdue.sort((a, b) => dueTime(b) - dueTime(a));
      // Soonest deadline first.
      dueSoon.sort((a, b) => dueTime(a) - dueTime(b));

      return { overdue, dueSoon, pendingFeedback, totalDueToday, totalPendingFeedback, totalCompleted, totalAssignments };
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
      <main className={styles.dashboard}>
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
      </main>
    );
  }

  const firstName = userEmail.split('@')[0].split('.')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <main className={styles.dashboard}>
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
        <Flex gap={6} align="center" wrap="wrap" style={{ marginBottom: 24 }} role="group" aria-label="Filter courses by period">
          {/* Toggle buttons (not Tag.CheckableTag, which renders a non-focusable span) so the
              filter is keyboard-operable and its pressed state is announced. */}
          <Button
            size="small"
            shape="round"
            type={selectedPeriod === null ? 'primary' : 'default'}
            aria-pressed={selectedPeriod === null}
            onClick={() => setSelectedPeriod(null)}
          >
            All
          </Button>
          {visiblePeriods.map((period) => (
            <Button
              key={period}
              size="small"
              shape="round"
              type={selectedPeriod === period ? 'primary' : 'default'}
              aria-pressed={selectedPeriod === period}
              onClick={() => setSelectedPeriod(selectedPeriod === period ? null : period)}
            >
              {period}
            </Button>
          ))}
          {!showAllPeriods && hiddenPeriodCount > 0 && (
            <Button type="link" size="small" onClick={() => setShowAllPeriods(true)}>
              +{hiddenPeriodCount} older
            </Button>
          )}
        </Flex>
      )}

      <div className={styles.mainSplit}>
        {/* ── Course cards ──────────────────────────────────────────────── */}
        {/* Rendered immediately from `courses`; each card fills in as its course query settles. */}
        <motion.div
          className={styles.mainCol}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
        >
          <Title level={3} style={{ marginBottom: 12, fontSize: 16 }}>
            Your Courses
          </Title>
          <div className={styles.courseGrid}>
            {displayCourses
              .filter((c) => !c.archived)
              .map((course) => {
                const loading = isCourseLoading(course.id);
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

                      {loading ? (
                        <Flex align="center" gap={8} style={{ marginTop: 4 }}>
                          <Spin size="small" />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Loading…
                          </Text>
                        </Flex>
                      ) : (
                        <>
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
                        </>
                      )}
                    </Card>
                  </Link>
                );
              })}
          </div>
        </motion.div>

        {/* ── Needs-attention rail ──────────────────────────────────────── */}
        {!isLoading &&
          (overdue.length > 0 || dueSoon.length > 0 || quizzesToTake.length > 0 || pendingFeedback.length > 0) && (
          <div className={styles.rail}>
            {/* Overdue */}
            {overdue.length > 0 && (
              <motion.section
                aria-label={`Overdue — ${overdue.length} assignments`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
                style={{ marginBottom: 24 }}
              >
                <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  <Title level={3} style={{ margin: 0, fontSize: 16 }}>
                    Overdue
                  </Title>
                  <Badge count={overdue.length} size="small" />
                </Flex>

                <Flex vertical gap={8}>
                  <AnimatePresence>{capRail('overdue', overdue).map(dueRow)}</AnimatePresence>
                </Flex>
                {railToggle('overdue', overdue.length)}
              </motion.section>
            )}

            {/* Due soon */}
            {dueSoon.length > 0 && (
              <motion.section
                aria-label={`Due soon — ${dueSoon.length} assignments`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.07, ease: [0.4, 0, 0.2, 1] }}
                style={{ marginBottom: 24 }}
              >
                <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                  <FireOutlined style={{ color: '#faad14' }} />
                  <Title level={3} style={{ margin: 0, fontSize: 16 }}>
                    Due Soon
                  </Title>
                  <Badge count={dueSoon.length} size="small" color="#faad14" />
                </Flex>

                <Flex vertical gap={8}>
                  <AnimatePresence>{capRail('dueSoon', dueSoon).map(dueRow)}</AnimatePresence>
                </Flex>
                {railToggle('dueSoon', dueSoon.length)}
              </motion.section>
            )}

            {/* Quizzes to take */}
            {quizzesToTake.length > 0 && (
              <motion.section
                aria-label={`Quizzes to take — ${quizzesToTake.length}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
                style={{ marginBottom: 24 }}
              >
                <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                  <FormOutlined style={{ color: '#198665' }} />
                  <Title level={3} style={{ margin: 0, fontSize: 16 }}>
                    Quizzes to Take
                  </Title>
                  <Badge count={quizzesToTake.length} size="small" />
                </Flex>

                <Flex vertical gap={8}>
                  {capRail('quizzes', quizzesToTake).map(({ quiz, course }) => (
                    <Link
                      key={`${course.id}-${quiz.id}`}
                      to={encodedCourseLink('student', course, `quizzes/${quiz.id}/take`)}
                      style={{ textDecoration: 'none' }}
                    >
                      <Card size="small" hoverable>
                        <Flex justify="space-between" align="center" gap={8}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text strong ellipsis style={{ display: 'block' }}>
                              {quiz.title}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {course.name}
                            </Text>
                          </div>
                          <Tag color="green" style={{ marginInlineEnd: 0 }}>
                            {quizActionLabel(quiz)}
                          </Tag>
                        </Flex>
                      </Card>
                    </Link>
                  ))}
                </Flex>
                {railToggle('quizzes', quizzesToTake.length)}
              </motion.section>
            )}

            {/* New feedback */}
            {pendingFeedback.length > 0 && (
              <motion.section
                aria-label={`New feedback — ${pendingFeedback.length} assignments`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                style={{ marginBottom: 24 }}
              >
                <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                  <EyeOutlined style={{ color: '#1677ff' }} />
                  <Title level={3} style={{ margin: 0, fontSize: 16 }}>
                    New Feedback
                  </Title>
                  <Badge count={pendingFeedback.length} size="small" color="blue" />
                </Flex>

                <Flex vertical gap={8}>
                  <AnimatePresence>
                    {capRail('feedback', pendingFeedback).map(({ assignment, course }) => {
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
                              <Flex justify="space-between" align="center" gap={8}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Flex align="center" gap={6}>
                                    <Text strong ellipsis style={{ display: 'block', minWidth: 0 }}>
                                      {assignment.name}
                                    </Text>
                                    <Badge status="processing" />
                                  </Flex>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {course.name}
                                  </Text>
                                </div>
                                <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                                  <EyeOutlined /> View
                                </Tag>
                              </Flex>
                            </Card>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </Flex>
                {railToggle('feedback', pendingFeedback.length)}
              </motion.section>
            )}
          </div>
        )}
      </div>

    </main>
  );
};

export default StudentDashboard;
