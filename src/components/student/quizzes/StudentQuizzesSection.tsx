// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, Flex, Spin, Tag, Typography } from 'antd';
import { ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import { StudentQuiz } from '../../../api-client';
import { useAvailableQuizzes } from './queries';

const { Title, Text } = Typography;

interface IProps {
  courseId: number;
  onTake: (quiz: StudentQuiz) => void;
}

const canStartQuiz = (quiz: StudentQuiz): boolean => {
  if (!quiz.availability?.isOpen) return false;
  const allowed = quiz.attemptsAllowed ?? 1;
  return allowed === 0 || quiz.attemptsUsed < allowed;
};

const QuizCard: React.FC<{ quiz: StudentQuiz; onTake: () => void }> = ({ quiz, onTake }) => {
  const startable = canStartQuiz(quiz);
  const allowedLabel = quiz.attemptsAllowed === 0 ? 'unlimited' : quiz.attemptsAllowed;

  return (
    <Card size="small">
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
            <Text type="secondary">
              Attempts: {quiz.attemptsUsed} / {allowedLabel}
            </Text>
            {!quiz.availability?.isOpen && <Tag>Closed</Tag>}
          </Flex>
        </div>
        <CPButton cpType={startable ? 'primary' : 'secondary'} onClick={onTake}>
          {startable ? (quiz.attemptsUsed > 0 ? 'New attempt' : 'Start quiz') : 'Review results'}
        </CPButton>
      </Flex>
    </Card>
  );
};

const StudentQuizzesSection: React.FC<IProps> = ({ courseId, onTake }) => {
  const { data: quizzes = [], isLoading } = useAvailableQuizzes(courseId);

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
