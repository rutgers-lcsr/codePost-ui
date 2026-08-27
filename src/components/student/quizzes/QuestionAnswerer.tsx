// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, Checkbox, Flex, Input, Radio, Space, Tag, Typography } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, CommentOutlined } from '@ant-design/icons';
import Editor from '../../../lib/monaco';
import { StudentQuizResponse, QuestionTypeEnum } from '../../../api-client';
import Markdown from '../../core/Markdown';
import CodeEditorTabHint from '../../core/CodeEditorTabHint';
import { typeMeta, monacoLang } from '../../core/questionMeta';

const { Text } = Typography;

export interface AnswerValue {
  answerText: string;
  selectedChoices: number[];
}

/** The starting answer for a response — seeds code questions with their starter code
 *  when the student hasn't typed anything yet. */
export const initialAnswer = (response: StudentQuizResponse): AnswerValue => {
  const q = response.question;
  const hasText = (response.answerText ?? '').length > 0;
  const answerText =
    !hasText && q.questionType === QuestionTypeEnum.Code && q.starterCode ? q.starterCode : response.answerText ?? '';
  return { answerText, selectedChoices: [...response.selectedChoices] };
};

/** Whether a response counts as answered for the progress bar. Mirrors `initialAnswer`: a code
 *  question opens pre-filled with its starter code, so unedited starter code is not an answer. */
export const isAnswered = (response: StudentQuizResponse, value: AnswerValue): boolean => {
  if (value.selectedChoices.length > 0) return true;
  const text = value.answerText.trim();
  if (text === '') return false;
  if (response.question.questionType === QuestionTypeEnum.Code)
    return text !== (response.question.starterCode ?? '').trim();
  return true;
};

interface IProps {
  response: StudentQuizResponse;
  index: number;
  value: AnswerValue;
  disabled: boolean;
  reveal: boolean;
  onChange: (value: AnswerValue) => void;
}

