// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Input,
  InputNumber,
  message,
  Modal,
  Progress,
  Row,
  Select,
  Slider,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CopyOutlined,
  ExperimentOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  ReloadOutlined,
  RobotOutlined,
  BranchesOutlined,
  NodeIndexOutlined,
  SettingOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  PromptLabService,
  type BehavioralMetrics,
  type ExperimentResults,
  type ExperimentStatus,
  type PromptExperiment,
  type PromptLabSettingsData,
  type PromptType,
  type PromptTypeEntry,
  type PromptVariant,
  type VariantBehavioralStats,
  type VariantStats,
  type VariantStatus,
} from '../../services/promptLab';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ─── Constants ────────────────────────────────────────────────────────────────

// Prompt types are fetched dynamically from the API — see usePromptTypes() below.
// This is the fallback used until the API responds.
const FALLBACK_PROMPT_TYPES: { value: PromptType; label: string; description: string }[] = [
  { value: 'comment_generation', label: 'Comment Generation', description: 'Inline code comments' },
  { value: 'suggested_comments', label: 'Suggested Comments', description: 'File-level AI feedback' },
  { value: 'submission_summary', label: 'Submission Summary', description: 'Submission overviews' },
  { value: 'test_generation', label: 'Test Generation', description: 'Auto-generated tests' },
  { value: 'assignment_description', label: 'Assignment Description', description: 'Assignment analysis' },
];

const STATUS_COLORS: Record<VariantStatus, string> = {
  active: 'green',
  draft: 'blue',
  candidate: 'orange',
  retired: 'default',
};

const EXPERIMENT_STATUS_COLORS: Record<ExperimentStatus, string> = {
  running: 'green',
  paused: 'orange',
  completed: 'default',
};

// Models available per provider for auto-improvement
const AI_PROVIDER_MODELS: Record<string, { value: string; label: string }[]> = {
  gemini: [
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)' },
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'o3-mini', label: 'o3 Mini' },
  ],
};

// ─── Tree helpers ─────────────────────────────────────────────────────────────

interface VariantTreeNode extends PromptVariant {
  children: VariantTreeNode[];
  depth: number;
}

/** Build a forest of variant trees grouped by prompt type. */
function buildVariantForest(variants: PromptVariant[]): Map<PromptType, VariantTreeNode[]> {
  const byType = new Map<PromptType, PromptVariant[]>();
  for (const v of variants) {
    const arr = byType.get(v.promptType) ?? [];
    arr.push(v);
    byType.set(v.promptType, arr);
  }

  const result = new Map<PromptType, VariantTreeNode[]>();
  for (const [type, typeVariants] of byType) {
    const nodeMap = new Map<number, VariantTreeNode>();
    // Create nodes
    for (const v of typeVariants) {
      nodeMap.set(v.id, { ...v, children: [], depth: 0 });
    }
    // Link parent → child
    const roots: VariantTreeNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.parent && nodeMap.has(node.parent)) {
        nodeMap.get(node.parent)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    // Sort roots and children by version descending
    const sortNodes = (nodes: VariantTreeNode[], depth: number) => {
      nodes.sort((a, b) => a.version - b.version);
      for (const n of nodes) {
        n.depth = depth;
        sortNodes(n.children, depth + 1);
      }
    };
    sortNodes(roots, 0);
    result.set(type, roots);
  }
  return result;
}

