// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../api-client/clients';
import { assignmentKeys, courseKeys, studentKeys } from '../lib/queryKeys';
import { Course } from '../api-client';
import { fetchCourseAssignments } from '../components/admin/hooks/useAssignmentsQuery';
import { normalizeRoster } from '../components/admin/hooks/useRosterQuery';
import { fetchVisibleAssignments } from '../components/student/fetchVisibleAssignments';

/**
 * Returns a callback that prefetches course data (assignments, roster, sections)
 * on hover. Use this in CourseMenu or any course list to warm the cache before navigation.
 */
export const usePrefetchCourse = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (course: Course) => {
      // Prefetch assignments (single aggregate request; seeds per-id caches too)
      queryClient.prefetchQuery({
        queryKey: assignmentKeys.list(course.id),
        queryFn: () => fetchCourseAssignments(queryClient, course.id),
        staleTime: 30_000,
      });

      // Prefetch roster
      queryClient.prefetchQuery({
        queryKey: courseKeys.roster(course.id),
        queryFn: async () => {
          const roster = await coursesApi.rosterRetrieve({ id: course.id });
          return normalizeRoster(roster);
        },
        staleTime: 30_000,
      });

      // Prefetch sections
      queryClient.prefetchQuery({
        queryKey: courseKeys.sections(course.id),
        queryFn: async () => {
          let allSections: import('../api-client').Section[] = [];
          let page = 1;
          while (true) {
            const response = await coursesApi.sectionsList({ id: course.id, page, pageSize: 200 });
            allSections = allSections.concat(response.results ?? []);
            if (!response.next) break;
            page += 1;
          }
          return allSections;
        },
        staleTime: 30_000,
      });
    },
    [queryClient],
  );
};

/**
 * Returns a callback that prefetches student assignment data for a single course.
 */
export const usePrefetchStudentAssignments = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (course: Course, studentSections: number[]) => {
      queryClient.prefetchQuery({
        queryKey: studentKeys.assignments(course.id),
        queryFn: () => fetchVisibleAssignments(course.id, studentSections),
        staleTime: 30_000,
      });
    },
    [queryClient],
  );
};
