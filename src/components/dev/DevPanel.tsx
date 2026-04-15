// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { AnimatePresence, motion } from 'motion/react';
import { usePermissionsStore, CAPABILITY_DESCRIPTIONS } from '../../stores/usePermissionsStore';
import type { Capabilities, Capability } from '../../stores/usePermissionsStore';
import { brandColors, neutralColors, greenPalette, actionColors } from '../../theme/colors';
import { Course as CourseService } from '../../services/course';
import { getAuthToken, getDecodedTokenPayload } from '../../utils/auth';
import { useDevRequestLog } from './useDevRequestLog';
import type { RequestEntry } from './useDevRequestLog';
import type { UserType, CourseType } from '../../types/models';
import { recentConsoleLogs } from '../../utils/diagnostics';
import { useCodeConsoleStore } from '../../stores/useCodeConsoleStore';
import { useRubricStore } from '../../stores/useRubricStore';
import { useRubricCommentStore } from '../../stores/useRubricCommentStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = 'course' | 'capabilities' | 'roles' | 'network' | 'console' | 'state' | 'environment';

interface Props {
  replaceUser: (user: UserType, redirect: boolean, isSuperUser: boolean) => void;
}

// ---------------------------------------------------------------------------
// Role switcher config
// ---------------------------------------------------------------------------

const ROLES = [
  { key: 'student', label: 'Student', icon: '👤', desc: 'View as a student in the demo course' },
  { key: 'grader_basic', label: 'Grader', icon: '✏️', desc: 'Basic grader with standard permissions' },
  { key: 'grader_rubric', label: 'Rubric Editor', icon: '📝', desc: 'Grader with rubric editing rights' },
  { key: 'grader_super', label: 'Super Grader', icon: '⚡', desc: 'Grader with elevated permissions' },
  { key: 'course_admin', label: 'Course Admin', icon: '👑', desc: 'Full course administration access' },
  { key: 'staff', label: 'Staff', icon: '🛡️', desc: 'Platform staff / superuser' },
] as const;

// ---------------------------------------------------------------------------
// Course fields
// ---------------------------------------------------------------------------

interface SettingField {
  key: string;
  label: string;
  group: string;
}

