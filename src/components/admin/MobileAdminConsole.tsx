// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOutlined,
  FolderOutlined,
  InboxOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { AnimatePresence, motion } from 'motion/react';

import { Course } from '../../api-client';
import { encodedCourseLink } from '../core/CourseMenu';
import { useAdminDashboardData } from './useAdminDashboardData';
import styles from './MobileAdminConsole.module.scss';

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface MobileAdminConsoleProps {
  courses: Course[];
  userEmail: string;
}

type AdminTab = 'courses' | 'settings';

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

const MobileAdminConsole: React.FC<MobileAdminConsoleProps> = ({ courses, userEmail }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('courses');
  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const { stats, activeCourses, archivedCourses } = useAdminDashboardData(courses);

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
        <main className={styles.main}>
          <div className={styles.scrollContent}>
            <div className={styles.emptyState}>
              <InboxOutlined className={styles.emptyIcon} />
              <h2 className={styles.emptyTitle}>No courses yet</h2>
              <p className={styles.emptySubtext}>Create your first course to get started.</p>
            </div>
          </div>
        </main>
        <nav className={styles.bottomNav} aria-label="Main navigation">
          <button className={styles.navItem} data-active="true" aria-label="Courses" aria-current="page">
            <BookOutlined className={styles.navIcon} />
            <span className={styles.navLabel}>Courses</span>
          </button>
          <button className={styles.navItem} aria-label="Settings">
            <SettingOutlined className={styles.navIcon} />
            <span className={styles.navLabel}>Settings</span>
          </button>
        </nav>
      </div>
    );
  }

  /* ── Courses tab ─────────────────────────────────────────────────────── */

  const renderCourses = () => (
    <div className={styles.scrollContent}>
      {/* Header */}
      <header className={styles.hero}>
        <span className={styles.roleChip}>Admin</span>
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
          Manage {stats.activeCourses} course{stats.activeCourses === 1 ? '' : 's'}
        </motion.p>
      </header>

      {/* Stats */}
      <motion.div
        className={styles.statsRow}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <div className={styles.statChip} data-variant="brand">
          <span className={styles.statValue}>{stats.activeCourses}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statChip} data-variant="accent">
          <span className={styles.statValue}>{stats.totalStudents}</span>
          <span className={styles.statLabel}>Students</span>
        </div>
        <div className={styles.statChip} data-variant="secondary">
          <span className={styles.statValue}>{stats.totalAssignments}</span>
          <span className={styles.statLabel}>Assignments</span>
        </div>
        <div className={styles.statChip} data-variant="neutral">
          <span className={styles.statValue}>{stats.archivedCourses}</span>
          <span className={styles.statLabel}>Archived</span>
        </div>
      </motion.div>

      {/* Search + Filter */}
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

      {/* Active courses */}
      {filteredActive.length > 0 && (
        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className={styles.sectionHead}>
            <BookOutlined className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Active Courses</h2>
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
                  <Link to={encodedCourseLink('admin', course, 'assignments/overview')} className={styles.courseCard}>
                    <div className={styles.courseCardTop}>
                      <h3 className={styles.courseName}>{course.name}</h3>
                      <span className={styles.coursePeriod}>{course.period}</span>
                    </div>
                    <div className={styles.courseCardBottom}>
                      <span className={styles.courseStat}>
                        <TeamOutlined /> {course.studentCount ?? 0} students
                      </span>
                      <span className={styles.courseStat}>
                        <BookOutlined /> {course.assignments?.length ?? 0} assignments
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      )}

      {/* Archived */}
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
                      to={encodedCourseLink('admin', course, 'assignments/overview')}
                      className={styles.courseCard}
                      data-archived="true"
                    >
                      <div className={styles.courseCardTop}>
                        <h3 className={styles.courseName}>{course.name}</h3>
                        <span className={styles.archivedBadge}>Archived</span>
                      </div>
                      <div className={styles.courseCardBottom}>
                        <span className={styles.courseStat}>
                          <TeamOutlined /> {course.studentCount ?? 0} students
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

      {/* No results */}
      {searchText && filteredActive.length === 0 && filteredArchived.length === 0 && (
        <div className={styles.emptyState}>
          <SearchOutlined className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>No courses found</h2>
          <p className={styles.emptySubtext}>Try a different search term.</p>
        </div>
      )}
    </div>
  );

  /* ── Settings tab (lightweight for mobile) ───────────────────────────── */

  const renderSettings = () => (
    <div className={styles.scrollContent}>
      <header className={styles.tabHeader}>
        <h1 className={styles.tabTitle}>Settings</h1>
      </header>

      <div className={styles.settingsList}>
        <p className={styles.settingsNote}>
          Course administration settings are available on desktop. Use the courses tab to manage assignments and view
          submissions.
        </p>
      </div>
    </div>
  );

  /* ── Shell ────────────────────────────────────────────────────────────── */

  return (
    <div className={styles.mobileShell}>
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
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

      {/* Bottom navigation */}
      <nav className={styles.bottomNav} aria-label="Main navigation">
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
        <button
          className={styles.navItem}
          data-active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          aria-label="Settings"
          aria-current={activeTab === 'settings' ? 'page' : undefined}
        >
          <SettingOutlined className={styles.navIcon} />
          <span className={styles.navLabel}>Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default MobileAdminConsole;
