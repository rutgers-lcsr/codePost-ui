// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Review of per-student generated question sets: lists each student's set with its status,
// links to their submission for context, and lets staff edit questions inline, approve
// (publishing the quiz for that student), regenerate, or bulk-publish everything awaiting
// review. Access is enforced server-side (course admins always; graders only when the
// quiz's gradersCanReviewGenerated flag is on) — a 403 here means the viewer lacks access.
import * as React from 'react';
import {
  Alert, AutoComplete, Drawer, Empty, Flex, Input, InputNumber, Modal, Space, Spin, Table, Tag,
  Tooltip, Typography, message,
} from 'antd';
import { LeftOutlined, ExportOutlined, RobotOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import CPButton from '../../core/CPButton';
import {
  generatedQuestionSetsApi, generatedQuizQuestionsApi, quizzesApi,
} from '../../../api-client/clients';
import {
  GeneratedQuestionSetList, GeneratedQuizQuestion, Quiz, QuestionTypeEnum,
} from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { useApiAction } from '../../../hooks/useApiAction';
import { quizKeys } from '../../../lib/queryKeys';
import { useBackfillPreview, useGeneratedSetDetail, useGeneratedSets } from './queries';
import { useRosterQuery } from '../hooks/useRosterQuery';
import ChoicesEditor from './ChoicesEditor';
import CodeQuestionEditor from './CodeQuestionEditor';
import { LocalChoice, hasChoiceEditor, validateChoices } from './choiceUtils';
import MarkdownField from './MarkdownField';
import { typeMeta } from '../../core/questionMeta';

const { Text } = Typography;

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Queued', color: 'default' },
  generating: { label: 'Generating…', color: 'processing' },
  ready: { label: 'Needs review', color: 'gold' },
  approved: { label: 'Published', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
};

interface IProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz;
  courseId: number;
}

/** One editable generated question: stem, description, choices, and points. */
const GeneratedQuestionCard: React.FC<{
  question: GeneratedQuizQuestion;
  courseId: number;
  editable: boolean;
  onChanged: () => void;
}> = ({ question, courseId, editable, onChanged }) => {
  const [text, setText] = React.useState(question.text);
  const [description, setDescription] = React.useState(question.description ?? '');
  const [starterCode, setStarterCode] = React.useState(question.starterCode ?? '');
  const [points, setPoints] = React.useState<number>(Number(question.points ?? 1));
  const [choices, setChoices] = React.useState<LocalChoice[]>(
    ((question.choicesData as LocalChoice[] | null) ?? []).map((c) => ({
      text: c.text ?? '', isCorrect: !!c.isCorrect,
    })),
  );
  const [saving, setSaving] = React.useState(false);

  const questionType = question.questionType as QuestionTypeEnum;
  const dirty =
    text !== question.text ||
    description !== (question.description ?? '') ||
    starterCode !== (question.starterCode ?? '') ||
    points !== Number(question.points ?? 1) ||
    JSON.stringify(choices) !==
      JSON.stringify(((question.choicesData as LocalChoice[] | null) ?? []).map((c) => ({
        text: c.text ?? '', isCorrect: !!c.isCorrect,
      })));

  const save = async () => {
    const choiceError = hasChoiceEditor(questionType) ? validateChoices(questionType, choices) : null;
    if (choiceError) {
      message.warning(choiceError);
      return;
    }
    setSaving(true);
    try {
      await generatedQuizQuestionsApi.partialUpdate({
        id: question.id!,
        patchedGeneratedQuizQuestion: {
          text,
          description,
          points,
          starterCode: questionType === QuestionTypeEnum.Code ? starterCode : question.starterCode,
          choicesData: hasChoiceEditor(questionType) ? choices : [],
        },
      });
      message.success('Question saved.');
      onChanged();
    } catch (e) {
      message.error(apiErrorMessage(e) ?? 'Failed to save the question.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    Modal.confirm({
      title: 'Remove this question?',
      content: "It will be removed from this student's quiz. This cannot be undone.",
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await generatedQuizQuestionsApi.destroy({ id: question.id! });
          message.success('Question removed.');
          onChanged();
        } catch (e) {
          message.error(apiErrorMessage(e) ?? 'Failed to remove the question.');
        }
      },
    });
  };

  const meta = typeMeta(question.questionType);
  return (
    <Flex vertical gap={8} style={{ padding: 12, border: '1px solid #f0f0f0', borderRadius: 8 }}>
      <Space wrap>
        <Tag color={meta.color}>{meta.label}</Tag>
        <Text type="secondary">Points:</Text>
        <InputNumber min={0} step={1} value={points} disabled={!editable}
                     onChange={(v) => setPoints(v ?? 0)} size="small" />
      </Space>
      <Input.TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoSize={{ minRows: 2 }}
        disabled={!editable}
        placeholder="Question stem"
      />
      <MarkdownField
        value={description}
        onChange={setDescription}
        courseId={courseId}
        minRows={2}
        placeholder="Optional description shown beneath the stem…"
      />
      {hasChoiceEditor(questionType) && (
        <ChoicesEditor questionType={questionType} value={choices} onChange={setChoices} />
      )}
      {questionType === QuestionTypeEnum.Code && (
        <CodeQuestionEditor
          value={starterCode}
          onChange={setStarterCode}
          language={question.language}
          readOnly={!editable}
        />
      )}
      {editable && (
        <Space>
          <CPButton cpType="primary" size="small" onClick={save} loading={saving} disabled={!dirty}>
            Save question
          </CPButton>
          <CPButton size="small" danger onClick={remove}>
            Remove
          </CPButton>
        </Space>
      )}
    </Flex>
  );
};

