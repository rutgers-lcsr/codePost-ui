// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { assignmentsApi, coursesApi } from '../api-client/clients';
import { assignmentKeys, courseKeys, studentKeys } from '../lib/queryKeys';
import { Course } from '../api-client';
import { sanitizeAssignment, sortAssignments } from '../components/admin/hooks/useAssignmentsQuery';
import { normalizeRoster } from '../components/admin/hooks/useRosterQuery';
import { Assignment } from '../types/common';

/**
 * Returns a callback that prefetches course data (assignments, roster, sections)
 * on hover. Use this in CourseMenu or any course list to warm the cache before navigation.
 */
export const usePrefetchCourse = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (course: Course) => {
      // Prefetch assignments
      queryClient.prefetchQuery({
        queryKey: assignmentKeys.list(course.id),
        queryFn: async () => {
          if (!course.assignments?.length) return [];
          const promises = course.assignments.map((id) => assignmentsApi.retrieve({ id }));
          const results = await Promise.all(promises);
          return sortAssignments(results.map(sanitizeAssignment));
        },
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
        queryFn: async () => {
          const results = await Promise.all(
            course.assignments.map((id) => assignmentsApi.retrieve({ id })),
          );
          return (results as unknown as Assignment[]).filter(
            (a) =>
              a.isVisible &&
              !(a.hideFrom ?? []).some((shouldHide: number) => studentSections.indexOf(shouldHide) > -1),
          );
        },
        staleTime: 30_000,
      });
    },
    [queryClient],
  );
};
