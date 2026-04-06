// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { Modal, Spin } from 'antd';

import dayjs from 'dayjs';
import { CodePostDate } from '../utils/CodepostDate';

import { AssignmentStudent } from '../../services/assignment';
import type { BeforeStudentUploadResponse } from '../../api-client';
import type { AssignmentStudentType } from '../../types/models';
import styles from './StudentConsole.module.scss';

interface ILateSubmissionModalProps {
  open: boolean;
  assignment: AssignmentStudentType;
  onOk: () => void;
  onCancel: () => void;
}

const LateSubmissionModal = (props: ILateSubmissionModalProps) => {
  const [info, setInfo] = React.useState<BeforeStudentUploadResponse | null>(null);

  React.useEffect(() => {
    const load = async () => {
      setInfo(null);
      const data = await AssignmentStudent.beforeStudentUpload(props.assignment.id);
      setInfo(data);
    };

    if (props.open) {
      load();
    }
  }, [props.open, props.assignment.id]);

  const hasCredits =
    info !== null &&
    info.lateDayCreditsAvailable !== undefined &&
    info.lateDayCreditsToUse !== undefined &&
    info.adjustedDaysLate !== undefined &&
    props.assignment.lateDeductions.length > 0;

  const hasPenalty = info !== null && props.assignment.lateDeductions.length > 0 && (info.pointsOff ?? 0) > 0;

  const noPenalty = info !== null && props.assignment.lateDeductions.length > 0 && info.pointsOff === 0;

  // Credit tokens: render visual tokens for used vs remaining
  const creditTokens = React.useMemo(() => {
    if (!hasCredits || !info) return null;
    const used = info.lateDayCreditsToUse ?? 0;
    const available = info.lateDayCreditsAvailable ?? 0;
    const remaining = available - used;
    const tokens: React.ReactNode[] = [];

    for (let i = 0; i < used; i++) {
      tokens.push(
        <span key={`used-${i}`} className={styles.lateCreditTokenUsed} aria-label="Credit used">
          ✓
        </span>,
      );
    }
    for (let i = 0; i < remaining; i++) {
      tokens.push(
        <span key={`avail-${i}`} className={styles.lateCreditTokenAvailable} aria-label="Credit available">
          ○
        </span>,
      );
    }
    return tokens;
  }, [hasCredits, info]);

  let content: React.ReactNode;

  if (info === null) {
    content = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
        <Spin />
      </div>
    );
  } else {
    content = (
      <div>
        {/* Timeline: Due vs Now */}
        {props.assignment.uploadDueDate != null && (
          <div className={styles.lateTimeline}>
            <div className={styles.lateTimelineRow}>
              <span className={styles.lateTimelineDotDue} />
              <span className={styles.lateTimelineLabel}>Due</span>
              <span className={styles.lateTimelineValue}>
                <CodePostDate datetime={props.assignment.uploadDueDate} />
              </span>
            </div>
            <div className={styles.lateTimelineRow}>
              <span className={styles.lateTimelineDotNow} />
              <span className={styles.lateTimelineLabel}>Now</span>
              <span className={styles.lateTimelineValue}>
                <CodePostDate datetime={dayjs()} />
              </span>
            </div>
          </div>
        )}

        {/* Days late */}
        <p style={{ fontSize: 'var(--sc-text-base)', color: 'var(--sc-ink)', lineHeight: 1.6, marginBottom: 0 }}>
          The due date has passed. If you submit now, your submission will be{' '}
          <strong>
            {info.daysLate} day{info.daysLate === 1 ? '' : 's'}
          </strong>{' '}
          late.
        </p>

        {/* Late day credits */}
        {hasCredits && (
          <div style={{ marginTop: 'var(--sc-space-lg)' }}>
            <p
              style={{ fontSize: 'var(--sc-text-base)', color: 'var(--sc-ink-secondary)', lineHeight: 1.6, margin: 0 }}
            >
              You have <strong>{info.lateDayCreditsAvailable}</strong> unused late day credit
              {info.lateDayCreditsAvailable === 1 ? '' : 's'}.{' '}
              <strong>
                {info.lateDayCreditsToUse} credit{info.lateDayCreditsToUse === 1 ? '' : 's'}
              </strong>{' '}
              will be applied. After adjustment, the submission will be{' '}
              <strong>
                {info.adjustedDaysLate} day{info.adjustedDaysLate === 1 ? '' : 's'}
              </strong>{' '}
              late.
            </p>
            {creditTokens && <div className={styles.lateCreditTokens}>{creditTokens}</div>}
          </div>
        )}

        {/* Penalty */}
        {hasPenalty && (
          <div className={styles.latePenaltyCard}>
            <div className={styles.latePenaltyTitle}>Penalty</div>
            <div className={styles.latePenaltyText}>A late penalty will be applied to this submission.</div>
          </div>
        )}

        {noPenalty && <div className={styles.lateNoPenalty}>No penalty will be applied to this submission.</div>}

        <p
          style={{
            fontSize: 'var(--sc-text-sm)',
            color: 'var(--sc-ink-muted)',
            marginTop: 'var(--sc-space-lg)',
            marginBottom: 0,
          }}
        >
          Please see the course policy or contact your instructor if you have any questions.
        </p>
      </div>
    );
  }

  return (
    <Modal
      className={styles.lateModal}
      title="Confirm late submission"
      open={props.open}
      onOk={props.onOk}
      onCancel={props.onCancel}
      okText="Continue"
      destroyOnHidden={true}
    >
      {content}
    </Modal>
  );
};

export default LateSubmissionModal;
