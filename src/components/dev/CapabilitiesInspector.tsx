// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useState } from 'react';
import { usePermissionsStore, CAPABILITY_DESCRIPTIONS } from '../../stores/usePermissionsStore';
import type { Capabilities, CacheEntry } from '../../stores/usePermissionsStore';
import { actionColors } from '../../theme/colors';

interface Props {
  open: boolean;
  onClose: () => void;
}

// Capability scope grouping for display
const SCOPE_LABELS: Record<string, string> = {
  platform: '🌐 Platform',
  course: '📚 Course',
  assignment: '📝 Assignment',
  submission: '📄 Submission',
};

const COURSE_CAPS = [
  'view_course',
  'edit_course_settings',
  'manage_roster',
  'view_roster',
  'manage_sections',
  'view_analytics',
  'configure_ai',
  'view_ai_usage',
  'create_assignment',
  'claim_submissions',
  'edit_rubric',
  'manage_regrades',
  'view_audit_log',
  'change_invite_code',
  'manage_course_api_keys',
] as const;

const ASSIGNMENT_CAPS = [
  'edit_assignment',
  'copy_assignment',
  'view_assignment',
  'edit_rubric',
  'view_rubric',
  'release_grades',
  'manage_extensions',
  'view_queue',
  'manage_test_cases',
  'view_assignment_statistics',
  'upload_submission',
  'generate_ai_test_cases',
  'manage_datasets',
  'download_assignment_files',
  'manage_global_templates',
] as const;

const SUBMISSION_CAPS = [
  'view_submission',
  'view_feedback',
  'grade_submission',
  'comment_on_submission',
  'finalize_submission',
  'unfinalize_submission',
  'view_student_identity',
  'request_regrade',
  'manage_regrades',
  'run_autograder',
  'run_code',
  'generate_ai_comments',
  'manage_partners',
  'notify_students_feedback',
  'view_ai_assistance',
  'trigger_ai_assistance',
  'manage_global_templates',
  'view_submission_history',
  'provide_comment_feedback',
] as const;

const PLATFORM_CAPS = ['create_course', 'manage_organization', 'impersonate_user', 'access_admin_dashboard'] as const;

function CapRow({ name, value }: { name: string; value: boolean | undefined }) {
  const description = CAPABILITY_DESCRIPTIONS[name as keyof typeof CAPABILITY_DESCRIPTIONS];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '1px 0',
        fontSize: 11,
        fontFamily: 'monospace',
        cursor: description ? 'help' : undefined,
      }}
      title={description}
    >
      <span style={{ color: value ? actionColors.green : actionColors.red, fontWeight: 700, width: 14 }}>
        {value ? '✓' : '✗'}
      </span>
      <span style={{ color: value ? '#e6e6e6' : '#777' }}>{name}</span>
    </div>
  );
}

