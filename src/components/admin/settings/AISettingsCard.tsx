// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AISettingsCard Component
 *
 * Card component for managing course AI settings.
 * Shows org-level AI availability and lets course admins opt-in/out
 * of using their own credentials vs. inheriting from the organization.
 */

import * as React from 'react';
import { Alert, AutoComplete, Card, Flex, Input, message, Select, Space, Spin, Switch, Tooltip, Typography } from 'antd';
import { RobotOutlined, BankOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import TokenRateEditor from '../../core/TokenRateEditor';
import type { CustomTokenRates, DefaultTokenRates } from '../../core/TokenRateEditor';
import { AIUsageService } from '../../../services/aiUsage';
import type { AIFeatureEntry, AIFeatureConfig, AIFeatureStatus } from '../../../services/aiUsage';
import { AI_PROVIDERS, DEFAULT_MODELS } from '../../../utils/aiService';
import type { AIProvider } from '../../../utils/aiService';
import type { AIModel, AIProviderTestResult } from '../../../api-client';
import { usePermissionsStore } from '../../../stores/usePermissionsStore';

const { Text } = Typography;

interface IAISettingsCardProps {
  courseId: number;
}

const AISettingsCard: React.FC<IAISettingsCardProps> = ({ courseId }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testPrompt, setTestPrompt] = React.useState('');
  const [testResult, setTestResult] = React.useState<AIProviderTestResult | null>(null);

  // Org-level availability
  const [orgAiAvailable, setOrgAiAvailable] = React.useState(false);
  const [aiUseOwnSettings, setAiUseOwnSettings] = React.useState(false);

  // Course-own settings
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [aiDisabled, setAiDisabled] = React.useState(false);
  const [aiCommentsDisabled, setAiCommentsDisabled] = React.useState(false);
  const [isConfigured, setIsConfigured] = React.useState(false);
  const [provider, setProvider] = React.useState<AIProvider | undefined>(undefined);
  const [apiKey, setApiKey] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [model, setModel] = React.useState('');
  const [isDirty, setIsDirty] = React.useState(false);
  const [hasApiKey, setHasApiKey] = React.useState(false);
  const [apiKeyHint, setApiKeyHint] = React.useState<string | null>(null);
  const [customTokenRates, setCustomTokenRates] = React.useState<CustomTokenRates>({});
  const [defaultTokenRates, setDefaultTokenRates] = React.useState<DefaultTokenRates>({});

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
        setAiCommentsDisabled(settings.aiCommentsDisabled || false);
        setIsConfigured(!!settings.aiProvider);
        setProvider((settings.aiProvider as AIProvider | undefined) || undefined);
        setBaseUrl(settings.aiBaseUrl || '');
        setModel(settings.aiModel || '');
        setHasApiKey(settings.hasApiKey ?? false);
        setApiKeyHint(settings.apiKeyHint ?? null);
        setCustomTokenRates((settings.aiTokenRates as CustomTokenRates) ?? {});
        setDefaultTokenRates((settings.defaultTokenRates as DefaultTokenRates) ?? {});
        setFeatureRegistry(features);
        setFeatureConfig(((s.aiFeatureConfig as AIFeatureConfig) ?? {}) as AIFeatureConfig);
        setFeatureStatus(((s.aiFeatures as AIFeatureStatus) ?? {}) as AIFeatureStatus);
        setFeatureModels((s.aiFeatureModels as Record<string, string>) ?? {});
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

  const handleSave = async () => {
    setIsSaving(true);
    setTestResult(null);
    try {
      const result = await AIUsageService.updateCourseAISettings(courseId, {
        aiUseOwnSettings,
        aiProvider: provider || null,
        aiBaseUrl: baseUrl || null,
        aiModel: model || null,
        aiDisabled,
        aiCommentsDisabled,
        aiTokenRates: Object.keys(customTokenRates).length > 0 ? customTokenRates : {},
        aiFeatureConfig: featureConfig,
        aiFeatureModels: featureModels,
        ...(apiKey ? { aiApiKey: apiKey } : {}),
      } as Parameters<typeof AIUsageService.updateCourseAISettings>[1]);
      const r = result as unknown as Record<string, unknown>;
      setAiEnabled(result.aiEnabled);
      setAiDisabled(result.aiDisabled || false);
      setAiCommentsDisabled(result.aiCommentsDisabled || false);
      setIsConfigured(!!result.aiProvider);
      setAiUseOwnSettings(result.aiUseOwnSettings ?? false);
      setHasApiKey(result.hasApiKey ?? false);
      setFeatureConfig(((r.aiFeatureConfig as AIFeatureConfig) ?? {}) as AIFeatureConfig);
      setFeatureStatus(((r.aiFeatures as AIFeatureStatus) ?? {}) as AIFeatureStatus);
      setFeatureModels((r.aiFeatureModels as Record<string, string>) ?? {});
      setFeatureModelsResolved((r.aiFeatureModelsResolved as Record<string, string>) ?? {});
      setApiKey('');
      setIsDirty(false);
      // Feature toggles feed capabilities (e.g. generate_ai_quiz_questions), so drop the
      // cached ones or AI buttons stay visible until the next reload.
      usePermissionsStore.getState().invalidateCourse(courseId);
      message.success('AI settings saved!');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save AI settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await AIUsageService.testCourseAI(courseId, testPrompt.trim() || undefined));
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const mark = () => setIsDirty(true);

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
        <Space>
          <Input
            size="small"
            placeholder="Optional test prompt"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            onPressEnter={() => {
              if (!isDirty && !isLoading && !testing) handleTest();
            }}
            maxLength={500}
            allowClear
            style={{ width: 200 }}
          />
          <Tooltip
            title={
              isDirty
                ? 'Save your changes first — the test runs against saved settings'
                : 'Send a small test request to your AI provider'
            }
          >
            <CPButton size="small" onClick={handleTest} loading={testing} disabled={isDirty || isLoading}>
              Test
            </CPButton>
          </Tooltip>
          <CPButton
            cpType="primary"
            size="small"
            onClick={handleSave}
            loading={isSaving}
            disabled={!isDirty || isLoading}
          >
            Save AI Settings
          </CPButton>
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      {isLoading ? (
        <Text type="secondary">Loading AI settings...</Text>
      ) : (
        <Flex vertical gap={16}>
          {testResult && (
            <Alert
              type={testResult.success ? 'success' : 'error'}
              showIcon
              closable={{ onClose: () => setTestResult(null) }}
              title={
                testResult.success
                  ? `Connection OK — ${testResult.provider} / ${testResult.model} responded in ${testResult.latencyMs} ms`
                  : `Connection failed — ${testResult.error}`
              }
              description={
                <Flex vertical gap={2}>
                  {testResult.requestSystemPrompt && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Sent (system): {testResult.requestSystemPrompt}
                    </Text>
                  )}
                  {testResult.requestUserPrompt && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Sent (user): {testResult.requestUserPrompt}
                    </Text>
                  )}
                  {testResult.success && testResult.reportedModel && testResult.reportedModel !== testResult.model && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Provider reported model: {testResult.reportedModel}
                    </Text>
                  )}
                  {testResult.success && testResult.response && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Generated: {testResult.response}
                    </Text>
                  )}
                  {!testResult.success && testResult.errorDetail && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {testResult.errorDetail}
                    </Text>
                  )}
                </Flex>
              }
            />
          )}
          <Text type="secondary" style={{ marginBottom: 8 }}>
            Enable AI for this course. The global toggle controls all AI features, and each feature can be toggled
            individually below.
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
                <Switch
                  size="small"
                  checked={!aiUseOwnSettings}
                  onChange={(checked) => {
                    setAiUseOwnSettings(!checked);
                    mark();
                  }}
                />
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
                      Leave blank to use the official Portkey API (https://api.portkey.ai/v1). Enter a URL only to
                      route through a self-hosted Portkey gateway.
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
                  onChange={(rates) => {
                    setCustomTokenRates(rates);
                    mark();
                  }}
                />
              )}
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
                  <Switch
                    checked={!aiDisabled}
                    onChange={(checked) => {
                      setAiDisabled(!checked);
                      mark();
                    }}
                  />
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
                                mark();
                              }}
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
                        <Switch
                          checked={effectiveEnabled}
                          disabled={forcedOn}
                          onChange={(checked) => {
                            setFeatureConfig((prev) => ({ ...prev, [feature.key]: checked }));
                            mark();
                          }}
                        />
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
    </Card>
  );
};

function usingOwnSettingsLabel(useOwn: boolean): string {
  if (useOwn) return 'This course is using its own API key. Turn this off to use the organization key instead.';
  return 'Turn on to configure a separate API key for this course.';
}

export default AISettingsCard;
