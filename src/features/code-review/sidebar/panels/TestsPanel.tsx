// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { ExperimentOutlined } from '@ant-design/icons';
import { useCodeConsoleStore } from '../../../../stores/useCodeConsoleStore';
import type { TestCaseType } from '../../../../types/models';
import type { LayoutConfig, SidebarPanelDefinition } from '../SidebarRegistry';
import TestsMenu, { TestsMenuTooltip } from '../../menu/TestsMenu';

/**
 * Connected wrapper for TestsMenu to isolate high-frequency updates.
 */
const ConnectedTestsMenu = React.memo((props: React.ComponentProps<typeof TestsMenu>) => {
  const temporaryFileContent = useCodeConsoleStore((s) => s.temporaryFileContent);
  const isEditMode = useCodeConsoleStore((s) => s.isEditMode);
  return <TestsMenu {...props} fileOverrides={isEditMode ? temporaryFileContent : undefined} />;
});

function TestsPanel({ config }: { config: LayoutConfig }) {
  const submission = useCodeConsoleStore((s) => s.submission);
  const readOnlySubmission = useCodeConsoleStore((s) => s.readOnlySubmission);
  const testCases = useCodeConsoleStore((s) => s.testCases);
  const testCategories = useCodeConsoleStore((s) => s.testCategories);
  const tests = useCodeConsoleStore((s) => s.tests);
  const rubricCategories = useCodeConsoleStore((s) => s.rubricCategories);

  return (
    <ConnectedTestsMenu
      key="tests-menu"
      submissionId={(submission ?? readOnlySubmission)!.id}
      tests={Object.values(testCases).flat() as TestCaseType[]}
      rubricCategories={rubricCategories}
      testCategories={testCategories}
      demoMode={config.isDemoMode}
      initialResults={tests}
    />
  );
}

export function testsDef(_config: LayoutConfig): SidebarPanelDefinition {
  return {
    key: 'tests-menu',
    order: 20,
    icon: ExperimentOutlined,
    title: 'Tests',
    tooltip: <TestsPanelTooltip />,
    visible: (cfg) => cfg.showTests && !cfg.isFilesOnly,
    defaultWidth: 500,
    render: () => <TestsPanel config={_config} />,
  };
}

function TestsPanelTooltip() {
  const testCases = useCodeConsoleStore((s) => s.testCases);
  return (
    <TestsMenuTooltip
      key="tests-info-tooltip"
      title="Tests"
      testCount={Object.values(testCases).flat().length}
    />
  );
}
