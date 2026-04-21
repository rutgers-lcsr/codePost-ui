// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApiClientsMock } from '@test-utils/mocks';
import { usePermissionsStore, selectCaps, EMPTY_CAPS, type CacheEntry } from '../usePermissionsStore';
import type { Capabilities } from '../../api-client/capabilities.generated';

// Mock API clients
vi.mock('../../api-client/clients', () => createApiClientsMock());

describe('usePermissionsStore', () => {
  beforeEach(() => {
    usePermissionsStore.getState().reset();
  });

  // ---------------------------------------------------------------------------
  // selectCaps
  // ---------------------------------------------------------------------------
  describe('selectCaps', () => {
    it('returns EMPTY_CAPS when key is not in cache', () => {
      const state = usePermissionsStore.getState();
      expect(selectCaps(state, 'course:999')).toEqual(EMPTY_CAPS);
    });

    it('returns cached caps when no overrides exist', () => {
      const caps: Capabilities = { edit_rubric: true, view_rubric: true };
      usePermissionsStore.getState().setCapabilities('course:1', caps);
      const state = usePermissionsStore.getState();
      expect(selectCaps(state, 'course:1')).toEqual(caps);
    });

    it('merges overrides on top of cached caps', () => {
      const caps: Capabilities = { edit_rubric: true, view_rubric: true };
      usePermissionsStore.getState().setCapabilities('course:1', caps);
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      const state = usePermissionsStore.getState();
      const result = selectCaps(state, 'course:1');
      expect(result.edit_rubric).toBe(false);
      expect(result.view_rubric).toBe(true);
    });

    it('returns caps when overrides object is empty', () => {
      const caps: Capabilities = { view_rubric: true };
      usePermissionsStore.getState().setCapabilities('course:1', caps);
      // overrides for key doesn't exist — should return pure caps
      const state = usePermissionsStore.getState();
      expect(selectCaps(state, 'course:1')).toEqual(caps);
    });
  });

  // ---------------------------------------------------------------------------
  // setCapabilities
  // ---------------------------------------------------------------------------
  describe('setCapabilities', () => {
    it('stores capabilities in cache with a timestamp', () => {
      const caps: Capabilities = { edit_rubric: true };
      usePermissionsStore.getState().setCapabilities('course:42', caps);
      const entry = usePermissionsStore.getState().cache['course:42'];
      expect(entry).toBeDefined();
      expect(entry.caps).toEqual(caps);
      expect(entry.fetchedAt).toBeGreaterThan(0);
    });

    it('overwrites previous entry for the same key', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: false, view_rubric: true });
      const entry = usePermissionsStore.getState().cache['course:1'];
      expect(entry.caps).toEqual({ edit_rubric: false, view_rubric: true });
    });
  });

  // ---------------------------------------------------------------------------
  // can
  // ---------------------------------------------------------------------------
  describe('can', () => {
    it('returns false when key is not cached', () => {
      expect(usePermissionsStore.getState().can('course:1', 'edit_rubric')).toBe(false);
    });

    it('returns true when capability is true in cache', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      expect(usePermissionsStore.getState().can('course:1', 'edit_rubric')).toBe(true);
    });

    it('returns false when capability is false in cache', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: false });
      expect(usePermissionsStore.getState().can('course:1', 'edit_rubric')).toBe(false);
    });

    it('uses override when present', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      // override flips true → false
      expect(usePermissionsStore.getState().can('course:1', 'edit_rubric')).toBe(false);
    });

    it('returns false for capabilities not in the map', () => {
      usePermissionsStore.getState().setCapabilities('course:1', {});
      expect(usePermissionsStore.getState().can('course:1', 'edit_rubric')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // toggleOverride
  // ---------------------------------------------------------------------------
  describe('toggleOverride', () => {
    it('creates an override that flips the server value', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      expect(usePermissionsStore.getState().overrides['course:1']?.edit_rubric).toBe(false);
    });

    it('creates override as true when server value is undefined', () => {
      usePermissionsStore.getState().setCapabilities('course:1', {});
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      expect(usePermissionsStore.getState().overrides['course:1']?.edit_rubric).toBe(true);
    });

    it('removes override when toggled back to match server value', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      // Toggle 1: no override → set to !serverVal = false
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      expect(usePermissionsStore.getState().overrides['course:1']?.edit_rubric).toBe(false);
      // Toggle 2: current=false differs from server=true → flip to true
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      expect(usePermissionsStore.getState().overrides['course:1']?.edit_rubric).toBe(true);
      // Toggle 3: current=true matches server=true → remove override
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      expect(usePermissionsStore.getState().overrides['course:1']?.edit_rubric).toBeUndefined();
    });

    it('cleans up key from overrides when last override is removed', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      // Toggle 1: false, Toggle 2: true, Toggle 3: removed
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      expect(usePermissionsStore.getState().overrides['course:1']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // clearOverrides
  // ---------------------------------------------------------------------------
  describe('clearOverrides', () => {
    it('removes all overrides', () => {
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      usePermissionsStore.getState().toggleOverride('course:2', 'view_rubric');
      usePermissionsStore.getState().clearOverrides();
      expect(usePermissionsStore.getState().overrides).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // invalidate
  // ---------------------------------------------------------------------------
  describe('invalidate', () => {
    it('removes a specific key from cache', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      usePermissionsStore.getState().setCapabilities('course:2', { view_rubric: true });
      usePermissionsStore.getState().invalidate('course:1');
      expect(usePermissionsStore.getState().cache['course:1']).toBeUndefined();
      expect(usePermissionsStore.getState().cache['course:2']).toBeDefined();
    });

    it('does nothing when key does not exist', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      usePermissionsStore.getState().invalidate('course:999');
      expect(usePermissionsStore.getState().cache['course:1']).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // invalidateCourse
  // ---------------------------------------------------------------------------
  describe('invalidateCourse', () => {
    it('removes course key and all assignment keys', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      usePermissionsStore.getState().setCapabilities('assignment:10', { view_rubric: true });
      usePermissionsStore.getState().setCapabilities('assignment:20', { view_rubric: true });
      usePermissionsStore.getState().setCapabilities('course:2', { edit_rubric: true });

      usePermissionsStore.getState().invalidateCourse(1);

      expect(usePermissionsStore.getState().cache['course:1']).toBeUndefined();
      expect(usePermissionsStore.getState().cache['assignment:10']).toBeUndefined();
      expect(usePermissionsStore.getState().cache['assignment:20']).toBeUndefined();
      // Other courses should be unaffected
      expect(usePermissionsStore.getState().cache['course:2']).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // reset
  // ---------------------------------------------------------------------------
  describe('reset', () => {
    it('clears all state', () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      usePermissionsStore.getState().reset();
      const state = usePermissionsStore.getState();
      expect(state.cache).toEqual({});
      expect(state.pending).toEqual({});
      expect(state.errors).toEqual({});
      expect(state.overrides).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // fetchCourseCapabilities
  // ---------------------------------------------------------------------------
  describe('fetchCourseCapabilities', () => {
    it('fetches and caches course capabilities', async () => {
      const { coursesApi } = await import('../../api-client/clients');
      const mockCaps: Capabilities = { edit_rubric: true, view_rubric: true };
      vi.mocked(coursesApi.capabilitiesRetrieve).mockResolvedValueOnce({
        capabilitiesMap: mockCaps,
      } as never);

      const result = await usePermissionsStore.getState().fetchCourseCapabilities(42);
      expect(result).toEqual(mockCaps);
      expect(usePermissionsStore.getState().cache['course:42']?.caps).toEqual(mockCaps);
    });

    it('returns cached caps when still fresh', async () => {
      const caps: Capabilities = { edit_rubric: true };
      usePermissionsStore.getState().setCapabilities('course:1', caps);
      const result = await usePermissionsStore.getState().fetchCourseCapabilities(1);
      expect(result).toEqual(caps);
    });

    it('handles fetch errors gracefully', async () => {
      const { coursesApi } = await import('../../api-client/clients');
      vi.mocked(coursesApi.capabilitiesRetrieve).mockRejectedValueOnce(new Error('Network error'));

      const result = await usePermissionsStore.getState().fetchCourseCapabilities(99);
      expect(result).toEqual({});
      expect(usePermissionsStore.getState().errors['course:99']).toBe('Network error');
      expect(usePermissionsStore.getState().pending['course:99']).toBe(false);
    });

    it('handles non-Error exceptions', async () => {
      const { coursesApi } = await import('../../api-client/clients');
      vi.mocked(coursesApi.capabilitiesRetrieve).mockRejectedValueOnce('string error');

      const result = await usePermissionsStore.getState().fetchCourseCapabilities(88);
      expect(result).toEqual({});
      expect(usePermissionsStore.getState().errors['course:88']).toBe('Failed to fetch capabilities');
    });

    it('clears error on successful fetch after previous error', async () => {
      const { coursesApi } = await import('../../api-client/clients');
      // First: error
      vi.mocked(coursesApi.capabilitiesRetrieve).mockRejectedValueOnce(new Error('fail'));
      await usePermissionsStore.getState().fetchCourseCapabilities(1);
      expect(usePermissionsStore.getState().errors['course:1']).toBeDefined();

      // Second: success
      vi.mocked(coursesApi.capabilitiesRetrieve).mockResolvedValueOnce({
        capabilitiesMap: { edit_rubric: true },
      } as never);
      // Invalidate so it re-fetches
      usePermissionsStore.getState().invalidate('course:1');
      await usePermissionsStore.getState().fetchCourseCapabilities(1);
      expect(usePermissionsStore.getState().errors['course:1']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // fetchAssignmentCapabilities
  // ---------------------------------------------------------------------------
  describe('fetchAssignmentCapabilities', () => {
    it('fetches and caches assignment capabilities', async () => {
      const { assignmentsApi } = await import('../../api-client/clients');
      const mockCaps: Capabilities = { view_rubric: true };
      vi.mocked(assignmentsApi.capabilitiesRetrieve).mockResolvedValueOnce({
        capabilitiesMap: mockCaps,
      } as never);

      const result = await usePermissionsStore.getState().fetchAssignmentCapabilities(10);
      expect(result).toEqual(mockCaps);
      expect(usePermissionsStore.getState().cache['assignment:10']?.caps).toEqual(mockCaps);
    });

    it('returns cached when fresh', async () => {
      usePermissionsStore.getState().setCapabilities('assignment:10', { view_rubric: true });
      const result = await usePermissionsStore.getState().fetchAssignmentCapabilities(10);
      expect(result).toEqual({ view_rubric: true });
    });

    it('handles errors', async () => {
      const { assignmentsApi } = await import('../../api-client/clients');
      vi.mocked(assignmentsApi.capabilitiesRetrieve).mockRejectedValueOnce(new Error('fail'));

      const result = await usePermissionsStore.getState().fetchAssignmentCapabilities(10);
      expect(result).toEqual({});
      expect(usePermissionsStore.getState().errors['assignment:10']).toBe('fail');
    });
  });

  // ---------------------------------------------------------------------------
  // fetchSubmissionCapabilities
  // ---------------------------------------------------------------------------
  describe('fetchSubmissionCapabilities', () => {
    it('fetches and caches submission capabilities', async () => {
      const { submissionsApi } = await import('../../api-client/clients');
      const mockCaps: Capabilities = { comment_on_submission: true };
      vi.mocked(submissionsApi.checkPermissionRetrieve).mockResolvedValueOnce({
        capabilities: mockCaps,
      } as never);

      const result = await usePermissionsStore.getState().fetchSubmissionCapabilities(5);
      expect(result).toEqual(mockCaps);
      expect(usePermissionsStore.getState().cache['submission:5']?.caps).toEqual(mockCaps);
    });

    it('returns cached when fresh', async () => {
      usePermissionsStore.getState().setCapabilities('submission:5', { comment_on_submission: true });
      const result = await usePermissionsStore.getState().fetchSubmissionCapabilities(5);
      expect(result).toEqual({ comment_on_submission: true });
    });

    it('handles errors', async () => {
      const { submissionsApi } = await import('../../api-client/clients');
      vi.mocked(submissionsApi.checkPermissionRetrieve).mockRejectedValueOnce(new Error('denied'));

      const result = await usePermissionsStore.getState().fetchSubmissionCapabilities(5);
      expect(result).toEqual({});
      expect(usePermissionsStore.getState().errors['submission:5']).toBe('denied');
    });
  });

  // ---------------------------------------------------------------------------
  // fetchPlatformCapabilities
  // ---------------------------------------------------------------------------
  describe('fetchPlatformCapabilities', () => {
    it('fetches and caches platform capabilities', async () => {
      const { capabilitiesApi } = await import('../../api-client/clients');
      const mockCaps: Capabilities = { create_course: true };
      vi.mocked(capabilitiesApi.platformRetrieve).mockResolvedValueOnce({
        capabilitiesMap: mockCaps,
      } as never);

      const result = await usePermissionsStore.getState().fetchPlatformCapabilities();
      expect(result).toEqual(mockCaps);
      expect(usePermissionsStore.getState().cache['platform']?.caps).toEqual(mockCaps);
    });

    it('returns cached when fresh', async () => {
      usePermissionsStore.getState().setCapabilities('platform', { create_course: true });
      const result = await usePermissionsStore.getState().fetchPlatformCapabilities();
      expect(result).toEqual({ create_course: true });
    });

    it('handles errors', async () => {
      const { capabilitiesApi } = await import('../../api-client/clients');
      vi.mocked(capabilitiesApi.platformRetrieve).mockRejectedValueOnce(new Error('boom'));

      const result = await usePermissionsStore.getState().fetchPlatformCapabilities();
      expect(result).toEqual({});
      expect(usePermissionsStore.getState().errors['platform']).toBe('boom');
    });
  });

  // ---------------------------------------------------------------------------
  // fetchBatch
  // ---------------------------------------------------------------------------
  describe('fetchBatch', () => {
    it('returns cached values when all keys are fresh', async () => {
      usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      usePermissionsStore.getState().setCapabilities('course:2', { view_rubric: true });

      const result = await usePermissionsStore.getState().fetchBatch(['course:1', 'course:2']);
      expect(result['course:1']).toEqual({ edit_rubric: true });
      expect(result['course:2']).toEqual({ view_rubric: true });
    });

    it('fetches stale keys via API', async () => {
      const { capabilitiesApi } = await import('../../api-client/clients');
      vi.mocked(capabilitiesApi.batchCreate).mockResolvedValueOnce({
        results: {
          'course:1': { edit_rubric: true },
          'course:2': { view_rubric: true },
        },
      } as never);

      const result = await usePermissionsStore.getState().fetchBatch(['course:1', 'course:2']);
      expect(result['course:1']).toEqual({ edit_rubric: true });
      expect(result['course:2']).toEqual({ view_rubric: true });
    });

    it('handles batch fetch error gracefully', async () => {
      const { capabilitiesApi } = await import('../../api-client/clients');
      vi.mocked(capabilitiesApi.batchCreate).mockRejectedValueOnce(new Error('batch fail'));

      const result = await usePermissionsStore.getState().fetchBatch(['course:1']);
      expect(result['course:1']).toEqual({});
    });
  });
});
