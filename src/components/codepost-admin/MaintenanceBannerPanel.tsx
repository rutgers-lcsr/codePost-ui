// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useEffect, useState } from 'react';
import { Card, Switch, Input, Button, Space, Typography, Tag, Tooltip, Divider, message } from 'antd';
import {
  RedoOutlined,
  NotificationOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { systemApi } from '../../api-client/clients';
import type { MaintenanceBannerResponse, PatchedMaintenanceBanner } from '../../api-client/models/index';
import { SeverityEnum } from '../../api-client/models/index';

const { Text } = Typography;
const { TextArea } = Input;

interface DraftBanner {
  active: boolean;
  message: string;
  color: string;
  severity: SeverityEnum;
  startsAt: string | null;
  endsAt: string | null;
}

const SEVERITY_PRESETS = [
  { label: 'Info', severity: SeverityEnum.Info, color: '#1677ff', icon: <InfoCircleOutlined /> },
  { label: 'Warning', severity: SeverityEnum.Warning, color: '#fa8c16', icon: <ExclamationCircleOutlined /> },
  { label: 'Critical', severity: SeverityEnum.Critical, color: '#cf1322', icon: <WarningOutlined /> },
];

function toDraft(data: MaintenanceBannerResponse): DraftBanner {
  return {
    active: data.active,
    message: data.message,
    color: data.color,
    severity: data.severity as SeverityEnum,
    startsAt: data.startsAt ?? null,
    endsAt: data.endsAt ?? null,
  };
}

const MaintenanceBannerPanel: React.FC = () => {
  const [saved, setSaved] = useState<MaintenanceBannerResponse | null>(null);
  const [draft, setDraft] = useState<DraftBanner>({
    active: false,
    message: '',
    color: '#0e704c',
    severity: SeverityEnum.Info,
    startsAt: null,
    endsAt: null,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchBanner = async () => {
    setLoading(true);
    try {
      const data = await systemApi.bannerRetrieve();
      setSaved(data);
      setDraft(toDraft(data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanner();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const patch: PatchedMaintenanceBanner = {
        active: draft.active,
        message: draft.message,
        color: draft.color,
        severity: draft.severity,
        startsAt: draft.startsAt,
        endsAt: draft.endsAt,
      };
      const updated = await systemApi.bannerPartialUpdate({ patchedMaintenanceBanner: patch });
      setSaved(updated);
      setDraft(toDraft(updated));
      messageApi.success('Banner updated.');
    } catch (e) {
      messageApi.error('Failed to update banner.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    saved !== null &&
    (draft.active !== saved.active ||
      draft.message !== saved.message ||
      draft.color !== saved.color ||
      draft.severity !== saved.severity ||
      draft.startsAt !== (saved.startsAt ?? null) ||
      draft.endsAt !== (saved.endsAt ?? null));

  const previewColor = draft.color || '#0e704c';
  const previewMessage = draft.message || '(no message set)';
  const previewIcon =
    SEVERITY_PRESETS.find((p) => p.severity === draft.severity)?.icon ?? <InfoCircleOutlined />;

  return (
    <>
      {contextHolder}
      <Card
        title={
          <Space>
            <NotificationOutlined />
            Maintenance Banner
          </Space>
        }
        size="small"
        extra={
          <Tooltip title="Refresh">
            <Button type="text" icon={<RedoOutlined spin={loading} />} onClick={fetchBanner} />
          </Tooltip>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Active toggle */}
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Text>Banner Active</Text>
            <Switch
              checked={draft.active}
              onChange={(checked) => setDraft((d) => ({ ...d, active: checked }))}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </Space>

          {/* Message */}
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Message
            </Text>
            <TextArea
              value={draft.message}
              onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
              rows={2}
              placeholder="Enter maintenance message…"
            />
          </div>

          {/* Severity presets */}
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              Severity
            </Text>
            <Space wrap>
              {SEVERITY_PRESETS.map((p) => (
                <Tag
                  key={p.severity}
                  color={p.color}
                  icon={p.icon}
                  style={{
                    cursor: 'pointer',
                    border: draft.severity === p.severity ? '2px solid #333' : '2px solid transparent',
                    userSelect: 'none',
                    padding: '3px 10px',
                  }}
                  onClick={() => setDraft((d) => ({ ...d, severity: p.severity, color: p.color }))}
                >
                  {p.label}
                </Tag>
              ))}
              <Input
                value={draft.color}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                placeholder="#rrggbb or css"
                style={{ width: '130px' }}
                title="Custom colour override"
              />
            </Space>
          </div>

          <Divider style={{ margin: '4px 0' }} />

          {/* Schedule */}
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              Schedule (optional — leave blank for immediate activation)
            </Text>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text style={{ fontSize: '13px', width: '70px' }}>Starts at</Text>
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  value={draft.startsAt ? dayjs(draft.startsAt) : null}
                  onChange={(v) => setDraft((d) => ({ ...d, startsAt: v ? v.toISOString() : null }))}
                  placeholder="Immediate"
                  style={{ flex: 1 }}
                  allowClear
                />
              </Space>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text style={{ fontSize: '13px', width: '70px' }}>Ends at</Text>
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  value={draft.endsAt ? dayjs(draft.endsAt) : null}
                  onChange={(v) => setDraft((d) => ({ ...d, endsAt: v ? v.toISOString() : null }))}
                  placeholder="No expiry"
                  style={{ flex: 1 }}
                  allowClear
                />
              </Space>
            </Space>
          </div>

          {/* Live preview */}
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              Preview
            </Text>
            <div
              style={{
                background: previewColor,
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '4px',
                fontSize: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {previewIcon}
              {previewMessage}
            </div>
          </div>

          {/* Save */}
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!isDirty}
            block
          >
            Save Banner
          </Button>
        </Space>
      </Card>
    </>
  );
};

export default MaintenanceBannerPanel;

