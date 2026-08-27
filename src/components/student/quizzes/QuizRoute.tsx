// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import QuizTakingView from './QuizTakingView';

/** Full-page route wrapper for a quiz: `take` starts/resumes an attempt, `review` opens
 *  past submitted attempts without starting one. Reads the quiz id from the URL and the
 *  course id from its parent, and routes back to the course view on exit. */
const QuizRoute: React.FC<{ courseId?: number; mode: 'take' | 'review' }> = ({ courseId, mode }) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const quizId = Number(params.quizId);
  const routeState = location.state as { title?: string; from?: string } | null;

  // WCAG 2.4.2: the quiz is a full-page view, so mirror its title into the tab title
  // (the consoles only set document.title once on mount). Restore on exit.
  React.useEffect(() => {
    const previous = document.title;
    const name = routeState?.title ?? 'Quiz';
    document.title = mode === 'review' ? `${name} — results — codePost` : `${name} — codePost`;
    return () => {
      document.title = previous;
    };
  }, [routeState?.title, mode]);

  // Once the attempt is submitted (or /take falls back to reviewing past attempts), swap
  // the URL to /review in place — otherwise refreshing on /take would start a new attempt.
  // Both routes render this same component, so React keeps the view mounted across the swap.
  const handleSubmitted = React.useCallback(() => {
    navigate(location.pathname.replace(/\/take\/?$/, '/review'), {
      replace: true,
      state: location.state,
    });
  }, [navigate, location.pathname, location.state]);

  if (!courseId || !quizId) return <Navigate to="/student" replace />;

  const base = location.pathname.replace(/\/quizzes\/[^/]+\/(take|review)\/?$/, '') || '/student';
  const title = routeState?.title;
  // Return to the page the quiz was opened from (Assignments or Quizzes);
  // deep links carry no state and fall back to the course root.
  const back = routeState?.from ?? base;

  return (
    <QuizTakingView
      quizId={quizId}
      courseId={courseId}
      quizTitle={title}
      reviewOnly={mode === 'review'}
      onSubmitted={mode === 'take' ? handleSubmitted : undefined}
      onExit={() => navigate(back)}
    />
  );
};

export default QuizRoute;
