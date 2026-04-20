// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api-client/clients', () => ({
  assignmentsApi: { retrieve: vi.fn() },
  coursesApi: { rosterRetrieve: vi.fn(), sectionsList: vi.fn() },
}));

vi.mock('../../components/admin/hooks/useAssignmentsQuery', () => ({
  sanitizeAssignment: vi.fn((a: any) => a),
  sortAssignments: vi.fn((a: any) => a),
}));

vi.mock('../../components/admin/hooks/useRosterQuery', () => ({
  normalizeRoster: vi.fn((r: any) => r),
}));

import { usePrefetchCourse, usePrefetchStudentAssignments } from '../usePrefetchCourse';
import { assignmentsApi, coursesApi } from '../../api-client/clients';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

describe('usePrefetchCourse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a stable callback', () => {
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(() => usePrefetchCourse(), { wrapper });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('prefetches assignments, roster, and sections', async () => {
    const { queryClient, wrapper } = createWrapper();
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

    vi.mocked(assignmentsApi.retrieve).mockResolvedValue({ id: 1 } as any);
    vi.mocked(coursesApi.rosterRetrieve).mockResolvedValue({ students: [] } as any);
    vi.mocked(coursesApi.sectionsList).mockResolvedValue({ results: [], next: null } as any);

    const { result } = renderHook(() => usePrefetchCourse(), { wrapper });

    const course = { id: 42, assignments: [1, 2] } as any;
    result.current(course);

    // Should queue 3 prefetch queries: assignments, roster, sections
    expect(prefetchSpy).toHaveBeenCalledTimes(3);
  });

  it('returns empty array when course has no assignments', async () => {
    const { queryClient, wrapper } = createWrapper();

    vi.mocked(coursesApi.rosterRetrieve).mockResolvedValue({ students: [] } as any);
    vi.mocked(coursesApi.sectionsList).mockResolvedValue({ results: [], next: null } as any);

    const { result } = renderHook(() => usePrefetchCourse(), { wrapper });

    const course = { id: 42, assignments: [] } as any;
    result.current(course);

    // Wait for query to settle, then verify query data
    await vi.waitFor(async () => {
      const data = queryClient.getQueryData(['assignments', 'list', 42]);
      expect(data).toEqual([]);
    });
  });

  it('paginates sections when there are multiple pages', async () => {
    const { queryClient, wrapper } = createWrapper();

    vi.mocked(coursesApi.rosterRetrieve).mockResolvedValue({ students: [] } as any);
    vi.mocked(coursesApi.sectionsList)
      .mockResolvedValueOnce({ results: [{ id: 1 }], next: 'page2' } as any)
      .mockResolvedValueOnce({ results: [{ id: 2 }], next: null } as any);

    const { result } = renderHook(() => usePrefetchCourse(), { wrapper });

    result.current({ id: 42, assignments: [] } as any);

    await vi.waitFor(async () => {
      const data = queryClient.getQueryData(['courses', 42, 'sections']) as any[];
      expect(data).toHaveLength(2);
    });

    expect(coursesApi.sectionsList).toHaveBeenCalledTimes(2);
  });
});

describe('usePrefetchStudentAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefetches visible student assignments', async () => {
    const { queryClient, wrapper } = createWrapper();

    vi.mocked(assignmentsApi.retrieve)
      .mockResolvedValueOnce({ id: 1, isVisible: true, hideFrom: [] } as any)
      .mockResolvedValueOnce({ id: 2, isVisible: false, hideFrom: [] } as any)
      .mockResolvedValueOnce({ id: 3, isVisible: true, hideFrom: [10] } as any);

    const { result } = renderHook(() => usePrefetchStudentAssignments(), { wrapper });

    result.current({ id: 42, assignments: [1, 2, 3] } as any, [10]);

    await vi.waitFor(async () => {
      const data = queryClient.getQueryData(['student', 'assignments', 42]) as any[];
      // id:1 visible + not hidden; id:2 not visible; id:3 visible but hidden from section 10
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(1);
    });
  });

  it('handles assignments with null hideFrom', async () => {
    const { queryClient, wrapper } = createWrapper();

    vi.mocked(assignmentsApi.retrieve).mockResolvedValueOnce({
      id: 1,
      isVisible: true,
      hideFrom: null,
    } as any);

    const { result } = renderHook(() => usePrefetchStudentAssignments(), { wrapper });

    result.current({ id: 42, assignments: [1] } as any, [5]);

    await vi.waitFor(async () => {
      const data = queryClient.getQueryData(['student', 'assignments', 42]) as any[];
      expect(data).toHaveLength(1);
    });
  });
});
