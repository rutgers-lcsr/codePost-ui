// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Review of per-student generated question sets: lists each student's set with its status,
// links to their submission for context, and lets staff edit questions inline, approve
// (publishing the quiz for that student), regenerate, or bulk-publish everything awaiting
// review. Access is enforced server-side (course admins always; graders only when the
// quiz's gradersCanReviewGenerated flag is on) — a 403 here means the viewer lacks access.
// Embedded as the quiz page's Review tab; `active` gates the queries (and the pending-set
// polling) so an inactive tab doesn't fetch.
import * as React from 'react';
import {
  Alert, AutoComplete, Collapse, Divider, Empty, Flex, Input, InputNumber, Modal, Select, Space,
  Spin, Table, Tag, Tooltip, Typography, message,
} from 'antd';
import { InfoCircleOutlined, LeftOutlined, ExportOutlined, RobotOutlined } from '@ant-design/icons';
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
import { useBackfillPreview, useGeneratedSetDetail, useGeneratedSets, useStaffSections } from './queries';
import { useRosterQuery } from '../hooks/useRosterQuery';
import ChoicesEditor from './ChoicesEditor';
import CodeQuestionEditor from './CodeQuestionEditor';
import { LocalChoice, hasChoiceEditor, validateChoices } from './choiceUtils';
import MarkdownField from './MarkdownField';
import { typeMeta } from '../../core/questionMeta';

const { Text } = Typography;

const PROMPT_PRE_STYLE: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  background: '#fafafa',
  border: '1px solid #f0f0f0',
  borderRadius: 6,
  padding: 12,
  margin: 0,
  fontSize: 12,
  maxHeight: 360,
  overflow: 'auto',
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Queued', color: 'default' },
  generating: { label: 'Generating…', color: 'processing' },
  ready: { label: 'Needs review', color: 'gold' },
  approved: { label: 'Published', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
};

interface IProps {
  quiz: Quiz;
  courseId: number;
  /** Whether this view is the visible tab — gates all data fetching. */
  active: boolean;
  /** Show the admin-only actions: bulk "Publish all" and the generation controls
   *  (generate-for-student / generate-missing / regenerate) — those endpoints spend AI
   *  credits and reject non-admins, so grader-console embeds pass false (graders review,
   *  edit, and approve per set instead). Defaults to true (admin builder). */
  adminActions?: boolean;
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
  const fieldLabel = (label: string) => (
    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
      {label}
    </Text>
  );
  return (
    <Flex vertical gap={20} style={{ padding: '16px 20px', border: '1px solid #f0f0f0', borderRadius: 8 }}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Tag color={meta.color} style={{ margin: 0 }}>{meta.label}</Tag>
        <Space size={6}>
          <Text type="secondary" style={{ fontSize: 12 }}>Points</Text>
          <InputNumber min={0} step={1} value={points} disabled={!editable} aria-label="Points"
                       onChange={(v) => setPoints(v ?? 0)} size="small" style={{ width: 72 }} />
        </Space>
      </Flex>
      <div>
        {fieldLabel('Question')}
        <Input.TextArea
          aria-label="Question stem"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoSize={{ minRows: 2 }}
          disabled={!editable}
          placeholder="Question stem"
        />
      </div>
      <div>
        {fieldLabel('Description — shown beneath the question (Markdown, optional)')}
        <MarkdownField
          value={description}
          onChange={setDescription}
          courseId={courseId}
          minRows={2}
          ariaLabel="Question description"
          placeholder="Optional description shown beneath the stem…"
        />
      </div>
      {hasChoiceEditor(questionType) && (
        <div>
          {fieldLabel('Choices')}
          <ChoicesEditor questionType={questionType} value={choices} onChange={setChoices} />
        </div>
      )}
      {questionType === QuestionTypeEnum.Code && (
        <div>
          {fieldLabel('Starter code')}
          <CodeQuestionEditor
            value={starterCode}
            onChange={setStarterCode}
            language={question.language}
            readOnly={!editable}
          />
        </div>
      )}
      {editable && (
        <>
          <Divider style={{ margin: 0 }} />
          <Space>
            <CPButton cpType="primary" size="small" onClick={save} loading={saving} disabled={!dirty}>
              Save question
            </CPButton>
            <CPButton size="small" danger onClick={remove}>
              Remove
            </CPButton>
          </Space>
        </>
      )}
    </Flex>
  );
};

