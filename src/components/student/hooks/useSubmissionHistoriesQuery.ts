// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import { useQuery } from '@tanstack/react-query';
import { studentKeys } from '../../../lib/queryKeys';
import { Submission } from '../../../api-client';
import { getHeaders } from '../../../utils/generics';

interface SubmissionHistoryItem {
  student: string;
  hasViewed: boolean;
}

const fetchHistory = async (submissionId: number, student: string): Promise<SubmissionHistoryItem[]> => {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/submissions/${submissionId}/history/?student=${student}`, {
    headers: getHeaders(),
    method: 'GET',
  });
  if (res.ok) {
    return res.json();
  }
  return [];
};

export const useSubmissionHistoriesQuery = (
  courseId: number | undefined,
  submissions: Record<number, Submission[]> | undefined,
  email: string,
) => {
  return useQuery({
    queryKey: studentKeys.histories(courseId ?? -1),
    queryFn: async (): Promise<{ [submissionID: number]: boolean }> => {
      if (!submissions) return {};

      const viewMap: { [submissionID: number]: boolean } = {};
      const entries = Object.values(submissions).filter((subs) => subs.length > 0);
      const batchSize = 6;

      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const results = await Promise.all(batch.map((subs) => fetchHistory(subs[0].id, email)));
        batch.forEach((subs, idx) => {
          for (const historyItem of results[idx]) {
            if (historyItem.student === email) {
              viewMap[subs[0].id] = historyItem.hasViewed;
            }
          }
        });
      }

      return viewMap;
    },
    enabled: !!courseId && !!submissions && Object.keys(submissions).length > 0,
    staleTime: 0,
  });
};

export { fetchHistory };
