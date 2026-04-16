// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../../../api-client/clients';
import { courseKeys } from '../../../lib/queryKeys';
import { Section } from '../../../api-client';

export const useSectionsQuery = (courseId: number | undefined) => {
  return useQuery({
    queryKey: courseKeys.sections(courseId ?? -1),
    queryFn: async () => {
      const pageSize = 200;
      let page = 1;
      let allSections: Section[] = [];

      while (true) {
        const response = await coursesApi.sectionsList({ id: courseId!, page, pageSize });
        const results = response.results ?? [];
        allSections = allSections.concat(results);

        if (!response.next) {
          break;
        }

        page += 1;
      }

      return allSections;
    },
    enabled: !!courseId,
  });
};
