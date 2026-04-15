// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { coursesApi, assignmentsApi, submissionsApi, capabilitiesApi } from '../api-client/clients';

/**
 * All capability keys returned by the API's `/capabilities/` endpoints.
 * Auto-generated from the backend `Capability` enum — do NOT edit manually.
 * Re-export so existing imports (`from '…/usePermissionsStore'`) keep working.
 */
export type { Capability, Capabilities } from '../api-client/capabilities.generated';
// Re-import for use within this module.
import type { Capability, Capabilities } from '../api-client/capabilities.generated';

export { CAPABILITY_DESCRIPTIONS } from '../api-client/capabilities.generated';

/** Empty capability map used as a default when capabilities haven't loaded yet. */
export const EMPTY_CAPS: Capabilities = {};

/** How long cached capabilities remain fresh before a background re-fetch (ms). */
const CAPABILITIES_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface CacheEntry {
  caps: Capabilities;
  fetchedAt: number;
}

interface PermissionsState {
  /** Cached capabilities keyed by `"course:{id}"` or `"assignment:{id}"`. */
  cache: Record<string, CacheEntry>;
  /** In-flight fetches to prevent duplicate requests. */
  pending: Record<string, boolean>;
  /** Tracks which keys had fetch errors (cleared on next success). */
  errors: Record<string, string>;
  /** Dev-only overrides: takes precedence over cache when set. */
  overrides: Record<string, Capabilities>;
}

interface PermissionsActions {
  /** Fetch & cache capabilities for a course. Returns the capability map. */
  fetchCourseCapabilities: (courseId: number) => Promise<Capabilities>;
  /** Fetch & cache capabilities for an assignment. Returns the capability map. */
  fetchAssignmentCapabilities: (assignmentId: number) => Promise<Capabilities>;
  /** Fetch & cache capabilities for a submission (via checkPermission). Returns the capability map. */
  fetchSubmissionCapabilities: (submissionId: number) => Promise<Capabilities>;
  /** Fetch & cache platform-level capabilities. Returns the capability map. */
  fetchPlatformCapabilities: () => Promise<Capabilities>;
  /** Fetch & cache capabilities for multiple resources in a single API call. */
  fetchBatch: (keys: string[]) => Promise<Record<string, Capabilities>>;
  /** Manually set capabilities (e.g. from a checkPermission response). */
  setCapabilities: (key: string, caps: Capabilities) => void;
  /** Check a single capability. Returns `false` if not yet loaded. */
  can: (key: string, action: Capability) => boolean;
  /** Toggle a dev override for a single capability. */
  toggleOverride: (key: string, action: Capability) => void;
  /** Clear all dev overrides. */
  clearOverrides: () => void;
  /** Invalidate cached capabilities for a resource. */
  invalidate: (key: string) => void;
  /** Invalidate all cached capabilities for a given course (course + its assignments). */
  invalidateCourse: (courseId: number) => void;
  /** Clear all cached capabilities. */
  reset: () => void;
}

type PermissionsStore = PermissionsState & PermissionsActions;

/**
 * Selector helper: returns the effective capabilities for a key by merging
 * the server-provided cache with any local dev overrides.
 *
 * Use this inside `usePermissionsStore` selectors instead of `s.cache[key]?.caps`
 * directly — the latter ignores dev-panel overrides.
 */
export function selectCaps(s: PermissionsState, key: string): Capabilities {
  const caps = s.cache[key]?.caps;
  const ov = s.overrides[key];
  if (ov && Object.keys(ov).length > 0) return { ...caps, ...ov };
  return caps ?? EMPTY_CAPS;
}

const initialState: PermissionsState = {
  cache: {},
  pending: {},
  errors: {},
  overrides: {},
};

