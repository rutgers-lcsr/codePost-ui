// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Quiz grading for the grader console: published quizzes in the course with how many
// attempts await manual grading, opening the shared grading drawer. Reached via the
// "Quiz Grading" nav entry, which is gated on the grade_quiz capability (course admins
// and quiz graders — the per-course role granted in Roster → Graders).
import * as React from 'react';

import { Empty, Flex, Table, Tag, Typography } from 'antd';

import { useQueries } from '@tanstack/react-query';

import CPButton from '../core/CPButton';
import { quizzesApi } from '../../api-client/clients';
import { Course, Quiz } from '../../api-client';
import { quizKeys } from '../../lib/queryKeys';
import { useCourseQuizzes } from '../admin/quizzes/queries';
import QuizGradingDrawer from '../admin/quizzes/QuizGradingDrawer';

const { Title, Text } = Typography;

const QuizGradingPanel: React.FC<{ course: Course }> = ({ course }) => {
  const { data: quizzes = [], isLoading } = useCourseQuizzes(course.id);
  const published = React.useMemo(() => quizzes.filter((q) => q.isPublished), [quizzes]);
  const [gradingQuiz, setGradingQuiz] = React.useState<Quiz | null>(null);

  // Per-quiz needs-grading counts; shares the grading drawer's query key so grading
  // refreshes the row counts.
  const pendingQueries = useQueries({
    queries: published.map((q) => ({
      queryKey: quizKeys.attempts(q.id ?? -1, true),
      queryFn: () => quizzesApi.attemptsList({ id: q.id!, needsGrading: true }),
      enabled: !!q.id,
      retry: false,
    })),
  });
  const pendingByQuiz = new Map<number, number>();
  published.forEach((q, i) => {
    const data = pendingQueries[i]?.data;
    if (q.id != null && data) pendingByQuiz.set(q.id, data.length);
  });

  const columns = [
    {
      title: 'Quiz',
      key: 'title',
      render: (_: unknown, q: Quiz) => (
        <Flex align="center" gap={8}>
          <Text strong>{q.title}</Text>
          {q.assignment != null && <Tag color="green">Attached</Tag>}
        </Flex>
      ),
    },
    {
      title: 'Needs grading',
      key: 'pending',
      width: 140,
      render: (_: unknown, q: Quiz) => {
        const count = pendingByQuiz.get(q.id ?? -1);
        if (count == null) return <Text type="secondary">—</Text>;
        return count > 0 ? <Tag color="gold">{count}</Tag> : <Tag color="green">Up to date</Tag>;
      },
    },
    {
      title: '',
      key: 'open',
      width: 90,
      render: (_: unknown, q: Quiz) => (
        <CPButton cpType="primary" small onClick={() => setGradingQuiz(q)} data-testid="grader-open-grading">
          Grade
        </CPButton>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <Title level={4}>Quiz Grading</Title>
      <Text type="secondary">
        Published quizzes in this course. Open one to review submitted attempts and grade essay and
        code responses.
      </Text>
      <div style={{ marginTop: 16 }}>
        {!isLoading && published.length === 0 ? (
          <Empty description="No published quizzes in this course yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            dataSource={published}
            columns={columns}
            rowKey="id"
            size="small"
            loading={isLoading}
            pagination={false}
            data-testid="grader-quizzes-table"
          />
        )}
      </div>

      {gradingQuiz && (
        <QuizGradingDrawer open onClose={() => setGradingQuiz(null)} quiz={gradingQuiz} />
      )}
    </div>
  );
};

export default QuizGradingPanel;
