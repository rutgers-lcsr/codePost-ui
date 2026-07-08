// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, Flex, Spin, Tag, Typography } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import { StudentQuiz } from '../../../api-client';
import { CodePostDate } from '../../utils/CodepostDate';
import { useAvailableQuizzes } from './queries';
import { quizAction, quizActionLabel } from './quizStatus';
import QuizScoreTags from './QuizScoreTags';

const { Title, Text } = Typography;

interface IProps {
  courseId: number;
  onTake: (quiz: StudentQuiz) => void;
  /** Assignment names keyed by id, for labelling assignment-attached quizzes. */
  assignmentNamesById?: Record<number, string>;
}

const QuizCard: React.FC<{ quiz: StudentQuiz; onTake: () => void; assignmentName?: string }> = ({
  quiz,
  onTake,
  assignmentName,
}) => {
  const action = quizAction(quiz);
  const allowedLabel = quiz.attemptsAllowed === 0 ? 'unlimited' : quiz.attemptsAllowed;

  return (
    <Card size="small" data-testid="student-quiz-card">
      <Flex justify="space-between" align="center" gap={16} wrap>
        <div style={{ minWidth: 0 }}>
          <Title level={5} style={{ margin: 0 }}>
            {quiz.title}
          </Title>
          <Flex gap={12} wrap style={{ marginTop: 4 }}>
            {assignmentName && <Text type="secondary">Assignment: {assignmentName}</Text>}
            <Text type="secondary">
              <FileTextOutlined /> {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
            </Text>
            {quiz.timeLimitMinutes ? (
              <Text type="secondary">
                <ClockCircleOutlined /> {quiz.timeLimitMinutes} min
              </Text>
            ) : null}
            {quiz.closeAt ? (
              <Text type="secondary">
                <CalendarOutlined /> Due <CodePostDate datetime={quiz.closeAt} />
              </Text>
            ) : null}
            {(quiz.attemptsAllowed ?? 1) !== 1 && (
              <Text type="secondary">
                Attempts: {quiz.attemptsUsed} / {allowedLabel}
              </Text>
            )}
            <QuizScoreTags quiz={quiz} />
            {/* For locked quizzes the action slot already explains why; skip the redundant tag. */}
            {!quiz.availability?.isOpen && action !== 'locked' && <Tag>Closed</Tag>}
          </Flex>
        </div>
        {action === 'locked' ? (
          <Tag data-testid="student-quiz-locked">{quizActionLabel(quiz)}</Tag>
        ) : (
          <CPButton
            cpType={action === 'review' ? 'secondary' : 'primary'}
            onClick={onTake}
            data-testid="student-quiz-action"
          >
            {quizActionLabel(quiz)}
          </CPButton>
        )}
      </Flex>
    </Card>
  );
};

const StudentQuizzesSection: React.FC<IProps> = ({ courseId, onTake, assignmentNamesById }) => {
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
          <Title level={4}>Quizzes</Title>
          <Flex vertical gap={12}>
            {standalone.map((q) => (
              <QuizCard key={q.id} quiz={q} onTake={() => onTake(q)} />
            ))}
          </Flex>
        </section>
      )}
      {attached.length > 0 && (
        <section style={{ marginBottom: 24 }} data-testid="assignment-quizzes-section">
          <Title level={4}>Assignment Quizzes</Title>
          <Flex vertical gap={12}>
            {attached.map((q) => (
              <QuizCard
                key={q.id}
                quiz={q}
                onTake={() => onTake(q)}
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
