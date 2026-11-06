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

import { Breadcrumb, Button, Empty, Flex, Space, Table, Tag, Typography } from 'antd';

import { useQueries } from '@tanstack/react-query';

import CPAdminDetail from '../admin/other/CPAdminDetail';
import CPButton from '../core/CPButton';
import { GREEN_TAG } from '../../theme/tagStyles';
import { quizzesApi } from '../../api-client/clients';
import { Course, Quiz } from '../../api-client';
import { quizKeys } from '../../lib/queryKeys';
import { useCourseCapabilities } from '../../stores/usePermissionsStore';
import { useCourseQuizzes } from '../admin/quizzes/queries';
import GeneratedReviewPanel from '../admin/quizzes/GeneratedReviewPanel';
import QuizGradingView from '../admin/quizzes/QuizGradingView';

const { Text } = Typography;

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
          {q.assignment != null && <Tag style={GREEN_TAG}>Attached</Tag>}
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
        // Work gets a tag; "nothing to do" is plain text, not a low-contrast green pill.
        return count > 0 ? <Tag color="gold">{count} to grade</Tag> : <Text type="secondary">Up to date</Text>;
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
        return count > 0 ? <Tag color="gold">{count} to review</Tag> : <Text type="secondary">Reviewed</Text>;
      },
    },
    {
      title: '',
      key: 'open',
      width: 240,
      render: (_: unknown, q: Quiz) => (
        <Space>
          {reviewable(q) && (
            <CPButton
              small
              onClick={() => setView({ quiz: q, mode: 'review' })}
              aria-label={`Review questions for ${q.title}`}
              data-testid="grader-open-review"
            >
              Review questions
            </CPButton>
          )}
          <CPButton
            cpType="primary"
            small
            onClick={() => setView({ quiz: q, mode: 'grade' })}
            aria-label={`Grade ${q.title}`}
            data-testid="grader-open-grading"
          >
            Grade
          </CPButton>
        </Space>
      ),
    },
  ];

  // The same card-and-breadcrumb chrome as the other grader panels. The root crumb goes
  // back to the list, like the assignment panels' first crumb.
  const rootCrumb = {
    title: view ? (
      <Button type="link" size="small" style={{ padding: 0, height: 'auto' }} onClick={() => setView(null)}>
        Quiz Grading
      </Button>
    ) : (
      'Quiz Grading'
    ),
  };

  // Picking a quiz swaps the list for the shared grading (or question-review) view;
  // unmounting on back resets its selection state.
  if (view) {
    return (
      <CPAdminDetail
        goBack={null}
        breadcrumbs={<Breadcrumb items={[rootCrumb, { title: view.quiz.title }]} />}
        title={
          <div style={{ letterSpacing: '-0.3px' }}>
            {`${view.mode === 'grade' ? 'Grading' : 'Question review'}: ${view.quiz.title}`}
          </div>
        }
        actions={[]}
        content={
          view.mode === 'grade' ? (
            <QuizGradingView quiz={view.quiz} active />
          ) : (
            <GeneratedReviewPanel quiz={view.quiz} courseId={course.id!} active adminActions={isCourseAdminViewer} />
          )
        }
        gutterSize={0}
      />
    );
  }

  return (
    <CPAdminDetail
      goBack={null}
      breadcrumbs={<Breadcrumb items={[rootCrumb]} />}
      title={<div style={{ letterSpacing: '-0.3px' }}>Quiz Grading</div>}
      titleInfo="Published quizzes in this course. Open one to review submitted attempts and grade essay and code responses. Quizzes with per-student AI-generated questions also offer question review: edit and publish each student's set before their quiz opens."
      actions={[]}
      content={
        !isLoading && published.length === 0 ? (
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
        )
      }
      gutterSize={0}
    />
  );
};

export default QuizGradingPanel;
