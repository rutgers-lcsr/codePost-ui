// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EyeOutlined,
  FireFilled,
  HomeFilled,
  UploadOutlined,
} from '@ant-design/icons';
import { AnimatePresence, motion } from 'motion/react';

import { Course } from '../../api-client';
import { Assignment } from '../../types/common';
import { SubmissionStatus } from './submissionStatus';
import { encodedCourseLink } from '../core/CourseMenu';
import { CodePostDate } from '../utils/CodepostDate';
import { useStudentData, getSubmissionStatusFor } from './useStudentData';
import styles from './MobileStudentConsole.module.scss';

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface MobileStudentConsoleProps {
  courses: Course[];
  userEmail: string;
  studentSections: number[];
}

type MobileTab = 'home' | 'courses';

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Component                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const MobileStudentConsole: React.FC<MobileStudentConsoleProps> = ({ courses, userEmail, studentSections }) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');

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

        for (const a of [...sections.dueToday, ...sections.dueSoon]) {
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
    }, [courses, getGroupedSections, submissions, viewsBySubmission]);

  /* ── Display name ─────────────────────────────────────────────────────── */

  const firstName = userEmail.split('@')[0].split('.')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  /* ── Render: Home tab ─────────────────────────────────────────────────── */

  const renderHome = () => (
    <div className={styles.scrollContent}>
      {/* Hero greeting */}
      <header className={styles.hero}>
        <motion.h1
          className={styles.heroTitle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {getGreeting()},<br />
          {displayName}
        </motion.h1>
        <motion.p
          className={styles.heroSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {isLoading ? 'Loading…' : `${courses.length} course${courses.length === 1 ? '' : 's'} this term`}
        </motion.p>
      </header>

      {/* Stats ring */}
      {!isLoading && (
        <motion.div
          className={styles.statsRow}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <div className={styles.statChip} data-variant="urgent">
            <span className={styles.statValue}>{totalDueToday}</span>
            <span className={styles.statLabel}>Due today</span>
          </div>
          <div className={styles.statChip} data-variant="feedback">
            <span className={styles.statValue}>
              {totalPendingFeedback}
              {totalPendingFeedback > 0 && <span className={styles.dot} />}
            </span>
            <span className={styles.statLabel}>Feedback</span>
          </div>
          <div className={styles.statChip} data-variant="done">
            <span className={styles.statValue}>{totalCompleted}</span>
            <span className={styles.statLabel}>Done</span>
          </div>
          <div className={styles.statChip} data-variant="progress">
            <span className={styles.statValue}>
              {totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0}%
            </span>
            <span className={styles.statLabel}>Progress</span>
          </div>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className={styles.skeletonGroup}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {/* Due this week */}
      {!isLoading && dueThisWeek.length > 0 && (
        <motion.section
          className={styles.section}
          aria-label={`Due this week — ${dueThisWeek.length} assignments`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className={styles.sectionHead}>
            <FireFilled className={styles.sectionIconUrgent} />
            <h2 className={styles.sectionTitle}>Due Soon</h2>
            <span className={styles.badge}>{dueThisWeek.length}</span>
          </div>
          <div className={styles.cardStack}>
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
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link to={link} className={styles.taskCard} data-urgent={dueRel.urgent}>
                      <div className={styles.taskCardBody}>
                        <span className={styles.taskName}>{assignment.name}</span>
                        <span className={styles.taskCourse}>{course.name}</span>
                      </div>
                      <div className={styles.taskCardMeta}>
                        {dueRel.text && (
                          <span className={styles.taskDue} data-urgent={dueRel.urgent}>
                            <ClockCircleOutlined /> {dueRel.text}
                          </span>
                        )}
                        {!dueRel.text && assignment.uploadDueDate && (
                          <span className={styles.taskDue}>
                            <CalendarOutlined /> <CodePostDate datetime={assignment.uploadDueDate} />
                          </span>
                        )}
                        {status === SubmissionStatus.NO_SUBMISSION && assignment.allowStudentUpload ? (
                          <span className={styles.actionChip} data-action="upload">
                            <UploadOutlined /> Upload
                          </span>
                        ) : (
                          <span className={styles.actionChip} data-action="view">
                            <EyeOutlined /> View
                          </span>
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

      {/* New Feedback */}
      {!isLoading && pendingFeedback.length > 0 && (
        <motion.section
          className={styles.section}
          aria-label={`New feedback — ${pendingFeedback.length} assignments`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <div className={styles.sectionHead}>
            <EyeOutlined className={styles.sectionIconFeedback} />
            <h2 className={styles.sectionTitle}>New Feedback</h2>
            <span className={styles.badge}>{pendingFeedback.length}</span>
          </div>
          <div className={styles.cardStack}>
            <AnimatePresence>
              {pendingFeedback.map(({ assignment, course }) => {
                const link = encodedCourseLink('student', course);
                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link to={link} className={styles.taskCard} data-variant="feedback">
                      <div className={styles.taskCardBody}>
                        <span className={styles.taskName}>
                          {assignment.name}
                          <span className={styles.dot} />
                        </span>
                        <span className={styles.taskCourse}>{course.name}</span>
                      </div>
                      <div className={styles.taskCardMeta}>
                        <span className={styles.actionChip} data-action="feedback">
                          <EyeOutlined /> View
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

      {/* All caught up state */}
      {!isLoading && dueThisWeek.length === 0 && pendingFeedback.length === 0 && (
        <motion.div
          className={styles.caughtUp}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <CheckCircleFilled className={styles.caughtUpIcon} />
          <span className={styles.caughtUpText}>All caught up!</span>
          <span className={styles.caughtUpSubtext}>No assignments due this week.</span>
        </motion.div>
      )}
    </div>
  );

  /* ── Render: Courses tab ──────────────────────────────────────────────── */

  const renderCourses = () => (
    <div className={styles.scrollContent}>
      <header className={styles.tabHeader}>
        <h1 className={styles.tabTitle}>Courses</h1>
      </header>

      {isLoading && (
        <div className={styles.skeletonGroup}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className={styles.courseList}>
          <AnimatePresence>
            {courses
              .filter((c) => !c.archived)
              .map((course, idx) => {
                const progress = getProgress(course.id);
                const sections = getGroupedSections(course.id);
                const link = encodedCourseLink('student', course);

                // Next due assignment
                let nextDue: { name: string; text: string } | null = null;
                if (sections) {
                  const next = [...sections.dueToday, ...sections.dueSoon, ...sections.upcoming][0];
                  if (next?.uploadDueDate) {
                    const rel = getRelativeDueDate(next.uploadDueDate);
                    nextDue = { name: next.name, text: rel.text || 'Upcoming' };
                  } else if (next) {
                    nextDue = { name: next.name, text: 'Upcoming' };
                  }
                }

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                  >
                    <Link to={link} className={styles.courseCard}>
                      <div className={styles.courseCardTop}>
                        <h3 className={styles.courseName}>{course.name}</h3>
                        <span className={styles.coursePeriod}>{course.period}</span>
                      </div>

                      {progress.total > 0 && (
                        <div className={styles.progressBlock}>
                          <div className={styles.progressMeta}>
                            <span>{Math.round(progress.percent)}% complete</span>
                            <span>
                              {progress.completed}/{progress.total}
                            </span>
                          </div>
                          <div
                            className={styles.progressTrack}
                            role="progressbar"
                            aria-valuenow={progress.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className={styles.progressFill}
                              style={{ width: `${Math.max(progress.percent, 3)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {nextDue && (
                        <div className={styles.courseNext}>
                          <CalendarOutlined />
                          <span className={styles.courseNextName}>{nextDue.name}</span>
                          <span className={styles.courseNextDue}>{nextDue.text}</span>
                        </div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  /* ── Shell ────────────────────────────────────────────────────────────── */

  return (
    <div className={styles.mobileShell}>
      {/* Content area with momentum scroll */}
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
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav className={styles.bottomNav} aria-label="Main navigation">
        <button
          className={styles.navItem}
          data-active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
          aria-label="Home"
          aria-current={activeTab === 'home' ? 'page' : undefined}
        >
          <HomeFilled className={styles.navIcon} />
          <span className={styles.navLabel}>Home</span>
          {totalDueToday > 0 && activeTab !== 'home' && <span className={styles.navBadge}>{totalDueToday}</span>}
        </button>
        <button
          className={styles.navItem}
          data-active={activeTab === 'courses'}
          onClick={() => setActiveTab('courses')}
          aria-label="Courses"
          aria-current={activeTab === 'courses' ? 'page' : undefined}
        >
          <BookOutlined className={styles.navIcon} />
          <span className={styles.navLabel}>Courses</span>
        </button>
      </nav>
    </div>
  );
};

export default MobileStudentConsole;
