// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '../../../api-client/clients';
import { assignmentKeys } from '../../../lib/queryKeys';
import { withQueryParams } from '../../../utils/apiClient';
import { Assignment, IAssignmentToSubmissionsMap, SubmissionInfoType } from '../../../types/common';

const fetchAssignmentSubmissionsCompact = async (assignmentId: number): Promise<SubmissionInfoType[]> => {
  const pageSize = 1000;
  let page = 1;
  let allResults: SubmissionInfoType[] = [];
  const assignmentsApiWithCompact = withQueryParams(assignmentsApi, { compact: 1 });

  while (true) {
    const response = await assignmentsApiWithCompact.submissionsListRaw({ id: assignmentId, page, pageSize });
    const data = (await response.raw.json()) as unknown;
    if (Array.isArray(data)) {
      allResults = data as SubmissionInfoType[];
      break;
    }

    const results = ((data as { results?: SubmissionInfoType[] } | undefined)?.results ?? []) as SubmissionInfoType[];
    allResults = allResults.concat(results);

    if (!(data as { next?: string | null } | undefined)?.next) {
      break;
    }

    page += 1;
  }

  return allResults;
};

export const useSubmissionsQuery = (courseId: number | undefined, assignments: Assignment[] | undefined) => {
  return useQuery({
    queryKey: assignmentKeys.submissions(courseId ?? -1),
    queryFn: async (): Promise<IAssignmentToSubmissionsMap> => {
      if (!assignments || assignments.length === 0) return {};

      const promises = assignments.map((a) => fetchAssignmentSubmissionsCompact(a.id));
      const results = await Promise.all(promises);

      const newSubmissions: IAssignmentToSubmissionsMap = {};
      results.forEach((subsResponse, index) => {
        const assignmentID = assignments[index].id;
        newSubmissions[assignmentID] = subsResponse ?? [];
      });

      return newSubmissions;
    },
    enabled: !!courseId && !!assignments && assignments.length > 0,
    staleTime: 0,
  });
};

export { fetchAssignmentSubmissionsCompact };
