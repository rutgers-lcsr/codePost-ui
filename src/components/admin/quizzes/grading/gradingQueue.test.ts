// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';
import { buildGradingQueue, nextInQueue, queuePosition, QueueAttempt } from './gradingQueue';

const attempt = (id: number, student: string, responses: QueueAttempt['responses']): QueueAttempt => ({
  id,
  student,
  attemptNumber: 1,
  responses,
});

describe('buildGradingQueue', () => {
  it('collects only responses needing manual grading, ordered by question then attempt', () => {
    const attempts: QueueAttempt[] = [
      attempt(10, 'ada@x.edu', [
        { id: 1, sortKey: 0, needsManualGrading: false }, // auto-graded — skipped
        { id: 2, sortKey: 2, needsManualGrading: true },
        { id: 3, sortKey: 1, needsManualGrading: true },
      ]),
      attempt(11, 'bo@x.edu', [{ id: 4, sortKey: 0, needsManualGrading: true }]),
    ];
    expect(buildGradingQueue(attempts)).toEqual([
      { attemptId: 10, responseId: 3, student: 'ada@x.edu', attemptNumber: 1 }, // sortKey 1 first
      { attemptId: 10, responseId: 2, student: 'ada@x.edu', attemptNumber: 1 },
      { attemptId: 11, responseId: 4, student: 'bo@x.edu', attemptNumber: 1 },
    ]);
  });

  it('returns an empty queue when nothing needs grading', () => {
    expect(buildGradingQueue([attempt(1, 'a@x.edu', [{ id: 9, needsManualGrading: false }])])).toEqual([]);
  });
});

describe('nextInQueue', () => {
  const queue = buildGradingQueue([
    attempt(10, 'ada@x.edu', [
      { id: 2, sortKey: 0, needsManualGrading: true },
      { id: 3, sortKey: 1, needsManualGrading: true },
    ]),
    attempt(11, 'bo@x.edu', [{ id: 4, sortKey: 0, needsManualGrading: true }]),
  ]);

  it('advances to the next pending item, crossing attempts', () => {
    expect(nextInQueue(queue, 2)?.responseId).toBe(3);
    expect(nextInQueue(queue, 3)?.responseId).toBe(4); // into the next attempt
  });

  it('returns undefined past the last item', () => {
    expect(nextInQueue(queue, 4)).toBeUndefined();
  });

  it('returns the first item when the current id is not in the queue', () => {
    expect(nextInQueue(queue, 999)?.responseId).toBe(2);
    expect(nextInQueue([], 999)).toBeUndefined();
  });
});

describe('queuePosition', () => {
  const queue = buildGradingQueue([
    attempt(10, 'ada@x.edu', [
      { id: 2, sortKey: 0, needsManualGrading: true },
      { id: 3, sortKey: 1, needsManualGrading: true },
    ]),
  ]);
  it('is 1-based, and 0 when absent', () => {
    expect(queuePosition(queue, 2)).toBe(1);
    expect(queuePosition(queue, 3)).toBe(2);
    expect(queuePosition(queue, 999)).toBe(0);
  });
});
