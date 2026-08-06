// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Empty, Flex, Form, Input, Modal, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { DeleteOutlined, FileDoneOutlined, PlusOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizzesApi } from '../../../api-client/clients';
import { Quiz } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { quizKeys } from '../../../lib/queryKeys';
import { useCourseQuizzes } from './queries';
import MarkdownField from './MarkdownField';
import PanelCard from './PanelCard';

interface IProps {
  courseId: number;
  selectedQuizId?: number;
  onSelect: (quiz: Quiz | undefined) => void;
}

interface IQuizForm {
  title: string;
  description?: string;
}

const QuizzesListPanel: React.FC<IProps> = ({ courseId, selectedQuizId, onSelect }) => {
  const queryClient = useQueryClient();
  const { data: quizzes = [], isLoading } = useCourseQuizzes(courseId);
  const [form] = Form.useForm<IQuizForm>();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: quizKeys.list(courseId) });

  const openCreate = () => {
    form.resetFields();
    setModalOpen(true);
  };

  // Quizzes are created here; title/description/assignment are edited in the builder's
  // Quiz Settings (select a quiz on the right).
  const handleCreate = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const created = await quizzesApi.create({
        quiz: { course: courseId, title: values.title, description: values.description },
      });
      message.success('Quiz created.');
      setModalOpen(false);
      invalidate();
      onSelect(created);
    } catch (err) {
      message.error(apiErrorMessage(err, 'title') ?? 'Failed to create quiz.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (quiz: Quiz) => {
    Modal.confirm({
      title: `Delete "${quiz.title}"?`,
      content: 'The quiz is removed. Its questions are not deleted (they stay in the course and any banks).',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await quizzesApi.destroy({ id: quiz.id! });
          message.success('Quiz deleted.');
          if (selectedQuizId === quiz.id) onSelect(undefined);
          invalidate();
        } catch {
          message.error('Failed to delete quiz.');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Quiz',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Quiz) => (
        <Space>
          <FileDoneOutlined aria-hidden style={{ color: '#198665' }} />
          {/* Focusable control gives keyboard/SR users a path to select the quiz; the
              row-wide onClick below stays as a mouse convenience. */}
          <Button
            type="text"
            size="small"
            onClick={() => onSelect(record)}
            aria-current={record.id === selectedQuizId ? 'true' : undefined}
            // Buttons are nowrap by default, which lets a long quiz title push the table
            // wider than its column and spill over the builder pane.
            style={{
              padding: 0,
              height: 'auto',
              textAlign: 'left',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              fontWeight: record.id === selectedQuizId ? 600 : 400,
            }}
          >
            {title}
          </Button>
          {record.assignment != null && <Tag color="green">Attached</Tag>}
        </Space>
      ),
    },
    {
      title: 'Qs',
      key: 'count',
      width: 60,
      // Fixed questions plus how many each random draw picks and each AI section generates.
      render: (_: unknown, record: Quiz) => {
        const count =
          (record.quizQuestions?.length ?? 0) +
          (record.questionGroups ?? []).reduce((sum, g) => sum + (g.pickCount ?? 1), 0) +
          (record.generatedSections ?? []).reduce((sum, s) => sum + (s.numQuestions ?? 3), 0);
        return <Tag>{count}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_: unknown, record: Quiz) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          aria-label={`Delete quiz: ${record.title}`}
          title="Delete quiz"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(record);
          }}
        />
      ),
    },
  ];

  return (
    <>
      <PanelCard
        title={
          <Flex align="center" gap={8} style={{ minWidth: 0 }}>
            <Typography.Title level={2} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Quizzes
            </Typography.Title>
            <Tag color="blue">{quizzes.length}</Tag>
          </Flex>
        }
        extra={
          <CPButton cpType="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Quiz
          </CPButton>
        }
        styles={{ body: { padding: 0 } }}
      >
        {isLoading ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : quizzes.length === 0 ? (
          <Empty description="No quizzes yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 32 }} />
        ) : (
          <Table
            dataSource={quizzes}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            rowClassName={(record) => (record.id === selectedQuizId ? 'ant-table-row-selected' : '')}
            onRow={(record) => ({ onClick: () => onSelect(record), style: { cursor: 'pointer' } })}
          />
        )}
      </PanelCard>

      <Modal
        title="New Quiz"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        okText="Create"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please name the quiz.' }]}>
            <Input placeholder="e.g., Week 1 Quiz" maxLength={128} />
          </Form.Item>
          <Form.Item name="description" label="Description (optional, Markdown)">
            <MarkdownField courseId={courseId} minRows={3} placeholder="What this quiz covers — supports Markdown and images…" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default QuizzesListPanel;