/** Flatten a tree into an ordered list with depth info for rendering. */
function flattenTree(roots: VariantTreeNode[]): VariantTreeNode[] {
  const result: VariantTreeNode[] = [];
  const walk = (nodes: VariantTreeNode[]) => {
    for (const n of nodes) {
      result.push(n);
      walk(n.children);
    }
  };
  walk(roots);
  return result;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PromptLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'variants' | 'experiments'>('variants');
  const [variants, setVariants] = useState<PromptVariant[]>([]);
  const [experiments, setExperiments] = useState<PromptExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<PromptType | ''>('');

  // Variant editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Partial<PromptVariant> | null>(null);
  const [saving, setSaving] = useState(false);

  // Experiment creator state
  const [experimentCreatorOpen, setExperimentCreatorOpen] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    promptType: '' as PromptType | '',
    variantA: 0,
    variantB: 0,
    sampleRate: 0.1,
  });

  // Results drawer
  const [resultsDrawer, setResultsDrawer] = useState<{
    open: boolean;
    experiment: PromptExperiment | null;
    results: ExperimentResults | null;
    pool: 'all' | 'default' | 'custom';
    loading: boolean;
  }>({ open: false, experiment: null, results: null, pool: 'all', loading: false });

  // Auto-improve state
  const [improving, setImproving] = useState<PromptType | null>(null);

  // Selected variant for detail panel
  const [selectedVariant, setSelectedVariant] = useState<PromptVariant | null>(null);
  const [variantStats, setVariantStats] = useState<VariantStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Settings state
  const [labSettings, setLabSettings] = useState<PromptLabSettingsData | null>(null);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Separate state for the API key input (never returned from the server)
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Dynamic prompt types — fetched from API, falling back to hardcoded list.
  const [promptTypesRaw, setPromptTypesRaw] = useState<PromptTypeEntry[] | null>(null);
  const PROMPT_TYPES = useMemo(
    () =>
      (
        promptTypesRaw ??
        FALLBACK_PROMPT_TYPES.map((p) => ({ key: p.value, label: p.label, description: p.description }))
      ).map((p) => ({ value: p.key, label: p.label, description: p.description })),
    [promptTypesRaw],
  );

  // Build variant trees
  const variantForest = useMemo(() => buildVariantForest(variants), [variants]);

  // ─── Data fetching ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterType ? { promptType: filterType as PromptType } : undefined;
      const [v, e, s, pt] = await Promise.all([
        PromptLabService.listVariants(params),
        PromptLabService.listExperiments(params),
        PromptLabService.getSettings(),
        PromptLabService.listPromptTypes().catch(() => null),
      ]);
      setVariants(v);
      setExperiments(e);
      setLabSettings(s);
      if (pt) setPromptTypesRaw(pt);
    } catch {
      message.error('Failed to load Prompt Lab data');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lazy-load stats when a variant is selected
  const selectedVariantId = selectedVariant?.id ?? null;
  useEffect(() => {
    if (selectedVariantId == null) {
      setVariantStats(null);
      return;
    }
    let cancelled = false;
    setStatsLoading(true);
    setVariantStats(null);
    PromptLabService.getVariantStats(selectedVariantId)
      .then((stats) => {
        if (!cancelled) setVariantStats(stats);
      })
      .catch(() => {
        // Silently ignore — stats are supplementary
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedVariantId]);

  // ─── Variant actions ──────────────────────────────────────────────────────────

  const handleCreateVariant = () => {
    setEditingVariant({
      promptType: (filterType as PromptType) || 'comment_generation',
      name: '',
      text: '',
      status: 'draft',
      metadata: {},
    });
    setEditorOpen(true);
  };

  const handleEditVariant = (variant: PromptVariant) => {
    if (variant.status === 'active') {
      message.warning('Clone the active variant to edit it.');
      return;
    }
    setEditingVariant({ ...variant });
    setEditorOpen(true);
  };

  const handleSaveVariant = async () => {
    if (!editingVariant) return;
    setSaving(true);
    try {
      if (editingVariant.id) {
        await PromptLabService.updateVariant(editingVariant.id, editingVariant);
      } else {
        await PromptLabService.createVariant(editingVariant);
      }
      message.success('Variant saved');
      setEditorOpen(false);
      setEditingVariant(null);
      fetchData();
    } catch {
      message.error('Failed to save variant');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (variant: PromptVariant) => {
    Modal.confirm({
      title: 'Activate Variant',
      content: (
        <span>
          This will make <strong>{variant.name}</strong> the active prompt for{' '}
          <Tag color="blue">{variant.promptType}</Tag>
          and retire the current active variant.
        </span>
      ),
      okText: 'Activate',
      okType: 'primary',
      onOk: async () => {
        try {
          await PromptLabService.activateVariant(variant.id);
          message.success(`"${variant.name}" is now active`);
          fetchData();
        } catch {
          message.error('Failed to activate variant');
        }
      },
    });
  };

  const handleClone = async (variant: PromptVariant) => {
    try {
      const clone = await PromptLabService.cloneVariant(variant.id);
      message.success(`Cloned as "${clone.name}"`);
      fetchData();
    } catch {
      message.error('Failed to clone variant');
    }
  };

  const handleDeleteVariant = async (variant: PromptVariant) => {
    if (variant.status === 'active') {
      message.error('Cannot delete an active variant');
      return;
    }
    Modal.confirm({
      title: 'Delete Variant',
      content: `Permanently delete "${variant.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await PromptLabService.deleteVariant(variant.id);
          message.success('Variant deleted');
          if (selectedVariant?.id === variant.id) setSelectedVariant(null);
          fetchData();
        } catch {
          message.error('Failed to delete variant');
        }
      },
    });
  };

  const handleAutoImprove = async (promptType: PromptType) => {
    setImproving(promptType);
    try {
      const newVariant = await PromptLabService.autoImprove(promptType);
      message.success(`Auto-improved variant "${newVariant.name}" created as draft`);
      fetchData();
      setSelectedVariant(newVariant);
    } catch (err: unknown) {
      const detail = (err as { body?: { detail?: string } })?.body?.detail;
      message.error(detail ?? 'Auto-improvement failed');
    } finally {
      setImproving(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!labSettings) return;
    setSavingSettings(true);
    try {
      const payload: Record<string, unknown> = { ...labSettings };
      if (apiKeyInput) {
        payload.aiApiKey = apiKeyInput;
      }
      const updated = await PromptLabService.updateSettings(payload as Partial<PromptLabSettingsData>);
      setLabSettings(updated);
      setApiKeyInput('');
      message.success('Settings saved');
    } catch {
      message.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── Experiment actions ───────────────────────────────────────────────────────

  const handleCreateExperiment = async () => {
    if (!newExperiment.name || !newExperiment.promptType || !newExperiment.variantA || !newExperiment.variantB) {
      message.warning('Fill in all required fields');
      return;
    }
    try {
      await PromptLabService.createExperiment({
        name: newExperiment.name,
        promptType: newExperiment.promptType as PromptType,
        variantA: newExperiment.variantA,
        variantB: newExperiment.variantB,
        sampleRate: newExperiment.sampleRate,
      });
      message.success('Experiment created');
      setExperimentCreatorOpen(false);
      setNewExperiment({ name: '', promptType: '', variantA: 0, variantB: 0, sampleRate: 0.1 });
      fetchData();
    } catch {
      message.error('Failed to create experiment');
    }
  };

  const handleExperimentAction = async (experiment: PromptExperiment, action: 'resume' | 'pause' | 'complete') => {
    try {
      if (action === 'resume') {
        await PromptLabService.resumeExperiment(experiment.id);
        message.success('Experiment resumed');
      } else if (action === 'pause') {
        await PromptLabService.pauseExperiment(experiment.id);
        message.success('Experiment paused');
      } else {
        await PromptLabService.completeExperiment(experiment.id);
        message.success('Experiment completed');
      }
      fetchData();
    } catch {
      message.error(`Failed to ${action} experiment`);
    }
  };

  const handlePromoteWinner = async (experiment: PromptExperiment) => {
    Modal.confirm({
      title: 'Complete & Promote Winner',
      content: 'This will complete the experiment and activate the winning variant based on feedback data.',
      okText: 'Promote Winner',
      okType: 'primary',
      onOk: async () => {
        try {
          await PromptLabService.completeExperiment(experiment.id, true);
          message.success('Winner promoted and experiment completed');
          fetchData();
        } catch {
          message.error('Failed to promote winner');
        }
      },
    });
  };

  const openResults = async (experiment: PromptExperiment, pool: 'all' | 'default' | 'custom' = 'all') => {
    setResultsDrawer({ open: true, experiment, results: null, pool, loading: true });
    try {
      const results = await PromptLabService.getExperimentResults(experiment.id, pool);
      setResultsDrawer((prev) => ({ ...prev, results, loading: false }));
    } catch {
      message.error('Failed to load results');
      setResultsDrawer((prev) => ({ ...prev, loading: false }));
    }
  };

  const handlePoolChange = async (pool: 'all' | 'default' | 'custom') => {
    if (!resultsDrawer.experiment) return;
    setResultsDrawer((prev) => ({ ...prev, pool, loading: true }));
    try {
      const results = await PromptLabService.getExperimentResults(resultsDrawer.experiment!.id, pool);
      setResultsDrawer((prev) => ({ ...prev, results, loading: false }));
    } catch {
      message.error('Failed to load results');
      setResultsDrawer((prev) => ({ ...prev, loading: false }));
    }
  };

  // ─── Experiment columns ───────────────────────────────────────────────────────

  const experimentColumns = [
    {
      title: 'Experiment',
      key: 'name',
      render: (_: unknown, record: PromptExperiment) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {record.name}
          </Text>
          <br />
          <Space size={4} style={{ marginTop: 2 }}>
            <Tag style={{ fontSize: 10 }}>{PROMPT_TYPES.find((p) => p.value === record.promptType)?.label}</Tag>
            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
              {(record.sampleRate * 100).toFixed(0)}% sample
            </Text>
          </Space>
        </div>
      ),
    },
    {
      title: 'Variant A',
      key: 'variantA',
      width: 160,
      render: (_: unknown, record: PromptExperiment) => (
        <Space size={4}>
          <Badge
            color="#6366f1"
            text={<Text style={{ fontSize: 12 }}>{record.variantADetail?.name ?? `#${record.variantA}`}</Text>}
          />
        </Space>
      ),
    },
    {
      title: 'Variant B',
      key: 'variantB',
      width: 160,
      render: (_: unknown, record: PromptExperiment) => (
        <Space size={4}>
          <Badge
            color="#f59e0b"
            text={<Text style={{ fontSize: 12 }}>{record.variantBDetail?.name ?? `#${record.variantB}`}</Text>}
          />
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ExperimentStatus) => <Tag color={EXPERIMENT_STATUS_COLORS[status]}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      render: (_: unknown, record: PromptExperiment) => (
        <Space size={4}>
          {record.status === 'paused' && (
            <Tooltip title="Start">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleExperimentAction(record, 'resume')}
              />
            </Tooltip>
          )}
          {record.status === 'running' && (
            <Tooltip title="Pause">
              <Button
                type="text"
                size="small"
                icon={<PauseCircleOutlined style={{ color: '#faad14' }} />}
                onClick={() => handleExperimentAction(record, 'pause')}
              />
            </Tooltip>
          )}
          {record.status !== 'completed' && (
            <>
              <Tooltip title="Complete">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleExperimentAction(record, 'complete')}
                />
              </Tooltip>
              <Tooltip title="Complete & promote winner">
                <Button
                  type="text"
                  size="small"
                  icon={<TrophyOutlined style={{ color: '#faad14' }} />}
                  onClick={() => handlePromoteWinner(record)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="View results">
            <Button type="link" size="small" onClick={() => openResults(record)}>
              Results
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────────

  const variantsForExperimentSelect = variants.filter(
    (v) =>
      (v.status === 'active' || v.status === 'candidate' || v.status === 'draft') &&
      (!newExperiment.promptType || v.promptType === newExperiment.promptType),
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            <ExperimentOutlined style={{ marginRight: 10, color: '#6366f1' }} />
            Prompt Lab
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Manage AI system prompts and run A/B experiments
          </Text>
        </div>
        <Space>
          <Select
            placeholder="Filter by type"
            allowClear
            style={{ width: 200 }}
            value={filterType || undefined}
            onChange={(val) => setFilterType(val ?? '')}
            options={PROMPT_TYPES.map((p) => ({ value: p.value, label: p.label }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            Refresh
          </Button>
          <Tooltip title="Auto-improvement settings">
            <Button icon={<SettingOutlined />} onClick={() => setSettingsDrawerOpen(true)} />
          </Tooltip>
          {labSettings && (
            <Tag color={labSettings.autoImproveEnabled ? 'green' : 'default'} style={{ margin: 0 }}>
              Auto: {labSettings.autoImproveEnabled ? 'ON' : 'OFF'}
            </Tag>
          )}
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'variants' | 'experiments')}
        tabBarExtraContent={
          activeTab === 'variants' ? (
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateVariant}>
                New Variant
              </Button>
            </Space>
          ) : (
            <Button type="primary" icon={<ExperimentOutlined />} onClick={() => setExperimentCreatorOpen(true)}>
              New Experiment
            </Button>
          )
        }
        items={[
          {
            key: 'variants',
            label: (
              <span>
                <BranchesOutlined style={{ marginRight: 4 }} />
                Prompt Variants{' '}
                <Badge count={variants.length} showZero style={{ backgroundColor: '#6366f1', marginLeft: 6 }} />
              </span>
            ),
            children: loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : (
              <Row gutter={16}>
                {/* Left: Tree view */}
                <Col span={selectedVariant ? 14 : 24}>
                  {Array.from(variantForest.entries()).length === 0 ? (
                    <Card>
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        <Text type="secondary">No prompt variants yet. Create one to get started.</Text>
                      </div>
                    </Card>
                  ) : (
                    Array.from(variantForest.entries()).map(([type, roots]) => {
                      const typeInfo = PROMPT_TYPES.find((p) => p.value === type);
                      const flat = flattenTree(roots);
                      const activeNode = flat.find((n) => n.status === 'active');
                      return (
                        <Card
                          key={type}
                          size="small"
                          title={
                            <Space>
                              <NodeIndexOutlined style={{ color: '#6366f1' }} />
                              <Text strong>{typeInfo?.label ?? type}</Text>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                ({flat.length} variant{flat.length !== 1 ? 's' : ''})
                              </Text>
                              {activeNode && (
                                <Tag color="green" style={{ fontSize: 10 }}>
                                  Active: {activeNode.name}
                                </Tag>
                              )}
                            </Space>
                          }
                          extra={
                            <Tooltip title="Auto-improve: generate a new variant from feedback">
                              <Button
                                size="small"
                                icon={<RobotOutlined />}
                                loading={improving === type}
                                onClick={() => handleAutoImprove(type)}
                              >
                                Auto-Improve
                              </Button>
                            </Tooltip>
                          }
                          style={{ marginBottom: 12 }}
                        >
                          <div style={{ position: 'relative' }}>
                            {flat.map((node, idx) => {
                              const isSelected = selectedVariant?.id === node.id;
                              const isAutoGen = !!node.metadata?.auto_generated;
                              return (
                                <div
                                  key={node.id}
                                  onClick={() => setSelectedVariant(node)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '6px 10px',
                                    marginLeft: node.depth * 28,
                                    cursor: 'pointer',
                                    borderRadius: 6,
                                    background: isSelected ? '#f0f0ff' : 'transparent',
                                    border: isSelected ? '1px solid #d6d6ff' : '1px solid transparent',
                                    transition: 'all 0.15s',
                                    marginBottom: 2,
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#fafafa';
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected)
                                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                                  }}
                                >
                                  {/* Tree connector line */}
                                  {node.depth > 0 && (
                                    <div
                                      style={{
                                        width: 16,
                                        height: 16,
                                        borderLeft: '2px solid #d9d9d9',
                                        borderBottom: '2px solid #d9d9d9',
                                        borderRadius: '0 0 0 6px',
                                        marginRight: 8,
                                        marginTop: -8,
                                        flexShrink: 0,
                                      }}
                                    />
                                  )}
                                  {node.depth === 0 && idx > 0 && (
                                    <div style={{ width: 24, marginRight: 0, flexShrink: 0 }} />
                                  )}

                                  {/* Status dot */}
                                  <div
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      background:
                                        node.status === 'active'
                                          ? '#52c41a'
                                          : node.status === 'draft'
                                            ? '#1677ff'
                                            : node.status === 'candidate'
                                              ? '#faad14'
                                              : '#d9d9d9',
                                      border: node.status === 'active' ? '2px solid #b7eb8f' : '2px solid transparent',
                                      flexShrink: 0,
                                      marginRight: 10,
                                    }}
                                  />

                                  {/* Name + version */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <Space size={6}>
                                      <Text
                                        strong={node.status === 'active'}
                                        style={{
                                          fontSize: 13,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {node.name}
                                      </Text>
                                      <Text
                                        type="secondary"
                                        style={{ fontSize: 10, fontFamily: 'monospace', flexShrink: 0 }}
                                      >
                                        v{node.version}
                                      </Text>
                                      {isAutoGen && (
                                        <Tooltip title="Auto-generated from feedback">
                                          <RobotOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                                        </Tooltip>
                                      )}
                                    </Space>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 10 }}>
                                      {new Date(node.created).toLocaleDateString()}
                                    </Text>
                                  </div>

                                  {/* Inline actions */}
                                  <Space size={2} style={{ flexShrink: 0, marginLeft: 8 }}>
                                    <Tag
                                      color={STATUS_COLORS[node.status]}
                                      style={{ fontSize: 10, margin: 0, padding: '0 4px' }}
                                    >
                                      {node.status}
                                    </Tag>
                                    {node.status !== 'active' && (
                                      <Tooltip title="Activate">
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<ThunderboltOutlined style={{ fontSize: 12 }} />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleActivate(node);
                                          }}
                                        />
                                      </Tooltip>
                                    )}
                                    <Tooltip title="Clone">
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<CopyOutlined style={{ fontSize: 12 }} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleClone(node);
                                        }}
                                      />
                                    </Tooltip>
                                  </Space>
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </Col>

                {/* Right: Detail panel */}
                {selectedVariant && (
                  <Col span={10}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <Text strong>{selectedVariant.name}</Text>
                          <Tag color={STATUS_COLORS[selectedVariant.status]}>{selectedVariant.status}</Tag>
                          <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                            v{selectedVariant.version}
                          </Text>
                        </Space>
                      }
                      extra={
                        <Space size={4}>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            disabled={selectedVariant.status === 'active'}
                            onClick={() => handleEditVariant(selectedVariant)}
                          >
                            Edit
                          </Button>
                          {selectedVariant.status !== 'active' && (
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteVariant(selectedVariant)}
                            >
                              Delete
                            </Button>
                          )}
                        </Space>
                      }
                      style={{ position: 'sticky', top: 16 }}
                    >
                      <Descriptions size="small" column={2} style={{ marginBottom: 12 }}>
                        <Descriptions.Item label="ID">{selectedVariant.id}</Descriptions.Item>
                        <Descriptions.Item label="Parent">
                          {selectedVariant.parent
                            ? (variants.find((v) => v.id === selectedVariant.parent)?.name ??
                              `#${selectedVariant.parent}`)
                            : '— (root)'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Created">
                          {new Date(selectedVariant.created).toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Created By">
                          {selectedVariant.createdBy ?? 'System'}
                        </Descriptions.Item>
                        {!!selectedVariant.metadata?.auto_generated && (
                          <>
                            <Descriptions.Item label="Feedback Used">
                              {String(selectedVariant.metadata.feedback_count ?? '—')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Approval">
                              <Text style={{ color: '#52c41a' }}>
                                +{String(selectedVariant.metadata.thumbs_up ?? 0)}
                              </Text>
                              {' / '}
                              <Text style={{ color: '#f5222d' }}>
                                -{String(selectedVariant.metadata.thumbs_down ?? 0)}
                              </Text>
                            </Descriptions.Item>
                          </>
                        )}
                      </Descriptions>

                      {/* Performance stats */}
                      <div
                        style={{
                          marginBottom: 12,
                          padding: '10px 12px',
                          background: '#fafafa',
                          borderRadius: 6,
                          border: '1px solid #f0f0f0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <BarChartOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                          <Text strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Performance
                          </Text>
                        </div>
                        {statsLoading ? (
                          <div style={{ textAlign: 'center', padding: '8px 0' }}>
                            <Spin size="small" />
                          </div>
                        ) : variantStats &&
                          (variantStats.behavioral.total > 0 || variantStats.explicitFeedback.total > 0) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {/* Behavioral signals */}
                            {variantStats.behavioral.total > 0 && (
                              <div>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                                >
                                  Behavioral signals
                                </Text>
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 6,
                                    marginTop: 4,
                                    marginBottom: 6,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <Tooltip title="Suggestions accepted by graders">
                                    <Tag color="success">
                                      {variantStats.behavioral.accepted} accepted
                                    </Tag>
                                  </Tooltip>
                                  <Tooltip title="Suggestions rejected by graders">
                                    <Tag color="error">
                                      {variantStats.behavioral.rejected} rejected
                                    </Tag>
                                  </Tooltip>
                                  <Tooltip title="Suggestions not yet acted on">
                                    <Tag>{variantStats.behavioral.pending} pending</Tag>
                                  </Tooltip>
                                </div>
                                <Descriptions size="small" column={2}>
                                  <Descriptions.Item label="Acceptance">
                                    <Text strong>{formatRate(variantStats.behavioral.acceptanceRate)}</Text>
                                  </Descriptions.Item>
                                  <Descriptions.Item label="Edit rate">
                                    <Tooltip title="% of accepted suggestions where grader modified the text">
                                      {formatRate(variantStats.behavioral.editRate)}
                                    </Tooltip>
                                  </Descriptions.Item>
                                  <Descriptions.Item label="Batch accept">
                                    <Tooltip title="Average proportion accepted per generation batch">
                                      {formatRate(variantStats.behavioral.batchAcceptanceRate)}
                                    </Tooltip>
                                  </Descriptions.Item>
                                  <Descriptions.Item label="Decide time">
                                    <Tooltip title="Average time from first viewing to accepting">
                                      <Space size={4}>
                                        <ClockCircleOutlined style={{ fontSize: 11 }} />
                                        {formatTime(variantStats.behavioral.avgTimeToDecideSeconds)}
                                      </Space>
                                    </Tooltip>
                                  </Descriptions.Item>
                                  <Descriptions.Item label="Suggestions">
                                    {variantStats.behavioral.total}
                                  </Descriptions.Item>
                                  <Descriptions.Item label="Assignments">
                                    {variantStats.behavioral.distinctAssignments}
                                  </Descriptions.Item>
                                </Descriptions>
                              </div>
                            )}
                            {/* Explicit feedback */}
                            {variantStats.explicitFeedback.total > 0 && (
                              <div>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                                >
                                  Explicit feedback
                                </Text>
                                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                  <Tooltip title="Thumbs up from graders">
                                    <Tag color="success">
                                      +{variantStats.explicitFeedback.thumbsUp} thumbs up
                                    </Tag>
                                  </Tooltip>
                                  <Tooltip title="Thumbs down from graders">
                                    <Tag color="error">
                                      -{variantStats.explicitFeedback.thumbsDown} thumbs down
                                    </Tag>
                                  </Tooltip>
                                  <Text type="secondary" style={{ fontSize: 11, alignSelf: 'center' }}>
                                    {variantStats.explicitFeedback.total} total
                                  </Text>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            No performance data yet
                          </Text>
                        )}
                      </div>

                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                        Prompt Text ({selectedVariant.text.length} chars)
                      </Text>
                      <pre
                        style={{
                          background: '#f5f5f5',
                          padding: 12,
                          borderRadius: 6,
                          fontSize: 12,
                          maxHeight: 400,
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          margin: 0,
                        }}
                      >
                        {selectedVariant.text}
                      </pre>
                    </Card>
                  </Col>
                )}
              </Row>
            ),
          },
          {
            key: 'experiments',
            label: (
              <span>
                Experiments{' '}
                <Badge
                  count={experiments.filter((e) => e.status === 'running').length}
                  showZero={false}
                  style={{ backgroundColor: '#52c41a', marginLeft: 6 }}
                />
              </span>
            ),
            children: (
              <Table
                dataSource={experiments}
                columns={experimentColumns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 20, showSizeChanger: false }}
                size="middle"
              />
            ),
          },
        ]}
      />

      {/* ─── Variant Editor Drawer ─────────────────────────────────────────── */}
      <Drawer
        title={editingVariant?.id ? 'Edit Variant' : 'New Variant'}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingVariant(null);
        }}
        width={640}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSaveVariant}>
              Save
            </Button>
          </Space>
        }
      >
        {editingVariant && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Prompt Type
              </Text>
              <Select
                style={{ width: '100%' }}
                value={editingVariant.promptType}
                onChange={(val) => setEditingVariant((prev) => ({ ...prev!, promptType: val }))}
                options={PROMPT_TYPES.map((p) => ({ value: p.value, label: p.label }))}
                disabled={!!editingVariant.id}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Name
              </Text>
              <Input
                value={editingVariant.name}
                onChange={(e) => setEditingVariant((prev) => ({ ...prev!, name: e.target.value }))}
                placeholder="e.g. Concise feedback v2"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Status
              </Text>
              <Select
                style={{ width: '100%' }}
                value={editingVariant.status}
                onChange={(val) => setEditingVariant((prev) => ({ ...prev!, status: val }))}
                disabled={editingVariant.status === 'active'}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'candidate', label: 'Candidate' },
                  { value: 'retired', label: 'Retired' },
                ]}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text strong>Prompt Text</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {editingVariant.text?.length ?? 0} characters
                </Text>
              </div>
              <TextArea
                value={editingVariant.text}
                onChange={(e) => setEditingVariant((prev) => ({ ...prev!, text: e.target.value }))}
                rows={16}
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12 }}
                placeholder="Enter the system prompt text…"
              />
            </div>
          </Space>
        )}
      </Drawer>

      {/* ─── Experiment Creator Modal ──────────────────────────────────────── */}
      <Modal
        title="Create A/B Experiment"
        open={experimentCreatorOpen}
        onCancel={() => setExperimentCreatorOpen(false)}
        onOk={handleCreateExperiment}
        okText="Create"
        width={560}
      >
        <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              Experiment Name
            </Text>
            <Input
              value={newExperiment.name}
              onChange={(e) => setNewExperiment((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Concise vs Detailed Comments"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              Prompt Type
            </Text>
            <Select
              style={{ width: '100%' }}
              value={newExperiment.promptType || undefined}
              onChange={(val) => setNewExperiment((prev) => ({ ...prev, promptType: val, variantA: 0, variantB: 0 }))}
              placeholder="Select prompt type"
              options={PROMPT_TYPES.map((p) => ({ value: p.value, label: p.label }))}
            />
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Variant A
              </Text>
              <Select
                style={{ width: '100%' }}
                value={newExperiment.variantA || undefined}
                onChange={(val) => setNewExperiment((prev) => ({ ...prev, variantA: val }))}
                placeholder="Select variant"
                options={variantsForExperimentSelect.map((v) => ({
                  value: v.id,
                  label: `${v.name} (v${v.version})`,
                }))}
              />
            </Col>
            <Col span={12}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Variant B
              </Text>
              <Select
                style={{ width: '100%' }}
                value={newExperiment.variantB || undefined}
                onChange={(val) => setNewExperiment((prev) => ({ ...prev, variantB: val }))}
                placeholder="Select variant"
                options={variantsForExperimentSelect
                  .filter((v) => v.id !== newExperiment.variantA)
                  .map((v) => ({
                    value: v.id,
                    label: `${v.name} (v${v.version})`,
                  }))}
              />
            </Col>
          </Row>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              Sample Rate: {(newExperiment.sampleRate * 100).toFixed(0)}%
            </Text>
            <Slider
              min={0.01}
              max={1.0}
              step={0.01}
              value={newExperiment.sampleRate}
              onChange={(val) => setNewExperiment((prev) => ({ ...prev, sampleRate: val }))}
              tooltip={{ formatter: (v) => `${((v ?? 0) * 100).toFixed(0)}%` }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Percentage of requests that trigger an A/B comparison
            </Text>
          </div>
        </Space>
      </Modal>

      {/* ─── Results Drawer ────────────────────────────────────────────────── */}
      <Drawer
        title={
          resultsDrawer.experiment ? (
            <Space>
              <span>Results: {resultsDrawer.experiment.name}</span>
              <Tag color={EXPERIMENT_STATUS_COLORS[resultsDrawer.experiment.status]}>
                {resultsDrawer.experiment.status}
              </Tag>
            </Space>
          ) : (
            'Results'
          )
        }
        open={resultsDrawer.open}
        onClose={() => setResultsDrawer((prev) => ({ ...prev, open: false }))}
        width={520}
      >
        {resultsDrawer.loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : resultsDrawer.results ? (
          <ResultsPanel
            results={resultsDrawer.results}
            experiment={resultsDrawer.experiment!}
            pool={resultsDrawer.pool}
            onPoolChange={handlePoolChange}
          />
        ) : (
          <Text type="secondary">No results available</Text>
        )}
      </Drawer>

      {/* ─── Settings Drawer ───────────────────────────────────────────────── */}
      <Drawer
        title={
          <Space>
            <SettingOutlined />
            Auto-Improvement Settings
          </Space>
        }
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        width={460}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setSettingsDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" loading={savingSettings} onClick={handleSaveSettings}>
              Save
            </Button>
          </Space>
        }
      >
        {labSettings && (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* Master switch */}
            <Card size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ fontSize: 14 }}>
                    Auto-Improvement
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Master switch for all automatic prompt generation
                  </Text>
                </div>
                <Switch
                  checked={labSettings.autoImproveEnabled}
                  onChange={(checked) =>
                    setLabSettings((prev) => (prev ? { ...prev, autoImproveEnabled: checked } : prev))
                  }
                />
              </div>
            </Card>

            {/* AI Provider Config */}
            <Card size="small" title={<Text strong>AI Configuration</Text>}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                Provider and model used for auto-improvement and prompt generation. Use a larger model (e.g. Gemini 2.5
                Pro, GPT-4o) for higher-quality system prompt generation.
              </Text>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                  <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Provider</Text>
                  <Select
                    value={labSettings.aiProvider || undefined}
                    onChange={(val) => {
                      setLabSettings((prev) => (prev ? { ...prev, aiProvider: val, aiModel: '' } : prev));
                    }}
                    placeholder="Select provider"
                    style={{ width: '100%' }}
                    size="small"
                    options={[
                      { value: 'gemini', label: 'Google Gemini' },
                      { value: 'openai', label: 'OpenAI' },
                    ]}
                  />
                </div>
                {labSettings.aiProvider && (
                  <>
                    <div>
                      <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Model</Text>
                      <Select
                        value={labSettings.aiModel || undefined}
                        onChange={(val) => setLabSettings((prev) => (prev ? { ...prev, aiModel: val } : prev))}
                        placeholder="Select model"
                        style={{ width: '100%' }}
                        size="small"
                        options={AI_PROVIDER_MODELS[labSettings.aiProvider] ?? []}
                      />
                    </div>
                    <div>
                      <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        API Key{' '}
                        {labSettings.aiApiKeySet && (
                          <Tag color="green" style={{ fontSize: 10, marginLeft: 4 }}>
                            configured
                          </Tag>
                        )}
                      </Text>
                      <Input.Password
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={
                          labSettings.aiApiKeySet ? '••••••••  (leave blank to keep current)' : 'Enter API key'
                        }
                        size="small"
                      />
                    </div>
                  </>
                )}
              </Space>
            </Card>

            {/* Scheduled */}
            <Card
              size="small"
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Scheduled Runs</Text>
                  <Switch
                    size="small"
                    checked={labSettings.scheduleEnabled}
                    disabled={!labSettings.autoImproveEnabled}
                    onChange={(checked) =>
                      setLabSettings((prev) => (prev ? { ...prev, scheduleEnabled: checked } : prev))
                    }
                  />
                </div>
              }
            >
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Periodically check all prompt types and generate improvements from accumulated feedback.
              </Text>
              <div>
                <Text style={{ fontSize: 12 }}>Run every</Text>
                <InputNumber
                  min={1}
                  max={720}
                  value={labSettings.scheduleIntervalHours}
                  onChange={(val) =>
                    setLabSettings((prev) => (prev ? { ...prev, scheduleIntervalHours: val ?? 168 } : prev))
                  }
                  disabled={!labSettings.autoImproveEnabled || !labSettings.scheduleEnabled}
                  style={{ width: 80, margin: '0 8px' }}
                  size="small"
                />
                <Text style={{ fontSize: 12 }}>hours</Text>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                  Default: 168 hours (weekly). The Celery beat schedule runs at Monday 3 AM UTC.
                </Text>
              </div>
            </Card>

            {/* Threshold */}
            <Card
              size="small"
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Threshold Trigger</Text>
                  <Switch
                    size="small"
                    checked={labSettings.thresholdEnabled}
                    disabled={!labSettings.autoImproveEnabled}
                    onChange={(checked) =>
                      setLabSettings((prev) => (prev ? { ...prev, thresholdEnabled: checked } : prev))
                    }
                  />
                </div>
              }
            >
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Automatically trigger improvement when enough new feedback accumulates since the last auto-generated
                variant.
              </Text>
              <div>
                <Text style={{ fontSize: 12 }}>Trigger after</Text>
                <InputNumber
                  min={5}
                  max={1000}
                  value={labSettings.feedbackThreshold}
                  onChange={(val) =>
                    setLabSettings((prev) => (prev ? { ...prev, feedbackThreshold: val ?? 50 } : prev))
                  }
                  disabled={!labSettings.autoImproveEnabled || !labSettings.thresholdEnabled}
                  style={{ width: 80, margin: '0 8px' }}
                  size="small"
                />
                <Text style={{ fontSize: 12 }}>new feedback entries</Text>
              </div>
            </Card>

            {/* Min feedback */}
            <Card size="small" title={<Text strong>Minimum Feedback</Text>}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Minimum total default-pool feedback required before any auto-improvement can run (manual or automatic).
              </Text>
              <div>
                <Text style={{ fontSize: 12 }}>Require at least</Text>
                <InputNumber
                  min={1}
                  max={500}
                  value={labSettings.minFeedback}
                  onChange={(val) => setLabSettings((prev) => (prev ? { ...prev, minFeedback: val ?? 5 } : prev))}
                  style={{ width: 80, margin: '0 8px' }}
                  size="small"
                />
                <Text style={{ fontSize: 12 }}>feedback entries</Text>
              </div>
            </Card>

            <Paragraph type="secondary" style={{ fontSize: 11, margin: 0 }}>
              <strong>Note:</strong> Manual &quot;Auto-Improve&quot; buttons always work regardless of these settings.
              These controls only affect the scheduled and threshold-based automatic triggers. The master switch must be
              ON for either automatic trigger to fire.
            </Paragraph>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

// ─── Behavioral Metrics Card ────────────────────────────────────────────────

const formatRate = (rate: number | null): string => (rate != null ? `${(rate * 100).toFixed(1)}%` : '—');

const formatTime = (seconds: number | null): string => {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
};

const VariantStatsColumn: React.FC<{
  stats: VariantBehavioralStats;
  label: string;
  color: string;
  confident: boolean;
  batchRate: number | null;
}> = ({ stats, label, color, confident, batchRate }) => (
  <div style={{ flex: 1 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <Badge color={color} />
      <Text strong style={{ fontSize: 12 }}>
        {label}
      </Text>
      {!confident && stats.total > 0 && (
        <Tooltip title="Low confidence — insufficient data for reliable comparison">
          <WarningOutlined style={{ color: '#faad14', fontSize: 12 }} />
        </Tooltip>
      )}
    </div>
    <Descriptions size="small" column={1} style={{ fontSize: 12 }}>
      <Descriptions.Item label="Total suggestions">{stats.total}</Descriptions.Item>
      <Descriptions.Item label="Accepted">
        <Text style={{ color: '#52c41a' }}>{stats.accepted}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="Rejected">
        <Text style={{ color: '#f5222d' }}>{stats.rejected}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="Pending">{stats.pending}</Descriptions.Item>
      <Descriptions.Item label="Acceptance rate">
        <Text strong>{formatRate(stats.acceptanceRate)}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="Edit rate">
        <Tooltip title="% of accepted suggestions where the grader modified the text after accepting">
          {formatRate(stats.editRate)}
        </Tooltip>
      </Descriptions.Item>
      <Descriptions.Item label="Batch acceptance">
        <Tooltip title="Average proportion of suggestions accepted per generation batch">
          {formatRate(batchRate)}
        </Tooltip>
      </Descriptions.Item>
      <Descriptions.Item label="Avg time to decide">
        <Tooltip title="Average time from first viewing a suggestion to accepting it">
          <Space size={4}>
            <ClockCircleOutlined style={{ fontSize: 11 }} />
            {formatTime(stats.avgTimeToDecideSeconds)}
          </Space>
        </Tooltip>
      </Descriptions.Item>
      <Descriptions.Item label="Distinct assignments">{stats.distinctAssignments}</Descriptions.Item>
    </Descriptions>
  </div>
);

const BehavioralMetricsCard: React.FC<{
  behavioral: BehavioralMetrics;
  experiment: PromptExperiment;
}> = ({ behavioral, experiment }) => {
  const { variantA, variantB } = behavioral;
  const hasData = variantA.total > 0 || variantB.total > 0;

  // Determine behavioral winner
  let behavioralWinner: 'A' | 'B' | 'Tie' | null = null;
  if (variantA.acceptanceRate != null && variantB.acceptanceRate != null) {
    if (variantA.acceptanceRate > variantB.acceptanceRate) behavioralWinner = 'A';
    else if (variantB.acceptanceRate > variantA.acceptanceRate) behavioralWinner = 'B';
    else behavioralWinner = 'Tie';
  }

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined />
          <span>Behavioral Metrics</span>
          {behavioralWinner &&
            behavioralWinner !== 'Tie' &&
            behavioral.variantAConfident &&
            behavioral.variantBConfident && (
              <Tag color="blue" icon={<TrophyOutlined />}>
                {behavioralWinner === 'A'
                  ? (experiment.variantADetail?.name ?? 'Variant A')
                  : (experiment.variantBDetail?.name ?? 'Variant B')}
              </Tag>
            )}
        </Space>
      }
      size="small"
    >
      {!hasData ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          No behavioral data yet. Suggestions must be generated with tracked prompt variants.
        </Text>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 24 }}>
            <VariantStatsColumn
              stats={variantA}
              label={experiment.variantADetail?.name ?? 'Variant A'}
              color="#6366f1"
              confident={behavioral.variantAConfident}
              batchRate={behavioral.batchAcceptanceRateA}
            />
            <div style={{ width: 1, background: '#f0f0f0' }} />
            <VariantStatsColumn
              stats={variantB}
              label={experiment.variantBDetail?.name ?? 'Variant B'}
              color="#f59e0b"
              confident={behavioral.variantBConfident}
              batchRate={behavioral.batchAcceptanceRateB}
            />
          </div>

          {/* Acceptance rate comparison bar */}
          {variantA.acceptanceRate != null && variantB.acceptanceRate != null && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Text style={{ fontSize: 11, display: 'block', marginBottom: 8 }} type="secondary">
                Acceptance Rate Comparison
              </Text>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 11 }}>{experiment.variantADetail?.name ?? 'A'}</Text>
                  <Text strong style={{ fontSize: 11 }}>
                    {formatRate(variantA.acceptanceRate)}
                  </Text>
                </div>
                <Progress percent={variantA.acceptanceRate * 100} showInfo={false} strokeColor="#6366f1" size="small" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 11 }}>{experiment.variantBDetail?.name ?? 'B'}</Text>
                  <Text strong style={{ fontSize: 11 }}>
                    {formatRate(variantB.acceptanceRate)}
                  </Text>
                </div>
                <Progress percent={variantB.acceptanceRate * 100} showInfo={false} strokeColor="#f59e0b" size="small" />
              </div>
            </div>
          )}

          {/* Confidence thresholds info */}
          <Paragraph type="secondary" style={{ fontSize: 11, marginTop: 12, marginBottom: 0 }}>
            Confidence requires {'>'}={behavioral.minSamplesThreshold} suggestions per variant across {'>'}=
            {behavioral.minAssignmentsThreshold} assignments.
            {!behavioral.variantAConfident || !behavioral.variantBConfident
              ? ' Auto-promotion will proceed with a low-confidence warning.'
              : ' Both variants have confident data.'}
          </Paragraph>
        </>
      )}
    </Card>
  );
};