const COURSE_FIELDS: SettingField[] = [
  { key: 'id', label: 'ID', group: 'Identity' },
  { key: 'name', label: 'Name', group: 'Identity' },
  { key: 'period', label: 'Period', group: 'Identity' },
  { key: 'organization', label: 'Organization', group: 'Identity' },
  { key: 'timezone', label: 'Timezone', group: 'Identity' },
  { key: 'studentCount', label: 'Students', group: 'Counts' },
  { key: 'assignments', label: 'Assignments', group: 'Counts' },
  { key: 'sections', label: 'Sections', group: 'Counts' },
  { key: 'activateQueue', label: 'Queue Active', group: 'Grading' },
  { key: 'sendReleasedSubmissionsToBack', label: 'Released → Back of Queue', group: 'Grading' },
  { key: 'anonymousGradingDefault', label: 'Anonymous Grading Default', group: 'Grading' },
  { key: 'allowGradersToEditRubric', label: 'Graders Edit Rubric', group: 'Grading' },
  { key: 'minComments', label: 'Min Comments', group: 'Grading' },
  { key: 'noUnfinalize', label: 'No Unfinalize', group: 'Grading' },
  { key: 'showStudentsStatistics', label: 'Show Stats to Students', group: 'Students' },
  { key: 'studentsCanSeeGraders', label: 'Show Grader Identity', group: 'Students' },
  { key: 'enableStudentFeedbackNotifications', label: 'Feedback Notifications', group: 'Students' },
  { key: 'lateDayCreditsAllowable', label: 'Late Day Credits', group: 'Students' },
  { key: 'archived', label: 'Archived', group: 'Access' },
  { key: 'inviteCodeEnabled', label: 'Invite Code Enabled', group: 'Access' },
  { key: 'inviteCode', label: 'Invite Code', group: 'Access' },
  { key: 'emailWhitelist', label: 'Email Whitelist', group: 'Access' },
  { key: 'emailNewUsers', label: 'Email New Users', group: 'Access' },
  { key: 'expirationDate', label: 'Expiration', group: 'Access' },
  { key: 'isRubricEditor', label: 'Is Rubric Editor', group: 'My Role' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(val: unknown): { text: string; type: string } {
  if (val === true) return { text: 'true', type: 'true' };
  if (val === false) return { text: 'false', type: 'false' };
  if (val === null || val === undefined) return { text: '—', type: 'null' };
  if (Array.isArray(val)) return { text: `${val.length}`, type: 'number' };
  if (typeof val === 'object') return { text: JSON.stringify(val), type: 'object' };
  return { text: String(val), type: typeof val };
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => message.success({ content: `${label} copied`, duration: 1.5 }),
    () => message.error({ content: 'Copy failed', duration: 1.5 }),
  );
}

function formatMs(ms: number | null): string {
  if (ms === null) return '…';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusColor(status: number | null): string {
  if (status === null) return neutralColors.disable;
  if (status >= 200 && status < 300) return brandColors.primary;
  if (status >= 400 && status < 500) return actionColors.yellow;
  if (status >= 500) return actionColors.red;
  return neutralColors.secondaryText;
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#1890ff',
  POST: brandColors.primary,
  PUT: '#d48806',
  PATCH: '#d48806',
  DELETE: actionColors.red,
};

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

const GroupHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      padding: '10px 16px 4px',
      fontSize: 10,
      fontWeight: 600,
      color: neutralColors.secondaryText,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const EmptyState: React.FC<{ icon: string; title: string; sub?: string }> = ({ icon, title, sub }) => (
  <div style={{ padding: '40px 16px', textAlign: 'center', color: neutralColors.disable }}>
    <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 11 }}>{title}</div>
    {sub && <div style={{ fontSize: 10, color: neutralColors.disable, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd
    style={{
      display: 'inline-block',
      padding: '0px 4px',
      fontSize: 10,
      color: neutralColors.secondaryText,
      background: neutralColors.background,
      border: `1px solid ${neutralColors.border}`,
      borderRadius: 3,
      lineHeight: '16px',
      fontFamily: "'SF Mono', Menlo, monospace",
    }}
  >
    {children}
  </kbd>
);

// ---------------------------------------------------------------------------
// Tab: Course
// ---------------------------------------------------------------------------

const CourseTab: React.FC = () => {
  const cache = usePermissionsStore((s) => s.cache);
  const [course, setCourse] = useState<CourseType | null>(null);
  const [loading, setLoading] = useState(false);

  const courseId = Object.keys(cache)
    .filter((k) => k.startsWith('course:'))
    .map((k) => parseInt(k.split(':')[1], 10))
    .find((id) => !isNaN(id));

  useEffect(() => {
    if (!courseId) {
      setCourse(null);
      return;
    }
    if (course && course.id === courseId) return;

    let cancelled = false;
    setLoading(true);
    CourseService.read(courseId)
      .then((c) => {
        if (!cancelled) setCourse(c);
      })
      .catch(() => {
        if (!cancelled) setCourse(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!courseId) {
    return <EmptyState icon="∅" title="No course selected" sub="Navigate to a course to inspect its data." />;
  }

  if (loading || !course) {
    return <EmptyState icon="◌" title={loading ? 'Loading…' : 'No course data'} />;
  }

  const groups = new Map<string, SettingField[]>();
  for (const f of COURSE_FIELDS) {
    if (!groups.has(f.group)) groups.set(f.group, []);
    groups.get(f.group)!.push(f);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      {Array.from(groups).map(([group, fields], gi) => (
        <motion.div
          key={group}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: gi * 0.03 }}
        >
          <GroupHeader>{group}</GroupHeader>
          {fields.map((f) => {
            const raw = (course as unknown as Record<string, unknown>)[f.key];
            const { text, type } = formatValue(raw);
            const isBool = type === 'true' || type === 'false';
            return (
              <div
                key={f.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 16px',
                  minHeight: 26,
                }}
              >
                <span style={{ color: neutralColors.mainText, fontSize: 11 }}>{f.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isBool ? 600 : 400,
                    color:
                      type === 'true'
                        ? brandColors.primary
                        : type === 'false'
                          ? neutralColors.disable
                          : neutralColors.title,
                    fontFamily: isBool ? 'inherit' : "'SF Mono', monospace",
                  }}
                  title={String(raw ?? '')}
                >
                  {isBool && (type === 'true' ? '● ' : '○ ')}
                  {text}
                </span>
              </div>
            );
          })}
        </motion.div>
      ))}
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Capabilities
// ---------------------------------------------------------------------------

const CapabilitiesTab: React.FC = () => {
  const cache = usePermissionsStore((s) => s.cache);
  const overrides = usePermissionsStore((s) => s.overrides);
  const toggleOverride = usePermissionsStore((s) => s.toggleOverride);
  const clearOverrides = usePermissionsStore((s) => s.clearOverrides);
  const fetchCourse = usePermissionsStore((s) => s.fetchCourseCapabilities);
  const fetchAssignment = usePermissionsStore((s) => s.fetchAssignmentCapabilities);
  const fetchSubmission = usePermissionsStore((s) => s.fetchSubmissionCapabilities);
  const fetchPlatform = usePermissionsStore((s) => s.fetchPlatformCapabilities);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('');
  const [showDescs, setShowDescs] = useState(false);

  // Eagerly fetch platform caps so they appear in the panel
  React.useEffect(() => {
    fetchPlatform();
  }, [fetchPlatform]);

  const allCaps: Record<string, Capabilities> = {};
  for (const k of Object.keys(cache)) {
    if (cache[k] && typeof cache[k] === 'object') allCaps[k] = cache[k].caps;
  }
  // Also surface overrides that have no cache entry (e.g. platform after reload)
  for (const k of Object.keys(overrides)) {
    if (!allCaps[k]) allCaps[k] = {};
  }

  const hasOverrides = Object.keys(overrides).length > 0;

  if (Object.keys(allCaps).length === 0) {
    return <EmptyState icon="🔒" title="No capabilities loaded" sub="Navigate to a course or submission." />;
  }

  const toggle = (k: string) => setCollapsed((p) => ({ ...p, [k]: !p[k] }));
  const sortedKeys = Object.keys(allCaps).sort();
  const lowerFilter = filter.toLowerCase();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      {/* Toolbar */}
      <div style={{ padding: '6px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: neutralColors.background,
            border: `1px solid ${neutralColors.border}`,
            borderRadius: 4,
            padding: '0 8px',
            height: 28,
          }}
        >
          <input
            type="text"
            placeholder="Filter capabilities…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: neutralColors.title,
              fontSize: 11,
              outline: 'none',
              padding: '4px 0',
            }}
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              style={{
                background: 'none',
                border: 'none',
                color: neutralColors.disable,
                cursor: 'pointer',
                fontSize: 12,
                padding: '0 2px',
              }}
              aria-label="Clear filter"
            >
              ×
            </button>
          )}
        </div>
        {hasOverrides && (
          <button
            onClick={clearOverrides}
            style={{
              background: '#fff0f0',
              border: '1px solid #ffa39e',
              color: '#cf1322',
              borderRadius: 4,
              fontSize: 10,
              cursor: 'pointer',
              padding: '2px 8px',
              whiteSpace: 'nowrap',
            }}
            aria-label="Clear all overrides"
          >
            Clear overrides
          </button>
        )}
        <button
          onClick={() => setShowDescs((v) => !v)}
          style={{
            background: showDescs ? greenPalette.green1 : 'transparent',
            border: `1px solid ${neutralColors.border}`,
            color: neutralColors.secondaryText,
            borderRadius: 4,
            fontSize: 10,
            cursor: 'pointer',
            padding: '2px 8px',
          }}
          aria-label="Toggle descriptions"
        >
          {showDescs ? 'Hide info' : 'Show info'}
        </button>
      </div>

      {sortedKeys.map((cacheKey) => {
        const caps = allCaps[cacheKey];
        const keyOverrides = overrides[cacheKey] ?? {};
        const scope = cacheKey.includes(':') ? cacheKey.split(':')[0] : cacheKey;
        const id = cacheKey.includes(':') ? cacheKey.split(':')[1] : undefined;

        const allCapKeys = Object.keys(caps)
          .filter((c) => typeof caps[c as Capability] === 'boolean')
          .filter((c) => !lowerFilter || c.toLowerCase().includes(lowerFilter))
          .sort();

        const granted = allCapKeys.filter((c) => {
          const cap = c as Capability;
          if (cap in keyOverrides) return keyOverrides[cap] === true;
          return caps[cap] === true;
        }).length;

        const isCollapsed = collapsed[cacheKey];

        return (
          <div key={cacheKey} style={{ marginBottom: 2 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px 4px',
                borderBottom: `1px solid ${neutralColors.divider}`,
                cursor: 'pointer',
              }}
              onClick={() => toggle(cacheKey)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggle(cacheKey)}
              aria-expanded={!isCollapsed}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: neutralColors.title }}>
                {isCollapsed ? '▸' : '▾'} {scope}
                {id && <span style={{ color: neutralColors.disable, fontWeight: 400 }}>:{id}</span>}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 40,
                    height: 3,
                    background: neutralColors.background,
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: allCapKeys.length > 0 ? `${(granted / allCapKeys.length) * 100}%` : '0%',
                      height: '100%',
                      background: granted === allCapKeys.length ? brandColors.primary : actionColors.yellow,
                      borderRadius: 2,
                      transition: 'width 200ms ease',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: granted === allCapKeys.length ? brandColors.primary : neutralColors.disable,
                    fontWeight: 600,
                  }}
                >
                  {granted}/{allCapKeys.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    usePermissionsStore.getState().invalidate(cacheKey);
                    if (scope === 'course' && id) fetchCourse(parseInt(id, 10));
                    else if (scope === 'assignment' && id) fetchAssignment(parseInt(id, 10));
                    else if (scope === 'submission' && id) fetchSubmission(parseInt(id, 10));
                    else if (scope === 'platform') fetchPlatform();
                  }}
                  style={{
                    background: 'none',
                    border: `1px solid ${neutralColors.border}`,
                    color: neutralColors.secondaryText,
                    borderRadius: 4,
                    fontSize: 10,
                    cursor: 'pointer',
                    padding: '1px 6px',
                  }}
                  aria-label={`Refresh ${scope} ${id}`}
                >
                  ↻
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ overflow: 'hidden' }}
                >
                  {allCapKeys.map((cap) => {
                    const capKey = cap as Capability;
                    const serverVal = caps[capKey] === true;
                    const isOverridden = capKey in keyOverrides;
                    const effectiveVal = isOverridden ? keyOverrides[capKey] === true : serverVal;

                    return (
                      <div
                        key={cap}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          padding: '3px 16px 3px 24px',
                          gap: 8,
                          background: isOverridden ? 'rgba(255, 200, 0, 0.08)' : 'transparent',
                          borderLeft: isOverridden ? `2px solid ${actionColors.yellow}` : '2px solid transparent',
                          transition: 'background 120ms',
                        }}
                        title={CAPABILITY_DESCRIPTIONS[cap as keyof typeof CAPABILITY_DESCRIPTIONS]}
                      >
                        <button
                          onClick={() => toggleOverride(cacheKey, capKey)}
                          style={{
                            width: 28,
                            height: 14,
                            borderRadius: 7,
                            border: isOverridden ? '1.5px solid #faad14' : `1px solid ${neutralColors.border}`,
                            background: effectiveVal ? brandColors.primary : neutralColors.disable,
                            cursor: 'pointer',
                            padding: 0,
                            position: 'relative',
                            flexShrink: 0,
                            marginTop: 2,
                            transition: 'background 120ms, border-color 120ms',
                          }}
                          aria-label={`Toggle ${cap}`}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: 1,
                              left: effectiveVal ? 14 : 2,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: '#fff',
                              transition: 'left 120ms',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            }}
                          />
                        </button>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: effectiveVal ? neutralColors.title : neutralColors.disable,
                              fontFamily: "'SF Mono', monospace",
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {cap}
                            {isOverridden && (
                              <span
                                style={{
                                  fontSize: 8,
                                  background: '#faad14',
                                  color: '#fff',
                                  borderRadius: 3,
                                  padding: '0 4px',
                                  fontWeight: 700,
                                  fontFamily: 'inherit',
                                  lineHeight: '14px',
                                }}
                              >
                                DEV
                              </span>
                            )}
                          </div>
                          {showDescs && CAPABILITY_DESCRIPTIONS[cap as keyof typeof CAPABILITY_DESCRIPTIONS] && (
                            <div
                              style={{
                                fontSize: 10,
                                color: neutralColors.secondaryText,
                                lineHeight: '14px',
                                marginTop: 1,
                              }}
                            >
                              {CAPABILITY_DESCRIPTIONS[cap as keyof typeof CAPABILITY_DESCRIPTIONS]}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Roles (with impersonation)
// ---------------------------------------------------------------------------

const RolesTab: React.FC<{
  onSwitch: (role: string) => void;
  onImpersonate: (email: string) => void;
  loading: boolean;
}> = ({ onSwitch, onImpersonate, loading }) => {
  const [impersonateInput, setImpersonateInput] = useState('');

  const handleImpersonate = () => {
    const trimmed = impersonateInput.trim();
    if (!trimmed) return;
    onImpersonate(trimmed);
    setImpersonateInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      style={{ padding: '8px 0' }}
    >
      {/* Quick roles */}
      <GroupHeader>Switch Role</GroupHeader>
      {ROLES.map((role, i) => (
        <motion.button
          key={role.key}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.12, delay: i * 0.03 }}
          onClick={() => onSwitch(role.key)}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: `1px solid ${neutralColors.divider}`,
            cursor: loading ? 'wait' : 'pointer',
            textAlign: 'left',
            opacity: loading ? 0.5 : 1,
            transition: 'background 100ms',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = greenPalette.green1;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{role.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: neutralColors.title }}>{role.label}</div>
            <div style={{ fontSize: 10, color: neutralColors.secondaryText, marginTop: 1 }}>{role.desc}</div>
          </div>
          <span style={{ color: neutralColors.disable, fontSize: 12 }}>›</span>
        </motion.button>
      ))}

      {/* Impersonate by email */}
      <GroupHeader>Impersonate User</GroupHeader>
      <div style={{ padding: '4px 16px 12px', display: 'flex', gap: 6 }}>
        <input
          type="text"
          placeholder="Email or user ID…"
          value={impersonateInput}
          onChange={(e) => setImpersonateInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleImpersonate()}
          disabled={loading}
          style={{
            flex: 1,
            background: neutralColors.background,
            border: `1px solid ${neutralColors.border}`,
            color: neutralColors.title,
            borderRadius: 4,
            padding: '5px 8px',
            fontSize: 11,
            outline: 'none',
          }}
        />
        <button
          onClick={handleImpersonate}
          disabled={loading || !impersonateInput.trim()}
          style={{
            background: brandColors.primary,
            border: 'none',
            color: '#fff',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            cursor: loading || !impersonateInput.trim() ? 'not-allowed' : 'pointer',
            padding: '5px 12px',
            opacity: loading || !impersonateInput.trim() ? 0.5 : 1,
          }}
        >
          Go
        </button>
      </div>

      <div style={{ padding: '4px 16px', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: neutralColors.disable }}>
          Roles use /dev-auth/login-as/ · Impersonate uses /impersonate/
        </span>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Network
// ---------------------------------------------------------------------------

const NetworkTab: React.FC = () => {
  const entries = useDevRequestLog((s) => s.entries);
  const clear = useDevRequestLog((s) => s.clear);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'error'>('all');

  const errorCount = entries.filter((e) => e.status !== null && (e.status >= 400 || e.status === 0)).length;
  const lf = filter.toLowerCase();
  const filtered = entries.filter((e) => {
    if (lf && !e.path.toLowerCase().includes(lf) && !e.method.toLowerCase().includes(lf)) return false;
    if (statusFilter === 'ok' && (e.status === null || e.status >= 400)) return false;
    if (statusFilter === 'error' && (e.status === null || e.status < 400)) return false;
    return true;
  });

  if (entries.length === 0) {
    return <EmptyState icon="📡" title="No API requests yet" sub="Requests to the API will appear here." />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      {/* Toolbar */}
      <div style={{ padding: '6px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: neutralColors.background,
            border: `1px solid ${neutralColors.border}`,
            borderRadius: 4,
            padding: '0 8px',
            height: 26,
          }}
        >
          <input
            type="text"
            placeholder="Filter by path or method…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: neutralColors.title,
              fontSize: 10,
              outline: 'none',
              padding: '4px 0',
            }}
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              style={{
                background: 'none',
                border: 'none',
                color: neutralColors.disable,
                cursor: 'pointer',
                fontSize: 11,
                padding: '0 2px',
              }}
            >
              ×
            </button>
          )}
        </div>
        {/* Status filter pills */}
        {(['all', 'ok', 'error'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              background:
                statusFilter === s
                  ? s === 'error'
                    ? '#fff1f0'
                    : s === 'ok'
                      ? greenPalette.green1
                      : neutralColors.background
                  : 'transparent',
              border: `1px solid ${statusFilter === s ? (s === 'error' ? '#ffa39e' : neutralColors.border) : 'transparent'}`,
              color:
                statusFilter === s
                  ? s === 'error'
                    ? actionColors.red
                    : s === 'ok'
                      ? brandColors.primary
                      : neutralColors.secondaryText
                  : neutralColors.disable,
              borderRadius: 4,
              fontSize: 9,
              cursor: 'pointer',
              padding: '2px 6px',
              fontWeight: statusFilter === s ? 600 : 400,
            }}
          >
            {s === 'all' ? 'All' : s === 'ok' ? '2xx' : 'Err'}
          </button>
        ))}
        <button
          onClick={clear}
          style={{
            background: 'none',
            border: `1px solid ${neutralColors.border}`,
            color: neutralColors.secondaryText,
            borderRadius: 4,
            fontSize: 10,
            cursor: 'pointer',
            padding: '2px 8px',
          }}
        >
          Clear
        </button>
      </div>
      {/* Summary */}
      <div style={{ padding: '0 16px 4px', fontSize: 10, color: neutralColors.disable }}>
        {filtered.length === entries.length
          ? `${entries.length} request${entries.length !== 1 ? 's' : ''}`
          : `${filtered.length} of ${entries.length}`}
        {errorCount > 0 && (
          <span style={{ color: actionColors.red, marginLeft: 6 }}>
            {errorCount} error{errorCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Request list */}
      <div>
        {filtered.map((entry) => (
          <RequestRow key={entry.id} entry={entry} />
        ))}
        {filtered.length === 0 && entries.length > 0 && (
          <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 10, color: neutralColors.disable }}>
            No requests match filter
          </div>
        )}
      </div>
    </motion.div>
  );
};

