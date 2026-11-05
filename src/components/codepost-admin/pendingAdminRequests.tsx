// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * The admin access requests and the decisions on them, shared by the Requests tab and the Inbox.
 * Decisions wait UNDO_WINDOW_MS before they are sent (deny deletes the account, so the server
 * offers no way back); their rows leave the list at once and come back on Undo.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, message } from 'antd';

import type { PendingAdminUser } from '../../api-client';
import { dashboardApi } from '../../api-client/clients';
import { apiErrorMessageAsync, responseErrorMessage } from '../../lib/apiError';
import { getAuthToken } from '../../utils/auth';

export type Decision = 'approve' | 'deny';

export const UNDO_WINDOW_MS = 8000;

interface DeferredDecision {
  kind: Decision;
  emails: string[];
  timer: number;
}

/** Decisions sent while a list was unmounting: the next list fetch waits for them, so a freshly
 *  mounted Requests tab never shows a person whose approval is still in flight. */
let flushInFlight: Promise<unknown> = Promise.resolve();

export function usePendingAdminRequests(onChanged?: () => void) {
  const [pendingUsers, setPendingUsers] = useState<PendingAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Decisions wait UNDO_WINDOW_MS before they are sent (deny deletes the account, so the server
  // offers no way back); their rows leave the table at once and come back on Undo.
  const deferredRef = useRef<Map<string, DeferredDecision>>(new Map());
  const [hiddenEmails, setHiddenEmails] = useState<Set<string>>(new Set());

  const fetchPendingAdmins = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    await flushInFlight;
    try {
      // The client is generated without runtime mapping, so the wire key stays snake_case.
      const rows = (await dashboardApi.pendingAdminsList()) as Array<PendingAdminUser & { date_joined?: string }>;
      setPendingUsers(
        rows.map(({ date_joined, ...user }) => ({ ...user, dateJoined: date_joined ?? user.dateJoined ?? '' })),
      );
    } catch (error) {
      setLoadError((await apiErrorMessageAsync(error)) ?? 'Pending requests could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingAdmins();
  }, [fetchPendingAdmins]);

  // Plain fetch on purpose: the endpoint reads `user_email` (as schema.yaml documents) but the
  // generated client's PendingAdminActionRequest model names the field `userEmail`.
  const postAction = async (kind: Decision, email: string, keepalive = false) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/dashboard/${kind}_pending_admin/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
      body: JSON.stringify({ user_email: email }),
      keepalive,
    });
    if (!res.ok) throw new Error(await responseErrorMessage(res));
  };

  const syncHidden = () => {
    const emails = new Set<string>();
    deferredRef.current.forEach((d) => d.emails.forEach((e) => emails.add(e)));
    setHiddenEmails(emails);
  };

  const commit = async (key: string) => {
    const deferred = deferredRef.current.get(key);
    if (!deferred) return;
    deferredRef.current.delete(key);
    const failed: string[] = [];
    for (const email of deferred.emails) {
      try {
        await postAction(deferred.kind, email);
      } catch {
        failed.push(email);
      }
    }
    if (failed.length > 0) message.error(`Could not ${deferred.kind}: ${failed.join(', ')}`);
    await fetchPendingAdmins();
    syncHidden();
    onChanged?.();
  };

  const undo = (key: string) => {
    const deferred = deferredRef.current.get(key);
    if (!deferred) return;
    window.clearTimeout(deferred.timer);
    deferredRef.current.delete(key);
    syncHidden();
    message.open({ key, type: 'info', content: 'Undone. The request is back in the list.', duration: 2 });
  };

  const defer = (kind: Decision, emails: string[]) => {
    if (emails.length === 0) return;
    const key = `${kind}:${Date.now()}`;
    const timer = window.setTimeout(() => commit(key), UNDO_WINDOW_MS);
    deferredRef.current.set(key, { kind, emails, timer });
    syncHidden();
    const what =
      emails.length === 1
        ? kind === 'approve'
          ? `${emails[0]} approved.`
          : `Request from ${emails[0]} denied.`
        : `${emails.length} requests ${kind === 'approve' ? 'approved' : 'denied'}.`;
    message.open({
      key,
      type: 'success',
      duration: UNDO_WINDOW_MS / 1000,
      content: (
        <span>
          {what}{' '}
          <Button type="link" size="small" onClick={() => undo(key)} style={{ padding: '0 4px' }}>
            Undo
          </Button>
        </span>
      ),
    });
  };

  // Leaving the page (tab close, or navigating within the console) sends what is still waiting,
  // so a decision never silently evaporates with its Undo window.
  useEffect(() => {
    const flush = () => {
      const posts: Promise<void>[] = [];
      deferredRef.current.forEach((d, key) => {
        window.clearTimeout(d.timer);
        // The toast's Undo would find nothing to undo once this has been sent.
        message.destroy(key);
        d.emails.forEach((email) => posts.push(postAction(d.kind, email, true).catch(() => {})));
      });
      deferredRef.current.clear();
      if (posts.length > 0) {
        flushInFlight = Promise.allSettled(posts).then(() => onChanged?.());
      }
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
    // postAction only reads module-level config; it is stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** The requests still waiting for a decision (a deferred one is already out of the list). */
  const visibleUsers = pendingUsers.filter((u) => !hiddenEmails.has(u.email ?? ''));

  return { pendingUsers, visibleUsers, hiddenEmails, loading, loadError, fetchPendingAdmins, defer, undo };
}
