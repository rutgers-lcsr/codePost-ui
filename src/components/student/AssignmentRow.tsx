// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React, { useCallback, useState } from 'react';
import { Button, Flex, Tag, Tooltip, Typography } from 'antd';
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
  onViewFeedback?: (e: React.MouseEvent) => void;
  onViewFiles?: (e: React.MouseEvent) => void;
  onUpload?: () => void;
  onAddFiles?: () => void;
  onDownload?: () => void;
  disabled?: boolean;
}

const statusTagColor: Record<SubmissionStatus, string> = {
  [SubmissionStatus.SUBMITTED]: 'success',
  [SubmissionStatus.PENDING]: 'warning',
  [SubmissionStatus.NOT_REVIEWED]: 'default',
  [SubmissionStatus.NOT_PUBLISHED]: 'default',
  [SubmissionStatus.NO_SUBMISSION]: 'error',
};

const statusLabel: Record<SubmissionStatus, string> = {
  [SubmissionStatus.SUBMITTED]: 'Graded',
  [SubmissionStatus.PENDING]: 'Grade available',
  [SubmissionStatus.NOT_REVIEWED]: 'Not reviewed yet',
  [SubmissionStatus.NOT_PUBLISHED]: 'Not published',
  [SubmissionStatus.NO_SUBMISSION]: 'No submission',
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
  uploadDate,
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
          <Typography.Text type={relative.urgent ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
            <CalendarOutlined /> {relative.text}
          </Typography.Text>
        </Tooltip>
      );
    } else {
      dueDateFragment = (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          <CalendarOutlined /> <CodePostDate datetime={dueDate} />
        </Typography.Text>
      );
    }
  }

  // Grade
  let gradeContent: React.ReactNode = null;
  if (hideGrades) {
    gradeContent = null;
  } else if ((status === SubmissionStatus.SUBMITTED || status === SubmissionStatus.PENDING) && hasGrade) {
    gradeContent = (
      <Typography.Text strong style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
        {grade}/{maxPoints}
      </Typography.Text>
    );
  } else if (hasGrade && status === SubmissionStatus.NOT_REVIEWED) {
    gradeContent = (
      <Typography.Text type="secondary" style={{ fontSize: 14 }}>
        --
      </Typography.Text>
    );
  }

  // Primary action — always visible
  const handleAuxClick = (cb: ((e: React.MouseEvent) => void) | undefined) => (e: React.MouseEvent) => {
    // Middle-click — invoke the callback so the parent can open in a new tab
    if (e.button === 1 && cb) {
      e.preventDefault();
      e.stopPropagation();
      cb(e);
    }
  };

  let primaryAction: React.ReactNode = null;
  if ((status === SubmissionStatus.SUBMITTED || status === SubmissionStatus.PENDING) && onViewFeedback) {
    primaryAction = (
      <Button
        type="primary"
        size="small"
        icon={<EyeOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          onViewFeedback(e);
        }}
        onAuxClick={handleAuxClick(onViewFeedback)}
        aria-label={`View feedback for ${assignmentName}`}
      >
        View Feedback
      </Button>
    );
  } else if (status === SubmissionStatus.NOT_REVIEWED && onViewFiles) {
    primaryAction = (
      <Button
        size="small"
        icon={<EyeOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          onViewFiles(e);
        }}
        onAuxClick={handleAuxClick(onViewFiles)}
        aria-label={`View files for ${assignmentName}`}
      >
        View Files
      </Button>
    );
  } else if (status === SubmissionStatus.NO_SUBMISSION && allowStudentUpload && onUpload) {
    primaryAction = (
      <Button
        type="primary"
        size="small"
        icon={<UploadOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          onUpload();
        }}
        aria-label={`Upload ${assignmentName}`}
      >
        Upload
      </Button>
    );
  }

  // Build secondary icon buttons for the action group
  const secondaryButtons: React.ReactNode[] = [];
  if (showUpload && allowStudentUpload && onUpload && status !== SubmissionStatus.NO_SUBMISSION) {
    secondaryButtons.push(
      <Tooltip key="reupload" title={hasExistingSubmission && liveFeedbackMode ? 'Replace submission' : 'Re-upload'}>
        <Button
          size="small"
          icon={<UploadOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onUpload();
          }}
          aria-label={`Upload ${assignmentName}`}
        />
      </Tooltip>,
    );
  }
  if (showAddFiles && onAddFiles) {
    secondaryButtons.push(
      <Tooltip key="addfiles" title="Add or update files">
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onAddFiles();
          }}
          aria-label={`Add files to ${assignmentName}`}
        />
      </Tooltip>,
    );
  }
  if (hasDownload && onDownload) {
    secondaryButtons.push(
      <Tooltip key="download" title="Download assignment files">
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          aria-label={`Download ${assignmentName}`}
        />
      </Tooltip>,
    );
  }

  return (
    <div
      role="article"
      aria-label={assignmentName}
      style={{
        borderRadius: 8,
        border: '1px solid #f0f0f0',
        padding: '12px 16px',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : undefined,
        background: '#fff',
      }}
    >
      <Flex
        align="center"
        gap={12}
        onClick={hasStatsContent ? toggle : undefined}
        onKeyDown={hasStatsContent ? handleKeyDown : undefined}
        role={hasStatsContent ? 'button' : undefined}
        tabIndex={hasStatsContent && !disabled ? 0 : undefined}
        aria-expanded={hasStatsContent ? expanded : undefined}
        style={{ cursor: hasStatsContent && !disabled ? 'pointer' : 'default' }}
      >
        {/* Left: name + subline */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" gap={6}>
            <Typography.Text strong ellipsis style={{ fontSize: 14 }}>
              {assignmentName}
            </Typography.Text>
            {status === SubmissionStatus.PENDING && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#faad14',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
                aria-label="Grade available"
              />
            )}
          </Flex>
          <Flex align="center" gap={8} wrap="wrap" style={{ marginTop: 4 }}>
            <Tag color={statusTagColor[status]} style={{ margin: 0 }}>
              {statusLabel[status]}
            </Tag>
            {dueDateFragment}
            {uploadDate && status !== SubmissionStatus.NO_SUBMISSION && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Submitted <CodePostDate datetime={uploadDate} />
              </Typography.Text>
            )}
          </Flex>
        </div>

        {/* Center: grade */}
        {gradeContent && <div style={{ flexShrink: 0 }}>{gradeContent}</div>}

        {/* Right: action group */}
        <Flex gap={4} align="center" style={{ flexShrink: 0 }}>
          {primaryAction}
          {secondaryButtons}
          {hasStatsContent && (
            <DownOutlined
              style={{
                fontSize: 12,
                color: '#8c8c8c',
                transition: 'transform 0.25s',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                marginLeft: 4,
              }}
              aria-hidden="true"
            />
          )}
        </Flex>
      </Flex>

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
            <Flex
              gap={16}
              style={{
                paddingTop: 12,
                marginTop: 12,
                borderTop: '1px solid #f0f0f0',
              }}
            >
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Class Stats
                </Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: 13 }}>
                  {meanGrade && `Mean: ${meanGrade}/${maxPoints}`}
                  {meanGrade && medianGrade && ' · '}
                  {medianGrade && `Median: ${medianGrade}/${maxPoints}`}
                </Typography.Text>
              </div>
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssignmentRow;
