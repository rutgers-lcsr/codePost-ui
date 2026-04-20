// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  usePermissionsStore,
  useCourseCapabilities,
  useAssignmentCapabilities,
  usePlatformCapabilities,
  useCan,
  EMPTY_CAPS,
} from '../usePermissionsStore';
import type { Capabilities } from '../../api-client/capabilities.generated';

vi.mock('../../api-client/clients', () => ({
  coursesApi: { capabilitiesRetrieve: vi.fn() },
  assignmentsApi: { capabilitiesRetrieve: vi.fn() },
  submissionsApi: { checkPermissionRetrieve: vi.fn() },
  capabilitiesApi: { platformRetrieve: vi.fn(), batchCreate: vi.fn() },
}));

describe('permissions convenience hooks', () => {
  beforeEach(() => {
    usePermissionsStore.getState().reset();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // useCourseCapabilities
  // ---------------------------------------------------------------------------
  describe('useCourseCapabilities', () => {
    it('returns EMPTY_CAPS when courseId is undefined', () => {
      const { result } = renderHook(() => useCourseCapabilities(undefined));
      expect(result.current).toEqual(EMPTY_CAPS);
    });

    it('returns EMPTY_CAPS when nothing is cached', () => {
      const { result } = renderHook(() => useCourseCapabilities(42));
      expect(result.current).toEqual(EMPTY_CAPS);
    });

    it('returns cached caps after setCapabilities', () => {
      const caps: Capabilities = { edit_rubric: true, view_rubric: true };
      act(() => {
        usePermissionsStore.getState().setCapabilities('course:1', caps);
      });
      const { result } = renderHook(() => useCourseCapabilities(1));
      expect(result.current).toEqual(caps);
    });

    it('merges overrides on top of cached caps', () => {
      const caps: Capabilities = { edit_rubric: true, view_rubric: true };
      act(() => {
        usePermissionsStore.getState().setCapabilities('course:1', caps);
        usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      });
      const { result } = renderHook(() => useCourseCapabilities(1));
      expect(result.current.edit_rubric).toBe(false);
      expect(result.current.view_rubric).toBe(true);
    });

    it('triggers fetch when not cached', async () => {
      const { coursesApi } = await import('../../api-client/clients');
      vi.mocked(coursesApi.capabilitiesRetrieve).mockResolvedValueOnce({
        capabilitiesMap: { view_course: true },
      } as never);

      const { result, rerender } = renderHook(() => useCourseCapabilities(99));
      // Initially empty
      expect(result.current).toEqual(EMPTY_CAPS);

      // Wait for fetch to complete
      await vi.waitFor(() => {
        rerender();
        expect(result.current.view_course).toBe(true);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // useAssignmentCapabilities
  // ---------------------------------------------------------------------------
  describe('useAssignmentCapabilities', () => {
    it('returns EMPTY_CAPS when assignmentId is undefined', () => {
      const { result } = renderHook(() => useAssignmentCapabilities(undefined));
      expect(result.current).toEqual(EMPTY_CAPS);
    });

    it('returns cached caps', () => {
      const caps: Capabilities = { view_submission: true };
      act(() => {
        usePermissionsStore.getState().setCapabilities('assignment:10', caps);
      });
      const { result } = renderHook(() => useAssignmentCapabilities(10));
      expect(result.current).toEqual(caps);
    });

    it('merges overrides', () => {
      act(() => {
        usePermissionsStore.getState().setCapabilities('assignment:10', { view_submission: true });
        usePermissionsStore.getState().toggleOverride('assignment:10', 'view_submission');
      });
      const { result } = renderHook(() => useAssignmentCapabilities(10));
      expect(result.current.view_submission).toBe(false);
    });

    it('triggers fetch when not cached', async () => {
      const { assignmentsApi } = await import('../../api-client/clients');
      vi.mocked(assignmentsApi.capabilitiesRetrieve).mockResolvedValueOnce({
        capabilitiesMap: { edit_rubric: true },
      } as never);

      const { result, rerender } = renderHook(() => useAssignmentCapabilities(55));
      expect(result.current).toEqual(EMPTY_CAPS);

      await vi.waitFor(() => {
        rerender();
        expect(result.current.edit_rubric).toBe(true);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // usePlatformCapabilities
  // ---------------------------------------------------------------------------
  describe('usePlatformCapabilities', () => {
    it('returns EMPTY_CAPS when not cached', () => {
      const { result } = renderHook(() => usePlatformCapabilities());
      expect(result.current).toEqual(EMPTY_CAPS);
    });

    it('returns cached caps', () => {
      act(() => {
        usePermissionsStore.getState().setCapabilities('platform', { create_course: true });
      });
      const { result } = renderHook(() => usePlatformCapabilities());
      expect(result.current).toEqual({ create_course: true });
    });

    it('merges overrides', () => {
      act(() => {
        usePermissionsStore.getState().setCapabilities('platform', { create_course: true });
        usePermissionsStore.getState().toggleOverride('platform', 'create_course');
      });
      const { result } = renderHook(() => usePlatformCapabilities());
      expect(result.current.create_course).toBe(false);
    });

    it('triggers fetch when not cached', async () => {
      const { capabilitiesApi } = await import('../../api-client/clients');
      vi.mocked(capabilitiesApi.platformRetrieve).mockResolvedValueOnce({
        capabilitiesMap: { create_course: true },
      } as never);

      const { result, rerender } = renderHook(() => usePlatformCapabilities());
      expect(result.current).toEqual(EMPTY_CAPS);

      await vi.waitFor(() => {
        rerender();
        expect(result.current.create_course).toBe(true);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // useCan
  // ---------------------------------------------------------------------------
  describe('useCan', () => {
    it('returns false when nothing is cached', () => {
      const { result } = renderHook(() => useCan('course:1', 'edit_rubric'));
      expect(result.current).toBe(false);
    });

    it('returns true when cached capability is true', () => {
      act(() => {
        usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
      });
      const { result } = renderHook(() => useCan('course:1', 'edit_rubric'));
      expect(result.current).toBe(true);
    });

    it('returns false when cached capability is false', () => {
      act(() => {
        usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: false });
      });
      const { result } = renderHook(() => useCan('course:1', 'edit_rubric'));
      expect(result.current).toBe(false);
    });

    it('override takes precedence over cache', () => {
      act(() => {
        usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: true });
        usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      });
      const { result } = renderHook(() => useCan('course:1', 'edit_rubric'));
      expect(result.current).toBe(false);
    });

    it('override with true overrides cache false', () => {
      act(() => {
        usePermissionsStore.getState().setCapabilities('course:1', { edit_rubric: false });
        // toggleOverride on false → next = !false = true
        usePermissionsStore.getState().toggleOverride('course:1', 'edit_rubric');
      });
      const { result } = renderHook(() => useCan('course:1', 'edit_rubric'));
      expect(result.current).toBe(true);
    });
  });
});