export const usePermissionsStore = create<PermissionsStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        fetchCourseCapabilities: async (courseId: number) => {
          const key = `course:${courseId}`;
          const { cache, pending } = get();
          const entry = cache[key];

          // Return cached if available and still fresh
          if (entry && Date.now() - entry.fetchedAt < CAPABILITIES_TTL_MS) return entry.caps;

          // Prevent duplicate in-flight requests
          if (pending[key]) return entry?.caps ?? {};

          set((s) => ({ pending: { ...s.pending, [key]: true } }), false, 'fetchCourseCapabilities/start');

          try {
            const response = await coursesApi.capabilitiesRetrieve({
              id: courseId,
            });
            const caps = (response.capabilitiesMap ?? {}) as Capabilities;

            set(
              (s) => {
                const { [key]: _, ...restErrors } = s.errors;
                return {
                  cache: { ...s.cache, [key]: { caps, fetchedAt: Date.now() } },
                  pending: { ...s.pending, [key]: false },
                  errors: restErrors,
                };
              },
              false,
              'fetchCourseCapabilities/success',
            );
            return caps;
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch capabilities';
            set(
              (s) => ({
                pending: { ...s.pending, [key]: false },
                errors: { ...s.errors, [key]: message },
              }),
              false,
              'fetchCourseCapabilities/error',
            );
            return entry?.caps ?? {};
          }
        },

        fetchAssignmentCapabilities: async (assignmentId: number) => {
          const key = `assignment:${assignmentId}`;
          const { cache, pending } = get();
          const entry = cache[key];

          if (entry && Date.now() - entry.fetchedAt < CAPABILITIES_TTL_MS) return entry.caps;
          if (pending[key]) return entry?.caps ?? {};

          set((s) => ({ pending: { ...s.pending, [key]: true } }), false, 'fetchAssignmentCapabilities/start');

          try {
            const response = await assignmentsApi.capabilitiesRetrieve({
              id: assignmentId,
            });
            const caps = (response.capabilitiesMap ?? {}) as Capabilities;

            set(
              (s) => {
                const { [key]: _, ...restErrors } = s.errors;
                return {
                  cache: { ...s.cache, [key]: { caps, fetchedAt: Date.now() } },
                  pending: { ...s.pending, [key]: false },
                  errors: restErrors,
                };
              },
              false,
              'fetchAssignmentCapabilities/success',
            );
            return caps;
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch capabilities';
            set(
              (s) => ({
                pending: { ...s.pending, [key]: false },
                errors: { ...s.errors, [key]: message },
              }),
              false,
              'fetchAssignmentCapabilities/error',
            );
            return entry?.caps ?? {};
          }
        },

        fetchPlatformCapabilities: async () => {
          const key = 'platform';
          const { cache, pending } = get();
          const entry = cache[key];

          if (entry && Date.now() - entry.fetchedAt < CAPABILITIES_TTL_MS) return entry.caps;
          if (pending[key]) return entry?.caps ?? {};

          set((s) => ({ pending: { ...s.pending, [key]: true } }), false, 'fetchPlatformCapabilities/start');

          try {
            const response = await capabilitiesApi.platformRetrieve();
            const caps = (response.capabilitiesMap ?? {}) as Capabilities;

            set(
              (s) => {
                const { [key]: _, ...restErrors } = s.errors;
                return {
                  cache: { ...s.cache, [key]: { caps, fetchedAt: Date.now() } },
                  pending: { ...s.pending, [key]: false },
                  errors: restErrors,
                };
              },
              false,
              'fetchPlatformCapabilities/success',
            );
            return caps;
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch capabilities';
            set(
              (s) => ({
                pending: { ...s.pending, [key]: false },
                errors: { ...s.errors, [key]: message },
              }),
              false,
              'fetchPlatformCapabilities/error',
            );
            return entry?.caps ?? {};
          }
        },

        fetchSubmissionCapabilities: async (submissionId: number) => {
          const key = `submission:${submissionId}`;
          const { cache, pending } = get();
          const entry = cache[key];

          if (entry && Date.now() - entry.fetchedAt < CAPABILITIES_TTL_MS) return entry.caps;
          if (pending[key]) return entry?.caps ?? {};

          set((s) => ({ pending: { ...s.pending, [key]: true } }), false, 'fetchSubmissionCapabilities/start');

          try {
            const response = await submissionsApi.checkPermissionRetrieve({ id: submissionId });
            const caps = (response.capabilities ?? {}) as Capabilities;

            set(
              (s) => {
                const { [key]: _, ...restErrors } = s.errors;
                return {
                  cache: { ...s.cache, [key]: { caps, fetchedAt: Date.now() } },
                  pending: { ...s.pending, [key]: false },
                  errors: restErrors,
                };
              },
              false,
              'fetchSubmissionCapabilities/success',
            );
            return caps;
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch capabilities';
            set(
              (s) => ({
                pending: { ...s.pending, [key]: false },
                errors: { ...s.errors, [key]: message },
              }),
              false,
              'fetchSubmissionCapabilities/error',
            );
            return entry?.caps ?? {};
          }
        },

        setCapabilities: (key, caps) => {
          set((s) => ({ cache: { ...s.cache, [key]: { caps, fetchedAt: Date.now() } } }), false, 'setCapabilities');
        },

        fetchBatch: async (keys: string[]) => {
          // Filter out keys that are already fresh in cache
          const { cache } = get();
          const staleKeys = keys.filter((k) => {
            const entry = cache[k];
            return !entry || Date.now() - entry.fetchedAt >= CAPABILITIES_TTL_MS;
          });

          if (staleKeys.length === 0) {
            // All requested keys are fresh — return from cache
            const result: Record<string, Capabilities> = {};
            for (const k of keys) result[k] = cache[k]?.caps ?? {};
            return result;
          }

          try {
            const response = await capabilitiesApi.batchCreate({
              batchCapabilitiesRequest: { keys: staleKeys },
            });
            const results = (response.results ?? {}) as Record<string, Capabilities>;
            const now = Date.now();

            set(
              (s) => {
                const newCache = { ...s.cache };
                for (const [key, caps] of Object.entries(results)) {
                  newCache[key] = { caps, fetchedAt: now };
                }
                return { cache: newCache };
              },
              false,
              'fetchBatch/success',
            );

            // Merge fresh results with any already-cached keys the caller asked for
            const merged: Record<string, Capabilities> = {};
            const updatedCache = get().cache;
            for (const k of keys) merged[k] = updatedCache[k]?.caps ?? {};
            return merged;
          } catch {
            // On error, return whatever's in cache
            const result: Record<string, Capabilities> = {};
            const currentCache = get().cache;
            for (const k of keys) result[k] = currentCache[k]?.caps ?? {};
            return result;
          }
        },

        can: (key, action) => {
          const { overrides, cache } = get();
          if (overrides[key] && action in overrides[key]) {
            return overrides[key][action] === true;
          }
          return cache[key]?.caps[action] === true;
        },

        toggleOverride: (key, action) => {
          const { overrides, cache } = get();
          const current = overrides[key]?.[action];
          let next: boolean;
          if (current !== undefined) {
            const serverVal = cache[key]?.caps[action] === true;
            if (current === serverVal) {
              // override matches server → just remove it
              const { [action]: _, ...rest } = overrides[key];
              const newOverrides = { ...overrides, [key]: rest };
              if (Object.keys(rest).length === 0) delete newOverrides[key];
              set({ overrides: newOverrides }, false, 'toggleOverride/remove');
              return;
            }
            next = !current;
          } else {
            // No override yet → flip the server value
            next = !(cache[key]?.caps[action] === true);
          }
          set(
            (s) => ({
              overrides: {
                ...s.overrides,
                [key]: { ...s.overrides[key], [action]: next },
              },
            }),
            false,
            'toggleOverride',
          );
        },

        clearOverrides: () => {
          set({ overrides: {} }, false, 'clearOverrides');
        },

        invalidate: (key) => {
          set(
            (s) => {
              const { [key]: _, ...rest } = s.cache;
              return { cache: rest };
            },
            false,
            'invalidate',
          );
        },

        invalidateCourse: (courseId) => {
          set(
            (s) => {
              const prefix = `course:${courseId}`;
              const newCache = { ...s.cache };
              delete newCache[prefix];
              // Also clear any assignment entries that belong to this course
              // (assignments refetch will pick up new role-based caps)
              for (const key of Object.keys(newCache)) {
                if (key.startsWith('assignment:')) {
                  delete newCache[key];
                }
              }
              return { cache: newCache };
            },
            false,
            'invalidateCourse',
          );
        },

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'permissions-overrides',
        partialize: (state) => ({ overrides: state.overrides }),
      },
    ),
    { name: 'permissions' },
  ),
);

