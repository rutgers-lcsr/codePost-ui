// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, Flex, Spin, Tag, Typography } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import { StudentQuiz } from '../../../api-client';
import { CodePostDate } from '../../utils/CodepostDate';
import { useAvailableQuizzes } from './queries';
import { quizAction, quizActionLabel } from './quizStatus';

const { Title, Text } = Typography;

interface IProps {
  courseId: number;
  onTake: (quiz: StudentQuiz) => void;
}

const QuizCard: React.FC<{ quiz: StudentQuiz; onTake: () => void }> = ({ quiz, onTake }) => {
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
            {!quiz.availability?.isOpen && <Tag>Closed</Tag>}
          </Flex>
        </div>
        <CPButton
          cpType={action === 'review' ? 'secondary' : 'primary'}
          onClick={onTake}
          data-testid="student-quiz-action"
        >
          {quizActionLabel(quiz)}
        </CPButton>
      </Flex>
    </Card>
  );
};

const StudentQuizzesSection: React.FC<IProps> = ({ courseId, onTake }) => {
  const { data: allQuizzes = [], isLoading } = useAvailableQuizzes(courseId);
  // Attached quizzes live on their assignment card; this section is standalone quizzes only.
  const quizzes = allQuizzes.filter((q) => q.assignment == null);

  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 24 }}>
        <Spin />
      </Flex>
    );
  }
  if (quizzes.length === 0) return null;

  return (
    <section style={{ marginBottom: 24 }}>
      <Title level={4}>Quizzes</Title>
      <Flex vertical gap={12}>
        {quizzes.map((q) => (
          <QuizCard key={q.id} quiz={q} onTake={() => onTake(q)} />
        ))}
      </Flex>
    </section>
  );
};

export default StudentQuizzesSection;
