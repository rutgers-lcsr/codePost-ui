// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React, { useMemo, useState } from 'react';
import {
  ArrowLeftOutlined,
  BookOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EyeOutlined,
  FireFilled,
  HomeFilled,
  LogoutOutlined,
  SettingOutlined,
  UploadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Card, Empty, Flex, Progress, Spin, Statistic, Tag, Typography } from 'antd';
import { renderRoleSwitcher } from '../core/MobileRoleSwitcher';
import { clickableProps } from '../core/clickable';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';

import { Course, User } from '../../api-client';
import { Assignment } from '../../types/common';
import { Submission } from '../../api-client';
import { SubmissionStatus } from './submissionStatus';
import { useStudentData, getSubmissionStatusFor, GroupedSections } from './useStudentData';
import styles from './MobileStudentConsole.module.scss';

const { Title, Text } = Typography;

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface MobileStudentConsoleProps {
  courses: Course[];
  userEmail: string;
  studentSections: number[];
  user: User;
  onLogout: () => void;
}

type MobileTab = 'home' | 'courses' | 'settings';

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
  if (diffDays === 1) return { text: 'Tomorrow', urgent: true };
  if (diffDays <= 3) return { text: `${diffDays}d left`, urgent: true };
  if (diffDays <= 7) return { text: `${diffDays}d left`, urgent: false };
  return { text: '', urgent: false };
}

