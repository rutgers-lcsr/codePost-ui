// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, Empty, Flex, Form, Input, Modal, Spin, Table, Tag, Typography, Button, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, FolderOpenOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { questionBanksApi } from '../../../api-client/clients';
import { QuestionBank } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { quizKeys } from '../../../lib/queryKeys';
import { useQuestionBanks } from './queries';
import MarkdownField from './MarkdownField';
import ImportQuestionsModal from './ImportQuestionsModal';


interface IProps {
  courseId: number;
  selectedBankId?: number;
  onSelect: (bank: QuestionBank | undefined) => void;
}

interface IBankForm {
  name: string;
  description?: string;
}

const QuestionBanksPanel: React.FC<IProps> = ({ courseId, selectedBankId, onSelect }) => {
  const queryClient = useQueryClient();
  const { data: banks = [], isLoading } = useQuestionBanks(courseId);
  const [form] = Form.useForm<IBankForm>();
  const [editing, setEditing] = React.useState<QuestionBank | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: quizKeys.banks(courseId) });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (bank: QuestionBank) => {
    setEditing(bank);
    form.setFieldsValue({ name: bank.name, description: bank.description });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await questionBanksApi.partialUpdate({
          id: editing.id,
          patchedQuestionBank: { name: values.name, description: values.description },
        });
        message.success('Question bank updated.');
      } else {
        await questionBanksApi.create({
          questionBank: { course: courseId, name: values.name, description: values.description },
        });
        message.success('Question bank created.');
      }
      setModalOpen(false);
      invalidate();
    } catch (err) {
      message.error(apiErrorMessage(err, 'name') ?? 'Failed to save question bank.');
    } finally {
      setSaving(false);
    }
  };

  const deleteBank = async (bank: QuestionBank, force: boolean) => {
    try {
      await questionBanksApi.destroy({ id: bank.id, force });
      message.success('Question bank deleted.');
      if (selectedBankId === bank.id) onSelect(undefined);
      invalidate();
    } catch (err) {
      const resp = (err as { response?: Response }).response;
      if (resp?.status === 409) {
        const body = await resp.json().catch(() => ({}));
        const quizzes = (body.impactedQuizzes ?? []) as { id: number; title: string }[];
        Modal.confirm({
          title: `"${bank.name}" is used by ${quizzes.length} quiz(zes)`,
          content: (
            <div>
              <p style={{ marginTop: 0 }}>Deleting it removes its questions from these quizzes:</p>
              <ul style={{ maxHeight: 160, overflow: 'auto', paddingLeft: 18 }}>
                {quizzes.map((q) => (
                  <li key={q.id}>{q.title}</li>
                ))}
              </ul>
              <p style={{ marginBottom: 0 }}>Delete the bank and its questions anyway?</p>
            </div>
          ),
          okText: 'Delete anyway',
          okButtonProps: { danger: true },
          onOk: () => deleteBank(bank, true),
        });
        return;
      }
      message.error('Failed to delete question bank.');
    }
  };

  const handleDelete = (bank: QuestionBank) => {
    Modal.confirm({
      title: `Delete "${bank.name}"?`,
      content: 'Deleting this bank also deletes its questions. If any are used in a quiz, you’ll be asked to confirm.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteBank(bank, false),
    });
  };

  const columns = [
    {
      title: 'Bank',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: QuestionBank) => (
        <Space>
          <FolderOpenOutlined aria-hidden style={{ color: '#198665' }} />
          {/* Focusable control gives keyboard/SR users a path to select the bank; the
              row-wide onClick below stays as a mouse convenience. */}
          <Button
            type="text"
            size="small"
            onClick={() => onSelect(record)}
            aria-current={record.id === selectedBankId ? 'true' : undefined}
            style={{ padding: 0, height: 'auto', fontWeight: record.id === selectedBankId ? 600 : 400 }}
          >
            {name}
          </Button>
        </Space>
      ),
    },
    {
      title: 'Questions',
      dataIndex: 'questionCount',
      key: 'questionCount',
      width: 90,
      render: (count: number) => <Tag>{count ?? 0}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: QuestionBank) => (
        <Space.Compact size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            aria-label={`Edit bank: ${record.name}`}
            title="Edit bank"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(record);
            }}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Delete bank: ${record.name}`}
            title="Delete bank"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record);
            }}
          />
        </Space.Compact>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <Flex align="center" gap={8}>
            <Typography.Title level={2} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Question Banks
            </Typography.Title>
            <Tag color="blue">{banks.length}</Tag>
          </Flex>
        }
        extra={
          <Space>
            <CPButton cpType="secondary" icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
              Import questions
            </CPButton>
            <CPButton cpType="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New Bank
            </CPButton>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        {isLoading ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : banks.length === 0 ? (
          <Empty
            description="No question banks yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 32 }}
          />
        ) : (
          <Table
            dataSource={banks}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            rowClassName={(record) => (record.id === selectedBankId ? 'ant-table-row-selected' : '')}
            onRow={(record) => ({
              onClick: () => onSelect(record),
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Card>

      <Modal
        title={editing ? 'Edit Question Bank' : 'New Question Bank'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editing ? 'Save' : 'Create'}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please name the bank.' }]}
          >
            <Input placeholder="e.g., Midterm Pool, Chapter 3" maxLength={128} />
          </Form.Item>
          <Form.Item name="description" label="Description (optional, Markdown)">
            <MarkdownField courseId={courseId} minRows={3} placeholder="What this bank is for — supports Markdown and images…" />
          </Form.Item>
        </Form>
      </Modal>

      <ImportQuestionsModal open={importOpen} courseId={courseId} onClose={() => setImportOpen(false)} />
    </>
  );
};

export default QuestionBanksPanel;
