// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Card,
  Checkbox,
  Switch,
  Input,
  Button,
  Popconfirm,
  Space,
  Typography,
  Tag,
  Tooltip,
  Divider,
  Flex,
  message,
} from 'antd';
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
import { apiErrorMessageAsync } from '../../lib/apiError';

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
  // Fills dark enough for the white banner text (6.2:1, 5.4:1 and 5.6:1).
  { label: 'Info', severity: SeverityEnum.Info, color: '#0958d9', icon: <InfoCircleOutlined /> },
  { label: 'Warning', severity: SeverityEnum.Warning, color: '#ad4e00', icon: <ExclamationCircleOutlined /> },
  { label: 'Critical', severity: SeverityEnum.Critical, color: '#cf1322', icon: <WarningOutlined /> },
];

const presetFor = (severity: SeverityEnum) =>
  SEVERITY_PRESETS.find((p) => p.severity === severity) ?? SEVERITY_PRESETS[0];

/** A hex colour, or anything the browser accepts as one: the preview and the live banner use it as-is. */
const isCssColor = (value: string) => {
  const v = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return true;
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', v);
};

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

/** What users are seeing right now, derived from the saved banner and its schedule. */
type LiveState = { key: 'live' | 'scheduled' | 'expired' | 'off'; label: string; color: string };

// Off is neutral grey, not the themed tag tint: green would read as "healthy" or "on".
const OFF_TAG = { color: 'rgba(0, 0, 0, 0.65)', background: '#fafafa', borderColor: '#d9d9d9' } as const;
// Dark amber text: an unsaved edit is a warning, and 12px tag text needs 4.5:1.
const UNSAVED_TAG = { color: '#ad4e00', background: '#fff7e6', borderColor: '#ffd591' } as const;

function liveState(saved: MaintenanceBannerResponse | null): LiveState {
  if (!saved || !saved.active) return { key: 'off', label: 'Off', color: 'default' };
  const now = dayjs();
  if (saved.startsAt && dayjs(saved.startsAt).isAfter(now)) {
    return { key: 'scheduled', label: `Scheduled for ${dayjs(saved.startsAt).format('MMM D, HH:mm')}`, color: 'blue' };
  }
  if (saved.endsAt && dayjs(saved.endsAt).isBefore(now)) {
    return { key: 'expired', label: `Expired ${dayjs(saved.endsAt).format('MMM D, HH:mm')}`, color: 'default' };
  }
  return { key: 'live', label: 'Live now', color: 'green' };
}

interface MaintenanceBannerPanelProps {
  compact?: boolean;
  /** How many people the banner reaches; named in the confirmation when known. */
  audienceCount?: number;
  /** Compact mode only: opens the full banner editor. */
  onOpenDetails?: () => void;
  /** Full mode: reports unsaved edits, so the console can ask before navigating away. */
  onDirtyChange?: (dirty: boolean) => void;
}