const GeneratedReviewPanel: React.FC<IProps> = ({ quiz, courseId, active, adminActions = true }) => {
  const queryClient = useQueryClient();
  const [currentId, setCurrentId] = React.useState<number | null>(null);

  const { data: sets = [], isLoading, error } = useGeneratedSets(active ? quiz.id : undefined);
  // Students with a submission but no set — shown on the Generate-missing button.
  const { data: backfillPreview } = useBackfillPreview(quiz.id, active && adminActions);
  const missingCount = backfillPreview?.missing ?? 0;
  // Submission-free quizzes generate eagerly for enrolled students; undefined (e.g. the
  // preview isn't fetched for graders) falls back to the submission-seeded copy.
  const needsSubmission = backfillPreview?.needsSubmission !== false;

  // Section filter: a grader picks their section and reviews only those students' sets.
  const [sectionId, setSectionId] = React.useState<number | null>(null);
  const { data: courseSections = [] } = useStaffSections(courseId, active);
  const sectionEmails = React.useMemo(() => {
    if (sectionId == null) return null;
    const section = courseSections.find((s) => s.id === sectionId);
    return section ? new Set((section.students ?? []).map(String)) : null;
  }, [sectionId, courseSections]);
  const visibleSets = sectionEmails
    ? sets.filter((s) => s.studentEmail && sectionEmails.has(s.studentEmail))
    : sets;
  const { data: current } = useGeneratedSetDetail(currentId ?? undefined);
  // Roster emails feed the generate-for-student picker (admin-only); if the viewer can't
  // read the roster (403) the field simply falls back to free typing.
  const { data: roster } = useRosterQuery(active && adminActions ? courseId : undefined);
  const [genEmail, setGenEmail] = React.useState('');

  // Focus management for the inline detail view swap (same pattern as QuizGradingView):
  // move focus into the detail heading when a set opens, and back to the list on close.
  // Keyed on set id so in-place refreshes (approve/regenerate) don't steal focus.
  const detailHeadingRef = React.useRef<HTMLSpanElement>(null);
  const listFocusRef = React.useRef<HTMLDivElement>(null);
  const prevDetailId = React.useRef<number | null>(null);
  React.useEffect(() => {
    const id = current?.id ?? null;
    if (id !== prevDetailId.current) {
      if (id != null) detailHeadingRef.current?.focus();
      else if (prevDetailId.current != null) listFocusRef.current?.focus();
    }
    prevDetailId.current = id;
  }, [current]);

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
  const failedCount = sets.filter((s) => s.status === 'failed').length;
  const generatingCount = sets.filter((s) => s.status === 'pending' || s.status === 'generating').length;
  const detailEditable = current?.status === 'ready' || current?.status === 'approved';

  // What's being reviewed, from the quiz's own sections: N questions per student.
  const sections = quiz.generatedSections ?? [];
  const questionsPerStudent = sections.reduce((sum, s) => sum + (s.numQuestions ?? 3), 0);

  // Shared by the Tooltip (sighted hover) and the icon's aria-label (screen readers /
  // keyboard focus) so the explanation isn't hover-only.
  const genHelp =
    `Each student gets their own set of ${questionsPerStudent} AI-generated question${
      questionsPerStudent === 1 ? '' : 's'
    }, produced ${needsSubmission ? 'from their submission ' : ''}by this quiz's ${
      sections.length === 1 ? 'AI section' : `${sections.length} AI sections`
    }. ${
      quiz.autoPublishGenerated
        ? 'Auto-publish is on for this quiz, so new sets are published without review — you can still edit, unapprove, or regenerate a set here.'
        : 'Approving a set publishes its questions and opens the quiz for that student — until then they see "Your quiz is being prepared." Sets marked "Needs review" are waiting on you.'
    }`;

  // The resolved per-section prompts recorded at generation time (older sets predate this
  // and fall back to showing the section templates).
  const genMeta = (current?.generationMetadata ?? null) as {
    provider?: string;
    model?: string;
    sections?: { sectionId?: number; sectionName?: string; prompt?: string }[];
  } | null;
  const promptSections = genMeta?.sections?.length ? genMeta.sections : null;

  return (
    <div ref={listFocusRef} tabIndex={-1} style={{ outline: 'none' }}>
      {/* Polite live region — announces generation progress as sets poll to completion. */}
      <div className="sr-only" aria-live="polite" data-testid="generation-status-live">
        {generatingCount > 0 ? `${generatingCount} generating. ` : ''}
        {`${readyCount} ready for review.`}
        {failedCount > 0 ? ` ${failedCount} failed.` : ''}
      </div>
      {error != null && (
        <Alert
          type="warning"
          showIcon
          title="You don't have access to review generated questions on this quiz."
          style={{ marginBottom: 12 }}
        />
      )}
      {!current && error == null && failedCount > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={`${failedCount} generation${failedCount === 1 ? '' : 's'} failed`}
          description="Open the set to see the error, then regenerate it."
        />
      )}
      {!current && error == null && (
        <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 12 }}>
          <Space wrap>
          <Tooltip styles={{ root: { maxWidth: 380 } }} title={genHelp}>
            <InfoCircleOutlined
              role="img"
              aria-label={genHelp}
              tabIndex={0}
              style={{ color: 'rgba(0, 0, 0, 0.45)', cursor: 'help' }}
            />
          </Tooltip>
          {courseSections.length > 0 && (
            <Select
              size="small"
              aria-label="Filter by section"
              style={{ minWidth: 160 }}
              value={sectionId ?? 'all'}
              onChange={(v) => setSectionId(v === 'all' ? null : Number(v))}
              options={[
                { value: 'all' as const, label: 'All sections' },
                ...courseSections.map((s) => ({ value: s.id, label: s.name })),
              ]}
              popupMatchSelectWidth={false}
              data-testid="review-section-filter"
            />
          )}
          {adminActions && (
            <>
              <AutoComplete
                style={{ width: 280 }}
                aria-label="Generate questions for a student by email"
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
              <Tooltip
                title={
                  needsSubmission
                    ? 'Generate for every student who has a submission but no question set yet (e.g. they submitted before this section existed).'
                    : 'Generate for every enrolled student who has no question set yet (e.g. they enrolled after the section was created).'
                }
              >
                <CPButton
                  loading={acting}
                  disabled={missingCount === 0}
                  onClick={generateMissing}
                  data-testid="generate-missing"
                >
                  Generate missing{missingCount > 0 ? ` (${missingCount})` : ''}
                </CPButton>
              </Tooltip>
            </>
          )}
          </Space>
          {adminActions && (
            <CPButton cpType="primary" disabled={readyCount === 0} loading={acting} onClick={publishAll}>
              Publish all ({readyCount})
            </CPButton>
          )}
        </Flex>
      )}
      {!current && (
        isLoading ? (
          <Spin />
        ) : visibleSets.length === 0 ? (
          <Empty
            description={
              sectionEmails
                ? 'No generated sets for students in this section.'
                : needsSubmission
                ? 'No generated sets yet — they appear when students submit the assignment.'
                : 'No generated sets yet — use Generate missing to create them for enrolled students.'
            }
          />
        ) : (
          <Table
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={visibleSets}
            pagination={false}
            data-testid="generated-sets-table"
          />
        )
      )}
      {current && (
        <Flex vertical gap={16}>
          <Flex align="center" gap={8}>
            <CPButton cpType="link" small icon={<LeftOutlined />} onClick={() => setCurrentId(null)}>
              All students
            </CPButton>
            <Text strong ref={detailHeadingRef} tabIndex={-1} style={{ outline: 'none' }}>
              Review — {current.studentEmail}
            </Text>
          </Flex>
          {current.status === 'failed' && (
            <Alert type="error" showIcon title="Generation failed"
                   description={current.errorMessage || 'Unknown error.'} />
          )}
          <Collapse
            size="small"
            items={[{
              key: 'prompt',
              label: 'Prompt used to generate these questions',
              children: (
                <Flex vertical gap={12}>
                  {promptSections ? (
                    promptSections.map((p, i) => (
                      <div key={p.sectionId ?? i}>
                        {promptSections.length > 1 && (
                          <Text strong style={{ display: 'block', marginBottom: 4 }}>
                            {p.sectionName || `AI section ${i + 1}`}
                          </Text>
                        )}
                        <pre style={PROMPT_PRE_STYLE}>{p.prompt}</pre>
                      </div>
                    ))
                  ) : (
                    <>
                      <Text type="secondary">
                        The exact prompt wasn&apos;t recorded for this set (it was generated before prompt
                        capture; regenerating records it). Below is the section&apos;s prompt template — its
                        variables are filled from this student&apos;s submission at generation time.
                      </Text>
                      {sections.map((s, i) => (
                        <div key={s.id}>
                          {sections.length > 1 && (
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>
                              {s.name || `AI section ${i + 1}`}
                            </Text>
                          )}
                          <pre style={PROMPT_PRE_STYLE}>{s.systemPrompt}</pre>
                        </div>
                      ))}
                    </>
                  )}
                  {genMeta?.model && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Generated by {genMeta.provider} · {genMeta.model}
                    </Text>
                  )}
                </Flex>
              ),
            }]}
          />
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
            {adminActions && current.submission != null && (
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
    </div>
  );
};

export default GeneratedReviewPanel;
