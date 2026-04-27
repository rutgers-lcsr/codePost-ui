// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { PushpinOutlined } from '@ant-design/icons';
import { useCodeConsoleStore } from '../../../../stores/useCodeConsoleStore';
import { useConsoleActions } from '../../ConsoleActionsContext';
import { FileWithId } from '../../../../utils/file';
import { getDemoPinnedTemplates } from '../../demo';
import type { LayoutConfig, SidebarPanelDefinition } from '../SidebarRegistry';
import TemplateMenu, { PinnedCommentsTooltip } from '../../menu/TemplateMenu';

function TemplatesPanel({ config }: { config: LayoutConfig }) {
  const assignment = useCodeConsoleStore((s) => s.assignment);
  const selectedFile = useCodeConsoleStore((s) => s.selectedFile) as FileWithId | undefined;
  const { template, session } = useConsoleActions();

  return (
    <TemplateMenu
      key="template-menu"
      assignmentId={assignment!.id}
      onApplyTemplate={template.handleApplyTemplate}
      currentUserEmail={session.userEmail}
      refreshTrigger={session.templateRefresh}
      currentFilePath={selectedFile?.name}
      isSuperGrader={config.isSuperGrader}
      demoTemplates={config.isDemoMode ? getDemoPinnedTemplates(session.userEmail) : undefined}
    />
  );
}

export function templatesDef(config: LayoutConfig): SidebarPanelDefinition {
  return {
    key: 'template-menu',
    order: 50,
    icon: PushpinOutlined,
    title: 'Pinned Comments',
    tooltip: <PinnedCommentsTooltip key="pinned-comments-tooltip" />,
    visible: (cfg) => cfg.showTemplates && !cfg.isFilesOnly && !cfg.isStudentView,
    render: () => <TemplatesPanel config={config} />,
  };
}
