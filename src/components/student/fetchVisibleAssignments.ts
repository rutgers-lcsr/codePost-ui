// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { coursesApi } from '../../api-client/clients';
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
 * Fetch the assignments this student may see in one request (the API's
 * courses/{id}/assignments/ aggregate — replaces one retrieve per id). The server
 * already applies state + section filtering; the client-side predicate stays as
 * defense in depth. An error returns [] rather than blanking the whole course
 * (matching the old allSettled resilience).
 */
export const fetchVisibleAssignments = async (
  courseId: number,
  studentSections: number[],
): Promise<Assignment[]> => {
  try {
    const results = await coursesApi.assignmentsList({ id: courseId });
    return (results as unknown as Assignment[]).filter((a) => isAssignmentVisibleToStudent(a, studentSections));
  } catch {
    return [];
  }
};
