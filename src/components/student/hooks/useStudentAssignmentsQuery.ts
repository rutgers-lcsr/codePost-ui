// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useQuery } from '@tanstack/react-query';
import { studentKeys } from '../../../lib/queryKeys';
import { Assignment } from '../../../types/common';
import { Course } from '../../../api-client';
import { fetchVisibleAssignments } from '../fetchVisibleAssignments';

export const useStudentAssignmentsQuery = (
  course: Course | undefined,
  studentSections: number[],
) => {
  return useQuery({
    queryKey: studentKeys.assignments(course?.id ?? -1),
    queryFn: async (): Promise<Assignment[]> => {
      if (!course) return [];
      return fetchVisibleAssignments(course.assignments, studentSections);
    },
    enabled: !!course && course.assignments.length > 0,
  });
};
