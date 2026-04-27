// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { LayoutConfig, SidebarPanelDefinition } from './SidebarRegistry';
import { submissionInfoDef, testsDef, filesDef, rubricDef, templatesDef, aiSummaryDef } from './panels/index';

/**
 * Build all panel definitions for the given layout config.
 * Each panel is a self-contained component that reads from
 * the Zustand store + ConsoleActionsContext directly.
 */
function buildPanelDefs(config: LayoutConfig): SidebarPanelDefinition[] {
  return [
    submissionInfoDef(config),
    testsDef(config),
    filesDef(config),
    rubricDef(config),
    templatesDef(config),
    aiSummaryDef(config),
  ];
}

/**
 * Returns the visible, sorted panels for the given layout config.
 */
export function getVisiblePanels(config: LayoutConfig) {
  return buildPanelDefs(config)
    .filter((p) => p.visible(config))
    .sort((a, b) => a.order - b.order);
}