const MaintenanceBannerPanel: React.FC<MaintenanceBannerPanelProps> = ({
  compact = false,
  onOpenDetails,
  audienceCount,
  onDirtyChange,
}) => {
  const [saved, setSaved] = useState<MaintenanceBannerResponse | null>(null);
  const [draft, setDraft] = useState<DraftBanner>({
    active: false,
    message: '',
    color: SEVERITY_PRESETS[0].color,
    severity: SeverityEnum.Info,
    startsAt: null,
    endsAt: null,
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // The colour follows the severity preset unless the operator asks for a custom one.
  const [customColor, setCustomColor] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchBanner = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await systemApi.bannerRetrieve();
      setSaved(data);
      setDraft(toDraft(data));
      setCustomColor(data.color !== presetFor(data.severity as SeverityEnum).color);
    } catch (e) {
      setLoadError((await apiErrorMessageAsync(e)) ?? 'The banner settings did not load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanner();
  }, []);

  const state = liveState(saved);

  // ── Compact mode: summary row only ──────────────────────────────────────
  const isDirty =
    saved !== null &&
    (draft.active !== saved.active ||
      draft.message !== saved.message ||
      draft.color !== saved.color ||
      draft.severity !== saved.severity ||
      draft.startsAt !== (saved.startsAt ?? null) ||
      draft.endsAt !== (saved.endsAt ?? null));
  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);
  // Reload or close with unsaved edits: the browser's own "leave site?" prompt.
  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  if (compact) {
    return (
      <Card size="small" style={{ height: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space>
            <NotificationOutlined />
            <Text strong style={{ fontSize: 13 }}>
              Banner
            </Text>
            <Tag color={state.color} style={state.key === 'off' ? OFF_TAG : undefined}>
              {state.label}
            </Tag>
          </Space>
          <Space size={4}>
            {state.key !== 'off' && saved?.message && (
              <Text type="secondary" ellipsis style={{ maxWidth: 200, fontSize: 12 }}>
                {saved.message}
              </Text>
            )}
            {state.key === 'off' && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                No banner showing
              </Text>
            )}
            {onOpenDetails && (
              <Button type="link" size="small" onClick={onOpenDetails}>
                Manage
              </Button>
            )}
          </Space>
        </Space>
      </Card>
    );
  }

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
      const next = liveState(updated);
      messageApi.success(
        next.key === 'live'
          ? 'Banner saved. Every user sees it now.'
          : next.key === 'scheduled'
            ? `Banner saved. ${next.label}.`
            : 'Banner saved. It is off.',
      );
    } catch (e) {
      messageApi.error((await apiErrorMessageAsync(e)) ?? 'The banner could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const scheduleInvalid = !!draft.startsAt && !!draft.endsAt && dayjs(draft.endsAt).isBefore(dayjs(draft.startsAt));
  const needsMessage = draft.active && draft.message.trim() === '';
  const colorInvalid = customColor && !isCssColor(draft.color);
  const canSave = isDirty && !scheduleInvalid && !needsMessage && !colorInvalid && !loadError;

  const preset = presetFor(draft.severity);
  const previewColor = (customColor && !colorInvalid && draft.color) || preset.color;
  const previewMessage = draft.message || '(no message set)';

  const saveButton = (
    <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={!canSave} block>
      {draft.active ? 'Save and show banner' : 'Save banner'}
    </Button>
  );

  return (
    <>
      {contextHolder}
      <Card
        title={
          <Space>
            <NotificationOutlined />
            Maintenance Banner
            <Tag color={state.color} style={{ marginLeft: 4, ...(state.key === 'off' ? OFF_TAG : {}) }}>
              {state.label}
            </Tag>
            {/* The state tag is what users see now; this says the editor has moved away from it. */}
            {isDirty && <Tag style={UNSAVED_TAG}>Unsaved changes</Tag>}
          </Space>
        }
        size="small"
        extra={
          <Tooltip title="Reload saved settings">
            <Button
              type="text"
              icon={<RedoOutlined spin={loading} />}
              onClick={fetchBanner}
              aria-label="Reload saved settings"
            />
          </Tooltip>
        }
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          {loadError && (
            <Alert
              type="error"
              showIcon
              title="Banner settings did not load"
              description={`${loadError} The form below may not reflect what users see.`}
              action={
                <Button size="small" onClick={fetchBanner}>
                  Retry
                </Button>
              }
            />
          )}

          {/* Active toggle */}
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <div>
              <Text>Show banner to every user</Text>
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                Takes effect when you save. Scheduling below can delay or end it.
              </Text>
            </div>
            <Switch
              checked={draft.active}
              onChange={(checked) => setDraft((d) => ({ ...d, active: checked }))}
              checkedChildren="ON"
              unCheckedChildren="OFF"
              aria-label="Show banner to every user"
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
              status={needsMessage ? 'error' : undefined}
              aria-label="Banner message"
            />
            {needsMessage && (
              <Text type="danger" style={{ fontSize: 12 }}>
                Add a message before showing the banner.
              </Text>
            )}
          </div>

          {/* Severity presets */}
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              Severity
            </Text>
            <Space wrap role="radiogroup" aria-label="Severity">
              {SEVERITY_PRESETS.map((p) => {
                const selected = draft.severity === p.severity;
                return (
                  // Real buttons so the presets can be reached and chosen from the keyboard.
                  <button
                    key={p.severity}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDraft((d) => ({ ...d, severity: p.severity, color: p.color }))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      borderRadius: 4,
                      font: 'inherit',
                      fontSize: 12,
                      lineHeight: '20px',
                      // Filled only when chosen: three filled chips gave no way to tell which one was on.
                      color: selected ? '#fff' : p.color,
                      background: selected ? p.color : '#fff',
                      border: `2px solid ${p.color}`,
                      fontWeight: selected ? 600 : 500,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    {p.icon}
                    {p.label}
                  </button>
                );
              })}
            </Space>
            <div style={{ marginTop: 8 }}>
              <Checkbox
                checked={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.checked);
                  if (!e.target.checked) setDraft((d) => ({ ...d, color: presetFor(d.severity).color }));
                }}
              >
                <Text style={{ fontSize: 12 }}>Custom colour</Text>
              </Checkbox>
              {customColor && (
                <>
                  <Input
                    value={draft.color}
                    onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                    placeholder="#rrggbb"
                    status={colorInvalid ? 'error' : undefined}
                    aria-invalid={colorInvalid || undefined}
                    style={{ width: '130px', marginLeft: 8 }}
                    aria-label="Custom colour"
                  />
                  {colorInvalid && (
                    <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                      Enter a colour the browser understands, such as #0e704c.
                    </Text>
                  )}
                </>
              )}
            </div>
          </div>

          <Divider style={{ margin: '4px 0' }} />

          {/* Schedule */}
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              Schedule (optional — leave blank to show immediately and until you turn it off)
            </Text>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Space style={{ width: '100%' }}>
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
              <Space style={{ width: '100%' }}>
                <Text style={{ fontSize: '13px', width: '70px' }}>Ends at</Text>
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  value={draft.endsAt ? dayjs(draft.endsAt) : null}
                  onChange={(v) => setDraft((d) => ({ ...d, endsAt: v ? v.toISOString() : null }))}
                  placeholder="No expiry"
                  style={{ flex: 1 }}
                  status={scheduleInvalid ? 'error' : undefined}
                  allowClear
                />
              </Space>
              {scheduleInvalid && (
                <Text type="danger" style={{ fontSize: 12 }}>
                  The end time is before the start time.
                </Text>
              )}
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
              {preset.icon}
              {previewMessage}
            </div>
            {customColor && !colorInvalid && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                Using your custom colour; {preset.label} only changes the icon.
              </Text>
            )}
          </div>

          {/* The stakes, on the page and not only in the confirmation. */}
          <Text style={{ fontSize: 13 }}>
            {draft.active ? (
              <>
                <strong>
                  Reaches every signed-in user{audienceCount ? ` (${audienceCount.toLocaleString()})` : ''}
                </strong>{' '}
                {draft.startsAt && dayjs(draft.startsAt).isAfter(dayjs())
                  ? `from ${dayjs(draft.startsAt).format('MMM D, HH:mm')}`
                  : 'as soon as you save'}
                {draft.endsAt ? ` until ${dayjs(draft.endsAt).format('MMM D, HH:mm')}` : ', until you turn it off'}.
              </>
            ) : (
              <>
                <strong>Off:</strong> no one sees this banner until you turn it on and save.
              </>
            )}
          </Text>
          {/* One row: the quiet way back on the left, the one primary action filling the rest. */}
          <Flex gap={8} align="center">
            {isDirty && saved && (
              <Button
                onClick={() => {
                  setDraft(toDraft(saved));
                  setCustomColor(saved.color !== presetFor(saved.severity as SeverityEnum).color);
                }}
              >
                Discard changes
              </Button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Save: showing a banner is a broadcast, so it asks first; turning it off does not. */}
              {draft.active ? (
                <Popconfirm
                  title={`Show this banner to every codePost user${audienceCount ? ` (${audienceCount.toLocaleString()})` : ''}?`}
                  description={
                    draft.startsAt && dayjs(draft.startsAt).isAfter(dayjs())
                      ? `It will appear from ${dayjs(draft.startsAt).format('MMM D, HH:mm')}.`
                      : 'It appears on every page as soon as you save.'
                  }
                  okText="Save and show"
                  onConfirm={handleSave}
                  disabled={!canSave}
                >
                  {saveButton}
                </Popconfirm>
              ) : (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                  disabled={!canSave}
                  block
                >
                  Save banner
                </Button>
              )}
            </div>
          </Flex>
        </Space>
      </Card>
    </>
  );
};

export default MaintenanceBannerPanel;
