// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useState, useEffect, useCallback } from 'react';
import { Collapse, Input, Select, Typography, Tag, Button, message, Empty, Popconfirm, Space, Tooltip } from 'antd';
import { DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { assignmentsApi, learningObjectivesApi } from '../../../../../../api-client/clients';
import type { LearningObjective } from '../../../../../../api-client/models';

interface IProps {
  assignmentId: number;
}

const VISIBILITY_OPTIONS = [
  { value: 'always', label: 'Always show' },
  { value: 'on_pass', label: 'Show when tests pass' },
  { value: 'on_fail', label: 'Show when tests fail' },
  { value: 'never', label: 'Admin only' },
];

const AGGREGATION_OPTIONS = [
  { value: 'all', label: 'All tests must pass' },
  { value: 'any', label: 'Any test passes' },
  { value: 'percentage', label: 'Percentage of tests' },
  { value: 'points_weighted', label: 'Weighted by points' },
];

export const LearningObjectivesPanel = (props: IProps) => {
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchObjectives = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assignmentsApi.learningObjectivesList({ id: props.assignmentId });
      setObjectives(data);
    } catch (err) {
      console.error('Failed to fetch learning objectives:', err);
      setObjectives([]);
    } finally {
      setLoading(false);
    }
  }, [props.assignmentId]);

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

  const handleUpdate = async (obj: LearningObjective, field: string, value: string) => {
    try {
      const updated = await learningObjectivesApi.partialUpdate({
        id: obj.id,
        patchedLearningObjective: { [field]: value },
      });
      setObjectives((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      message.error('Failed to update objective');
    }
  };

  const handleDelete = async (obj: LearningObjective) => {
    try {
      await learningObjectivesApi.destroy({ id: obj.id });
      setObjectives((prev) => prev.filter((o) => o.id !== obj.id));
      message.success('Objective deleted');
    } catch {
      message.error('Failed to delete objective');
    }
  };

  const copyShortId = (shortId: string) => {
    navigator.clipboard.writeText(shortId);
    message.success(`Copied "${shortId}" to clipboard`);
  };

  if (loading && objectives.length === 0) return null;

  return (
    <Collapse
      size="small"
      style={{ marginBottom: 12 }}
      items={[
        {
          key: 'objectives',
          label: (
            <span>
              Learning Objectives{' '}
              <Tag color="blue" style={{ marginLeft: 4 }}>
                {objectives.length}
              </Tag>
            </span>
          ),
          children:
            objectives.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    No learning objectives yet. Add <code>objectives=["id"]</code> to your test decorators to
                    auto-create them.
                  </Typography.Text>
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Objectives are auto-created from test scripts. Use the short ID in your decorators. Edit name,
                  description, and visibility here.
                </Typography.Text>
                {objectives.map((obj) => (
                  <div
                    key={obj.id}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                      padding: '8px 12px',
                      background: '#fafafa',
                      borderRadius: 6,
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    {/* Short ID tag */}
                    <Tooltip title="Click to copy — use this ID in test decorators">
                      <Tag
                        color="geekblue"
                        style={{ cursor: 'pointer', marginTop: 4, flexShrink: 0 }}
                        onClick={() => copyShortId(obj.shortId)}
                      >
                        <CopyOutlined style={{ marginRight: 4, fontSize: 10 }} />
                        {obj.shortId}
                      </Tag>
                    </Tooltip>

                    {/* Editable fields */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Input
                        size="small"
                        defaultValue={obj.name}
                        placeholder="Display name"
                        onBlur={(e) => {
                          if (e.target.value !== obj.name) handleUpdate(obj, 'name', e.target.value);
                        }}
                        onPressEnter={(e) => {
                          const val = (e.target as HTMLInputElement).value;
                          if (val !== obj.name) handleUpdate(obj, 'name', val);
                        }}
                      />
                      <Input.TextArea
                        size="small"
                        rows={1}
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        defaultValue={obj.description}
                        placeholder="Description (optional)"
                        onBlur={(e) => {
                          if (e.target.value !== obj.description) handleUpdate(obj, 'description', e.target.value);
                        }}
                      />
                    </div>

                    {/* Visibility + Aggregation + delete */}
                    <Space size={4} direction="vertical" style={{ flexShrink: 0 }}>
                      <Select
                        size="small"
                        value={obj.visibilityMode}
                        options={VISIBILITY_OPTIONS}
                        style={{ width: 170 }}
                        onChange={(val) => handleUpdate(obj, 'visibilityMode', val)}
                      />
                      <Select
                        size="small"
                        value={obj.aggregationMode}
                        options={AGGREGATION_OPTIONS}
                        style={{ width: 170 }}
                        onChange={(val) => handleUpdate(obj, 'aggregationMode', val)}
                      />
                      <Popconfirm
                        title="Delete this objective?"
                        description={
                          obj.testCases.length > 0
                            ? `This will unlink it from ${obj.testCases.length} test(s).`
                            : undefined
                        }
                        onConfirm={() => handleDelete(obj)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>
                ))}
              </div>
            ),
        },
      ]}
    />
  );
};
