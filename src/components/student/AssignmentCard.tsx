import React from 'react';
import { Button, Tag, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  MinusCircleOutlined,
  UploadOutlined,
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import './StudentConsole.css';
import { CodePostDate } from '../utils/CodepostDate';

export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  PENDING = 'pending',
  NOT_REVIEWED = 'not_reviewed',
  NOT_PUBLISHED = 'not_published',
  NO_SUBMISSION = 'no_submission',
}

export interface AssignmentCardProps {
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
  onViewFeedback?: () => void;
  onViewFiles?: () => void;
  onUpload?: () => void;
  onAddFiles?: () => void;
  onDownload?: () => void;
  disabled?: boolean;
}

const getStatusConfig = (status: SubmissionStatus) => {
  switch (status) {
    case SubmissionStatus.SUBMITTED:
      return {
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.1)',
        icon: <CheckCircleOutlined />,
        label: 'Submitted',
      };
    case SubmissionStatus.PENDING:
      return {
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        icon: <ClockCircleOutlined />,
        label: 'Pending Review',
      };
    case SubmissionStatus.NOT_REVIEWED:
      return {
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        icon: <MinusCircleOutlined />,
        label: 'Not Reviewed Yet',
      };
    case SubmissionStatus.NOT_PUBLISHED:
      return {
        color: '#9ca3af',
        bgColor: 'rgba(156, 163, 175, 0.1)',
        icon: <StopOutlined />,
        label: 'Not Published',
      };
    case SubmissionStatus.NO_SUBMISSION:
      return {
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        icon: <ExclamationCircleOutlined />,
        label: 'No Submission',
      };
    default:
      return {
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        icon: <MinusCircleOutlined />,
        label: 'Unknown',
      };
  }
};

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignmentName,
  status,
  grade,
  maxPoints,
  partners,
  meanGrade,
  medianGrade,
  dueDate,
  uploadDate,
  showStats = false,
  showPartners = false,
  showUpload = false,
  allowStudentUpload = false,
  hasExistingSubmission = false,
  hasDownload = false,
  liveFeedbackMode = false,
  isFinalized = false,
  onViewFeedback,
  onViewFiles,
  onUpload,
  onAddFiles,
  onDownload,
  disabled = false,
}) => {
  const statusConfig = getStatusConfig(status);
  const hasGrade = grade !== null && grade !== undefined && maxPoints;
  const hasPartners = partners && partners.length > 0;

  // Show Add Files button only in liveFeedbackMode with existing non-finalized submission
  const showAddFiles = liveFeedbackMode && hasExistingSubmission && !isFinalized;

  return (
    <div className={`assignment-card ${disabled ? 'assignment-card--disabled' : ''}`}>
      {/* Card Header */}
      <div className="assignment-card__header">
        <h3 className="assignment-card__title">{assignmentName}</h3>
      </div>

      {/* Status Badge */}
      <div className="assignment-card__status">
        <Tag
          icon={statusConfig.icon}
          style={{
            color: statusConfig.color,
            backgroundColor: statusConfig.bgColor,
            border: 'none',
            fontWeight: 500,
          }}
        >
          {statusConfig.label}
        </Tag>
      </div>

      {/* Date Info */}
      {(dueDate || uploadDate) && (
        <div className="assignment-card__dates">
          {dueDate && (
            <div className="assignment-card__date">
              <CalendarOutlined /> Due: <CodePostDate datetime={dueDate} />
            </div>
          )}
          {uploadDate && (
            <div className="assignment-card__date assignment-card__date--uploaded">
              <CheckCircleOutlined /> Uploaded: <CodePostDate datetime={uploadDate} />
            </div>
          )}
        </div>
      )}

      {/* Grade Section */}
      {hasGrade && (status === SubmissionStatus.SUBMITTED || status === SubmissionStatus.PENDING) && (
        <div className="assignment-card__grade">
          <span className="assignment-card__grade-label">Grade:</span>
          <span className="assignment-card__grade-value">
            {grade}/{maxPoints}
          </span>
        </div>
      )}

      {/* Partners */}
      {showPartners && hasPartners && (
        <div className="assignment-card__partners">
          <span className="assignment-card__label">Partners:</span>
          <span className="assignment-card__value">{partners.join(', ')}</span>
        </div>
      )}

      {/* Stats */}
      {showStats && (meanGrade || medianGrade) && (
        <div className="assignment-card__stats">
          {meanGrade && (
            <span className="assignment-card__stat">
              Mean:{' '}
              <strong>
                {meanGrade}/{maxPoints}
              </strong>
            </span>
          )}
          {medianGrade && (
            <span className="assignment-card__stat">
              Median:{' '}
              <strong>
                {medianGrade}/{maxPoints}
              </strong>
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="assignment-card__actions">
        {(status === SubmissionStatus.SUBMITTED || status === SubmissionStatus.PENDING) && onViewFeedback && (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={onViewFeedback}
            className="assignment-card__btn assignment-card__btn--primary"
          >
            View Feedback
          </Button>
        )}

        {status === SubmissionStatus.NOT_REVIEWED && onViewFiles && (
          <Button icon={<EyeOutlined />} onClick={onViewFiles} className="assignment-card__btn">
            View Files
          </Button>
        )}

        {showUpload && allowStudentUpload && onUpload && (
          <Tooltip title={hasExistingSubmission && liveFeedbackMode ? 'Replace submission' : 'Upload assignment'}>
            <Button icon={<UploadOutlined />} onClick={onUpload} className="assignment-card__btn">
              Upload
            </Button>
          </Tooltip>
        )}

        {showAddFiles && onAddFiles && (
          <Tooltip title="Add or update files in your submission">
            <Button icon={<PlusOutlined />} onClick={onAddFiles} className="assignment-card__btn">
              Add/Update
            </Button>
          </Tooltip>
        )}

        {hasDownload && onDownload && (
          <Tooltip title="Download assignment files">
            <Button icon={<DownloadOutlined />} onClick={onDownload} className="assignment-card__btn">
              Download
            </Button>
          </Tooltip>
        )}
      </div>

      {/* Disabled Overlay for unpublished assignments - shows below title */}
      {disabled && (
        <div className="assignment-card__overlay">
          <StopOutlined style={{ fontSize: 20, marginBottom: 4 }} />
          <span>Not yet published</span>
        </div>
      )}
    </div>
  );
};

export default AssignmentCard;