const GeneratedReviewDrawer: React.FC<IProps> = ({ open, onClose, quiz, courseId }) => {
  const queryClient = useQueryClient();
  const [currentId, setCurrentId] = React.useState<number | null>(null);

  const { data: sets = [], isLoading, error } = useGeneratedSets(open ? quiz.id : undefined);
  // Students with a submission but no set — shown on the Generate-missing button.
  const { data: backfillPreview } = useBackfillPreview(quiz.id, open);
  const missingCount = backfillPreview?.missing ?? 0;
  const { data: current } = useGeneratedSetDetail(currentId ?? undefined);
  // Roster emails feed the generate-for-student picker; if the viewer can't read the
  // roster (403) the field simply falls back to free typing.
  const { data: roster } = useRosterQuery(open ? courseId : undefined);
  const [genEmail, setGenEmail] = React.useState('');

  React.useEffect(() => {
    if (!open) setCurrentId(null);
  }, [open]);

  const generateFor = (email: string) =>
    act(async () => {
      await quizzesApi.generateForStudentCreate({
        id: quiz.id!,
        generateForStudentRequest: { student: email },
      });
      setGenEmail('');
    }, `Generating questions for ${email}…`, 'Failed to start generation.');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.generatedSets(quiz.id!) });
    queryClient.invalidateQueries({ queryKey: quizKeys.backfillPreview(quiz.id!) });
    if (currentId != null) {
      queryClient.invalidateQueries({ queryKey: quizKeys.generatedSetDetail(currentId) });
    }
  };

  const { acting, run: act } = useApiAction(refresh);

  const approve = (id: number) =>
    act(() => generatedQuestionSetsApi.approveCreate({ id }), 'Approved — the quiz is now open for this student.');

  const unapprove = (id: number) =>
    act(() => generatedQuestionSetsApi.unapproveCreate({ id }), 'Set back to review — the quiz is closed for this student.');

  const regenerate = (id: number) => {
    Modal.confirm({
      title: 'Regenerate this student\'s questions?',
      content: 'The current questions are discarded and new ones are generated from their '
        + 'submission. If the set was published, it is un-published until you re-approve it.',
      okText: 'Regenerate',
      onOk: () => act(() => generatedQuestionSetsApi.regenerateCreate({ id }), 'Regenerating…'),
    });
  };

  const generateMissing = () =>
    act(async () => {
      const res = await quizzesApi.generateMissingCreate({ id: quiz.id! });
      message.info(
        res.queued > 0
          ? `Queued generation for ${res.queued} student${res.queued === 1 ? '' : 's'}.`
          : 'Everyone with a submission already has a question set.',
      );
    }, 'Generate-missing complete.');

  const publishAll = () => {
    const readyCount = sets.filter((s) => s.status === 'ready').length;
    Modal.confirm({
      title: `Publish all ${readyCount} set(s) awaiting review?`,
      content: 'Every student whose questions are ready will have their quiz opened without '
        + 'individual review. You take authorship of all published questions.',
      okText: 'Publish all',
      onOk: () =>
        act(async () => {
          const res = await quizzesApi.publishAllGeneratedCreate({ id: quiz.id! });
          message.info(`Published ${res.approved}; skipped ${res.skipped}.`);
        }, 'Bulk publish complete.'),
    });
  };

  const columns = [
    { title: 'Student', dataIndex: 'studentEmail', key: 'studentEmail' },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_: unknown, s: GeneratedQuestionSetList) => {
        const meta = STATUS_META[s.status ?? ''] ?? { label: s.status, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    { title: 'Questions', dataIndex: 'questionCount', key: 'questionCount', width: 90 },
    {
      title: 'Generated',
      key: 'modified',
      width: 140,
      render: (_: unknown, s: GeneratedQuestionSetList) =>
        s.modified ? dayjs(s.modified).format('MMM D, HH:mm') : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 220,
      render: (_: unknown, s: GeneratedQuestionSetList) => (
        <Space>
          {s.submission != null && (
            <CPButton
              size="small"
              icon={<ExportOutlined />}
              onClick={() => window.open(`/code/${s.submission}`, '_blank')}
            >
              Submission
            </CPButton>
          )}
          <CPButton size="small" cpType="primary" disabled={s.status === 'pending' || s.status === 'generating'}
                    onClick={() => setCurrentId(s.id!)}>
            Review
          </CPButton>
        </Space>
      ),
    },
  ];

  const readyCount = sets.filter((s) => s.status === 'ready').length;
  const detailEditable = current?.status === 'ready' || current?.status === 'approved';

  return (
    <Drawer
      title={current
        ? `Review — ${current.studentEmail}`
        : `Generated questions — ${quiz.title}`}
      width={860}
      open={open}
      onClose={onClose}
      extra={!current && (
        <CPButton cpType="primary" disabled={readyCount === 0} loading={acting} onClick={publishAll}>
          Publish all ({readyCount})
        </CPButton>
      )}
    >
      {error != null && (
        <Alert
          type="warning"
          showIcon
          title="You don't have access to review generated questions on this quiz."
          style={{ marginBottom: 12 }}
        />
      )}
      {!current && error == null && (
        <Space style={{ marginBottom: 12 }}>
          <AutoComplete
            style={{ width: 280 }}
            placeholder="Generate for a student (email)…"
            value={genEmail}
            onChange={setGenEmail}
            options={(roster?.students ?? [])
              .filter((s): s is string => !!s)
              .map((s) => ({ value: s }))}
            filterOption={(input, option) =>
              String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
            }
            data-testid="generate-for-student-email"
          />
          <CPButton
            icon={<RobotOutlined />}
            loading={acting}
            disabled={!genEmail.trim()}
            onClick={() => generateFor(genEmail.trim())}
            data-testid="generate-for-student"
          >
            Generate
          </CPButton>
          <Tooltip title="Generate for every student who has a submission but no question set yet (e.g. they submitted before this section existed).">
            <CPButton
              loading={acting}
              disabled={missingCount === 0}
              onClick={generateMissing}
              data-testid="generate-missing"
            >
              Generate missing{missingCount > 0 ? ` (${missingCount})` : ''}
            </CPButton>
          </Tooltip>
        </Space>
      )}
      {!current && (
        isLoading ? (
          <Spin />
        ) : sets.length === 0 ? (
          <Empty description="No generated sets yet — they appear when students submit the assignment,
            or generate one for a specific student above." />
        ) : (
          <Table
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={sets}
            pagination={false}
            data-testid="generated-sets-table"
          />
        )
      )}
      {current && (
        <Flex vertical gap={12}>
          <div>
            <CPButton size="small" icon={<LeftOutlined />} onClick={() => setCurrentId(null)}>
              All students
            </CPButton>
          </div>
          {current.status === 'failed' && (
            <Alert type="error" showIcon title="Generation failed"
                   description={current.errorMessage || 'Unknown error.'} />
          )}
          {(current.questions ?? []).map((q) => (
            <GeneratedQuestionCard
              key={q.id}
              question={q}
              courseId={courseId}
              editable={detailEditable}
              onChanged={refresh}
            />
          ))}
          <Space>
            {current.status === 'ready' && (
              <CPButton cpType="primary" loading={acting} onClick={() => approve(current.id!)}
                        data-testid="approve-set">
                Approve &amp; publish for this student
              </CPButton>
            )}
            {current.status === 'approved' && (
              <CPButton loading={acting} onClick={() => unapprove(current.id!)}>
                Unapprove
              </CPButton>
            )}
            {current.submission != null && (
              <CPButton loading={acting} onClick={() => regenerate(current.id!)}>
                Regenerate
              </CPButton>
            )}
            {current.submission != null && (
              <CPButton icon={<ExportOutlined />}
                        onClick={() => window.open(`/code/${current.submission}`, '_blank')}>
                View submission
              </CPButton>
            )}
          </Space>
        </Flex>
      )}
    </Drawer>
  );
};

export default GeneratedReviewDrawer;