// ---------------------------------------------------------------------------
// Convenience hooks
// ---------------------------------------------------------------------------

/**
 * Hook to get capabilities for a course. Triggers a fetch if not cached.
 *
 * @example
 * ```tsx
 * const caps = useCourseCapabilities(courseId);
 * if (caps.edit_rubric) { ... }
 * ```
 */
export function useCourseCapabilities(courseId: number | undefined): Capabilities {
  const entry = usePermissionsStore((s) => (courseId ? s.cache[`course:${courseId}`] : undefined));
  const overrides = usePermissionsStore((s) => (courseId ? s.overrides[`course:${courseId}`] : undefined));
  const fetch = usePermissionsStore((s) => s.fetchCourseCapabilities);

  useEffect(() => {
    if (!courseId) return;
    const isStale = entry ? Date.now() - entry.fetchedAt >= CAPABILITIES_TTL_MS : true;
    if (!entry || isStale) {
      fetch(courseId);
    }
  }, [courseId, entry, fetch]);

  const caps = entry?.caps;
  return useMemo(() => {
    if (overrides && Object.keys(overrides).length > 0) {
      return { ...caps, ...overrides };
    }
    return caps ?? EMPTY_CAPS;
  }, [caps, overrides]);
}

/**
 * Hook to get capabilities for an assignment. Triggers a fetch if not cached.
 */
