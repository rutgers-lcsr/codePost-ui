// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import QuizTakingView from './QuizTakingView';

/** Full-page route wrapper for taking a quiz: reads the quiz id from the URL and the
 *  course id from its parent, and routes back to the course view on exit. */
const QuizTakeRoute: React.FC<{ courseId?: number }> = ({ courseId }) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const quizId = Number(params.quizId);
  if (!courseId || !quizId) return <Navigate to="/student" replace />;

  const base = location.pathname.replace(/\/quizzes\/[^/]+\/take\/?$/, '') || '/student';
  const state = location.state as { title?: string; from?: string } | null;
  const title = state?.title;
  // Return to the page the quiz was started from (Assignments or Quizzes);
  // deep links carry no state and fall back to the course root.
  const back = state?.from ?? base;

  return (
    <QuizTakingView quizId={quizId} courseId={courseId} quizTitle={title} onExit={() => navigate(back)} />
  );
};

export default QuizTakeRoute;
