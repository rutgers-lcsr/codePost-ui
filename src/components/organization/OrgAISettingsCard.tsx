// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * OrgAISettingsCard
 *
 * Allows org admins to configure the organization-level AI API key and policy.
 * Controls:
 *   - Provider / API key / base URL / model
 *   - Global AI on/off for the org
 *   - Course policy: all courses, selected courses, or none
 *   - When "selected": multi-select of which courses to enable
 */

import React from 'react';
import { Alert, Card, Flex, Input, message, Select, Space, Spin, Switch, Tag, Transfer, Typography } from 'antd';
import { RobotOutlined, LockOutlined } from '@ant-design/icons';
import CPButton from '../core/CPButton';
import TokenRateEditor from '../core/TokenRateEditor';
import type { CustomTokenRates, DefaultTokenRates } from '../core/TokenRateEditor';
import { AI_PROVIDERS, DEFAULT_MODELS } from '../../utils/aiService';
import type { AIProvider } from '../../utils/aiService';
import { AiCoursePolicyEnum, PatchedOrganizationAISettingsUpdateAiProviderEnum } from '../../api-client';
import type { AIModel } from '../../api-client';
import { AIUsageService } from '../../services/aiUsage';
import type { Course } from '../../api-client';

const { Text } = Typography;

interface OrgAISettingsCardProps {
  orgId: number;
  /** List of courses in the org for the "selected" policy picker */
  courses: Course[];
}

