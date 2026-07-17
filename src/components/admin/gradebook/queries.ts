// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../../../api-client/clients';
import { GradebookResponse } from '../../../api-client';
import { courseKeys } from '../../../lib/queryKeys';

/** The course gradebook: every active student × every assignment and quiz, with totals
 *  over graded work (course admins only — the server 403s everyone else). */
export const useGradebook = (courseId: number | undefined) =>
  useQuery({
    queryKey: courseKeys.gradebook(courseId ?? -1),
    queryFn: (): Promise<GradebookResponse> => coursesApi.gradebookRetrieve({ id: courseId! }),
    enabled: !!courseId,
  });
