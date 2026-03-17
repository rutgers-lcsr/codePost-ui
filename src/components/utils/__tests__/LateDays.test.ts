// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { getDaysLate } from '../LateDays';

function makeAssignment(uploadDueDate: string | null) {
  return { uploadDueDate } as { uploadDueDate: string | null };
}

function makeSubmission(dateUploaded: string | null) {
  return { dateUploaded } as { dateUploaded: string | null };
}

describe('getDaysLate', () => {
  it('returns 0 when uploadDueDate is null', () => {
    expect(getDaysLate(makeAssignment(null) as any, makeSubmission('2025-06-15T12:00:00Z') as any)).toBe(0);
  });

  it('returns 0 when dateUploaded is null', () => {
    expect(getDaysLate(makeAssignment('2025-06-15T12:00:00Z') as any, makeSubmission(null) as any)).toBe(0);
  });

  it('returns 0 when submitted before due date', () => {
    expect(
      getDaysLate(makeAssignment('2025-06-15T12:00:00Z') as any, makeSubmission('2025-06-14T12:00:00Z') as any),
    ).toBe(0);
  });

  it('returns 1 when submitted at exactly the due date', () => {
    // diff in days = 0, +1 = 1 (same-day submission counts as 1 late day)
    expect(
      getDaysLate(makeAssignment('2025-06-15T12:00:00Z') as any, makeSubmission('2025-06-15T12:00:00Z') as any),
    ).toBe(1);
  });

  it('returns 1 when submitted on the same day but after due time', () => {
    // diff in days is 0, +1 = 1
    expect(
      getDaysLate(makeAssignment('2025-06-15T00:00:00Z') as any, makeSubmission('2025-06-15T23:59:00Z') as any),
    ).toBe(1);
  });

  it('returns 2 when submitted 1 day after due date', () => {
    // diff in days = 1, +1 = 2
    expect(
      getDaysLate(makeAssignment('2025-06-15T12:00:00Z') as any, makeSubmission('2025-06-16T12:00:00Z') as any),
    ).toBe(2);
  });

  it('returns correct value for multiple days late', () => {
    // diff in days = 3, +1 = 4
    expect(
      getDaysLate(makeAssignment('2025-06-15T12:00:00Z') as any, makeSubmission('2025-06-18T12:00:00Z') as any),
    ).toBe(4);
  });
});
