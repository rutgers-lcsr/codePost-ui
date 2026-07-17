// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Quiz grading for the grader console: published quizzes in the course with how many
// attempts await manual grading; picking one shows the shared grading view inline in
// place of the list. Quizzes with per-student AI-generated questions the viewer may
// review (the quiz's gradersCanReviewGenerated flag, or a course admin) also offer the
// shared question-review panel here. Reached via the "Quiz Grading" nav entry, which is
// gated on the grade_quiz capability (course admins and quiz graders — the per-course
// role granted in Roster → Graders).
import * as React from 'react';

import { Empty, Flex, Space, Table, Tag, Typography } from 'antd';

import { LeftOutlined } from '@ant-design/icons';

import { useQueries } from '@tanstack/react-query';

import CPButton from '../core/CPButton';
import { quizzesApi } from '../../api-client/clients';
import { Course, Quiz } from '../../api-client';
import { quizKeys } from '../../lib/queryKeys';
import { useCourseCapabilities } from '../../stores/usePermissionsStore';
import { useCourseQuizzes } from '../admin/quizzes/queries';
import GeneratedReviewPanel from '../admin/quizzes/GeneratedReviewPanel';
import QuizGradingView from '../admin/quizzes/QuizGradingView';

const { Title, Text } = Typography;

const QuizGradingPanel: React.FC<{ course: Course }> = ({ course }) => {
  const { data: quizzes = [], isLoading } = useCourseQuizzes(course.id);
  const published = React.useMemo(() => quizzes.filter((q) => q.isPublished), [quizzes]);
  const courseCaps = useCourseCapabilities(course.id);
  // Course-admin viewer (edit_course_settings is the course-admin capability). Admins may
  // review any quiz's generated questions and use the admin-only bulk publish.
  const isCourseAdminViewer = !!courseCaps.edit_course_settings;
  const [view, setView] = React.useState<{ quiz: Quiz; mode: 'grade' | 'review' } | null>(null);

  // Quizzes whose generated questions this viewer may review (mirrors the server rule:
  // admins always, other staff when the quiz's gradersCanReviewGenerated flag is on).
  const reviewable = React.useCallback(
    (q: Quiz) => (q.generatedSections?.length ?? 0) > 0 && (q.gradersCanReviewGenerated || isCourseAdminViewer),
    [isCourseAdminViewer],
  );

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

  // Per-quiz generated-set review counts, only fetched where reviewable (the endpoint 403s
  // otherwise); shares the review panel's query key so approving refreshes the row counts.
  const reviewQueries = useQueries({
    queries: published.map((q) => ({
      queryKey: quizKeys.generatedSets(q.id ?? -1),
      queryFn: () => quizzesApi.generatedSetsList({ id: q.id! }),
      enabled: !!q.id && reviewable(q),
      retry: false,
    })),
  });
  const reviewPendingByQuiz = new Map<number, number>();
  published.forEach((q, i) => {
    const data = reviewQueries[i]?.data;
    if (q.id != null && data) {
      reviewPendingByQuiz.set(q.id, data.filter((s) => s.status === 'ready').length);
    }
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
        return count > 0 ? (
          <Tag color="gold">{count} to grade</Tag>
        ) : (
          <Tag color="green">Up to date</Tag>
        );
      },
    },
    {
      title: 'AI questions',
      key: 'review',
      width: 130,
      render: (_: unknown, q: Quiz) => {
        if (!reviewable(q)) return <Text type="secondary">—</Text>;
        const count = reviewPendingByQuiz.get(q.id ?? -1);
        if (count == null) return <Text type="secondary">—</Text>;
        return count > 0 ? (
          <Tag color="gold">{count} to review</Tag>
        ) : (
          <Tag color="green">Reviewed</Tag>
        );
      },
    },
    {
      title: '',
      key: 'open',
      width: 240,
      render: (_: unknown, q: Quiz) => (
        <Space>
          {reviewable(q) && (
            <CPButton small onClick={() => setView({ quiz: q, mode: 'review' })} data-testid="grader-open-review">
              Review questions
            </CPButton>
          )}
          <CPButton cpType="primary" small onClick={() => setView({ quiz: q, mode: 'grade' })} data-testid="grader-open-grading">
            Grade
          </CPButton>
        </Space>
      ),
    },
  ];

  // Picking a quiz swaps the list for the shared grading (or question-review) view;
  // unmounting on back resets its selection state.
  if (view) {
    return (
      <div style={{ padding: 24, maxWidth: 1000 }}>
        <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
          <CPButton cpType="link" small icon={<LeftOutlined />} onClick={() => setView(null)}>
            All quizzes
          </CPButton>
          <Title level={2} style={{ margin: 0, fontSize: 20 }}>
            {view.mode === 'grade' ? 'Grading' : 'Question review'} — {view.quiz.title}
          </Title>
        </Flex>
        {view.mode === 'grade' ? (
          <QuizGradingView quiz={view.quiz} active />
        ) : (
          <GeneratedReviewPanel
            quiz={view.quiz}
            courseId={course.id!}
            active
            adminActions={isCourseAdminViewer}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <Title level={2} style={{ fontSize: 20 }}>Quiz Grading</Title>
      <Text type="secondary">
        Published quizzes in this course. Open one to review submitted attempts and grade essay and
        code responses. Quizzes with per-student AI-generated questions also offer question review —
        edit and publish each student&apos;s set before their quiz opens.
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
    </div>
  );
};

export default QuizGradingPanel;
