// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import {
  Alert,
  Badge,
  Button,
  Dropdown,
  Empty,
  Flex,
  InputNumber,
  Modal,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  RetweetOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { quizQuestionsApi, quizQuestionGroupsApi, quizGeneratedSectionsApi } from '../../../api-client/clients';
import { Course, Quiz, QuizGeneratedSection, QuizQuestion, QuizQuestionGroup } from '../../../api-client';
import { quizKeys } from '../../../lib/queryKeys';
import { useAssignmentsQuery } from '../hooks/useAssignmentsQuery';
import {
  useBackfillPreview, useCourseQuestions, useGeneratedSets, useQuizAttempts, useQuizMembership,
  useQuizDetail, useQuestionBanks,
} from './queries';
import { useCourseCapabilities } from '../../../stores/usePermissionsStore';
import { typeMeta } from '../../core/questionMeta';
import AddQuestionsModal from './AddQuestionsModal';
import GroupEditorModal from './GroupEditorModal';
import GeneratedSectionModal from './GeneratedSectionModal';
import GeneratedReviewPanel from './GeneratedReviewPanel';
import QuizPreviewDrawer, { PreviewItem } from './QuizPreviewDrawer';
import QuizGradingView from './QuizGradingView';
import QuizSettingsCard, { QuizSettingsDraft } from './QuizSettingsCard';
import PanelCard from './PanelCard';

const { Text } = Typography;

interface IProps {
  course: Course;
  quiz: Quiz;
}

// A unified row in the quiz-contents table: a fixed question, a random draw, or a
// per-student personalized (AI-generated) section.
type ContentRow =
  | { key: string; kind: 'question'; qq: QuizQuestion; position: number }
  | { key: string; kind: 'group'; group: QuizQuestionGroup }
  | { key: string; kind: 'aiSection'; section: QuizGeneratedSection };

