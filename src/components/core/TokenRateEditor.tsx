// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
/**
 * TokenRateEditor
 *
 * Inline-editable table for configuring per-model token cost overrides.
 * Shows default rates (from TOKEN_RATES hardcoded in the backend) alongside
 * any custom overrides, and lets admins add/edit/remove custom rates.
 *
 * Rates are expressed in $/1M tokens (input and output).
 */

import React from 'react';
import { Button, Collapse, Flex, InputNumber, Space, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, DollarOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

/** Shape of default rates from the backend: { "model-name": { input: 0.15, output: 0.60 } } */
export type DefaultTokenRates = Record<string, { input: number; output: number }>;

/** Custom overrides have the same shape */
export type CustomTokenRates = Record<string, { input: number; output: number }>;

interface TokenRateEditorProps {
  /** Hardcoded defaults from the backend (read-only reference) */
  defaultRates: DefaultTokenRates;
  /** Custom overrides that the user can edit */
  customRates: CustomTokenRates;
  /** Callback when custom rates change */
  onChange: (rates: CustomTokenRates) => void;
}

interface RateRow {
  key: string;
  model: string;
  inputRate: number;
  outputRate: number;
  source: 'default' | 'custom';
}

const TokenRateEditor: React.FC<TokenRateEditorProps> = ({ defaultRates, customRates, onChange }) => {
  const [newModel, setNewModel] = React.useState('');

  // Merge default + custom into display rows
  const rows: RateRow[] = React.useMemo(() => {
    const result: RateRow[] = [];
    const seen = new Set<string>();

    // Custom overrides first
    for (const [model, rates] of Object.entries(customRates)) {
      seen.add(model);
      result.push({
        key: model,
        model,
        inputRate: rates.input,
        outputRate: rates.output,
        source: 'custom',
      });
    }

    // Then defaults (that aren't overridden)
    for (const [model, rates] of Object.entries(defaultRates)) {
      if (!seen.has(model)) {
        result.push({
          key: model,
          model,
          inputRate: rates.input,
          outputRate: rates.output,
          source: 'default',
        });
      }
    }

    return result.sort((a, b) => a.model.localeCompare(b.model));
  }, [defaultRates, customRates]);

  const updateCustomRate = (model: string, field: 'input' | 'output', value: number) => {
    const existing = customRates[model] ?? defaultRates[model] ?? { input: 0, output: 0 };
    onChange({
      ...customRates,
      [model]: { ...existing, [field]: value },
    });
  };

  const removeCustomRate = (model: string) => {
    const next = { ...customRates };
    delete next[model];
    onChange(next);
  };

  const addCustomRate = () => {
    const trimmed = newModel.trim();
    if (!trimmed || customRates[trimmed]) return;
    const base = defaultRates[trimmed] ?? { input: 0, output: 0 };
    onChange({ ...customRates, [trimmed]: { ...base } });
    setNewModel('');
  };

  const columns: ColumnsType<RateRow> = [
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      render: (model: string, row: RateRow) => (
        <Space>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{model}</Text>
          {row.source === 'custom' ? (
            <Tag color="blue" style={{ fontSize: 10 }}>
              override
            </Tag>
          ) : (
            <Tag style={{ fontSize: 10 }}>default</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Input ($/1M tokens)',
      dataIndex: 'inputRate',
      key: 'inputRate',
      width: 170,
      render: (value: number, row: RateRow) =>
        row.source === 'custom' ? (
          <InputNumber
            size="small"
            min={0}
            step={0.01}
            value={value}
            onChange={(v) => updateCustomRate(row.model, 'input', v ?? 0)}
            style={{ width: 130 }}
            prefix="$"
          />
        ) : (
          <Text type="secondary">${value.toFixed(3)}</Text>
        ),
    },
    {
      title: 'Output ($/1M tokens)',
      dataIndex: 'outputRate',
      key: 'outputRate',
      width: 170,
      render: (value: number, row: RateRow) =>
        row.source === 'custom' ? (
          <InputNumber
            size="small"
            min={0}
            step={0.01}
            value={value}
            onChange={(v) => updateCustomRate(row.model, 'output', v ?? 0)}
            style={{ width: 130 }}
            prefix="$"
          />
        ) : (
          <Text type="secondary">${value.toFixed(3)}</Text>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, row: RateRow) =>
        row.source === 'custom' ? (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeCustomRate(row.model)}
          />
        ) : (
          <Button
            type="text"
            size="small"
            title="Override this model's rates"
            onClick={() => updateCustomRate(row.model, 'input', row.inputRate)}
          >
            Edit
          </Button>
        ),
    },
  ];

  return (
    <Collapse
      ghost
      items={[
        {
          key: 'token-rates',
          label: (
            <Space>
              <DollarOutlined />
              <Text strong>Custom Token Rates</Text>
              {Object.keys(customRates).length > 0 && (
                <Tag color="blue">{Object.keys(customRates).length} override(s)</Tag>
              )}
            </Space>
          ),
          children: (
            <Flex vertical gap={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Override the per-token cost rates used for usage cost estimates. Rates are in USD per 1 million tokens.
                Default rates are shown for known models. Click "Edit" to override a default, or add custom entries for
                self-hosted / unlisted models.
              </Text>
              <Table<RateRow>
                dataSource={rows}
                columns={columns}
                size="small"
                pagination={false}
                bordered
                style={{ maxWidth: 700 }}
              />
              <Flex gap={8} align="center">
                <InputNumber
                  size="small"
                  value={newModel as unknown as number}
                  onChange={() => {}}
                  style={{ display: 'none' }}
                />
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addCustomRate();
                  }}
                  placeholder="model-name (e.g. llama3:8b)"
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontSize: 13,
                    width: 260,
                    fontFamily: 'monospace',
                  }}
                />
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={addCustomRate}
                  disabled={!newModel.trim()}
                >
                  Add model
                </Button>
              </Flex>
            </Flex>
          ),
        },
      ]}
    />
  );
};

export default TokenRateEditor;
