// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { assignmentsApi, submissionsApi, assignmentFilesApi } from '../../../api-client/clients';
import { assignmentKeys, courseKeys, graderKeys, submissionKeys } from '../../../lib/queryKeys';
import type { AnonymousSubmissionInfoType, AssignmentType } from '../../../types/models';
import type { Course } from '../../../api-client';
import { Submission as SubmissionService } from '../../../services/submission';

/**
 * After the current submission loads, this hook:
 * 1. Caches assignment-level data (rubric, course, assignment details) so the next
 *    submission in the same assignment loads instantly for shared data.
 * 2. Finds the next unfinalized submission from the grader's cached submission list
 *    and prefetches its per-submission data (submission object, files, comments).
 */
export const usePrefetchNextSubmission = (
  currentSubmissionId: number | undefined,
  assignment: AssignmentType | undefined,
  course: Course | undefined,
  graderEmail: string | undefined,
  isLoading: boolean,
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoading || !currentSubmissionId || !assignment || !course || !graderEmail) return;

    // 1. Seed the cache with shared assignment-level data we already have
    queryClient.setQueryData(assignmentKeys.detail(assignment.id), assignment);
    queryClient.setQueryData(courseKeys.roster(course.id), (existing: unknown) => existing);

    // 2. Prefetch shared data that doesn't change between submissions
    queryClient.prefetchQuery({
      queryKey: assignmentKeys.rubric(assignment.id),
      queryFn: () => assignmentsApi.rubricRetrieve({ id: assignment.id }),
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      queryKey: assignmentKeys.detail(assignment.id),
      queryFn: () => assignmentsApi.retrieve({ id: assignment.id }),
      staleTime: 60_000,
    });

    if (assignment.templateMode && assignment.files?.length) {
      for (const fileId of assignment.files) {
        if (typeof fileId === 'number') {
          queryClient.prefetchQuery({
            queryKey: ['assignmentFile', fileId],
            queryFn: () => assignmentFilesApi.retrieve({ id: fileId }),
            staleTime: 60_000,
          });
        }
      }
    }

    // 3. Find the next unfinalized submission from the grader's cached list
    const cachedSubmissions = queryClient.getQueryData<AnonymousSubmissionInfoType[]>(
      graderKeys.submissions(assignment.id, graderEmail),
    );

    if (!cachedSubmissions || cachedSubmissions.length === 0) return;

    // Find unfinalised submissions that aren't the current one
    const unfinalizedSubs = cachedSubmissions.filter((sub) => !sub.isFinalized && sub.id !== currentSubmissionId);

    if (unfinalizedSubs.length === 0) return;

    // Prefetch the next unfinalized submission (the one the grader is most likely to open next)
    const nextSub = unfinalizedSubs[0];

    // Prefetch submission object
    queryClient.prefetchQuery({
      queryKey: submissionKeys.detail(nextSub.id),
      queryFn: () => submissionsApi.retrieve({ id: nextSub.id }),
      staleTime: 30_000,
    });

    // Prefetch permission check
    queryClient.prefetchQuery({
      queryKey: submissionKeys.permissions(nextSub.id),
      queryFn: () => submissionsApi.checkPermissionRetrieve({ id: nextSub.id }),
      staleTime: 30_000,
    });

    // Prefetch submission files + comments (the most expensive part)
    queryClient.prefetchQuery({
      queryKey: submissionKeys.files(nextSub.id),
      queryFn: async () => {
        const sub = await queryClient.ensureQueryData({
          queryKey: submissionKeys.detail(nextSub.id),
          queryFn: () => submissionsApi.retrieve({ id: nextSub.id }),
        });
        return SubmissionService.loadData(sub);
      },
      staleTime: 30_000,
    });
  }, [isLoading, currentSubmissionId, assignment, course, graderEmail, queryClient]);
};