export function useAssignmentCapabilities(assignmentId: number | undefined): Capabilities {
  const entry = usePermissionsStore((s) => (assignmentId ? s.cache[`assignment:${assignmentId}`] : undefined));
  const overrides = usePermissionsStore((s) => (assignmentId ? s.overrides[`assignment:${assignmentId}`] : undefined));
  const fetch = usePermissionsStore((s) => s.fetchAssignmentCapabilities);

  useEffect(() => {
    if (!assignmentId) return;
    const isStale = entry ? Date.now() - entry.fetchedAt >= CAPABILITIES_TTL_MS : true;
    if (!entry || isStale) {
      fetch(assignmentId);
    }
  }, [assignmentId, entry, fetch]);

  const caps = entry?.caps;
  return useMemo(() => {
    if (overrides && Object.keys(overrides).length > 0) {
      return { ...caps, ...overrides };
    }
    return caps ?? EMPTY_CAPS;
  }, [caps, overrides]);
}

/**
 * Hook to check a single capability.
 *
 * @example
 * ```tsx
 * const canEditRubric = useCan('course:42', 'edit_rubric');
 * ```
 */
export function useCan(key: string, action: Capability): boolean {
  return usePermissionsStore((s) => {
    if (s.overrides[key] && action in s.overrides[key]) {
      return s.overrides[key][action] === true;
    }
    return s.cache[key]?.caps[action] === true;
  });
}

/**
 * Hook to get platform-level capabilities. Triggers a fetch if not cached.
 *
 * @example
 * ```tsx
 * const caps = usePlatformCapabilities();
 * if (caps.create_course) { ... }
 * ```
 */
export function usePlatformCapabilities(): Capabilities {
  const entry = usePermissionsStore((s) => s.cache['platform']);
  const overrides = usePermissionsStore((s) => s.overrides['platform']);
  const fetch = usePermissionsStore((s) => s.fetchPlatformCapabilities);

  useEffect(() => {
    const isStale = entry ? Date.now() - entry.fetchedAt >= CAPABILITIES_TTL_MS : true;
    if (!entry || isStale) {
      fetch();
    }
  }, [entry, fetch]);

  const caps = entry?.caps;
  return useMemo(() => {
    if (overrides && Object.keys(overrides).length > 0) {
      return { ...caps, ...overrides };
    }
    return caps ?? EMPTY_CAPS;
  }, [caps, overrides]);
}