function CacheSection({
  cacheKey,
  entry,
  onRefresh,
}: {
  cacheKey: string;
  entry: CacheEntry;
  onRefresh: (key: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const caps = entry.caps;
  const ageMs = Date.now() - entry.fetchedAt;
  const ageSec = Math.floor(ageMs / 1000);
  const ageStr = ageSec < 60 ? `${ageSec}s ago` : `${Math.floor(ageSec / 60)}m ago`;
  const isStale = ageMs >= 5 * 60 * 1000;

  // Determine scope and ordered cap list
  const scope = cacheKey.split(':')[0];
  const scopeLabel = SCOPE_LABELS[scope] ?? `🔑 ${scope}`;

  let orderedCaps: readonly string[];
  if (scope === 'submission') {
    // Submissions include all scopes
    orderedCaps = [...COURSE_CAPS, ...ASSIGNMENT_CAPS, ...SUBMISSION_CAPS];
  } else if (scope === 'assignment') {
    orderedCaps = [...COURSE_CAPS, ...ASSIGNMENT_CAPS];
  } else if (scope === 'platform') {
    orderedCaps = PLATFORM_CAPS;
  } else {
    orderedCaps = COURSE_CAPS;
  }

  // Filter to only caps present in the response
  if (!caps || typeof caps !== 'object') return null;
  const capEntries = orderedCaps
    .filter((c) => c in caps)
    .map((c) => [c, caps[c as keyof Capabilities]] as [string, boolean | undefined]);

  // Count granted
  const granted = capEntries.filter(([, v]) => v).length;

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '4px 0',
          borderBottom: '1px solid #333',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
          {collapsed ? '▸' : '▾'} {scopeLabel}{' '}
          {cacheKey.includes(':') && <span style={{ color: '#888', fontWeight: 400 }}>#{cacheKey.split(':')[1]}</span>}
        </span>
        <span style={{ fontSize: 10, color: '#888' }}>
          {granted}/{capEntries.length}
          <span style={{ marginLeft: 6, color: isStale ? '#fa8c16' : '#555' }} title={`Fetched ${ageStr}`}>
            {isStale ? '⚠' : '·'} {ageStr}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh(cacheKey);
            }}
            style={{
              marginLeft: 6,
              background: 'none',
              border: '1px solid #555',
              color: '#aaa',
              borderRadius: 3,
              fontSize: 10,
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ↻
          </button>
        </span>
      </div>
      {!collapsed && (
        <div style={{ paddingLeft: 4, paddingTop: 2 }}>
          {capEntries.map(([name, value]) => (
            <CapRow key={name} name={name} value={value} />
          ))}
        </div>
      )}
    </div>
  );
}

const CapabilitiesInspector: React.FC<Props> = ({ open, onClose }) => {
  const cache = usePermissionsStore((s) => s.cache);
  const fetchCourse = usePermissionsStore((s) => s.fetchCourseCapabilities);
  const fetchAssignment = usePermissionsStore((s) => s.fetchAssignmentCapabilities);
  const fetchPlatform = usePermissionsStore((s) => s.fetchPlatformCapabilities);
  const invalidate = usePermissionsStore((s) => s.invalidate);
  const [fetchId, setFetchId] = useState('');

  if (!open) return null;

  const cacheKeys = Object.keys(cache).sort();

  const handleRefresh = (key: string) => {
    invalidate(key);
    const [scope, id] = key.split(':');
    if (scope === 'platform') {
      fetchPlatform();
      return;
    }
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;
    if (scope === 'course') fetchCourse(numId);
    else if (scope === 'assignment') fetchAssignment(numId);
    // Submission caps are set from checkPermission, can't re-fetch standalone
  };

  const handleRefreshAll = () => {
    cacheKeys.forEach(handleRefresh);
  };

  const handleFetchById = () => {
    const trimmed = fetchId.trim();
    if (!trimmed) return;
    // Support "assignment:123" or "course:123" or just "123" (defaults to course)
    const match = trimmed.match(/^(course|assignment):(\d+)$/i);
    if (match) {
      const scope = match[1].toLowerCase();
      const num = parseInt(match[2], 10);
      if (scope === 'assignment') fetchAssignment(num);
      else fetchCourse(num);
    } else {
      const num = parseInt(trimmed, 10);
      if (isNaN(num)) return;
      fetchCourse(num);
    }
    setFetchId('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        right: 80,
        width: 280,
        maxHeight: 'calc(100vh - 130px)',
        backgroundColor: '#1a1a1a',
        color: '#e6e6e6',
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        fontSize: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #333',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13 }}>🔐 Capabilities</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleRefreshAll}
            title="Refresh all"
            style={{
              background: 'none',
              border: '1px solid #555',
              color: '#aaa',
              borderRadius: 3,
              fontSize: 11,
              cursor: 'pointer',
              padding: '1px 6px',
            }}
          >
            ↻ All
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: 16,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Fetch by course ID */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #333', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            type="text"
            placeholder="ID or assignment:ID"
            value={fetchId}
            onChange={(e) => setFetchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchById()}
            style={{
              flex: 1,
              background: '#2a2a2a',
              border: '1px solid #444',
              color: '#e6e6e6',
              borderRadius: 3,
              padding: '2px 6px',
              fontSize: 11,
              outline: 'none',
            }}
          />
          <button
            onClick={handleFetchById}
            style={{
              background: '#333',
              border: '1px solid #555',
              color: '#ccc',
              borderRadius: 3,
              fontSize: 11,
              cursor: 'pointer',
              padding: '2px 8px',
            }}
          >
            Fetch
          </button>
        </div>
      </div>

      {/* Capabilities list */}
      <div style={{ padding: '8px 12px', overflowY: 'auto', flex: 1 }}>
        {cacheKeys.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
            No capabilities cached yet.
            <br />
            Navigate to a course or open a submission.
          </div>
        ) : (
          cacheKeys
            .filter((key) => cache[key] && typeof cache[key] === 'object')
            .map((key) => <CacheSection key={key} cacheKey={key} entry={cache[key]} onRefresh={handleRefresh} />)
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '4px 12px',
          borderTop: '1px solid #333',
          fontSize: 10,
          color: '#555',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        Dev only · permissions store
      </div>
    </div>
  );
};

export default CapabilitiesInspector;
