// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';
import { Section } from '../../../../api-client';
import {
  buildLeaderMap,
  diffLeaderPlan,
  distributeEvenly,
  effectiveLeaders,
  leadCounts,
  toggleLeader,
  unledSections,
} from './sectionLeaderPlanner';

const section = (id: number, name: string, leaders: string[] = []): Section =>
  ({ id, name, course: 1, leaders, students: [] }) as unknown as Section;

const ta = (n: number) => `ta${n}@x.edu`;

describe('sectionLeaderPlanner', () => {
  const sections = [section(1, 'S01', [ta(1)]), section(2, 'S02'), section(3, 'S03')];
  const initial = buildLeaderMap(sections);

  it('builds the initial map, dropping null emails', () => {
    const withNull = buildLeaderMap([
      { id: 5, name: 'X', course: 1, leaders: [ta(1), null], students: [] } as unknown as Section,
    ]);
    expect(withNull.get(5)).toEqual(new Set([ta(1)]));
  });

  it('toggleLeader is immutable and round-trips', () => {
    const edits = toggleLeader(2, ta(2), initial, new Map());
    expect(edits.get(2)).toEqual(new Set([ta(2)]));
    expect(initial.get(2)).toEqual(new Set());
    const back = toggleLeader(2, ta(2), initial, edits);
    expect(back.get(2)).toEqual(new Set());
    expect(edits.get(2)).toEqual(new Set([ta(2)])); // prior map untouched
  });

  it('diff returns only genuinely changed sections, order-insensitively', () => {
    let edits: ReturnType<typeof buildLeaderMap> = new Map();
    edits = toggleLeader(2, ta(2), initial, edits); // real change
    edits.set(1, new Set([ta(1)])); // touched but identical to initial
    expect(diffLeaderPlan(initial, edits)).toEqual([{ sectionId: 2, leaders: [ta(2)] }]);
  });

  it('diff sorts leader emails for stable PATCH bodies', () => {
    const edits = new Map([[3, new Set([ta(9), ta(2)])]]);
    expect(diffLeaderPlan(initial, edits)[0].leaders).toEqual([ta(2), ta(9)]);
  });

  it('leadCounts and unledSections reflect edits over initial', () => {
    const edits = toggleLeader(2, ta(1), initial, new Map());
    expect(leadCounts(sections, initial, edits).get(ta(1))).toBe(2);
    expect(unledSections(sections, initial, edits)).toEqual([3]);
  });

  describe('distributeEvenly', () => {
    it('assigns only zero-leader sections, round-robin from the least loaded', () => {
      const five = [
        section(1, 'A'), section(2, 'B'), section(3, 'C'), section(4, 'D'), section(5, 'E'),
      ];
      const init = buildLeaderMap(five);
      const edits = distributeEvenly([ta(1), ta(2)], five, init, new Map());
      const counts = leadCounts(five, init, edits);
      expect(counts.get(ta(1))! + counts.get(ta(2))!).toBe(5);
      expect(Math.abs(counts.get(ta(1))! - counts.get(ta(2))!)).toBe(1); // 3/2 split
      expect(unledSections(five, init, edits)).toEqual([]);
    });

    it('is deterministic and skips already-led sections', () => {
      const a = distributeEvenly([ta(2), ta(1)], sections, initial, new Map());
      const b = distributeEvenly([ta(1), ta(2)], sections, initial, new Map());
      expect(diffLeaderPlan(initial, a)).toEqual(diffLeaderPlan(initial, b));
      expect(effectiveLeaders(1, initial, a)).toEqual(new Set([ta(1)])); // untouched
    });

    it('no-ops with no graders and respects unsaved edits', () => {
      expect(distributeEvenly([], sections, initial, new Map()).size).toBe(0);
      const preEdits = toggleLeader(3, ta(3), initial, new Map());
      const after = distributeEvenly([ta(1)], sections, initial, preEdits);
      expect(effectiveLeaders(3, initial, after)).toEqual(new Set([ta(3)])); // not overwritten
      expect(effectiveLeaders(2, initial, after)).toEqual(new Set([ta(1)]));
    });
  });
});
