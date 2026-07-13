// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Card, Dropdown, Empty, Flex, Modal, Select, Space, Spin, Table, Tag, Typography, message } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SwapOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { questionsApi, questionBanksApi } from '../../../api-client/clients';
import { Course, Question, QuestionBank } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { useBankQuestions, useQuestionBanks } from './queries';
import { useAssignmentsQuery } from '../hooks/useAssignmentsQuery';
import { typeMeta } from '../../core/questionMeta';
import QuestionChoicesInline from './QuestionChoicesInline';
import QuestionEditorModal from './QuestionEditorModal';
import BankSuggestModal from './BankSuggestModal';
import RegenerateQuestionModal from './RegenerateQuestionModal';
import Markdown from '../../core/Markdown';

const { Text } = Typography;

// Strip basic inline Markdown markers for a clean one-line list preview.
const stripMd = (s: string) =>
  (s || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .trim();

interface IProps {
  course: Course;
  bank: QuestionBank;
}

const QuestionsPanel: React.FC<IProps> = ({ course, bank }) => {
  const courseId = course.id!;
  const queryClient = useQueryClient();
  const { data: questions = [], isLoading } = useBankQuestions(bank.id);
  const { data: allBanks = [] } = useQuestionBanks(courseId);
  const { data: assignments = [] } = useAssignmentsQuery(course);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Question | null>(null);
  const [suggestOpen, setSuggestOpen] = React.useState(false);
  const [regenQuestion, setRegenQuestion] = React.useState<Question | null>(null);
  const [assignmentIds, setAssignmentIds] = React.useState<number[]>(bank.assignments ?? []);
  const [selectedIds, setSelectedIds] = React.useState<React.Key[]>([]);

  React.useEffect(() => setAssignmentIds(bank.assignments ?? []), [bank.id, bank.assignments]);
  React.useEffect(() => setSelectedIds([]), [bank.id]);

  const runBulk = async (mode: 'move' | 'copy', targetBankId: number) => {
    const questionIds = selectedIds.map(Number);
    try {
      if (mode === 'move') {
        await questionsApi.moveToBankCreate({ bankQuestionsRequest: { questionIds, bankId: targetBankId } });
        message.success(`Moved ${questionIds.length} question(s).`);
      } else {
        await questionsApi.copyToBankCreate({ bankCopyRequest: { questionIds, bankId: targetBankId } });
        message.success(`Copied ${questionIds.length} question(s).`);
      }
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: quizKeys.bankQuestions(bank.id) });
      queryClient.invalidateQueries({ queryKey: quizKeys.bankQuestions(targetBankId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.banks(courseId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.courseQuestions(courseId) });
    } catch {
      message.error(mode === 'move' ? 'Failed to move questions.' : 'Failed to copy questions.');
    }
  };

  const bankMenu = (mode: 'move' | 'copy') => ({
    items: allBanks
      .filter((b) => (mode === 'move' ? b.id !== bank.id : true))
      .map((b) => ({ key: String(b.id), label: b.name, onClick: () => runBulk(mode, b.id!) })),
  });

  const handleAssignmentsChange = async (ids: number[]) => {
    setAssignmentIds(ids);
    try {
      await questionBanksApi.partialUpdate({ id: bank.id, patchedQuestionBank: { assignments: ids } });
      queryClient.invalidateQueries({ queryKey: quizKeys.banks(courseId) });
    } catch {
      message.error('Failed to update the bank’s assignments.');
      setAssignmentIds(bank.assignments ?? []);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (q: Question) => {
    setEditing(q);
    setEditorOpen(true);
  };

  const handleDelete = (q: Question) => {
    Modal.confirm({
      title: 'Delete this question?',
      content: 'This permanently deletes the question from the course and all banks/quizzes that use it.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await questionsApi.destroy({ id: q.id! });
          message.success('Question deleted.');
          queryClient.invalidateQueries({ queryKey: quizKeys.bankQuestions(bank.id) });
          queryClient.invalidateQueries({ queryKey: quizKeys.banks(courseId) });
        } catch {
          message.error('Failed to delete question.');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'questionType',
      key: 'questionType',
      width: 140,
      render: (t: string) => {
        const meta = typeMeta(t);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Question',
      dataIndex: 'text',
      key: 'text',
      render: (text: string) => {
        const preview = stripMd(text);
        return <Text>{preview.length > 100 ? `${preview.slice(0, 100)}…` : preview}</Text>;
      },
    },
    {
      title: 'Pts',
      dataIndex: 'points',
      key: 'points',
      width: 60,
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: Question) => (
        // Stop propagation so action clicks don't toggle the expandable row.
        <Space.Compact size="small" onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            icon={<SyncOutlined />}
            title="Suggest an AI update for this question"
            onClick={() => setRegenQuestion(record)}
          />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
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
              {bank.name}
            </Typography.Title>
            <Tag color="blue">{questions.length} questions</Tag>
          </Flex>
        }
        extra={
          <Space>
            <CPButton cpType="secondary" icon={<ThunderboltOutlined />} onClick={() => setSuggestOpen(true)}>
              Suggest questions
            </CPButton>
            <CPButton cpType="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New Question
            </CPButton>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5' }}>
          <Flex align="center" gap={8} wrap>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Assignments:
            </Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="Not linked to any assignment"
              style={{ minWidth: 280, flex: 1 }}
              value={assignmentIds}
              onChange={handleAssignmentsChange}
              options={assignments.map((a) => ({ value: a.id, label: a.name }))}
              maxTagCount="responsive"
            />
          </Flex>
        </div>
        {bank.description && (
          <div style={{ padding: '12px 16px 0', fontSize: 13 }}>
            <Markdown>{bank.description}</Markdown>
          </div>
        )}
        {selectedIds.length > 0 && (
          <Flex
            align="center"
            gap={8}
            style={{ padding: '8px 16px', background: '#f6ffed', borderBottom: '1px solid #f5f5f5' }}
          >
            <Text style={{ fontSize: 13 }}>{selectedIds.length} selected</Text>
            <Dropdown menu={bankMenu('move')} disabled={allBanks.length < 2} trigger={['click']}>
              <Button size="small" icon={<SwapOutlined />}>
                Move to bank
              </Button>
            </Dropdown>
            <Dropdown menu={bankMenu('copy')} trigger={['click']}>
              <Button size="small" icon={<CopyOutlined />}>
                Copy to bank
              </Button>
            </Dropdown>
            <Button size="small" type="text" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </Flex>
        )}
        {isLoading ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : questions.length === 0 ? (
          <Empty description="No questions in this bank yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 32 }} />
        ) : (
          <Table
            dataSource={questions}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            rowSelection={{ selectedRowKeys: selectedIds, onChange: setSelectedIds }}
            expandable={{
              expandRowByClick: true,
              // Every question has a stem, so any row can be expanded to preview it.
              rowExpandable: () => true,
              expandedRowRender: (record) => (
                <QuestionChoicesInline question={record} courseId={courseId} bankId={bank.id} />
              ),
            }}
          />
        )}
      </Card>

      <QuestionEditorModal
        open={editorOpen}
        courseId={courseId}
        bankId={bank.id}
        question={editing}
        onClose={() => setEditorOpen(false)}
      />

      <BankSuggestModal
        open={suggestOpen}
        course={course}
        bankId={bank.id}
        bankAssignments={assignmentIds}
        onClose={() => setSuggestOpen(false)}
      />

      <RegenerateQuestionModal
        open={!!regenQuestion}
        courseId={courseId}
        bankId={bank.id}
        question={regenQuestion}
        onClose={() => setRegenQuestion(null)}
      />
    </>
  );
};

export default QuestionsPanel;
