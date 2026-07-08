// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Drawer, Flex, Space, Switch, Tag, Typography } from 'antd';
import { Question, Quiz, StudentQuizResponse } from '../../../api-client';
import Markdown from './Markdown';
import { AnswerValue, initialAnswer } from '../../student/quizzes/QuestionAnswerer';
import QuizQuestions from '../../student/quizzes/QuizQuestions';

const { Title, Text } = Typography;

export interface PreviewItem {
  question: Question;
  points: number;
}

interface IProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz;
  items: PreviewItem[];
  hasGroups: boolean;
}

/** Adapt an authoring Question into the student-facing response shape so the preview
 *  renders with the exact component students will use to take the quiz. */
const toResponse = (item: PreviewItem, index: number): StudentQuizResponse => ({
  id: item.question.id,
  question: {
    id: item.question.id,
    questionType: item.question.questionType!,
    text: item.question.text,
    description: item.question.description ?? null,
    starterCode: item.question.starterCode ?? null,
    language: item.question.language ?? null,
    generalFeedback: item.question.generalFeedback,
    choices: (item.question.choices ?? []).map((c) => ({
      id: c.id!,
      text: c.text,
      sortKey: c.sortKey ?? 0,
      isCorrect: c.isCorrect,
      feedback: c.feedback,
    })),
  },
  sortKey: index,
  points: item.points,
  answerText: '',
  selectedChoices: [],
});

const QuizPreviewDrawer: React.FC<IProps> = ({ open, onClose, quiz, items, hasGroups }) => {
  const [reveal, setReveal] = React.useState(false);
  const [answers, setAnswers] = React.useState<Record<number, AnswerValue>>({});

  // Reset interaction state each time the preview opens.
  React.useEffect(() => {
    if (open) {
      setReveal(false);
      setAnswers({});
    }
  }, [open]);

  const previewResponses = items.map(toResponse);
  const settingTags = [
    quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'Untimed',
    quiz.attemptsAllowed === 0
      ? 'Unlimited attempts'
      : (quiz.attemptsAllowed ?? 1) > 1
        ? `${quiz.attemptsAllowed} attempts`
        : null,
    quiz.shuffleQuestions ? 'Shuffled' : null,
    quiz.passingScore != null
      ? `Pass ≥ ${quiz.passingScore}${quiz.passingScoreUnit === 'points' ? ' pts' : '%'}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Student preview"
      width={840}
      extra={
        <Space>
          <Text type="secondary">Show correct answers</Text>
          <Switch checked={reveal} onChange={setReveal} />
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="This is how the quiz appears to a student. Answers here aren't saved or graded."
      />

      <Title level={3} style={{ marginTop: 0 }}>
        {quiz.title}
      </Title>
      <Flex gap={8} wrap style={{ marginBottom: 12 }}>
        {settingTags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </Flex>
      {quiz.description && (
        <div style={{ marginBottom: 16 }}>
          <Markdown>{quiz.description}</Markdown>
        </div>
      )}

      {hasGroups && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Random draws show one possible selection — each student gets a different random set."
        />
      )}

      {items.length === 0 ? (
        <Text type="secondary">This quiz has no questions to preview.</Text>
      ) : (
        <QuizQuestions
          responses={previewResponses}
          value={(i) => answers[i] ?? initialAnswer(previewResponses[i])}
          onChange={(i, v) => setAnswers((prev) => ({ ...prev, [i]: v }))}
          reveal={reveal}
          oneAtATime={!!quiz.oneQuestionAtATime}
          allowBack={!!quiz.allowBacktracking}
        />
      )}
    </Drawer>
  );
};

export default QuizPreviewDrawer;
