// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import QuizTakingView from './QuizTakingView';

/** Full-page route wrapper for reviewing past quiz attempts (no new attempt is started).
 *  Mirrors QuizTakeRoute: quiz id from the URL, course id from the parent. */
const QuizReviewRoute: React.FC<{ courseId?: number }> = ({ courseId }) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const quizId = Number(params.quizId);
  if (!courseId || !quizId) return <Navigate to="/student" replace />;

  const base = location.pathname.replace(/\/quizzes\/[^/]+\/review\/?$/, '') || '/student';
  const state = location.state as { title?: string; from?: string } | null;
  const title = state?.title;
  const back = state?.from ?? base;

  return (
    <QuizTakingView quizId={quizId} courseId={courseId} quizTitle={title} reviewOnly onExit={() => navigate(back)} />
  );
};

export default QuizReviewRoute;
