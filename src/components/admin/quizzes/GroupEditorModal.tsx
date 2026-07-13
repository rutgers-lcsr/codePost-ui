// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Form, InputNumber, Input, Modal, Select, Typography, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { quizQuestionGroupsApi } from '../../../api-client/clients';
import { QuizQuestionGroup } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { quizKeys } from '../../../lib/queryKeys';
import { useQuestionBanks } from './queries';

const { Text } = Typography;

interface IProps {
  open: boolean;
  courseId: number;
  quizId: number;
  group: QuizQuestionGroup | null; // null => create
  nextSortKey: number;
  onClose: () => void;
}

interface IGroupForm {
  bank: number;
  name?: string;
  pickCount: number;
  pointsPerQuestion: number;
}

const GroupEditorModal: React.FC<IProps> = ({ open, courseId, quizId, group, nextSortKey, onClose }) => {
  const queryClient = useQueryClient();
  const { data: banks = [] } = useQuestionBanks(open ? courseId : undefined);
  const [form] = Form.useForm<IGroupForm>();
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (group) {
      form.setFieldsValue({
        bank: group.bank,
        name: group.name,
        pickCount: group.pickCount ?? 1,
        pointsPerQuestion: group.pointsPerQuestion ?? 1,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ pickCount: 1, pointsPerQuestion: 1 });
    }
  }, [open, group, form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (group) {
        await quizQuestionGroupsApi.partialUpdate({
          id: group.id!,
          patchedQuizQuestionGroup: {
            bank: values.bank,
            name: values.name,
            pickCount: values.pickCount,
            pointsPerQuestion: values.pointsPerQuestion,
          },
        });
        message.success('Random draw updated.');
      } else {
        await quizQuestionGroupsApi.create({
          quizQuestionGroup: {
            quiz: quizId,
            bank: values.bank,
            name: values.name,
            pickCount: values.pickCount,
            pointsPerQuestion: values.pointsPerQuestion,
            sortKey: nextSortKey,
          },
        });
        message.success('Random draw added.');
      }
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(quizId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.list(courseId) });
      onClose();
    } catch (err) {
      message.error(apiErrorMessage(err) ?? 'Failed to save the random draw.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={group ? 'Edit Random Draw' : 'Add Random Draw'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText={group ? 'Save' : 'Add'}
      confirmLoading={saving}
      destroyOnHidden
    >
      <Text type="secondary" style={{ fontSize: 13 }}>
        Each student attempt draws a random set of questions from the chosen bank.
      </Text>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="bank" label="Bank" rules={[{ required: true, message: 'Choose a bank to draw from.' }]}>
          <Select
            placeholder="Select a question bank"
            options={banks.map((b) => ({ value: b.id, label: `${b.name} (${b.questionCount ?? 0})` }))}
          />
        </Form.Item>
        <Form.Item name="name" label="Label (optional)">
          <Input placeholder="e.g., Chapter 3 — pick 3" maxLength={128} />
        </Form.Item>
        <Form.Item
          name="pickCount"
          label="Questions to draw"
          rules={[{ required: true, type: 'number', min: 1, message: 'Draw at least one question.' }]}
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
      </Form>
    </Modal>
  );
};

export default GroupEditorModal;
