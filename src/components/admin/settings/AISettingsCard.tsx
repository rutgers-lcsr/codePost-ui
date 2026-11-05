// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AISettingsCard Component
 *
 * Card component for managing course AI settings.
 * Shows org-level AI availability and lets course admins opt-in/out
 * of using their own credentials vs. inheriting from the organization.
 */

import * as React from 'react';
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Flex,
  Input,
  message,
  Select,
  Space,
  Spin,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import { RobotOutlined, BankOutlined } from '@ant-design/icons';
import type { CourseAISettings, PatchedCourseAISettings } from '../../../api-client';
import CPButton from '../../core/CPButton';
import TokenRateEditor from '../../core/TokenRateEditor';
import type { CustomTokenRates, DefaultTokenRates } from '../../core/TokenRateEditor';
import { AIUsageService } from '../../../services/aiUsage';
import type { AIFeatureEntry, AIFeatureConfig, AIFeatureStatus } from '../../../services/aiUsage';
import { AI_PROVIDERS, DEFAULT_MODELS } from '../../../utils/aiService';
import type { AIProvider } from '../../../utils/aiService';
import type { AIModel } from '../../../api-client';
import { apiErrorMessageAsync } from '../../../lib/apiError';
import AIProviderTestModal from '../../core/AIProviderTestModal';
import { usePermissionsStore } from '../../../stores/usePermissionsStore';
import FieldStatusText, { FieldStatus, useSaveAnnouncer } from './FieldStatusText';

const { Text } = Typography;

interface IAISettingsCardProps {
  courseId: number;
}