// Per-row points override: commits on blur / Enter (not every keystroke) and
// disables while the PATCH is in flight. Needs its own component because a
// Table column `render` can't hold per-row hook state.
const PointsOverrideInput: React.FC<{
  base: number;
  value: number | null;
  onCommit: (v: number | null) => Promise<void>;
}> = ({ base, value, onCommit }) => {
  const [local, setLocal] = React.useState<number | null>(value ?? base);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLocal(value ?? base);
  }, [value, base]);

  const commit = async () => {
    const next = local == null ? null : Number(local);
    if ((next ?? null) === (value ?? null)) return;
    setSaving(true);
    try {
      await onCommit(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tooltip title={`Default: ${base}. Override for this quiz.`}>
      <InputNumber
        size="small"
        min={0}
        style={{ width: 72 }}
        value={local}
        disabled={saving}
        onChange={(v) => setLocal(v == null ? null : Number(v))}
        onBlur={commit}
        onPressEnter={commit}
      />
    </Tooltip>
  );
};

type BuilderTab = 'settings' | 'questions' | 'grading' | 'review';

const QuizBuilder: React.FC<IProps> = ({ course, quiz }) => {
  const queryClient = useQueryClient();
  const { data: liveQuiz } = useQuizDetail(quiz.id);
  const { data: membership = [], isLoading } = useQuizMembership(quiz.id);
  const { data: questions = [] } = useCourseQuestions(course.id);
  const { data: banks = [] } = useQuestionBanks(course.id);
  const { data: assignments = [] } = useAssignmentsQuery(course);

  const current = liveQuiz ?? quiz;
  const groups = React.useMemo(() => current.questionGroups ?? [], [current.questionGroups]);
  const sections = React.useMemo(() => current.generatedSections ?? [], [current.generatedSections]);

  const [addOpen, setAddOpen] = React.useState(false);
  const [groupOpen, setGroupOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<QuizQuestionGroup | null>(null);
  const [sectionOpen, setSectionOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<QuizGeneratedSection | null>(null);

  // Page-level tab. Controlled: the Grading/Review panes gate their queries on being the
  // active tab, and the Review tab's disappearance needs a fallback.
  const [activeTab, setActiveTab] = React.useState<BuilderTab>('settings');
  // The Review tab exists only while the quiz has AI sections; if the last one is
  // removed while it's active, fall back to Questions.
  React.useEffect(() => {
    if (activeTab === 'review' && sections.length === 0) setActiveTab('questions');
  }, [activeTab, sections.length]);

  // --- Quiz settings draft (sparse; QuizSettingsCard owns normalization/dirty/save) ---
  const [settingsDraft, setSettingsDraft] = React.useState<QuizSettingsDraft>({});
  // Reset when switching quizzes. (Keyed on id so an unrelated detail refetch doesn't
  // clobber in-progress edits.)
  React.useEffect(() => setSettingsDraft({}), [current.id]);
  const patchSettings = React.useCallback((p: QuizSettingsDraft) => setSettingsDraft((d) => ({ ...d, ...p })), []);
  // The Add menu's AI item gates on the draft attachment (matches the settings card).
  const draftAssignment = settingsDraft.assignment !== undefined ? settingsDraft.assignment : current.assignment ?? null;

  // --- Question membership ---
  const questionsById = React.useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const bankNameById = React.useMemo(() => new Map(banks.map((b) => [b.id, b.name])), [banks]);
  const orderedQuestions = React.useMemo(
    () => [...membership].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)),
    [membership],
  );
  const orderedGroups = React.useMemo(() => [...groups].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)), [groups]);

  const invalidateMembership = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.membership(quiz.id!) });
    queryClient.invalidateQueries({ queryKey: quizKeys.list(course.id!) });
  };
  const invalidateGroups = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.detail(quiz.id!) });
    queryClient.invalidateQueries({ queryKey: quizKeys.list(course.id!) });
  };

  const handleMove = async (position: number, dir: -1 | 1) => {
    const target = position + dir;
    if (target < 0 || target >= orderedQuestions.length) return;
    const a = orderedQuestions[position];
    const b = orderedQuestions[target];
    try {
      await Promise.all([
        quizQuestionsApi.partialUpdate({ id: a.id!, patchedQuizQuestion: { sortKey: b.sortKey ?? target } }),
        quizQuestionsApi.partialUpdate({ id: b.id!, patchedQuizQuestion: { sortKey: a.sortKey ?? position } }),
      ]);
      invalidateMembership();
    } catch {
      message.error('Failed to reorder.');
    }
  };

  const handleRemoveQuestion = (qq: QuizQuestion) => {
    Modal.confirm({
      title: 'Remove this question from the quiz?',
      content: 'The question stays in its bank — only its membership in this quiz is removed.',
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await quizQuestionsApi.destroy({ id: qq.id! });
          message.success('Removed from quiz.');
          invalidateMembership();
        } catch {
          message.error('Failed to remove question.');
        }
      },
    });
  };

  const handlePointsOverride = async (qq: QuizQuestion, value: number | null) => {
    try {
      await quizQuestionsApi.partialUpdate({ id: qq.id!, patchedQuizQuestion: { pointsOverride: value } });
      invalidateMembership();
    } catch {
      message.error('Failed to update points.');
    }
  };

  // --- Random draws ---
  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupOpen(true);
  };
  const openEditGroup = (g: QuizQuestionGroup) => {
    setEditingGroup(g);
    setGroupOpen(true);
  };
  const handleDeleteGroup = (g: QuizQuestionGroup) => {
    Modal.confirm({
      title: 'Remove this random draw?',
      content: 'The bank and its questions are unaffected — only this draw is removed from the quiz.',
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await quizQuestionGroupsApi.destroy({ id: g.id! });
          message.success('Random draw removed.');
          invalidateGroups();
        } catch {
          message.error('Failed to remove the random draw.');
        }
      },
    });
  };

  // --- Personalized (per-student generated) sections ---
  const orderedSections = React.useMemo(
    () => [...sections].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)),
    [sections],
  );
  // Review badge (only fetched once sections exist; graders without the review flag get
  // a 403, which simply hides the count).
  const { data: generatedSets = [] } = useGeneratedSets(orderedSections.length > 0 ? quiz.id : undefined);
  const readyCount = generatedSets.filter((s) => s.status === 'ready').length;
  // Needs-grading badge; shares the grading drawer's query key so grading refreshes it.
  // Quiz graders / admins only — a 403 for plain staff simply hides the count.
  const { data: pendingAttempts = [] } = useQuizAttempts(quiz.id, { needsGrading: true });
  const needsGradingCount = pendingAttempts.length;
  // Missing generated sets, surfaced on every tab (banner + red Review badge) — instructors
  // shouldn't have to open the Review tab to learn students are blocked from the quiz.
  // Shares the Review panel's query key, so Generate-missing refreshes it everywhere.
  const { data: builderBackfill } = useBackfillPreview(quiz.id, orderedSections.length > 0);
  const missingSetsCount = builderBackfill?.missing ?? 0;
  // The authoring surface only shows when the course's AI feature is on (the
  // generate_personalized_quiz_questions capability); existing sections stay
  // manageable (with a warning) so they can be cleaned up after a course turns
  // it off.
  const courseCaps = useCourseCapabilities(course.id);
  const aiQuizEnabled = courseCaps.generate_personalized_quiz_questions === true;

  const openCreateSection = () => {
    setEditingSection(null);
    setSectionOpen(true);
  };
  const openEditSection = (s: QuizGeneratedSection) => {
    setEditingSection(s);
    setSectionOpen(true);
  };
  const handleDeleteSection = (s: QuizGeneratedSection) => {
    Modal.confirm({
      title: 'Remove this AI-generated section?',
      content: "Every student's generated questions for this section are deleted too. "
        + 'Attempts already taken are unaffected.',
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await quizGeneratedSectionsApi.destroy({ id: s.id! });
          message.success('AI-generated section removed.');
          invalidateGroups();
        } catch {
          message.error('Failed to remove the section.');
        }
      },
    });
  };

  // --- Unified quiz-contents rows: questions, then random draws, then personalized ---
  const rows: ContentRow[] = [
    ...orderedQuestions.map((qq, i) => ({ key: `q-${qq.id}`, kind: 'question' as const, qq, position: i })),
    ...orderedGroups.map((g) => ({ key: `g-${g.id}`, kind: 'group' as const, group: g })),
    ...orderedSections.map((s) => ({ key: `s-${s.id}`, kind: 'aiSection' as const, section: s })),
  ];

  const columns = [
    {
      title: '#',
      key: 'order',
      width: 48,
      render: (_: unknown, row: ContentRow) => {
        if (row.kind === 'question') return row.position + 1;
        // Decorative — the adjacent "Type" column carries this as text.
        if (row.kind === 'aiSection') return <RobotOutlined aria-hidden style={{ color: '#722ed1' }} />;
        return <RetweetOutlined aria-hidden style={{ color: '#198665' }} />;
      },
    },
    {
      title: 'Type',
      key: 'type',
      width: 140,
      render: (_: unknown, row: ContentRow) => {
        if (row.kind === 'group') return <Tag color="green">Random draw</Tag>;
        if (row.kind === 'aiSection') return <Tag color="purple">AI generated</Tag>;
        const meta = typeMeta(questionsById.get(row.qq.question)?.questionType);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Content',
      key: 'content',
      render: (_: unknown, row: ContentRow) => {
        if (row.kind === 'group') {
          const g = row.group;
          return (
            <Text>
              {g.name ? `${g.name} — ` : ''}
              Draw <b>{g.pickCount ?? 1}</b> random from <b>{bankNameById.get(g.bank) ?? `bank #${g.bank}`}</b>
            </Text>
          );
        }
        if (row.kind === 'aiSection') {
          const s = row.section;
          const fromSubmission = /\{submission_/.test(s.systemPrompt ?? '');
          return (
            <Text>
              {s.name ? `${s.name} — ` : ''}
              Generate <b>{s.numQuestions ?? 3}</b> per student
              {fromSubmission ? ' from their submission' : ' from your prompt'}
            </Text>
          );
        }
        const q = questionsById.get(row.qq.question);
        const text = q?.text ?? `Question #${row.qq.question}`;
        return <Text>{text.length > 90 ? `${text.slice(0, 90)}…` : text}</Text>;
      },
    },
    {
      title: 'Points',
      key: 'points',
      width: 110,
      render: (_: unknown, row: ContentRow) => {
        if (row.kind === 'group') {
          const g = row.group;
          return (
            <Text type="secondary">
              {g.pickCount ?? 1} × {g.pointsPerQuestion ?? 1}
            </Text>
          );
        }
        if (row.kind === 'aiSection') {
          const s = row.section;
          return (
            <Text type="secondary">
              {s.numQuestions ?? 3} × {s.pointsPerQuestion ?? 1}
            </Text>
          );
        }
        const base = questionsById.get(row.qq.question)?.points;
        return (
          <PointsOverrideInput
            base={base ?? 1}
            value={row.qq.pointsOverride ?? null}
            onCommit={(v) => handlePointsOverride(row.qq, v)}
          />
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, row: ContentRow) => {
        if (row.kind === 'group') {
          return (
            <Space.Compact size="small">
              <Button
                size="small"
                aria-label="Edit random draw"
                title="Edit random draw"
                icon={<EditOutlined />}
                onClick={() => openEditGroup(row.group)}
              />
              <Button
                size="small"
                danger
                aria-label="Remove random draw"
                title="Remove random draw"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteGroup(row.group)}
              />
            </Space.Compact>
          );
        }
        if (row.kind === 'aiSection') {
          return (
            <Space.Compact size="small">
              <Button
                size="small"
                aria-label="Edit AI-generated section"
                title="Edit AI-generated section"
                icon={<EditOutlined />}
                onClick={() => openEditSection(row.section)}
              />
              <Button
                size="small"
                danger
                aria-label="Remove AI-generated section"
                title="Remove AI-generated section"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteSection(row.section)}
              />
            </Space.Compact>
          );
        }
        return (
          <Space.Compact size="small">
            <Button
              size="small"
              aria-label="Move up"
              title="Move up"
              icon={<ArrowUpOutlined />}
              disabled={row.position === 0}
              onClick={() => handleMove(row.position, -1)}
            />
            <Button
              size="small"
              aria-label="Move down"
              title="Move down"
              icon={<ArrowDownOutlined />}
              disabled={row.position === orderedQuestions.length - 1}
              onClick={() => handleMove(row.position, 1)}
            />
            <Button
              size="small"
              danger
              aria-label="Remove from quiz"
              title="Remove from quiz"
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveQuestion(row.qq)}
            />
          </Space.Compact>
        );
      },
    },
  ];

  const assignmentOptions = assignments.map((a) => ({ value: a.id, label: a.name }));
  const totalItems = orderedQuestions.length + orderedGroups.length + orderedSections.length;

  // Fixed questions, plus a simulated sample for each random draw. Memoized so the
  // random selection stays stable while the instructor interacts with the preview.
  const previewItems: PreviewItem[] = React.useMemo(() => {
    const fixed: PreviewItem[] = orderedQuestions
      .map((qq) => {
        const q = questionsById.get(qq.question);
        return q ? { question: q, points: Number(qq.pointsOverride ?? q.points ?? 1) } : null;
      })
      .filter((x): x is PreviewItem => x !== null);

    const drawn: PreviewItem[] = orderedGroups.flatMap((g) => {
      const pool = questions.filter((q) => q.bank === g.bank);
      const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, g.pickCount ?? 1);
      return picked.map((q) => ({ question: q, points: Number(g.pointsPerQuestion ?? 1) }));
    });

    return [...fixed, ...drawn];
  }, [orderedQuestions, orderedGroups, questionsById, questions]);

  // Quiz contents: fixed questions + random draws, unified.
  const questionsCard = (
    <PanelCard
        title={
          <Flex align="center" gap={8} wrap style={{ minWidth: 0, rowGap: 4 }}>
            <Typography.Title level={2} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Questions
            </Typography.Title>
            {orderedQuestions.length > 0 && (
              <Tag color="blue">{orderedQuestions.length} fixed</Tag>
            )}
            {orderedGroups.length > 0 && (
              <Tag color="green">
                {orderedGroups.length} random {orderedGroups.length === 1 ? 'draw' : 'draws'}
              </Tag>
            )}
            {orderedSections.length > 0 && (
              <Tag color="purple">
                {orderedSections.length} AI generated
              </Tag>
            )}
          </Flex>
        }
        extra={
          <Space>
            <Tooltip title={previewItems.length === 0 ? 'Add questions to preview' : 'Preview as a student'}>
              <CPButton
                cpType="link"
                icon={<EyeOutlined />}
                onClick={() => setPreviewOpen(true)}
                disabled={previewItems.length === 0}
              >
                Preview
              </CPButton>
            </Tooltip>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'questions', icon: <PlusOutlined />, label: 'Questions from a bank…' },
                  { key: 'group', icon: <RetweetOutlined />, label: 'Random draw…' },
                  ...(aiQuizEnabled
                    ? [{
                        key: 'ai',
                        icon: <RobotOutlined />,
                        // Standalone quizzes can generate too, as long as the prompt
                        // doesn't reference assignment/submission data (validated on save).
                        label: 'AI-generated questions…',
                      }]
                    : []),
                ],
                onClick: ({ key }) => {
                  if (key === 'questions') setAddOpen(true);
                  else if (key === 'group') openCreateGroup();
                  else if (key === 'ai') openCreateSection();
                },
              }}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Add <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>
          </Space>
        }
        styles={{ body: { padding: totalItems === 0 ? undefined : 0 } }}
      >
        {orderedSections.length > 0 && !aiQuizEnabled && (
          <Alert
            type="warning"
            showIcon
            style={{ margin: 12 }}
            title="AI quiz question generation is disabled for this course"
            description="This quiz has AI-generated sections, but new submissions won't generate
              questions while the feature is off — students without an approved set can't open the
              quiz. Re-enable the 'AI-Generated Quiz Questions' feature in the course's AI settings,
              or remove the sections."
          />
        )}
        {isLoading ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : totalItems === 0 ? (
          <Empty
            description="Nothing in this quiz yet — add questions or a random draw from a bank"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 24 }}
          />
        ) : (
          <Table dataSource={rows} columns={columns} rowKey="key" size="small" pagination={false} />
        )}
      </PanelCard>
  );

  return (
    <>
      {/* Visible on every tab: students without a generated set can't open the quiz, so
          this must not hide inside the Review tab. */}
      {missingSetsCount > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          title={`${missingSetsCount} student${missingSetsCount === 1 ? ' is' : 's are'} missing generated questions`}
          description="They can't open this quiz until a question set is generated and approved for them."
          action={
            <CPButton small onClick={() => setActiveTab('review')} data-testid="missing-sets-review">
              Go to Review
            </CPButton>
          }
          data-testid="missing-sets-alert"
        />
      )}
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as BuilderTab)}
        items={[
          {
            key: 'settings',
            label: 'Settings',
            children: (
              <QuizSettingsCard
                courseId={course.id!}
                quiz={current}
                assignmentOptions={assignmentOptions}
                hasGeneratedSections={orderedSections.length > 0}
                draft={settingsDraft}
                onDraftChange={patchSettings}
              />
            ),
          },
          { key: 'questions', label: 'Questions', children: questionsCard },
          {
            key: 'grading',
            label: `Grading${needsGradingCount > 0 ? ` (${needsGradingCount})` : ''}`,
            children: <QuizGradingView quiz={current} active={activeTab === 'grading'} />,
          },
          ...(orderedSections.length > 0
            ? [{
                key: 'review',
                // The gold count flags sets awaiting review — those students' quizzes stay
                // closed until approved.
                label: (
                  <Space size={6}>
                    Review
                    {/* Darker amber (#996800 ≈ 4.9:1 with the Badge's white count) — antd
                        gold #faad14 gives only ~1.8:1. */}
                    <Badge count={readyCount} style={{ backgroundColor: '#996800' }} title={`${readyCount} sets awaiting review`} />
                    {/* Red = students with no set at all (they can't open the quiz). */}
                    <Badge count={missingSetsCount} title={`${missingSetsCount} students missing generated questions`} />
                  </Space>
                ),
                children: (
                  <GeneratedReviewPanel quiz={current} courseId={course.id!} active={activeTab === 'review'} />
                ),
              }]
            : []),
        ]}
      />

      <AddQuestionsModal
        open={addOpen}
        courseId={course.id!}
        quizId={quiz.id!}
        existingQuestionIds={orderedQuestions.map((m) => m.question)}
        nextSortKey={orderedQuestions.length ? Math.max(...orderedQuestions.map((m) => m.sortKey ?? 0)) + 1 : 0}
        onClose={() => setAddOpen(false)}
      />

      <GroupEditorModal
        open={groupOpen}
        courseId={course.id!}
        quizId={quiz.id!}
        group={editingGroup}
        nextSortKey={orderedGroups.length ? Math.max(...orderedGroups.map((g) => g.sortKey ?? 0)) + 1 : 0}
        onClose={() => setGroupOpen(false)}
      />

      <QuizPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        quiz={current}
        items={previewItems}
        hasGroups={orderedGroups.length > 0}
      />

      <GeneratedSectionModal
        open={sectionOpen}
        courseId={course.id!}
        quizId={quiz.id!}
        attached={draftAssignment != null}
        manualGeneration={settingsDraft.manualGeneration ?? current.manualGeneration ?? true}
        section={editingSection}
        nextSortKey={orderedSections.length ? Math.max(...orderedSections.map((s) => s.sortKey ?? 0)) + 1 : 0}
        onClose={() => setSectionOpen(false)}
      />

    </>
  );
};

export default QuizBuilder;
