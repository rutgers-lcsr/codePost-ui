// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type * as React from 'react';

/**
 * Configuration derived from permission level + capabilities.
 * Sidebar panels use this to decide visibility without knowing
 * about the raw permission enum or capability keys.
 */
export interface LayoutConfig {
  /** User cannot create/edit comments (finalized or no capability) */
  isReadOnly: boolean;
  /** User is viewing as a student (READ permission or simulating) */
  isStudentView: boolean;
  /** Files-only mode — no comments, rubric, or grades */
  isFilesOnly: boolean;
  /** Demo/onboarding mode */
  isDemoMode: boolean;
  /** Can write (grader/admin) */
  canWrite: boolean;
  /** Is course admin */
  isAdmin: boolean;
  /** Is super grader */
  isSuperGrader: boolean;
  /** Can view test results */
  showTests: boolean;
  /** Can view rubric panel */
  showRubric: boolean;
  /** Can comment on submission (templates visible) */
  showTemplates: boolean;
  /** AI features are enabled for this course */
  aiEnabled: boolean;
  /** Per-feature AI status flags */
  aiFeatureStatus: Record<string, boolean>;
  /** Can view AI assistance panels */
  showAiAssistance: boolean;
  /** Can trigger AI actions (summaries, suggestions) */
  canTriggerAi: boolean;
  /** Can view feedback / grades */
  showFeedback: boolean;
  /** Can download files */
  showDownload: boolean;
  /** Has test categories or admin */
  hasTestCategories: boolean;
}

/**
 * A self-contained sidebar panel definition.
 *
 * Each panel knows its own key, title, tooltip, render function, and
 * visibility predicate. To add a new panel, create a definition and
 * register it — no changes to CodeConsole.tsx required.
 */
export interface SidebarPanelDefinition {
  /** Stable key used by StandardConsoleLayout and activeSiderKey (e.g. 'file-menu') */
  key: string;
  /** Display order (lower = higher in the sidebar) */
  order: number;
  /** Icon component rendered in the sidebar icon rail */
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  /** Title shown in the sidebar header */
  title: React.ReactNode | string;
  /** Tooltip shown on the icon button */
  tooltip: React.ReactNode | string;
  /** Render the panel content. Receives the layout config for conditional props. */
  render: () => React.ReactElement;
  /** Return true if this panel should be visible given the current config. */
  visible: (config: LayoutConfig) => boolean;
  /** Optional: default width override for this panel */
  defaultWidth?: number;
}