// ─── Results Panel ──────────────────────────────────────────────────────────

interface ResultsPanelProps {
  results: ExperimentResults;
  experiment: PromptExperiment;
  pool: 'all' | 'default' | 'custom';
  onPoolChange: (pool: 'all' | 'default' | 'custom') => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, experiment, pool, onPoolChange }) => {
  const total = results.variantAWins + results.variantBWins + results.ties;
  const aPercentage = total > 0 ? (results.variantAWins / total) * 100 : 0;
  const bPercentage = total > 0 ? (results.variantBWins / total) * 100 : 0;

  const winner =
    results.variantAWins > results.variantBWins ? 'A' : results.variantBWins > results.variantAWins ? 'B' : 'Tie';

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Pool selector */}
      <div>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
          Feedback Pool
        </Text>
        <Select
          value={pool}
          onChange={onPoolChange}
          style={{ width: 200 }}
          options={[
            { value: 'all', label: 'All Feedback' },
            { value: 'default', label: 'Default Prompts Only' },
            { value: 'custom', label: 'Custom Prompts Only' },
          ]}
        />
      </div>

      {/* Summary stats */}
      <Row gutter={16}>
        <Col span={8}>
          <Card size="small">
            <Statistic title="Total Feedback" value={results.totalFeedback} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="Thumbs Up" value={results.thumbsUp} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="Thumbs Down" value={results.thumbsDown} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      {/* Head-to-head comparison */}
      <Card
        title={
          <Space>
            <span>Head to Head</span>
            {winner !== 'Tie' && (
              <Tag color="gold" icon={<TrophyOutlined />}>
                {winner === 'A'
                  ? (experiment.variantADetail?.name ?? `Variant A`)
                  : (experiment.variantBDetail?.name ?? `Variant B`)}
              </Tag>
            )}
          </Space>
        }
        size="small"
      >
        {/* Variant A bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Space size={4}>
              <Badge color="#6366f1" />
              <Text style={{ fontSize: 12 }}>{experiment.variantADetail?.name ?? 'Variant A'}</Text>
            </Space>
            <Text strong style={{ fontSize: 12 }}>
              {results.variantAWins} wins ({aPercentage.toFixed(1)}%)
            </Text>
          </div>
          <Progress percent={aPercentage} showInfo={false} strokeColor="#6366f1" size="small" />
        </div>

        {/* Variant B bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Space size={4}>
              <Badge color="#f59e0b" />
              <Text style={{ fontSize: 12 }}>{experiment.variantBDetail?.name ?? 'Variant B'}</Text>
            </Space>
            <Text strong style={{ fontSize: 12 }}>
              {results.variantBWins} wins ({bPercentage.toFixed(1)}%)
            </Text>
          </div>
          <Progress percent={bPercentage} showInfo={false} strokeColor="#f59e0b" size="small" />
        </div>

        {/* Ties */}
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Ties / Skips: {results.ties}
          </Text>
        </div>
      </Card>

      {/* Pool breakdown */}
      <Card title="Pool Breakdown" size="small">
        <Descriptions size="small" column={1}>
          <Descriptions.Item label="Default prompt feedback">{results.defaultPoolCount}</Descriptions.Item>
          <Descriptions.Item label="Custom prompt feedback">{results.customPoolCount}</Descriptions.Item>
        </Descriptions>
        <Paragraph type="secondary" style={{ fontSize: 11, marginTop: 8 }}>
          Default pool: courses using the platform prompt (feeds auto-improvement).
          <br />
          Custom pool: courses with a custom AI system prompt (insight extraction only).
        </Paragraph>
      </Card>

      {/* Behavioral metrics */}
      {results.behavioral && <BehavioralMetricsCard behavioral={results.behavioral} experiment={experiment} />}
    </Space>
  );
};

export default PromptLab;
