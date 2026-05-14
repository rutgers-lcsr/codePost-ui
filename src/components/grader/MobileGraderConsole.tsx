// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOutlined, FolderOutlined, InboxOutlined, SearchOutlined } from '@ant-design/icons';
import { AnimatePresence, motion } from 'motion/react';

import { Course } from '../../api-client';
import { encodedCourseLink } from '../core/CourseMenu';
import styles from './MobileGraderConsole.module.scss';

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface MobileGraderConsoleProps {
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

const MobileGraderConsole: React.FC<MobileGraderConsoleProps> = ({ courses, userEmail, defaultPanel }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const firstName = userEmail.split('@')[0].split('.')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  /* ── Organize courses ────────────────────────────────────────────────── */

  const { activeCourses, archivedCourses, totalAssignments, uniquePeriods } = useMemo(() => {
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

    const periods = new Set<string>();
    for (const c of courses) {
      if (c.period) periods.add(c.period);
    }

    return {
      activeCourses: active,
      archivedCourses: archived,
      totalAssignments,
      uniquePeriods: [...periods].sort((a, b) => a.localeCompare(b)),
    };
  }, [courses]);

  /* ── Filtered courses ────────────────────────────────────────────────── */

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
      <div className={styles.mobileShell}>
        <div className={styles.emptyState}>
          <InboxOutlined className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>No courses yet</h2>
          <p className={styles.emptySubtext}>You haven&apos;t been added as a grader to any courses yet.</p>
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className={styles.mobileShell}>
      <div className={styles.scrollContent}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className={styles.hero}>
          <span className={styles.roleChip}>Grader</span>
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
            {activeCourses.length} active course{activeCourses.length === 1 ? '' : 's'} &middot; {totalAssignments}{' '}
            assignment{totalAssignments === 1 ? '' : 's'}
          </motion.p>
        </header>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <motion.div
          className={styles.statsRow}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <div className={styles.statChip} data-variant="brand">
            <span className={styles.statValue}>{activeCourses.length}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statChip} data-variant="accent">
            <span className={styles.statValue}>{totalAssignments}</span>
            <span className={styles.statLabel}>Assignments</span>
          </div>
          <div className={styles.statChip} data-variant="neutral">
            <span className={styles.statValue}>{archivedCourses.length}</span>
            <span className={styles.statLabel}>Archived</span>
          </div>
        </motion.div>

        {/* ── Search + Period Filters ─────────────────────────────────────── */}
        {(courses.length > 3 || uniquePeriods.length > 1) && (
          <div className={styles.filterBlock}>
            {courses.length > 3 && (
              <div className={styles.searchWrap}>
                <SearchOutlined className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="Search courses…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  aria-label="Search courses"
                />
              </div>
            )}
            {uniquePeriods.length > 1 && (
              <div className={styles.periodScroll} role="group" aria-label="Filter by period">
                {uniquePeriods.map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={styles.periodPill}
                    data-active={selectedPeriod === period}
                    onClick={() => setSelectedPeriod(selectedPeriod === period ? null : period)}
                    aria-pressed={selectedPeriod === period}
                  >
                    {period}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Active courses ─────────────────────────────────────────────── */}
        {filteredActive.length > 0 && (
          <motion.section
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <div className={styles.sectionHead}>
              <BookOutlined className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Your Courses</h2>
              <span className={styles.badge}>{filteredActive.length}</span>
            </div>
            <div className={styles.courseList}>
              <AnimatePresence>
                {filteredActive.map((course, idx) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                  >
                    <Link to={encodedCourseLink('grader', course, defaultPanel(course))} className={styles.courseCard}>
                      <div className={styles.courseCardTop}>
                        <h3 className={styles.courseName}>{course.name}</h3>
                        <span className={styles.coursePeriod}>{course.period}</span>
                      </div>
                      <div className={styles.courseCardBottom}>
                        <span className={styles.courseStat}>
                          <BookOutlined /> {course.assignments?.length ?? 0} assignment
                          {(course.assignments?.length ?? 0) === 1 ? '' : 's'}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}

        {/* ── Archived toggle ────────────────────────────────────────────── */}
        {filteredArchived.length > 0 && (
          <motion.section
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <button
              type="button"
              className={styles.archivedToggle}
              onClick={() => setShowArchived(!showArchived)}
              aria-expanded={showArchived}
            >
              <FolderOutlined className={styles.archivedToggleIcon} />
              <span>Archived ({filteredArchived.length})</span>
              <span className={styles.archivedChevron} data-open={showArchived}>
                ›
              </span>
            </button>

            <AnimatePresence>
              {showArchived && (
                <motion.div
                  className={styles.courseList}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  {filteredArchived.map((course, idx) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                    >
                      <Link
                        to={encodedCourseLink('grader', course, defaultPanel(course))}
                        className={styles.courseCard}
                        data-archived="true"
                      >
                        <div className={styles.courseCardTop}>
                          <h3 className={styles.courseName}>{course.name}</h3>
                          <span className={styles.archivedBadge}>Archived</span>
                        </div>
                        <div className={styles.courseCardBottom}>
                          <span className={styles.courseStat}>
                            <BookOutlined /> {course.assignments?.length ?? 0} assignment
                            {(course.assignments?.length ?? 0) === 1 ? '' : 's'}
                          </span>
                          <span className={styles.coursePeriodSmall}>{course.period}</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* ── No results ─────────────────────────────────────────────────── */}
        {searchText && filteredActive.length === 0 && filteredArchived.length === 0 && (
          <div className={styles.emptyState}>
            <SearchOutlined className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>No courses found</h2>
            <p className={styles.emptySubtext}>Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileGraderConsole;
