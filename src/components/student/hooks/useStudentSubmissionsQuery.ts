// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import { useQuery } from '@tanstack/react-query';
import { studentKeys } from '../../../lib/queryKeys';
import { Assignment } from '../../../types/common';
import { Submission } from '../../../api-client';
import { getHeaders } from '../../../utils/generics';

const fetchSubmissions = async (assignmentId: number, student: string): Promise<Submission[]> => {
  const res = await fetch(
    `${process.env.REACT_APP_API_URL}/assignments/${assignmentId}/submissions/?student=${student}&compact=1`,
    {
      headers: getHeaders(),
      method: 'GET',
    },
  );
  if (res.ok) {
    return res.json();
  }
  return [];
};

export const useStudentSubmissionsQuery = (
  courseId: number | undefined,
  assignments: Assignment[] | undefined,
  email: string,
) => {
  return useQuery({
    queryKey: studentKeys.submissions(courseId ?? -1),
    queryFn: async (): Promise<Record<number, Submission[]>> => {
      if (!assignments) return {};

      const submissionsMap: Record<number, Submission[]> = {};
      const eligible = assignments.filter((a) => a.isReleased || a.allowStudentUpload || a.liveFeedbackMode);
      const batchSize = 6;

      for (let i = 0; i < eligible.length; i += batchSize) {
        const batch = eligible.slice(i, i + batchSize);
        const results = await Promise.all(batch.map((a) => fetchSubmissions(a.id, email)));
        batch.forEach((a, idx) => {
          submissionsMap[a.id] = results[idx];
        });
      }

      return submissionsMap;
    },
    enabled: !!courseId && !!assignments && assignments.length > 0,
    staleTime: 0,
  });
};

export { fetchSubmissions };
