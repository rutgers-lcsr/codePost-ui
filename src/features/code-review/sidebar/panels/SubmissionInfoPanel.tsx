// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { InfoCircleOutlined } from '@ant-design/icons';
import { useCodeConsoleStore } from '../../../../stores/useCodeConsoleStore';
import type { LayoutConfig, SidebarPanelDefinition } from '../SidebarRegistry';
import { SubmissionInfo, SubmissionInfoTooltip } from '../../menu/SubmissionInfoMenu';
import type { SubmissionInfoMode } from '../../menu/SubmissionInfoMenu';

function SubmissionInfoPanel({ config }: { config: LayoutConfig }) {
  const mode: SubmissionInfoMode =
    config.canWrite && !config.isFilesOnly ? 'write' : config.isFilesOnly ? 'filesOnly' : 'readOnly';
  return <SubmissionInfo mode={mode} />;
}

export function submissionInfoDef(config: LayoutConfig): SidebarPanelDefinition {
  return {
    key: 'submission-info',
    order: 10,
    icon: InfoCircleOutlined,
    title: 'Submission Info',
    tooltip: <SubmissionInfoPanelTooltip />,
    visible: () => !!useCodeConsoleStore.getState().assignment,
    render: () => <SubmissionInfoPanel config={config} />,
  };
}

function SubmissionInfoPanelTooltip() {
  const submission = useCodeConsoleStore((s) => s.submission);
  const readOnlySubmission = useCodeConsoleStore((s) => s.readOnlySubmission);
  const assignment = useCodeConsoleStore((s) => s.assignment);
  return (
    <SubmissionInfoTooltip
      key="submission-info-tooltip"
      submission={submission ?? readOnlySubmission}
      assignment={assignment}
    />
  );
}
