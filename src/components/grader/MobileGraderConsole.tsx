// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React, { useMemo, useState } from 'react';
import {
  ArrowLeftOutlined,
  BookOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  HomeFilled,
  InboxOutlined,
  LogoutOutlined,
  SettingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Card, Empty, Flex, Progress, Segmented, Spin, Statistic, Tag, Typography } from 'antd';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';

import { Course, User } from '../../api-client';
import { Assignment } from '../../types/common';
import { useAssignmentsQuery } from '../admin/hooks/useAssignmentsQuery';
import { renderRoleSwitcher } from '../core/MobileRoleSwitcher';
import { clickableProps } from '../core/clickable';
import styles from './MobileGraderConsole.module.scss';

const { Title, Text } = Typography;

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface MobileGraderConsoleProps {
  courses: Course[];
  userEmail: string;
  user: User;
  onLogout: () => void;
}

type MobileTab = 'home' | 'courses' | 'settings';

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function getGradingProgress(a: Assignment): number {
  const total =
    (a.submissions_finalized_count ?? 0) + (a.submissions_inprogress_count ?? 0) + (a.submissions_unclaimed_count ?? 0);
  if (total === 0) return 0;
  return Math.round(((a.submissions_finalized_count ?? 0) / total) * 100);
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Course Detail                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

const CourseDetail: React.FC<{
  course: Course;
  onBack: () => void;
}> = ({ course, onBack }) => {
  const { data: assignments = [], isLoading } = useAssignmentsQuery(course);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  const filteredAssignments = useMemo(() => {
    if (filter === 'all') return assignments;
    if (filter === 'done') return assignments.filter((a) => getGradingProgress(a) === 100);
    return assignments.filter((a) => getGradingProgress(a) < 100);
  }, [assignments, filter]);

  const totalUnclaimed = assignments.reduce((sum, a) => sum + (a.submissions_unclaimed_count ?? 0), 0);
  const totalInProgress = assignments.reduce((sum, a) => sum + (a.submissions_inprogress_count ?? 0), 0);
  const totalFinalized = assignments.reduce((sum, a) => sum + (a.submissions_finalized_count ?? 0), 0);

  return (
    <div className={styles.scrollContent}>
      {/* Header */}
      <Flex align="center" gap={12} style={{ marginBottom: 20 }}>
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

      {/* Quick stats */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Flex justify="space-around">
          <Statistic
            title="Unclaimed"
            value={totalUnclaimed}
            valueStyle={{ fontSize: 18, color: totalUnclaimed > 0 ? '#fa8c16' : undefined }}
          />
          <Statistic title="In Progress" value={totalInProgress} valueStyle={{ fontSize: 18 }} />
          <Statistic title="Finalized" value={totalFinalized} valueStyle={{ fontSize: 18, color: '#52c41a' }} />
        </Flex>
      </Card>

      {/* Filter */}
      <Segmented
        block
        value={filter}
        onChange={(val) => setFilter(val as 'all' | 'active' | 'done')}
        options={[
          { label: `All (${assignments.length})`, value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Done', value: 'done' },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* Loading */}
      {isLoading && (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin />
        </Flex>
      )}

      {/* Assignments */}
      {!isLoading && filteredAssignments.length > 0 ? (
        <Flex vertical gap={10}>
          <AnimatePresence>
            {filteredAssignments.map((assignment, idx) => {
              const progress = getGradingProgress(assignment);
              const unclaimed = assignment.submissions_unclaimed_count ?? 0;

              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                >
                  <Card size="small">
                    <Flex justify="space-between" align="flex-start" gap={8}>
                      <Text strong style={{ fontSize: 14 }}>
                        {assignment.name}
                      </Text>
                      {progress === 100 ? (
                        <Tag color="success" icon={<CheckCircleFilled />}>
                          Done
                        </Tag>
                      ) : unclaimed > 0 ? (
                        <Tag color="warning">{unclaimed} unclaimed</Tag>
                      ) : (
                        <Tag color="processing">In Progress</Tag>
                      )}
                    </Flex>

                    <Flex gap={12} style={{ marginTop: 6, marginBottom: 10 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined /> {formatDueDate(assignment.uploadDueDate)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <BookOutlined /> {assignment.points} pts
                      </Text>
                    </Flex>

                    {/* Progress bar */}
                    <Flex justify="space-between" style={{ marginBottom: 2 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Grading progress
                      </Text>
                      <Text strong style={{ fontSize: 11 }}>
                        {progress}%
                      </Text>
                    </Flex>
                    <Progress
                      percent={progress}
                      showInfo={false}
                      size="small"
                      status={progress === 100 ? 'success' : 'active'}
                    />

                    {/* Breakdown */}
                    <Flex gap={12} style={{ marginTop: 6 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {assignment.submissions_finalized_count ?? 0} finalized
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {assignment.submissions_inprogress_count ?? 0} in progress
                      </Text>
                      {unclaimed > 0 && (
                        <Text type="warning" style={{ fontSize: 11 }}>
                          <WarningOutlined /> {unclaimed} unclaimed
                        </Text>
                      )}
                    </Flex>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </Flex>
      ) : (
        !isLoading && <Empty description={filter === 'all' ? 'No assignments' : `No ${filter} assignments`} />
      )}

      {!isLoading && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 16 }}>
          To claim and grade submissions, use the desktop version of codePost.
        </Text>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Main Component                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const MobileGraderConsole: React.FC<MobileGraderConsoleProps> = ({ courses, userEmail, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Only greet by name when the email local part looks like a name (netIDs like "mk1800" read oddly)
  const localPart = userEmail.split('@')[0].split('.')[0];
  const displayName = /^[a-z]+$/i.test(localPart) ? localPart.charAt(0).toUpperCase() + localPart.slice(1) : null;

  const activeCourses = useMemo(() => courses.filter((c) => !c.archived), [courses]);
  const archivedCourses = useMemo(() => courses.filter((c) => c.archived), [courses]);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  /* ── Home ────────────────────────────────────────────────────────────── */

  const renderHome = () => (
    <div className={styles.scrollContent}>
      <div style={{ marginBottom: 20 }}>
        <Tag color="blue" style={{ marginBottom: 8 }}>
          Grader
        </Tag>
        <Title level={3} style={{ margin: 0 }}>
          {getGreeting()}
          {displayName ? `, ${displayName}` : ''}
        </Title>
        <Text type="secondary">
          {activeCourses.length} active course{activeCourses.length === 1 ? '' : 's'}
        </Text>
      </div>

      {/* Stats */}
      <Card size="small" style={{ marginBottom: 20 }}>
        <Flex justify="space-around">
          <Statistic title="Courses" value={courses.length} valueStyle={{ fontSize: 20 }} />
          <Statistic title="Active" value={activeCourses.length} valueStyle={{ fontSize: 20, color: '#1677ff' }} />
          <Statistic title="Archived" value={archivedCourses.length} valueStyle={{ fontSize: 20 }} />
        </Flex>
      </Card>

      {/* Course list for quick access */}
      {activeCourses.length > 0 ? (
        <div>
          <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
            <InboxOutlined style={{ color: '#198665' }} />
            <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Courses
            </Text>
          </Flex>

          <Flex vertical gap={8}>
            {activeCourses.map((course) => (
              <Card
                key={course.id}
                size="small"
                hoverable
                {...clickableProps(() => {
                  setSelectedCourseId(course.id);
                  setActiveTab('courses');
                })}
              >
                <Flex justify="space-between" align="center">
                  <div>
                    <Text strong>{course.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {course.period}
                    </Text>
                  </div>
                  <Tag>{(course.assignments ?? []).length} assignments</Tag>
                </Flex>
              </Card>
            ))}
          </Flex>
        </div>
      ) : (
        <Empty description="No active courses" />
      )}
    </div>
  );

  /* ── Courses ─────────────────────────────────────────────────────────── */

  const renderCourses = () => {
    if (selectedCourse) {
      return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourseId(null)} />;
    }

    return (
      <div className={styles.scrollContent}>
        <Title level={4} style={{ marginBottom: 4 }}>
          Courses
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          {activeCourses.length} active, {archivedCourses.length} archived
        </Text>

        <Flex vertical gap={10}>
          {activeCourses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
            >
              <Card size="small" hoverable {...clickableProps(() => setSelectedCourseId(course.id))}>
                <Flex justify="space-between" align="center">
                  <div>
                    <Text strong>{course.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {course.period}
                    </Text>
                  </div>
                  <Tag>{(course.assignments ?? []).length} assignments</Tag>
                </Flex>
              </Card>
            </motion.div>
          ))}

          {archivedCourses.length > 0 && (
            <>
              <Text type="secondary" strong style={{ marginTop: 12, fontSize: 12 }}>
                ARCHIVED
              </Text>
              {archivedCourses.map((course) => (
                <Card key={course.id} size="small" hoverable {...clickableProps(() => setSelectedCourseId(course.id))}>
                  <Flex justify="space-between" align="center">
                    <div>
                      <Text type="secondary">{course.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {course.period}
                      </Text>
                    </div>
                    <Tag>Archived</Tag>
                  </Flex>
                </Card>
              ))}
            </>
          )}
        </Flex>
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
          <Avatar size={44} style={{ background: '#1677ff', flexShrink: 0 }}>
            {(displayName ?? userEmail).charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong>{displayName ?? localPart}</Text>
            <br />
            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {userEmail}
            </Text>
            <br />
            <Tag color="blue" style={{ marginTop: 4 }}>
              Grader
            </Tag>
          </div>
        </Flex>
      </Card>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Flex vertical gap={8}>
          <Flex justify="space-between">
            <Text type="secondary">Active Courses</Text>
            <Text>{activeCourses.length}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text type="secondary">Archived Courses</Text>
            <Text>{archivedCourses.length}</Text>
          </Flex>
        </Flex>
      </Card>

      {renderRoleSwitcher(user, 'grader')}

      <Button danger block icon={<LogoutOutlined />} onClick={onLogout} style={{ marginBottom: 16 }}>
        Log Out
      </Button>

      <Text type="secondary" style={{ fontSize: 12 }}>
        To change account settings or manage grading preferences, access the full desktop version of codePost.
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

        <nav className={styles.bottomNav} aria-label="Main navigation">
          <button
            type="button"
            className={styles.navItem}
            data-active={activeTab === 'home' ? 'true' : 'false'}
            aria-current={activeTab === 'home' ? 'page' : undefined}
            onClick={() => setActiveTab('home')}
            aria-label="Home"
          >
            <HomeFilled className={styles.navIcon} />
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

export default MobileGraderConsole;
