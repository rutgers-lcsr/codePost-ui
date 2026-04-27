// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { RobotOutlined } from '@ant-design/icons';
import { useConsoleActions } from '../../ConsoleActionsContext';
import type { LayoutConfig, SidebarPanelDefinition } from '../SidebarRegistry';
import SubmissionSummaryPanel, { SubmissionSummaryTooltip } from '../../menu/SubmissionSummaryPanel';

function AiSummaryPanel({ config }: { config: LayoutConfig }) {
  const { ai, session } = useConsoleActions();

  return (
    <SubmissionSummaryPanel
      key="ai-summary"
      title="AI Summary"
      summary={session.submissionSummary}
      onGenerateSummary={config.canTriggerAi ? ai.handleGenerateSummary : undefined}
      isGenerating={session.isGeneratingSummary}
      isAdmin={config.isAdmin}
      promptVariantId={session.summaryMeta.promptVariantId}
      experimentId={session.summaryMeta.experimentId}
      isCustomContext={session.summaryMeta.isCustomContext}
    />
  );
}

export function aiSummaryDef(config: LayoutConfig): SidebarPanelDefinition {
  return {
    key: 'ai-summary',
    order: 60,
    icon: RobotOutlined,
    title: 'AI Summary',
    tooltip: <AiSummaryPanelTooltip />,
    visible: (cfg) =>
      cfg.aiEnabled &&
      cfg.aiFeatureStatus.submission_summary !== false &&
      cfg.showAiAssistance &&
      !cfg.isFilesOnly,
    defaultWidth: 500,
    render: () => <AiSummaryPanel config={config} />,
  };
}

function AiSummaryPanelTooltip() {
  const { session } = useConsoleActions();
  return <SubmissionSummaryTooltip key="ai-summary-tooltip" hasSummary={!!session.submissionSummary} />;
}
