// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, Progress, Select, Space, Tag, Tooltip, Typography } from 'antd';
import {
  ClusterOutlined,
  DatabaseOutlined,
  HddOutlined,
  InfoCircleOutlined,
  RedoOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { systemApi } from '../../api-client/clients';
import type { SystemHealthResponse, HealthCheck, CeleryCheck, DiskCheck, MigrationCheck } from '../../api-client';
import { StatusDfeEnum, OverallEnum } from '../../api-client/models/index';

const { Text } = Typography;

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<StatusDfeEnum, 'success' | 'warning' | 'error'> = {
  [StatusDfeEnum.Ok]: 'success',
  [StatusDfeEnum.Warning]: 'warning',
  [StatusDfeEnum.Error]: 'error',
};

const OVERALL_CONFIG: Record<
  OverallEnum,
  { color: string; text: string; badge: 'success' | 'warning' | 'error' | 'processing' }
> = {
  [OverallEnum.Ok]: { color: '#52c41a', text: 'Healthy', badge: 'success' },
  [OverallEnum.Degraded]: { color: '#fa8c16', text: 'Degraded', badge: 'warning' },
  [OverallEnum.Critical]: { color: '#f5222d', text: 'Critical', badge: 'error' },
};

const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '30 s', value: 30_000 },
  { label: '1 min', value: 60_000 },
  { label: '5 min', value: 300_000 },
];

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
  check: HealthCheck | CeleryCheck | DiskCheck | MigrationCheck | null;
}

const CheckRow: React.FC<CheckRowProps> = ({ icon, name, check }) => {
  const row = check as any;

  const badgeStatus = row ? STATUS_BADGE[row.status as StatusDfeEnum] : 'processing';
  const labelText = row?.label ?? 'Loading…';
  const hasDetail = !!row?.detail;

  const content = (
    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
      <Space>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {icon}
        </Text>
        <Text style={{ fontSize: '13px' }}>{name}</Text>
        {row?.latencyMs != null && (
          <Tag style={{ fontSize: '11px', padding: '0 4px', marginLeft: 0 }} color="default">
            {row.latencyMs} ms
          </Tag>
        )}
        {(row as CeleryCheck)?.workerCount != null && (
          <Tag style={{ fontSize: '11px', padding: '0 4px', marginLeft: 0 }} color="blue">
            {(row as CeleryCheck).workerCount} workers
          </Tag>
        )}
        {(row as MigrationCheck)?.pending != null && (row as MigrationCheck).pending > 0 && (
          <Tag style={{ fontSize: '11px', padding: '0 4px', marginLeft: 0 }} color="orange">
            {(row as MigrationCheck).pending} pending
          </Tag>
        )}
      </Space>
      <Space>
        {hasDetail && (
          <Tooltip title={row.detail} placement="topRight">
            <InfoCircleOutlined
              style={{
                color: STATUS_BADGE[row.status as StatusDfeEnum] === 'error' ? '#f5222d' : '#fa8c16',
                fontSize: '13px',
              }}
            />
          </Tooltip>
        )}
        <Badge status={badgeStatus} text={<Text style={{ fontSize: '12px' }}>{labelText}</Text>} />
      </Space>
    </Space>
  );

  // Disk gets an extra progress bar
  const disk = row as DiskCheck;
  if (disk?.usedPct != null) {
    const pct = disk.usedPct;
    return (
      <div>
        {content}
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

  return content;
};

// ─── main component ───────────────────────────────────────────────────────────

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(60_000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await systemApi.healthRetrieve();
      setHealth(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
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

  return (
    <Card
      title={
        <Space>
          System Health
          {overall && (
            <Badge
              status={overall.badge}
              text={<Text style={{ fontSize: '12px', color: overall.color }}>{overall.text}</Text>}
            />
          )}
        </Space>
      }
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
            <Button type="text" size="small" icon={<RedoOutlined spin={loading} />} onClick={checkHealth} />
          </Tooltip>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <CheckRow icon={<DatabaseOutlined />} name="Database" check={health?.database ?? null} />
        <CheckRow icon={<ClusterOutlined />} name="Task Queue" check={health?.celery ?? null} />
        <CheckRow icon={<ThunderboltOutlined />} name="Cache" check={health?.cache ?? null} />
        <CheckRow icon={<BranchesOutlined />} name="Migrations" check={health?.migrations ?? null} />
        <CheckRow icon={<HddOutlined />} name="Disk" check={health?.disk ?? null} />

        {/* Recent activity */}
        {health != null && (
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                <InfoCircleOutlined />
              </Text>
              <Text style={{ fontSize: '13px' }}>Activity (1 h)</Text>
            </Space>
            <Tag color="default" style={{ fontSize: '12px' }}>
              {health.recentEvents1h >= 0 ? `${health.recentEvents1h} events` : 'N/A'}
            </Tag>
          </Space>
        )}

        {/* Footer */}
        <Space style={{ justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {lastUpdated ? `Checked: ${lastUpdated.toLocaleTimeString()}` : loading ? 'Checking…' : '—'}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Auto-refresh: {REFRESH_OPTIONS.find((o) => o.value === refreshInterval)?.label}
          </Text>
        </Space>
      </Space>
    </Card>
  );
};

export default SystemHealth;
