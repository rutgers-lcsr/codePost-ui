// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { Environment } from '../../../../../../api-client';

/**
 * The one answer to "what state is this environment's image in", shared by the page header's
 * badge and the notice under it so the two cannot disagree.
 *
 * building   a build is running (started here, or on its own after a package change)
 * queued     an automatic rebuild is waiting out its debounce
 * failed     the last build failed; runs keep using the previous image if there is one
 * waiting    reset to auto-detect and nothing has been detected yet
 * notBuilt   no image has been built
 * outOfDate  an image exists but was built from a different package list
 * ready      the image matches the configuration
 */
export type EnvironmentStatusKind = 'building' | 'queued' | 'failed' | 'waiting' | 'notBuilt' | 'outOfDate' | 'ready';

const BUILD_NOT_BUILT = 0;
const BUILD_BUILDING = 1;
const BUILD_FAILED = 3;

export const environmentStatus = (env: Environment, buildStartedHere: boolean): EnvironmentStatusKind => {
  if (buildStartedHere || env.buildStatus === BUILD_BUILDING) return 'building';
  if (env.rebuildScheduled) return 'queued';
  if (env.buildStatus === BUILD_FAILED) return 'failed';
  if (env.buildStatus === BUILD_NOT_BUILT || !env.imageName) {
    return (env.buildLogs || '').includes('Reset for Auto-Detection') ? 'waiting' : 'notBuilt';
  }
  if (env.imageOutOfDate) return 'outOfDate';
  return 'ready';
};

export const STATUS_LABEL: Record<EnvironmentStatusKind, string> = {
  building: 'Building',
  queued: 'Rebuild queued',
  failed: 'Build failed',
  waiting: 'Waiting for auto-detect',
  notBuilt: 'Not built',
  outOfDate: 'Out of date',
  ready: 'Ready',
};

/** The end of a build log, without colour codes: where a failed build says what went wrong. */
export const buildLogTail = (logs: string | undefined, lines = 6): string =>
  (logs || '')
    // eslint-disable-next-line no-control-regex
    .replace(/\x1b\[[0-9;]*m/g, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-lines)
    .join('\n');

/** Whether the viewer asked the system for less motion: spinning status icons hold still. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** How the page's Ctrl+M hint names the key on this platform. */
export const TAB_TOGGLE_KEY =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? 'Ctrl+Shift+M' : 'Ctrl+M';
