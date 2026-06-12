// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  LeftOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';

/* antd imports */
import { Badge, Button, Card, Empty, Flex, Modal, Skeleton, Spin, Statistic, Tag, Typography, message } from 'antd';

/* other library imports */
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

/* codePost imports */
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import CPFlex from '../core/CPFlex';
import { CLIENT_URL } from '../../config';

import { USER_TYPE } from '../../types/common';

import { Assignment, UploadFile as SubmissionUploadFile } from '../../types/common';
import { Course, StudentSubmission, Submission } from '../../api-client';
import type {
  StudentUploadCreateRequest,
  StudentUploadPartialUpdateRequest,
} from '../../api-client/apis/AssignmentsApi';
import { assignmentsApi } from '../../api-client/clients';
import { getHeaders } from '../../utils/generics';

import CPLayoutAdmin from '../admin/other/CPLayoutAdmin';

import Referral from '../core/Referral';
import RoleMenu from '../core/RoleMenu';

import { openSubmission, openSubmissionInSameTab } from '../admin/other/AdminUtils';

import CPLogo from '../core/CPLogo';

import { IBaseFileUpload } from '../admin/assignments/assignments/SubmissionUpload/FileReader';
import UploadSubmissionDialog from '../admin/assignments/assignments/SubmissionUpload/UploadSubmissionDialog';

import { IComponentProps } from '../core/ComponentManager';

import CourseMenu, { encodedCourseLink } from '../core/CourseMenu';

import AssignmentRow from './AssignmentRow';
import { SubmissionStatus } from './submissionStatus';
import AssignmentSection from './AssignmentSection';
import styles from './Student.module.scss';
import SubmissionCelebration from './SubmissionCelebration';
import { usePermissionsStore, selectCaps } from '../../stores/usePermissionsStore';
import {
  useStudentAssignmentsQuery,
  useStudentSubmissionsQuery,
  useSubmissionHistoriesQuery,
  fetchSubmissions,
  fetchHistory,
} from './hooks';
import { studentKeys } from '../../lib/queryKeys';

/**********************************************************************************************************************/

interface IStudentProps {
  uploadShortcut?: {
    assignmentID: number;
    files: IBaseFileUpload[];
  };
}

enum CURRENT_PANEL {
  TABLE,
  UPLOADFILES,
  ADDFILES,
}

// Constants
const CODE_IN_PLACE_COURSE_ID = 925;

type StudentProps = IComponentProps & IWithWindowWatcherProps & IStudentProps;

// Types
// Helper functions
const getFileExtensionFromName = (fileName: string): string => {
  const split = fileName.split('.');
  return split.length === 1 ? 'txt' : split[split.length - 1];
};

const sortAssignments = <T extends { sortKey?: number; id: number }>(objs: T[]): T[] => {
  return objs.sort((a, b) => {
    if (a.sortKey === b.sortKey || !a.sortKey || !b.sortKey) {
      return a.id - b.id;
    }
    return a.sortKey - b.sortKey;
  });
};

