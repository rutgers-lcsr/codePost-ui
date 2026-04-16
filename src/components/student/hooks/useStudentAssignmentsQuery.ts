// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '../../../api-client/clients';
import { studentKeys } from '../../../lib/queryKeys';
import { Assignment } from '../../../types/common';
import { Course } from '../../../api-client';

export const useStudentAssignmentsQuery = (
  course: Course | undefined,
  studentSections: number[],
) => {
  return useQuery({
    queryKey: studentKeys.assignments(course?.id ?? -1),
    queryFn: async (): Promise<Assignment[]> => {
      if (!course) return [];
      const results = await Promise.all(
        course.assignments.map((id) => assignmentsApi.retrieve({ id })),
      );
      return (results as unknown as Assignment[]).filter(
        (a) =>
          a.isVisible &&
          !(a.hideFrom ?? []).some((shouldHide: number) => studentSections.indexOf(shouldHide) > -1),
      );
    },
    enabled: !!course && course.assignments.length > 0,
  });
};
