// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The focused grader walks a flat queue of the responses that still need manual grading,
// across every submitted attempt. These pure helpers build and step through that queue;
// they take structural inputs (a slice of StaffQuizAttempt) so they stay unit-testable.

export interface QueueResponse {
  id: number;
  sortKey?: number | null;
  needsManualGrading?: boolean | null;
}

export interface QueueAttempt {
  id: number;
  student: string;
  attemptNumber?: number;
  responses: QueueResponse[];
}

/** One pending manual response in the grading queue. */
export interface QueueItem {
  attemptId: number;
  responseId: number;
  student: string;
  attemptNumber?: number;
}

/** A flat, ordered list of the responses awaiting manual grading: attempts in the order
 *  given (the caller sorts/filters them), and within each attempt by question order. */
export function buildGradingQueue(attempts: QueueAttempt[]): QueueItem[] {
  const queue: QueueItem[] = [];
  for (const attempt of attempts) {
    const pending = [...attempt.responses]
      .filter((r) => !!r.needsManualGrading)
      .sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
    for (const r of pending) {
      queue.push({
        attemptId: attempt.id,
        responseId: r.id,
        student: attempt.student,
        attemptNumber: attempt.attemptNumber,
      });
    }
  }
  return queue;
}

/** The next item after `currentResponseId`. Call this BEFORE grading the current response
 *  (while it is still in the queue) so "Save & next" lands on the following pending item;
 *  returns undefined when the current item is the last. When the current id isn't in the
 *  queue (e.g. entering fresh), returns the first item. */
export function nextInQueue(queue: QueueItem[], currentResponseId: number): QueueItem | undefined {
  const idx = queue.findIndex((q) => q.responseId === currentResponseId);
  if (idx < 0) return queue[0];
  return queue[idx + 1];
}

/** 1-based position of a response in the queue (0 when absent), for "Response k of N". */
export function queuePosition(queue: QueueItem[], currentResponseId: number): number {
  return queue.findIndex((q) => q.responseId === currentResponseId) + 1;
}
