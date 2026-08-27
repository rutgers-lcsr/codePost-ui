// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Course, StudentQuiz } from '../../../api-client';
import { encodedCourseLink } from '../../core/CourseMenu';
import { quizNeedsAction } from '../actionStatus';
import { useAvailableQuizzes } from './queries';

/** Bundles the student course view's quiz concerns: the course's available quizzes, their
 *  grouping onto assignment cards, the sidebar badge count, and take/review navigation. */
export function useStudentQuizzes(course: Course | undefined) {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: courseQuizzes = [], isLoading: isLoadingQuizzes } = useAvailableQuizzes(course?.id);

  // Attached quizzes surface on their assignment card; group them by assignment id.
  const quizzesByAssignment = useMemo(() => {
    const map = new Map<number, StudentQuiz[]>();
    for (const quiz of courseQuizzes) {
      if (quiz.assignment == null) continue;
      const list = map.get(quiz.assignment) ?? [];
      list.push(quiz);
      map.set(quiz.assignment, list);
    }
    return map;
  }, [courseQuizzes]);

  const goToQuiz = useCallback(
    (quiz: StudentQuiz, page: 'take' | 'review') => {
      if (!course) return;
      // Absolute path: this can fire from either the Assignments or Quizzes page,
      // so a relative `quizzes/...` would double up on the latter.
      navigate(encodedCourseLink('student', course, `quizzes/${quiz.id}/${page}`), {
        state: { title: quiz.title, from: location.pathname },
      });
    },
    [navigate, course, location.pathname],
  );
  const handleTakeQuiz = useCallback((quiz: StudentQuiz) => goToQuiz(quiz, 'take'), [goToQuiz]);
  const handleReviewQuiz = useCallback((quiz: StudentQuiz) => goToQuiz(quiz, 'review'), [goToQuiz]);

  // Sidebar badge count: quizzes the student still needs to act on. The Quizzes page lists
  // standalone AND attached quizzes, so the count covers both.
  const quizzesNeedingAction = useMemo(() => courseQuizzes.filter(quizNeedsAction).length, [courseQuizzes]);

  return {
    courseQuizzes,
    isLoadingQuizzes,
    quizzesByAssignment,
    quizzesNeedingAction,
    handleTakeQuiz,
    handleReviewQuiz,
  };
}
