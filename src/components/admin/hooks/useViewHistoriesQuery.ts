// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '../../../api-client/clients';
import { assignmentKeys } from '../../../lib/queryKeys';
import { Assignment } from '../../../types/common';
import { SubmissionHistory } from '../../../api-client';

type ViewsBySubmission = { [submissionID: number]: { [student: string]: string } };

const fetchAllSubmissionHistories = async (assignmentId: number): Promise<SubmissionHistory[]> => {
  const pageSize = 200;
  let page = 1;
  let allResults: SubmissionHistory[] = [];

  while (true) {
    const response = await assignmentsApi.submissionHistoriesList({ id: assignmentId, page, pageSize });
    const results = response.results ?? [];
    allResults = allResults.concat(results as SubmissionHistory[]);

    if (!response.next) {
      break;
    }

    page += 1;
  }

  return allResults;
};

export const useViewHistoriesQuery = (courseId: number | undefined, assignments: Assignment[] | undefined) => {
  return useQuery({
    queryKey: assignmentKeys.viewHistories(courseId ?? -1),
    queryFn: async (): Promise<ViewsBySubmission> => {
      if (!assignments || assignments.length === 0) return {};

      const allHistories = await Promise.all(assignments.map((a) => fetchAllSubmissionHistories(a.id)));

      const views: ViewsBySubmission = {};
      allHistories.flat().forEach((h) => {
        const { submission, student, hasViewed, dateViewed } = h;
        if (!(submission in views)) {
          views[submission] = {};
        }
        if (hasViewed && dateViewed) {
          views[submission][student] = dateViewed;
        }
      });

      return views;
    },
    enabled: !!courseId && !!assignments && assignments.length > 0,
    staleTime: 0,
  });
};
