// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Section } from '../../../../api-client';

/**
 * Pure planning logic for the "Assign graders to sections" matrix.
 *
 * State shape: `initial` mirrors the saved sections; `edits` holds ONLY touched sections
 * (the effective value of a section is `edits.get(id) ?? initial.get(id)`). That makes the
 * save-diff trivial, Cancel = clear edits, and background refetches of untouched sections
 * can't stomp in-progress work.
 */
export type LeaderMap = Map<number, Set<string>>;

const cleanEmails = (emails: Array<string | null> | undefined): Set<string> =>
  new Set((emails ?? []).filter((e): e is string => !!e));

export const buildLeaderMap = (sections: Section[]): LeaderMap =>
  new Map(sections.filter((s) => s.id != null).map((s) => [s.id!, cleanEmails(s.leaders)]));

export const effectiveLeaders = (id: number, initial: LeaderMap, edits: LeaderMap): Set<string> =>
  edits.get(id) ?? initial.get(id) ?? new Set();

/** Returns a NEW edits map with the grader toggled in/out of the section. */
export const toggleLeader = (
  id: number,
  email: string,
  initial: LeaderMap,
  edits: LeaderMap,
): LeaderMap => {
  const next = new Map(edits);
  const current = new Set(effectiveLeaders(id, initial, edits));
  if (current.has(email)) current.delete(email);
  else current.add(email);
  next.set(id, current);
  return next;
};

const setsEqual = (a: Set<string>, b: Set<string>): boolean =>
  a.size === b.size && [...a].every((x) => b.has(x));

/** Only sections whose edited membership actually differs; leaders sorted for stable PATCH bodies. */
export const diffLeaderPlan = (
  initial: LeaderMap,
  edits: LeaderMap,
): Array<{ sectionId: number; leaders: string[] }> => {
  const out: Array<{ sectionId: number; leaders: string[] }> = [];
  for (const [id, edited] of edits) {
    if (!setsEqual(edited, initial.get(id) ?? new Set())) {
      out.push({ sectionId: id, leaders: [...edited].sort() });
    }
  }
  return out.sort((a, b) => a.sectionId - b.sectionId);
};

/** Effective sections-led count per grader across the whole plan. */
export const leadCounts = (
  sections: Section[],
  initial: LeaderMap,
  edits: LeaderMap,
): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const s of sections) {
    if (s.id == null) continue;
    for (const email of effectiveLeaders(s.id, initial, edits)) {
      counts.set(email, (counts.get(email) ?? 0) + 1);
    }
  }
  return counts;
};

/** Ids of sections with zero effective leaders. */
export const unledSections = (
  sections: Section[],
  initial: LeaderMap,
  edits: LeaderMap,
): number[] =>
  sections
    .filter((s) => s.id != null && effectiveLeaders(s.id!, initial, edits).size === 0)
    .map((s) => s.id!);

/**
 * Round-robin one grader onto each section with zero effective leaders: sections by name,
 * graders starting from the least-loaded (ties by email) so repeated use stays balanced.
 * Returns a new edits map; saves nothing.
 */
export const distributeEvenly = (
  graders: string[],
  sections: Section[],
  initial: LeaderMap,
  edits: LeaderMap,
): LeaderMap => {
  if (graders.length === 0) return edits;
  const counts = leadCounts(sections, initial, edits);
  const ordered = [...graders].sort(
    (a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0) || a.localeCompare(b),
  );
  const targets = sections
    .filter((s) => s.id != null && effectiveLeaders(s.id!, initial, edits).size === 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  let next = edits;
  targets.forEach((section, i) => {
    next = toggleLeader(section.id!, ordered[i % ordered.length], initial, next);
  });
  return next;
};
