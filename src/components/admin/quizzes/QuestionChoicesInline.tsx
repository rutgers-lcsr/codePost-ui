// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Divider, Flex, Input, Space, Typography, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { questionsApi } from '../../../api-client/clients';
import { Question, QuestionTypeEnum } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { quizKeys } from '../../../lib/queryKeys';
import ChoicesEditor from './ChoicesEditor';
import Markdown from '../../core/Markdown';
import { LocalChoice, choicesPayload, hasChoiceEditor, toLocalChoices, validateChoices } from './choiceUtils';

const { Text } = Typography;

interface IProps {
  question: Question;
  courseId: number;
  bankId: number;
}

/** Expanded-row detail: renders the question the way it reads in a quiz —
 *  stem, then description, then choices/entry — seamlessly. Choices remain
 *  inline-editable; full editing is via the pencil. */
const QuestionChoicesInline: React.FC<IProps> = ({ question, courseId, bankId }) => {
  const queryClient = useQueryClient();
  const qType = (question.questionType ?? QuestionTypeEnum.MultipleChoice) as QuestionTypeEnum;
  const editable = hasChoiceEditor(qType);
  const [choices, setChoices] = React.useState<LocalChoice[]>(toLocalChoices(question.choices));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setChoices(toLocalChoices(question.choices));
  }, [question]);

  const dirty = JSON.stringify(choices) !== JSON.stringify(toLocalChoices(question.choices));

  const handleSave = async () => {
    const error = validateChoices(qType, choices);
    if (error) {
      message.error(error);
      return;
    }
    setSaving(true);
    try {
      await questionsApi.partialUpdate({
        id: question.id!,
        patchedQuestion: { questionType: qType, choices: choicesPayload(choices) },
      });
      message.success('Answers updated.');
      queryClient.invalidateQueries({ queryKey: quizKeys.bankQuestions(bankId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.courseQuestions(courseId) });
    } catch (err) {
      message.error(apiErrorMessage(err) ?? 'Failed to update answers.');
    } finally {
      setSaving(false);
    }
  };

  const hasDescription = !!question.description?.trim();

  // The answer area for non-choice types (so every question shows a consistent entry).
  const entryPreview = () => {
    if (qType === QuestionTypeEnum.Essay) {
      return <Input.TextArea disabled rows={3} placeholder="Student's written response" />;
    }
    if (qType === QuestionTypeEnum.Code) {
      return (
        <Input.TextArea
          disabled
          rows={4}
          placeholder={`Student's code${question.language ? ` (${question.language})` : ''}`}
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
          value={question.starterCode ?? undefined}
        />
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '12px 24px 16px 48px', maxWidth: 760 }}>
      {/* Question text (stem) — inline-formatted Markdown (bold/italic/code) */}
      {question.text?.trim() && (
        <div style={{ fontSize: 14, marginBottom: 10 }}>
          <Markdown>{question.text}</Markdown>
        </div>
      )}

      {/* Description — flows directly under the stem, no separate label */}
      {hasDescription && (
        <div style={{ marginBottom: 14, color: 'rgba(0,0,0,0.65)' }}>
          <Markdown>{question.description}</Markdown>
        </div>
      )}

      <Divider />

      {/* Choices / entry */}
      {editable ? (
        <>
          <ChoicesEditor questionType={qType} value={choices} onChange={setChoices} />
          <Flex justify="flex-end" style={{ marginTop: 12 }}>
            <Space>
              <Button size="small" disabled={!dirty || saving} onClick={() => setChoices(toLocalChoices(question.choices))}>
                Reset
              </Button>
              <Button type="primary" size="small" loading={saving} disabled={!dirty} onClick={handleSave}>
                Save answers
              </Button>
            </Space>
          </Flex>
        </>
      ) : (
        entryPreview() ?? (
          <Text type="secondary" style={{ fontSize: 13 }}>
            No answer choices for this question type.
          </Text>
        )
      )}
    </div>
  );
};

export default QuestionChoicesInline;
