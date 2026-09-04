// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useEffect } from 'react';
import { Alert } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useApiStatusStore } from '../../stores/useApiStatusStore';

const INITIAL_DELAY_MS = 2000;
const MAX_DELAY_MS = 15000;

/**
 * Shown while the API status store says the server is unreachable. Polls the
 * readiness endpoint with backoff and, once it answers, clears the status and
 * refetches every query so stale "failed" screens recover without a reload.
 */
export default function ApiUnavailableBanner() {
  const status = useApiStatusStore((s) => s.status);
  const markOk = useApiStatusStore((s) => s.markOk);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== 'unavailable') return undefined;

    let delay = INITIAL_DELAY_MS;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const probe = async () => {
      try {
        // Older backends 404 this route — any non-5xx answer means the API is up.
        const res = await fetch(`${process.env.REACT_APP_API_URL}/health-check/ready/`, {
          signal: AbortSignal.timeout(5000),
        });
        if (cancelled) return;
        if (res.status < 500) {
          markOk();
          queryClient.invalidateQueries();
          return;
        }
      } catch {
        if (cancelled) return;
      }
      delay = Math.min(MAX_DELAY_MS, delay * 2);
      timer = setTimeout(probe, delay);
    };

    timer = setTimeout(probe, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status, markOk, queryClient]);

  if (status !== 'unavailable') return null;

  return (
    <Alert
      banner
      type="warning"
      showIcon
      data-testid="api-unavailable-banner"
      title="codePost can't reach the server right now. Retrying…"
    />
  );
}
