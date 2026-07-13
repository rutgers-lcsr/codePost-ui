// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Checkbox, Input, Radio, Space, Typography } from 'antd';
import { QuestionTypeEnum } from '../../../api-client';
import { isSingleCorrect, isAcceptedAnswers, isCode } from './choiceUtils';

const { Text } = Typography;

interface PreviewChoice {
  text: string;
  isCorrect: boolean;
}

interface IProps {
  questionType: QuestionTypeEnum;
  choices: PreviewChoice[];
  language?: string | null;
  starterCode?: string | null;
  /** Message shown when a choice-bearing type has no choices. */
  emptyText?: string;
}

/** Read-only render of a question's answer area as it reads in a quiz: radio options
 *  (single-correct), checkboxes (multiple-answers), accepted answers, or an entry box. */
const AnswerPreview: React.FC<IProps> = ({ questionType, choices, language, starterCode, emptyText = 'No choices.' }) => {
  const empty = <Text type="secondary" style={{ fontSize: 13 }}>{emptyText}</Text>;

  if (isSingleCorrect(questionType)) {
    return choices.length ? (
      <Space direction="vertical" size={4}>
        {choices.map((c, i) => (
          <Radio key={i} checked={c.isCorrect} disabled>
            <Text type={c.isCorrect ? undefined : 'secondary'}>{c.text}</Text>
          </Radio>
        ))}
      </Space>
    ) : (
      empty
    );
  }
  if (questionType === QuestionTypeEnum.MultipleAnswers) {
    return choices.length ? (
      <Space direction="vertical" size={4}>
        {choices.map((c, i) => (
          <Checkbox key={i} checked={c.isCorrect} disabled>
            <Text type={c.isCorrect ? undefined : 'secondary'}>{c.text}</Text>
          </Checkbox>
        ))}
      </Space>
    ) : (
      empty
    );
  }
  if (isAcceptedAnswers(questionType)) {
    return choices.length ? (
      <Text>
        <Text type="secondary">Accepted: </Text>
        {choices.map((c) => c.text).join(', ')}
      </Text>
    ) : (
      empty
    );
  }
  if (questionType === QuestionTypeEnum.Essay) {
    return <Input.TextArea disabled rows={3} placeholder="Student's written response" />;
  }
  if (isCode(questionType)) {
    return (
      <Input.TextArea
        disabled
        rows={4}
        placeholder={`Student's code${language ? ` (${language})` : ''}`}
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
        value={starterCode ?? undefined}
      />
    );
  }
  return null;
};

export default AnswerPreview;
