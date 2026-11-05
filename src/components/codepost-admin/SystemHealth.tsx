// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Flex,
  Progress,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClusterOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  HddOutlined,
  InfoCircleOutlined,
  RedoOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { dashboardApi, systemApi } from '../../api-client/clients';
import type {
  SystemHealthAck,
  SystemHealthResponse,
  HealthCheck,
  CeleryCheck,
  DiskCheck,
  MigrationCheck,
} from '../../api-client';
import { StatusDfeEnum, OverallEnum } from '../../api-client/models/index';
import { apiErrorMessageAsync } from '../../lib/apiError';

const { Text } = Typography;

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<StatusDfeEnum, 'success' | 'warning' | 'error'> = {
  [StatusDfeEnum.Ok]: 'success',
  [StatusDfeEnum.Warning]: 'warning',
  [StatusDfeEnum.Error]: 'error',
};

const OVERALL_CONFIG: Record<
  OverallEnum,
  { color: string; text: string; badge: 'success' | 'warning' | 'error' | 'processing'; summary: string }
> = {
  [OverallEnum.Ok]: { color: '#52c41a', text: 'Healthy', badge: 'success', summary: 'Every check passed.' },
  [OverallEnum.Degraded]: {
    color: '#fa8c16',
    text: 'Degraded',
    badge: 'warning',
    summary: 'The platform is up, but something needs attention.',
  },
  [OverallEnum.Critical]: {
    color: '#f5222d',
    text: 'Critical',
    badge: 'error',
    summary: 'A core service is failing.',
  },
};

const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '30 s', value: 30_000 },
  { label: '1 min', value: 60_000 },
  { label: '5 min', value: 300_000 },
];

type AnyCheck = HealthCheck | CeleryCheck | DiskCheck | MigrationCheck;

/** The individual checks, in display order; `key` indexes the health response. */
const CHECKS: { key: 'database' | 'celery' | 'cache' | 'migrations' | 'disk'; name: string; icon: React.ReactNode }[] =
  [
    { key: 'database', name: 'Database', icon: <DatabaseOutlined /> },
    { key: 'celery', name: 'Task Queue', icon: <ClusterOutlined /> },
    { key: 'cache', name: 'Cache', icon: <ThunderboltOutlined /> },
    { key: 'migrations', name: 'Migrations', icon: <BranchesOutlined /> },
    { key: 'disk', name: 'Disk', icon: <HddOutlined /> },
  ];

/** The staff-wide acknowledgement lives on the server (GET/PUT/DELETE /dashboard/health_ack/): one note for everyone. */
/** What exactly is failing, so an acknowledgement expires the moment something else breaks. */
function failureSignature(health: SystemHealthResponse | null): string {
  if (!health) return '';
  return CHECKS.map((c) => {
    const check = health[c.key] as AnyCheck | null | undefined;
    const status = check ? (check as HealthCheck).status : 'none';
    return status === StatusDfeEnum.Ok ? '' : `${c.key}:${status}`;
  })
    .filter(Boolean)
    .join('|');
}

const LATENCY_SLOW_MS = 800;
const LATENCY_VERY_SLOW_MS = 2000;
const ERROR_TAG: React.CSSProperties = { color: '#a8071a', background: '#fff1f0', borderColor: '#ffa39e' };
const WARN_TAG: React.CSSProperties = { color: '#ad4e00', background: '#fff7e6', borderColor: '#ffd591' };

/** Slow is a warning, very slow is a problem: text dark enough for 12px on each tint. */
function latencyTone(ms: number): React.CSSProperties {
  if (ms >= LATENCY_VERY_SLOW_MS) return ERROR_TAG;
  if (ms >= LATENCY_SLOW_MS) return WARN_TAG;
  return {};
}

/** The colour's meaning in words, so the threshold is not a secret. */
function latencyLabel(ms: number): { suffix: string; title: string } {
  if (ms >= LATENCY_VERY_SLOW_MS)
    return { suffix: ' · very slow', title: `Very slow: over ${LATENCY_VERY_SLOW_MS} ms` };
  if (ms >= LATENCY_SLOW_MS) return { suffix: ' · slow', title: `Slow: over ${LATENCY_SLOW_MS} ms` };
  return { suffix: '', title: `Normal: under ${LATENCY_SLOW_MS} ms` };
}

/** Names of the checks that are not OK, for the one-line summary. */
function failingCheckNames(health: SystemHealthResponse | null): string[] {
  if (!health) return [];
  return CHECKS.filter((c) => {
    const check = health[c.key] as AnyCheck | null | undefined;
    return check && (check as HealthCheck).status !== StatusDfeEnum.Ok;
  }).map((c) => c.name);
}

