// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Empty, Flex, Input, Modal, Select, Spin, Table, Tag, Typography, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { quizQuestionsApi } from '../../../api-client/clients';
import { Question } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { useCourseQuestions, useQuestionBanks } from './queries';
import { typeMeta } from '../../core/questionMeta';

const { Text } = Typography;

interface IProps {
  open: boolean;
  courseId: number;
  quizId: number;
  existingQuestionIds: number[];
  nextSortKey: number;
  onClose: () => void;
}

const AddQuestionsModal: React.FC<IProps> = ({ open, courseId, quizId, existingQuestionIds, nextSortKey, onClose }) => {
  const queryClient = useQueryClient();
  const { data: questions = [], isLoading } = useCourseQuestions(open ? courseId : undefined);
  const { data: banks = [] } = useQuestionBanks(open ? courseId : undefined);
  const [selected, setSelected] = React.useState<number[]>([]);
  const [search, setSearch] = React.useState('');
  const [bankFilter, setBankFilter] = React.useState<number | undefined>(undefined);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelected([]);
      setSearch('');
      setBankFilter(undefined);
    }
  }, [open]);

  const existing = new Set(existingQuestionIds);
  const available = questions.filter(
    (q) =>
      !existing.has(q.id!) &&
      (!search || q.text.toLowerCase().includes(search.toLowerCase())) &&
      (bankFilter === undefined || q.bank === bankFilter),
  );

  const handleAdd = async () => {
    if (selected.length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        selected.map((questionId, i) =>
          quizQuestionsApi.create({
            quizQuestion: { quiz: quizId, question: questionId, sortKey: nextSortKey + i },
          }),
        ),
      );
      message.success(`Added ${selected.length} question${selected.length === 1 ? '' : 's'}.`);
      queryClient.invalidateQueries({ queryKey: quizKeys.membership(quizId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.list(courseId) });
      onClose();
    } catch {
      message.error('Failed to add questions.');
    } finally {
      setSaving(false);
    }
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
      render: (text: string) => <Text>{text.length > 120 ? `${text.slice(0, 120)}…` : text}</Text>,
    },
  ];

  return (
    <Modal
      title="Add questions to quiz"
      open={open}
      onCancel={onClose}
      onOk={handleAdd}
      okText={selected.length ? `Add ${selected.length}` : 'Add'}
      confirmLoading={saving}
      width={720}
      destroyOnHidden
    >
      <Flex gap={8} style={{ margin: '8px 0 12px' }}>
        <Select
          allowClear
          aria-label="Filter by bank"
          placeholder="All banks"
          style={{ width: 220 }}
          value={bankFilter}
          onChange={(v) => setBankFilter(v)}
          options={banks.map((b) => ({ value: b.id, label: b.name }))}
        />
        <Input.Search
          aria-label="Search questions"
          placeholder="Search questions"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
      </Flex>
      {isLoading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : available.length === 0 ? (
        <Empty
          description={questions.length === 0 ? 'No questions in this course yet' : 'All questions are already in this quiz'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          dataSource={available}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (keys) => setSelected(keys as number[]),
          }}
          onRow={(record: Question) => ({
            onClick: () => {
              const id = record.id!;
              setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
            },
            style: { cursor: 'pointer' },
          })}
        />
      )}
    </Modal>
  );
};

export default AddQuestionsModal;
