// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarOutlined, EyeOutlined, FireOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { AnimatePresence, motion } from 'motion/react';

import { Course } from '../../api-client';
import { Assignment } from '../../types/common';
import { SubmissionStatus } from './submissionStatus';
import { encodedCourseLink } from '../core/CourseMenu';
import { CodePostDate } from '../utils/CodepostDate';
import { useStudentData, getSubmissionStatusFor } from './useStudentData';
import styles from './StudentDashboard.module.scss';

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

  /* ── Aggregate cross-course data ─────────────────────────────────────── */

  const { dueThisWeek, pendingFeedback, totalDueToday, totalPendingFeedback, totalCompleted, totalAssignments } =
    useMemo(() => {
      const dueThisWeek: Array<{ assignment: Assignment; course: Course }> = [];
      const pendingFeedback: Array<{ assignment: Assignment; course: Course }> = [];
      let totalDueToday = 0;
      let totalPendingFeedback = 0;
      let totalCompleted = 0;
      let totalAssignments = 0;

      for (const course of courses) {
        const sections = getGroupedSections(course.id);
        if (!sections) continue;

        totalAssignments += sections.all.filter(
          (a) =>
            getSubmissionStatusFor(a, submissions[a.id]?.[0], viewsBySubmission) !== SubmissionStatus.NOT_PUBLISHED,
        ).length;
        totalCompleted += sections.completed.length;
        totalDueToday += sections.dueToday.length;

        // Collect assignments due soon (today + this week) across all courses
        for (const a of [...sections.dueToday, ...sections.dueSoon]) {
          dueThisWeek.push({ assignment: a, course });
        }

        // Collect pending feedback across all courses
        for (const a of sections.all) {
          const sub = submissions[a.id]?.[0];
          const status = getSubmissionStatusFor(a, sub, viewsBySubmission);
          if (status === SubmissionStatus.PENDING) {
            pendingFeedback.push({ assignment: a, course });
            totalPendingFeedback++;
          }
        }
      }

      // Sort due-this-week by due date ascending
      dueThisWeek.sort((a, b) => {
        const dateA = a.assignment.uploadDueDate ? new Date(a.assignment.uploadDueDate).getTime() : Infinity;
        const dateB = b.assignment.uploadDueDate ? new Date(b.assignment.uploadDueDate).getTime() : Infinity;
        return dateA - dateB;
      });

      return { dueThisWeek, pendingFeedback, totalDueToday, totalPendingFeedback, totalCompleted, totalAssignments };
    }, [courses, getGroupedSections, submissions, viewsBySubmission]);

  /* ── Next-due per course ─────────────────────────────────────────────── */

  const courseNextDue = useMemo(() => {
    const map: Record<number, { name: string; dueText: string } | null> = {};
    for (const course of courses) {
      const sections = getGroupedSections(course.id);
      if (!sections) {
        map[course.id] = null;
        continue;
      }
      // first due-today, then due-soon, then upcoming
      const next = [...sections.dueToday, ...sections.dueSoon, ...sections.upcoming][0];
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
  }, [courses, getGroupedSections]);

  /* ── Render ──────────────────────────────────────────────────────────── */

  if (courses.length === 0) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.emptyState}>
          <InboxOutlined className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>No courses yet</h2>
          <p className={styles.emptySubtext}>
            You haven&apos;t been enrolled in any courses yet. Check back later or contact your instructor.
          </p>
        </div>
      </div>
    );
  }

  const firstName = userEmail.split('@')[0].split('.')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className={styles.dashboard}>
      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <header className={styles.greeting}>
        <h1 className={styles.greetingTitle}>
          {getGreeting()}, {displayName}
        </h1>
        <p className={styles.greetingSubtitle}>
          {isLoading
            ? 'Loading your assignments…'
            : `${courses.length} course${courses.length === 1 ? '' : 's'} this term`}
        </p>
      </header>

      {/* ── Summary strip ───────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div
          className={styles.summaryStrip}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={styles.summaryCardAccent}>
            <span className={styles.summaryValue}>{totalDueToday}</span>
            <span className={styles.summaryLabel}>Due today</span>
          </div>
          <div className={styles.summaryCardWarning}>
            <span className={styles.summaryValue}>
              {totalPendingFeedback}
              {totalPendingFeedback > 0 && <span className={styles.notificationDot} />}
            </span>
            <span className={styles.summaryLabel}>New feedback</span>
          </div>
          <div className={styles.summaryCardBrand}>
            <span className={styles.summaryValue}>{totalCompleted}</span>
            <span className={styles.summaryLabel}>Completed</span>
          </div>
          <div className={styles.summaryCardNeutral}>
            <span className={styles.summaryValue}>
              {totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0}%
            </span>
            <span className={styles.summaryLabel}>Overall progress</span>
          </div>
        </motion.div>
      )}

      {/* ── Loading skeleton ────────────────────────────────────────────── */}
      {isLoading && (
        <div>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeleton} style={{ marginBottom: 8 }} />
          ))}
        </div>
      )}

      {/* ── Due this week (cross-course) ────────────────────────────────── */}
      {!isLoading && dueThisWeek.length > 0 && (
        <motion.section
          className={styles.urgentSection}
          aria-label={`Due this week — ${dueThisWeek.length} assignment${dueThisWeek.length === 1 ? '' : 's'}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIconUrgent} aria-hidden="true">
              <FireOutlined />
            </div>
            <h2 className={styles.sectionTitle}>Due This Week</h2>
            <span className={styles.sectionCount}>{dueThisWeek.length}</span>
          </div>
          <div className={styles.urgentList}>
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
                    <Link to={link} className={styles.urgentRow} tabIndex={0}>
                      <div className={styles.urgentRowIdentity}>
                        <span className={styles.urgentRowName}>{assignment.name}</span>
                        <span className={styles.urgentRowCourseBadge}>{course.name}</span>
                      </div>
                      <span className={styles.urgentRowDueDate}>
                        <CalendarOutlined /> {dueRel.text || <CodePostDate datetime={assignment.uploadDueDate!} />}
                      </span>
                      <div className={styles.urgentRowAction}>
                        {status === SubmissionStatus.NO_SUBMISSION && assignment.allowStudentUpload ? (
                          <span className={styles.btnPrimaryAccent}>
                            <UploadOutlined /> Upload
                          </span>
                        ) : status === SubmissionStatus.NOT_REVIEWED ? (
                          <span className={styles.btnPrimaryBrand}>
                            <EyeOutlined /> View
                          </span>
                        ) : (
                          <span className={styles.btnPrimaryBrand}>Open</span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.section>
      )}

      {/* ── Pending feedback (cross-course) ─────────────────────────────── */}
      {!isLoading && pendingFeedback.length > 0 && (
        <motion.section
          className={styles.urgentSection}
          aria-label={`New feedback — ${pendingFeedback.length} assignment${pendingFeedback.length === 1 ? '' : 's'}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIconFeedback} aria-hidden="true">
              <EyeOutlined />
            </div>
            <h2 className={styles.sectionTitle}>New Feedback</h2>
            <span className={styles.sectionCount}>{pendingFeedback.length}</span>
          </div>
          <div className={styles.urgentList}>
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
                    <Link to={link} className={styles.urgentRowFeedback} tabIndex={0}>
                      <div className={styles.urgentRowIdentity}>
                        <span className={styles.urgentRowName}>
                          {assignment.name}
                          <span className={styles.notificationDot} />
                        </span>
                        <span className={styles.urgentRowCourseBadge}>{course.name}</span>
                      </div>
                      <span />
                      <div className={styles.urgentRowAction}>
                        <span className={styles.btnPrimaryWarning}>
                          <EyeOutlined /> View Feedback
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.section>
      )}

      {/* ── Course cards ────────────────────────────────────────────────── */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          <h2 className={styles.coursesHeading}>Your Courses</h2>
          <div className={styles.courseGrid}>
            {courses
              .filter((c) => !c.archived)
              .map((course) => {
                const progress = getProgress(course.id);
                const next = courseNextDue[course.id];
                const link = encodedCourseLink('student', course);

                return (
                  <Link key={course.id} to={link} className={styles.courseCard} tabIndex={0}>
                    <div className={styles.courseCardHeader}>
                      <h3 className={styles.courseCardName}>{course.name}</h3>
                      <span className={styles.courseCardPeriod}>{course.period}</span>
                    </div>

                    <span className={styles.courseCardAssignmentCount}>
                      {progress.total} assignment{progress.total === 1 ? '' : 's'}
                    </span>

                    {/* Mini progress bar */}
                    {progress.total > 0 && (
                      <div className={styles.courseCardProgress}>
                        <div className={styles.courseCardProgressLabel}>
                          <span className={styles.courseCardProgressText}>
                            {Math.round(progress.percent)}% complete
                          </span>
                          <span className={styles.courseCardProgressText}>
                            {progress.completed}/{progress.total}
                          </span>
                        </div>
                        <div
                          className={styles.courseCardProgressTrack}
                          role="progressbar"
                          aria-valuenow={progress.percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={styles.courseCardProgressFill}
                            style={{ width: `${Math.max(progress.percent, 2)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Next due assignment teaser */}
                    {next && (
                      <div className={styles.courseCardNext}>
                        <CalendarOutlined className={styles.courseCardNextIcon} />
                        <span className={styles.courseCardNextName}>{next.name}</span>
                        <span className={styles.courseCardNextDue}>{next.dueText}</span>
                      </div>
                    )}
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
