// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React, { useCallback, useState } from 'react';
import { Tooltip } from 'antd';
import {
  DownOutlined,
  UploadOutlined,
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { AnimatePresence, motion } from 'motion/react';
import { CodePostDate } from '../utils/CodepostDate';
import styles from './StudentConsole.module.scss';
import { SubmissionStatus } from './submissionStatus';

interface AssignmentRowProps {
  assignmentName: string;
  status: SubmissionStatus;
  grade?: number | null;
  maxPoints?: number;
  partners?: string[];
  meanGrade?: number | null;
  medianGrade?: number | null;
  dueDate?: string | null;
  uploadDate?: string | null;
  showStats?: boolean;
  showPartners?: boolean;
  showUpload?: boolean;
  allowStudentUpload?: boolean;
  hasExistingSubmission?: boolean;
  hasDownload?: boolean;
  liveFeedbackMode?: boolean;
  isFinalized?: boolean;
  isUrgent?: boolean;
  hideGrades?: boolean;
  hideDueDate?: boolean;
  onViewFeedback?: () => void;
  onViewFiles?: () => void;
  onUpload?: () => void;
  onAddFiles?: () => void;
  onDownload?: () => void;
  disabled?: boolean;
}

const statusPillClass: Record<SubmissionStatus, string> = {
  [SubmissionStatus.SUBMITTED]: styles.statusPillSuccess,
  [SubmissionStatus.PENDING]: styles.statusPillWarning,
  [SubmissionStatus.NOT_REVIEWED]: styles.statusPillNeutral,
  [SubmissionStatus.NOT_PUBLISHED]: styles.statusPillMuted,
  [SubmissionStatus.NO_SUBMISSION]: styles.statusPillDanger,
};

const statusLabel: Record<SubmissionStatus, string> = {
  [SubmissionStatus.SUBMITTED]: 'Graded',
  [SubmissionStatus.PENDING]: 'Grade available',
  [SubmissionStatus.NOT_REVIEWED]: 'Not reviewed yet',
  [SubmissionStatus.NOT_PUBLISHED]: 'Not published',
  [SubmissionStatus.NO_SUBMISSION]: 'No submission',
};

const rowAccentClass: Record<SubmissionStatus, string> = {
  [SubmissionStatus.SUBMITTED]: styles.rowAccentSuccess,
  [SubmissionStatus.PENDING]: styles.rowAccentWarning,
  [SubmissionStatus.NOT_REVIEWED]: styles.rowAccentNeutral,
  [SubmissionStatus.NOT_PUBLISHED]: styles.rowAccentMuted,
  [SubmissionStatus.NO_SUBMISSION]: styles.rowAccentDanger,
};

function getRelativeDueDate(dueDate: string): { text: string; urgent: boolean } {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays <= 7) {
      return { text: absDays === 1 ? '1 day ago' : `${absDays} days ago`, urgent: false };
    }
    return { text: '', urgent: false };
  }
  if (diffDays === 0) return { text: 'Due today', urgent: true };
  if (diffDays === 1) return { text: 'Due tomorrow', urgent: true };
  if (diffDays <= 3) return { text: `Due in ${diffDays} days`, urgent: true };
  if (diffDays <= 7) return { text: `Due in ${diffDays} days`, urgent: false };
  return { text: '', urgent: false };
}