const AISettingsCard: React.FC<IAISettingsCardProps> = ({ courseId }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [testOpen, setTestOpen] = React.useState(false);

  // Org-level availability
  const [orgAiAvailable, setOrgAiAvailable] = React.useState(false);
  const [aiUseOwnSettings, setAiUseOwnSettings] = React.useState(false);

  // Course-own settings
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [aiDisabled, setAiDisabled] = React.useState(false);
  const [isConfigured, setIsConfigured] = React.useState(false);
  const [provider, setProvider] = React.useState<AIProvider | undefined>(undefined);
  const [apiKey, setApiKey] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [model, setModel] = React.useState('');
  // Only the connection block (provider, key, URL, model, rates) waits for a Save: a provider
  // without its key is a broken half-config. Every switch saves itself.
  const [connectionDirty, setConnectionDirty] = React.useState(false);
  const [fieldStatus, setFieldStatus] = React.useState<Record<string, FieldStatus>>({});
  const statusTimers = React.useRef<Record<string, number>>({});
  React.useEffect(() => () => Object.values(statusTimers.current).forEach((t) => window.clearTimeout(t)), []);
  const { announce, region: announcer } = useSaveAnnouncer();
  // Saves run one after another. The feature map and the model overrides are whole JSON fields
  // on the server, so each PATCH carries the full map: `featureConfigRef` is the optimistic
  // latest (two quick toggles build on each other), `savedFeatureModels` the last server answer.
  const queue = React.useRef<Promise<unknown>>(Promise.resolve());
  const featureConfigRef = React.useRef<AIFeatureConfig>({});
  const savedFeatureModels = React.useRef<Record<string, string>>({});
  const pendingFeatureModel = React.useRef<Record<string, string | undefined>>({});
  const [hasApiKey, setHasApiKey] = React.useState(false);
  const [apiKeyHint, setApiKeyHint] = React.useState<string | null>(null);
  const [customTokenRates, setCustomTokenRates] = React.useState<CustomTokenRates>({});
  const [defaultTokenRates, setDefaultTokenRates] = React.useState<DefaultTokenRates>({});
  const [orgRateModels, setOrgRateModels] = React.useState<string[]>([]);

  // Per-feature toggles
  const [featureRegistry, setFeatureRegistry] = React.useState<AIFeatureEntry[]>([]);
  const [featureConfig, setFeatureConfig] = React.useState<AIFeatureConfig>({});
  const [featureStatus, setFeatureStatus] = React.useState<AIFeatureStatus>({});

  // Per-feature model overrides
  const [featureModels, setFeatureModels] = React.useState<Record<string, string>>({});
  const [featureModelsResolved, setFeatureModelsResolved] = React.useState<Record<string, string>>({});

  // Model dropdown
  const [modelOptions, setModelOptions] = React.useState<{ label: string; value: string }[]>([]);
  const [loadingModels, setLoadingModels] = React.useState(false);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settings, features] = await Promise.all([
          AIUsageService.getCourseAISettings(courseId),
          AIUsageService.listAIFeatures(),
        ]);
        const s = settings as unknown as Record<string, unknown>;
        setOrgAiAvailable(settings.orgAiAvailable ?? false);
        setAiUseOwnSettings(settings.aiUseOwnSettings ?? false);
        setAiEnabled(settings.aiEnabled);
        setAiDisabled(settings.aiDisabled || false);
        setIsConfigured(!!settings.aiProvider);
        setProvider((settings.aiProvider as AIProvider | undefined) || undefined);
        setBaseUrl(settings.aiBaseUrl || '');
        setModel(settings.aiModel || '');
        setHasApiKey(settings.hasApiKey ?? false);
        setApiKeyHint(settings.apiKeyHint ?? null);
        setCustomTokenRates((settings.aiTokenRates as CustomTokenRates) ?? {});
        setDefaultTokenRates((settings.defaultTokenRates as DefaultTokenRates) ?? {});
        setOrgRateModels(Object.keys((settings.orgTokenRates as DefaultTokenRates) ?? {}));
        setFeatureRegistry(features);
        setFeatureConfig(((s.aiFeatureConfig as AIFeatureConfig) ?? {}) as AIFeatureConfig);
        featureConfigRef.current = ((s.aiFeatureConfig as AIFeatureConfig) ?? {}) as AIFeatureConfig;
        setFeatureStatus(((s.aiFeatures as AIFeatureStatus) ?? {}) as AIFeatureStatus);
        setFeatureModels((s.aiFeatureModels as Record<string, string>) ?? {});
        savedFeatureModels.current = (s.aiFeatureModels as Record<string, string>) ?? {};
        setFeatureModelsResolved((s.aiFeatureModelsResolved as Record<string, string>) ?? {});
      } catch (error) {
        console.error('Failed to fetch AI settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [courseId]);

  // When using org settings, we don't show the course-specific key fields
  const usingOrgSettings = orgAiAvailable && !aiUseOwnSettings;

  // Fetch curated + live models when the effective provider changes.
  // When inheriting the org key, the course aiModels endpoint resolves the
  // effective provider server-side and returns its curated list too.
  React.useEffect(() => {
    if (!provider && !usingOrgSettings) {
      setModelOptions([]);
      return;
    }
    setLoadingModels(true);

    const buildOptions = (curated: AIModel[], live: AIModel[]) => {
      const opts: { label: string; value: string }[] = [];
      const seen = new Set<string>();
      for (const m of curated) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          opts.push({ label: `${m.name}${m.isDefault ? ' \u2605' : ''}`, value: m.id });
        }
      }
      for (const m of live) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          opts.push({ label: m.name, value: m.id });
        }
      }
      return opts;
    };

    const coursePromise = AIUsageService.getCourseModels(courseId)
      .then((res) => {
        const provData = res.providers?.[0];
        if (provData?.liveError) {
          console.warn('Live model fetch warning:', provData.liveError);
        }
        return { curated: provData?.models ?? [], live: provData?.liveModels ?? [] };
      })
      .catch(() => ({ curated: [] as AIModel[], live: [] as AIModel[] }));

    const curatedPromise = (
      !usingOrgSettings && provider
        ? AIUsageService.getModels(provider).then((res) => res.providers?.[0]?.models ?? [])
        : Promise.resolve([] as AIModel[])
    ).catch(() => [] as AIModel[]);

    Promise.all([curatedPromise, coursePromise]).then(([curated, course]) => {
      setModelOptions(buildOptions([...curated, ...course.curated], course.live));
      setLoadingModels(false);
    });
  }, [provider, courseId, usingOrgSettings]);

  const applyResult = (result: CourseAISettings) => {
    const r = result as unknown as Record<string, unknown>;
    setAiEnabled(result.aiEnabled);
    setAiDisabled(result.aiDisabled || false);
    setIsConfigured(!!result.aiProvider);
    setAiUseOwnSettings(result.aiUseOwnSettings ?? false);
    setHasApiKey(result.hasApiKey ?? false);
    setFeatureConfig(((r.aiFeatureConfig as AIFeatureConfig) ?? {}) as AIFeatureConfig);
    setFeatureStatus(((r.aiFeatures as AIFeatureStatus) ?? {}) as AIFeatureStatus);
    setFeatureModels((r.aiFeatureModels as Record<string, string>) ?? {});
    savedFeatureModels.current = (r.aiFeatureModels as Record<string, string>) ?? {};
    setFeatureModelsResolved((r.aiFeatureModelsResolved as Record<string, string>) ?? {});
    // Feature toggles feed capabilities (e.g. generate_ai_quiz_questions), so drop the
    // cached ones or AI buttons stay visible until the next reload.
    usePermissionsStore.getState().invalidateCourse(courseId);
  };

  /** After the org key takes over, pending edits to the course's own connection are moot:
   *  show the saved connection again so Test is never locked behind a Save that cannot render. */
  const resetConnectionDraft = (r: CourseAISettings) => {
    setProvider((r.aiProvider as AIProvider | undefined) || undefined);
    setBaseUrl(r.aiBaseUrl || '');
    setModel(r.aiModel || '');
    setCustomTokenRates((r.aiTokenRates as CustomTokenRates) ?? {});
    setApiKey('');
    setConnectionDirty(false);
  };

  const setStatus = (key: string, status: FieldStatus | null) => {
    window.clearTimeout(statusTimers.current[key]);
    setFieldStatus((prev) => {
      const next = { ...prev };
      if (status) next[key] = status;
      else delete next[key];
      return next;
    });
    if (status?.state === 'saved') {
      statusTimers.current[key] = window.setTimeout(() => setStatus(key, null), 2500);
    }
  };

  /** Save one switch the moment it changes; the toast offers Undo for six seconds. `undo` is
   *  computed when Undo is clicked, against whatever has been saved since, so it reverts only
   *  this change. Resolves with the server's answer, or null when the save failed. */
  const persist = (
    key: string,
    label: string,
    patch: Partial<PatchedCourseAISettings>,
    undo: () => Partial<PatchedCourseAISettings>,
    onError?: () => void,
  ): Promise<CourseAISettings | null> => {
    setStatus(key, { state: 'saving' });
    const run = async () => {
      try {
        const result = await AIUsageService.updateCourseAISettings(courseId, patch);
        applyResult(result);
        setStatus(key, { state: 'saved' });
        announce(`${label} saved.`);
        message.success({
          key: 'course-settings-save',
          duration: 6,
          content: (
            <span>
              {label} saved.{' '}
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: 'auto' }}
                onClick={() => {
                  message.destroy('course-settings-save');
                  void persist(key, label, undo(), () => patch);
                }}
              >
                Undo
              </Button>
            </span>
          ),
        });
        return result;
      } catch (error) {
        onError?.();
        const detail = (await apiErrorMessageAsync(error)) ?? 'Could not save this setting.';
        setStatus(key, { state: 'error', detail });
        announce(`${label} was not saved. ${detail}`);
        return null;
      }
    };
    queue.current = queue.current.then(run, run);
    return queue.current as Promise<CourseAISettings | null>;
  };

  /** One feature switch: builds on the optimistic map so two quick flips both land. */
  const persistFeature = (key: string, label: string, checked: boolean) => {
    featureConfigRef.current = { ...featureConfigRef.current, [key]: checked };
    void persist(
      `feature:${key}`,
      label,
      { aiFeatureConfig: featureConfigRef.current },
      () => {
        featureConfigRef.current = { ...featureConfigRef.current, [key]: !checked };
        return { aiFeatureConfig: featureConfigRef.current };
      },
      // The server did not take it: fall back to what it last confirmed.
      () => {
        featureConfigRef.current = { ...featureConfigRef.current, [key]: !checked };
      },
    );
  };

  const saveConnection = async () => {
    setIsSaving(true);
    try {
      applyResult(
        await AIUsageService.updateCourseAISettings(courseId, {
          aiProvider: provider || null,
          aiBaseUrl: baseUrl || null,
          aiModel: model || null,
          aiTokenRates: Object.keys(customTokenRates).length > 0 ? customTokenRates : {},
          ...(apiKey ? { aiApiKey: apiKey } : {}),
        } as Parameters<typeof AIUsageService.updateCourseAISettings>[1]),
      );
      setApiKey('');
      setConnectionDirty(false);
      message.success('AI connection saved.');
    } catch (error) {
      message.error((await apiErrorMessageAsync(error)) ?? 'Failed to save the AI connection');
    } finally {
      setIsSaving(false);
    }
  };

  const mark = () => setConnectionDirty(true);

  // A per-feature model override is one field: it saves when a model is picked, cleared, or
  // typed and left. The baseline is the server's last answer, so a rejected value is retried on
  // the next blur; `pendingFeatureModel` stops select-then-blur from sending the same value twice.
  const commitFeatureModel = (key: string, label: string, value: string) => {
    const before = savedFeatureModels.current;
    if ((before[key] ?? '') === value || pendingFeatureModel.current[key] === value) return;
    const next = { ...before };
    if (value) next[key] = value;
    else delete next[key];
    pendingFeatureModel.current[key] = value;
    void persist(`model:${key}`, `${label} model`, { aiFeatureModels: next }, () => {
      const reverted = { ...savedFeatureModels.current };
      if (before[key]) reverted[key] = before[key];
      else delete reverted[key];
      return { aiFeatureModels: reverted };
    }).finally(() => {
      delete pendingFeatureModel.current[key];
    });
  };

  const showBaseUrl = provider === 'ollama' || provider === 'portkey' || provider === 'custom';

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>AI Features</span>
          {(isConfigured || usingOrgSettings) && (
            <Text type={aiEnabled ? 'success' : 'danger'} style={{ fontSize: 12 }}>
              {aiEnabled ? '(Enabled)' : '(Disabled)'}
            </Text>
          )}
        </Space>
      }
      extra={
        <Tooltip
          title={
            connectionDirty && !usingOrgSettings
              ? 'Save the connection first — the test runs against saved settings'
              : 'Send a test request to your AI provider'
          }
        >
          <CPButton
            size="small"
            onClick={() => setTestOpen(true)}
            disabled={(connectionDirty && !usingOrgSettings) || isLoading}
          >
            Test
          </CPButton>
        </Tooltip>
      }
      style={{ marginBottom: 24 }}
    >
      {announcer}
      {isLoading ? (
        <Text type="secondary">Loading AI settings...</Text>
      ) : (
        <Flex vertical gap={16}>
          <Text type="secondary" style={{ marginBottom: 8 }}>
            Enable AI for this course. The global toggle controls all AI features, and each feature can be toggled
            individually below. Switches save as you flip them; the provider connection saves as one unit.
          </Text>

          {/* ── Org AI banner ── */}
          {orgAiAvailable && (
            <Alert
              type="info"
              showIcon
              icon={<BankOutlined />}
              title={
                usingOrgSettings
                  ? 'Using organization AI key — AI is available via your organization settings.'
                  : 'Organization AI key is available. Toggle "Use org key" below to inherit it instead of your own.'
              }
              action={
                <Space size={8}>
                  <FieldStatusText status={fieldStatus.aiUseOwnSettings} />
                  <Switch
                    size="small"
                    aria-label="Use organization AI key"
                    checked={!aiUseOwnSettings}
                    loading={fieldStatus.aiUseOwnSettings?.state === 'saving'}
                    onChange={(checked) =>
                      void persist('aiUseOwnSettings', 'Use org key', { aiUseOwnSettings: !checked }, () => ({
                        aiUseOwnSettings: checked,
                      })).then((r) => {
                        if (r && checked) resetConnectionDraft(r);
                      })
                    }
                  />
                </Space>
              }
              description={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {usingOwnSettingsLabel(aiUseOwnSettings)}
                </Text>
              }
            />
          )}

          {/* ── Own key fields — only show when not using org settings ── */}
          {!usingOrgSettings && (
            <>
              {/* Provider */}
              <Flex vertical gap={4}>
                <Text strong>AI Provider</Text>
                <Select
                  value={provider}
                  onChange={(value: AIProvider) => {
                    setProvider(value);
                    setModel(DEFAULT_MODELS[value] || '');
                    mark();
                  }}
                  onClear={() => {
                    setProvider(undefined);
                    setModel('');
                    setBaseUrl('');
                    mark();
                  }}
                  placeholder="Select a provider"
                  aria-label="AI Provider"
                  style={{ width: 250 }}
                  allowClear
                >
                  {AI_PROVIDERS.map((p) => (
                    <Select.Option key={p.value} value={p.value}>
                      {p.label}
                    </Select.Option>
                  ))}
                </Select>
              </Flex>

              {/* API Key */}
              {provider && (
                <Flex vertical gap={4}>
                  <Text strong>
                    API Key{' '}
                    {(provider === 'ollama' || provider === 'portkey') && (
                      <Text type="secondary" style={{ fontWeight: 'normal', fontSize: 12 }}>
                        (Optional)
                      </Text>
                    )}
                  </Text>
                  <Input.Password
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      mark();
                    }}
                    placeholder={hasApiKey ? '••••••••  (key saved, enter new key to update)' : 'Enter API key'}
                    style={{ maxWidth: 400 }}
                  />
                  {hasApiKey && apiKeyHint && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Current key:{' '}
                      <Text code style={{ fontSize: 12 }}>
                        {apiKeyHint}
                      </Text>
                    </Text>
                  )}
                  {provider === 'portkey' && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Required when using the official Portkey API; optional for a self-hosted gateway. Sent as the
                      x-portkey-api-key header.
                    </Text>
                  )}
                </Flex>
              )}

              {/* Base URL */}
              {showBaseUrl && (
                <Flex vertical gap={4}>
                  <Text strong>Base URL</Text>
                  <Input
                    value={baseUrl}
                    onChange={(e) => {
                      setBaseUrl(e.target.value);
                      mark();
                    }}
                    placeholder={
                      provider === 'ollama'
                        ? 'http://localhost:11434'
                        : provider === 'portkey'
                          ? 'https://api.portkey.ai/v1'
                          : 'https://api.example.com'
                    }
                    style={{ maxWidth: 400 }}
                  />
                  {provider === 'portkey' && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Leave blank to use the official Portkey API (https://api.portkey.ai/v1). Enter a URL only to route
                      through a self-hosted Portkey gateway.
                    </Text>
                  )}
                </Flex>
              )}

              {/* Model */}
              {provider && (
                <Flex vertical gap={4}>
                  <Text strong>Model</Text>
                  <AutoComplete
                    value={model}
                    onChange={(value: string) => {
                      setModel(value);
                      mark();
                    }}
                    placeholder={DEFAULT_MODELS[provider] || 'Enter a model id'}
                    aria-label="AI Model"
                    style={{ maxWidth: 400 }}
                    allowClear
                    options={modelOptions}
                    showSearch={{
                      filterOption: (input, option) =>
                        !!option &&
                        (String(option.value).toLowerCase().includes(input.toLowerCase()) ||
                          (typeof option.label === 'string' &&
                            option.label.toLowerCase().includes(input.toLowerCase()))),
                    }}
                    notFoundContent={loadingModels ? <Spin size="small" /> : null}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {provider === 'portkey'
                      ? "Type any model id your gateway can route. 'default' uses the gateway-configured model."
                      : `Select a suggested model or type any model id. Default: ${DEFAULT_MODELS[provider]}`}
                  </Text>
                </Flex>
              )}

              {/* Token Rate Overrides */}
              {isConfigured && (
                <TokenRateEditor
                  defaultRates={defaultTokenRates}
                  customRates={customTokenRates}
                  orgModels={orgRateModels}
                  onChange={(rates) => {
                    setCustomTokenRates(rates);
                    mark();
                  }}
                />
              )}

              <Flex align="center" gap={12}>
                <CPButton
                  cpType="primary"
                  size="small"
                  onClick={saveConnection}
                  loading={isSaving}
                  disabled={!connectionDirty || isLoading}
                >
                  Save connection
                </CPButton>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {connectionDirty
                    ? 'Provider, key, URL, model and rates are saved together.'
                    : 'Provider, key, URL, model and rates — saved.'}
                </Text>
              </Flex>
            </>
          )}

          {/* ── Toggles — only show if AI is active (own key configured or org key in use) ── */}
          {(isConfigured || usingOrgSettings) && (
            <>
              <Card
                size="small"
                style={{
                  marginTop: 8,
                  background: aiDisabled ? '#fff2f0' : '#f6ffed',
                  borderColor: aiDisabled ? '#ffccc7' : '#b7eb8f',
                }}
              >
                <Flex justify="space-between" align="center">
                  <Flex vertical>
                    <Text strong style={{ color: aiDisabled ? '#cf1322' : undefined }}>
                      {aiDisabled ? 'Global AI Disabled' : 'Global AI Enabled'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {aiDisabled
                        ? 'Toggle on to re-enable all AI features. Your API key is preserved.'
                        : 'Toggle off to disable all AI features for this course.'}
                    </Text>
                  </Flex>
                  <Space size={8}>
                    <FieldStatusText status={fieldStatus.aiDisabled} />
                    <Switch
                      aria-label="Global AI"
                      checked={!aiDisabled}
                      loading={fieldStatus.aiDisabled?.state === 'saving'}
                      onChange={(checked) =>
                        void persist('aiDisabled', 'Global AI', { aiDisabled: !checked }, () => ({
                          aiDisabled: checked,
                        }))
                      }
                    />
                  </Space>
                </Flex>
              </Card>

              {!aiDisabled &&
                featureRegistry.map((feature) => {
                  const isEnabled = featureConfig[feature.key] ?? featureStatus[feature.key] ?? feature.defaultEnabled;
                  // A feature is forced on if another enabled feature requires it
                  const forcedOn =
                    !isEnabled &&
                    featureRegistry.some(
                      (other) =>
                        other.requires.includes(feature.key) &&
                        (featureConfig[other.key] ?? featureStatus[other.key] ?? other.defaultEnabled),
                    );
                  const effectiveEnabled = isEnabled || forcedOn;
                  const modelOverride = featureModels[feature.key];
                  return (
                    <Card
                      key={feature.key}
                      size="small"
                      style={{
                        marginTop: 4,
                        background: effectiveEnabled ? '#f6ffed' : '#fffbe6',
                        borderColor: effectiveEnabled ? '#b7eb8f' : '#ffe58f',
                      }}
                    >
                      <Flex justify="space-between" align="center">
                        <Flex vertical>
                          <Text strong style={{ color: effectiveEnabled ? undefined : '#ad6800' }}>
                            {feature.label}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {feature.description}
                          </Text>
                          {forcedOn && (
                            <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>
                              Required by other enabled features
                            </Text>
                          )}
                          {effectiveEnabled && (
                            <AutoComplete
                              allowClear
                              size="small"
                              value={modelOverride ?? ''}
                              onChange={(value: string) => {
                                setFeatureModels((prev) => {
                                  const next = { ...prev };
                                  if (value) next[feature.key] = value;
                                  else delete next[feature.key];
                                  return next;
                                });
                              }}
                              onSelect={(value: string) => commitFeatureModel(feature.key, feature.label, value)}
                              onClear={() => commitFeatureModel(feature.key, feature.label, '')}
                              onBlur={() =>
                                commitFeatureModel(feature.key, feature.label, featureModels[feature.key] ?? '')
                              }
                              placeholder={
                                featureModelsResolved[feature.key] && !modelOverride
                                  ? `Default (${featureModelsResolved[feature.key]})`
                                  : 'Default model'
                              }
                              aria-label={`Model for ${feature.label}`}
                              style={{ width: 320, marginTop: 8 }}
                              options={modelOptions}
                              showSearch={{
                                filterOption: (input, option) =>
                                  !!option &&
                                  (String(option.value).toLowerCase().includes(input.toLowerCase()) ||
                                    (typeof option.label === 'string' &&
                                      option.label.toLowerCase().includes(input.toLowerCase()))),
                              }}
                              notFoundContent={loadingModels ? <Spin size="small" /> : null}
                            />
                          )}
                        </Flex>
                        <Space size={8}>
                          <FieldStatusText status={fieldStatus[`feature:${feature.key}`]} />
                          <Switch
                            aria-label={feature.label}
                            checked={effectiveEnabled}
                            disabled={forcedOn}
                            loading={fieldStatus[`feature:${feature.key}`]?.state === 'saving'}
                            onChange={(checked) => persistFeature(feature.key, feature.label, checked)}
                          />
                        </Space>
                      </Flex>
                    </Card>
                  );
                })}
            </>
          )}

          {/* No AI configured and org doesn't offer one */}
          {!isConfigured && !orgAiAvailable && (
            <Alert
              type="warning"
              showIcon
              title="No AI configured"
              description="Configure an AI provider and API key above, or ask your organization admin to set up a shared org key."
            />
          )}
        </Flex>
      )}
      <AIProviderTestModal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        provider={usingOrgSettings ? undefined : provider}
        savedModel={usingOrgSettings ? undefined : model || undefined}
        modelOptions={modelOptions}
        loadingModels={loadingModels}
        runTest={(prompt, testModel) => AIUsageService.testCourseAI(courseId, prompt, testModel)}
      />
    </Card>
  );
};

function usingOwnSettingsLabel(useOwn: boolean): string {
  if (useOwn) return 'This course is using its own API key. Turn this off to use the organization key instead.';
  return 'Turn on to configure a separate API key for this course.';
}

export default AISettingsCard;
