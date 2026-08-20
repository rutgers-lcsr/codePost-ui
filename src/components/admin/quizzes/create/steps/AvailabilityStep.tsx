// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { DatePicker, Flex, InputNumber, Select, Space, Switch, Typography } from 'antd';
import dayjs from 'dayjs';
import { AssignmentFeedbackStatusEnum, QuizAssignmentTriggerEnum, QuizCloseEventEnum } from '../../../../../api-client';
import { Assignment } from '../../../../../types/common';
import {
  CLOSE_LABELS,
  DEFAULT_CLOSE_BY_TRIGGER,
  OFFSET_CLOSE_EVENTS,
  OffsetUnit,
  QuizCreateDraft,
  TRIGGER_HELP,
  TRIGGER_LABELS,
  closeOptionsFor,
  isDegenerateClose,
  offsetMinutes,
} from '../quizDraft';
import { StepProps } from './types';

const { Text } = Typography;

interface IProps extends StepProps {
  assignments: Assignment[];
}

/** Attach to an assignment (open trigger + close event) or run standalone (date window). */
const AvailabilityStep: React.FC<IProps> = ({ draft, patch, assignments }) => {
  const selected = assignments.find((a) => a.id === draft.assignment);
  // The serializer rejects whole-class feedback events against per-student-feedback
  // assignments, so don't offer them (the per-student trigger remains available).
  const perStudentFeedback = selected?.feedbackStatus === AssignmentFeedbackStatusEnum.PerStudent;

  // A degenerate close (anchor == open moment) needs a positive offset, so seed one.
  const withCloseOffset = (p: Partial<QuizCreateDraft>, trigger: string, event: string): Partial<QuizCreateDraft> => {
    if (isDegenerateClose(trigger, event) && offsetMinutes({ ...draft, ...p } as QuizCreateDraft) === 0) {
      return { ...p, closeOffsetValue: 1, closeOffsetUnit: 'days' };
    }
    return p;
  };

  const handleAssignmentChange = (v: number | undefined) => {
    const next = v ?? null;
    const p: Partial<QuizCreateDraft> = { assignment: next };
    const a = assignments.find((x) => x.id === next);
    if (a?.feedbackStatus === AssignmentFeedbackStatusEnum.PerStudent) {
      if (draft.assignmentTrigger === QuizAssignmentTriggerEnum.AfterFeedback) {
        p.assignmentTrigger = QuizAssignmentTriggerEnum.During;
        p.closeEvent = QuizCloseEventEnum.None;
      } else if (draft.closeEvent === QuizCloseEventEnum.FeedbackReleased) {
        p.closeEvent = QuizCloseEventEnum.None;
      }
    }
    patch(p);
  };

  const handleTriggerChange = (t: QuizAssignmentTriggerEnum) => {
    const allowed = closeOptionsFor(t);
    const next = allowed.includes(draft.closeEvent)
      ? draft.closeEvent
      : DEFAULT_CLOSE_BY_TRIGGER[t] ?? QuizCloseEventEnum.None;
    patch(withCloseOffset({ assignmentTrigger: t, closeEvent: next }, t, next));
  };

  const handleCloseEventChange = (e: QuizCloseEventEnum) => {
    patch(withCloseOffset({ closeEvent: e }, draft.assignmentTrigger, e));
  };

  const triggerOptions = Object.entries(TRIGGER_LABELS)
    .filter(([value]) => !(perStudentFeedback && value === QuizAssignmentTriggerEnum.AfterFeedback))
    .map(([value, label]) => ({ value, label }));

  const closeOptions = closeOptionsFor(draft.assignmentTrigger)
    .filter((v) => !(perStudentFeedback && v === QuizCloseEventEnum.FeedbackReleased))
    .map((v) => ({ value: v, label: CLOSE_LABELS[v] }));

  return (
    <Flex vertical gap={12} data-testid="quiz-wizard-step-availability">
      <Text type="secondary" style={{ fontSize: 12 }}>
        When students can start the quiz. Attach an assignment to open and close the quiz around that
        assignment&apos;s deadline, submissions, or feedback — or set a standalone date window.
      </Text>
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          Attached assignment
        </Text>
        <Select
          allowClear
          aria-label="Attached assignment"
          placeholder="Not attached - Attach to an assignment to control availability"
          style={{ minWidth: 280 }}
          value={draft.assignment ?? undefined}
          onChange={handleAssignmentChange}
          options={assignments.map((a) => ({ value: a.id!, label: a.name }))}
        />
      </div>
      {draft.assignment != null ? (
        <Flex vertical gap={12}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Opens
            </Text>
            <Select
              aria-label="Quiz opens"
              style={{ minWidth: 280 }}
              value={draft.assignmentTrigger}
              onChange={handleTriggerChange}
              options={triggerOptions}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              {TRIGGER_HELP[draft.assignmentTrigger]}
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Closes
            </Text>
            <Flex gap={8} wrap align="center">
              <Select
                aria-label="Quiz closes"
                style={{ minWidth: 260 }}
                value={draft.closeEvent}
                onChange={handleCloseEventChange}
                options={closeOptions}
              />
              {OFFSET_CLOSE_EVENTS.has(draft.closeEvent) && (
                <>
                  <Text type="secondary">+</Text>
                  <InputNumber
                    min={0}
                    aria-label="Close offset amount"
                    style={{ width: 80 }}
                    value={draft.closeOffsetValue}
                    onChange={(v) => patch({ closeOffsetValue: v ?? 0 })}
                  />
                  <Select
                    aria-label="Close offset unit"
                    style={{ width: 110 }}
                    value={draft.closeOffsetUnit}
                    onChange={(v) => patch({ closeOffsetUnit: v as OffsetUnit })}
                    options={[
                      { value: 'minutes', label: 'minutes' },
                      { value: 'hours', label: 'hours' },
                      { value: 'days', label: 'days' },
                    ]}
                  />
                </>
              )}
              {draft.closeEvent === QuizCloseEventEnum.FixedDate && (
                <DatePicker
                  showTime
                  aria-label="Closes at"
                  placeholder="Closes at"
                  value={draft.availableUntil ? dayjs(draft.availableUntil) : null}
                  onChange={(d) => patch({ availableUntil: d ? d.toISOString() : null })}
                />
              )}
            </Flex>
            {draft.closeEvent === QuizCloseEventEnum.Submission && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                Each student&apos;s window starts when they submit the assignment.
              </Text>
            )}
            {draft.closeEvent !== QuizCloseEventEnum.None && (
              <Space style={{ marginTop: 8 }}>
                <Switch
                  size="small"
                  aria-label="End in-progress attempts at the close time"
                  checked={draft.endAttemptsAtClose}
                  onChange={(v) => patch({ endAttemptsAtClose: v })}
                />
                <Text type="secondary">
                  End in-progress attempts at the close time (students see the time remaining)
                </Text>
              </Space>
            )}
          </div>
        </Flex>
      ) : (
        <div>
          <Flex gap={8} wrap>
            <DatePicker
              showTime
              aria-label="Opens at"
              placeholder="Opens at"
              value={draft.availableFrom ? dayjs(draft.availableFrom) : null}
              onChange={(d) => {
                const iso = d ? d.toISOString() : null;
                // Keep the window valid: drop a close that's no longer after the new open.
                if (iso && draft.availableUntil && !dayjs(draft.availableUntil).isAfter(dayjs(iso))) {
                  patch({ availableFrom: iso, availableUntil: null });
                } else {
                  patch({ availableFrom: iso });
                }
              }}
            />
            <DatePicker
              showTime
              aria-label="Closes at"
              placeholder="Closes at"
              // Can't close before it opens.
              minDate={draft.availableFrom ? dayjs(draft.availableFrom) : undefined}
              value={draft.availableUntil ? dayjs(draft.availableUntil) : null}
              onChange={(d) => patch({ availableUntil: d ? d.toISOString() : null })}
            />
          </Flex>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
            Leave both empty to keep the quiz available whenever it&apos;s published.
          </Text>
          {draft.availableUntil && (
            <Space style={{ marginTop: 8 }}>
              <Switch
                size="small"
                aria-label="End in-progress attempts at the close time"
                checked={draft.endAttemptsAtClose}
                onChange={(v) => patch({ endAttemptsAtClose: v })}
              />
              <Text type="secondary">
                End in-progress attempts at the close time (students see the time remaining)
              </Text>
            </Space>
          )}
        </div>
      )}
    </Flex>
  );
};

export default AvailabilityStep;
