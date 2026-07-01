// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useQuery } from '@tanstack/react-query';
import { quizAttemptsApi } from '../../../api-client/clients';
import { studentKeys } from '../../../lib/queryKeys';
import { StudentQuiz, StudentQuizAttempt } from '../../../api-client';

/** Published quizzes in a course the student can take now (or has already attempted). */
export const useAvailableQuizzes = (courseId: number | undefined) =>
  useQuery({
    queryKey: studentKeys.availableQuizzes(courseId ?? -1),
    queryFn: (): Promise<StudentQuiz[]> => quizAttemptsApi.availableQuizzesList({ course: courseId! }),
    enabled: !!courseId,
  });

/** The calling student's attempts for one quiz. */
export const useMyAttempts = (quizId: number | undefined) =>
  useQuery({
    queryKey: studentKeys.quizAttempts(quizId ?? -1),
    queryFn: (): Promise<StudentQuizAttempt[]> => quizAttemptsApi.myAttemptsList({ quiz: quizId! }),
    enabled: !!quizId,
  });
