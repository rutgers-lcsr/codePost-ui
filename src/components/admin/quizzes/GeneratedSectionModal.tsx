// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Form, Input, InputNumber, Modal, Select, Typography, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { quizGeneratedSectionsApi } from '../../../api-client/clients';
import { QuizGeneratedSection, QuizSectionTemplate } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { quizKeys } from '../../../lib/queryKeys';
import TemplateTextArea from '../../core/TemplateTextArea';
import PromptTemplatePicker from '../../core/PromptTemplatePicker';
import { useBackfillPreview, usePromptTemplates, usePromptVariables } from './queries';
import { TYPE_META } from '../../core/questionMeta';

const DEFAULT_SAMPLE_ROWS = 5;
// Client-only token in starter templates (see core/prompts/quiz_section_templates.py),
// substituted with the instructor's chosen sample size before the prompt is applied.
const SAMPLE_ROWS_TOKEN = '<<SAMPLE_ROWS>>';

const { Text } = Typography;

interface IProps {
  open: boolean;
  courseId: number;
  quizId: number;
  /** Whether the quiz is attached to an assignment (drives the default prompt and copy —
   *  unattached prompts can't reference assignment/submission variables). */
  attached: boolean;
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

const GeneratedSectionModal: React.FC<IProps> = ({ open, courseId, quizId, attached, section, nextSortKey, onClose }) => {
  const queryClient = useQueryClient();
  const { data: variables = [] } = usePromptVariables(open ? quizId : undefined);
  const { data: templates = [] } = usePromptTemplates(open ? quizId : undefined);
  const [form] = Form.useForm<ISectionForm>();
  const [saving, setSaving] = React.useState(false);
  // "Start from a template" (create only): which starter preset is active, and — for
  // presets that call for a small hand-computable example — how many rows/values to ask
  // for. Re-applying a preset (or changing sampleRows) overwrites the prompt field; once the
  // instructor edits it directly they've moved past the template, so further sampleRows
  // changes are harmless no-ops (nothing re-applies without picking a preset again).
  const [presetKey, setPresetKey] = React.useState<string | null>(null);
  const [sampleRows, setSampleRows] = React.useState<number>(DEFAULT_SAMPLE_ROWS);
  const selectedTemplate = templates.find((t) => t.key === presetKey) ?? null;
  const showSampleRows = !!selectedTemplate?.text.includes(SAMPLE_ROWS_TOKEN);

  const applyTemplate = (template: QuizSectionTemplate, rows: number) => {
    form.setFieldsValue({
      systemPrompt: template.text.split(SAMPLE_ROWS_TOKEN).join(String(rows)),
      ...(template.questionTypes.length ? { questionTypes: template.questionTypes } : {}),
    });
  };

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
      form.setFieldsValue({ numQuestions: 3, pointsPerQuestion: 1, questionTypes: [] });
      setPresetKey(null);
      setSampleRows(DEFAULT_SAMPLE_ROWS);
    }
  }, [open, section, form]);

  // Seed a NEW section's prompt with the backend "basic" starter once templates load, without
  // clobbering anything the instructor has already typed or picked.
  React.useEffect(() => {
    if (!open || section) return;
    if (form.getFieldValue('systemPrompt')) return;
    const basic = templates.find((t) => t.key === (attached ? 'basic-attached' : 'basic-standalone'));
    if (basic) form.setFieldsValue({ systemPrompt: basic.text });
  }, [open, section, attached, templates, form]);

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
      {attached ? (
        <Text type="secondary" style={{ fontSize: 13 }}>
          Each student gets their own questions generated from your prompt. Reference the
          student's submission with {'{'}variables{'}'} and generation waits for each student
          to submit; a prompt without submission variables generates for everyone right away.
          You review and approve each student's questions before their quiz opens (unless
          auto-publish is on).
        </Text>
      ) : (
        <Text type="secondary" style={{ fontSize: 13 }}>
          Each student gets their own questions generated from your prompt. This quiz isn't
          attached to an assignment, so the prompt can't reference assignment or submission
          {' {'}variables{'}'} — but it can use course files ({'{'}course_file:name{'}'}).
          Questions generate for every enrolled student as soon as you save. You review and
          approve each student's questions before their quiz opens (unless auto-publish is on).
        </Text>
      )}
      {!section && !attached && (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          title="Saving this section generates questions for every enrolled student right away (one AI call per student)."
          data-testid="backfill-notice"
        />
      )}
      {backfillCount > 0 && attached && (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          title={`${backfillCount} student${backfillCount === 1 ? ' has' : 's have'} already submitted — saving this
            section queues question generation for them right away (one AI call per student group).`}
          data-testid="backfill-notice"
        />
      )}
      {section?.datasetTruncationWarning && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
          title={section.datasetTruncationWarning}
          data-testid="dataset-truncation-warning"
        />
      )}
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="Label (optional)" extra="Shown to students on each generated question.">
          <Input placeholder="e.g., About your solution" maxLength={128} />
        </Form.Item>
        {!section && (
          <Form.Item label="Start from a template (optional)">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 280, flex: '1 1 280px' }}>
                <PromptTemplatePicker
                  templates={templates.filter((t) => attached || !t.attachedOnly)}
                  value={presetKey}
                  onSelect={(t) => {
                    setPresetKey(t.key);
                    applyTemplate(t, sampleRows);
                  }}
                  onClear={() => setPresetKey(null)}
                  testId="section-prompt-preset"
                />
              </div>
              {showSampleRows && (
                <InputNumber
                  min={3}
                  max={10}
                  step={1}
                  value={sampleRows}
                  aria-label="Sample size (rows/values)"
                  addonBefore="Sample size"
                  onChange={(v) => {
                    const rows = v ?? DEFAULT_SAMPLE_ROWS;
                    setSampleRows(rows);
                    if (selectedTemplate) applyTemplate(selectedTemplate, rows);
                  }}
                  data-testid="section-prompt-sample-rows"
                />
              )}
            </div>
          </Form.Item>
        )}
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
              attached
                ? 'e.g., Ask questions about the student\'s code in {submission_files}. ' +
                  'Only what you reference here is sent to the AI.'
                : "e.g., Ask conceptual questions about this quiz's topics. " +
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
