// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * The platform's health as one model: the five checks, the shared acknowledgement, and what to do
 * about a failing check. The console runs it once (SystemHealthContext) for the Inbox, the sidebar
 * badge and the Health tab; the SystemHealth card runs it on its own when there is no console around.
 */
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import {
  BranchesOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  HddOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

import { dashboardApi, systemApi } from '../../api-client/clients';
import type {
  CeleryCheck,
  DiskCheck,
  HealthCheck,
  MigrationCheck,
  SystemHealthAck,
  SystemHealthResponse,
} from '../../api-client';
import { OverallEnum, StatusDfeEnum } from '../../api-client/models/index';
import { apiErrorMessageAsync } from '../../lib/apiError';

export const OVERALL_CONFIG: Record<
  OverallEnum,
  { color: string; text: string; badge: 'success' | 'warning' | 'error' | 'processing'; summary: string }
> = {
  [OverallEnum.Ok]: { color: '#52c41a', text: 'Healthy', badge: 'success', summary: 'Every check passed.' },
  [OverallEnum.Degraded]: {
    // orange-ink (6.5:1 on white); antd's orange-6 is 2.4:1 at this size.
    color: '#ad4e00',
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

export type AnyCheck = HealthCheck | CeleryCheck | DiskCheck | MigrationCheck;

/** The individual checks, in display order; `key` indexes the health response. */
export const CHECKS: {
  key: 'database' | 'celery' | 'cache' | 'migrations' | 'disk';
  name: string;
  icon: React.ReactNode;
}[] = [
  { key: 'database', name: 'Database', icon: <DatabaseOutlined /> },
  { key: 'celery', name: 'Task Queue', icon: <ClusterOutlined /> },
  { key: 'cache', name: 'Cache', icon: <ThunderboltOutlined /> },
  { key: 'migrations', name: 'Migrations', icon: <BranchesOutlined /> },
  { key: 'disk', name: 'Disk', icon: <HddOutlined /> },
];

export type CheckKey = (typeof CHECKS)[number]['key'];

/** What to do while a check is failing, and what the failure means for users: written once per
 *  check, by us, in the words of this deployment (app VM, data VM, compose). Shown only while failing. */
export const NEXT_STEPS: Record<CheckKey, (row: CeleryCheck & DiskCheck) => { next: React.ReactNode; means: string }> =
  {
    database: () => ({
      next: (
        <>
          Is the database container up? <code>docker compose ps database</code> where the data stack runs, then its log.
        </>
      ),
      means: 'Nothing works until it is back; requests answer 503.',
    }),
    // workerCount 0 means the broker answered and no worker did; null means the broker itself did not answer.
    celery: (row) =>
      row.workerCount === 0
        ? {
            next: (
              <>
                The broker answered but no worker did: is the worker container running?{' '}
                <code>docker compose ps worker</code> on the app VM, then its log.
              </>
            ),
            means: 'Autograder runs and emails wait in the queue and run once a worker is back.',
          }
        : {
            next: (
              <>
                The broker did not answer: is the Redis container up and reachable from the app VM?{' '}
                <code>docker compose ps redis</code>, then the API log.
              </>
            ),
            means: 'Nothing can be queued until the broker is back: autograder runs and emails fail.',
          },
    cache: () => ({
      next: (
        <>The API process could not read back a value it had just cached. Restart the api container and read its log.</>
      ),
      means: 'Pages still load; this points at the API container itself, not at Redis.',
    }),
    migrations: () => ({
      next: (
        <>
          A deploy left migrations unapplied: in the api container run <code>python manage.py migrate</code>.
        </>
      ),
      means: 'Requests that touch the changed tables fail with a 500.',
    }),
    disk: () => ({
      next: (
        <>
          Find what grew on the API host: uploads, logs, Docker images. <code>docker system df</code> there.
        </>
      ),
      means: 'Uploads and autograder runs fail once it fills.',
    }),
  };

/** The staff-wide acknowledgement lives on the server (GET/PUT/DELETE /dashboard/health_ack/): one note for everyone. */
/** What exactly is failing, so an acknowledgement expires the moment something else breaks. */
export function failureSignature(health: SystemHealthResponse | null): string {
  if (!health) return '';
  return CHECKS.map((c) => {
    const check = health[c.key] as AnyCheck | null | undefined;
    const status = check ? (check as HealthCheck).status : 'none';
    return status === StatusDfeEnum.Ok ? '' : `${c.key}:${status}`;
  })
    .filter(Boolean)
    .join('|');
}

/** Names of the checks that are not OK, for the one-line summary. */
export function failingCheckNames(health: SystemHealthResponse | null): string[] {
  if (!health) return [];
  return CHECKS.filter((c) => {
    const check = health[c.key] as AnyCheck | null | undefined;
    return check && (check as HealthCheck).status !== StatusDfeEnum.Ok;
  }).map((c) => c.name);
}

export type SystemHealthModel = ReturnType<typeof useSystemHealth>;

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ack, setAck] = useState<SystemHealthAck | null>(null);
  // Until the shared acknowledgement has been read, a failing check is not yet "unacknowledged".
  const [ackLoaded, setAckLoaded] = useState(false);
  const [ackBusy, setAckBusy] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60_000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    // The shared acknowledgement rides along with every check; a failure here only means "unknown".
    void dashboardApi
      .healthAckRetrieve()
      .then(setAck, () => undefined)
      .finally(() => setAckLoaded(true));
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

  return {
    health,
    loading,
    error,
    lastUpdated,
    ack,
    ackLoaded,
    ackBusy,
    refreshInterval,
    setRefreshInterval,
    checkHealth,
    overall,
    failing,
    unavailable,
    signature,
    acknowledged,
    acknowledge,
    clearAck,
    ackWhen,
    ackWho,
  };
}

export const SystemHealthContext = createContext<SystemHealthModel | null>(null);
