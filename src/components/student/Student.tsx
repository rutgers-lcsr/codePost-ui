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
  InboxOutlined,
  LeftOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';

/* antd imports */
import { Button, Modal, Spin, message } from 'antd';

/* other library imports */
import { Link, useNavigate } from 'react-router-dom';

/* codePost imports */
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import CPFlex from '../core/CPFlex';

import { USER_TYPE } from '../../types/common';

import { Assignment, UploadFile as SubmissionUploadFile } from '../../types/common';
import { AssignmentsApi, Configuration, Course, StudentSubmission, Submission } from '../../api-client';
import type {
  StudentUploadCreateRequest,
  StudentUploadPartialUpdateRequest,
} from '../../api-client/apis/AssignmentsApi';
import { getAuthToken } from '../../utils/auth';
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
import styles from './StudentConsole.module.scss';
import SubmissionCelebration from './SubmissionCelebration';

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

interface SubmissionHistoryItem {
  student: string;
  hasViewed: boolean;
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

const fetchSubmissions = async (assignmentId: number, student: string): Promise<Submission[]> => {
  const res = await fetch(
    `${process.env.REACT_APP_API_URL}/assignments/${assignmentId}/submissions/?student=${student}&compact=1`,
    {
      headers: getHeaders(),
      method: 'GET',
    },
  );
  if (res.ok) {
    return res.json();
  }
  return [];
};

const fetchHistory = async (submissionId: number, student: string): Promise<SubmissionHistoryItem[]> => {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/submissions/${submissionId}/history/?student=${student}`, {
    headers: getHeaders(),
    method: 'GET',
  });
  if (res.ok) {
    return res.json();
  }
  return [];
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

const getAssignmentsApi = () => {
  return new AssignmentsApi(
    new Configuration({
      basePath: process.env.REACT_APP_API_URL,
      accessToken: getAuthToken(),
    }),
  );
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
  const api = getAssignmentsApi();
  const created = await api.studentUploadCreate({ id: assignmentId, assignment: payload });
  return toSubmission(created);
};

const updateStudentUpload = async (
  assignmentId: number,
  payload: NonNullable<StudentUploadPartialUpdateRequest['patchedAssignment']>,
): Promise<Submission> => {
  const api = getAssignmentsApi();
  const updated = await api.studentUploadPartialUpdate({ id: assignmentId, patchedAssignment: payload });
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

  // State
  const [assignments, setAssignments] = useState<Record<number, Assignment[]>>({});
  const [submissions, setSubmissions] = useState<Record<number, Submission[]>>({});
  const [viewsBySubmission, setViewsBySubmission] = useState<{ [submissionID: number]: boolean }>({});
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [currentPanel, setCurrentPanel] = useState<CURRENT_PANEL>(CURRENT_PANEL.TABLE);
  const [detailAssignment, setDetailAssignment] = useState<Assignment | undefined>(undefined);
  const [detailSubmission, setDetailSubmission] = useState<Submission | undefined>(undefined);
  const [showCelebration, setShowCelebration] = useState(false);

  // Set document title
  useEffect(() => {
    document.title = 'codePost - Student Console';
  }, []);

  /***********************************************************************************
   * Loading methods
   **********************************************************************************/

  const loadAssignments = useCallback(
    async (courses: Course[]): Promise<Record<number, Assignment[]>> => {
      const api = getAssignmentsApi();
      const assignmentArrays = await Promise.all(
        courses.map(async (course: Course) => Promise.all(course.assignments.map((id) => api.retrieve({ id })))),
      );

      const result: Record<number, Assignment[]> = {};
      courses.forEach((course, i) => {
        result[course.id] = (assignmentArrays[i] as unknown as Assignment[]).filter(
          (a) =>
            a.isVisible &&
            !(a.hideFrom ?? []).some((shouldHide: number) => user.studentSections.indexOf(shouldHide) > -1),
        );
      });

      return result;
    },
    [user.studentSections],
  );

  const loadSubmissions = useCallback(
    async (assignmentList: Assignment[]): Promise<Record<number, Submission[]>> => {
      const submissionsMap: Record<number, Submission[]> = {};

      // Filter to eligible assignments and fetch in parallel batches
      const eligible = assignmentList.filter((a) => a.isReleased || a.allowStudentUpload || a.liveFeedbackMode);
      const batchSize = 6;
      for (let i = 0; i < eligible.length; i += batchSize) {
        const batch = eligible.slice(i, i + batchSize);
        const results = await Promise.all(batch.map((a) => fetchSubmissions(a.id, user.email!)));
        batch.forEach((a, idx) => {
          submissionsMap[a.id] = results[idx];
        });
      }
      return submissionsMap;
    },
    [user.email],
  );

  const loadHistories = useCallback(
    async (
      submissionsMap: Record<number, Submission[]>,
      email: string,
    ): Promise<{ [submissionID: number]: boolean }> => {
      const viewMap: { [submissionID: number]: boolean } = {};
      const entries = Object.values(submissionsMap).filter((subs) => subs.length > 0);
      const batchSize = 6;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const results = await Promise.all(batch.map((subs) => fetchHistory(subs[0].id, email)));
        batch.forEach((subs, idx) => {
          for (const historyItem of results[idx]) {
            if (historyItem.student === email) {
              viewMap[subs[0].id] = historyItem.hasViewed;
            }
          }
        });
      }
      return viewMap;
    },
    [],
  );

  /***********************************************************************************
   * Main load function
   **********************************************************************************/

  const load = useCallback(async () => {
    const loadedAssignments = await loadAssignments(initialCourses);
    setAssignments(loadedAssignments);
    setIsLoadingAssignments(false);

    if (currentCourse) {
      // Handle shortcutting to a specific assignment
      if (uploadShortcut !== undefined && !currentCourse.assignments.includes(uploadShortcut.assignmentID)) {
        const foundCourse = initialCourses.find((course: Course) => {
          return course.assignments.includes(uploadShortcut.assignmentID);
        });

        if (foundCourse !== undefined) {
          const link = encodedCourseLink('student', foundCourse);
          navigate(link);
        }
      }

      const loadedSubmissions = await loadSubmissions(loadedAssignments[currentCourse.id]);
      const viewMap = await loadHistories(loadedSubmissions, user.email!);

      // Open the upload panel for the specified assignment
      if (uploadShortcut !== undefined) {
        const assignment = loadedAssignments[currentCourse.id].find((a: Assignment) => {
          return a.id === uploadShortcut.assignmentID;
        });

        if (assignment !== undefined) {
          let submission;
          if (
            Object.prototype.hasOwnProperty.call(loadedSubmissions, assignment.id) &&
            loadedSubmissions[assignment.id].length > 0
          ) {
            submission = loadedSubmissions[assignment.id][0];
          }

          // We'll call changePanel after it's defined
          setCurrentPanel(CURRENT_PANEL.UPLOADFILES);
          setDetailAssignment(assignment);
          setDetailSubmission(submission as Submission); // Cast to submission
        }
      }

      setSubmissions(loadedSubmissions);
      setViewsBySubmission(viewMap);
      setIsLoadingSubmissions(false);
    }
  }, [
    loadAssignments,
    loadSubmissions,
    loadHistories,
    initialCourses,
    currentCourse,
    uploadShortcut,
    user.email,
    navigate,
  ]);

  // Load data on mount and when uploadShortcut changes
  useEffect(() => {
    load();
  }, [load]);

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
        setSubmissions((prevSubmissions) => ({
          ...prevSubmissions,
          [assignment.id]: [newSub],
        }));
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
    if (!currentCourse || !assignments[currentCourse.id]) return null;

    const assignmentList = sortAssignments(assignments[currentCourse.id]);
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
  }, [currentCourse, assignments, submissions, getSubmissionStatus]);

  // Progress calculation
  const progress = useMemo(() => {
    if (!groupedSections) return { completed: 0, total: 0, percent: 0 };
    const total = groupedSections.all.filter(
      (a) => getSubmissionStatus(a, submissions[a.id]?.[0]) !== SubmissionStatus.NOT_PUBLISHED,
    ).length;
    const done = groupedSections.completed.length;
    return { completed: done, total, percent: total > 0 ? (done / total) * 100 : 0 };
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
              ? () => {
                  markViewed(submission).then(() => openSubmissionInSameTab(submission.id));
                }
              : undefined
          }
          onViewFiles={
            status === SubmissionStatus.NOT_REVIEWED && submission
              ? () => openSubmissionInSameTab(submission.id)
              : undefined
          }
          onUpload={
            assignment.allowStudentUpload
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
            assignment.files && assignment.files.length > 0
              ? () => downloadAssignment(assignment.id, assignment.name)
              : undefined
          }
        />
      );
    },
    [submissions, getSubmissionStatus, user.email, markViewed, changePanel, downloadAssignment, currentCourse],
  );

  // Render content
  let studentContent;
  if (!currentCourse) {
    studentContent = (
      <div className={styles.console}>
        <div className={styles.emptyState}>
          <InboxOutlined className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Select a course</h2>
          <p className={styles.emptySubtext}>Choose a course from the menu above to view your assignments.</p>
        </div>
      </div>
    );
  } else if (!assignments[currentCourse.id]) {
    studentContent = (
      <div className={styles.console}>
        <div className={styles.loadingState}>
          <Spin size="large" />
        </div>
      </div>
    );
  } else {
    const lateDayCredits = getLateDayCreditsComponent();
    const assignmentList = assignments[currentCourse.id];

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
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.courseName}>{currentCourse.name}</h1>
              <p className={styles.coursePeriod}>{currentCourse.period}</p>
            </div>
            <div className={styles.headerMeta}>
              {lateDayCredits && (
                <div className={styles.lateCreditsPill}>
                  <ClockCircleOutlined /> {lateDayCredits}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {hasAssignments && progress.total > 0 && (
            <div className={styles.progressBar}>
              <div className={styles.progressLabel}>
                <span className={styles.progressText}>Course progress &middot; {Math.round(progress.percent)}%</span>
                <span className={styles.progressCount}>
                  {progress.completed} of {progress.total} completed
                </span>
              </div>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-valuenow={progress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className={styles.progressFill} style={{ width: `${Math.max(progress.percent, 2)}%` }} />
              </div>
            </div>
          )}
        </header>

        {/* Loading skeleton */}
        {isLoading && (
          <div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeleton} style={{ marginBottom: 8 }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className={styles.emptyState}>
            <InboxOutlined className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>No assignments yet</h2>
            <p className={styles.emptySubtext}>
              Your instructor hasn&apos;t published any assignments for this course yet. Check back later.
            </p>
          </div>
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
      window.open('https://codepost.cs.rutgers.edu', '_blank');
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
      <button className={styles.celebrationDebugBtn} onClick={() => setShowCelebration(true)}>
        🎉 Test Celebration
      </button>
    </div>
  );
};

const Student = withWindowWatcher(StudentComponent);
export default Student;
