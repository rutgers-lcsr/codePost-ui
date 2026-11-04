// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { AssignmentDeadline } from '../../api-client';

export interface SafeWindow {
  start: Date;
  end: Date;
  days: number;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/**
 * The first run of at least `minDays` calendar days, starting on or after `from`, with no assignment
 * due date on any of them: the Deploy Calendar's "best window" idea, looking forward instead of
 * at one month. Returns null when no such run exists within `horizonDays`.
 */
export function nextSafeWindow(
  deadlines: AssignmentDeadline[],
  from: Date,
  minDays = 3,
  horizonDays = 60,
): SafeWindow | null {
  const dueDays = new Set(
    deadlines.filter((d) => d.uploadDueDate).map((d) => dayKey(new Date(d.uploadDueDate as string))),
  );
  let runStart: Date | null = null;
  let runLength = 0;
  for (let offset = 0; offset <= horizonDays; offset++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    if (dueDays.has(dayKey(day))) {
      runStart = null;
      runLength = 0;
      continue;
    }
    runStart ??= day;
    runLength++;
    if (runLength >= minDays) {
      // Extend to the end of the quiet run so the window reads as the whole gap.
      let end = day;
      for (let more = offset + 1; more <= horizonDays; more++) {
        const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + more);
        if (dueDays.has(dayKey(next))) break;
        end = next;
        runLength++;
      }
      return { start: runStart, end, days: runLength };
    }
  }
  return null;
}

/** "Nov 8–12" or "Nov 29 – Dec 3", in the viewer's locale. */
export function formatWindow(window: SafeWindow): string {
  const month = (d: Date) => d.toLocaleDateString(undefined, { month: 'short' });
  const sameMonth = window.start.getMonth() === window.end.getMonth();
  return sameMonth
    ? `${month(window.start)} ${window.start.getDate()}–${window.end.getDate()}`
    : `${month(window.start)} ${window.start.getDate()} – ${month(window.end)} ${window.end.getDate()}`;
}
