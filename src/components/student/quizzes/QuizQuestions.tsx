// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Flex, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import { StudentQuizResponse } from '../../../api-client';
import QuestionAnswerer, { AnswerValue } from './QuestionAnswerer';

const { Text } = Typography;

interface IProps {
  responses: StudentQuizResponse[];
  value: (index: number) => AnswerValue;
  onChange: (index: number, v: AnswerValue) => void;
  reveal: boolean;
  disabled?: boolean;
  /** Sequential mode: show one question at a time. */
  oneAtATime: boolean;
  /** When sequential, whether the student may return to previous questions. */
  allowBack: boolean;
  /** Action shown after all questions (one-page) or on the last step (sequential). */
  submitSlot?: React.ReactNode;
}

/** Renders a quiz's questions either all on one page or one at a time (with Previous/Next),
 *  shared by the student taking view and the instructor preview. */
const QuizQuestions: React.FC<IProps> = ({
  responses,
  value,
  onChange,
  reveal,
  disabled,
  oneAtATime,
  allowBack,
  submitSlot,
}) => {
  const [current, setCurrent] = React.useState(0);

  // Keep the index in range if the question set changes.
  React.useEffect(() => {
    setCurrent((c) => Math.min(c, Math.max(responses.length - 1, 0)));
  }, [responses.length]);

  // Move focus to the current question when paging (sequential mode) so keyboard/SR users
  // land on the new question instead of a Prev/Next button that may have moved or unmounted.
  const questionRef = React.useRef<HTMLDivElement>(null);
  const firstRender = React.useRef(true);
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    questionRef.current?.focus();
  }, [current]);

  if (!oneAtATime) {
    return (
      <>
        {responses.map((r, i) => (
          <QuestionAnswerer
            key={i}
            response={r}
            index={i}
            value={value(i)}
            disabled={!!disabled}
            reveal={reveal}
            onChange={(v) => onChange(i, v)}
          />
        ))}
        {submitSlot && (
          <Flex justify="flex-end" style={{ marginTop: 16 }}>
            {submitSlot}
          </Flex>
        )}
      </>
    );
  }

  const i = Math.min(current, Math.max(responses.length - 1, 0));
  const isLast = i === responses.length - 1;

  return (
    <>
      <div
        ref={questionRef}
        tabIndex={-1}
        role="group"
        aria-label={`Question ${i + 1} of ${responses.length}`}
        style={{ outline: 'none' }}
      >
        <Text type="secondary">
          Question {i + 1} of {responses.length}
        </Text>
        <QuestionAnswerer
          key={i}
          response={responses[i]}
          index={i}
          value={value(i)}
          disabled={!!disabled}
          reveal={reveal}
          onChange={(v) => onChange(i, v)}
        />
      </div>
      <Flex justify="space-between" align="center" style={{ marginTop: 16 }}>
        <div>
          {allowBack && i > 0 && (
            <CPButton
              cpType="secondary"
              icon={<LeftOutlined />}
              onClick={() => setCurrent(i - 1)}
              data-testid="quiz-prev"
            >
              Previous
            </CPButton>
          )}
        </div>
        <div>
          {isLast ? (
            submitSlot
          ) : (
            <CPButton cpType="primary" onClick={() => setCurrent(i + 1)} data-testid="quiz-next">
              Next <RightOutlined />
            </CPButton>
          )}
        </div>
      </Flex>
    </>
  );
};

export default QuizQuestions;
