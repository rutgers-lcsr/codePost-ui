// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Flex, Form, Input, InputNumber, Modal, Select, message } from 'antd';
import CodeQuestionEditor from './CodeQuestionEditor';
import { useQueryClient } from '@tanstack/react-query';
import { questionsApi } from '../../../api-client/clients';
import { Question, QuestionTypeEnum } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import ChoicesEditor from './ChoicesEditor';
import MarkdownField from './MarkdownField';
import {
  LocalChoice,
  QuestionPayload,
  choicesPayload,
  defaultChoicesFor,
  hasChoiceEditor,
  isAcceptedAnswers,
  isCode,
  toLocalChoices,
  validateChoices,
} from './choiceUtils';

const QUESTION_TYPE_OPTIONS = [
  { value: QuestionTypeEnum.MultipleChoice, label: 'Multiple choice (one answer)' },
  { value: QuestionTypeEnum.MultipleAnswers, label: 'Multiple answers (several correct)' },
  { value: QuestionTypeEnum.TrueFalse, label: 'True / False' },
  { value: QuestionTypeEnum.ShortAnswer, label: 'Short answer' },
  { value: QuestionTypeEnum.Numerical, label: 'Numerical' },
  { value: QuestionTypeEnum.Essay, label: 'Essay' },
  { value: QuestionTypeEnum.Code, label: 'Code' },
];

// Common Environment.language values; for code questions the language is otherwise
// inherited from the attached assignment.
const LANGUAGE_OPTIONS = [
  'python-3.12',
  'python-3.11',
  'python-3.10',
  'java-17',
  'java-11',
  'java',
  'c/c++',
  'node-20',
  'node-18',
  'r-4',
  'ruby',
  'php',
];

interface IProps {
  open: boolean;
  courseId: number;
  bankId?: number;
  question: Question | null; // null => create
  onClose: () => void;
}

interface IQuestionForm {
  questionType: QuestionTypeEnum;
  text: string;
  description?: string;
  points: number;
  generalFeedback?: string;
  language?: string;
}

const QuestionEditorModal: React.FC<IProps> = ({ open, courseId, bankId, question, onClose }) => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<IQuestionForm>();
  const [qType, setQType] = React.useState<QuestionTypeEnum>(QuestionTypeEnum.MultipleChoice);
  const [choices, setChoices] = React.useState<LocalChoice[]>(defaultChoicesFor(QuestionTypeEnum.MultipleChoice));
  const [starterCode, setStarterCode] = React.useState('');
  const [referenceSolution, setReferenceSolution] = React.useState('');
  const [language, setLanguage] = React.useState<string | undefined>(undefined);
  const [saving, setSaving] = React.useState(false);

  // Initialize form/state whenever the modal opens (create or edit).
  React.useEffect(() => {
    if (!open) return;
    if (question) {
      const t = (question.questionType ?? QuestionTypeEnum.MultipleChoice) as QuestionTypeEnum;
      setQType(t);
      setLanguage(question.language ?? undefined);
      setStarterCode(question.starterCode ?? '');
      setReferenceSolution(question.referenceSolution ?? '');
      setChoices(toLocalChoices(question.choices));
      form.setFieldsValue({
        questionType: t,
        text: question.text,
        description: question.description,
        points: question.points ?? 1,
        generalFeedback: question.generalFeedback,
        language: question.language ?? undefined,
      });
    } else {
      setQType(QuestionTypeEnum.MultipleChoice);
      setLanguage(undefined);
      setStarterCode('');
      setReferenceSolution('');
      setChoices(defaultChoicesFor(QuestionTypeEnum.MultipleChoice));
      form.resetFields();
      form.setFieldsValue({ questionType: QuestionTypeEnum.MultipleChoice, points: 1 });
    }
  }, [open, question, form]);

  const onTypeChange = (t: QuestionTypeEnum) => {
    setQType(t);
    setChoices(defaultChoicesFor(t));
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const choiceError = validateChoices(values.questionType, choices);
    if (choiceError) {
      message.error(choiceError);
      return;
    }

    const payload: QuestionPayload = {
      course: courseId,
      bank: bankId!,
      questionType: values.questionType,
      text: values.text,
      description: values.description,
      points: values.points,
      generalFeedback: values.generalFeedback,
    };

    if (isCode(values.questionType)) {
      payload.language = language || null;
      payload.starterCode = starterCode || null;
      payload.referenceSolution = referenceSolution || null;
      payload.choices = [];
    } else if (values.questionType === QuestionTypeEnum.Essay) {
      payload.choices = [];
    } else {
      payload.choices = choicesPayload(choices);
    }

    setSaving(true);
    try {
      if (question) {
        await questionsApi.partialUpdate({ id: question.id!, patchedQuestion: payload });
        message.success('Question updated.');
      } else {
        await questionsApi.create({ question: payload });
        message.success('Question created.');
      }
      if (bankId) queryClient.invalidateQueries({ queryKey: quizKeys.bankQuestions(bankId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.courseQuestions(courseId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.banks(courseId) });
      onClose();
    } catch (err) {
      const e = err as { body?: { detail?: string; text?: string[] } };
      message.error(e?.body?.text?.[0] ?? e?.body?.detail ?? 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={question ? 'Edit Question' : 'New Question'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText={question ? 'Save' : 'Create'}
      confirmLoading={saving}
      width={720}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="questionType" label="Type" rules={[{ required: true }]}>
          <Select options={QUESTION_TYPE_OPTIONS} onChange={onTypeChange} />
        </Form.Item>

        <Form.Item
          name="text"
          label="Question"
          rules={[{ required: true, message: 'Enter the question text.' }]}
          extra="The question stem — single font, with basic formatting (bold, italic, code)."
        >
          <MarkdownField basic courseId={courseId} minRows={2} placeholder="The question stem shown to students" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description (optional, Markdown)"
          extra="Rich supporting content — formatting, code blocks, lists, and images."
        >
          <MarkdownField courseId={courseId} placeholder="Supporting content — supports Markdown and images…" />
        </Form.Item>

        <Flex gap={16}>
          <Form.Item name="points" label="Points" rules={[{ required: true }]} style={{ width: 140 }}>
            <InputNumber min={0} step={1} style={{ width: '100%' }} />
          </Form.Item>
          {isCode(qType) && (
            <Form.Item label="Language" style={{ flex: 1 }}>
              <Select
                allowClear
                placeholder="Inherit from assignment"
                value={language}
                onChange={(v) => setLanguage(v)}
                options={LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l }))}
              />
            </Form.Item>
          )}
        </Flex>

        {hasChoiceEditor(qType) && (
          <Form.Item label={isAcceptedAnswers(qType) ? 'Accepted answers' : 'Choices'} required>
            <ChoicesEditor questionType={qType} value={choices} onChange={setChoices} />
          </Form.Item>
        )}

        {isCode(qType) && (
          <>
            <Form.Item label="Starter code (optional)">
              <CodeQuestionEditor
                height={160}
                language={language}
                value={starterCode}
                onChange={setStarterCode}
              />
            </Form.Item>
            <Form.Item label="Reference solution (optional, authoring-only — not auto-graded yet)">
              <CodeQuestionEditor
                height={180}
                language={language}
                value={referenceSolution}
                onChange={setReferenceSolution}
              />
            </Form.Item>
          </>
        )}

        <Form.Item name="generalFeedback" label="General feedback (optional)">
          <Input.TextArea rows={2} placeholder="Shown after answering, regardless of the response" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuestionEditorModal;
