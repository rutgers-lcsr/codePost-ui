// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOutlined, InboxOutlined, SearchOutlined, TeamOutlined, FolderOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { motion } from 'motion/react';

import { Course } from '../../api-client';
import { encodedCourseLink } from '../core/CourseMenu';
import { useAdminDashboardData } from './useAdminDashboardData';
import { usePrefetchCourse } from '../../hooks/usePrefetchCourse';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';
import styles from './AdminDashboard.module.scss';

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface AdminDashboardProps {
  courses: Course[];
  userEmail: string;
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ courses, userEmail }) => {
  const { stats, activeCourses, archivedCourses } = useAdminDashboardData(courses);
  const prefetchCourse = usePrefetchCourse();
  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // Clear stored course so next /admin/ visit lands on dashboard
  useEffect(() => {
    LOCAL_SETTINGS.defaultCourse.setter(0);
  }, []);

  const firstName = userEmail.split('@')[0].split('.')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  /* ── Unique periods ──────────────────────────────────────────────────── */

  const uniquePeriods = useMemo(() => {
    const periods = new Set<string>();
    for (const c of courses) {
      if (c.period) periods.add(c.period);
    }
    return [...periods].sort((a, b) => a.localeCompare(b));
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
        <div className={styles.emptyState}>
          <InboxOutlined className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>No courses yet</h2>
          <p className={styles.emptySubtext}>Create your first course to get started.</p>
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className={styles.dashboard}>
      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <div className={styles.greeting} role="heading" aria-level={1}>
        <p className={styles.roleLabel}>Admin Console</p>
        <h1 className={styles.greetingTitle}>
          {getGreeting()}, {displayName}
        </h1>
        <p className={styles.greetingSubtitle}>
          {stats.activeCourses} active course{stats.activeCourses === 1 ? '' : 's'}
          {stats.archivedCourses > 0 && `, ${stats.archivedCourses} archived`}
        </p>
      </div>

      {/* ── Summary strip ───────────────────────────────────────────────── */}
      <motion.div
        className={styles.summaryStrip}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className={styles.summaryCardBrand}>
          <span className={styles.summaryValue}>{stats.activeCourses}</span>
          <span className={styles.summaryLabel}>Active courses</span>
        </div>
        <div className={styles.summaryCardAccent}>
          <span className={styles.summaryValue}>{stats.totalStudents}</span>
          <span className={styles.summaryLabel}>Total students</span>
        </div>
        <div className={styles.summaryCardWarning}>
          <span className={styles.summaryValue}>{stats.totalAssignments}</span>
          <span className={styles.summaryLabel}>Total assignments</span>
        </div>
        <div className={styles.summaryCardNeutral}>
          <span className={styles.summaryValue}>{stats.archivedCourses}</span>
          <span className={styles.summaryLabel}>Archived</span>
        </div>
      </motion.div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      {(courses.length > 5 || uniquePeriods.length > 1) && (
        <div className={styles.filterBar}>
          {courses.length > 5 && (
            <Input
              className={styles.searchInput}
              placeholder="Search courses..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              aria-label="Search courses"
            />
          )}
          {uniquePeriods.length > 1 && (
            <div className={styles.periodFilters} role="group" aria-label="Filter by period">
              {uniquePeriods.map((period) => (
                <button
                  key={period}
                  type="button"
                  className={selectedPeriod === period ? styles.periodPillActive : styles.periodPill}
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

      {/* ── Active courses ──────────────────────────────────────────────── */}
      {filteredActive.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Courses</h2>
            <span className={styles.sectionCount}>{filteredActive.length}</span>
          </div>
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
                  className={styles.courseCard}
                  onMouseEnter={() => prefetchCourse(course)}
                >
                  <div className={styles.courseCardHeader}>
                    <h3 className={styles.courseCardName}>{course.name}</h3>
                    <div className={styles.courseCardBadges}>
                      <span className={styles.courseCardPeriod}>{course.period}</span>
                    </div>
                  </div>
                  <div className={styles.courseCardStats}>
                    <span className={styles.courseCardStat}>
                      <BookOutlined className={styles.courseCardStatIcon} />
                      {course.assignments?.length ?? 0} assignment{(course.assignments?.length ?? 0) === 1 ? '' : 's'}
                    </span>
                    <span className={styles.courseCardStat}>
                      <TeamOutlined className={styles.courseCardStatIcon} />
                      {course.studentCount ?? 0} student{(course.studentCount ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
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
        >
          <div className={styles.sectionHeader}>
            <FolderOutlined style={{ color: 'var(--sc-ink-faint)' }} />
            <h2 className={styles.sectionTitle}>Archived</h2>
            <span className={styles.sectionCount}>{filteredArchived.length}</span>
          </div>
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
                  className={styles.courseCardArchived}
                  onMouseEnter={() => prefetchCourse(course)}
                >
                  <div className={styles.courseCardHeader}>
                    <h3 className={styles.courseCardName}>{course.name}</h3>
                    <div className={styles.courseCardBadges}>
                      <span className={styles.courseCardArchivedBadge}>Archived</span>
                      <span className={styles.courseCardPeriod}>{course.period}</span>
                    </div>
                  </div>
                  <div className={styles.courseCardStats}>
                    <span className={styles.courseCardStat}>
                      <BookOutlined className={styles.courseCardStatIcon} />
                      {course.assignments?.length ?? 0} assignment{(course.assignments?.length ?? 0) === 1 ? '' : 's'}
                    </span>
                    <span className={styles.courseCardStat}>
                      <TeamOutlined className={styles.courseCardStatIcon} />
                      {course.studentCount ?? 0} student{(course.studentCount ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── No search results ───────────────────────────────────────────── */}
      {searchText && filteredActive.length === 0 && filteredArchived.length === 0 && (
        <div className={styles.emptyState}>
          <SearchOutlined className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>No courses found</h2>
          <p className={styles.emptySubtext}>Try a different search term.</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