const updateHistory = async (
  submissionId: number,
  payload: Record<string, unknown>,
  urlArgs: Record<string, string>,
): Promise<unknown> => {
  const params = Object.keys(urlArgs)
    .map((key, i) => (i === 0 ? `?${key}=${urlArgs[key]}` : `&${key}=${urlArgs[key]}`))
    .join('');

  const res = await fetch(`${process.env.REACT_APP_API_URL}/submissions/${submissionId}/history/${params}`, {
    headers: getHeaders(),
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    return res.json();
  }
  return [];
};

const toSubmission = (submission: StudentSubmission): Submission => {
  return {
    ...(submission as unknown as Submission),
    dateEdited:
      (submission as unknown as { dateEdited?: string }).dateEdited ??
      submission.dateUploaded ??
      new Date().toISOString(),
  };
};

const createStudentUpload = async (
  assignmentId: number,
  payload: StudentUploadCreateRequest['assignment'],
): Promise<Submission> => {
  const created = await assignmentsApi.studentUploadCreate({ id: assignmentId, assignment: payload });
  return toSubmission(created);
};

const updateStudentUpload = async (
  assignmentId: number,
  payload: NonNullable<StudentUploadPartialUpdateRequest['patchedAssignment']>,
): Promise<Submission> => {
  const updated = await assignmentsApi.studentUploadPartialUpdate({ id: assignmentId, patchedAssignment: payload });
  return toSubmission(updated);
};

const downloadAssignmentZip = async (id: number): Promise<{ zip: string; filename: string }> => {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/assignments/${id}/download/`, {
    headers: getHeaders(),
    method: 'GET',
  });
  if (res.ok) return res.json();
  throw new Error('Failed to download');
};

/**
 * Student Console Component
 * Displays assignments, submissions, and allows students to upload/manage their work
 */
const StudentComponent: React.FC<StudentProps> = (props) => {
  const { initialCourses, currentCourse, user, uploadShortcut, handleLogout } = props;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Subscribe to the permissions cache so capability checks in renderAssignmentRow re-evaluate
  const permissionsCache = usePermissionsStore((s) => s.cache);

  /**** Query-based data fetching ****/
  const assignmentsQuery = useStudentAssignmentsQuery(currentCourse, user.studentSections);
  const currentCourseAssignments = assignmentsQuery.data ?? [];
  const isLoadingAssignments = assignmentsQuery.isPending;

  const submissionsQuery = useStudentSubmissionsQuery(
    currentCourse?.id,
    currentCourseAssignments.length > 0 ? currentCourseAssignments : undefined,
    user.email!,
  );
  const submissions = submissionsQuery.data ?? {};
  const isLoadingSubmissions = submissionsQuery.isPending;

  const historiesQuery = useSubmissionHistoriesQuery(currentCourse?.id, submissionsQuery.data, user.email!);
  const viewsBySubmission = historiesQuery.data ?? {};

  // UI State
  const [currentPanel, setCurrentPanel] = useState<CURRENT_PANEL>(CURRENT_PANEL.TABLE);
  const [detailAssignment, setDetailAssignment] = useState<Assignment | undefined>(undefined);
  const [detailSubmission, setDetailSubmission] = useState<Submission | undefined>(undefined);
  const [showCelebration, setShowCelebration] = useState(false);

  // Set document title
  useEffect(() => {
    document.title = 'codePost - Student Console';
  }, []);

  // Fetch assignment-level permissions when assignments load
  const fetchAssignmentCapabilities = usePermissionsStore((s) => s.fetchAssignmentCapabilities);
  useEffect(() => {
    if (currentCourseAssignments.length === 0) return;
    for (const assignment of currentCourseAssignments) {
      const key = `assignment:${assignment.id}`;
      if (!usePermissionsStore.getState().cache[key]) {
        fetchAssignmentCapabilities(assignment.id);
      }
    }
  }, [currentCourseAssignments, fetchAssignmentCapabilities]);

  // Handle upload shortcut
  useEffect(() => {
    if (!currentCourse || !uploadShortcut || isLoadingAssignments) return;

    // Redirect to correct course if assignment belongs to a different one
    if (!currentCourse.assignments.includes(uploadShortcut.assignmentID)) {
      const foundCourse = initialCourses.find((course: Course) =>
        course.assignments.includes(uploadShortcut.assignmentID),
      );
      if (foundCourse) {
        navigate(encodedCourseLink('student', foundCourse));
      }
      return;
    }

    const assignment = currentCourseAssignments.find((a) => a.id === uploadShortcut.assignmentID);
    if (assignment) {
      const sub = submissions[assignment.id]?.[0];
      setCurrentPanel(CURRENT_PANEL.UPLOADFILES);
      setDetailAssignment(assignment);
      setDetailSubmission(sub);
    }
  }, [
    uploadShortcut,
    currentCourse,
    isLoadingAssignments,
    currentCourseAssignments,
    submissions,
    initialCourses,
    navigate,
  ]);

  /***********************************************************************************
   * Handler methods
   **********************************************************************************/

  const markViewed = useCallback(
    async (submission: Submission) => {
      const history = await fetchHistory(submission.id, user.email!);
      if (history && history[0] && !history[0].hasViewed) {
        return await updateHistory(submission.id, { hasViewed: true }, { student: user.email! });
      }
      return;
    },
    [user.email],
  );

  const changePanel = useCallback(
    async (newPanel: CURRENT_PANEL, assignment?: Assignment, submission?: Submission) => {
      let latestSubmission: Submission | undefined;
      if (submission) {
        const fetchSubs = await fetchSubmissions(submission.assignment, user.email!);
        latestSubmission = fetchSubs.length > 0 ? fetchSubs[0] : undefined;
      }
      setCurrentPanel(newPanel);
      setDetailAssignment(assignment);
      setDetailSubmission(latestSubmission || submission);
    },
    [user.email],
  );

  // Use the extracted helper function
  const getFileExtension = getFileExtensionFromName;

  // Upload a submission as a student
  const uploadSubmission = useCallback(
    (
      isNew: boolean,
      assignment: Assignment,
      partners: string[],
      files: Array<{ name: string; data: string; path: string }>,
      sendConfirmationEmail: boolean = false,
    ) => {
      if (partners.length === 0) {
        return Promise.reject();
      }

      const formattedFiles = files.map((file) => {
        return {
          name: file.name,
          data: file.data,
          extension: getFileExtension(file.name),
          path: file.path,
        };
      });

      const payload = {
        files: formattedFiles,
        sendConfirmationEmail,
      } as unknown as StudentUploadCreateRequest['assignment'];

      const submission1 = isNew
        ? createStudentUpload(assignment.id, payload)
        : updateStudentUpload(assignment.id, payload);

      return submission1.then((newSub) => {
        if (currentCourse) {
          queryClient.setQueryData(
            studentKeys.submissions(currentCourse.id),
            (old: Record<number, Submission[]> | undefined) => ({
              ...(old ?? {}),
              [assignment.id]: [newSub],
            }),
          );
        }
        return newSub;
      });
    },
    [getFileExtension],
  );

  const onUploadSuccess = useCallback(
    (newSubmissionID: number) => {
      if (!detailAssignment) {
        changePanel(CURRENT_PANEL.TABLE, undefined, undefined);
        return;
      }

      setShowCelebration(true);

      if (detailAssignment.liveFeedbackMode) {
        if (localStorage.getItem('source') !== 'codePost') {
          openSubmissionInSameTab(newSubmissionID);
        } else {
          openSubmission(newSubmissionID);
        }
        changePanel(CURRENT_PANEL.TABLE, undefined, undefined);
      }
    },
    [detailAssignment, changePanel],
  );

  /**
   * Downloads assignment files as a zip archive
   */
  const downloadAssignment = useCallback(async (assignmentId: number, assignmentName: string) => {
    try {
      const response = await downloadAssignmentZip(assignmentId);
      const linkSource = `data:application/zip;base64,${response.zip}`;

      const a = document.createElement('a');
      a.href = linkSource;
      a.download = `${assignmentName.replace(/\s+/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      message.error('Failed to download assignment');
    }
  }, []);

  const calculateLateDayCreditsAvailable = useCallback(
    (submissionsMap: Record<number, Submission[]>): number => {
      if (!currentCourse?.lateDayCreditsAllowable) {
        return 0;
      }

      const totalUsed = Object.values(submissionsMap)
        .flat()
        .reduce((sum, sub) => sum + (sub.lateDayCreditsUsed || 0), 0);

      return currentCourse.lateDayCreditsAllowable - totalUsed;
    },
    [currentCourse],
  );

  const getLateDayCreditsComponent = useCallback(() => {
    if (!currentCourse || currentCourse.lateDayCreditsAllowable === null) {
      return null;
    }

    const lateDayCreditsAvailable = calculateLateDayCreditsAvailable(submissions);

    return <div>Late Day Credits: {isLoadingSubmissions ? '--' : lateDayCreditsAvailable}</div>;
  }, [currentCourse, calculateLateDayCreditsAvailable, submissions, isLoadingSubmissions]);

  /***********************************************************************************
  /* Render function
  /**********************************************************************************/

  // Helper to determine submission status
  const getSubmissionStatus = useCallback(
    (assignment: Assignment, submission?: Submission): SubmissionStatus => {
      // Not published only if none of the student-facing modes are enabled
      if (!assignment.isReleased && !assignment.liveFeedbackMode && !assignment.allowStudentUpload) {
        return SubmissionStatus.NOT_PUBLISHED;
      }
      if (!submission) {
        return SubmissionStatus.NO_SUBMISSION;
      }
      // feedbackReleased is a separate flag from isReleased — feedback can be
      // withheld even after the assignment is released for uploads.
      const isFeedbackAvailable = submission.isFinalized || assignment.liveFeedbackMode || assignment.feedbackReleased;
      if (!isFeedbackAvailable) {
        return SubmissionStatus.NOT_REVIEWED;
      }
      const isViewed = !(submission.id in viewsBySubmission) || viewsBySubmission[submission.id];
      return isViewed ? SubmissionStatus.SUBMITTED : SubmissionStatus.PENDING;
    },
    [viewsBySubmission],
  );

  // Group assignments into temporal sections
  const groupedSections = useMemo(() => {
    if (!currentCourse || currentCourseAssignments.length === 0) return null;

    const assignmentList = sortAssignments(currentCourseAssignments);
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const overdue: Assignment[] = [];
    const dueToday: Assignment[] = [];
    const dueSoon: Assignment[] = [];
    const upcoming: Assignment[] = [];
    const completed: Assignment[] = [];
    const unpublished: Assignment[] = [];

    for (const assignment of assignmentList) {
      const submission = assignment.id in submissions ? submissions[assignment.id][0] : undefined;
      const status = getSubmissionStatus(assignment, submission);

      if (status === SubmissionStatus.NOT_PUBLISHED) {
        unpublished.push(assignment);
      } else if (
        status === SubmissionStatus.SUBMITTED ||
        status === SubmissionStatus.NOT_REVIEWED ||
        status === SubmissionStatus.PENDING
      ) {
        completed.push(assignment);
      } else if (assignment.uploadDueDate) {
        const dueDate = new Date(assignment.uploadDueDate);
        if (dueDate < now) {
          // Past due date — overdue if no submission, due today if within last 24h
          if (dueDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
            dueToday.push(assignment);
          } else {
            overdue.push(assignment);
          }
        } else if (dueDate <= endOfToday) {
          dueToday.push(assignment);
        } else if (dueDate <= weekFromNow) {
          dueSoon.push(assignment);
        } else {
          upcoming.push(assignment);
        }
      } else {
        upcoming.push(assignment);
      }
    }

    return { overdue, dueToday, dueSoon, upcoming, completed, unpublished, all: assignmentList };
  }, [currentCourse, currentCourseAssignments, submissions, getSubmissionStatus]);

  // Summary stats (mirrors the dashboard's summary card)
  const stats = useMemo(() => {
    if (!groupedSections) return { dueToday: 0, newFeedback: 0, completed: 0, total: 0, percent: 0 };
    let newFeedback = 0;
    let total = 0;
    for (const a of groupedSections.all) {
      const status = getSubmissionStatus(a, submissions[a.id]?.[0]);
      if (status !== SubmissionStatus.NOT_PUBLISHED) total++;
      if (status === SubmissionStatus.PENDING) newFeedback++;
    }
    const completed = groupedSections.completed.length;
    return {
      dueToday: groupedSections.dueToday.length,
      newFeedback,
      completed,
      total,
      percent: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [groupedSections, submissions, getSubmissionStatus]);

  // Build a row for an assignment (shared renderer)
  const renderAssignmentRow = useCallback(
    (assignment: Assignment, opts: { showPartners: boolean; showStats: boolean; showUpload: boolean }) => {
      const submission = assignment.id in submissions ? submissions[assignment.id][0] : undefined;
      const status = getSubmissionStatus(assignment, submission);
      const students = submission?.students || [];
      const partners = students.filter((s: string | null) => s && s !== user.email) as string[];
      const isDisabled = status === SubmissionStatus.NOT_PUBLISHED;

      return (
        <AssignmentRow
          key={assignment.id}
          assignmentName={assignment.name}
          status={status}
          grade={submission?.grade ?? null}
          maxPoints={assignment.points}
          partners={partners}
          meanGrade={assignment.mean}
          medianGrade={assignment.median}
          dueDate={assignment.uploadDueDate}
          uploadDate={submission?.dateUploaded}
          showStats={opts.showStats}
          showPartners={opts.showPartners && partners.length > 0}
          showUpload={opts.showUpload && assignment.allowStudentUpload}
          allowStudentUpload={assignment.allowStudentUpload}
          hasExistingSubmission={submission !== undefined}
          hasDownload={assignment.files && assignment.files.length > 0}
          liveFeedbackMode={assignment.liveFeedbackMode}
          isFinalized={submission?.isFinalized ?? false}
          hideGrades={assignment.hideGrades}
          hideDueDate={currentCourse?.id === CODE_IN_PLACE_COURSE_ID}
          disabled={isDisabled}
          onViewFeedback={
            (status === SubmissionStatus.SUBMITTED || status === SubmissionStatus.PENDING) && submission
              ? (e) => {
                  const newTab = e.button === 1;
                  markViewed(submission).then(() =>
                    newTab ? openSubmission(submission.id) : openSubmissionInSameTab(submission.id),
                  );
                }
              : undefined
          }
          onViewFiles={
            status === SubmissionStatus.NOT_REVIEWED && submission
              ? (e) => {
                  const newTab = e.button === 1;
                  if (newTab) openSubmission(submission.id);
                  else openSubmissionInSameTab(submission.id);
                }
              : undefined
          }
          onUpload={
            assignment.allowStudentUpload &&
            selectCaps(usePermissionsStore.getState(), `assignment:${assignment.id}`).upload_submission === true
              ? () => {
                  if (submission && assignment.liveFeedbackMode) {
                    Modal.confirm({
                      title: 'Confirm file replacement',
                      content: (
                        <div>
                          <p>
                            If you replace your files, it will delete existing files and file versions, including any
                            comments on those files.
                          </p>
                          <p>
                            If you want to add a file to your submission or update a file click &apos;Add/Update
                            files&apos; instead.
                          </p>
                          <p>
                            <b>Are you sure you want to continue?</b>
                          </p>
                        </div>
                      ),
                      okText: 'Continue',
                      cancelText: 'Cancel',
                      onOk: () => changePanel(CURRENT_PANEL.UPLOADFILES, assignment, submission),
                    });
                  } else {
                    changePanel(CURRENT_PANEL.UPLOADFILES, assignment, submission);
                  }
                }
              : undefined
          }
          onAddFiles={
            assignment.liveFeedbackMode && submission && !submission.isFinalized
              ? () => changePanel(CURRENT_PANEL.ADDFILES, assignment, submission)
              : undefined
          }
          onDownload={
            assignment.files &&
            assignment.files.length > 0 &&
            selectCaps(usePermissionsStore.getState(), `assignment:${assignment.id}`).download_assignment_files === true
              ? () => downloadAssignment(assignment.id, assignment.name)
              : undefined
          }
        />
      );
    },
    [
      submissions,
      getSubmissionStatus,
      user.email,
      markViewed,
      changePanel,
      downloadAssignment,
      currentCourse,
      permissionsCache,
    ],
  );

  // Render content
  let studentContent;
  if (!currentCourse) {
    studentContent = (
      <div className={styles.console}>
        <Flex justify="center" align="center" style={{ minHeight: 400 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Choose a course from the menu above to view your assignments."
          />
        </Flex>
      </div>
    );
  } else if (isLoadingAssignments) {
    studentContent = (
      <div className={styles.console}>
        <Flex justify="center" align="center" style={{ minHeight: 400 }}>
          <Spin size="large" />
        </Flex>
      </div>
    );
  } else {
    const lateDayCredits = getLateDayCreditsComponent();
    const assignmentList = currentCourseAssignments;

    const defaultFiles =
      uploadShortcut !== undefined &&
      detailAssignment !== undefined &&
      uploadShortcut.assignmentID === detailAssignment.id
        ? uploadShortcut.files
        : undefined;

    const visibleAssignments = assignmentList.filter((assn) => assn.isVisible);
    const showPartners = visibleAssignments.some((assn) => {
      const hidePartners = assn.allowStudentUpload && !assn.allowStudentUploadWithPartners;
      return !hidePartners;
    });
    const showStats = !!(
      currentCourse.showStudentsStatistics && visibleAssignments.some((assn) => assn.mean || assn.median)
    );
    const showUpload = visibleAssignments.some((assn) => assn.allowStudentUpload);
    const rowOpts = { showPartners, showStats, showUpload };

    const isLoading = isLoadingAssignments || isLoadingSubmissions;
    const isEmpty = !isLoading && assignmentList.length === 0;
    const hasAssignments = !isLoading && assignmentList.length > 0 && groupedSections;

    studentContent = (
      <div className={styles.console}>
        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <Flex justify="space-between" align="flex-start">
            <div>
              <Typography.Title level={2} style={{ margin: 0, fontSize: 28 }}>
                {currentCourse.name}
              </Typography.Title>
              {currentCourse.period && (
                <Typography.Text type="secondary" style={{ fontSize: 15 }}>
                  {currentCourse.period}
                </Typography.Text>
              )}
            </div>
            {lateDayCredits && (
              <Tag icon={<ClockCircleOutlined />} color="blue">
                {lateDayCredits}
              </Tag>
            )}
          </Flex>
        </header>

        {/* Summary stats */}
        {hasAssignments && stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <Card style={{ marginBottom: 32, padding: '8px 0' }}>
              <Flex justify="space-evenly" wrap="wrap" gap={24} style={{ maxWidth: 600, margin: '0 auto' }}>
                <Statistic
                  title="Due today"
                  value={stats.dueToday}
                  valueStyle={{ color: stats.dueToday > 0 ? '#ff4d4f' : undefined }}
                />
                <Statistic
                  title="New feedback"
                  value={stats.newFeedback}
                  valueStyle={{ color: stats.newFeedback > 0 ? '#1677ff' : undefined }}
                  suffix={stats.newFeedback > 0 ? <Badge status="processing" /> : undefined}
                />
                <Statistic
                  title="Completed"
                  value={stats.completed}
                  suffix={`/ ${stats.total}`}
                  valueStyle={{ color: '#198665' }}
                />
                <Statistic title="Progress" value={Math.round(stats.percent)} suffix="%" />
              </Flex>
            </Card>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {isLoading && <Skeleton active paragraph={{ rows: 6 }} />}

        {/* Empty state */}
        {isEmpty && (
          <Flex justify="center" align="center" style={{ minHeight: 300 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Your instructor hasn't published any assignments for this course yet. Check back later."
            />
          </Flex>
        )}

        {/* Assignment sections */}
        {hasAssignments && (
          <>
            <AssignmentSection
              title="Overdue"
              count={groupedSections.overdue.length}
              variant="overdue"
              icon={<ExclamationCircleOutlined />}
            >
              {groupedSections.overdue.map((a) => renderAssignmentRow(a, rowOpts))}
            </AssignmentSection>

            <AssignmentSection
              title="Due Today"
              count={groupedSections.dueToday.length}
              variant="dueToday"
              icon={<ClockCircleOutlined />}
            >
              {groupedSections.dueToday.map((a) => renderAssignmentRow(a, rowOpts))}
            </AssignmentSection>

            <AssignmentSection
              title="Due This Week"
              count={groupedSections.dueSoon.length}
              variant="dueSoon"
              icon={<FireOutlined />}
            >
              {groupedSections.dueSoon.map((a) => renderAssignmentRow(a, rowOpts))}
            </AssignmentSection>

            <AssignmentSection
              title="Upcoming"
              count={groupedSections.upcoming.length}
              variant="upcoming"
              icon={<CalendarOutlined />}
            >
              {groupedSections.upcoming.map((a) => renderAssignmentRow(a, rowOpts))}
            </AssignmentSection>

            <AssignmentSection
              title="Completed"
              count={groupedSections.completed.length}
              variant="completed"
              icon={<CheckCircleOutlined />}
              defaultCollapsed={groupedSections.completed.length > 3}
            >
              {groupedSections.completed.map((a) => renderAssignmentRow(a, rowOpts))}
            </AssignmentSection>

            <AssignmentSection
              title="Not Yet Published"
              count={groupedSections.unpublished.length}
              variant="unpublished"
              icon={<StopOutlined />}
            >
              {groupedSections.unpublished.map((a) => renderAssignmentRow(a, rowOpts))}
            </AssignmentSection>
          </>
        )}

        {/* Upload Dialog */}
        <UploadSubmissionDialog
          isVisible={currentPanel === CURRENT_PANEL.UPLOADFILES || currentPanel === CURRENT_PANEL.ADDFILES}
          onCancel={() => changePanel(CURRENT_PANEL.TABLE, detailAssignment, undefined)}
          assignments={assignmentList}
          selectedAssignment={detailAssignment}
          students={[]}
          selectedStudents={
            detailSubmission && detailSubmission.students
              ? (detailSubmission.students.filter((s) => s !== null) as string[])
              : [user.email!]
          }
          submissions={
            (detailSubmission
              ? { [user.email!]: { [detailSubmission.assignment]: detailSubmission } }
              : { [user.email!]: {} }) as unknown as Record<string, Record<number, StudentSubmission>>
          }
          uploadSubmission={(
            assignment: Assignment,
            partners: string[],
            files: SubmissionUploadFile[],
            sendConfirmationEmail?: boolean,
          ) =>
            uploadSubmission(
              currentPanel !== CURRENT_PANEL.ADDFILES,
              assignment,
              partners,
              files.map((file) => ({
                name: file.name,
                data: file.data ?? '',
                path: file.path ?? '',
              })),
              sendConfirmationEmail ?? false,
            )
          }
          disableStudentSelect={true}
          onSuccess={onUploadSuccess}
          isStudent={true}
          defaultFiles={defaultFiles}
        />
      </div>
    );
  }

  /* Build header */
  const openHome = () => {
    if (localStorage.getItem('source') === 'codePost') {
      window.open(CLIENT_URL, '_blank');
    }
  };

  const header = (
    <CPFlex
      left={[
        <CPLogo cpType="dark" key="logo" onClick={openHome} />,
        <Button key="back" type="link" onClick={() => navigate('/student')} style={{ color: 'inherit' }}>
          <LeftOutlined /> Dashboard
        </Button>,
        <CourseMenu key="course" courses={initialCourses} currentCourse={currentCourse} base="student" />,
      ]}
      right={[
        <span key="user" className="cp-label cp-label--bold">
          {user.email}
        </span>,
        <Referral key="referral" user={user} theme="light" />,
        <RoleMenu key="roles" user={user} thisApp={USER_TYPE.STUDENT} theme="light" />,
        <Link className="internal-link" key="settings" to="/settings">
          <SettingOutlined />
        </Link>,
        <Button key="logout" onClick={handleLogout}>
          Log Out
        </Button>,
      ]}
      gutterSize={10}
    />
  );

  return (
    <div id="Student">
      <CPLayoutAdmin
        header={header}
        detail={studentContent}
        navigation={() => null}
        collapsible={true}
        hasSider={false}
        role={USER_TYPE.STUDENT}
      />
      <SubmissionCelebration trigger={showCelebration} onComplete={() => setShowCelebration(false)} />
    </div>
  );
};

const Student = withWindowWatcher(StudentComponent);
export default Student;