const AssignmentRow: React.FC<AssignmentRowProps> = ({
  assignmentName,
  status,
  grade,
  maxPoints,
  meanGrade,
  medianGrade,
  dueDate,
  showStats = false,
  showUpload = false,
  allowStudentUpload = false,
  hasExistingSubmission = false,
  hasDownload = false,
  liveFeedbackMode = false,
  isFinalized = false,
  hideGrades = false,
  hideDueDate = false,
  onViewFeedback,
  onViewFiles,
  onUpload,
  onAddFiles,
  onDownload,
  disabled = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasGrade = grade !== null && grade !== undefined && maxPoints !== undefined && maxPoints !== null;
  const showAddFiles = liveFeedbackMode && hasExistingSubmission && !isFinalized;

  // Only stats live in the dropdown
  const hasStatsContent = showStats && !hideGrades && (meanGrade || medianGrade);

  const toggle = useCallback(() => {
    if (!disabled && hasStatsContent) setExpanded((prev) => !prev);
  }, [disabled, hasStatsContent]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    },
    [toggle],
  );

  // Due date — rendered inline in subline
  let dueDateFragment: React.ReactNode = null;
  if (dueDate && !hideDueDate) {
    const relative = getRelativeDueDate(dueDate);
    if (relative.text) {
      dueDateFragment = (
        <Tooltip title={<CodePostDate datetime={dueDate} />}>
          <span className={relative.urgent ? styles.rowDueDateUrgent : styles.rowDueDate}>
            <CalendarOutlined /> {relative.text}
          </span>
        </Tooltip>
      );
    } else {
      dueDateFragment = (
        <span className={styles.rowDueDate}>
          <CalendarOutlined /> <CodePostDate datetime={dueDate} />
        </span>
      );
    }
  }

  // Grade
  let gradeContent: React.ReactNode = null;
  if (hideGrades) {
    gradeContent = <span className={styles.rowGradeEmpty} />;
  } else if ((status === SubmissionStatus.SUBMITTED || status === SubmissionStatus.PENDING) && hasGrade) {
    gradeContent = (
      <span className={styles.rowGrade}>
        {grade}/{maxPoints}
      </span>
    );
  } else if (hasGrade && status === SubmissionStatus.NOT_REVIEWED) {
    gradeContent = <span className={styles.rowGradeEmpty}>--</span>;
  } else {
    gradeContent = <span className={styles.rowGradeEmpty} />;
  }

  // Primary action — always visible
  let primaryAction: React.ReactNode = null;
  if ((status === SubmissionStatus.SUBMITTED || status === SubmissionStatus.PENDING) && onViewFeedback) {
    primaryAction = (
      <button
        className={styles.btnPrimaryBrand}
        onClick={(e) => {
          e.stopPropagation();
          onViewFeedback();
        }}
        aria-label={`View feedback for ${assignmentName}`}
      >
        <EyeOutlined /> View Feedback
      </button>
    );
  } else if (status === SubmissionStatus.NOT_REVIEWED && onViewFiles) {
    primaryAction = (
      <button
        className={styles.btnSecondary}
        onClick={(e) => {
          e.stopPropagation();
          onViewFiles();
        }}
        aria-label={`View files for ${assignmentName}`}
      >
        <EyeOutlined /> View Files
      </button>
    );
  } else if (status === SubmissionStatus.NO_SUBMISSION && allowStudentUpload && onUpload) {
    primaryAction = (
      <button
        className={styles.btnPrimaryAccent}
        onClick={(e) => {
          e.stopPropagation();
          onUpload();
        }}
        aria-label={`Upload ${assignmentName}`}
      >
        <UploadOutlined /> Upload
      </button>
    );
  }

  // Build secondary icon buttons for the action group
  const secondaryButtons: React.ReactNode[] = [];
  if (showUpload && allowStudentUpload && onUpload && status !== SubmissionStatus.NO_SUBMISSION) {
    secondaryButtons.push(
      <Tooltip key="reupload" title={hasExistingSubmission && liveFeedbackMode ? 'Replace submission' : 'Re-upload'}>
        <button
          className={styles.btnGroupIcon}
          onClick={(e) => {
            e.stopPropagation();
            onUpload();
          }}
          aria-label={`Upload ${assignmentName}`}
        >
          <UploadOutlined />
        </button>
      </Tooltip>,
    );
  }
  if (showAddFiles && onAddFiles) {
    secondaryButtons.push(
      <Tooltip key="addfiles" title="Add or update files">
        <button
          className={styles.btnGroupIcon}
          onClick={(e) => {
            e.stopPropagation();
            onAddFiles();
          }}
          aria-label={`Add files to ${assignmentName}`}
        >
          <PlusOutlined />
        </button>
      </Tooltip>,
    );
  }
  if (hasDownload && onDownload) {
    secondaryButtons.push(
      <Tooltip key="download" title="Download assignment files">
        <button
          className={styles.btnGroupIcon}
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          aria-label={`Download ${assignmentName}`}
        >
          <DownloadOutlined />
        </button>
      </Tooltip>,
    );
  }

  return (
    <div
      className={`${disabled ? styles.rowDisabled : styles.row} ${rowAccentClass[status]}`}
      role="article"
      aria-label={assignmentName}
    >
      <div
        className={styles.rowMain}
        onClick={hasStatsContent ? toggle : undefined}
        onKeyDown={hasStatsContent ? handleKeyDown : undefined}
        role={hasStatsContent ? 'button' : undefined}
        tabIndex={hasStatsContent && !disabled ? 0 : undefined}
        aria-expanded={hasStatsContent ? expanded : undefined}
        style={{ cursor: hasStatsContent && !disabled ? 'pointer' : 'default' }}
      >
        {/* Left: name + subline (pill, due date) */}
        <div className={styles.rowIdentity}>
          <div className={styles.rowNameBlock}>
            <h3 className={styles.rowName}>
              {assignmentName}
              {status === SubmissionStatus.PENDING && (
                <span className={styles.notificationDot} aria-label="Grade available" />
              )}
            </h3>
            <div className={styles.rowSubline}>
              <span className={statusPillClass[status]}>{statusLabel[status]}</span>
              {dueDateFragment}
            </div>
          </div>
          {hasStatsContent && (
            <DownOutlined className={expanded ? styles.rowChevronOpen : styles.rowChevron} aria-hidden="true" />
          )}
        </div>

        {/* Center: grade */}
        <div>{gradeContent}</div>

        {/* Right: action group */}
        <div className={styles.rowActions}>
          {(primaryAction || secondaryButtons.length > 0) && (
            <div className={styles.btnGroup} role="group" aria-label="Assignment actions">
              {primaryAction}
              {secondaryButtons}
            </div>
          )}
        </div>
      </div>

      {/* Expandable stats panel */}
      <AnimatePresence initial={false}>
        {expanded && hasStatsContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.rowDetail}>
              <div className={styles.detailBlock}>
                <span className={styles.detailLabel}>Class Stats</span>
                <span className={styles.detailValue}>
                  {meanGrade && `Mean: ${meanGrade}/${maxPoints}`}
                  {meanGrade && medianGrade && ' · '}
                  {medianGrade && `Median: ${medianGrade}/${maxPoints}`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssignmentRow;
