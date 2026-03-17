// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, afterEach } from 'vitest';
import dayjs from 'dayjs';
import { dueDatePassed } from '../DateUtils';

describe('dueDatePassed', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when dueDate is null', () => {
    expect(dueDatePassed(null)).toBe(false);
  });

  it('returns true when due date is in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    expect(dueDatePassed('2025-06-14T12:00:00Z')).toBe(true);
    vi.useRealTimers();
  });

  it('returns false when due date is in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    expect(dueDatePassed('2025-06-16T12:00:00Z')).toBe(false);
    vi.useRealTimers();
  });

  it('accepts a Dayjs object', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    const pastDate = dayjs('2025-06-14T00:00:00Z');
    expect(dueDatePassed(pastDate)).toBe(true);
    vi.useRealTimers();
  });

  it('returns true when due date is exactly now (before check)', () => {
    vi.useFakeTimers();
    const now = new Date('2025-06-15T12:00:00Z');
    vi.setSystemTime(now);
    // A date 1 second before now should be in the past
    expect(dueDatePassed('2025-06-15T11:59:59Z')).toBe(true);
    vi.useRealTimers();
  });
});