function diskProgressStatus(pct: number): 'success' | 'normal' | 'exception' {
  if (pct >= 90) return 'exception';
  if (pct >= 75) return 'normal'; // will be orange via strokeColor
  return 'success';
}

function diskStrokeColor(pct: number): string | undefined {
  if (pct >= 90) return undefined; // default red from 'exception'
  if (pct >= 75) return '#fa8c16';
  return '#52c41a';
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface CheckRowProps {
  icon: React.ReactNode;
  name: string;
  check: AnyCheck | null;
  /** The health call failed and there is no result to show for this row. */
  unavailable: boolean;
}

const CheckRow: React.FC<CheckRowProps> = ({ icon, name, check, unavailable }) => {
  const row = check as (HealthCheck & CeleryCheck & DiskCheck & MigrationCheck) | null;

  const badgeStatus = row ? STATUS_BADGE[row.status as StatusDfeEnum] : unavailable ? 'error' : 'processing';
  const labelText = row?.label ?? (unavailable ? 'Unavailable' : 'Loading…');
  const failing = !!row && row.status !== StatusDfeEnum.Ok;

  const content = (
    // A plain flex row that wraps: the name never breaks mid-word on a phone, the status drops below it.
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '4px 12px',
      }}
    >
      <Space style={{ flex: '0 0 auto' }}>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {icon}
        </Text>
        <Text style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>{name}</Text>
        {row?.latencyMs != null && (
          // Coloured by threshold, so a two-second ping is not dressed as routine.
          <Tag
            title={latencyLabel(row.latencyMs).title}
            style={{ fontSize: '12px', padding: '0 4px', marginLeft: 0, ...latencyTone(row.latencyMs) }}
          >
            {Math.round(row.latencyMs)} ms{latencyLabel(row.latencyMs).suffix}
          </Tag>
        )}
        {(row as CeleryCheck)?.workerCount != null &&
          // No workers is the failure itself, not a detail: it gets the error tint, not blue.
          ((row as CeleryCheck).workerCount === 0 ? (
            <Tag style={{ fontSize: '12px', padding: '0 4px', marginLeft: 0, ...ERROR_TAG }}>No workers</Tag>
          ) : (
            <Tag style={{ fontSize: '12px', padding: '0 4px', marginLeft: 0 }} color="blue">
              {(row as CeleryCheck).workerCount} workers
            </Tag>
          ))}
        {(row as MigrationCheck)?.pending != null && (row as MigrationCheck).pending > 0 && (
          <Tag style={{ fontSize: '11px', padding: '0 4px', marginLeft: 0 }} color="orange">
            {(row as MigrationCheck).pending} pending
          </Tag>
        )}
      </Space>
      <Space style={{ marginLeft: 'auto' }}>
        {row?.detail && !failing && (
          <Tooltip title={row.detail} placement="topRight">
            <InfoCircleOutlined style={{ color: '#fa8c16', fontSize: '13px' }} />
          </Tooltip>
        )}
        <Badge status={badgeStatus} text={<Text style={{ fontSize: '12px' }}>{labelText}</Text>} />
      </Space>
    </div>
  );

  // A failing check says why inline; a tooltip alone is easy to miss and unreachable on touch.
  const detail =
    failing && row?.detail ? (
      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginLeft: 24, marginTop: 2 }}>
        {row.detail}
      </Text>
    ) : null;

  // Disk gets an extra progress bar
  const disk = row as DiskCheck;
  if (disk?.usedPct != null) {
    const pct = disk.usedPct;
    return (
      <div>
        {content}
        {detail}
        <Progress
          percent={pct}
          size="small"
          status={diskProgressStatus(pct)}
          strokeColor={diskStrokeColor(pct)}
          style={{ marginTop: '4px', marginLeft: '24px', width: 'calc(100% - 24px)' }}
          showInfo={false}
        />
      </div>
    );
  }

  return (
    <div>
      {content}
      {detail}
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

interface SystemHealthProps {
  /** Show a compact single-row summary instead of the full card. */
  compact?: boolean;
  /** Compact mode only: opens the full System Health view. */
  onOpenDetails?: () => void;
}

const SystemHealth: React.FC<SystemHealthProps> = ({ compact = false, onOpenDetails }) => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ack, setAck] = useState<SystemHealthAck | null>(null);
  const [ackBusy, setAckBusy] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60_000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    // The shared acknowledgement rides along with every check; a failure here only means "unknown".
    void dashboardApi.healthAckRetrieve().then(setAck, () => undefined);
    try {
      const data = await systemApi.healthRetrieve();
      setHealth(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      // Keep the last good result on screen (marked stale) rather than wiping it.
      setError((await apiErrorMessageAsync(e)) ?? 'The health check did not respond.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(checkHealth, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkHealth, refreshInterval]);

  const overall = health ? OVERALL_CONFIG[health.overall] : null;
  const failing = failingCheckNames(health);
  const unavailable = error !== null && health === null;
  const signature = failureSignature(health);
  // Acknowledged: the same problem as when someone said "known"; anything new un-acknowledges itself.
  const acknowledged = !!ack && signature !== '' && ack.signature === signature;
  const acknowledge = async () => {
    setAckBusy(true);
    try {
      setAck(await dashboardApi.healthAckUpdate({ systemHealthAckRequest: { signature } }));
    } catch (e) {
      message.error((await apiErrorMessageAsync(e)) ?? 'Could not save the acknowledgement.');
    } finally {
      setAckBusy(false);
    }
  };
  const clearAck = async () => {
    setAckBusy(true);
    try {
      setAck(await dashboardApi.healthAckDestroy());
    } catch (e) {
      message.error((await apiErrorMessageAsync(e)) ?? 'Could not clear the acknowledgement.');
    } finally {
      setAckBusy(false);
    }
  };
  const ackWhen = ack?.acknowledgedAt ? new Date(ack.acknowledgedAt).toLocaleString() : '';
  const ackWho = ack?.acknowledgedBy ?? 'a staff member';

  // ── Compact mode: single-row status indicator ──────────────────────────────
  if (compact) {
    const statusText = unavailable ? 'Health check failed' : overall ? overall.text : 'Checking…';
    const tone = unavailable ? OVERALL_CONFIG[OverallEnum.Critical] : overall;
    const healthy = !unavailable && overall?.badge === 'success';
    const quiet = healthy || acknowledged;
    const checking = !health && !unavailable;
    // The cause lives in the card, so nobody has to open Details to learn what is wrong.
    const firstFailing = CHECKS.map((c) => health?.[c.key] as (HealthCheck & { detail?: string | null }) | null).find(
      (check) => check && check.status !== StatusDfeEnum.Ok,
    );
    const cause = unavailable ? error : firstFailing?.detail || failing.join(', ');
    const icon = healthy ? (
      <CheckCircleOutlined style={{ color: tone?.color }} />
    ) : unavailable || overall?.badge === 'error' ? (
      <CloseCircleOutlined style={{ color: tone?.color }} />
    ) : (
      <ExclamationCircleOutlined style={{ color: tone?.color }} />
    );

    // Not healthy: the card itself takes the tone (border and a faint fill), not just a dot.
    return (
      <Card
        size="small"
        style={{
          height: '100%',
          borderColor: checking || quiet ? undefined : tone?.color,
          background: checking || quiet ? undefined : `${tone?.color}0d`,
        }}
      >
        {checking ? (
          // Same footprint as the loaded card, so the status row does not jump when the answer lands.
          <Skeleton active title={{ width: '45%' }} paragraph={{ rows: 1, width: '70%' }} style={{ minHeight: 44 }} />
        ) : (
          <Flex justify="space-between" align="flex-start" gap={8} wrap>
            <Space orientation="vertical" size={2}>
              <Space wrap size={[8, 4]}>
                {icon}
                <Text strong style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                  {statusText}
                </Text>
                {failing.length > 0 && !acknowledged && (
                  // orange-8 on the tint: 12px tag text needs 4.5:1, which antd's orange tag misses.
                  <Tag style={{ fontSize: 12, color: '#ad4e00', background: '#fff7e6', borderColor: '#ffd591' }}>
                    {failing.length} issue{failing.length !== 1 ? 's' : ''}
                  </Tag>
                )}
                {acknowledged && (
                  <Tooltip title={`Acknowledged by ${ackWho} ${ackWhen}, for all staff`}>
                    <Tag style={{ fontSize: 12 }}>Acknowledged</Tag>
                  </Tooltip>
                )}
                {error && health && (
                  <Tooltip title={error}>
                    <Tag color="red" style={{ fontSize: 12 }}>
                      stale
                    </Tag>
                  </Tooltip>
                )}
              </Space>
              {cause && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {cause}
                </Text>
              )}
            </Space>
            <Space size={4} style={{ whiteSpace: 'nowrap' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {lastUpdated ? lastUpdated.toLocaleTimeString() : ''}
              </Text>
              {unavailable && (
                <Button type="link" size="small" onClick={checkHealth} loading={loading}>
                  Retry
                </Button>
              )}
              {onOpenDetails && (
                // blue-7: the link sits on the card's warning tint when degraded, where antd's blue is 4.1:1.
                <Button type="link" size="small" onClick={onOpenDetails} style={{ color: '#0958d9' }}>
                  Details
                </Button>
              )}
            </Space>
          </Flex>
        )}
      </Card>
    );
  }

  // ── Full mode ────────────────────────────────────────────────────────────

  // First load: one skeleton instead of "Checking…" plus five "Loading…" rows.
  if (!health && !unavailable) {
    return (
      <Card size="small" title="Checking the platform…">
        <Skeleton active title={false} paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  // The page-level answer to "is the platform healthy right now?", before the per-check rows.
  const verdict = (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: '2px 12px',
        padding: '4px 0 8px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      <Space align="baseline">
        <Badge status={unavailable ? 'error' : (overall?.badge ?? 'processing')} />
        <Text strong style={{ fontSize: 20, color: unavailable ? '#f5222d' : overall?.color }}>
          {unavailable ? 'Health check failed' : overall ? overall.text : 'Checking…'}
        </Text>
      </Space>
      <Text type="secondary" style={{ fontSize: 13 }}>
        {unavailable
          ? error
          : overall
            ? failing.length > 0
              ? `${overall.summary} Needs attention: ${failing.join(', ')}.`
              : overall.summary
            : 'Running the checks.'}
      </Text>
      {/* A known problem can be acknowledged: the Overview card goes quiet for exactly this failure. */}
      {failing.length > 0 &&
        (acknowledged ? (
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Acknowledged by {ackWho} {ackWhen}, for all staff.
            </Text>
            <Button type="link" size="small" onClick={clearAck} loading={ackBusy}>
              Clear
            </Button>
          </Space>
        ) : (
          <Tooltip title="Quiets the Overview card for this problem, for every staff member, until the failing checks change.">
            <Button size="small" onClick={acknowledge} loading={ackBusy}>
              Acknowledge
            </Button>
          </Tooltip>
        ))}
    </div>
  );

  return (
    <Card
      size="small"
      extra={
        <Space size={4}>
          <Select
            size="small"
            value={refreshInterval}
            onChange={setRefreshInterval}
            options={REFRESH_OPTIONS}
            style={{ width: 80 }}
            aria-label="Auto-refresh interval"
            title="Auto-refresh interval"
          />
          <Tooltip title="Refresh now">
            <Button
              type="text"
              size="small"
              icon={<RedoOutlined spin={loading} />}
              onClick={checkHealth}
              aria-label="Refresh now"
            />
          </Tooltip>
        </Space>
      }
    >
      <Space orientation="vertical" style={{ width: '100%' }} size={8}>
        {verdict}
        {error && health && (
          <Alert
            type="error"
            showIcon
            title="Latest health check failed"
            description={`${error} Showing the last successful check.`}
            action={
              <Button size="small" onClick={checkHealth} loading={loading}>
                Retry
              </Button>
            }
          />
        )}
        {unavailable && (
          <Button size="small" onClick={checkHealth} loading={loading} style={{ alignSelf: 'flex-start' }}>
            Retry
          </Button>
        )}
        {CHECKS.map((c) => (
          <CheckRow
            key={c.key}
            icon={c.icon}
            name={c.name}
            check={(health?.[c.key] as AnyCheck | undefined) ?? null}
            unavailable={unavailable}
          />
        ))}
        <Text type="secondary" style={{ fontSize: 12 }}>
          Latency: normal under {LATENCY_SLOW_MS} ms · slow from {LATENCY_SLOW_MS} ms · very slow from{' '}
          {LATENCY_VERY_SLOW_MS} ms.
        </Text>

        {/* Recent activity */}
        {health != null && (
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}
          >
            <Space>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                <InfoCircleOutlined />
              </Text>
              <Text style={{ fontSize: '13px' }}>Activity (1 h)</Text>
            </Space>
            <Tag color="default" style={{ fontSize: '12px', marginLeft: 'auto' }}>
              {health.recentEvents1h >= 0
                ? `${health.recentEvents1h} ${health.recentEvents1h === 1 ? 'event' : 'events'}`
                : 'N/A'}
            </Tag>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: '4px' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {lastUpdated ? `Checked: ${lastUpdated.toLocaleTimeString()}` : loading ? 'Checking…' : '—'}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Auto-refresh: {REFRESH_OPTIONS.find((o) => o.value === refreshInterval)?.label}
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default SystemHealth;
