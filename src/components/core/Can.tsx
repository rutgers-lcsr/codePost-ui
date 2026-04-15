// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import {
  usePermissionsStore,
  useCourseCapabilities,
  useAssignmentCapabilities,
  usePlatformCapabilities,
} from '../../stores/usePermissionsStore';
import type { Capability } from '../../stores/usePermissionsStore';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CanProps {
  /** The capability to check (e.g. `"edit_rubric"`). */
  action: Capability;
  /** Provide **one** of `courseId`, `assignmentId`, or `platform` to scope the check. */
  courseId?: number;
  assignmentId?: number;
  /** Set to `true` for platform-level capabilities (e.g. `create_course`). */
  platform?: boolean;
  /**
   * Optional fallback rendered when the user lacks the capability.
   * Defaults to rendering nothing.
   */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Declarative permission guard.
 *
 * Renders `children` only when the current user has the given capability
 * for the specified course, assignment, or platform scope.  Triggers a
 * fetch of capabilities automatically if they haven't been loaded yet.
 *
 * @example
 * ```tsx
 * <Can action="edit_rubric" courseId={course.id}>
 *   <EditRubricButton />
 * </Can>
 *
 * <Can action="create_course" platform>
 *   <CreateCourseButton />
 * </Can>
 * ```
 */
export const Can: React.FC<CanProps> = ({ action, courseId, assignmentId, platform, fallback = null, children }) => {
  // Fetch capabilities (no-op if already cached)
  const platformCaps = usePlatformCapabilities();
  const courseCaps = useCourseCapabilities(assignmentId || platform ? undefined : courseId);
  const assignmentCaps = useAssignmentCapabilities(assignmentId);

  const caps = platform ? platformCaps : assignmentId ? assignmentCaps : courseCaps;
  const allowed = caps[action] === true;

  return <>{allowed ? children : fallback}</>;
};

// ---------------------------------------------------------------------------
// Imperative helper
// ---------------------------------------------------------------------------

/**
 * Check a capability outside of React (e.g. in an event handler or service).
 *
 * @example
 * ```ts
 * if (can('course:42', 'edit_rubric')) { ... }
 * ```
 */
export function can(key: string, action: Capability): boolean {
  return usePermissionsStore.getState().can(key, action);
}
