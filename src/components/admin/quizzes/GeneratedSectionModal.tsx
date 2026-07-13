// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Form, Input, InputNumber, Modal, Select, Typography, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { quizGeneratedSectionsApi } from '../../../api-client/clients';
import { QuizGeneratedSection } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { quizKeys } from '../../../lib/queryKeys';
import TemplateTextArea from '../../core/TemplateTextArea';
import { useBackfillPreview, usePromptVariables } from './queries';
import { TYPE_META } from '../../core/questionMeta';

const { Text } = Typography;

// Seed for new sections. Only what the prompt references is sent to the model, so the
// default explicitly attaches the student's submission and test results.
const DEFAULT_SECTION_PROMPT = `Ask questions that check this student understands the code they submitted — its structure, its behavior, and the decisions they made.

Their submission:
{submission_files}

Their autograder results:
{submission_test_results}`;

interface IProps {
  open: boolean;
  courseId: number;
  quizId: number;
  section: QuizGeneratedSection | null; // null => create
  nextSortKey: number;
  onClose: () => void;
}

interface ISectionForm {
  name?: string;
  systemPrompt: string;
  numQuestions: number;
  pointsPerQuestion: number;
  questionTypes?: string[];
}

const GeneratedSectionModal: React.FC<IProps> = ({ open, courseId, quizId, section, nextSortKey, onClose }) => {
  const queryClient = useQueryClient();
  const { data: variables = [] } = usePromptVariables(open ? quizId : undefined);
  const [form] = Form.useForm<ISectionForm>();
  const [saving, setSaving] = React.useState(false);

  // Saving a NEW section backfills students who already submitted — make that visible
  // (and its AI cost) before the instructor commits.
  const { data: backfillPreview } = useBackfillPreview(quizId, open && !section);
  const backfillCount = !section ? (backfillPreview?.wouldGenerate ?? 0) : 0;

  React.useEffect(() => {
    if (!open) return;
    if (section) {
      form.setFieldsValue({
        name: section.name,
        systemPrompt: section.systemPrompt,
        numQuestions: section.numQuestions ?? 3,
        pointsPerQuestion: section.pointsPerQuestion ?? 1,
        questionTypes: (section.questionTypes as string[] | null) ?? [],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        numQuestions: 3, pointsPerQuestion: 1, questionTypes: [],
        systemPrompt: DEFAULT_SECTION_PROMPT,
      });
    }
  }, [open, section, form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        systemPrompt: values.systemPrompt,
        numQuestions: values.numQuestions,
        pointsPerQuestion: values.pointsPerQuestion,
        questionTypes: values.questionTypes ?? [],
      };
      if (section) {
        await quizGeneratedSectionsApi.partialUpdate({
          id: section.id!,
          patchedQuizGeneratedSection: payload,
        });
        message.success('AI-generated section updated.');
      } else {
        await quizGeneratedSectionsApi.create({
          quizGeneratedSection: { quiz: quizId, sortKey: nextSortKey, ...payload },
        });
        message.success('AI-generated section added.');
      }
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(quizId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.list(courseId) });
      onClose();
    } catch (err) {
      // Surface the server's prompt-validation messages (unknown {variable}, bad file
      // argument, ...) inline under the prompt field.
      const promptErrors = (err as { body?: { systemPrompt?: string[] } })?.body?.systemPrompt;
      if (promptErrors?.length) {
        form.setFields([{ name: 'systemPrompt', errors: promptErrors }]);
      } else {
        message.error(apiErrorMessage(err) ?? 'Failed to save the section.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={section ? 'Edit AI-Generated Questions' : 'Add AI-Generated Questions'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText={
        section
          ? 'Save'
          : backfillCount > 0
            ? `Add & generate for ${backfillCount} student${backfillCount === 1 ? '' : 's'}`
            : 'Add'
      }
      confirmLoading={saving}
      destroyOnHidden
      width={640}
    >
      <Text type="secondary" style={{ fontSize: 13 }}>
        When a student submits the assignment, questions are generated for them from your
        prompt — and right away for anyone who has already submitted. The AI sees exactly
        what your prompt references — use {'{'}variables{'}'} to attach assignment files, the
        student's submission, or their test results. You review and approve each student's
        questions before their quiz opens (unless auto-publish is on).
      </Text>
      {backfillCount > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          title={`${backfillCount} student${backfillCount === 1 ? ' has' : 's have'} already submitted — saving this
            section queues question generation for them right away (one AI call per student group).`}
          data-testid="backfill-notice"
        />
      )}
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="Label (optional)">
          <Input placeholder="e.g., About your solution" maxLength={128} />
        </Form.Item>
        <Form.Item
          name="systemPrompt"
          label={
            <span>
              Prompt&nbsp;
              <Text type="secondary" style={{ fontWeight: 'normal' }}>
                — type {'{'} to insert a variable (assignment files, the student's submission, …)
              </Text>
            </span>
          }
          rules={[{ required: true, message: 'Describe what the questions should cover.' }]}
        >
          <TemplateTextArea
            variables={variables}
            placeholder={
              'e.g., Ask questions about the student\'s code in {submission_files}. ' +
              'Only what you reference here is sent to the AI.'
            }
          />
        </Form.Item>
        <Form.Item
          name="numQuestions"
          label="Questions per student"
          rules={[{ required: true, type: 'number', min: 1, message: 'Generate at least one question.' }]}
        >
          <InputNumber min={1} step={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="pointsPerQuestion"
          label="Points per question"
          rules={[{ required: true, type: 'number', min: 0 }]}
        >
          <InputNumber min={0} step={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="questionTypes" label="Question types (optional — empty lets the model choose)">
          <Select
            mode="multiple"
            allowClear
            placeholder="Any type"
            options={Object.entries(TYPE_META).map(([value, meta]) => ({ value, label: meta.label }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GeneratedSectionModal;
