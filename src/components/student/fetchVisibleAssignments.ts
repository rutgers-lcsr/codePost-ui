// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { assignmentsApi } from '../../api-client/clients';
import { Assignment } from '../../types/common';

/** States students may see — mirrors the server's STUDENT_VISIBLE_STATES. The server
 * already filters course.assignments and 403s draft/archived retrieves; this client-side
 * predicate is defense in depth for cached assignment objects. */
const STUDENT_VISIBLE_STATES = ['visible', 'preview', 'published', 'closed'];

export const isAssignmentVisibleToStudent = (a: Assignment, studentSections: number[]): boolean => {
  const state = a.effectiveState ?? a.state;
  // Objects cached from before the lifecycle migration carry only isVisible.
  const visibleByState = state != null ? STUDENT_VISIBLE_STATES.includes(state) : !!a.isVisible;
  return (
    visibleByState &&
    !(a.hideFrom ?? []).some((shouldHide: number) => studentSections.indexOf(shouldHide) > -1)
  );
};

/**
 * Fan out one retrieve per assignment ID and keep only the assignments this student may
 * see. Uses allSettled: a single 403/404 (stale course cache, a state change mid-session)
 * must drop that one assignment, not blank the whole course.
 */
export const fetchVisibleAssignments = async (
  assignmentIds: number[],
  studentSections: number[],
): Promise<Assignment[]> => {
  const results = await Promise.allSettled(assignmentIds.map((id) => assignmentsApi.retrieve({ id })));
  return results
    .filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof assignmentsApi.retrieve>>> =>
        r.status === 'fulfilled',
    )
    .map((r) => r.value as unknown as Assignment)
    .filter((a) => isAssignmentVisibleToStudent(a, studentSections));
};
