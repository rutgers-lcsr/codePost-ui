// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useQueries, useQuery } from '@tanstack/react-query';
import { quizAttemptsApi } from '../../../api-client/clients';
import { studentKeys } from '../../../lib/queryKeys';
import { Course, StudentQuiz, StudentQuizAttempt } from '../../../api-client';

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

/** Available quizzes across all of the student's courses (one request per course, shares the
 *  per-course cache with useAvailableQuizzes). Used by the cross-course dashboard. */
export const useAllAvailableQuizzes = (courses: Course[]): { quiz: StudentQuiz; course: Course }[] => {
  const results = useQueries({
    queries: courses.map((course) => ({
      queryKey: studentKeys.availableQuizzes(course.id ?? -1),
      queryFn: (): Promise<StudentQuiz[]> => quizAttemptsApi.availableQuizzesList({ course: course.id! }),
      enabled: !!course.id,
    })),
  });
  const byId = new Map(courses.map((c) => [c.id, c]));
  const items: { quiz: StudentQuiz; course: Course }[] = [];
  for (const r of results) {
    for (const quiz of r.data ?? []) {
      const course = byId.get(quiz.course);
      if (course) items.push({ quiz, course });
    }
  }
  return items;
};
