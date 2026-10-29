// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Checkbox, Flex, Input, Radio, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { QuestionTypeEnum } from '../../../api-client';
import { LocalChoice, isAcceptedAnswers, isSingleCorrect } from './choiceUtils';

const { Text } = Typography;

interface IProps {
  questionType: QuestionTypeEnum;
  value: LocalChoice[];
  onChange: (choices: LocalChoice[]) => void;
}

/** Type-aware, controlled editor for a question's choices / accepted answers.
 *  - single-correct types (multiple choice, true/false): radio
 *  - multiple-answers: checkboxes
 *  - short answer / numerical: a list of accepted answers (all correct) */
const ChoicesEditor: React.FC<IProps> = ({ questionType, value, onChange }) => {
  const single = isSingleCorrect(questionType);
  const accepted = isAcceptedAnswers(questionType);
  // A sentence-length key means the author wanted an explanation, which exact match can't grade.
  const longAcceptedAnswer = accepted && value.some((c) => c.text.trim().split(/\s+/).length > 6);
  const fixed = questionType === QuestionTypeEnum.TrueFalse;
  const minRows = accepted ? 1 : 2;

  const setCorrectSingle = (index: number) =>
    onChange(value.map((c, i) => ({ ...c, isCorrect: i === index })));

  const toggleCorrect = (index: number, checked: boolean) =>
    onChange(value.map((c, i) => (i === index ? { ...c, isCorrect: checked } : c)));

  const setText = (index: number, text: string) =>
    onChange(value.map((c, i) => (i === index ? { ...c, text } : c)));

  const addChoice = () => onChange([...value, { text: '', isCorrect: accepted }]);
  const removeChoice = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div>
      <Radio.Group
        value={single ? value.findIndex((c) => c.isCorrect) : undefined}
        style={{ display: 'block', width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {value.map((choice, index) => (
            <Flex key={index} align="center" gap={8}>
              {single ? (
                <Radio
                  value={index}
                  onChange={() => setCorrectSingle(index)}
                  aria-label={`Mark choice ${index + 1} as correct`}
                />
              ) : accepted ? null : (
                <Checkbox
                  checked={choice.isCorrect}
                  onChange={(e) => toggleCorrect(index, e.target.checked)}
                  aria-label={`Mark choice ${index + 1} as correct`}
                />
              )}
              <Input
                value={choice.text}
                placeholder={accepted ? 'An accepted answer' : `Choice ${index + 1}`}
                aria-label={accepted ? `Accepted answer ${index + 1}` : `Choice ${index + 1}`}
                onChange={(e) => setText(index, e.target.value)}
                disabled={fixed}
              />
              {!fixed && value.length > minRows && (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={`Remove choice ${index + 1}`}
                  title="Remove choice"
                  onClick={() => removeChoice(index)}
                />
              )}
            </Flex>
          ))}
        </Space>
      </Radio.Group>
      {!fixed && (
        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addChoice} style={{ marginTop: 8 }}>
          {accepted ? 'Add answer' : 'Add choice'}
        </Button>
      )}
      {single && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
          Select the radio next to the correct choice.
        </Text>
      )}
      {questionType === QuestionTypeEnum.ShortAnswer && (
        <Text
          type={longAcceptedAnswer ? 'warning' : 'secondary'}
          style={{ fontSize: 12, display: 'block', marginTop: 4 }}
          data-testid="short-answer-exact-match-hint"
        >
          {longAcceptedAnswer
            ? 'An accepted answer this long will almost never be matched: short answers are graded by exact ' +
              'text match (ignoring case). For an explanation in the student’s own words, use an Essay question.'
            : 'Graded by exact text match (ignoring case) — list every accepted spelling.'}
        </Text>
      )}
    </div>
  );
};

export default ChoicesEditor;
