// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AIProviderTestModal
 *
 * Modal for firing a live connection test against an AI provider config.
 * Shared by the course (AISettingsCard) and organization (OrgAISettingsCard)
 * settings cards; the parent supplies a runTest closure over the relevant
 * endpoint plus the model options it already loaded.
 */

import * as React from 'react';
import { AutoComplete, Badge, Collapse, Divider, Empty, Flex, Input, Modal, Space, Spin, Tag, Typography, message } from 'antd';
import { ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import CPButton from './CPButton';
import type { AIProviderTestResult } from '../../api-client';

const { Text } = Typography;

const PRE_STYLE: React.CSSProperties = {
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

interface IAIProviderTestModalProps {
  open: boolean;
  onClose: () => void;
  /** Effective provider id; undefined when the course inherits org settings. */
  provider?: string;
  /** Saved model; seeds the model field. Undefined => inherited/effective model. */
  savedModel?: string;
  modelOptions: { label: string; value: string }[];
  loadingModels?: boolean;
  /** Fires the test; prompt/model omitted when blank. */
  runTest: (prompt?: string, model?: string) => Promise<AIProviderTestResult>;
}

const AIProviderTestModal: React.FC<IAIProviderTestModalProps> = ({
  open,
  onClose,
  provider,
  savedModel,
  modelOptions,
  loadingModels,
  runTest,
}) => {
  const [model, setModel] = React.useState('');
  const [prompt, setPrompt] = React.useState('');
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<AIProviderTestResult | null>(null);

  // destroyOnHidden only unmounts the modal body, not this component's
  // hooks — reset explicitly on open.
  React.useEffect(() => {
    if (open) {
      setModel(savedModel ?? '');
      setPrompt('');
      setResult(null);
      setRunning(false);
    }
  }, [open, savedModel]);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      setResult(await runTest(prompt.trim() || undefined, model.trim() || undefined));
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ExperimentOutlined />
          <span>Test AI Provider</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <Flex vertical gap={12}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Testing against {provider || 'inherited organization settings'}
          {savedModel ? ` · saved model: ${savedModel}` : ''}
        </Text>

        {/* Model override */}
        <Flex vertical gap={4}>
          <Text strong>Model</Text>
          <AutoComplete
            value={model}
            onChange={(value: string) => setModel(value)}
            placeholder={savedModel || 'Effective saved model'}
            aria-label="Test model"
            allowClear
            options={modelOptions}
            showSearch={{
              filterOption: (input, option) =>
                !!option &&
                (String(option.value).toLowerCase().includes(input.toLowerCase()) ||
                  (typeof option.label === 'string' && option.label.toLowerCase().includes(input.toLowerCase()))),
            }}
            notFoundContent={loadingModels ? <Spin size="small" /> : null}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Runs the test with this model without saving it. Leave blank to use the saved model.
          </Text>
        </Flex>

        {/* Prompt */}
        <Flex vertical gap={4}>
          <Text strong>Prompt</Text>
          <Input.TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Optional — leave blank for a connectivity ping (the model is asked to reply 'OK')"
            aria-label="Test prompt"
            autoSize={{ minRows: 2, maxRows: 6 }}
            maxLength={500}
            showCount
          />
        </Flex>

        <Flex justify="flex-end">
          <CPButton cpType="primary" icon={<ThunderboltOutlined />} onClick={handleRun} loading={running}>
            Run test
          </CPButton>
        </Flex>

        <Divider style={{ margin: '4px 0' }} />

        {/* Result area */}
        {running ? (
          <Flex align="center" gap={8} style={{ padding: 16 }} role="status">
            <Spin />
            <Text type="secondary">Contacting provider…</Text>
          </Flex>
        ) : !result ? (
          <Empty description="No test run yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 8 }} />
        ) : (
          <Flex vertical gap={12}>
            <Flex align="center" gap={8} wrap>
              <Badge
                status={result.success ? 'success' : 'error'}
                text={<Text strong>{result.success ? 'Connection OK' : 'Connection failed'}</Text>}
              />
              <Tag>
                {result.provider} · {result.model}
              </Tag>
              {result.latencyMs != null && <Tag>{result.latencyMs} ms</Tag>}
              {result.success && result.reportedModel && result.reportedModel !== result.model && (
                <Tag color="blue">reported: {result.reportedModel}</Tag>
              )}
            </Flex>

            {result.success ? (
              <Flex vertical gap={4}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Generated output
                </Text>
                <pre style={PRE_STYLE}>{result.response || '(empty response)'}</pre>
              </Flex>
            ) : (
              <Flex vertical gap={4}>
                <Text type="danger">{result.error}</Text>
                {result.errorDetail && <pre style={PRE_STYLE}>{result.errorDetail}</pre>}
              </Flex>
            )}

            {result.requestSystemPrompt && (
              <Collapse
                size="small"
                items={[
                  {
                    key: 'request',
                    label: 'Request details',
                    children: (
                      <Flex vertical gap={12}>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: 4 }}>
                            System prompt
                          </Text>
                          <pre style={PRE_STYLE}>{result.requestSystemPrompt}</pre>
                        </div>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: 4 }}>
                            User prompt
                          </Text>
                          <pre style={PRE_STYLE}>{result.requestUserPrompt}</pre>
                        </div>
                      </Flex>
                    ),
                  },
                ]}
              />
            )}
          </Flex>
        )}
      </Flex>
    </Modal>
  );
};

export default AIProviderTestModal;
