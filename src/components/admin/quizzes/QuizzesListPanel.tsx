// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Empty, Flex, Input, Modal, Space, Spin, Table, Tag, Tooltip, Typography, message } from 'antd';
import { GREEN_TAG } from '../../../theme/tagStyles';
import { DeleteOutlined, EditOutlined, FileDoneOutlined, PlusOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizzesApi } from '../../../api-client/clients';
import { Course, Quiz } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { useBackfillPreview, useCourseQuizzes } from './queries';
import QuizCreateWizard from './create/QuizCreateWizard';
import PanelCard from './PanelCard';

/** Red "N missing" tag for a quiz whose students lack generated question sets — those
 *  students can't open the quiz, so the instructor must see it from the list, before ever
 *  opening the quiz. Mounted only for quizzes with AI sections, so the per-quiz backfill
 *  preview is fetched sparingly; shares the builder/Review panel's query key. */
const MissingSetsTag: React.FC<{ quizId: number }> = ({ quizId }) => {
  const { data } = useBackfillPreview(quizId);
  const missing = data?.missing ?? 0;
  if (missing === 0) return null;
  return (
    <Tag color="red" title={`${missing} students are missing generated questions`} data-testid="quiz-missing-tag">
      {missing} missing
    </Tag>
  );
};

interface IProps {
  course: Course;
  selectedQuizId?: number;
  onSelect: (quiz: Quiz | undefined) => void;
}

const QuizzesListPanel: React.FC<IProps> = ({ course, selectedQuizId, onSelect }) => {
  const courseId = course.id!;
  const queryClient = useQueryClient();
  const { data: quizzes = [], isLoading } = useCourseQuizzes(courseId);
  // Quizzes are created through the wizard (all settings up front, or Skip & create);
  // everything remains editable in the builder's Quiz Settings.
  const [wizardOpen, setWizardOpen] = React.useState(false);
  // Twenty quizzes with near-identical names need a filter; a short list does not.
  const [search, setSearch] = React.useState('');
  const visibleQuizzes = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? quizzes.filter((quiz) => quiz.title.toLowerCase().includes(q)) : quizzes;
  }, [quizzes, search]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: quizKeys.list(courseId) });

  const openCreate = () => setWizardOpen(true);

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
        // Wrapping: in a narrow list the state tags drop under the title instead of
        // squeezing it to one character per line.
        <Space wrap size={[8, 4]}>
          {/* Focusable control gives keyboard/SR users a path to select the quiz; the
              row-wide onClick below stays as a mouse convenience. The icon rides inside
              the button so a wrapping title never strands it on its own line. */}
          <Button
            type="text"
            size="small"
            icon={<FileDoneOutlined aria-hidden style={{ color: '#198665' }} />}
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
          {/* Same grey Draft chip idiom as the assignments table — unpublished quizzes are
              invisible to students, which instructors kept missing. */}
          {!record.isPublished && (
            <Tag
              icon={<EditOutlined />}
              title="Hidden from students until you publish it (Settings → Published)"
              data-testid="quiz-draft-tag"
            >
              Draft
            </Tag>
          )}
          {record.assignment != null && <Tag style={GREEN_TAG}>Attached</Tag>}
          {(record.generatedSections ?? []).length > 0 && <MissingSetsTag quizId={record.id!} />}
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
        <Tooltip title="Delete quiz">
          <Button
            size="small"
            danger
            className="cp-quiet-delete"
            icon={<DeleteOutlined />}
            aria-label={`Delete quiz: ${record.title}`}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record);
            }}
          />
        </Tooltip>
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
        {/* The same filter idiom as the assignments page: a full-width search above the list. */}
        {quizzes.length > 5 && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <Input.Search
              allowClear
              placeholder={`Search ${quizzes.length} quizzes by title`}
              aria-label="Search quizzes by title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
        {isLoading ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : quizzes.length === 0 ? (
          <Empty description="No quizzes yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 32 }} />
        ) : visibleQuizzes.length === 0 ? (
          <Empty
            description={`No quizzes match “${search.trim()}”`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 32 }}
          >
            <Button size="small" onClick={() => setSearch('')}>
              Clear search
            </Button>
          </Empty>
        ) : (
          <Table
            dataSource={visibleQuizzes}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            rowClassName={(record) => (record.id === selectedQuizId ? 'ant-table-row-selected' : '')}
            onRow={(record) => ({ onClick: () => onSelect(record), style: { cursor: 'pointer' } })}
          />
        )}
      </PanelCard>

      <QuizCreateWizard
        open={wizardOpen}
        course={course}
        onCancel={() => setWizardOpen(false)}
        onCreated={(created) => {
          setWizardOpen(false);
          invalidate();
          onSelect(created);
        }}
      />
    </>
  );
};

export default QuizzesListPanel;