function formatDueDate(date: string | null | undefined): string {
  if (!date) return 'No due date';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getStatusTag(status: SubmissionStatus): React.ReactNode {
  switch (status) {
    case SubmissionStatus.SUBMITTED:
      return <Tag color="success">Feedback Viewed</Tag>;
    case SubmissionStatus.PENDING:
      return <Tag color="processing">New Feedback</Tag>;
    case SubmissionStatus.NOT_REVIEWED:
      return <Tag color="warning">In Review</Tag>;
    case SubmissionStatus.NO_SUBMISSION:
      return <Tag color="default">Not Submitted</Tag>;
    case SubmissionStatus.NOT_PUBLISHED:
      return <Tag color="default">Not Published</Tag>;
    default:
      return <Tag>Unknown</Tag>;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Assignment row — shared within CourseDetail sections                      */
/* ────────────────────────────────────────────────────────────────────────── */

const AssignmentCard: React.FC<{
  assignment: Assignment;
  submissions: Record<number, Submission[]>;
  viewsBySubmission: Record<number, boolean>;
  idx: number;
}> = ({ assignment, submissions, viewsBySubmission, idx }) => {
  const sub = submissions[assignment.id]?.[0];
  const status = getSubmissionStatusFor(assignment, sub, viewsBySubmission);
  const dueRel = assignment.uploadDueDate ? getRelativeDueDate(assignment.uploadDueDate) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, delay: idx * 0.025 }}
    >
      <Card size="small" hoverable>
        <Flex justify="space-between" align="flex-start" gap={8}>
          <Text strong style={{ fontSize: 14, flex: 1, minWidth: 0 }}>
            {assignment.name}
          </Text>
          {getStatusTag(status)}
        </Flex>

        <Flex gap={12} wrap style={{ marginTop: 6 }}>
          {assignment.uploadDueDate && (
            <Text type={dueRel?.urgent ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
              <ClockCircleOutlined /> {dueRel?.text || formatDueDate(assignment.uploadDueDate)}
            </Text>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            <BookOutlined /> {assignment.points} pts
          </Text>
        </Flex>

        {sub && sub.grade != null && !assignment.hideGrades && (
          <Flex style={{ marginTop: 6 }} gap={8}>
            <Tag color="green">
              {sub.grade}/{assignment.points}
            </Tag>
            {sub.isFinalized && (
              <Tag color="success" icon={<CheckCircleFilled />}>
                Finalized
              </Tag>
            )}
          </Flex>
        )}

        {status === SubmissionStatus.NO_SUBMISSION && assignment.allowStudentUpload && (
          <Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
            <UploadOutlined /> Ready to submit
          </Text>
        )}
        {status === SubmissionStatus.PENDING && (
          <Text type="success" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
            <EyeOutlined /> New feedback available
          </Text>
        )}
      </Card>
    </motion.div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Section block — collapsible group of assignments                          */
/* ────────────────────────────────────────────────────────────────────────── */

const SectionBlock: React.FC<{
  title: string;
  count: number;
  defaultOpen?: boolean;
  accentColor?: string;
  children: React.ReactNode;
}> = ({ title, count, defaultOpen = true, accentColor = '#1677ff', children }) => {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '4px 0 10px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            background: accentColor,
            flexShrink: 0,
          }}
        />
        <Text strong style={{ fontSize: 13, flex: 1 }}>
          {title}
        </Text>
        <Badge count={count} size="small" color={accentColor} style={{ marginRight: 4 }} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {open ? '▾' : '▸'}
        </Text>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <Flex vertical gap={8}>
              {children}
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Course Detail Sub-Component                                               */
/* ────────────────────────────────────────────────────────────────────────── */

const CourseDetail: React.FC<{
  course: Course;
  onBack: () => void;
  submissions: Record<number, Submission[]>;
  viewsBySubmission: Record<number, boolean>;
  sections: GroupedSections | null;
  progress: { completed: number; total: number; percent: number };
}> = ({ course, onBack, submissions, viewsBySubmission, sections, progress }) => {
  // Merge dueToday + dueSoon + upcoming into a single "Upcoming" group
  const upcomingAll = useMemo(() => {
    if (!sections) return [];
    return [...sections.dueToday, ...sections.dueSoon, ...sections.upcoming];
  }, [sections]);

  const totalVisible = upcomingAll.length + (sections?.overdue.length ?? 0) + (sections?.completed.length ?? 0);

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
      </Flex>

      {/* Progress bar — matches desktop "Course progress · X%" header */}
      {progress.total > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Flex justify="space-between" style={{ marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Course progress · {Math.round(progress.percent)}%
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {progress.completed} of {progress.total} completed
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

      {totalVisible === 0 && !sections?.unpublished?.length ? (
        <Empty description="No assignments yet" />
      ) : (
        <>
          {/* Past Due */}
          <SectionBlock title="Past Due" count={sections?.overdue.length ?? 0} accentColor="#ff4d4f">
            {(sections?.overdue ?? []).map((a, i) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                submissions={submissions}
                viewsBySubmission={viewsBySubmission}
                idx={i}
              />
            ))}
          </SectionBlock>

          {/* Upcoming */}
          <SectionBlock title="Upcoming" count={upcomingAll.length} accentColor="#1677ff">
            {upcomingAll.map((a, i) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                submissions={submissions}
                viewsBySubmission={viewsBySubmission}
                idx={i}
              />
            ))}
          </SectionBlock>

          {/* Completed */}
          <SectionBlock title="Completed" count={sections?.completed.length ?? 0} accentColor="#52c41a">
            {(sections?.completed ?? []).map((a, i) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                submissions={submissions}
                viewsBySubmission={viewsBySubmission}
                idx={i}
              />
            ))}
          </SectionBlock>

          {/* Not Yet Published */}
          <SectionBlock
            title="Not Yet Published"
            count={sections?.unpublished?.length ?? 0}
            defaultOpen={false}
            accentColor="#8c8c8c"
          >
            {(sections?.unpublished ?? []).map((a, i) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                submissions={submissions}
                viewsBySubmission={viewsBySubmission}
                idx={i}
              />
            ))}
          </SectionBlock>
        </>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Main Component                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const MobileStudentConsole: React.FC<MobileStudentConsoleProps> = ({
  courses,
  userEmail,
  studentSections,
  user,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Archived courses are hidden everywhere on mobile — don't fetch their data either
  const activeCourses = useMemo(() => courses.filter((c) => !c.archived), [courses]);

  const {
    submissions,
    viewsBySubmission,
    isLoadingAssignments,
    isLoadingSubmissions,
    getGroupedSections,
    getProgress,
  } = useStudentData(activeCourses, userEmail, studentSections);

  const isLoading = isLoadingAssignments || isLoadingSubmissions;

  // Only greet by name when the email local part looks like a name (netIDs like "mk1800" read oddly)
  const localPart = userEmail.split('@')[0].split('.')[0];
  const displayName = /^[a-z]+$/i.test(localPart) ? localPart.charAt(0).toUpperCase() + localPart.slice(1) : null;

  /* ── Aggregate data ──────────────────────────────────────────────────── */
  const { dueThisWeek, pendingFeedback, totalDueToday, totalPendingFeedback, totalCompleted, totalAssignments } =
    useMemo(() => {
      const dueThisWeek: Array<{ assignment: Assignment; course: Course }> = [];
      const pendingFeedback: Array<{ assignment: Assignment; course: Course }> = [];
      let totalDueToday = 0;
      let totalPendingFeedback = 0;
      let totalCompleted = 0;
      let totalAssignments = 0;

      for (const course of activeCourses) {
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
    }, [activeCourses, getGroupedSections, submissions, viewsBySubmission]);

  const selectedCourse = activeCourses.find((c) => c.id === selectedCourseId);

  /* ── Home ────────────────────────────────────────────────────────────── */

  const renderHome = () => (
    <div className={styles.scrollContent}>
      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <Tag color="green" style={{ marginBottom: 8 }}>
          Student
        </Tag>
        <Title level={3} style={{ margin: 0 }}>
          {getGreeting()}
          {displayName ? `, ${displayName}` : ''}
        </Title>
        <Text type="secondary">
          {isLoading ? 'Loading…' : `${activeCourses.length} course${activeCourses.length === 1 ? '' : 's'} this term`}
        </Text>
      </div>

      {/* Stats row */}
      {!isLoading && (
        <Card size="small" style={{ marginBottom: 20 }}>
          <Flex justify="space-around">
            <Statistic
              title="Due today"
              value={totalDueToday}
              valueStyle={{ fontSize: 20, color: totalDueToday > 0 ? '#ff4d4f' : undefined }}
            />
            <Statistic
              title="Feedback"
              value={totalPendingFeedback}
              valueStyle={{ fontSize: 20, color: totalPendingFeedback > 0 ? '#1677ff' : undefined }}
              suffix={totalPendingFeedback > 0 ? <Badge status="processing" /> : undefined}
            />
            <Statistic title="Done" value={totalCompleted} valueStyle={{ fontSize: 20 }} />
            <Statistic
              title="Progress"
              value={totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0}
              suffix="%"
              valueStyle={{ fontSize: 20 }}
            />
          </Flex>
        </Card>
      )}

      {isLoading && (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin tip="Loading your courses…" />
        </Flex>
      )}

      {/* Due soon section */}
      {!isLoading && dueThisWeek.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
            <FireFilled style={{ color: '#ff4d4f' }} />
            <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Due Soon
            </Text>
            <Badge count={dueThisWeek.length} size="small" />
          </Flex>

          <Flex vertical gap={8}>
            <AnimatePresence>
              {dueThisWeek.map(({ assignment, course }) => {
                const dueRel = assignment.uploadDueDate
                  ? getRelativeDueDate(assignment.uploadDueDate)
                  : { text: '', urgent: false };

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      size="small"
                      hoverable
                      {...clickableProps(() => {
                        setSelectedCourseId(course.id);
                        setActiveTab('courses');
                      })}
                    >
                      <Flex justify="space-between" align="center">
                        <div>
                          <Text strong>{assignment.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {course.name}
                          </Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {dueRel.text && (
                            <Tag color={dueRel.urgent ? 'error' : 'default'} style={{ margin: 0 }}>
                              <ClockCircleOutlined /> {dueRel.text}
                            </Tag>
                          )}
                        </div>
                      </Flex>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Flex>
        </div>
      )}

      {/* New feedback section */}
      {!isLoading && pendingFeedback.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
            <EyeOutlined style={{ color: '#1677ff' }} />
            <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              New Feedback
            </Text>
            <Badge count={pendingFeedback.length} size="small" color="blue" />
          </Flex>

          <Flex vertical gap={8}>
            <AnimatePresence>
              {pendingFeedback.map(({ assignment, course }) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    size="small"
                    hoverable
                    {...clickableProps(() => {
                      setSelectedCourseId(course.id);
                      setActiveTab('courses');
                    })}
                  >
                    <Flex justify="space-between" align="center">
                      <div>
                        <Text strong>{assignment.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {course.name}
                        </Text>
                      </div>
                      <Tag color="processing">
                        <EyeOutlined /> View
                      </Tag>
                    </Flex>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </Flex>
        </div>
      )}

      {/* All caught up */}
      {!isLoading && dueThisWeek.length === 0 && pendingFeedback.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '32px 0' }}>
          <CheckCircleFilled style={{ fontSize: 36, color: '#52c41a', marginBottom: 12 }} />
          <br />
          <Text strong style={{ fontSize: 16 }}>
            All caught up!
          </Text>
          <br />
          <Text type="secondary">No assignments due this week.</Text>
        </Card>
      )}
    </div>
  );

  /* ── Courses ─────────────────────────────────────────────────────────── */

  const renderCourses = () => {
    if (selectedCourse) {
      const sections = getGroupedSections(selectedCourse.id);
      const progress = getProgress(selectedCourse.id);
      return (
        <CourseDetail
          course={selectedCourse}
          onBack={() => setSelectedCourseId(null)}
          submissions={submissions}
          viewsBySubmission={viewsBySubmission}
          sections={sections}
          progress={progress}
        />
      );
    }

    return (
      <div className={styles.scrollContent}>
        <Title level={4} style={{ marginBottom: 4 }}>
          Courses
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          {activeCourses.length} active course
          {activeCourses.length === 1 ? '' : 's'}
        </Text>

        {isLoading ? (
          <Flex justify="center" style={{ padding: 48 }}>
            <Spin />
          </Flex>
        ) : (
          <Flex vertical gap={10}>
            <AnimatePresence>
              {activeCourses.map((course, idx) => {
                const progress = getProgress(course.id);
                const sections = getGroupedSections(course.id);
                const dueSoonCount = sections ? sections.dueToday.length + sections.dueSoon.length : 0;

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                  >
                    <Card size="small" hoverable {...clickableProps(() => setSelectedCourseId(course.id))}>
                      <Flex justify="space-between" align="flex-start">
                        <Text strong>{course.name}</Text>
                        <Tag>{course.period}</Tag>
                      </Flex>

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

                      {dueSoonCount > 0 && (
                        <Tag color="warning" style={{ marginTop: 8 }}>
                          <WarningOutlined /> {dueSoonCount} due soon
                        </Tag>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Flex>
        )}
      </div>
    );
  };

  /* ── Settings ────────────────────────────────────────────────────────── */

  const renderSettings = () => (
    <div className={styles.scrollContent}>
      <Title level={4} style={{ marginBottom: 16 }}>
        Settings
      </Title>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Flex gap={12} align="center">
          <Avatar size={44} style={{ background: '#198665', flexShrink: 0 }}>
            {(displayName ?? userEmail).charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong>{displayName ?? localPart}</Text>
            <br />
            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {userEmail}
            </Text>
            <br />
            <Tag color="green" style={{ marginTop: 4 }}>
              Student
            </Tag>
          </div>
        </Flex>
      </Card>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Flex vertical gap={8}>
          <Flex justify="space-between">
            <Text type="secondary">Courses</Text>
            <Text>{activeCourses.length} active</Text>
          </Flex>
          <Flex justify="space-between">
            <Text type="secondary">Assignments</Text>
            <Text>{totalAssignments} total</Text>
          </Flex>
          <Flex justify="space-between">
            <Text type="secondary">Completed</Text>
            <Text>{totalCompleted}</Text>
          </Flex>
        </Flex>
      </Card>

      {renderRoleSwitcher(user, 'student')}

      <Button danger block icon={<LogoutOutlined />} onClick={onLogout} style={{ marginBottom: 16 }}>
        Log Out
      </Button>

      <Text type="secondary" style={{ fontSize: 12 }}>
        To change account settings, access the full desktop version of codePost. Mobile view is read-only for account
        management.
      </Text>
    </div>
  );

  /* ── Shell ───────────────────────────────────────────────────────────── */

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
                transition={{ duration: 0.2 }}
                className={styles.tabPanel}
              >
                {renderHome()}
              </motion.div>
            )}
            {activeTab === 'courses' && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className={styles.tabPanel}
              >
                {renderCourses()}
              </motion.div>
            )}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className={styles.tabPanel}
              >
                {renderSettings()}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom nav — custom since antd doesn't have a mobile tab bar */}
        <nav className={styles.bottomNav} aria-label="Main navigation">
          <button
            type="button"
            className={styles.navItem}
            data-active={activeTab === 'home' ? 'true' : 'false'}
            aria-current={activeTab === 'home' ? 'page' : undefined}
            onClick={() => setActiveTab('home')}
            aria-label="Home"
          >
            <span className={styles.navIconWrap}>
              <HomeFilled className={styles.navIcon} />
              {totalDueToday > 0 && activeTab !== 'home' && (
                <span className={styles.navDot} aria-label={`${totalDueToday} due today`}>
                  {totalDueToday}
                </span>
              )}
            </span>
            <span className={styles.navLabel}>Home</span>
          </button>
          <button
            type="button"
            className={styles.navItem}
            data-active={activeTab === 'courses' ? 'true' : 'false'}
            aria-current={activeTab === 'courses' ? 'page' : undefined}
            onClick={() => {
              setActiveTab('courses');
              setSelectedCourseId(null);
            }}
            aria-label="Courses"
          >
            <BookOutlined className={styles.navIcon} />
            <span className={styles.navLabel}>Courses</span>
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

export default MobileStudentConsole;