const QuestionAnswerer: React.FC<IProps> = ({ response, index, value, disabled, reveal, onChange }) => {
  const question = response.question;
  const type = question.questionType;
  const meta = typeMeta(type);
  const choices = [...(question.choices ?? [])].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));

  const setText = (answerText: string) => onChange({ ...value, answerText });
  const setChoices = (selectedChoices: number[]) => onChange({ ...value, selectedChoices });

  // Associate every answer control with the question text so screen readers announce
  // which question the control belongs to. Falls back to the question index when the
  // question has no text body.
  const labelId = React.useId();
  const groupLabel = question.text
    ? { 'aria-labelledby': labelId }
    : { 'aria-label': `Question ${index + 1}` };

  const renderInput = () => {
    if (type === QuestionTypeEnum.MultipleChoice || type === QuestionTypeEnum.TrueFalse) {
      return (
        <Radio.Group
          {...groupLabel}
          disabled={disabled}
          value={value.selectedChoices[0]}
          onChange={(e) => setChoices([e.target.value as number])}
        >
          <Space direction="vertical">
            {choices.map((c) => (
              <Radio key={c.id} value={c.id}>
                <ChoiceLabel text={c.text} reveal={reveal} isCorrect={c.isCorrect} feedback={c.feedback} />
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      );
    }
    if (type === QuestionTypeEnum.MultipleAnswers) {
      return (
        // role="group" + label: Checkbox.Group renders a plain div, so wrap it to expose
        // the choices as a named group to screen readers.
        <div role="group" {...groupLabel}>
          <Checkbox.Group disabled={disabled} value={value.selectedChoices} onChange={(v) => setChoices(v as number[])}>
            <Space direction="vertical">
              {choices.map((c) => (
                <Checkbox key={c.id} value={c.id}>
                  <ChoiceLabel text={c.text} reveal={reveal} isCorrect={c.isCorrect} feedback={c.feedback} />
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
      );
    }
    if (type === QuestionTypeEnum.Code) {
      return (
        <div>
          <div
            style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}
            data-testid="quiz-answer-code"
          >
            <Editor
              height="260px"
              language={monacoLang(question.language)}
              value={value.answerText}
              onChange={(v) => setText(v ?? '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                padding: { top: 8 },
                readOnly: disabled,
                scrollBeyondLastLine: false,
                ariaLabel: `Code answer for question ${index + 1}`,
              }}
            />
          </div>
          {/* WCAG 2.1.2 advisory — Tab is trapped inside Monaco; tell users the way out. */}
          <CodeEditorTabHint />
        </div>
      );
    }
    if (type === QuestionTypeEnum.Essay) {
      return (
        <Input.TextArea
          {...groupLabel}
          disabled={disabled}
          autoSize={{ minRows: 4 }}
          value={value.answerText}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your answer…"
          data-testid="quiz-answer-text"
        />
      );
    }
    // short_answer / numerical
    const accepted = choices.filter((c) => c.isCorrect).map((c) => c.text);
    return (
      <div>
        <Input
          {...groupLabel}
          disabled={disabled}
          value={value.answerText}
          onChange={(e) => setText(e.target.value)}
          placeholder={type === QuestionTypeEnum.Numerical ? 'Enter a number…' : 'Type your answer…'}
          inputMode={type === QuestionTypeEnum.Numerical ? 'decimal' : undefined}
          style={{ maxWidth: 360 }}
          data-testid="quiz-answer-text"
        />
        {reveal && accepted.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">Accepted answer{accepted.length > 1 ? 's' : ''}: </Text>
            <Text>{accepted.join(', ')}</Text>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: 12 }}
      data-testid="quiz-question"
      data-question-type={type}
      // Named group so SR users can jump between questions in one-page mode
      // (the one-at-a-time wrapper in QuizQuestions adds the "of Y" position).
      role="group"
      aria-label={`Question ${index + 1}`}
      title={
        <Flex align="center" gap={8} wrap>
          <Text strong>Question {index + 1}</Text>
          <Tag color={meta.color}>{meta.label}</Tag>
          {/* The question's random-draw group / AI-section label (null for fixed questions).
              A muted caption, kept visually distinct from the colored question-type tag. */}
          {question.label && (
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }} data-testid="quiz-question-label">
              {question.label}
            </Text>
          )}
        </Flex>
      }
      extra={
        <Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {response.points ?? 0} {Number(response.points) === 1 ? 'point' : 'points'}
          </Text>
          {(reveal || response.pointsEarned != null || response.needsManualGrading) && (
            <ResultTag response={response} />
          )}
        </Space>
      }
    >
      {question.text && (
        <div id={labelId}>
          <Markdown>{question.text}</Markdown>
        </div>
      )}
      {question.description && (
        <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.65)' }}>
          <Markdown>{question.description}</Markdown>
        </div>
      )}
      <div style={{ marginTop: 12 }}>{renderInput()}</div>
      {/* Server-gated: present once the attempt is submitted, regardless of answer reveal. */}
      {response.graderFeedback && (
        <div style={{ marginTop: 12 }} data-testid="quiz-grader-feedback">
          <Text type="secondary">
            <CommentOutlined aria-hidden /> Grader:{' '}
          </Text>
          <Text style={{ whiteSpace: 'pre-wrap' }}>{response.graderFeedback}</Text>
        </div>
      )}
      {reveal && question.generalFeedback && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">Feedback: </Text>
          <Markdown compact>{question.generalFeedback}</Markdown>
        </div>
      )}
    </Card>
  );
};

const ChoiceLabel: React.FC<{ text: string; reveal: boolean; isCorrect?: boolean; feedback?: string }> = ({
  text,
  reveal,
  isCorrect,
  feedback,
}) => (
  // The testid lives on this span (inside the antd label) because Radio/Checkbox
  // don't forward data-* attributes; clicking it toggles the control.
  <span data-testid="quiz-choice">
    {text}
    {reveal && isCorrect === true && (
      <CheckCircleTwoTone twoToneColor="#52c41a" role="img" aria-label="Correct answer" style={{ marginLeft: 6 }} />
    )}
    {reveal && feedback && (
      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
        — {feedback}
      </Text>
    )}
  </span>
);

const ResultTag: React.FC<{ response: StudentQuizResponse }> = ({ response }) => {
  if (response.needsManualGrading) {
    return (
      <Tag color="gold" data-testid="quiz-question-result">
        Pending grading
      </Tag>
    );
  }
  if (response.isCorrect === true) {
    return (
      <Tag
        color="success"
        icon={<CheckCircleTwoTone aria-hidden twoToneColor="#52c41a" />}
        data-testid="quiz-question-result"
      >
        {response.pointsEarned ?? 0} pts
      </Tag>
    );
  }
  if (response.isCorrect === false) {
    return (
      <Tag
        color="error"
        icon={<CloseCircleTwoTone aria-hidden twoToneColor="#ff4d4f" />}
        data-testid="quiz-question-result"
      >
        0 pts
      </Tag>
    );
  }
  // No correctness (partial credit, manual grades, or answers-hidden policies) — the
  // earned points still show once the server reveals them.
  if (response.pointsEarned != null) {
    return (
      <Tag data-testid="quiz-question-result">
        {Number(response.pointsEarned)} / {Number(response.points ?? 0)} pts
      </Tag>
    );
  }
  return null;
};

export default QuestionAnswerer;
