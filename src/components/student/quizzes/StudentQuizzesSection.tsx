// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, Flex, Space, Spin, Tag, Typography } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, FileTextOutlined, LockOutlined } from '@ant-design/icons';
import { StudentQuiz } from '../../../api-client';
import { CodePostDate } from '../../utils/CodepostDate';
import { useAvailableQuizzes } from './queries';
import { quizAction, quizLockText } from './quizStatus';
import QuizActions from './QuizActions';
import QuizScoreTags from './QuizScoreTags';

const { Title, Text } = Typography;

interface IProps {
  courseId: number;
  onTake: (quiz: StudentQuiz) => void;
  /** Review past submitted attempts (results + grader feedback) without starting one. */
  onReview?: (quiz: StudentQuiz) => void;
  /** Assignment names keyed by id, for labelling assignment-attached quizzes. */
  assignmentNamesById?: Record<number, string>;
}

const QuizCard: React.FC<{
  quiz: StudentQuiz;
  onTake: () => void;
  onReview?: () => void;
  assignmentName?: string;
}> = ({ quiz, onTake, onReview, assignmentName }) => {
  const action = quizAction(quiz);
  const allowedLabel = quiz.attemptsAllowed === 0 ? 'unlimited' : quiz.attemptsAllowed;

  return (
    <Card size="small" data-testid="student-quiz-card">
      <Flex justify="space-between" align="center" gap={16} wrap>
        <div style={{ minWidth: 0 }}>
          {/* h4 under the section's h3 — keeps the outline h2 → h3 → h4 with no skips. */}
          <Title level={4} style={{ margin: 0, fontSize: 16 }}>
            {quiz.title}
          </Title>
          <Flex gap={12} wrap style={{ marginTop: 4 }}>
            {assignmentName && <Text type="secondary">Assignment: {assignmentName}</Text>}
            <Text type="secondary">
              <FileTextOutlined aria-hidden /> {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
            </Text>
            {quiz.timeLimitMinutes ? (
              <Text type="secondary">
                <ClockCircleOutlined aria-hidden /> {quiz.timeLimitMinutes} min
              </Text>
            ) : null}
            {quiz.closeAt ? (
              <Text type="secondary">
                <CalendarOutlined aria-hidden /> Due <CodePostDate datetime={quiz.closeAt} />
              </Text>
            ) : null}
            {(quiz.attemptsAllowed ?? 1) !== 1 && (
              <Text type="secondary">
                Attempts: {quiz.attemptsUsed} / {allowedLabel}
              </Text>
            )}
            {quiz.requireSebBrowser && (
              <Tag icon={<LockOutlined aria-hidden />} data-testid="student-quiz-seb-tag">
                Safe Exam Browser required
              </Tag>
            )}
            <QuizScoreTags quiz={quiz} />
            {/* For locked quizzes the action slot already explains why; skip the redundant tag.
                Otherwise (e.g. reviewable) show the real not-open reason — a quiz awaiting its
                generated questions is "being prepared", not closed. */}
            {!quiz.availability?.isOpen && action !== 'locked' && (
              <Tag>{quizLockText(quiz.availability?.reason)}</Tag>
            )}
          </Flex>
        </div>
        <Space>
          <QuizActions quiz={quiz} onTake={onTake} onReview={onReview} testIdPrefix="student-quiz" />
        </Space>
      </Flex>
    </Card>
  );
};

const StudentQuizzesSection: React.FC<IProps> = ({ courseId, onTake, onReview, assignmentNamesById }) => {
  const { data: allQuizzes = [], isLoading } = useAvailableQuizzes(courseId);
  const standalone = allQuizzes.filter((q) => q.assignment == null);
  // Attached quizzes also live on their assignment card; listing them here gives a second entry point.
  const attached = allQuizzes.filter((q) => q.assignment != null);

  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 24 }}>
        <Spin />
      </Flex>
    );
  }
  if (standalone.length === 0 && attached.length === 0) return null;

  return (
    <>
      {standalone.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          {/* h3 under the course header's h2 (Student.tsx) — no skipped level. */}
          <Title level={3} style={{ fontSize: 20 }}>Quizzes</Title>
          <Flex vertical gap={12}>
            {standalone.map((q) => (
              <QuizCard key={q.id} quiz={q} onTake={() => onTake(q)} onReview={onReview && (() => onReview(q))} />
            ))}
          </Flex>
        </section>
      )}
      {attached.length > 0 && (
        <section style={{ marginBottom: 24 }} data-testid="assignment-quizzes-section">
          <Title level={3} style={{ fontSize: 20 }}>Assignment Quizzes</Title>
          <Flex vertical gap={12}>
            {attached.map((q) => (
              <QuizCard
                key={q.id}
                quiz={q}
                onTake={() => onTake(q)}
                onReview={onReview && (() => onReview(q))}
                assignmentName={q.assignment != null ? assignmentNamesById?.[q.assignment] : undefined}
              />
            ))}
          </Flex>
        </section>
      )}
    </>
  );
};

export default StudentQuizzesSection;
