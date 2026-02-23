// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AISettingsCard Component
 *
 * Card component for managing course AI settings.
 * Separated from CourseSettingsPanel for better maintainability.
 */

import * as React from 'react';
import { Card, Flex, Input, message, Select, Space, Switch, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import { getCourseAISettings, updateCourseAISettings, AI_PROVIDERS, DEFAULT_MODELS } from '../../../utils/aiService';
import type { AIProvider } from '../../../utils/aiService';

const { Text } = Typography;

interface IAISettingsCardProps {
  courseId: number;
}

const AISettingsCard: React.FC<IAISettingsCardProps> = ({ courseId }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [aiDisabled, setAiDisabled] = React.useState(false);
  const [aiCommentsEnabled, setAiCommentsEnabled] = React.useState(false);
  const [aiCommentsDisabled, setAiCommentsDisabled] = React.useState(false);
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
        setAiEnabled(settings.aiEnabled);
        setAiDisabled(settings.aiDisabled || false);
        setAiCommentsEnabled(settings.aiCommentsEnabled ?? settings.aiEnabled ?? false);
        setAiCommentsDisabled(settings.aiCommentsDisabled || false);
        setIsConfigured(!!settings.aiProvider); // We know it's configured if provider is set
        setProvider((settings.aiProvider as AIProvider) || undefined);
        setBaseUrl(settings.aiBaseUrl || '');
        setModel(settings.aiModel || '');
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
        aiProvider: provider || null,
        aiBaseUrl: baseUrl || null,
        aiModel: model || null,
        aiDisabled: aiDisabled,
        aiCommentsDisabled: aiCommentsDisabled,
      };
      // Only include API key if user entered a new one
      if (apiKey) settings.aiApiKey = apiKey;

      const result = await updateCourseAISettings(courseId, settings);
      setAiEnabled(result.aiEnabled);
      setAiDisabled(result.aiDisabled || false);
      setAiCommentsEnabled(result.aiCommentsEnabled ?? false);
      setAiCommentsDisabled(result.aiCommentsDisabled || false);
      setIsConfigured(!!result.aiProvider);
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
          <span>AI Features</span>
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
            Enable AI for this course. The global toggle controls all AI features (including test/script generation),
            while comment generation can be toggled separately for the code console.
          </Text>

          {/* Provider */}
          <Flex vertical gap={4}>
            <Text strong>AI Provider</Text>
            <label htmlFor="ai-provider-select" className="sr-only">
              AI Provider
            </label>
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
              <label htmlFor="ai-api-key" className="sr-only">
                API Key
              </label>
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
              <label htmlFor="ai-base-url" className="sr-only">
                Base URL
              </label>
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
              <label htmlFor="ai-model" className="sr-only">
                Model
              </label>
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

          {/* Global AI toggle - only show if AI is configured */}
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
                    {aiDisabled ? 'Global AI Disabled' : 'Global AI Enabled'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {aiDisabled
                      ? 'Toggle on to re-enable all AI features. Your API key is preserved.'
                      : 'Toggle off to disable all AI features for this course.'}
                  </Text>
                </Flex>
                <label htmlFor="ai-disable-toggle" className="sr-only">
                  Toggle Global AI
                </label>
                <Switch
                  id="ai-disable-toggle"
                  checked={!aiDisabled}
                  onChange={(checked) => {
                    setAiDisabled(!checked);
                    setAiCommentsEnabled(checked && !aiCommentsDisabled);
                    setIsDirty(true);
                  }}
                />
              </Flex>
            </Card>
          )}

          {/* Comment generation toggle - only show if AI is configured */}
          {isConfigured && (
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
                <label htmlFor="ai-comments-toggle" className="sr-only">
                  Toggle AI Comment Generation
                </label>
                <Switch
                  id="ai-comments-toggle"
                  checked={!aiCommentsDisabled}
                  onChange={(checked) => {
                    setAiCommentsDisabled(!checked);
                    setAiCommentsEnabled(checked && !aiDisabled);
                    setIsDirty(true);
                  }}
                />
              </Flex>
            </Card>
          )}
        </Flex>
      )}
    </Card>
  );
};

export default AISettingsCard;
