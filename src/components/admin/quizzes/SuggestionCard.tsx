// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Card, Divider, Flex, Space, Tag, Typography, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { suggestedQuizQuestionsApi } from '../../../api-client/clients';
import { SuggestedQuizQuestion, QuestionTypeEnum } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { typeMeta } from '../../core/questionMeta';
import AnswerPreview from './AnswerPreview';
import Markdown from '../../core/Markdown';

const { Text } = Typography;

interface RawChoice {
  text: string;
  isCorrect?: boolean;
  is_correct?: boolean;
}

interface IProps {
  suggestion: SuggestedQuizQuestion;
  courseId: number;
  targetBankId?: number;
  /** Called after a successful accept/reject (e.g. to refresh a host list or close a modal). */
  onChanged?: () => void;
}

const parseChoices = (raw: unknown): { text: string; isCorrect: boolean }[] => {
  let arr: RawChoice[] = [];
  if (Array.isArray(raw)) arr = raw as RawChoice[];
  else if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw);
      arr = Array.isArray(v) ? v : [];
    } catch {
      arr = [];
    }
  }
  return arr.map((c) => ({ text: c.text ?? '', isCorrect: !!(c.isCorrect ?? c.is_correct) }));
};

const SuggestionCard: React.FC<IProps> = ({ suggestion, courseId, targetBankId, onChanged }) => {
  const queryClient = useQueryClient();
  const qType = (suggestion.questionType ?? QuestionTypeEnum.MultipleChoice) as QuestionTypeEnum;
  const assignmentId = suggestion.assignment ?? -1;
  const choices = React.useMemo(() => parseChoices(suggestion.choicesData), [suggestion.choicesData]);
  const [busy, setBusy] = React.useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.suggestions(assignmentId) });
    queryClient.invalidateQueries({ queryKey: quizKeys.banks(courseId) });
    queryClient.invalidateQueries({ queryKey: quizKeys.courseQuestions(courseId) });
  };

  const handleAccept = async () => {
    setBusy(true);
    try {
      // Fresh suggestions file into targetBankId; refreshes (sourceQuestion) update in place.
      await suggestedQuizQuestionsApi.acceptCreate({
        id: suggestion.id!,
        acceptSuggestionRequest: targetBankId ? { bankId: targetBankId } : {},
      });
      message.success(targetBankId ? 'Accepted and added to the bank.' : 'Question updated.');
      invalidate();
      onChanged?.();
    } catch {
      message.error('Failed to accept the suggestion.');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await suggestedQuizQuestionsApi.rejectCreate({ id: suggestion.id! });
      message.success('Suggestion rejected.');
      invalidate();
      onChanged?.();
    } catch {
      message.error('Failed to reject the suggestion.');
    } finally {
      setBusy(false);
    }
  };

  const meta = typeMeta(qType);

  return (
    <Card size="small" style={{ marginBottom: 12 }}>
      <Flex justify="space-between" align="start" gap={8}>
        <Tag color={meta.color}>{meta.label}</Tag>
        <Space size="small">
          <Button size="small" icon={<CloseOutlined />} onClick={handleReject} disabled={busy}>
            Reject
          </Button>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={handleAccept} disabled={busy}>
            Accept
          </Button>
        </Space>
      </Flex>

      <div style={{ marginTop: 8, fontSize: 14 }}>
        <Markdown>{suggestion.text}</Markdown>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      <AnswerPreview
        questionType={qType}
        choices={choices}
        language={suggestion.language}
        starterCode={suggestion.starterCode}
        emptyText="No choices were generated."
      />

      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 10 }}>
        {suggestion.points ?? 1} pts · Accept to add it as an editable question
      </Text>
    </Card>
  );
};

export default SuggestionCard;
