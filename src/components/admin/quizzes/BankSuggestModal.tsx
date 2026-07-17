// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Empty, Flex, InputNumber, Modal, Select, Spin, Typography, message } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { assignmentsApi } from '../../../api-client/clients';
import { Course, QuestionTypeEnum } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { useAssignmentsQuery } from '../hooks/useAssignmentsQuery';
import { useAssignmentSuggestions } from './queries';
import { typeMeta } from '../../core/questionMeta';
import SuggestionCard from './SuggestionCard';

const { Text } = Typography;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TYPE_OPTIONS = [
  QuestionTypeEnum.MultipleChoice,
  QuestionTypeEnum.MultipleAnswers,
  QuestionTypeEnum.TrueFalse,
  QuestionTypeEnum.ShortAnswer,
  QuestionTypeEnum.Numerical,
  QuestionTypeEnum.Essay,
  QuestionTypeEnum.Code,
].map((t) => ({ value: t as string, label: typeMeta(t).label }));

interface IProps {
  open: boolean;
  course: Course;
  bankId: number;
  bankAssignments: number[];
  onClose: () => void;
}

/** Generate AI quiz-question suggestions from an assignment, review them, and accept
 *  into this bank. Reached from the bank page. */
const BankSuggestModal: React.FC<IProps> = ({ open, course, bankId, bankAssignments, onClose }) => {
  const queryClient = useQueryClient();
  const { data: assignments = [] } = useAssignmentsQuery(course);

  const [assignmentId, setAssignmentId] = React.useState<number | undefined>(undefined);
  const [numQuestions, setNumQuestions] = React.useState(5);
  const [questionTypes, setQuestionTypes] = React.useState<string[]>([]);
  const [generating, setGenerating] = React.useState(false);

  const { data: suggestions = [], isLoading } = useAssignmentSuggestions(open ? assignmentId : undefined);

  // Default the source assignment to the bank's first attached assignment.
  React.useEffect(() => {
    if (open) setAssignmentId(bankAssignments[0]);
  }, [open, bankAssignments]);

  const handleGenerate = async () => {
    if (!assignmentId) {
      message.warning('Pick a source assignment first.');
      return;
    }
    setGenerating(true);
    try {
      await assignmentsApi.generateQuizQuestionsCreate({
        id: assignmentId,
        generateQuizQuestionsRequest: {
          numQuestions,
          questionTypes: questionTypes.length ? questionTypes : undefined,
        },
      });
      let list = await assignmentsApi.suggestedQuizQuestionsList({ id: assignmentId });
      let tries = 0;
      while (list.length === 0 && tries < 20) {
        await sleep(1500);
        list = await assignmentsApi.suggestedQuizQuestionsList({ id: assignmentId });
        tries += 1;
      }
      queryClient.invalidateQueries({ queryKey: quizKeys.suggestions(assignmentId) });
      if (list.length === 0) {
        message.info('No suggestions were generated — AI quiz suggestions may be disabled or unconfigured.');
      }
    } catch {
      message.error('Failed to start generation.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal title="Suggest questions for this bank" open={open} onCancel={onClose} footer={null} width={760} destroyOnHidden>
      <Text type="secondary" style={{ fontSize: 13 }}>
        Generate from an assignment’s materials and review each suggestion. Accepting adds a real,
        instructor-authored question to this bank.
      </Text>

      <Flex gap={12} align="end" wrap style={{ margin: '16px 0 12px' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Source assignment
          </Text>
          <Select
            aria-label="Source assignment"
            placeholder="Choose an assignment"
            style={{ minWidth: 240 }}
            value={assignmentId}
            onChange={(v) => setAssignmentId(v)}
            options={assignments.map((a) => ({
              value: a.id,
              label: bankAssignments.includes(a.id) ? `${a.name} (linked)` : a.name,
            }))}
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            How many
          </Text>
          <InputNumber aria-label="How many questions" min={1} max={20} value={numQuestions} onChange={(v) => setNumQuestions(Number(v ?? 5))} />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Types (optional)
          </Text>
          <Select
            mode="multiple"
            allowClear
            aria-label="Question types"
            placeholder="Any type"
            style={{ minWidth: 220 }}
            value={questionTypes}
            onChange={(v) => setQuestionTypes(v)}
            options={TYPE_OPTIONS}
            maxTagCount="responsive"
          />
        </div>
        <CPButton cpType="primary" icon={<ThunderboltOutlined />} onClick={handleGenerate} loading={generating} disabled={!assignmentId}>
          Generate
        </CPButton>
      </Flex>

      {generating ? (
        <Flex align="center" gap={8} style={{ padding: 24 }} role="status">
          <Spin />
          <Text type="secondary">Generating suggestions…</Text>
        </Flex>
      ) : !assignmentId ? (
        <Empty description="Pick a source assignment to generate suggestions" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : isLoading ? (
        <Flex justify="center" style={{ padding: 24 }}>
          <Spin />
        </Flex>
      ) : suggestions.length === 0 ? (
        <Empty description="No pending suggestions — generate some above" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message={`${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} to review`}
          />
          {suggestions.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} courseId={course.id!} targetBankId={bankId} />
          ))}
        </>
      )}
    </Modal>
  );
};

export default BankSuggestModal;
