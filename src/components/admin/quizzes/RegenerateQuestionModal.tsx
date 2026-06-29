// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Divider, Empty, Flex, Input, Modal, Spin, Typography, message } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { questionsApi } from '../../../api-client/clients';
import { Question, QuestionTypeEnum } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { useRegenerationSuggestions } from './queries';
import { typeMeta } from './questionMeta';
import AnswerPreview from './AnswerPreview';
import SuggestionCard from './SuggestionCard';

const { Text } = Typography;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface IProps {
  open: boolean;
  courseId: number;
  bankId: number;
  question: Question | null;
  onClose: () => void;
}

/** Cross-semester refresh: generate an AI-updated version of an existing question.
 *  Accepting the suggestion updates the question in place. */
const RegenerateQuestionModal: React.FC<IProps> = ({ open, courseId, bankId, question, onClose }) => {
  const queryClient = useQueryClient();
  const [instructions, setInstructions] = React.useState('');
  const [generating, setGenerating] = React.useState(false);

  const { data: suggestions = [], isLoading } = useRegenerationSuggestions(open ? question?.id : undefined);

  React.useEffect(() => {
    if (open) setInstructions('');
  }, [open, question?.id]);

  const handleGenerate = async () => {
    if (!question?.id) return;
    setGenerating(true);
    try {
      await questionsApi.regenerateSuggestionCreate({
        id: question.id,
        regenerateSuggestionRequest: { instructions: instructions || undefined },
      });
      let list = await questionsApi.regenerationSuggestionsList({ id: question.id });
      let tries = 0;
      while (list.length === 0 && tries < 20) {
        await sleep(1500);
        list = await questionsApi.regenerationSuggestionsList({ id: question.id });
        tries += 1;
      }
      queryClient.invalidateQueries({ queryKey: quizKeys.regeneration(question.id) });
      if (list.length === 0) {
        message.info('No suggestion was generated — AI quiz suggestions may be disabled or unconfigured.');
      }
    } catch {
      message.error('Failed to start generation.');
    } finally {
      setGenerating(false);
    }
  };

  const handleResolved = () => {
    if (question?.id) queryClient.invalidateQueries({ queryKey: quizKeys.regeneration(question.id) });
    queryClient.invalidateQueries({ queryKey: quizKeys.bankQuestions(bankId) });
    queryClient.invalidateQueries({ queryKey: quizKeys.courseQuestions(courseId) });
    onClose();
  };

  const meta = question ? typeMeta(question.questionType) : null;

  return (
    <Modal title="Suggest an update" open={open} onCancel={onClose} footer={null} width={720} destroyOnHidden>
      {question && (
        <>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Current question {meta ? `(${meta.label})` : ''}
          </Text>
          <div style={{ fontSize: 13, margin: '4px 0 8px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {question.text}
          </div>
          <div style={{ marginBottom: 12 }}>
            <AnswerPreview
              questionType={(question.questionType ?? QuestionTypeEnum.MultipleChoice) as QuestionTypeEnum}
              choices={(question.choices ?? []).map((c) => ({ text: c.text, isCorrect: !!c.isCorrect }))}
              language={question.language}
              starterCode={question.starterCode}
            />
          </div>

          <Input.TextArea
            placeholder="Optional guidance, e.g. “make it harder” or “update for this year”"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            autoSize={{ minRows: 2 }}
          />
          <Flex justify="flex-end" style={{ marginTop: 8 }}>
            <CPButton cpType="primary" icon={<ThunderboltOutlined />} onClick={handleGenerate} loading={generating}>
              Generate update
            </CPButton>
          </Flex>

          <Divider style={{ margin: '12px 0' }} />

          {generating ? (
            <Flex align="center" gap={8} style={{ padding: 16 }}>
              <Spin />
              <Text type="secondary">Generating an updated version…</Text>
            </Flex>
          ) : isLoading ? (
            <Flex justify="center" style={{ padding: 16 }}>
              <Spin />
            </Flex>
          ) : suggestions.length === 0 ? (
            <Empty
              description="No suggestion yet — generate one above"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: 8 }}
            />
          ) : (
            <>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Proposed update — Accept replaces the question
              </Text>
              {suggestions.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} courseId={courseId} onChanged={handleResolved} />
              ))}
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default RegenerateQuestionModal;
