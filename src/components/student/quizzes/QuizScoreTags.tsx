// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { Tag } from 'antd';

import { StudentQuiz } from '../../../api-client';

/** The student's official quiz result: the score chosen by the quiz's scoringPolicy, a
 *  pass/fail tag when the quiz defines a passing threshold, or an awaiting-grading hint
 *  while a submitted attempt still needs manual grading. Renders nothing when untaken.
 *  Score values arrive as decimal strings; Number() trims the trailing zeros. */
const QuizScoreTags: React.FC<{ quiz: StudentQuiz }> = ({ quiz }) => {
  if (quiz.myScore != null) {
    return (
      <>
        <Tag
          color={quiz.myPassed === false ? 'error' : 'green'}
          style={{ margin: 0 }}
          data-testid="student-quiz-score"
        >
          {Number(quiz.myScore)} / {Number(quiz.myMaxScore)}
        </Tag>
        {quiz.myPassed === true && (
          <Tag color="success" style={{ margin: 0 }}>
            Passed
          </Tag>
        )}
        {quiz.myPassed === false && (
          <Tag color="error" style={{ margin: 0 }}>
            Not passed
          </Tag>
        )}
      </>
    );
  }
  if (quiz.myScorePending) {
    return (
      <Tag style={{ margin: 0 }} data-testid="student-quiz-score">
        Awaiting grading
      </Tag>
    );
  }
  return null;
};

export default QuizScoreTags;
