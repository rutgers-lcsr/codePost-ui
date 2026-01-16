/**
 * AISettingsCard Component
 *
 * Card component for managing AI comment generation settings for a course.
 * Separated from CourseSettingsPanel for better maintainability.
 */

import * as React from 'react';
import { Card, Flex, Input, message, Select, Space, Switch, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import {
  getCourseAISettings,
  updateCourseAISettings,
  AI_PROVIDERS,
  DEFAULT_MODELS,
} from '../../../infrastructure/aiService';
import type { AIProvider } from '../../../infrastructure/aiService';

const { Text } = Typography;

interface IAISettingsCardProps {
  courseId: number;
}

const AISettingsCard: React.FC<IAISettingsCardProps> = ({ courseId }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [aiDisabled, setAiDisabled] = React.useState(false);
  const [isConfigured, setIsConfigured] = React.useState(false); // Has provider + API key
  const [provider, setProvider] = React.useState<AIProvider | undefined>(undefined);
  const [apiKey, setApiKey] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [model, setModel] = React.useState('');
  const [isDirty, setIsDirty] = React.useState(false);

  // Fetch AI settings on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getCourseAISettings(courseId);
        setAiEnabled(settings.ai_enabled);
        setAiDisabled(settings.ai_disabled || false);
        setIsConfigured(!!settings.ai_provider); // We know it's configured if provider is set
        setProvider((settings.ai_provider as AIProvider) || undefined);
        setBaseUrl(settings.ai_base_url || '');
        setModel(settings.ai_model || '');
      } catch (error) {
        console.error('Failed to fetch AI settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [courseId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Always send all fields - use null/empty to clear values when provider is removed
      const settings: Parameters<typeof updateCourseAISettings>[1] = {
        ai_provider: provider || null,
        ai_base_url: baseUrl || null,
        ai_model: model || null,
        ai_disabled: aiDisabled,
      };
      // Only include API key if user entered a new one
      if (apiKey) settings.ai_api_key = apiKey;

      const result = await updateCourseAISettings(courseId, settings);
      setAiEnabled(result.ai_enabled);
      setIsConfigured(!!result.ai_provider);
      setApiKey(''); // Clear API key from form after save (for security)
      setIsDirty(false);
      message.success('AI settings saved!');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save AI settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderChange = (value: AIProvider) => {
    setProvider(value);
    setModel(DEFAULT_MODELS[value] || '');
    setIsDirty(true);
  };

  const handleProviderClear = () => {
    setProvider(undefined);
    setModel('');
    setBaseUrl('');
    setIsDirty(true);
  };

  const showBaseUrl = provider === 'ollama' || provider === 'custom';

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>AI Comment Generation</span>
          {isConfigured && (
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
            Enable AI-powered comment generation for graders. Configure an API key to allow graders to generate feedback
            suggestions when leaving comments on student code.
          </Text>

          {/* Provider */}
          <Flex vertical gap={4}>
            <Text strong>AI Provider</Text>
            <label htmlFor="ai-provider-select" className="sr-only">AI Provider</label>
            <Select
              id="ai-provider-select"
              value={provider}
              onChange={handleProviderChange}
              onClear={handleProviderClear}
              placeholder="Select a provider"
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
              <Text strong>API Key</Text>
              <label htmlFor="ai-api-key" className="sr-only">API Key</label>
              <Input.Password
                id="ai-api-key"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={aiEnabled ? '••••••••  (key saved, enter new key to update)' : 'Enter API key'}
                style={{ maxWidth: 400 }}
              />
            </Flex>
          )}

          {/* Base URL (for Ollama/Custom) */}
          {showBaseUrl && (
            <Flex vertical gap={4}>
              <Text strong>Base URL</Text>
              <label htmlFor="ai-base-url" className="sr-only">Base URL</label>
              <Input
                id="ai-base-url"
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com'}
                style={{ maxWidth: 400 }}
              />
            </Flex>
          )}

          {/* Model */}
          {provider && (
            <Flex vertical gap={4}>
              <Text strong>Model</Text>
              <label htmlFor="ai-model" className="sr-only">Model</label>
              <Input
                id="ai-model"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={DEFAULT_MODELS[provider] || 'default'}
                style={{ maxWidth: 300 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Leave blank to use default: {DEFAULT_MODELS[provider]}
              </Text>
            </Flex>
          )}

          {/* Disable Toggle - only show if AI is configured */}
          {isConfigured && (
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
                    {aiDisabled ? 'AI Generation Disabled' : 'AI Generation Enabled'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {aiDisabled
                      ? 'Toggle on to re-enable AI features. Your API key is preserved.'
                      : 'Toggle off to disable AI features.'}
                  </Text>
                </Flex>
                <label htmlFor="ai-disable-toggle" className="sr-only">Toggle AI Generation</label>
                <Switch
                  id="ai-disable-toggle"
                  checked={!aiDisabled}
                  onChange={(checked) => {
                    setAiDisabled(!checked);
                    setIsDirty(true);
                  }}
                />
              </Flex>
            </Card>
          )}
        </Flex>
      )
      }
    </Card >
  );
};

export default AISettingsCard;