const OrgAISettingsCard: React.FC<OrgAISettingsCardProps> = ({ orgId, courses }) => {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  // Settings state
  const [provider, setProvider] = React.useState<AIProvider | undefined>(undefined);
  const [apiKey, setApiKey] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [model, setModel] = React.useState('');
  const [aiDisabled, setAiDisabled] = React.useState(false);
  const [aiCommentsDisabled, setAiCommentsDisabled] = React.useState(false);
  const [coursePolicy, setCoursePolicy] = React.useState<AiCoursePolicyEnum>(AiCoursePolicyEnum.None);
  const [enabledCourseIds, setEnabledCourseIds] = React.useState<number[]>([]);
  const [hasApiKey, setHasApiKey] = React.useState(false);
  const [apiKeyHint, setApiKeyHint] = React.useState<string | null>(null);
  const [customTokenRates, setCustomTokenRates] = React.useState<CustomTokenRates>({});
  const [defaultTokenRates, setDefaultTokenRates] = React.useState<DefaultTokenRates>({});

  // Model dropdown
  const [modelOptions, setModelOptions] = React.useState<{ label: string; value: string }[]>([]);
  const [loadingModels, setLoadingModels] = React.useState(false);

  // Derived
  const isConfigured = !!provider;
  const showBaseUrl = provider === 'ollama' || provider === 'portkey' || provider === 'custom';

  React.useEffect(() => {
    const load = async () => {
      try {
        const s = await AIUsageService.getOrgAISettings(orgId);
        setProvider((s.aiProvider as AIProvider | undefined) ?? undefined);
        setBaseUrl(s.aiBaseUrl ?? '');
        setModel(s.aiModel ?? '');
        setAiDisabled(s.aiDisabled ?? false);
        setAiCommentsDisabled(s.aiCommentsDisabled ?? false);
        setCoursePolicy(s.aiCoursePolicy ?? AiCoursePolicyEnum.None);
        setEnabledCourseIds(s.aiEnabledCourseIds ?? []);
        setHasApiKey(s.hasApiKey ?? false);
        setApiKeyHint(s.apiKeyHint ?? null);
        setCustomTokenRates((s.aiTokenRates as CustomTokenRates) ?? {});
        setDefaultTokenRates((s.defaultTokenRates as DefaultTokenRates) ?? {});
      } catch {
        message.error('Failed to load organization AI settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId]);

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
          opts.push({ label: `${m.name}${m.isDefault ? ' ★' : ''}`, value: m.id });
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

    // Fetch curated list first, then try live provider query in parallel
    const curatedPromise = AIUsageService.getModels(provider)
      .then((res) => res.providers?.[0]?.models ?? [])
      .catch(() => [] as AIModel[]);

    const livePromise = AIUsageService.getOrgModels(orgId)
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
  }, [provider, orgId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await AIUsageService.updateOrgAISettings(orgId, {
        aiProvider: (provider as PatchedOrganizationAISettingsUpdateAiProviderEnum | undefined) ?? null,
        aiBaseUrl: baseUrl || null,
        aiModel: model || null,
        aiDisabled,
        aiCommentsDisabled,
        aiCoursePolicy: coursePolicy,
        aiEnabledCourseIds: coursePolicy === AiCoursePolicyEnum.Selected ? enabledCourseIds : [],
        aiTokenRates: Object.keys(customTokenRates).length > 0 ? customTokenRates : {},
        ...(apiKey ? { aiApiKey: apiKey } : {}),
      });
      setApiKey('');
      setIsDirty(false);
      message.success('Organization AI settings saved!');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const mark = () => setIsDirty(true);

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>Organization AI Settings</span>
          {isConfigured && (
            <Text type={aiDisabled ? 'danger' : 'success'} style={{ fontSize: 12 }}>
              {aiDisabled ? '(Disabled)' : '(Enabled)'}
            </Text>
          )}
        </Space>
      }
      extra={
        <CPButton cpType="primary" size="small" onClick={handleSave} loading={saving} disabled={!isDirty || loading}>
          Save
        </CPButton>
      }
      style={{ marginBottom: 24, maxWidth: 860 }}
    >
      {loading ? (
        <Text type="secondary">Loading…</Text>
      ) : (
        <Flex vertical gap={20}>
          <Text type="secondary">
            Configure a shared AI API key for this organization. Courses can use these credentials or provide their own.
            The course policy controls which courses have access to the organization key.
          </Text>

          {/* ── Provider ── */}
          <Flex vertical gap={4}>
            <Text strong>AI Provider</Text>
            <Select
              value={provider}
              onChange={(v: AIProvider) => {
                setProvider(v);
                setModel(DEFAULT_MODELS[v] || '');
                mark();
              }}
              onClear={() => {
                setProvider(undefined);
                setModel('');
                setBaseUrl('');
                mark();
              }}
              allowClear
              placeholder="Select a provider"
              style={{ width: 250 }}
            >
              {AI_PROVIDERS.map((p) => (
                <Select.Option key={p.value} value={p.value}>
                  {p.label}
                </Select.Option>
              ))}
            </Select>
          </Flex>

          {/* ── API Key ── */}
          {provider && (
            <Flex vertical gap={4}>
              <Text strong>
                <LockOutlined /> API Key{' '}
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
                placeholder={hasApiKey ? '••••••••  (key saved — enter new key to update)' : 'Enter API key'}
                style={{ maxWidth: 420 }}
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

          {/* ── Base URL ── */}
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
                style={{ maxWidth: 420 }}
              />
            </Flex>
          )}

          {/* ── Model ── */}
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

          {/* ── Token Rate Overrides ── */}
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

          {/* ── Toggles (only when configured) ── */}
          {isConfigured && (
            <>
              <Card
                size="small"
                style={{
                  background: aiDisabled ? '#fff2f0' : '#f6ffed',
                  borderColor: aiDisabled ? '#ffccc7' : '#b7eb8f',
                }}
              >
                <Flex justify="space-between" align="center">
                  <Flex vertical>
                    <Text strong style={{ color: aiDisabled ? '#cf1322' : undefined }}>
                      {aiDisabled ? 'Global AI Disabled for Org' : 'Global AI Enabled for Org'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Disabling here overrides all course AI regardless of individual course settings.
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

              <Card
                size="small"
                style={{
                  background: !aiCommentsDisabled ? '#f6ffed' : '#fffbe6',
                  borderColor: !aiCommentsDisabled ? '#b7eb8f' : '#ffe58f',
                }}
              >
                <Flex justify="space-between" align="center">
                  <Flex vertical>
                    <Text strong>Comment Generation Default</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Whether AI comment generation is enabled by default for courses using the org key.
                    </Text>
                  </Flex>
                  <Switch
                    checked={!aiCommentsDisabled}
                    onChange={(checked) => {
                      setAiCommentsDisabled(!checked);
                      mark();
                    }}
                  />
                </Flex>
              </Card>
            </>
          )}

          {/* ── Course Policy ── */}
          <Flex vertical gap={8}>
            <Text strong>Course Access Policy</Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Controls which courses in this organization can use the org-level AI key.
            </Text>
            <Select
              value={coursePolicy}
              onChange={(v) => {
                setCoursePolicy(v);
                mark();
              }}
              style={{ width: 300 }}
            >
              <Select.Option value={AiCoursePolicyEnum.All}>
                All courses (every course can inherit org AI)
              </Select.Option>
              <Select.Option value={AiCoursePolicyEnum.Selected}>Selected courses only</Select.Option>
              <Select.Option value={AiCoursePolicyEnum.None}>No courses (org key disabled)</Select.Option>
            </Select>

            {coursePolicy === AiCoursePolicyEnum.All && (
              <Alert
                type="info"
                showIcon
                message="All courses can use the organization AI key unless they configure their own settings."
              />
            )}

            {coursePolicy === AiCoursePolicyEnum.Selected && (
              <Flex vertical gap={8}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Select which courses are permitted to use the org AI key:
                </Text>
                <Transfer
                  dataSource={courses.map((c) => ({
                    key: String(c.id),
                    title: `${c.name}${c.period ? ` (${c.period})` : ''}`,
                  }))}
                  targetKeys={enabledCourseIds.map(String)}
                  onChange={(nextTargetKeys) => {
                    setEnabledCourseIds((nextTargetKeys as string[]).map(Number));
                    mark();
                  }}
                  render={(item) => item.title ?? ''}
                  titles={['Available', 'Enabled']}
                  listStyle={{ width: 280, height: 260 }}
                  showSearch
                  filterOption={(input, item) => (item.title ?? '').toLowerCase().includes(input.toLowerCase())}
                />
                <Flex gap={8} wrap="wrap">
                  {enabledCourseIds.map((id) => {
                    const c = courses.find((cr) => cr.id === id);
                    return c ? (
                      <Tag
                        key={id}
                        closable
                        onClose={() => {
                          setEnabledCourseIds((prev) => prev.filter((x) => x !== id));
                          mark();
                        }}
                        color="blue"
                      >
                        {c.name}
                      </Tag>
                    ) : null;
                  })}
                </Flex>
              </Flex>
            )}

            {coursePolicy === AiCoursePolicyEnum.None && (
              <Alert
                type="warning"
                showIcon
                message="No courses can use the organization AI key. Courses must configure their own API keys."
              />
            )}
          </Flex>
        </Flex>
      )}
    </Card>
  );
};

export default OrgAISettingsCard;
