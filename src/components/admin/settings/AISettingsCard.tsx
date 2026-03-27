// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AISettingsCard Component
 *
 * Card component for managing course AI settings.
 * Shows org-level AI availability and lets course admins opt-in/out
 * of using their own credentials vs. inheriting from the organization.
 */

import * as React from 'react';
import { Alert, Card, Flex, Input, message, Select, Space, Spin, Switch, Typography } from 'antd';
import { RobotOutlined, BankOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import TokenRateEditor from '../../core/TokenRateEditor';
import type { CustomTokenRates, DefaultTokenRates } from '../../core/TokenRateEditor';
import { AIUsageService } from '../../../services/aiUsage';
import { AI_PROVIDERS, DEFAULT_MODELS } from '../../../utils/aiService';
import type { AIProvider } from '../../../utils/aiService';
import type { AIModel } from '../../../api-client';

const { Text } = Typography;

interface IAISettingsCardProps {
  courseId: number;
}

const AISettingsCard: React.FC<IAISettingsCardProps> = ({ courseId }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Org-level availability
  const [orgAiAvailable, setOrgAiAvailable] = React.useState(false);
  const [aiUseOwnSettings, setAiUseOwnSettings] = React.useState(false);

  // Course-own settings
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [aiDisabled, setAiDisabled] = React.useState(false);
  const [aiCommentsEnabled, setAiCommentsEnabled] = React.useState(false);
  const [aiCommentsDisabled, setAiCommentsDisabled] = React.useState(false);
  const [aiChatEnabled, setAiChatEnabled] = React.useState(false);
  const [aiChatDisabled, setAiChatDisabled] = React.useState(false);
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

  // Model dropdown
  const [modelOptions, setModelOptions] = React.useState<{ label: string; value: string }[]>([]);
  const [loadingModels, setLoadingModels] = React.useState(false);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await AIUsageService.getCourseAISettings(courseId);
        setOrgAiAvailable(settings.orgAiAvailable ?? false);
        setAiUseOwnSettings(settings.aiUseOwnSettings ?? false);
        setAiEnabled(settings.aiEnabled);
        setAiDisabled(settings.aiDisabled || false);
        setAiCommentsEnabled(settings.aiCommentsEnabled ?? false);
        setAiCommentsDisabled(settings.aiCommentsDisabled || false);
        setAiChatEnabled(settings.aiChatEnabled ?? false);
        setAiChatDisabled(settings.aiChatDisabled || false);
        setIsConfigured(!!settings.aiProvider);
        setProvider((settings.aiProvider as AIProvider | undefined) || undefined);
        setBaseUrl(settings.aiBaseUrl || '');
        setModel(settings.aiModel || '');
        setHasApiKey(settings.hasApiKey ?? false);
        setApiKeyHint(settings.apiKeyHint ?? null);
        setCustomTokenRates((settings.aiTokenRates as CustomTokenRates) ?? {});
        setDefaultTokenRates((settings.defaultTokenRates as DefaultTokenRates) ?? {});
      } catch (error) {
        console.error('Failed to fetch AI settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [courseId]);

  // Fetch curated + live models when provider changes
  React.useEffect(() => {
    if (!provider) {
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

    const curatedPromise = AIUsageService.getModels(provider)
      .then((res) => res.providers?.[0]?.models ?? [])
      .catch(() => [] as AIModel[]);

    const livePromise = AIUsageService.getCourseModels(courseId)
      .then((res) => {
        const provData = res.providers?.[0];
        if (provData?.liveError) {
          console.warn('Live model fetch warning:', provData.liveError);
        }
        return provData?.liveModels ?? [];
      })
      .catch(() => [] as AIModel[]);

    Promise.all([curatedPromise, livePromise]).then(([curated, live]) => {
      setModelOptions(buildOptions(curated, live));
      setLoadingModels(false);
    });
  }, [provider, courseId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await AIUsageService.updateCourseAISettings(courseId, {
        aiUseOwnSettings,
        aiProvider: provider || null,
        aiBaseUrl: baseUrl || null,
        aiModel: model || null,
        aiDisabled,
        aiCommentsDisabled,
        aiChatDisabled,
        aiTokenRates: Object.keys(customTokenRates).length > 0 ? customTokenRates : {},
        ...(apiKey ? { aiApiKey: apiKey } : {}),
      });
      setAiEnabled(result.aiEnabled);
      setAiDisabled(result.aiDisabled || false);
      setAiCommentsEnabled(result.aiCommentsEnabled ?? false);
      setAiCommentsDisabled(result.aiCommentsDisabled || false);
      setAiChatEnabled(result.aiChatEnabled ?? false);
      setAiChatDisabled(result.aiChatDisabled || false);
      setIsConfigured(!!result.aiProvider);
      setAiUseOwnSettings(result.aiUseOwnSettings ?? false);
      setHasApiKey(result.hasApiKey ?? false);
      setApiKey('');
      setIsDirty(false);
      message.success('AI settings saved!');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save AI settings');
    } finally {
      setIsSaving(false);
    }
  };

  const mark = () => setIsDirty(true);

  const showBaseUrl = provider === 'ollama' || provider === 'portkey' || provider === 'custom';

  // When using org settings, we don't show the course-specific key fields
  const usingOrgSettings = orgAiAvailable && !aiUseOwnSettings;

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
        <CPButton
          cpType="primary"
          size="small"
          onClick={handleSave}
          loading={isSaving}
          disabled={!isDirty || isLoading}
        >
          Save AI Settings
        </CPButton>
      }
      style={{ marginBottom: 24, maxWidth: 800 }}
    >
      {isLoading ? (
        <Text type="secondary">Loading AI settings...</Text>
      ) : (
        <Flex vertical gap={16}>
          <Text type="secondary" style={{ marginBottom: 8 }}>
            Enable AI for this course. The global toggle controls all AI features (including test/script generation),
            while comment generation can be toggled separately for the code console.
          </Text>

          {/* ── Org AI banner ── */}
          {orgAiAvailable && (
            <Alert
              type="info"
              showIcon
              icon={<BankOutlined />}
              message={
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
                      For self-hosted Portkey gateway, the API key is optional. If provided, it is sent as the
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
                          ? 'http://portkey-gateway.example.com:8787'
                          : 'https://api.example.com'
                    }
                    style={{ maxWidth: 400 }}
                  />
                </Flex>
              )}

              {/* Model */}
              {/* Model */}
              {provider && (
                <Flex vertical gap={4}>
                  <Text strong>Model</Text>
                  <Select
                    showSearch
                    value={model || undefined}
                    onChange={(value) => {
                      setModel(value);
                      mark();
                    }}
                    placeholder={DEFAULT_MODELS[provider] || 'Select a model'}
                    style={{ maxWidth: 400 }}
                    loading={loadingModels}
                    notFoundContent={loadingModels ? <Spin size="small" /> : 'No models found'}
                    options={modelOptions}
                    filterOption={(input, option) =>
                      !!option &&
                      (option.value.toLowerCase().includes(input.toLowerCase()) ||
                        (typeof option.label === 'string' && option.label.toLowerCase().includes(input.toLowerCase())))
                    }
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Default: {DEFAULT_MODELS[provider]}
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
                      setAiCommentsEnabled(checked && !aiCommentsDisabled);
                      setAiChatEnabled(checked && !aiChatDisabled);
                      mark();
                    }}
                  />
                </Flex>
              </Card>

              <Card
                size="small"
                style={{
                  marginTop: 8,
                  background: aiCommentsEnabled ? '#f6ffed' : '#fffbe6',
                  borderColor: aiCommentsEnabled ? '#b7eb8f' : '#ffe58f',
                }}
              >
                <Flex justify="space-between" align="center">
                  <Flex vertical>
                    <Text strong style={{ color: aiCommentsEnabled ? undefined : '#ad6800' }}>
                      {aiCommentsEnabled ? 'Comment Generation Enabled' : 'Comment Generation Disabled'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {aiDisabled
                        ? 'Global AI is off, so comment generation is currently unavailable.'
                        : 'Controls the "Generate with AI" button in the code console.'}
                    </Text>
                  </Flex>
                  <Switch
                    checked={!aiCommentsDisabled}
                    onChange={(checked) => {
                      setAiCommentsDisabled(!checked);
                      setAiCommentsEnabled(checked && !aiDisabled);
                      mark();
                    }}
                  />
                </Flex>
              </Card>

              <Card
                size="small"
                style={{
                  marginTop: 8,
                  background: aiChatEnabled ? '#f6ffed' : '#fffbe6',
                  borderColor: aiChatEnabled ? '#b7eb8f' : '#ffe58f',
                }}
              >
                <Flex justify="space-between" align="center">
                  <Flex vertical>
                    <Text strong style={{ color: aiChatEnabled ? undefined : '#ad6800' }}>
                      {aiChatEnabled ? 'AI Chat Assistant Enabled' : 'AI Chat Assistant Disabled'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {aiDisabled
                        ? 'Global AI is off, so the AI chat assistant is currently unavailable.'
                        : 'Controls the AI chat assistant in the code review panel.'}
                    </Text>
                  </Flex>
                  <Switch
                    checked={!aiChatDisabled}
                    onChange={(checked) => {
                      setAiChatDisabled(!checked);
                      setAiChatEnabled(checked && !aiDisabled);
                      mark();
                    }}
                  />
                </Flex>
              </Card>
            </>
          )}

          {/* No AI configured and org doesn't offer one */}
          {!isConfigured && !orgAiAvailable && (
            <Alert
              type="warning"
              showIcon
              message="No AI configured"
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