const RequestRow: React.FC<{ entry: RequestEntry }> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const [activePane, setActivePane] = useState<'response' | 'request' | 'headers'>('response');
  const isPending = entry.status === null;
  const isError = entry.status !== null && (entry.status >= 400 || entry.status === 0);
  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const hasReqBody = entry.requestBody !== undefined;
  const hasResBody = entry.responseBody !== undefined;
  const hasHeaders = entry.requestHeaders || entry.responseHeaders;

  return (
    <div
      style={{
        borderBottom: `1px solid ${neutralColors.divider}`,
        background: isError ? 'rgba(246, 72, 82, 0.04)' : 'transparent',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 16px',
          cursor: 'pointer',
          fontSize: 11,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand indicator */}
        <span
          style={{
            fontSize: 8,
            color: neutralColors.disable,
            width: 8,
            flexShrink: 0,
            transition: 'transform 100ms',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ▶
        </span>

        {/* Method badge */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            fontFamily: "'SF Mono', monospace",
            color: METHOD_COLORS[entry.method] ?? neutralColors.secondaryText,
            width: 36,
            flexShrink: 0,
          }}
        >
          {entry.method}
        </span>

        {/* Path */}
        <span
          style={{
            flex: 1,
            fontFamily: "'SF Mono', monospace",
            fontSize: 10,
            color: neutralColors.title,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={entry.path}
        >
          {entry.path}
        </span>

        {/* Status */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "'SF Mono', monospace",
            color: statusColor(entry.status),
            width: 28,
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {isPending ? '…' : entry.status}
        </span>

        {/* Duration */}
        <span
          style={{
            fontSize: 9,
            color: neutralColors.disable,
            fontFamily: "'SF Mono', monospace",
            width: 40,
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {formatMs(entry.duration)}
        </span>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '2px 16px 8px', fontSize: 10, color: neutralColors.secondaryText }}>
              {/* Meta row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                  gap: 8,
                }}
              >
                <span style={{ fontFamily: "'SF Mono', monospace", fontSize: 9, color: neutralColors.disable }}>
                  {timeStr}
                </span>
                <span
                  style={{
                    fontFamily: "'SF Mono', monospace",
                    fontSize: 9,
                    color: neutralColors.disable,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    textAlign: 'right',
                  }}
                  title={entry.url}
                >
                  {entry.url}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(entry.url, 'URL');
                  }}
                  style={{
                    background: 'none',
                    border: `1px solid ${neutralColors.border}`,
                    color: neutralColors.disable,
                    borderRadius: 3,
                    fontSize: 9,
                    cursor: 'pointer',
                    padding: '0 4px',
                    lineHeight: '14px',
                    flexShrink: 0,
                  }}
                >
                  Copy
                </button>
              </div>

              {/* Pane tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: 0,
                  marginBottom: 4,
                  borderBottom: `1px solid ${neutralColors.divider}`,
                }}
              >
                {[
                  { key: 'response' as const, label: 'Response', show: true },
                  { key: 'request' as const, label: 'Request', show: hasReqBody },
                  { key: 'headers' as const, label: 'Headers', show: !!hasHeaders },
                ]
                  .filter((p) => p.show)
                  .map((p) => (
                    <button
                      key={p.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePane(p.key);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        borderBottom:
                          activePane === p.key ? `2px solid ${brandColors.primary}` : '2px solid transparent',
                        color: activePane === p.key ? brandColors.primary : neutralColors.disable,
                        fontSize: 10,
                        fontWeight: activePane === p.key ? 600 : 400,
                        cursor: 'pointer',
                        padding: '3px 8px',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}

                {/* Copy body button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const data =
                      activePane === 'request'
                        ? entry.requestBody
                        : activePane === 'headers'
                          ? { request: entry.requestHeaders, response: entry.responseHeaders }
                          : entry.responseBody;
                    if (data !== undefined) {
                      copyToClipboard(typeof data === 'string' ? data : JSON.stringify(data, null, 2), activePane);
                    }
                  }}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: `1px solid ${neutralColors.border}`,
                    color: neutralColors.disable,
                    borderRadius: 3,
                    fontSize: 9,
                    cursor: 'pointer',
                    padding: '0 5px',
                    lineHeight: '14px',
                    alignSelf: 'center',
                  }}
                >
                  Copy JSON
                </button>
              </div>

              {/* Pane content */}
              <div
                style={{
                  background: neutralColors.background,
                  border: `1px solid ${neutralColors.divider}`,
                  borderRadius: 4,
                  maxHeight: 300,
                  overflowY: 'auto',
                  overflowX: 'auto',
                }}
              >
                {activePane === 'response' &&
                  (hasResBody ? (
                    <JsonTree data={entry.responseBody} />
                  ) : isPending ? (
                    <div style={{ padding: '12px 10px', color: neutralColors.disable, fontSize: 10 }}>Pending…</div>
                  ) : (
                    <div style={{ padding: '12px 10px', color: neutralColors.disable, fontSize: 10 }}>
                      No response body
                    </div>
                  ))}
                {activePane === 'request' &&
                  (hasReqBody ? (
                    <JsonTree data={entry.requestBody} />
                  ) : (
                    <div style={{ padding: '12px 10px', color: neutralColors.disable, fontSize: 10 }}>
                      No request body
                    </div>
                  ))}
                {activePane === 'headers' && (
                  <div style={{ padding: '4px 0' }}>
                    {entry.requestHeaders && (
                      <>
                        <div
                          style={{
                            padding: '4px 10px 2px',
                            fontSize: 9,
                            fontWeight: 600,
                            color: neutralColors.disable,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Request Headers
                        </div>
                        <HeaderTable headers={entry.requestHeaders} />
                      </>
                    )}
                    {entry.responseHeaders && (
                      <>
                        <div
                          style={{
                            padding: '6px 10px 2px',
                            fontSize: 9,
                            fontWeight: 600,
                            color: neutralColors.disable,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Response Headers
                        </div>
                        <HeaderTable headers={entry.responseHeaders} />
                      </>
                    )}
                  </div>
                )}
              </div>

              {entry.error && (
                <div style={{ color: actionColors.red, marginTop: 4, fontSize: 10 }}>Error: {entry.error}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// JSON Tree Viewer
// ---------------------------------------------------------------------------

const JSON_COLORS = {
  key: '#7c3aed',
  string: '#16803c',
  number: '#1d4ed8',
  boolean: '#d97706',
  null: neutralColors.disable,
  bracket: neutralColors.secondaryText,
  toggle: neutralColors.disable,
};

const JsonTree: React.FC<{ data: unknown }> = ({ data }) => {
  if (data === undefined || data === null) {
    return <div style={{ padding: '12px 10px', color: neutralColors.disable, fontSize: 10 }}>null</div>;
  }
  if (typeof data === 'string') {
    return (
      <pre
        style={{
          margin: 0,
          padding: '8px 10px',
          fontSize: 10,
          fontFamily: "'SF Mono', Menlo, monospace",
          color: JSON_COLORS.string,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {data}
      </pre>
    );
  }
  return (
    <div style={{ padding: '4px 0' }}>
      <JsonNode data={data} depth={0} defaultOpen={true} />
    </div>
  );
};

const JsonNode: React.FC<{ data: unknown; depth: number; label?: string; defaultOpen?: boolean }> = ({
  data,
  depth,
  label,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen || depth < 1);
  const indent = depth * 14 + 10;
  const mono: React.CSSProperties = {
    fontFamily: "'SF Mono', Menlo, monospace",
    fontSize: 10,
    lineHeight: '18px',
  };

  // Primitive values
  if (data === null || data === undefined) {
    return (
      <div style={{ paddingLeft: indent, ...mono }}>
        {label !== undefined && <span style={{ color: JSON_COLORS.key }}>{label}: </span>}
        <span style={{ color: JSON_COLORS.null, fontStyle: 'italic' }}>null</span>
      </div>
    );
  }
  if (typeof data === 'boolean') {
    return (
      <div style={{ paddingLeft: indent, ...mono }}>
        {label !== undefined && <span style={{ color: JSON_COLORS.key }}>{label}: </span>}
        <span style={{ color: JSON_COLORS.boolean, fontWeight: 600 }}>{String(data)}</span>
      </div>
    );
  }
  if (typeof data === 'number') {
    return (
      <div style={{ paddingLeft: indent, ...mono }}>
        {label !== undefined && <span style={{ color: JSON_COLORS.key }}>{label}: </span>}
        <span style={{ color: JSON_COLORS.number }}>{data}</span>
      </div>
    );
  }
  if (typeof data === 'string') {
    const isLong = data.length > 80;
    return (
      <div style={{ paddingLeft: indent, ...mono, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {label !== undefined && <span style={{ color: JSON_COLORS.key }}>{label}: </span>}
        <span style={{ color: JSON_COLORS.string }}>"{isLong ? data.slice(0, 200) + '…' : data}"</span>
      </div>
    );
  }

  // Arrays and Objects
  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(data as Record<string, unknown>);
  const count = entries.length;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  if (count === 0) {
    return (
      <div style={{ paddingLeft: indent, ...mono }}>
        {label !== undefined && <span style={{ color: JSON_COLORS.key }}>{label}: </span>}
        <span style={{ color: JSON_COLORS.bracket }}>
          {openBracket}
          {closeBracket}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ paddingLeft: indent, cursor: 'pointer', userSelect: 'none', ...mono }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ color: JSON_COLORS.toggle, fontSize: 8, marginRight: 4 }}>{open ? '▾' : '▸'}</span>
        {label !== undefined && <span style={{ color: JSON_COLORS.key }}>{label}: </span>}
        <span style={{ color: JSON_COLORS.bracket }}>{openBracket}</span>
        {!open && (
          <span style={{ color: neutralColors.disable }}> {isArray ? `${count} items` : `${count} keys`} </span>
        )}
        {!open && <span style={{ color: JSON_COLORS.bracket }}>{closeBracket}</span>}
      </div>
      {open && (
        <>
          {entries.map(([k, v]) => (
            <JsonNode key={k} data={v} depth={depth + 1} label={isArray ? undefined : k} />
          ))}
          <div style={{ paddingLeft: indent, ...mono }}>
            <span style={{ color: JSON_COLORS.bracket }}>{closeBracket}</span>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Header Table
// ---------------------------------------------------------------------------

const HeaderTable: React.FC<{ headers: Record<string, string> }> = ({ headers }) => (
  <div style={{ padding: '0 10px 4px' }}>
    {Object.entries(headers).map(([k, v]) => (
      <div
        key={k}
        style={{ display: 'flex', gap: 8, padding: '1px 0', fontSize: 10, fontFamily: "'SF Mono', Menlo, monospace" }}
      >
        <span style={{ color: JSON_COLORS.key, flexShrink: 0 }}>{k}</span>
        <span style={{ color: neutralColors.mainText, wordBreak: 'break-all' }}>{v}</span>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Tab: Console (surfaces diagnostics.ts captured errors/warnings)
// ---------------------------------------------------------------------------

const ConsoleTab: React.FC = () => {
  const [logs, setLogs] = useState(recentConsoleLogs.slice());
  const [levelFilter, setLevelFilter] = useState<'all' | 'error' | 'warn'>('all');
  const [search, setSearch] = useState('');

  // Poll for new entries since recentConsoleLogs is a plain array
  useEffect(() => {
    const iv = setInterval(() => {
      setLogs(recentConsoleLogs.slice());
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const lowerSearch = search.toLowerCase();
  const filtered = logs.filter((l) => {
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (lowerSearch && !l.message.toLowerCase().includes(lowerSearch)) return false;
    return true;
  });

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  if (logs.length === 0) {
    return <EmptyState icon="📋" title="No console output" sub="Errors and warnings will appear here." />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      {/* Toolbar */}
      <div style={{ padding: '6px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: neutralColors.background,
            border: `1px solid ${neutralColors.border}`,
            borderRadius: 4,
            padding: '0 8px',
            height: 26,
          }}
        >
          <input
            type="text"
            placeholder="Filter logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: neutralColors.title,
              fontSize: 10,
              outline: 'none',
              padding: '4px 0',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'none',
                border: 'none',
                color: neutralColors.disable,
                cursor: 'pointer',
                fontSize: 11,
                padding: '0 2px',
              }}
            >
              ×
            </button>
          )}
        </div>
        {(['all', 'error', 'warn'] as const).map((lvl) => {
          const count = lvl === 'all' ? logs.length : lvl === 'error' ? errorCount : warnCount;
          return (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              style={{
                background:
                  levelFilter === lvl
                    ? lvl === 'error'
                      ? '#fff1f0'
                      : lvl === 'warn'
                        ? '#fffbe6'
                        : neutralColors.background
                    : 'transparent',
                border: `1px solid ${levelFilter === lvl ? (lvl === 'error' ? '#ffa39e' : lvl === 'warn' ? '#ffe58f' : neutralColors.border) : 'transparent'}`,
                color:
                  levelFilter === lvl
                    ? lvl === 'error'
                      ? actionColors.red
                      : lvl === 'warn'
                        ? '#d48806'
                        : neutralColors.secondaryText
                    : neutralColors.disable,
                borderRadius: 4,
                fontSize: 9,
                cursor: 'pointer',
                padding: '2px 6px',
                fontWeight: levelFilter === lvl ? 600 : 400,
              }}
            >
              {lvl === 'all' ? 'All' : lvl === 'error' ? `Err ${count}` : `Warn ${count}`}
            </button>
          );
        })}
      </div>

      {/* Log entries — newest first */}
      <div>
        {[...filtered].reverse().map((log, i) => (
          <ConsoleLogRow key={`${log.at}-${i}`} log={log} />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 10, color: neutralColors.disable }}>
            No logs match filter
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ConsoleLogRow: React.FC<{ log: { level: string; message: string; at: string } }> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const isError = log.level === 'error';
  const time = new Date(log.at);
  const timeStr = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // First line for collapsed view
  const firstLine = log.message.split('\n')[0];
  const hasMore = log.message.includes('\n') || log.message.length > 120;

  return (
    <div
      style={{
        borderBottom: `1px solid ${neutralColors.divider}`,
        background: isError ? 'rgba(246, 72, 82, 0.04)' : 'transparent',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
          padding: '4px 16px',
          cursor: hasMore ? 'pointer' : 'default',
          fontSize: 10,
        }}
        onClick={() => hasMore && setExpanded(!expanded)}
      >
        {/* Level indicator */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: isError ? actionColors.red : '#d48806',
            width: 8,
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {isError ? '●' : '▲'}
        </span>

        {/* Message preview */}
        <span
          style={{
            flex: 1,
            fontFamily: "'SF Mono', Menlo, monospace",
            fontSize: 10,
            lineHeight: '16px',
            color: neutralColors.mainText,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: expanded ? 'pre-wrap' : 'nowrap',
            wordBreak: expanded ? 'break-word' : undefined,
          }}
        >
          {expanded ? log.message : firstLine.length > 120 ? firstLine.slice(0, 120) + '…' : firstLine}
        </span>

        {/* Timestamp */}
        <span
          style={{
            fontSize: 9,
            color: neutralColors.disable,
            fontFamily: "'SF Mono', monospace",
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {timeStr}
        </span>
      </div>

      {/* Copy button when expanded */}
      {expanded && (
        <div style={{ padding: '0 16px 6px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(log.message, 'log message');
            }}
            style={{
              background: 'none',
              border: `1px solid ${neutralColors.border}`,
              color: neutralColors.disable,
              borderRadius: 3,
              fontSize: 9,
              cursor: 'pointer',
              padding: '1px 6px',
              lineHeight: '14px',
            }}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: State (Zustand store inspector)
// ---------------------------------------------------------------------------

const STORES = [
  { name: 'Permissions', hook: usePermissionsStore },
  { name: 'Code Console', hook: useCodeConsoleStore },
  { name: 'Rubric', hook: useRubricStore },
  { name: 'Rubric Comments', hook: useRubricCommentStore },
] as const;

const StateTab: React.FC = () => {
  const [openStore, setOpenStore] = useState<string | null>(null);
  const [stateSnapshots, setStateSnapshots] = useState<Record<string, unknown>>({});
  const [stateKeys, setStateKeys] = useState<Record<string, string[]>>({});

  // Refresh state on open
  const refreshStore = (name: string, getState: () => unknown) => {
    const state = getState();
    setStateSnapshots((p) => ({ ...p, [name]: state }));
    if (state && typeof state === 'object') {
      const keys = Object.keys(state as Record<string, unknown>).sort((a, b) => {
        // Functions last, then alphabetical
        const aIsFn = typeof (state as Record<string, unknown>)[a] === 'function';
        const bIsFn = typeof (state as Record<string, unknown>)[b] === 'function';
        if (aIsFn !== bIsFn) return aIsFn ? 1 : -1;
        return a.localeCompare(b);
      });
      setStateKeys((p) => ({ ...p, [name]: keys }));
    }
  };

  const toggleStore = (name: string, getState: () => unknown) => {
    if (openStore === name) {
      setOpenStore(null);
    } else {
      refreshStore(name, getState);
      setOpenStore(name);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      <div style={{ padding: '6px 16px 4px', fontSize: 10, color: neutralColors.disable }}>
        Click a store to inspect its current state. Functions are listed but collapsed.
      </div>
      {STORES.map(({ name, hook }) => {
        const isOpen = openStore === name;
        const snapshot = stateSnapshots[name] as Record<string, unknown> | undefined;
        const keys = stateKeys[name];

        return (
          <div key={name} style={{ borderBottom: `1px solid ${neutralColors.divider}` }}>
            {/* Store header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
              onClick={() => toggleStore(name, hook.getState as () => unknown)}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: neutralColors.title }}>
                {isOpen ? '▾' : '▸'} {name}
              </span>
              {isOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshStore(name, hook.getState as () => unknown);
                  }}
                  style={{
                    background: 'none',
                    border: `1px solid ${neutralColors.border}`,
                    color: neutralColors.secondaryText,
                    borderRadius: 4,
                    fontSize: 9,
                    cursor: 'pointer',
                    padding: '1px 6px',
                  }}
                >
                  ↻ Refresh
                </button>
              )}
            </div>

            {/* Store state */}
            <AnimatePresence>
              {isOpen && snapshot && keys && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      margin: '0 16px 8px',
                      background: neutralColors.background,
                      border: `1px solid ${neutralColors.divider}`,
                      borderRadius: 4,
                      maxHeight: 350,
                      overflowY: 'auto',
                      overflowX: 'auto',
                    }}
                  >
                    {keys.map((key) => {
                      const val = snapshot[key];
                      const isFn = typeof val === 'function';
                      if (isFn) {
                        return (
                          <div
                            key={key}
                            style={{
                              padding: '2px 10px',
                              fontFamily: "'SF Mono', Menlo, monospace",
                              fontSize: 10,
                              lineHeight: '18px',
                              color: neutralColors.disable,
                            }}
                          >
                            <span style={{ color: JSON_COLORS.key }}>{key}</span>
                            <span>: ƒ()</span>
                          </div>
                        );
                      }
                      return <JsonNode key={key} data={val} depth={0} label={key} />;
                    })}
                  </div>
                  {/* Copy full state */}
                  <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        const serializable: Record<string, unknown> = {};
                        for (const k of keys) {
                          if (typeof snapshot[k] !== 'function') {
                            serializable[k] = snapshot[k];
                          }
                        }
                        copyToClipboard(JSON.stringify(serializable, null, 2), `${name} state`);
                      }}
                      style={{
                        background: 'none',
                        border: `1px solid ${neutralColors.border}`,
                        color: neutralColors.disable,
                        borderRadius: 3,
                        fontSize: 9,
                        cursor: 'pointer',
                        padding: '1px 6px',
                        lineHeight: '14px',
                      }}
                    >
                      Copy JSON
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Environment (with quick-copy and token info)
// ---------------------------------------------------------------------------

const ENV_VARS = [
  'REACT_APP_API_URL',
  'REACT_APP_VERSION',
  'REACT_APP_GA_ID',
  'REACT_APP_OPTIMIZE_ID',
  'NODE_ENV',
] as const;

const EnvironmentTab: React.FC = () => {
  const [now] = useState(() => new Date().toISOString());
  const tokenPayload = getDecodedTokenPayload();

  const entries: [string, string][] = [
    ...ENV_VARS.map((k): [string, string] => [k, (process.env[k] as string) ?? '(not set)']),
  ];
  const runtime: [string, string][] = [
    ['Location', window.location.href],
    ['Origin', window.location.origin],
    ['Screen', `${window.screen.width}×${window.screen.height}`],
    ['Viewport', `${window.innerWidth}×${window.innerHeight}`],
    ['Pixel Ratio', String(window.devicePixelRatio)],
    ['Timestamp', now],
  ];

  const renderGroup = (label: string, items: [string, string][], delay: number) => (
    <motion.div
      key={label}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay }}
    >
      <GroupHeader>{label}</GroupHeader>
      {items.map(([k, v]) => (
        <div key={k} style={{ padding: '4px 16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 10, color: neutralColors.secondaryText, fontWeight: 600 }}>{k}</span>
          <span
            style={{
              fontSize: 11,
              color: neutralColors.mainText,
              wordBreak: 'break-all',
              fontFamily: "'SF Mono', monospace",
            }}
          >
            {v}
          </span>
        </div>
      ))}
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      {/* Quick copy buttons */}
      <GroupHeader>Quick Copy</GroupHeader>
      <div style={{ padding: '2px 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <QuickCopyChip label="API URL" value={process.env.REACT_APP_API_URL ?? ''} />
        <QuickCopyChip label="JWT Token" value={getAuthToken()} />
        <QuickCopyChip label="Course ID" value={getCourseIdFromPath()} />
        <QuickCopyChip label="Current URL" value={window.location.href} />
      </div>

      {/* Token info */}
      {tokenPayload && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.02 }}
        >
          <GroupHeader>JWT Token</GroupHeader>
          {Object.entries(tokenPayload).map(([k, v]) => {
            const isExpiry = k === 'exp' || k === 'iat';
            const display = isExpiry && typeof v === 'number' ? new Date(v * 1000).toLocaleString() : String(v);
            return (
              <div key={k} style={{ padding: '2px 16px', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 10, color: neutralColors.secondaryText, fontFamily: "'SF Mono', monospace" }}>
                  {k}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: neutralColors.mainText,
                    fontFamily: "'SF Mono', monospace",
                    textAlign: 'right',
                    wordBreak: 'break-all',
                    maxWidth: '60%',
                  }}
                >
                  {display}
                </span>
              </div>
            );
          })}
        </motion.div>
      )}

      {renderGroup('Environment', entries, 0.04)}
      {renderGroup('Runtime', runtime, 0.06)}
    </motion.div>
  );
};

function getCourseIdFromPath(): string {
  // Try to extract course ID from the current URL path
  const match = window.location.pathname.match(/\/course\/(\d+)/);
  return match ? match[1] : '(none)';
}

const QuickCopyChip: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const hasValue = value && value !== '(none)';
  return (
    <button
      onClick={() => hasValue && copyToClipboard(value, label)}
      disabled={!hasValue}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        background: hasValue ? greenPalette.green1 : neutralColors.background,
        border: `1px solid ${hasValue ? greenPalette.green3 : neutralColors.border}`,
        borderRadius: 12,
        cursor: hasValue ? 'pointer' : 'default',
        fontSize: 10,
        fontWeight: 500,
        color: hasValue ? brandColors.primary : neutralColors.disable,
        transition: 'background 100ms',
        opacity: hasValue ? 1 : 0.6,
      }}
    >
      <span style={{ fontSize: 11 }}>📋</span>
      {label}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const TABS: { key: TabKey; label: string; shortLabel: string; icon: string }[] = [
  { key: 'network', label: 'Network', shortLabel: 'Net', icon: '📡' },
  { key: 'console', label: 'Console', shortLabel: 'Log', icon: '📋' },
  { key: 'state', label: 'State', shortLabel: 'State', icon: '🔍' },
  { key: 'capabilities', label: 'Capabilities', shortLabel: 'Caps', icon: '🔑' },
  { key: 'roles', label: 'Switch Role', shortLabel: 'Roles', icon: '👤' },
  { key: 'course', label: 'Course', shortLabel: 'Course', icon: '📚' },
  { key: 'environment', label: 'Environment', shortLabel: 'Env', icon: '⚙️' },
];

const PANEL_WIDTH = 380;
const MENU_LEAVE_DELAY = 250;

const DevPanel: React.FC<Props> = ({ replaceUser }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('network');
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overrideCount = usePermissionsStore((s) => Object.keys(s.overrides).length);
  const networkErrors = useDevRequestLog(
    (s) => s.entries.filter((e) => e.status !== null && (e.status >= 400 || e.status === 0)).length,
  );

  // Track console error count for badge
  const [consoleErrorCount, setConsoleErrorCount] = useState(
    () => recentConsoleLogs.filter((l) => l.level === 'error').length,
  );
  useEffect(() => {
    const iv = setInterval(() => {
      setConsoleErrorCount(recentConsoleLogs.filter((l) => l.level === 'error').length);
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  // Start intercepting API requests on mount
  useEffect(() => {
    useDevRequestLog.getState().startIntercepting();
  }, []);

  const onClose = useCallback(() => setOpen(false), []);

  const clearLeaveTimer = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  const startLeaveTimer = () => {
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => setMenuVisible(false), MENU_LEAVE_DELAY);
  };

  const handleTabOpen = (tab: TabKey) => {
    setActiveTab(tab);
    setOpen(true);
    setMenuVisible(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (open) onClose();
        setMenuVisible(false);
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setOpen((v) => !v);
        setMenuVisible(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    return () => clearLeaveTimer();
  }, []);

  const handleLoginAs = async (role: string) => {
    if (loading) return;
    setLoading(true);
    const key = 'dev_login';
    message.loading({ content: `Switching to ${role}…`, key });
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/dev-auth/login-as/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        replaceUser(data, true, role === 'staff');
        message.success({ content: `Logged in as ${role}`, key });
      } else {
        const err = await res.json();
        message.error({ content: `Error: ${err.error}`, key });
      }
    } catch (e) {
      message.error({ content: `Network Error: ${e}`, key });
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (emailOrId: string) => {
    if (loading) return;
    setLoading(true);
    const key = 'dev_impersonate';
    message.loading({ content: `Impersonating ${emailOrId}…`, key });
    try {
      const token = getAuthToken();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/impersonate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user: emailOrId }),
      });
      if (res.ok) {
        const data = await res.json();
        replaceUser(data, true, false);
        message.success({ content: `Impersonating ${emailOrId}`, key });
      } else {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        message.error({ content: `Error: ${err.error || err.detail || res.status}`, key });
      }
    } catch (e) {
      message.error({ content: `Network Error: ${e}`, key });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Pull tab + hover menu */}
      <div
        style={{
          position: 'fixed',
          right: open ? PANEL_WIDTH : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 11002,
          display: 'flex',
          alignItems: 'center',
          transition: 'right 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={() => {
          clearLeaveTimer();
          if (!open) setMenuVisible(true);
        }}
        onMouseLeave={startLeaveTimer}
      >
        {/* Flyout menu */}
        <AnimatePresence>
          {menuVisible && !open && (
            <motion.div
              initial={{ opacity: 0, x: 6, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              style={{
                marginRight: 2,
                background: '#fff',
                border: `1px solid ${neutralColors.border}`,
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                padding: '4px 0',
                minWidth: 160,
              }}
            >
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTabOpen(t.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: neutralColors.mainText,
                    textAlign: 'left',
                    transition: 'background 80ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = greenPalette.green1;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{t.icon}</span>
                  <span style={{ fontWeight: 500 }}>{t.label}</span>
                  {t.key === 'network' && networkErrors > 0 && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 9,
                        fontWeight: 700,
                        background: actionColors.red,
                        color: '#fff',
                        borderRadius: 8,
                        padding: '0 5px',
                        lineHeight: '16px',
                      }}
                    >
                      {networkErrors}
                    </span>
                  )}
                  {t.key === 'console' && consoleErrorCount > 0 && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 9,
                        fontWeight: 700,
                        background: actionColors.red,
                        color: '#fff',
                        borderRadius: 8,
                        padding: '0 5px',
                        lineHeight: '16px',
                      }}
                    >
                      {consoleErrorCount}
                    </span>
                  )}
                </button>
              ))}
              <div
                style={{
                  padding: '6px 14px 4px',
                  borderTop: `1px solid ${neutralColors.divider}`,
                  marginTop: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 3,
                }}
              >
                <Kbd>Ctrl</Kbd>
                <span style={{ color: neutralColors.disable, fontSize: 10 }}>+</span>
                <Kbd>Shift</Kbd>
                <span style={{ color: neutralColors.disable, fontSize: 10 }}>+</span>
                <Kbd>D</Kbd>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab handle */}
        <button
          onClick={() => {
            if (open) {
              onClose();
            } else {
              setMenuVisible(false);
              setOpen(true);
            }
          }}
          aria-label="Toggle dev panel"
          style={{
            width: 24,
            height: 64,
            border: `1px solid ${neutralColors.border}`,
            borderRight: 'none',
            borderRadius: '6px 0 0 6px',
            background: menuVisible && !open ? greenPalette.green1 : '#fff',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            boxShadow: '-2px 0 8px rgba(0,0,0,0.06)',
            padding: 0,
            transition: 'background 120ms',
            position: 'relative',
          }}
        >
          <span
            style={{
              writingMode: 'vertical-lr',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: brandColors.primary,
              transform: 'rotate(180deg)',
            }}
          >
            DEV
          </span>
          {(overrideCount > 0 || networkErrors > 0 || consoleErrorCount > 0) && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: networkErrors > 0 || consoleErrorCount > 0 ? actionColors.red : actionColors.yellow,
                boxShadow: `0 0 4px ${networkErrors > 0 || consoleErrorCount > 0 ? 'rgba(246, 72, 82, 0.4)' : 'rgba(255, 191, 0, 0.4)'}`,
                animation: 'devPulse 2s ease-in-out infinite',
              }}
            />
          )}
        </button>
      </div>

      {/* Panel */}
      <motion.div
        initial={false}
        animate={{ x: open ? 0 : PANEL_WIDTH }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: PANEL_WIDTH,
          maxWidth: '90vw',
          zIndex: 11001,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderLeft: `1px solid ${neutralColors.border}`,
          boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
          fontSize: 12,
          color: neutralColors.title,
        }}
        role="complementary"
        aria-label="Developer panel"
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: `1px solid ${neutralColors.divider}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: brandColors.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={brandColors.primary} strokeWidth="2.5">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
            Dev Panel
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {overrideCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#d48806',
                  background: '#fffbe6',
                  border: '1px solid #ffe58f',
                  borderRadius: 10,
                  padding: '1px 8px',
                  lineHeight: '16px',
                }}
              >
                {overrideCount} override{overrideCount > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: `1px solid ${neutralColors.border}`,
                color: neutralColors.secondaryText,
                borderRadius: 4,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
              }}
              aria-label="Close dev panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${neutralColors.divider}`,
            flexShrink: 0,
            padding: '0 4px',
          }}
          role="tablist"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              style={{
                padding: '8px 8px',
                fontSize: 11,
                fontWeight: activeTab === t.key ? 600 : 400,
                color: activeTab === t.key ? brandColors.primary : neutralColors.secondaryText,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === t.key ? `2px solid ${brandColors.primary}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 120ms',
                letterSpacing: '0.02em',
                position: 'relative',
              }}
              onClick={() => setActiveTab(t.key)}
              role="tab"
              aria-selected={activeTab === t.key}
            >
              {t.shortLabel}
              {/* Error badge on network tab */}
              {t.key === 'network' && networkErrors > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 0,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: actionColors.red,
                  }}
                />
              )}
              {t.key === 'console' && consoleErrorCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 0,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: actionColors.red,
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'course' && <CourseTab key="course" />}
            {activeTab === 'capabilities' && <CapabilitiesTab key="caps" />}
            {activeTab === 'roles' && (
              <RolesTab key="roles" onSwitch={handleLoginAs} onImpersonate={handleImpersonate} loading={loading} />
            )}
            {activeTab === 'network' && <NetworkTab key="network" />}
            {activeTab === 'console' && <ConsoleTab key="console" />}
            {activeTab === 'state' && <StateTab key="state" />}
            {activeTab === 'environment' && <EnvironmentTab key="env" />}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '6px 16px',
            borderTop: `1px solid ${neutralColors.divider}`,
            fontSize: 10,
            color: neutralColors.disable,
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          Dev only · <Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>D</Kbd> to toggle
        </div>
      </motion.div>

      <style>{`
        @keyframes devPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
};

export default DevPanel;
